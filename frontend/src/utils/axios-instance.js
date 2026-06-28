import axios from 'axios';
import { clearAuthSession, getAccessToken, setAccessToken, setStoredUser } from './auth-session.js';
import { getDeviceFingerprint, getDeviceId, getDeviceName } from './device-id.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const instance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

instance.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['x-device-id'] = getDeviceId();
  config.headers['x-device-name'] = getDeviceName();
  config.headers['x-device-fingerprint'] = getDeviceFingerprint();
  return config;
});

let refreshPromise = null;

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const requestUrl = originalRequest.url || '';

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !requestUrl.includes('/login') &&
      !requestUrl.includes('/refresh') &&
      !window.location.pathname.includes('/login')
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= refreshClient.post(
          '/refresh',
          {},
          {
            headers: {
              'x-device-id': getDeviceId(),
              'x-device-name': getDeviceName(),
              'x-device-fingerprint': getDeviceFingerprint()
            }
          }
        );

        const response = await refreshPromise;
        refreshPromise = null;

        if (response.data?.token) {
          setAccessToken(response.data.token);
        }

        if (response.data?.user) {
          setStoredUser(response.data.user);
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        originalRequest.headers['x-device-id'] = getDeviceId();
        originalRequest.headers['x-device-name'] = getDeviceName();
        originalRequest.headers['x-device-fingerprint'] = getDeviceFingerprint();

        return instance(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        clearAuthSession();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
