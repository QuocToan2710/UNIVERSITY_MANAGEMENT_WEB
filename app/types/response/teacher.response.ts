export type TeacherResponse = {
  id: number | string;
  teacherCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  degree?: string;
  departmentId?: number | string;
  departmentName?: string;
  userId?: string;
};

export type Teacher = TeacherResponse;
