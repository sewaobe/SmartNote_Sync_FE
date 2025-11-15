import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach auth token if present
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // ignore localStorage errors in some environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap data and handle common errors
api.interceptors.response.use(
  (response) => response.data ?? response,
  (error) => {
    if (error.response) {
      // You can add centralized error handling here (e.g., refresh token logic)
      const status = error.response.status;
      if (status === 401) {
        // optionally clear token and redirect to login
        // localStorage.removeItem('authToken');
      }
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("authToken", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("authToken");
  }
}

export default api;

// Example usage (comment):
// import api, { setAuthToken } from '../api/axiosClient';
// setAuthToken('your-token');
// api.get('/notes').then(data => console.log(data)).catch(err => console.error(err));
