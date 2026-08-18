import { apiListRequest, apiRequest } from "../lib/api";
import type { ClassScheduleRequest, ExamScheduleRequest } from "../types/request";
import type { ClassScheduleResponse, ExamScheduleResponse } from "../types/response";

export const scheduleService = {
  // Class Schedules
  async getClassSchedules(size: number = 200): Promise<ClassScheduleResponse[]> {
    return apiListRequest<ClassScheduleResponse>(`/schedules?size=${size}`);
  },

  async getMyClassSchedules(semester: string, academicYear: string): Promise<ClassScheduleResponse[]> {
    return apiListRequest<ClassScheduleResponse>(
      `/schedules/my?semester=${semester}&academicYear=${academicYear}`
    ).catch(async () => apiListRequest<ClassScheduleResponse>("/schedules?size=200"));
  },

  async getClassScheduleById(id: string | number): Promise<ClassScheduleResponse> {
    return apiRequest<ClassScheduleResponse>(`/schedules/${id}`);
  },

  async createClassSchedule(data: ClassScheduleRequest): Promise<ClassScheduleResponse> {
    return apiRequest<ClassScheduleResponse>("/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateClassSchedule(id: string | number, data: ClassScheduleRequest): Promise<ClassScheduleResponse> {
    return apiRequest<ClassScheduleResponse>(`/schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteClassSchedule(id: string | number): Promise<void> {
    return apiRequest<void>(`/schedules/${id}`, {
      method: "DELETE",
    });
  },

  // Exam Schedules
  async getExamSchedules(): Promise<ExamScheduleResponse[]> {
    return apiListRequest<ExamScheduleResponse>("/exam-schedules").catch(async () =>
      apiListRequest<ExamScheduleResponse>("/schedules/exams")
    );
  },

  async createExamSchedule(data: ExamScheduleRequest): Promise<ExamScheduleResponse> {
    return apiRequest<ExamScheduleResponse>("/exam-schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateExamSchedule(id: string | number, data: ExamScheduleRequest): Promise<ExamScheduleResponse> {
    return apiRequest<ExamScheduleResponse>(`/exam-schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteExamSchedule(id: string | number): Promise<void> {
    return apiRequest<void>(`/exam-schedules/${id}`, {
      method: "DELETE",
    });
  },
};
