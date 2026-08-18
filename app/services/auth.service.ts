import { apiRequest } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";
import type { LoginRequest, LogoutRequest } from "../types/request";
import type { AuthenticationResponse, UserResponse } from "../types/response";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthenticationResponse> {
    return apiRequest<AuthenticationResponse>("/auth/token", {
      method: "POST",
      authenticated: false,
      body: JSON.stringify(credentials),
    });
  },

  async logout(): Promise<void> {
    const token = getToken();
    try {
      if (token) {
        const payload: LogoutRequest = { token };
        await apiRequest<void>("/auth/logout", {
          method: "POST",
          authenticated: false,
          body: JSON.stringify(payload),
        });
      }
    } finally {
      clearToken();
    }
  },

  async getMyInfo(): Promise<UserResponse> {
    return apiRequest<UserResponse>("/users/myInfo");
  },
};
