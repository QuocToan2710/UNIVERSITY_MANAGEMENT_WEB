export type StudentResponse = {
  id: number | string;
  studentCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  address: string;
  majorId?: number | string;
  majorName?: string;
  major?: string;
  enrollmentYear?: string;
  status?: string;
  classGroupId?: number | string;
  classCode?: string;
  classGroupName?: string;
  userId?: string;
};

export type Student = StudentResponse;
