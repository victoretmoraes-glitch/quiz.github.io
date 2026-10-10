import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { webSearch, SearchError } from '@/lib/search/perplexity'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Web search - POST /api/search (Perplexity Search API; no database needed)
    if (route === '/search' && method === 'POST') {
      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return handleCORS(NextResponse.json({ error: 'JSON body is required' }, { status: 400 }))
      }
      try {
        return handleCORS(NextResponse.json(await webSearch(body)))
      } catch (error) {
        if (!(error instanceof SearchError)) throw error
        const response = NextResponse.json({ error: error.message }, { status: error.status })
        if (error.retryAfter) response.headers.set('Retry-After', error.retryAfter)
        return handleCORS(response)
      }
    }

    const db = await connectToMongo()

    // Root endpoint - GET /api/root (since /api/ is not accessible with catch-all)
    if (route === '/root' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }))
    }
    // Root endpoint - GET /api/root (since /api/ is not accessible with catch-all)
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }))
    }

    // Status endpoints - POST /api/status
    if (route === '/status' && method === 'POST') {
      const body = await request.json()
      
      if (!body.client_name) {
        return handleCORS(NextResponse.json(
          { error: "client_name is required" }, 
          { status: 400 }
        ))
      }

      const statusObj = {
        id: uuidv4(),
        client_name: body.client_name,
        timestamp: new Date()
      }

      await db.collection('status_checks').insertOne(statusObj)
      return handleCORS(NextResponse.json(statusObj))
    }

    // Status endpoints - GET /api/status
    if (route === '/status' && method === 'GET') {
      const statusChecks = await db.collection('status_checks')
        .find({})
        .limit(1000)
        .toArray()

      // Remove MongoDB's _id field from response
      const cleanedStatusChecks = statusChecks.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedStatusChecks))
    }

    // ---------------------------------------------------------------- //
    //                       QUIZ CONFIG ENDPOINTS                      //
    // ---------------------------------------------------------------- //

    // GET /api/quiz-config -> returns the active (default) quiz config
    if (route === '/quiz-config' && method === 'GET') {
      // First try singleton (legacy), then fallback to first quiz in list
      let doc = await db.collection('quiz_configs').findOne({ id: 'active' })
      if (!doc) {
        doc = await db.collection('quizzes').findOne({}, { sort: { createdAt: 1 } })
      }
      if (!doc) return handleCORS(NextResponse.json({ config: null }))
      return handleCORS(NextResponse.json({ config: doc.config }))
    }

    // PUT /api/quiz-config -> upsert the active quiz config (legacy)
    if (route === '/quiz-config' && method === 'PUT') {
      const body = await request.json()
      if (!body?.config || typeof body.config !== 'object') {
        return handleCORS(NextResponse.json({ error: 'config is required' }, { status: 400 }))
      }
      await db.collection('quiz_configs').updateOne(
        { id: 'active' },
        { $set: { id: 'active', config: body.config, updatedAt: new Date() } },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // GET /api/quizzes -> list all quizzes (id, name, updatedAt)
    if (route === '/quizzes' && method === 'GET') {
      const docs = await db.collection('quizzes')
        .find({}, { projection: { _id: 0, id: 1, name: 1, updatedAt: 1, createdAt: 1 } })
        .sort({ createdAt: 1 })
        .toArray()
      return handleCORS(NextResponse.json({ quizzes: docs }))
    }

    // POST /api/quizzes -> create a new quiz
    if (route === '/quizzes' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const id = body?.id || uuidv4()
      const config = body?.config || {
        meta: { id, name: body?.name || 'Novo quiz', locale: 'pt-BR', version: '1.0.0' },
        theme: { primaryColor: '#7C3AED', secondaryColor: '#F59E0B', backgroundColor: '#0B1020', textColor: '#F8FAFC' },
        tracking: { captureParams: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src'], persist: true },
        variables: [],
        startStepId: '',
        steps: [],
      }
      const now = new Date()
      await db.collection('quizzes').insertOne({
        id,
        name: body?.name || config?.meta?.name || 'Novo quiz',
        config,
        createdAt: now,
        updatedAt: now,
      })
      return handleCORS(NextResponse.json({ id, config }))
    }

    // GET /api/quizzes/:id -> get one
    if (route.startsWith('/quizzes/') && method === 'GET') {
      const id = route.split('/')[2]
      const doc = await db.collection('quizzes').findOne({ id })
      if (!doc) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      return handleCORS(NextResponse.json({ id: doc.id, name: doc.name, config: doc.config }))
    }

    // PUT /api/quizzes/:id -> upsert
    if (route.startsWith('/quizzes/') && method === 'PUT') {
      const id = route.split('/')[2]
      const body = await request.json()
      if (!body?.config) {
        return handleCORS(NextResponse.json({ error: 'config required' }, { status: 400 }))
      }
      await db.collection('quizzes').updateOne(
        { id },
        {
          $set: {
            id,
            name: body.name || body.config?.meta?.name || 'Quiz',
            config: body.config,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ ok: true, id }))
    }

    // DELETE /api/quizzes/:id
    if (route.startsWith('/quizzes/') && method === 'DELETE') {
      const id = route.split('/')[2]
      await db.collection('quizzes').deleteOne({ id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute