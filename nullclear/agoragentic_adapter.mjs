const DEFAULT_BASE_URL = 'https://agoragentic.com';
const DEFAULT_NULLCLEAR_URL = 'https://api.nullclear.dev';
const REQUEST_TIMEOUT_MS = 10_000;

const ABORT_ACTIONS = new Set([
  'ABORT_CRITICAL_TRAP',
  'ABORT_DRAINER_APPROVAL',
  'ABORT_WILL_REVERT',
]);

export class AgoragenticAdapterError extends Error {
  constructor({ code, message, status, retryable = false, details = null }) {
    super(message);
    this.name = 'AgoragenticAdapterError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.details = details;
  }
}

function requireText(value, field, code) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AgoragenticAdapterError({
      code,
      message: `${field} must be a non-empty string.`,
      status: 400,
    });
  }
  return value.trim();
}

function validateMaxCost(maxCost, { required = false } = {}) {
  if (maxCost === undefined && !required) return;
  if (typeof maxCost !== 'number' || !Number.isFinite(maxCost) || maxCost < 0) {
    throw new AgoragenticAdapterError({
      code: 'invalid_max_cost',
      message: 'maxCost must be an explicit finite non-negative number; use 0 for free listings only.',
      status: 400,
    });
  }
}

async function fetchWithTimeout(url, options, operation) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw new AgoragenticAdapterError({
      code: `${operation}_${timedOut ? 'timeout' : 'transport_failed'}`,
      message: timedOut ? 'Request exceeded the client timeout.' : 'Request failed before a response was received.',
      status: timedOut ? 408 : 503,
      retryable: true,
    });
  }
}

function retryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function getApiKey() {
  const apiKey = process.env.AGORAGENTIC_API_KEY;
  if (!apiKey) {
    throw new AgoragenticAdapterError({
      code: 'missing_api_key',
      message: 'AGORAGENTIC_API_KEY is required for authenticated router calls.',
      status: 401,
    });
  }
  return apiKey;
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetchWithTimeout(`${process.env.AGORAGENTIC_BASE_URL || DEFAULT_BASE_URL}${path}`, {
    method,
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }, 'router');

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AgoragenticAdapterError({
      code: payload?.error?.code || payload?.code || 'router_request_failed',
      message: payload?.error?.message || payload?.message || `Router request failed with HTTP ${response.status}.`,
      status: response.status,
      retryable: retryableStatus(response.status),
      details: payload,
    });
  }
  return payload;
}

/** Preview eligible providers before any routed execution. */
export async function agoragentic_match(task) {
  task = requireText(task, 'task', 'invalid_task');
  return request(`/api/execute/match?task=${encodeURIComponent(task)}`);
}

/** Route work through the marketplace and return the execution result plus receipt reference. */
export async function agoragentic_execute(task, input, { maxCost } = {}) {
  task = requireText(task, 'task', 'invalid_task');
  validateMaxCost(maxCost);
  return request('/api/execute', {
    method: 'POST',
    body: {
      task,
      input,
      ...(maxCost === undefined ? {} : { constraints: { max_cost: maxCost } }),
    },
  });
}

/**
 * Request an advisory token scan; HTTP 402 is returned to the caller without payment.
 */
export async function nullclear_preflight_token({
  chain = 'base',
  address,
  nullclearUrl = DEFAULT_NULLCLEAR_URL,
} = {}) {
  chain = requireText(chain, 'chain', 'invalid_chain');
  address = requireText(address, 'address', 'invalid_address');
  const url = `${nullclearUrl}/v1/scan/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`;
  const response = await fetchWithTimeout(url, { redirect: 'error', headers: { Accept: 'application/json' } }, 'nullclear_preflight');
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AgoragenticAdapterError({
      code: response.status === 402 ? 'nullclear_x402_required' : 'nullclear_preflight_failed',
      message: payload?.error || `NullClear pre-flight check failed with HTTP ${response.status}.`,
      status: response.status,
      retryable: retryableStatus(response.status),
      details: payload,
    });
  }
  return payload;
}

/**
 * Request advisory calldata analysis separately; guarded execution does not call this helper.
 */
export async function nullclear_decode_calldata({
  chain = 'base',
  calldata,
  to,
  nullclearUrl = DEFAULT_NULLCLEAR_URL,
} = {}) {
  chain = requireText(chain, 'chain', 'invalid_chain');
  calldata = requireText(calldata, 'calldata', 'invalid_calldata');
  if (to !== undefined) to = requireText(to, 'to', 'invalid_address');
  const response = await fetchWithTimeout(`${nullclearUrl}/v1/decode`, {
    method: 'POST',
    redirect: 'error',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ chain, calldata, ...(to ? { to } : {}) }),
  }, 'nullclear_decode');
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AgoragenticAdapterError({
      code: response.status === 402 ? 'nullclear_x402_required' : 'nullclear_decode_failed',
      message: payload?.error || `NullClear decode check failed with HTTP ${response.status}.`,
      status: response.status,
      retryable: retryableStatus(response.status),
      details: payload,
    });
  }
  return payload;
}

/**
 * Require an affirmative advisory token scan and explicit budget before routing a task.
 */
export async function nullclear_guarded_execute(
  task,
  input,
  { chain = 'base', targetAddress, maxCost, nullclearUrl = DEFAULT_NULLCLEAR_URL } = {},
) {
  task = requireText(task, 'task', 'invalid_task');
  chain = requireText(chain, 'chain', 'invalid_chain');
  targetAddress = requireText(targetAddress, 'targetAddress', 'invalid_address');
  validateMaxCost(maxCost, { required: true });
  const safetyReport = await nullclear_preflight_token({ chain, address: targetAddress, nullclearUrl });
  if (ABORT_ACTIONS.has(safetyReport?.recommendedAgentAction)) {
    throw new AgoragenticAdapterError({
      code: 'nullclear_preflight_aborted',
      message: `Blocked routed execution: ${safetyReport.recommendedAgentAction} (${safetyReport.verdict || 'TRAP'}).`,
      status: 403,
      details: safetyReport,
    });
  }
  if (!safetyReport || typeof safetyReport !== 'object' || Array.isArray(safetyReport)
    || safetyReport.recommendedAgentAction !== 'EXECUTE_SAFE'
    || safetyReport.verdict !== 'VERIFIED CLEAR'
    || safetyReport.success === false || safetyReport.error) {
    throw new AgoragenticAdapterError({
      code: 'nullclear_preflight_unverified',
      message: 'Blocked routed execution: an affirmative EXECUTE_SAFE / VERIFIED CLEAR token scan is required.',
      status: 403,
      details: safetyReport,
    });
  }
  const execution = await agoragentic_execute(task, input, { maxCost });
  return { preflight: safetyReport, execution };
}
