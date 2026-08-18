import { useMemo } from "react";
import type { ClassSchedule, WeekDay } from "../types/schedule";
import { WEEK_DAY_LABELS, WEEK_DAYS } from "../types/schedule";

type TimetableProps = {
  schedules: ClassSchedule[];
  onEdit?: (schedule: ClassSchedule) => void;
  onDelete?: (schedule: ClassSchedule) => void;
  isAdmin?: boolean;
};

const COLOR_PALETTE = [
  { bg: "bg-sky-50 dark:bg-cyan-500/15 border-sky-300 dark:border-cyan-400/30 text-sky-900 dark:text-cyan-200", badge: "bg-sky-100 text-sky-800 dark:bg-cyan-400/20 dark:text-cyan-300" },
  { bg: "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-400/30 text-indigo-900 dark:text-indigo-200", badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-400/20 dark:text-indigo-300" },
  { bg: "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-400/30 text-emerald-900 dark:text-emerald-200", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300" },
  { bg: "bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-400/30 text-amber-900 dark:text-amber-200", badge: "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300" },
  { bg: "bg-purple-50 dark:bg-purple-500/15 border-purple-300 dark:border-purple-400/30 text-purple-900 dark:text-purple-200", badge: "bg-purple-100 text-purple-800 dark:bg-purple-400/20 dark:text-purple-300" },
  { bg: "bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-400/30 text-rose-900 dark:text-rose-200", badge: "bg-rose-100 text-rose-800 dark:bg-rose-400/20 dark:text-rose-300" },
];

function getColorForCourse(courseId: string | number) {
  const str = String(courseId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

export function Timetable({ schedules, onEdit, onDelete, isAdmin = false }: TimetableProps) {
  // Group schedules by day of week
  const groupedByDay = useMemo(() => {
    const map: Record<WeekDay, ClassSchedule[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };
    schedules.forEach((s) => {
      if (map[s.dayOfWeek]) {
        map[s.dayOfWeek].push(s);
      }
    });
    // Sort each day's schedules by startTime
    Object.keys(map).forEach((day) => {
      map[day as WeekDay].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [schedules]);

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-50 dark:bg-slate-900/50 p-12 text-center backdrop-blur-xl">
        <div className="grid size-16 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-400">
          <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Chưa có lịch học</h3>
        <p className="mt-1 text-xs text-slate-400">Chưa tìm thấy slot lịch học nào theo bộ lọc học kỳ đã chọn.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        {WEEK_DAYS.map((day) => {
          const daySchedules = groupedByDay[day] || [];
          const isSunday = day === "SUNDAY";
          return (
            <div key={day} className={`flex flex-col min-h-[340px] ${isSunday ? "bg-rose-950/10" : ""}`}>
              {/* Header Ngày */}
              <div className={`sticky top-0 z-10 border-b border-white/10 px-3 py-3 text-center backdrop-blur-md ${isSunday ? "bg-rose-950/40 text-rose-400" : "bg-white dark:bg-slate-950/90 text-cyan-400"}`}>
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {WEEK_DAY_LABELS[day]}
                </span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSunday ? "bg-rose-900/40 text-rose-300" : "bg-slate-800 text-slate-400"}`}>
                  {daySchedules.length}
                </span>
              </div>

              {/* Lịch của ngày */}
              <div className="flex-1 p-2.5 space-y-2.5">
                {daySchedules.length === 0 ? (
                  <div className="grid h-24 place-items-center rounded-2xl border border-dashed border-white/5 text-[11px] text-slate-600">
                    Trống
                  </div>
                ) : (
                  daySchedules.map((schedule) => {
                    const style = getColorForCourse(schedule.courseClassId);
                    return (
                      <div
                        key={schedule.id}
                        className={`group relative rounded-2xl border p-3 transition-all hover:scale-[1.02] hover:shadow-lg ${style.bg}`}
                      >
                        {/* Time & Room badges */}
                        <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-bold">
                          <span className={`rounded-md px-1.5 py-0.5 ${style.badge}`}>
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                          <span className="rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            {schedule.room || "Chưa có phòng"}
                          </span>
                        </div>

                        {/* Course info */}
                        <div className="mt-2">
                          <p className="font-bold text-xs leading-snug line-clamp-2 text-slate-900 dark:text-white">
                            {schedule.courseClassName || schedule.courseClassCode || "Môn học"}
                          </p>
                          <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-0.5 font-bold">
                            {schedule.courseClassCode}
                          </p>
                        </div>

                        {/* Teacher & ClassGroup info */}
                        <div className="mt-2 space-y-0.5 border-t border-slate-200 dark:border-white/10 pt-2 text-[11px]">
                          <p className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">GV:</span>
                            <span className="font-semibold truncate">{schedule.teacherName}</span>
                          </p>
                          <p className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <span className="text-[10px] text-slate-500 font-bold">Lớp:</span>
                            <span className="font-bold text-cyan-700 dark:text-cyan-300 truncate">{schedule.teacherCode || "—"}</span>
                          </p>
                        </div>

                        {/* Admin controls */}
                        {isAdmin && (
                          <div className="mt-2.5 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(schedule)}
                                className="rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/40"
                              >
                                Sửa
                              </button>
                            )}
                            {onDelete && (
                              <button
                                type="button"
                                onClick={() => onDelete(schedule)}
                                className="rounded-lg border border-red-400/30 bg-red-500/20 px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-500/40"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  return `${parts[0]}:${parts[1]}`;
}
