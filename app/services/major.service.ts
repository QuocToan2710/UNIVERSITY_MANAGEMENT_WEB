import { apiListRequest, apiRequest } from "../lib/api";
import type { MajorRequest } from "../types/request";
import type { MajorResponse } from "../types/response";

export const majorService = {
  async getAll(): Promise<MajorResponse[]> {
    return apiListRequest<MajorResponse>("/majors?size=1000").catch(async () =>
      apiListRequest<MajorResponse>("/majors")
    );
  },

  async getById(id: string | number): Promise<MajorResponse> {
    return apiRequest<MajorResponse>(`/majors/${id}`);
  },

  async create(data: MajorRequest): Promise<MajorResponse> {
    return apiRequest<MajorResponse>("/majors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string | number, data: MajorRequest): Promise<MajorResponse> {
    return apiRequest<MajorResponse>(`/majors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/majors/${id}`, {
      method: "DELETE",
    });
  },
};
