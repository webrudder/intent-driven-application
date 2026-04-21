import axios from 'axios';

let onError: ((msg: string) => void) | null = null;

export function setErrorHandler(handler: (msg: string) => void): void {
  onError = handler;
}

function showError(msg: string): void {
  console.error(msg);
  if (onError) onError(msg);
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('idapp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data.code !== 0) {
      showError(data.error || '请求失败');
      return Promise.reject(new Error(data.error));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('idapp_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    showError(error.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request;