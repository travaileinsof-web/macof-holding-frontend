import axios from "axios";

// Nettoyage de l'URL de base pour éviter les slashes de fin
const rawUrl = import.meta.env.VITE_API_URL || "";
const cleanBaseUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;

// Si VITE_API_URL ne contient pas /api/v1, on s'assure qu'il soit présent
export const RAW_BASE_URL = cleanBaseUrl.includes("/api/v1")
  ? cleanBaseUrl
  : `${cleanBaseUrl}/api/v1`;

export const api = axios.create({
  baseURL: RAW_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur de requêtes
api.interceptors.request.use((config) => {
  // 1. Correction automatique des URLs doublonnées si baseURL contient déjà /api/v1
  if (config.url && config.url.startsWith("/api/v1")) {
    config.url = config.url.replace(/^\/api\/v1/, "");
  }

  // 2. Injection dynamique du token JWT
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Intercepteur de réponses (Gestion de l'expiration du token / 401)
let hasRedirectedToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 && !hasRedirectedToLogin) {
      const pathname = window.location.pathname;

      // On redirige seulement si l'utilisateur est sur une page admin (hors page login)
      if (
        pathname.startsWith("/admin") &&
        !pathname.startsWith("/admin/login")
      ) {
        hasRedirectedToLogin = true;

        // Nettoyage de la session
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");

        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 50);
      }
    }

    return Promise.reject(error);
  }
);