import { apiRequest } from "../lib/api";
import { API_ENDPOINTS } from "../constants/endpoints.constant";
import type {
  AttendanceRecord,
  AttendanceSession,
  AttendanceSessionPayload,
  AutoGenerateSessionsPayload,
  BannedStudent,
  StudentAttendanceSummary,
  SubmitAttendancePayload,
} from "../types/attendance";

export const attendanceService = {
  /** Tự động sinh danh sách buổi học theo lịch học của lớp */
  async autoGenerateSessions(payload: AutoGenerateSessionsPayload): Promise<AttendanceSession[]> {
    return apiRequest<AttendanceSession[]>(API_ENDPOINTS.ATTENDANCE.AUTO_GENERATE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** Tạo một buổi học lẻ / buổi học bù */
  async createSession(payload: AttendanceSessionPayload): Promise<AttendanceSession> {
    return apiRequest<AttendanceSession>(API_ENDPOINTS.ATTENDANCE.SESSIONS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** Cập nhật thông tin buổi học */
  async updateSession(sessionId: number, payload: AttendanceSessionPayload): Promise<AttendanceSession> {
    return apiRequest<AttendanceSession>(`${API_ENDPOINTS.ATTENDANCE.SESSIONS}/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /** Xóa buổi học */
  async deleteSession(sessionId: number): Promise<void> {
    return apiRequest<void>(`${API_ENDPOINTS.ATTENDANCE.SESSIONS}/${sessionId}`, {
      method: "DELETE",
    });
  },

  /** Lấy danh sách các buổi học của lớp học phần */
  async getSessionsBySubjectClass(subjectClassId: number): Promise<AttendanceSession[]> {
    return apiRequest<AttendanceSession[]>(
      `${API_ENDPOINTS.ATTENDANCE.SESSIONS}?subjectClassId=${subjectClassId}`
    );
  },

  /** Lấy danh sách bảng điểm danh của buổi học */
  async getSessionRecords(sessionId: number): Promise<AttendanceRecord[]> {
    return apiRequest<AttendanceRecord[]>(
      API_ENDPOINTS.ATTENDANCE.SESSION_RECORDS(sessionId)
    );
  },

  /** Chốt nộp bảng điểm danh buổi học */
  async submitAttendance(sessionId: number, payload: SubmitAttendancePayload): Promise<AttendanceSession> {
    return apiRequest<AttendanceSession>(
      API_ENDPOINTS.ATTENDANCE.SUBMIT_SESSION(sessionId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /** Sinh viên tra cứu tổng quan chuyên cần cá nhân */
  async getMyAttendanceSummary(semester?: string, academicYear?: string): Promise<StudentAttendanceSummary[]> {
    const params = new URLSearchParams();
    if (semester && semester !== "ALL") params.append("semester", semester);
    if (academicYear && academicYear !== "ALL") params.append("academicYear", academicYear);
    const qs = params.toString();
    return apiRequest<StudentAttendanceSummary[]>(
      `${API_ENDPOINTS.ATTENDANCE.MY_SUMMARY}${qs ? `?${qs}` : ""}`
    );
  },

  /** Sinh viên xem chi tiết nhật ký điểm danh môn học */
  async getMyAttendanceDetails(subjectClassId: number): Promise<StudentAttendanceSummary> {
    return apiRequest<StudentAttendanceSummary>(
      `${API_ENDPOINTS.ATTENDANCE.MY_DETAILS}?subjectClassId=${subjectClassId}`
    );
  },

  /** Lấy danh sách sinh viên bị cấm thi */
  async getBannedStudents(
    semester?: string,
    academicYear?: string,
    subjectClassId?: number
  ): Promise<BannedStudent[]> {
    const params = new URLSearchParams();
    if (semester && semester !== "ALL") params.append("semester", semester);
    if (academicYear && academicYear !== "ALL") params.append("academicYear", academicYear);
    if (subjectClassId) params.append("subjectClassId", subjectClassId.toString());
    const qs = params.toString();
    return apiRequest<BannedStudent[]>(
      `${API_ENDPOINTS.ATTENDANCE.BANNED_STUDENTS}${qs ? `?${qs}` : ""}`
    );
  },
};
