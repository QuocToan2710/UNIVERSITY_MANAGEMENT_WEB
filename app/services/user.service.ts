import { apiListRequest, apiRequest } from "../lib/api";
import type { UserRequest } from "../types/request";
import type { UserResponse } from "../types/response";

export const userService = {
  async getAll(): Promise<UserResponse[]> {
    return apiListRequest<UserResponse>("/users");
  },

  async getById(id: string | number): Promise<UserResponse> {
    return apiRequest<UserResponse>(`/users/${id}`);
  },

  async create(data: UserRequest): Promise<UserResponse> {
    return apiRequest<UserResponse>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(data: UserRequest): Promise<UserResponse> {
    return apiRequest<UserResponse>("/users/update", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/users/${id}`, {
      method: "DELETE",
    });
  },
};
