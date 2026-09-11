export const BASE_URL = import.meta.env.VITE_API_URL || 'https://canvas-98qs.onrender.com/api';

export function getToken() {
  return localStorage.getItem('mg_auth_token') || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('mg_auth_token', token);
  } else {
    localStorage.removeItem('mg_auth_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    console.warn('Session expired or unauthorized');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = (data && (data.error || data.message)) || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' })
};

export default api;
