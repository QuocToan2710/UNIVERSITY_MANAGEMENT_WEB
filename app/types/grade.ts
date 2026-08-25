export type GradeStatus = "DRAFT" | "SUBMITTED" | "PUBLISHED" | "LOCKED";

export type GradeEnrollment = {
  id: number;
  enrollmentCode: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  subjectClassId: number;
  subjectClassCode?: string;
  subjectClassName?: string;
  attendanceScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
  totalScore?: number | null;
  letterGrade?: string | null;
  gradePoint4?: number | null;
  gradeStatus?: GradeStatus;
  note?: string | null;
  isAppealed?: boolean;
  status: "REGISTERED" | "ATTENDING" | "PASSED" | "FAILED" | "CANCELLED";
  subjectName?: string;
  subjectCode?: string;
  credit?: number;
  semester?: string;
  academicYear?: string;
};

export type SubjectClassGradeSummary = {
  subjectClassId: number;
  subjectClassCode: string;
  subjectClassName: string;
  semester: string;
  academicYear: string;
  maxCapacity: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credit: number;
  attendanceCoeff: number;
  midtermCoeff: number;
  finalCoeff: number;
  teacherId?: number | null;
  teacherCode?: string | null;
  teacherName?: string | null;
  gradeStatus: GradeStatus;
  totalStudents: number;
  gradedStudents: number;
  passedCount: number;
  failedCount: number;
  averageScore?: number | null;
  gradeDistribution: Record<string, number>;
  studentGrades: GradeEnrollment[];
};

export type GradeItemInput = {
  enrollmentId: number;
  attendanceScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
  note?: string;
};

export type GradeBatchUpdateRequest = {
  items: GradeItemInput[];
};

export type SemesterTranscript = {
  semester: string;
  academicYear: string;
  semesterGpa4?: number | null;
  semesterGpa10?: number | null;
  semesterCredits: number;
  semesterEarnedCredits: number;
  courses: GradeEnrollment[];
};

export type StudentTranscript = {
  studentId: number;
  studentCode: string;
  fullName: string;
  email?: string;
  className?: string;
  majorName?: string;
  academicStatus?: string;
  cumulativeCpa4?: number | null;
  cumulativeGpa10?: number | null;
  totalRegisteredCredits: number;
  totalEarnedCredits: number;
  academicRank?: string;
  semesters: SemesterTranscript[];
};