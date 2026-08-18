export type CourseResponse = {
  id: number | string;
  courseCode: string;
  courseName: string;
  credit: number;
  semester: string;
  description?: string;
  teacherId?: number | string;
  teacherName?: string;
  teacherCode?: string;
  students?: Array<{ studentCode: string; fullName: string }>;
};

export type Course = CourseResponse;
