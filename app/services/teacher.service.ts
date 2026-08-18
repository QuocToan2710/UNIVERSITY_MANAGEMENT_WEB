import { apiListRequest, apiRequest } from "../lib/api";
import type { TeacherRequest } from "../types/request";
import type { TeacherResponse } from "../types/response";

export const teacherService = {
  async getAll(): Promise<TeacherResponse[]> {
    return apiListRequest<TeacherResponse>("/teachers?size=1000").catch(async () =>
      apiListRequest<TeacherResponse>("/teachers")
    );
  },

  async getById(id: string | number): Promise<TeacherResponse> {
    return apiRequest<TeacherResponse>(`/teachers/${id}`);
  },

  async create(data: TeacherRequest): Promise<TeacherResponse> {
    return apiRequest<TeacherResponse>("/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string | number, data: TeacherRequest): Promise<TeacherResponse> {
    return apiRequest<TeacherResponse>(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/teachers/${id}`, {
      method: "DELETE",
    });
  },
};
