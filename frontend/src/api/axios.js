import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Send cookies (refresh token)
});

// ── Per-tab token store (sessionStorage for tab isolation) ──
let _accessToken = sessionStorage.getItem('accessToken');

export const setAccessToken   = (token) => { 
  _accessToken = token; 
  if (token) sessionStorage.setItem('accessToken', token);
  else sessionStorage.removeItem('accessToken');
};
export const clearAccessToken = ()       => { 
  _accessToken = null; 
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('sessionActive');
};
export const getAccessToken   = ()       => _accessToken;

// Request interceptor — attach in-memory access token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken') || _accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle token expiry + auto-refresh
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry for the refresh-token endpoint itself to avoid infinite loops
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token');
    const isAuthEndpoint    = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        const newToken = data.accessToken;
        setAccessToken(newToken); // save in sessionStorage + memory

        // Retry queued requests
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        clearAccessToken();
        window.location.href = '/';  // redirect to home on session expiry
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
