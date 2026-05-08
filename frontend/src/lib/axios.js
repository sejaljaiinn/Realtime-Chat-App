import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api",
});

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token"); // 🔥 TAB-SPECIFIC

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});