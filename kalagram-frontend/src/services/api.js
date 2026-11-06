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
  if (url.startsWith('/images/')) return `${import.meta.env.BASE_URL}${url.slice(1)}`;
  return url.startsWith('/uploads/') ? `${API_ORIGIN}${url}` : url;
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error?.response) return 'We could not reach the server. Please check your connection and try again.';
  return fallback;
}

export const fieldErrors = (error) => error?.response?.data?.fieldErrors || {};

/** True on the static GitHub Pages preview, which has no backend: nothing can be saved there. */
export const IS_PREVIEW = import.meta.env.VITE_STATIC_PREVIEW === 'true';

let previewData;
const preview = () => {
  previewData ||= fetch(`${import.meta.env.BASE_URL}preview-data.json`).then((response) => {
    if (!response.ok) throw new Error('Preview content could not be loaded');
    return response.json();
  });
  return previewData;
};

function previewItem(items, slug) {
  const item = items[slug];
  if (!item) throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Not found' } } });
  return item;
}

const previewApi = {
  workshops: () => preview().then((d) => d.workshops),
  workshop: (slug) => preview().then((d) => previewItem(d.workshopDetails, slug)),
  gallery: () => preview().then((d) => d.gallery),
  resources: () => preview().then((d) => d.resources),
  resource: (slug) => preview().then((d) => previewItem(d.resourceDetails, slug)),
  resourceCategories: () => preview().then((d) => d.resourceCategories),
  settings: () => preview().then((d) => d.settings),
  enquire: async () => ({ id: 0 }),
  // Builds what the WhatsApp message needs. Nothing is stored and no seat is held.
  register: async (body) => {
    const { workshops } = await preview();
    const workshop = workshops.find((w) => w.id === body.workshopId);
    const batch = workshop?.upcomingBatches.find((b) => b.id === body.batchId);
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
      ...body,
      registrationId: `PREVIEW-${code}`,
      status: 'PREVIEW',
      workshopTitle: workshop?.title,
      startDate: batch?.startDate,
      endDate: batch?.endDate,
      batchLabel: batch?.label,
    };
  },
};

const liveApi = {
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

export const publicApi = IS_PREVIEW ? previewApi : liveApi;
