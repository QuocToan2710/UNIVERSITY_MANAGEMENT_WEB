import type { WeekDay } from '../response/schedule.response';

export type ClassScheduleRequest = {
  courseClassId: number | string;
  teacherId: number | string;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  room: string;
  semester: string;
  academicYear: string;
  note?: string;
};

export type ClassSchedulePayload = ClassScheduleRequest;

export const emptyClassSchedule: ClassSchedulePayload = {
  courseClassId: '',
  teacherId: '',
  dayOfWeek: 'MONDAY',
  startTime: '07:30',
  endTime: '09:30',
  room: 'A1.101',
  semester: 'HK1',
  academicYear: '2025-2026',
  note: '',
};

export type ExamScheduleRequest = {
  examCode: string;
  name: string;
  subjectId?: number | string;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string;
  examFormat: string;
  proctorName?: string;
  semester: string;
  academicYear: string;
};

export type ExamSchedulePayload = ExamScheduleRequest;

export const emptyExamSchedule: ExamSchedulePayload = {
  examCode: '',
  name: '',
  subjectId: '',
  examDate: new Date().toISOString().split('T')[0],
  startTime: '08:00',
  endTime: '10:00',
  room: 'Phòng A2-402',
  examFormat: 'Tự luận',
  proctorName: '',
  semester: '1',
  academicYear: '2024-2025',
};
