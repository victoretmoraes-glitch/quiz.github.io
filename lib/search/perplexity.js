// Server-only helper around the Perplexity Search API (POST /search).
// Returns ranked raw web results (title, url, snippet, date, last_updated);
// no LLM answer is generated. The API key is read from PERPLEXITY_API_KEY.
import Perplexity, {
  APIError,
  AuthenticationError,
  BadRequestError,
  RateLimitError,
} from '@perplexity-ai/perplexity_ai'
import { z } from 'zod'

let client

function getClient() {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new SearchError('Web search is not configured', 503)
  }
  if (!client) {
    // The SDK reads PERPLEXITY_API_KEY itself and retries 429/5xx honoring Retry-After.
    client = new Perplexity({ maxRetries: 2, timeout: 30_000 })
  }
  return client
}

export class SearchError extends Error {
  constructor(message, status = 500, retryAfter) {
    super(message)
    this.name = 'SearchError'
    this.status = status
    this.retryAfter = retryAfter
  }
}

const queryString = z.string().trim().min(1).max(1000)

export const searchParamsSchema = z.object({
  // A single query, or up to five queries processed independently.
  query: z.union([queryString, z.array(queryString).min(1).max(5)]),
  max_results: z.number().int().min(1).max(20).optional(),
  search_context_size: z.enum(['low', 'medium', 'high']).optional(),
  country: z.string().regex(/^[A-Za-z]{2}$/, 'ISO 3166-1 alpha-2 code').optional(),
  search_domain_filter: z.array(z.string().min(1)).max(20).optional(),
  search_language_filter: z.array(z.string().min(2)).optional(),
  search_recency_filter: z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
  search_after_date_filter: z.string().optional(),
  search_before_date_filter: z.string().optional(),
})

// Multi-query requests may return one result list per query; flatten them and
// keep the first (highest-ranked) occurrence of each URL.
export function dedupeResults(results) {
  const seen = new Set()
  const out = []
  for (const r of (results || []).flat()) {
    if (!r?.url || seen.has(r.url)) continue
    seen.add(r.url)
    out.push({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      date: r.date ?? null,
      last_updated: r.last_updated ?? null,
    })
  }
  return out
}

/**
 * Run a Perplexity web search.
 * @param {z.input<typeof searchParamsSchema>} params
 * @returns {Promise<{ id: string, results: Array<{title: string, url: string, snippet: string, date: string|null, last_updated: string|null}> }>}
 */
export async function webSearch(params) {
  const parsed = searchParamsSchema.safeParse(params)
  if (!parsed.success) {
    throw new SearchError(parsed.error.issues.map((i) => i.message).join('; '), 400)
  }
  const body = { ...parsed.data }
  if (body.country) body.country = body.country.toUpperCase()

  try {
    const res = await getClient().search.create(body)
    return { id: res.id, results: dedupeResults(res.results) }
  } catch (error) {
    if (error instanceof SearchError) throw error
    if (error instanceof RateLimitError) {
      throw new SearchError('Search rate limit reached', 429, error.headers?.get('retry-after') || undefined)
    }
    if (error instanceof AuthenticationError) {
      // Key invalid/revoked: a server configuration problem, not the caller's fault.
      throw new SearchError('Web search is not configured', 503)
    }
    if (error instanceof BadRequestError) {
      throw new SearchError('Invalid search request', 400)
    }
    if (error instanceof APIError) {
      throw new SearchError('Search provider error', 502)
    }
    throw error
  }
}
