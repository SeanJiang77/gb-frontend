import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3000",
  timeout: 10000,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message = err?.response?.data?.error || err.message || "请求失败";
    return Promise.reject(new Error(message));
  }
);

export default api;

