export type CourseRequest = {
  courseCode: string;
  courseName: string;
  credit: number;
  semester: string;
  teacherId: number | string;
};

export type CoursePayload = CourseRequest;

export const emptyCourse: CoursePayload = {
  courseCode: '',
  courseName: '',
  credit: 3,
  semester: 'HK1-2025',
  teacherId: '',
};
