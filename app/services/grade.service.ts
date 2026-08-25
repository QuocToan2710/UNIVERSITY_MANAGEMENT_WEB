import { apiRequest } from "../lib/api";
import type {
  GradeBatchUpdateRequest,
  StudentTranscript,
  SubjectClassGradeSummary,
} from "../types/grade";

export const gradeService = {
  async getSubjectClassGrades(classId: number | string): Promise<SubjectClassGradeSummary> {
    return apiRequest<SubjectClassGradeSummary>(`/grades/subject-classes/${classId}`);
  },

  async updateBatchGrades(
    classId: number | string,
    data: GradeBatchUpdateRequest
  ): Promise<SubjectClassGradeSummary> {
    return apiRequest<SubjectClassGradeSummary>(`/grades/subject-classes/${classId}/batch`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async submitGrades(classId: number | string): Promise<SubjectClassGradeSummary> {
    return apiRequest<SubjectClassGradeSummary>(`/grades/subject-classes/${classId}/submit`, {
      method: "POST",
    });
  },

  async publishGrades(classId: number | string): Promise<SubjectClassGradeSummary> {
    return apiRequest<SubjectClassGradeSummary>(`/grades/subject-classes/${classId}/publish`, {
      method: "POST",
    });
  },

  async lockGrades(classId: number | string): Promise<SubjectClassGradeSummary> {
    return apiRequest<SubjectClassGradeSummary>(`/grades/subject-classes/${classId}/lock`, {
      method: "POST",
    });
  },

  async getStudentTranscript(studentId: number | string): Promise<StudentTranscript> {
    return apiRequest<StudentTranscript>(`/grades/student/${studentId}/transcript`);
  },

  async getMyTranscript(): Promise<StudentTranscript> {
    return apiRequest<StudentTranscript>("/grades/my-transcript");
  },
};