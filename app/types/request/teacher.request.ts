export type TeacherRequest = {
  teacherCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  degree?: string;
  address?: string;
  provinceId?: number | string;
  provinceName?: string;
  districtId?: number | string;
  districtName?: string;
  wardId?: number | string;
  wardName?: string;
  specificAddress?: string;
  fullAddress?: string;
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
