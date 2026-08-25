export type TeacherResponse = {
  id: number | string;
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
  departmentName?: string;
  userId?: number | string;
};

export type Teacher = TeacherResponse;
