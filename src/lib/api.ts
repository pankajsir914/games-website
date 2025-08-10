export function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:4000';
  const stored = localStorage.getItem('api_base');
  if (stored) return stored;
  const injected = (window as any).__API_BASE__;
  if (injected) return injected;
  return 'http://localhost:4000';
}

export function setApiBase(url: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('api_base', url);
    (window as any).__API_BASE__ = url;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('master_admin_token') : null;
  const headers = new Headers(options.headers || {});
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (typeof window !== 'undefined') {
    const csrf = localStorage.getItem('csrf_token');
    if (csrf) headers.set('x-csrf-token', csrf);
  }
  const base = getApiBase();
  try {
    // Prevent mixed-content requests from HTTPS pages to HTTP backends
    if (typeof window !== 'undefined') {
      const pageProtocol = window.location.protocol;
      const baseProtocol = (() => { try { return new URL(base).protocol; } catch { return 'http:'; } })();
      if (pageProtocol === 'https:' && baseProtocol !== 'https:') {
        throw new Error('Insecure backend URL: use HTTPS to avoid mixed-content blocking.');
      }
    }
    const res = await fetch(`${base}${path}`, { ...options, headers });
    return res;
  } catch (e) {
    throw new Error((e as Error).message || 'Network error: unable to reach backend. Set a valid API URL in Backend Settings.');
  }
}

