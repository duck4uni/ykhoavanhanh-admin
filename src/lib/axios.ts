import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore, getAccessToken, logout } from "@/store/authStore";
import type { ApiResponse, RefreshTokenResponse } from "@/types/api-response";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1.0`
  : "http://localhost:3000/api/v1";

// ─── Auth routes to skip token handling ────────────────────────────────────

const PUBLIC_AUTH_ROUTES = ["/auth/login", "/auth/genNewAccessToken", "/auth/register"];

const isPublicRoute = (url?: string): boolean => {
  if (!url) return false;
  return PUBLIC_AUTH_ROUTES.some((route) => url.includes(route));
};

// ─── Custom Error ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly violations?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Refresh Queue ─────────────────────────────────────────────────────────────

type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

let isRefreshing = false;
let refreshSubscribers: RefreshSubscriber[] = [];

const subscribeTokenRefresh = (
  resolve: (token: string) => void,
  reject: (error: Error) => void
) => {
  refreshSubscribers.push({ resolve, reject });
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers = [];
  isRefreshing = false;
};

const onRefreshFailed = (error: Error) => {
  refreshSubscribers.forEach((sub) => sub.reject(error));
  refreshSubscribers = [];
  isRefreshing = false;
};

// ─── Guards ───────────────────────────────────────────────────────────────────

let isLoggingOut = false;

const handleLogout = () => {
  if (isLoggingOut) return;

  isLoggingOut = true;
  logout();

  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }

  // Reset guard after navigation (for SPA router compatibility)
  setTimeout(() => {
    isLoggingOut = false;
  }, 1000);
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) return null;

  try {
    const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
      `${API_BASE_URL}/auth/genNewAccessToken`,
      { refreshToken }
    );

    if (response.data.status === "success" && response.data.responseData) {
      const { accessToken, expiresIn } = response.data.responseData;
      useAuthStore.getState().updateAccessToken({ accessToken, expiresIn });
      return accessToken;
    }

    return null;
  } catch (error) {
    console.error("[axios] Token refresh failed:", error);
    return null;
  }
}

// ─── Request Interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip token for public auth routes
    if (isPublicRoute(config.url)) return config;

    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetryableConfig;

    // Skip auth routes - don't handle 401 for login/register
    if (isPublicRoute(originalRequest.url)) {
      if (error.response?.data) {
        const { message, message_en, violations } = error.response.data;
        const errorMessage =
          message || message_en || error.response.statusText || "Đã xảy ra lỗi";
        return Promise.reject(new ApiError(errorMessage, error.response.status, violations));
      }
      return Promise.reject(error);
    }

    // Only handle 401
    if (error.response?.status !== 401) {
      if (error.response?.data) {
        const { message, message_en, violations } = error.response.data;
        const errorMessage =
          message || message_en || error.response.statusText || "Đã xảy ra lỗi";
        return Promise.reject(new ApiError(errorMessage, error.response.status, violations));
      }

      if (!error.response) {
        return Promise.reject(new ApiError("Không thể kết nối đến server", 0));
      }

      return Promise.reject(error);
    }

    // Already retried - prevent infinite loop
    if (originalRequest._retry) {
      handleLogout();
      return Promise.reject(new Error("Session expired. Please login again."));
    }

    // Already refreshing - queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (token: string) => {
            originalRequest._retry = true;
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          },
          (err: Error) => {
            reject(err);
          }
        );
      });
    }

    // Start refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();

      if (!newToken) {
        throw new Error("Token refresh failed");
      }

      onRefreshed(newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      onRefreshFailed(
        refreshError instanceof Error
          ? refreshError
          : new Error(String(refreshError))
      );
      handleLogout();
      return Promise.reject(refreshError);
    }
  }
);

// ─── Typed API Helpers ────────────────────────────────────────────────────────

export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  api.get<ApiResponse<T>>(url, config);

export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  api.post<ApiResponse<T>>(url, data, config);

export const apiPut = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  api.put<ApiResponse<T>>(url, data, config);

export const apiPatch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  api.patch<ApiResponse<T>>(url, data, config);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  api.delete<ApiResponse<T>>(url, config);

/**
 * Extract data from ApiResponse wrapper.
 * Returns null if status is not "success".
 */
export const getResponseData = <T>(response: { data: ApiResponse<T> }): T | null => {
  return response.data.status === "success" ? response.data.responseData : null;
};

export default api;
