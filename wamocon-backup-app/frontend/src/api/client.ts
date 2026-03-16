import axios from 'axios';

// In development: Vite proxies /api → localhost:3001
// In production:  VITE_API_URL points to the backend (e.g. via Cloudflare Tunnel)
const baseURL = import.meta.env.VITE_API_URL ?? '/api';

const client = axios.create({ baseURL });

client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default client;
