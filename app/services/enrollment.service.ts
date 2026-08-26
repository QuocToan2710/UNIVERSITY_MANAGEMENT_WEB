import { apiRequest } from "../lib/api";
import type {
  AvailableSubjectClass,
  BatchEnrollmentResult,
  EnrollmentRecord,
} from "../types/enrollment";

export const enrollmentService = {
  /** Lấy danh sách lớp học phần đang mở đăng ký */
  async getAvailableClasses(
    semester?: string,
    academicYear?: string
  ): Promise<AvailableSubjectClass[]> {
    const params = new URLSearchParams();
    if (semester) params.append("semester", semester);
    if (academicYear) params.append("academicYear", academicYear);
    const qs = params.toString();
    return apiRequest<AvailableSubjectClass[]>(
      `/enrollments/available-classes${qs ? `?${qs}` : ""}`
    );
  },

  /** Sinh viên tự đăng ký vào một lớp học phần (hoặc Admin chỉ định studentId) */
  async registerClass(subjectClassId: number, studentId?: number): Promise<EnrollmentRecord> {
    return apiRequest<EnrollmentRecord>("/enrollments/register", {
      method: "POST",
      body: JSON.stringify({ subjectClassId, studentId }),
    });
  },

  /** Sinh viên hủy đăng ký một lớp học phần theo subjectClassId */
  async cancelRegistration(subjectClassId: number): Promise<string> {
    return apiRequest<string>(`/enrollments/cancel/${subjectClassId}`, {
      method: "DELETE",
    });
  },

  /** Hủy đăng ký theo enrollmentId */
  async cancelRegistrationById(enrollmentId: number): Promise<string> {
    return apiRequest<string>(`/enrollments/my-registrations/${enrollmentId}`, {
      method: "DELETE",
    });
  },

  /** Lấy danh sách môn đã đăng ký của sinh viên hiện tại */
  async getMyRegistrations(
    semester?: string,
    academicYear?: string
  ): Promise<EnrollmentRecord[]> {
    const params = new URLSearchParams();
    if (semester) params.append("semester", semester);
    if (academicYear) params.append("academicYear", academicYear);
    const qs = params.toString();
    return apiRequest<EnrollmentRecord[]>(
      `/enrollments/my-registrations${qs ? `?${qs}` : ""}`
    );
  },

  /** Lấy danh sách sinh viên của một lớp học phần (dành cho GV/Admin) */
  async getEnrollmentsBySubjectClass(
    subjectClassId: number | string
  ): Promise<EnrollmentRecord[]> {
    return apiRequest<EnrollmentRecord[]>(
      `/enrollments/subject-class/${subjectClassId}`
    );
  },

  /** Admin/GV gán danh sách sinh viên vào lớp học phần */
  async batchEnroll(
    subjectClassId: number,
    studentIds: number[]
  ): Promise<BatchEnrollmentResult> {
    return apiRequest<BatchEnrollmentResult>("/enrollments/batch", {
      method: "POST",
      body: JSON.stringify({ subjectClassId, studentIds }),
    });
  },

  /** Admin/GV gán cả lớp sinh hoạt vào lớp học phần */
  async enrollClassGroup(
    subjectClassId: number,
    classGroupId: number
  ): Promise<BatchEnrollmentResult> {
    return apiRequest<BatchEnrollmentResult>("/enrollments/class-group", {
      method: "POST",
      body: JSON.stringify({ subjectClassId, classGroupId }),
    });
  },

  /** Xóa một bản ghi enrollment (Admin) */
  async deleteEnrollment(id: number): Promise<string> {
    return apiRequest<string>(`/enrollments/${id}`, {
      method: "DELETE",
    });
  },
};