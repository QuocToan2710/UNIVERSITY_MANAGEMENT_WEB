import { apiListRequest, apiRequest } from "../lib/api";
import type { StudentRequest } from "../types/request";
import type { StudentResponse } from "../types/response";

export const studentService = {
  async getAll(): Promise<StudentResponse[]> {
    return apiListRequest<StudentResponse>("/students?size=1000").catch(async () =>
      apiListRequest<StudentResponse>("/students")
    );
  },

  async getById(id: string | number): Promise<StudentResponse> {
    return apiRequest<StudentResponse>(`/students/${id}`);
  },

  async create(data: StudentRequest): Promise<StudentResponse> {
    return apiRequest<StudentResponse>("/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string | number, data: StudentRequest): Promise<StudentResponse> {
    return apiRequest<StudentResponse>(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/students/${id}`, {
      method: "DELETE",
    });
  },
};
