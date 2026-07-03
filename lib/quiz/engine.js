/**
 * Interpolation + Rules engine for the Dynamic Quiz Generator.
 * Pure functions — no React deps.
 */

/* --------------------------- Interpolation --------------------------- */

/**
 * Resolves "{{path.to.value}}" against a scope object.
 * Supports nested keys like "tracking.utm_source".
 */
export function resolvePath(scope, path) {
  if (!path) return undefined;
  return path
    .split(".")
    .reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), scope);
}

/**
 * Interpolates a string with {{variable}} placeholders.
 * scope: { ...variables, tracking: {...} }
 */
export function interpolate(input, scope) {
  if (typeof input !== "string") return input;
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const v = resolvePath(scope, path);
    return v === undefined || v === null ? "" : String(v);
  });
}

/* --------------------------- Comparisons ----------------------------- */

export function evaluateCondition(cond, scope) {
  const left = resolvePath(scope, cond.variableKey);
  const right = cond.value;
  switch (cond.operator) {
    case "eq":
      return left === right;
    case "neq":
      return left !== right;
    case "gt":
      return Number(left) > Number(right);
    case "gte":
      return Number(left) >= Number(right);
    case "lt":
      return Number(left) < Number(right);
    case "lte":
      return Number(left) <= Number(right);
    case "in":
      return Array.isArray(right) && right.includes(left);
    case "notIn":
      return Array.isArray(right) && !right.includes(left);
    case "between":
      return (
        Array.isArray(right) &&
        Number(left) >= Number(right[0]) &&
        Number(left) < Number(right[1])
      );
    case "contains":
      if (Array.isArray(left)) return left.includes(right);
      return typeof left === "string" && left.includes(String(right));
    case "isEmpty":
      return left === undefined || left === null || left === "" || (Array.isArray(left) && left.length === 0);
    case "isNotEmpty":
      return !(left === undefined || left === null || left === "" || (Array.isArray(left) && left.length === 0));
    default:
      return false;
  }
}

export function evaluateTransitions(step, scope) {
  if (!step.transitions?.length) return null;
  for (const rule of step.transitions) {
    const ok = (rule.when || []).every((c) => evaluateCondition(c, scope));
    if (ok) return rule;
  }
  return null;
}

/* --------------------------- Logic Actions --------------------------- */

export function runActions(actions, ctx) {
  if (!actions?.length) return;
  const { getVars, setVars, track } = ctx;

  for (const action of actions) {
    const vars = getVars();
    const scope = { ...vars, tracking: ctx.getTracking?.() || {} };

    switch (action.type) {
      case "setVariable": {
        const value =
          typeof action.value === "string" ? interpolate(action.value, scope) : action.value;
        setVars({ [action.variableKey]: value });
        break;
      }
      case "computeBMI": {
        const w = Number(vars[action.weightKey]);
        const hCm = Number(vars[action.heightKey]);
        if (!w || !hCm) break;
        const h = hCm / 100;
        const imc = w / (h * h);
        const decimals = action.decimals ?? 1;
        setVars({ [action.outputKey]: Number(imc.toFixed(decimals)) });
        break;
      }
      case "computeFormula": {
        try {
          const expr = interpolate(action.expression, scope);
          // safe eval: only allow numbers/operators/parens/dots
          if (!/^[-+*/().\d\s]+$/.test(expr)) break;
          // eslint-disable-next-line no-new-func
          const val = Function(`"use strict"; return (${expr});`)();
          const decimals = action.decimals ?? 2;
          setVars({ [action.outputKey]: Number(Number(val).toFixed(decimals)) });
        } catch (e) {
          console.warn("computeFormula failed", e);
        }
        break;
      }
      case "categorize": {
        const val = Number(vars[action.inputKey]);
        if (Number.isNaN(val)) break;
        const range = (action.ranges || []).find((r) => {
          const minOk = r.min === undefined || val >= r.min;
          const maxOk = r.max === undefined || val < r.max;
          return minOk && maxOk;
        });
        if (range) {
          const patch = { [action.outputKey]: range.label };
          if (action.outputMessageKey && range.message) {
            patch[action.outputMessageKey] = interpolate(range.message, {
              ...getVars(),
              [action.outputKey]: range.label,
              tracking: ctx.getTracking?.() || {},
            });
          }
          setVars(patch);
        }
        break;
      }
      case "trackEvent": {
        track?.(action.eventName, action.payload, action.targets);
        break;
      }
      default:
        break;
    }
  }
}

/* --------------------------- URL builder ----------------------------- */

export function buildRedirectUrl(step, scope) {
  const url = new URL(step.baseUrl);
  Object.entries(step.appendParams || {}).forEach(([k, v]) => {
    const resolved = typeof v === "string" ? interpolate(v, scope) : v;
    if (resolved !== "" && resolved !== undefined && resolved !== null) {
      url.searchParams.set(k, String(resolved));
    }
  });
  return url.toString();
}
