export type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type SelectOption = {
  value: string;
  label: string;
  code?: string;
  extra?: string;
};

export type ComboType =
  | 'DEPARTMENT'
  | 'MAJOR'
  | 'BUILDING'
  | 'FLOOR'
  | 'ROOM'
  | 'ROOM_TYPE'
  | 'SUBJECT'
  | 'COURSE_CLASS'
  | 'TEACHER'
  | 'CLASS_GROUP'
  | 'DEGREE'
  | 'EXAM_FORMAT'
  | 'ROOM_STATUS'
  | 'STUDENT_STATUS'
  | 'ACADEMIC_YEAR'
  | 'SEMESTER'
  | (string & {});
