import axios from 'axios';

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');

const TOKEN_KEY = 'kalagram.admin.token';

/** Public API client. */
export const api = axios.create({ baseURL: `${API_ORIGIN}/api`, timeout: 20000 });

/** Admin API client: attaches the JWT, and reports expiry so the panel can return to login. */
export const adminApi = axios.create({ baseURL: `${API_ORIGIN}/api/admin`, timeout: 60000 });

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

adminApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

function storage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
export const getToken = () => storage()?.getItem(TOKEN_KEY) || null;
export const setToken = (token) => (token ? storage()?.setItem(TOKEN_KEY, token) : storage()?.removeItem(TOKEN_KEY));

/** Uploaded files are served by the API; bundled images are served with the site. */
export function assetUrl(url) {
  if (!url) return '';
  return url.startsWith('/uploads/') ? `${API_ORIGIN}${url}` : url;
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error?.response) return 'We could not reach the server. Please check your connection and try again.';
  return fallback;
}

export const fieldErrors = (error) => error?.response?.data?.fieldErrors || {};

export const publicApi = {
  workshops: () => api.get('/workshops').then((r) => r.data),
  workshop: (slug) => api.get(`/workshops/${encodeURIComponent(slug)}`).then((r) => r.data),
  register: (body) => api.post('/registrations', body).then((r) => r.data),
  enquire: (body) => api.post('/enquiries', body).then((r) => r.data),
  gallery: () => api.get('/gallery').then((r) => r.data),
  resources: () => api.get('/resources').then((r) => r.data),
  resource: (slug) => api.get(`/resources/${encodeURIComponent(slug)}`).then((r) => r.data),
  resourceCategories: () => api.get('/resource-categories').then((r) => r.data),
  settings: () => api.get('/settings').then((r) => r.data),
};
