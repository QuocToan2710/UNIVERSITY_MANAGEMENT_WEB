export type Teacher = {
  id: string;
  teacherCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
};

export type TeacherPayload = {
  teacherCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
};

export const emptyTeacher: TeacherPayload = {
  teacherCode: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  specialization: "",
};

export type Course = {
  id: string;
  courseCode: string;
  courseName: string;
  credit: number;
  semester: string;
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

