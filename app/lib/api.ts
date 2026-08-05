const API_URL = "http://localhost:8080";

export type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type ApiOptions = RequestInit & { authenticated?: boolean };

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { authenticated = true, ...requestOptions } = options;
  const token = typeof window === "undefined" ? null : localStorage.getItem("access_token");
  const headers = new Headers(requestOptions.headers);
  headers.set("Content-Type", "application/json");
  if (authenticated && token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...requestOptions, headers });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !body || body.code !== 1000) {
    throw new ApiError(body?.message || "Không thể kết nối tới máy chủ.", response.status);
  }

  return body.result;
}

export async function login(username: string, password: string) {
  return apiRequest<{ token: string; authenticated: boolean }>("/auth/token", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify({ username, password }),
  });
}
