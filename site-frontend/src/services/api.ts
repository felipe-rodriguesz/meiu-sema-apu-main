import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1',
  withCredentials: true,
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/login')) {
    window.dispatchEvent(new Event('sema:session-expired'));
  }
  return Promise.reject(error);
});
export default api;
