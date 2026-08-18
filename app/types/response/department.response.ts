export type DepartmentResponse = {
  id: number | string;
  departmentCode: string;
  name: string;
  description?: string;
};

export type Department = DepartmentResponse;

export type SubjectResponse = {
  id: number | string;
  subjectCode: string;
  name: string;
};

export type Subject = SubjectResponse;
