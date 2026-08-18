export type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

export const WEEK_DAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export type ClassScheduleResponse = {
  id: number | string;
  scheduleCode: string;
  name: string;
  courseClassId: number | string;
  courseClassCode?: string;
  courseClassName?: string;
  teacherId: number | string;
  teacherName?: string;
  teacherCode?: string;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  startPeriod?: number;
  endPeriod?: number;
  room: string;
  semester: string;
  academicYear: string;
  note?: string;
};

export type ClassSchedule = ClassScheduleResponse;

export type ExamScheduleResponse = {
  id: number | string;
  examCode: string;
  name: string;
  courseClassId?: number | string;
  subjectId?: number | string;
  subjectName?: string;
  subjectCode?: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string;
  examFormat: string;
  proctorId?: number | string;
  proctorName?: string;
  semester: string;
  academicYear: string;
};

export type ExamSchedule = ExamScheduleResponse;
