export type Student = {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  address: string;
  major?: string;
  enrollmentYear?: string;
  status?: string;
  classGroupId?: string;
  classGroupName?: string;
};

export type StudentPayload = Omit<Student, "id" | "classGroupName">;

export const emptyStudent: StudentPayload = {
  studentCode: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  dob: "",
  gender: "Nam",
  address: "",
  major: "",
  enrollmentYear: "",
  status: "ACTIVE",
  classGroupId: "",
};

