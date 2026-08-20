export type ClassGroupRequest = {
  classCode: string;
  className: string;
  majorId?: number | string;
  major?: string;
  academicYear?: string;
  homeroomTeacherId?: number | string;
  maxStudents?: number | string;
};

export type ClassGroupPayload = ClassGroupRequest;

export const emptyClassGroup: ClassGroupPayload = {
  classCode: '',
  className: '',
  majorId: '',
  academicYear: '2024-2025',
  homeroomTeacherId: '',
  maxStudents: 50,
};
