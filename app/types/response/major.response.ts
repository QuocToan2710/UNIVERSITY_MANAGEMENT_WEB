export type MajorResponse = {
  id: number | string;
  majorCode: string;
  name: string;
  departmentId?: number | string;
  departmentName?: string;
};

export type Major = MajorResponse;
