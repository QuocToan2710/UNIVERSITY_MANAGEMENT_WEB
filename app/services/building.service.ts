import { apiListRequest, apiRequest } from "../lib/api";
import type { BuildingRequest } from "../types/request";
import type { BuildingResponse } from "../types/response";

export const buildingService = {
  async getAll(): Promise<BuildingResponse[]> {
    return apiListRequest<BuildingResponse>("/buildings?size=1000").catch(async () =>
      apiListRequest<BuildingResponse>("/buildings")
    );
  },

  async getById(id: string | number): Promise<BuildingResponse> {
    return apiRequest<BuildingResponse>(`/buildings/${id}`);
  },

  async create(data: BuildingRequest): Promise<BuildingResponse> {
    return apiRequest<BuildingResponse>("/buildings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string | number, data: BuildingRequest): Promise<BuildingResponse> {
    return apiRequest<BuildingResponse>(`/buildings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/buildings/${id}`, {
      method: "DELETE",
    });
  },
};
