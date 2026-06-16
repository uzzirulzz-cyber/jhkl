import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// ─── Request: attach token ──────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('nexus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, err => Promise.reject(err));

// ─── Response: handle errors globally ──────────────────────────────────────
api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('nexus_token');
      window.location.href = '/login';
    } else if (err.response?.status !== 404) {
      toast.error(msg);
    }
    return Promise.reject(err.response?.data || err);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  me:             ()     => api.get('/auth/me'),
  setup:          (data) => api.post('/auth/setup', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  register:       (data) => api.post('/auth/register', data)
};

// ─── Products ────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll:      (params) => api.get('/products', { params }),
  getOne:      (id)     => api.get(`/products/${id}`),
  create:      (data)   => api.post('/products', data),
  update:      (id,data)=> api.put(`/products/${id}`, data),
  delete:      (id)     => api.delete(`/products/${id}`),
  duplicate:   (id)     => api.post(`/products/${id}/duplicate`),
  bulk:        (data)   => api.post('/products/bulk/action', data),
  adjustStock: (id,data)=> api.post(`/products/${id}/inventory`, data),
  exportCSV:   ()       => api.get('/products/export/csv', { responseType: 'blob' })
};

// ─── Homepage ────────────────────────────────────────────────────────────────
export const homepageAPI = {
  get:              ()         => api.get('/homepage'),
  getPublished:     ()         => api.get('/homepage/published'),
  updateSettings:   (data)     => api.put('/homepage/settings', data),
  reorderSections:  (data)     => api.put('/homepage/sections/reorder', data),
  addSection:       (data)     => api.post('/homepage/sections', data),
  updateSection:    (id,data)  => api.put(`/homepage/sections/${id}`, data),
  deleteSection:    (id)       => api.delete(`/homepage/sections/${id}`),
  duplicateSection: (id)       => api.post(`/homepage/sections/${id}/duplicate`),
  toggleSection:    (id)       => api.patch(`/homepage/sections/${id}/toggle`),
  publish:          ()         => api.post('/homepage/publish'),
  saveDraft:        (data)     => api.post('/homepage/draft', data),
  addSlide:         (sid,data) => api.post(`/homepage/sections/${sid}/slides`, data),
  updateSlide:      (sid,i,d)  => api.put(`/homepage/sections/${sid}/slides/${i}`, d),
  deleteSlide:      (sid,i)    => api.delete(`/homepage/sections/${sid}/slides/${i}`)
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll:       (params)   => api.get('/orders', { params }),
  getOne:       (id)       => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  update:       (id, data) => api.put(`/orders/${id}`, data)
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll:  (params) => api.get('/categories', { params }),
  create:  (data)   => api.post('/categories', data),
  update:  (id,data)=> api.put(`/categories/${id}`, data),
  delete:  (id)     => api.delete(`/categories/${id}`)
};

// ─── Customers ───────────────────────────────────────────────────────────────
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id)     => api.get(`/customers/${id}`)
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsAPI = {
  overview:     ()        => api.get('/analytics/overview'),
  revenueChart: (params)  => api.get('/analytics/revenue-chart', { params }),
  topProducts:  ()        => api.get('/analytics/top-products')
};

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryAPI = {
  alerts:  ()   => api.get('/inventory/alerts'),
  history: (id) => api.get(`/inventory/history/${id}`)
};

// ─── Media ───────────────────────────────────────────────────────────────────
export const mediaAPI = {
  upload:         (formData)      => api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadMultiple: (formData)      => api.post('/media/upload-multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:         (publicId)      => api.delete(`/media/${publicId}`),
  library:        (params)        => api.get('/media/library', { params })
};

// ─── Settings ────────────────────────────────────────────────────────────────
export const settingsAPI = {
  get:    ()     => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export default api;
