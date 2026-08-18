export type TeacherRequest = {
  teacherCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  degree?: string;
  departmentId?: number | string;
  userId?: string;
};

export type TeacherPayload = TeacherRequest;

export const emptyTeacher: TeacherPayload = {
  teacherCode: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  degree: 'Thạc sĩ',
  departmentId: '',
};
