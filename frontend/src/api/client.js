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

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkErr) {
    if (networkErr.name === 'AbortError') {
      throw new Error('Request timed out. The server is taking longer than expected to respond.');
    }
    throw new Error('Unable to connect to server. The server may be waking up or your network connection was interrupted. Please retry in a few seconds.');
  }

  if (response.status === 401) {
    console.warn('Session expired or unauthorized');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('Uploaded photo or data is too large. Please select a smaller photo or remove extra attachments.');
    }
    if (response.status === 401) {
      throw new Error((data && (data.error || data.message)) || 'Your session has expired. Please log in again.');
    }
    if (response.status === 403) {
      throw new Error((data && (data.error || data.message)) || 'Access denied: You do not have permission for this action.');
    }
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error('The server is currently starting up or temporarily unavailable. Please retry in a few moments.');
    }

    let errorMsg = '';
    if (data) {
      if (data.details && data.error === 'Internal server error') {
        errorMsg = data.details;
      } else {
        errorMsg = data.error || data.message || data.details || '';
      }
    }

    if (!errorMsg) {
      errorMsg = `Server returned error (${response.status}). Please try again.`;
    }

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
