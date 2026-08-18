export type MajorRequest = {
  majorCode: string;
  name: string;
  departmentId?: number | string;
};

export type MajorPayload = MajorRequest;

export const emptyMajor: MajorPayload = {
  majorCode: '',
  name: '',
  departmentId: '',
};
