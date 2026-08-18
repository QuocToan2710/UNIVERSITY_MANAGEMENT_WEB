import { apiListRequest, apiRequest } from "../lib/api";
import type { CourseRequest } from "../types/request";
import type { CourseResponse } from "../types/response";

export const courseService = {
  async getAll(): Promise<CourseResponse[]> {
    return apiListRequest<CourseResponse>("/courses?size=1000").catch(async () =>
      apiListRequest<CourseResponse>("/courses")
    );
  },

  async getById(id: string | number): Promise<CourseResponse> {
    return apiRequest<CourseResponse>(`/courses/${id}`);
  },

  async create(data: CourseRequest): Promise<CourseResponse> {
    return apiRequest<CourseResponse>("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string | number, data: CourseRequest): Promise<CourseResponse> {
    return apiRequest<CourseResponse>(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/courses/${id}`, {
      method: "DELETE",
    });
  },
};
