import { clearToken, getToken } from "./auth";

const API_URL = "http://localhost:8080";

export type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

/** Cấu trúc Spring Page object mà backend trả về cho các list endpoint */
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
};

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

export async function login(username: string, password: string) {
  return apiRequest<{ token: string; authenticated: boolean }>("/auth/token", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify({ username, password }),
  });
}

