export type Teacher = {
  id: string;
  teacherCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  degree?: string;       // ThS, TS, GS, PGS
  department?: string;   // Khoa / Bộ môn
};

export type TeacherPayload = {
  teacherCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  degree?: string;
  department?: string;
};

export const emptyTeacher: TeacherPayload = {
  teacherCode: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  specialization: "",
  degree: "",
  department: "",
};

export type Course = {
  id: string;
  courseCode: string;
  courseName: string;
  credit: number;
  semester: string;
  description?: string;
  teacherId?: string;
  teacherName?: string;
  teacherCode?: string;
  students?: Array<{ studentCode: string; fullName: string }>;
};

export type CoursePayload = {
  courseCode: string;
  courseName: string;
  credit: number;
  semester: string;
  teacherId: string;
};

export const emptyCourse: CoursePayload = {
  courseCode: "",
  courseName: "",
  credit: 3,
  semester: "HK1-2025",
  teacherId: "",
};

export type User = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles?: Array<{ name: string; description?: string }>;
};

export type UserPayload = {
  id?: string;
  username: string;
  password?: string;
  email: string;
  fullName: string;
};

export const emptyUser: UserPayload = {
  username: "",
  password: "",
  email: "",
  fullName: "",
};

export type ClassGroup = {
  id: string;
  classCode: string;
  className: string;
  major: string;
  academicYear: string;
  homeroomTeacherId: string | null;
  homeroomTeacherName: string | null;
  studentCount: number;
};

export type ClassGroupPayload = {
  classCode: string;
  className: string;
  major?: string;
  academicYear?: string;
  homeroomTeacherId?: string;
};

export const emptyClassGroup: ClassGroupPayload = {
  classCode: "",
  className: "",
  major: "",
  academicYear: "",
  homeroomTeacherId: "",
};


