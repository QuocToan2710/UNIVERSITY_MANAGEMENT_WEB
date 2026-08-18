import type { StudentResponse } from '../response/student.response';

export type StudentRequest = Omit<StudentResponse, 'id' | 'classCode' | 'classGroupName' | 'majorName'>;

export type StudentPayload = StudentRequest;

export const emptyStudent: StudentPayload = {
  studentCode: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  dob: '',
  gender: 'Nam',
  address: '',
  majorId: '',
  enrollmentYear: '',
  status: 'ACTIVE',
  classGroupId: '',
};
