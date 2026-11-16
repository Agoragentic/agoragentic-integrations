// Optional SDK runtime boundary. No SDK import or provider authority is granted.
// This function is also serialized into the isolated SDK process; keep it
// self-contained so the child checks its own runtime before reading config.
export function assertE2BNodeRuntime() {
  const version = process.versions.node;
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  const major = match ? Number(match[1]) : -1;
  const minor = match ? Number(match[2]) : -1;
  if (major > 22 || (major === 22 && minor >= 19)) return;
  const error = new Error('E2B SDK 2.63.0 requires Node >=22.19.0; core Node 20 support does not authorize SDK use');
  error.code = 'E2B_NODE_RUNTIME_UNSUPPORTED';
  error.production_qualified = false;
  error.retryable = false;
  throw error;
}
