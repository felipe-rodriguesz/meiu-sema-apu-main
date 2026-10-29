import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1'
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token_sema');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && localStorage.getItem('token_sema')) {
    localStorage.removeItem('token_sema');
    localStorage.removeItem('usuario_sema');
    window.dispatchEvent(new Event('sema:session-expired'));
  }
  return Promise.reject(error);
});
export default api;
