const DEBUG_STORAGE_KEY = 'khora:debug';

function isDebugEnabled(): boolean {
  if (!import.meta.env.DEV) return false;

  try {
    const queryEnabled = typeof globalThis.location !== 'undefined'
      && new URLSearchParams(globalThis.location.search).has('debug');
    const storageEnabled = typeof globalThis.localStorage !== 'undefined'
      && globalThis.localStorage.getItem(DEBUG_STORAGE_KEY) === 'true';
    return queryEnabled || storageEnabled;
  } catch {
    return false;
  }
}

/**
 * Opt-in development diagnostics. Enable with `?debug` or by setting
 * localStorage `khora:debug` to `true`.
 */
export function debugLog(...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.log(...args);
  }
}
