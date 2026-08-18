import { apiListRequest, apiRequest } from "../lib/api";
import type { FloorRequest } from "../types/request";
import type { FloorResponse } from "../types/response";

export const floorService = {
  async getAll(): Promise<FloorResponse[]> {
    return apiListRequest<FloorResponse>("/floors?size=1000").catch(async () =>
      apiListRequest<FloorResponse>("/floors")
    );
  },

  async getById(id: string | number): Promise<FloorResponse> {
    return apiRequest<FloorResponse>(`/floors/${id}`);
  },

  async create(data: FloorRequest): Promise<FloorResponse> {
    return apiRequest<FloorResponse>("/floors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string | number, data: FloorRequest): Promise<FloorResponse> {
    return apiRequest<FloorResponse>(`/floors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/floors/${id}`, {
      method: "DELETE",
    });
  },
};
