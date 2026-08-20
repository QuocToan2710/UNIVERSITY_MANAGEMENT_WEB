export type ClassGroupResponse = {
  id: number | string;
  classCode: string;
  className: string;
  majorId?: number | string;
  major?: string;
  majorName?: string;
  academicYear: string;
  homeroomTeacherId: number | string | null;
  homeroomTeacherName: string | null;
  studentCount?: number;
  currentStudents?: number;
  maxStudents?: number;
};

export type ClassGroup = ClassGroupResponse;
