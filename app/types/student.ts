export type Student = {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  address: string;
};

export type StudentPayload = Omit<Student, "id">;

export const emptyStudent: StudentPayload = {
  studentCode: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  dob: "",
  gender: "Nam",
  address: "",
};
