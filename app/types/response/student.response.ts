export type StudentResponse = {
  id: number | string;
  studentCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  address: string;
  provinceId?: number | string;
  provinceName?: string;
  districtId?: number | string;
  districtName?: string;
  wardId?: number | string;
  wardName?: string;
  specificAddress?: string;
  fullAddress?: string;
  majorId?: number | string;
  majorName?: string;
  major?: string;
  enrollmentYear?: string;
  status?: string;
  classGroupId?: number | string;
  classCode?: string;
  classGroupName?: string;
  userId?: number | string;
};

export type Student = StudentResponse;
