import axios from 'axios';

// Dynamically select backend URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Base Axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Module-level token holder for sync access in request interceptor
let inMemoryAccessToken = null;
let onTokenRefreshCallback = null;
let onAuthFailedCallback = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

export const registerAuthCallbacks = ({ onTokenRefresh, onAuthFailed }) => {
  onTokenRefreshCallback = onTokenRefresh;
  onAuthFailedCallback = onAuthFailed;
};

// Request Interceptor: Attach Access Token to every outgoing API request
api.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables for managing silent token refresh queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// Response Interceptor: Handle 401 Unauthorized responses & trigger token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) or 403 (Forbidden due to expired token)
    // Avoid infinite loop if the refresh endpoint itself returns 401/403
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/login') &&
      !originalRequest.url.includes('/signup') &&
      !originalRequest.url.includes('/refresh')
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // If refresh is already in progress, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        isRefreshing = false;
        if (onAuthFailedCallback) onAuthFailedCallback();
        return Promise.reject(error);
      }

      try {
        console.log('[Axios Interceptor] 🔄 Access Token expired or invalid. Requesting new token via /api/refresh...');

        // Execute refresh token request using full base URL to prevent relative routing bugs
        const response = await axios.post(`${API_BASE_URL}/api/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken: newAccessToken } = response.data;

        // Update in-memory access token
        setAccessToken(newAccessToken);

        // Notify AuthContext state update if registered
        if (onTokenRefreshCallback) {
          onTokenRefreshCallback(newAccessToken);
        }

        // Update Authorization header for original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Resolve queued requests with new token
        processQueue(null, newAccessToken);

        console.log('[Axios Interceptor] ✅ Token refresh successful. Seamlessly retrying original failed request.');

        // Retry initial failed request seamlessly
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[Axios Interceptor] ❌ Refresh Token expired or invalid. User must log in again.');
        processQueue(refreshError, null);

        // Clear invalid tokens
        localStorage.removeItem('refreshToken');
        setAccessToken(null);

        if (onAuthFailedCallback) {
          onAuthFailedCallback();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;