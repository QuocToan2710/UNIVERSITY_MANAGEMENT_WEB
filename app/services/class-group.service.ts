import { apiListRequest, apiRequest } from "../lib/api";
import type { ClassGroupRequest } from "../types/request";
import type { ClassGroupResponse } from "../types/response";

export const classGroupService = {
  async getAll(): Promise<ClassGroupResponse[]> {
    return apiListRequest<ClassGroupResponse>("/class-groups?size=1000").catch(async () =>
      apiListRequest<ClassGroupResponse>("/class-groups")
    );
  },

  async getById(id: string | number): Promise<ClassGroupResponse> {
    return apiRequest<ClassGroupResponse>(`/class-groups/${id}`);
  },

  async create(data: ClassGroupRequest): Promise<ClassGroupResponse> {
    return apiRequest<ClassGroupResponse>("/class-groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string | number, data: ClassGroupRequest): Promise<ClassGroupResponse> {
    return apiRequest<ClassGroupResponse>(`/class-groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/class-groups/${id}`, {
      method: "DELETE",
    });
  },
};
