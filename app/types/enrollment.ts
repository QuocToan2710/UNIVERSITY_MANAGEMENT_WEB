export interface ScheduleInfo {
  id: number;
  dayOfWeek: number;
  shift?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
}

export interface AvailableSubjectClass {
  id: number;
  subjectClassCode: string;
  name: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credit: number;
  attendanceCoeff?: number;
  midtermCoeff?: number;
  finalCoeff?: number;
  teacherId?: number;
  teacherCode?: string;
  teacherName?: string;
  semester: string;
  academicYear: string;
  maxCapacity: number;
  currentCapacity: number;
  isEnrolled: boolean;
  enrollmentId?: number;
  schedules?: ScheduleInfo[];
}

export interface EnrollmentRecord {
  id: number;
  enrollmentCode?: string;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  subjectClassId: number;
  subjectClassCode?: string;
  subjectClassName?: string;
  subjectCode?: string;
  subjectName?: string;
  credit?: number;
  semester?: string;
  academicYear?: string;
  status?: string;
  enrolledAt?: string;
  attendanceScore?: number;
  midtermScore?: number;
  finalScore?: number;
  totalScore?: number;
  letterGrade?: string;
  gradePoint4?: number;
}

export interface BatchEnrollmentResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  successStudentCodes: string[];
  failedReasons: string[];
}
