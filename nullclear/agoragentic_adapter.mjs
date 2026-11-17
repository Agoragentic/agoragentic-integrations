const DEFAULT_BASE_URL = 'https://agoragentic.com';
const DEFAULT_NULLCLEAR_URL = 'https://api.nullclear.dev';

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
  const response = await fetch(`${process.env.AGORAGENTIC_BASE_URL || DEFAULT_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AgoragenticAdapterError({
      code: payload?.error?.code || payload?.code || 'router_request_failed',
      message: payload?.error?.message || payload?.message || `Router request failed with HTTP ${response.status}.`,
      status: response.status,
      retryable: response.status === 429 || response.status >= 500,
      details: payload,
    });
  }
  return payload;
}

/** Preview eligible providers before any routed execution. */
export async function agoragentic_match(task) {
  if (!task || typeof task !== 'string') {
    throw new AgoragenticAdapterError({
      code: 'invalid_task',
      message: 'task must be a non-empty string.',
      status: 400,
    });
  }
  return request(`/api/execute/match?task=${encodeURIComponent(task)}`);
}

/** Route work through the marketplace and return the execution result plus receipt reference. */
export async function agoragentic_execute(task, input, { maxCost } = {}) {
  if (!task || typeof task !== 'string') {
    throw new AgoragenticAdapterError({
      code: 'invalid_task',
      message: 'task must be a non-empty string.',
      status: 400,
    });
  }
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
 * Zero-key pre-flight token security & proxy verification via NullClear (100 free calls/day/IP).
 */
export async function nullclear_preflight_token({
  chain = 'base',
  address,
  nullclearUrl = DEFAULT_NULLCLEAR_URL,
} = {}) {
  if (!address || typeof address !== 'string') {
    throw new AgoragenticAdapterError({
      code: 'invalid_address',
      message: 'address is required for NullClear token pre-flight checks.',
      status: 400,
    });
  }
  const url = `${nullclearUrl}/v1/scan/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AgoragenticAdapterError({
      code: response.status === 402 ? 'nullclear_x402_required' : 'nullclear_preflight_failed',
      message: payload?.error || `NullClear pre-flight check failed with HTTP ${response.status}.`,
      status: response.status,
      retryable: response.status >= 500,
      details: payload,
    });
  }
  return payload;
}

/**
 * Zero-key calldata decoder & approval drainer detection via NullClear.
 */
export async function nullclear_decode_calldata({
  chain = 'base',
  calldata,
  to,
  nullclearUrl = DEFAULT_NULLCLEAR_URL,
} = {}) {
  if (!calldata || typeof calldata !== 'string') {
    throw new AgoragenticAdapterError({
      code: 'invalid_calldata',
      message: 'calldata is required for NullClear decode checks.',
      status: 400,
    });
  }
  const response = await fetch(`${nullclearUrl}/v1/decode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ chain, calldata, ...(to ? { to } : {}) }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AgoragenticAdapterError({
      code: response.status === 402 ? 'nullclear_x402_required' : 'nullclear_decode_failed',
      message: payload?.error || `NullClear decode check failed with HTTP ${response.status}.`,
      status: response.status,
      retryable: response.status >= 500,
      details: payload,
    });
  }
  return payload;
}

/**
 * Run a fail-closed NullClear contract safety check before executing a routed task.
 */
export async function nullclear_guarded_execute(
  task,
  input,
  { chain = 'base', targetAddress, maxCost, nullclearUrl = DEFAULT_NULLCLEAR_URL } = {},
) {
  let safetyReport = null;
  if (targetAddress) {
    safetyReport = await nullclear_preflight_token({ chain, address: targetAddress, nullclearUrl });
    if (ABORT_ACTIONS.has(safetyReport?.recommendedAgentAction)) {
      throw new AgoragenticAdapterError({
        code: 'nullclear_preflight_aborted',
        message: `Blocked routed execution: ${safetyReport.recommendedAgentAction} (${safetyReport.verdict || 'TRAP'}).`,
        status: 403,
        details: safetyReport,
      });
    }
  }
  const execution = await agoragentic_execute(task, input, { maxCost });
  return { preflight: safetyReport, execution };
}
