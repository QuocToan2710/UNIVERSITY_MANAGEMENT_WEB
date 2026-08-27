export type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "UNEXCUSED";

export type AttendanceSessionStatus = "PENDING" | "COMPLETED";

export interface AttendanceSession {
  id: number;
  sessionCode: string;
  name: string;
  subjectClassId: number;
  subjectClassCode?: string;
  subjectClassName?: string;
  subjectName?: string;
  classScheduleId?: number;
  teacherId?: number;
  teacherName?: string;
  sessionNumber: number;
  sessionDate: string;
  lessonCount: number;
  room?: string;
  topic?: string;
  note?: string;
  status: AttendanceSessionStatus;
  totalStudents?: number;
  presentStudents?: number;
  absentStudents?: number;
  lateStudents?: number;
  createdAt?: string;
  createdBy?: string;
}

export interface AttendanceRecord {
  id?: number;
  sessionId: number;
  sessionNumber?: number;
  sessionDate?: string;
  enrollmentId?: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  classGroupName?: string;
  status: AttendanceStatus;
  lateMinutes?: number;
  note?: string;
  checkedAt?: string;
}

export interface StudentAttendanceSummary {
  enrollmentId: number;
  subjectClassId: number;
  subjectClassCode: string;
  subjectClassName: string;
  subjectName: string;
  credits: number;
  teacherName?: string;
  totalPlannedSessions: number;
  completedSessions: number;
  attendedSessions: number;
  excusedAbsentSessions: number;
  unexcusedAbsentSessions: number;
  lateSessions: number;
  absenceRate: number;
  attendanceScore: number;
  isBannedFromExam: boolean;
  examStatus: "ELIGIBLE" | "AT_RISK" | "BANNED";
  records?: AttendanceRecord[];
}

export interface BannedStudent {
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentEmail?: string;
  classGroupName?: string;
  subjectClassId: number;
  subjectClassCode: string;
  subjectClassName: string;
  subjectName: string;
  semester: string;
  academicYear: string;
  totalSessions: number;
  absentSessions: number;
  absenceRate: number;
  attendanceScore: number;
  reason: string;
}

export interface AutoGenerateSessionsPayload {
  subjectClassId: number;
  totalSessions?: number;
  startDate?: string;
}

export interface AttendanceSessionPayload {
  subjectClassId: number;
  classScheduleId?: number;
  teacherId?: number;
  sessionNumber: number;
  sessionDate: string;
  lessonCount?: number;
  room?: string;
  topic?: string;
  note?: string;
}

export interface SubmitAttendancePayload {
  records: {
    studentId: number;
    enrollmentId?: number;
    status: AttendanceStatus;
    lateMinutes?: number;
    note?: string;
  }[];
  topic?: string;
  note?: string;
}
