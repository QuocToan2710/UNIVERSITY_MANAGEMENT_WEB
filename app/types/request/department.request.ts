export type DepartmentRequest = {
  departmentCode: string;
  name: string;
  description?: string;
};

export type DepartmentPayload = DepartmentRequest;

export const emptyDepartment: DepartmentPayload = {
  departmentCode: '',
  name: '',
  description: '',
};
