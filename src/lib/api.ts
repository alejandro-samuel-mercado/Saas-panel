import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/saas';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('saas_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('saas_token');
      localStorage.removeItem('saas_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const saasLogin = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Tenants
export const getTenants = (params?: { status?: string; search?: string }) =>
  api.get('/tenants', { params });
export const getTenant = (id: string) => api.get(`/tenants/${id}`);
export const createTenant = (data: any) => api.post('/tenants', data);
export const updateTenant = (id: string, data: any) => api.put(`/tenants/${id}`, data);
export const pauseTenant = (id: string, reason?: string) =>
  api.post(`/tenants/${id}/pause`, { reason });
export const resumeTenant = (id: string) => api.post(`/tenants/${id}/resume`);
export const deleteTenant = (id: string) => api.delete(`/tenants/${id}`);

// Plans
export const getPlans = () => api.get('/plans');
export const createPlan = (data: any) => api.post('/plans', data);
export const updatePlan = (id: number, data: any) => api.put(`/plans/${id}`, data);
export const deletePlan = (id: number) => api.delete(`/plans/${id}`);

// Payments
export const getPayments = (params?: { tenantId?: string; limit?: number }) =>
  api.get('/payments', { params });
export const registerPayment = (data: any) => api.post('/payments', data);

// Rubros
export const getRubros = () => api.get('/rubros');
export const updateTenantRubro = (tenantId: string, rubroId: number | null) =>
  api.patch(`/tenants/${tenantId}/rubro`, { rubroId });

// Customers
export const getCustomers = () => api.get('/customers');
export const getCustomerByEmail = (email: string) => api.get(`/customers/${email}`);

export default api;
