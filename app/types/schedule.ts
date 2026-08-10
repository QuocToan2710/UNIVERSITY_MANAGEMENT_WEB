export type WeekDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  MONDAY: "Thứ 2",
  TUESDAY: "Thứ 3",
  WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6",
  SATURDAY: "Thứ 7",
  SUNDAY: "Chủ nhật",
};

export const WEEK_DAYS: WeekDay[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export type ClassSchedule = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  classGroupId: string;
  classGroupName: string;
  classGroupCode: string;
  dayOfWeek: WeekDay;
  startTime: string;   // "HH:mm:ss" or "HH:mm"
  endTime: string;
  room: string;
  semester: string;
  academicYear: string;
  note?: string;
};

export type ClassSchedulePayload = {
  courseId: string;
  teacherId: string;
  classGroupId: string;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  room: string;
  semester: string;
  academicYear: string;
  note?: string;
};

export const emptyClassSchedule: ClassSchedulePayload = {
  courseId: "",
  teacherId: "",
  classGroupId: "",
  dayOfWeek: "MONDAY",
  startTime: "07:30",
  endTime: "09:30",
  room: "A1.101",
  semester: "HK1",
  academicYear: "2025-2026",
  note: "",
};
