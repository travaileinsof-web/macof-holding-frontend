import axios from "axios";

const RAW_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: RAW_BASE_URL,
});

// Intercepteur pour corriger automatiquement les préfixes doublonnés
api.interceptors.request.use((config) => {
  // 1. Correction automatique des URLs doublonnées
  if (config.url && config.url.startsWith("/api/v1")) {
    config.url = config.url.replace(/^\/api\/v1/, "");
  }

  // 2. Injection du token JWT
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de réponse (Gestion du 401)
let hasRedirectedToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 && !hasRedirectedToLogin) {
      const pathname = window.location.pathname;
      if (
        pathname.startsWith("/admin") &&
        !pathname.startsWith("/admin/login")
      ) {
        hasRedirectedToLogin = true;
        setTimeout(() => {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/admin/login";
        }, 50);
      }
    }
    return Promise.reject(error);
  },
);
