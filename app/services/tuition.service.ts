import { apiRequest } from "../lib/api";
import type {
  PageResponse,
  RecordPaymentPayload,
  StudentTuitionSummary,
  TuitionDashboardSummary,
  TuitionStatus,
} from "../types/tuition";

export interface PageResponseData<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}

export const tuitionService = {
  /** Sinh viên tra cứu học phí cá nhân của chính mình */
  async getMyTuitionSummary(
    semester?: string,
    academicYear?: string
  ): Promise<StudentTuitionSummary> {
    const params = new URLSearchParams();
    if (semester && semester !== "ALL") params.append("semester", semester);
    if (academicYear && academicYear !== "ALL") params.append("academicYear", academicYear);
    const qs = params.toString();
    return apiRequest<StudentTuitionSummary>(
      `/tuition-fees/my-summary${qs ? `?${qs}` : ""}`
    );
  },

  /** Sinh viên xem lịch sử học phí tất cả các kỳ */
  async getMyTuitionHistory(): Promise<StudentTuitionSummary[]> {
    return apiRequest<StudentTuitionSummary[]>("/tuition-fees/my-history");
  },

  /** Admin tra cứu học phí của một sinh viên cụ thể */
  async getStudentTuitionSummary(
    studentId: number,
    semester?: string,
    academicYear?: string
  ): Promise<StudentTuitionSummary> {
    const params = new URLSearchParams();
    if (semester && semester !== "ALL") params.append("semester", semester);
    if (academicYear && academicYear !== "ALL") params.append("academicYear", academicYear);
    const qs = params.toString();
    return apiRequest<StudentTuitionSummary>(
      `/tuition-fees/student/${studentId}${qs ? `?${qs}` : ""}`
    );
  },

  /** Admin tra cứu danh sách học phí toàn trường */
  async getAllStudentsTuition(options: {
    semester?: string;
    academicYear?: string;
    classGroupId?: number | "";
    status?: TuitionStatus | "";
    search?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: StudentTuitionSummary[]; totalElements: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (options.semester && options.semester !== "ALL") params.append("semester", options.semester);
    if (options.academicYear && options.academicYear !== "ALL") params.append("academicYear", options.academicYear);
    if (options.classGroupId) params.append("classGroupId", String(options.classGroupId));
    if (options.status) params.append("status", options.status);
    if (options.search) params.append("search", options.search);
    if (options.page) params.append("page", String(options.page));
    if (options.size) params.append("size", String(options.size));

    const res = await apiRequest<any>(`/tuition-fees/all?${params.toString()}`);
    // Handle both Page<T> and custom PageResponse formats
    if (res?.content) {
      return {
        content: res.content,
        totalElements: res.totalElements || 0,
        totalPages: res.totalPages || 1,
      };
    }
    if (res?.data) {
      return {
        content: res.data,
        totalElements: res.totalElements || 0,
        totalPages: res.totalPages || 1,
      };
    }
    return { content: [], totalElements: 0, totalPages: 1 };
  },

  /** Admin xem dashboard tổng kết tài chính học phí */
  async getDashboardSummary(
    semester?: string,
    academicYear?: string
  ): Promise<TuitionDashboardSummary> {
    const params = new URLSearchParams();
    if (semester && semester !== "ALL") params.append("semester", semester);
    if (academicYear && academicYear !== "ALL") params.append("academicYear", academicYear);
    const qs = params.toString();
    return apiRequest<TuitionDashboardSummary>(
      `/tuition-fees/dashboard-summary${qs ? `?${qs}` : ""}`
    );
  },

  /** Admin ghi nhận nộp tiền học phí */
  async recordPayment(payload: RecordPaymentPayload): Promise<StudentTuitionSummary> {
    return apiRequest<StudentTuitionSummary>("/tuition-fees/record-payment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};