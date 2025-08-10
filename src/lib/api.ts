export const API_BASE = (typeof window !== 'undefined' && (window as any).__API_BASE__) || 'http://localhost:4000';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('master_admin_token');
  const headers = new Headers(options.headers || {});
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}
