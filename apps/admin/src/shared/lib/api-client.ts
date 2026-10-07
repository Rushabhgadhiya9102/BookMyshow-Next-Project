import axios from "axios";

const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiInstance.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) {
      config.headers.Authorization = `Bearer ${decodeURIComponent(match[1])}`;
    }
  }

  // When uploading FormData, remove Content-Type so browser/Axios sets boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

export default apiInstance;