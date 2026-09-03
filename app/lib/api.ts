import { clearToken, getToken } from "./auth";
import type {
  ApiResponse,
  PageResponse,
  SelectOption,
  ComboType,
  AuthenticationResponse,
} from "../types/response";
import type { LoginRequest } from "../types/request";

export type { ApiResponse, PageResponse, SelectOption, ComboType };

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";
const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type ApiOptions = RequestInit & { authenticated?: boolean };

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { authenticated = true, ...requestOptions } = options;
  const token = getToken();
  const headers = new Headers(requestOptions.headers);
  headers.set("Content-Type", "application/json");
  if (authenticated && token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...requestOptions, headers });

  if (response.status === 401) {
    clearToken();
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !body || body.code !== 1000) {
    throw new ApiError(body?.message || "Không thể kết nối tới máy chủ.", response.status);
  }

  return body.result;
}

/**
 * Gọi các list endpoint trả về Spring Page object,
 * tự động trả về mảng content bên trong.
 */
export async function apiListRequest<T>(path: string, options: ApiOptions = {}): Promise<T[]> {
  const result = await apiRequest<PageResponse<T> | T[]>(path, options);
  // Nếu backend trả Page object thì lấy content, nếu là array thuần thì giữ nguyên
  if (Array.isArray(result)) return result;
  return (result as PageResponse<T>).content ?? [];
}

export async function login(username: string, password: string): Promise<AuthenticationResponse> {
  const payload: LoginRequest = { username, password };
  return apiRequest<AuthenticationResponse>("/auth/token", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string): Promise<string> {
  return apiRequest<string>("/auth/forgot-password", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(data: { email: string; otp: string; newPassword: string }): Promise<string> {
  return apiRequest<string>("/auth/reset-password", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify(data),
  });
}

export async function fetchMasterData(
  type: ComboType,
  options?: { cascader?: string; codeSystem?: string; isCodeIsId?: boolean }
): Promise<SelectOption[]> {
  const params = new URLSearchParams({ type });
  if (options?.cascader) params.set("cascader", options.cascader);
  if (options?.codeSystem) params.set("codeSystem", options.codeSystem);
  if (options?.isCodeIsId) params.set("isCodeIsId", String(options.isCodeIsId));

  return apiRequest<SelectOption[]>(`/master-data?${params.toString()}`);
}

