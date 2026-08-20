import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ScheduleForm } from "../../components/forms/schedule-form";
import { ExamScheduleForm } from "../../components/forms/exam-schedule-form";
import { ConfirmModal } from "../../components/confirm-modal";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import { exportToExcel } from "../../lib/excel";
import type { ExamSchedule, User } from "../../types/management";
import type { ClassSchedule, WeekDay } from "../../types/schedule";
import { WEEK_DAYS, WEEK_DAY_LABELS } from "../../types/schedule";
import { PlusIcon, SearchIcon } from "../../components/icons";

export function ActionDropdown({
  onView,
  onEdit,
  onDelete,
  canEdit = false,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs active:scale-95 cursor-pointer"
        title="Tùy chọn hành động"
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-1 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-left">
          {onView && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onView();
              }}
              className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Xem chi tiết
            </button>
          )}

          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
            >
              Chỉnh sửa
            </button>
          )}

          {canEdit && onDelete && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              Xóa lịch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export type ShiftDefinition = {
  id: number;
  name: string;
  session: "MORNING" | "AFTERNOON" | "EVENING";
  periods: string;
  timeRange: string;
  startPeriod: number;
  endPeriod: number;
};

export const SHIFTS: ShiftDefinition[] = [
  {
    id: 1,
    name: "Ca 1 (Sáng)",
    session: "MORNING",
    periods: "Tiết 1 - 3",
    timeRange: "07:00 - 09:15",
    startPeriod: 1,
    endPeriod: 3,
  },
  {
    id: 2,
    name: "Ca 2 (Sáng)",
    session: "MORNING",
    periods: "Tiết 4 - 6",
    timeRange: "09:30 - 11:45",
    startPeriod: 4,
    endPeriod: 6,
  },
  {
    id: 3,
    name: "Ca 3 (Chiều)",
    session: "AFTERNOON",
    periods: "Tiết 7 - 9",
    timeRange: "13:00 - 15:15",
    startPeriod: 7,
    endPeriod: 9,
  },
  {
    id: 4,
    name: "Ca 4 (Chiều)",
    session: "AFTERNOON",
    periods: "Tiết 10 - 12",
    timeRange: "15:30 - 17:45",
    startPeriod: 10,
    endPeriod: 12,
  },
  {
    id: 5,
    name: "Ca 5 (Tối)",
    session: "EVENING",
    periods: "Tiết 13 - 15",
    timeRange: "18:00 - 20:15",
    startPeriod: 13,
    endPeriod: 15,
  },
];

export type UnifiedScheduleItem = {
  type: "CLASS" | "EXAM";
  id: string | number;
  originalId: string | number;
  code: string;
  name: string;
  subCode?: string;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  startPeriod?: number;
  endPeriod?: number;
  room: string;
  teacherOrProctor?: string;
  semester: string;
  academicYear: string;
  note?: string;
  examDate?: string;
  examFormat?: string;
  rawClass?: ClassSchedule;
  rawExam?: ExamSchedule;
};

const CLASS_THEME = {
  borderLeft: "border-l-sky-500",
  bg: "bg-sky-50/70 dark:bg-sky-950/20 hover:bg-sky-100/70 dark:hover:bg-sky-950/35",
  border: "border-sky-200 dark:border-sky-500/20",
  badge: "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300",
  roomBadge: "bg-white/90 dark:bg-slate-900 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30",
};

function getClassTheme() {
  return CLASS_THEME;
}

function getWeekDayFromDate(dateStr?: string): WeekDay {
  if (!dateStr) return "MONDAY";
  try {
    const cleanStr = String(dateStr).split("T")[0];
    const parts = cleanStr.split("-").map(Number);
    let d: Date;
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(dateStr);
    }
    const day = d.getDay();
    const mapping: Record<number, WeekDay> = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
    };
    return mapping[day] || "MONDAY";
  } catch {
    return "MONDAY";
  }
}

function matchItemToShift(item: UnifiedScheduleItem, shift: ShiftDefinition): boolean {
  if (item.startPeriod && item.endPeriod) {
    return (
      (item.startPeriod >= shift.startPeriod && item.startPeriod <= shift.endPeriod) ||
      (item.endPeriod >= shift.startPeriod && item.endPeriod <= shift.endPeriod)
    );
  }
  const start = item.startTime || "07:00";
  if (shift.id === 1 && start < "09:30") return true;
  if (shift.id === 2 && start >= "09:30" && start < "12:30") return true;
  if (shift.id === 3 && start >= "12:30" && start < "15:30") return true;
  if (shift.id === 4 && start >= "15:30" && start < "18:00") return true;
  if (shift.id === 5 && start >= "18:00") return true;
  return false;
}

function formatHour(timeStr?: string) {
  if (!timeStr) return "";
  const parts = String(timeStr).split(":");
  return `${parts[0]}:${parts[1] || "00"}`;
}

export default function TimetablePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState<"ALL" | "CLASS" | "EXAM">("ALL");
  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("ALL");
  const [selectedRoom, setSelectedRoom] = useState("ALL");
  const [viewMode, setViewMode] = useState<"MATRIX" | "COLUMNS" | "LIST">("MATRIX");

  // Modals & State
  const [viewingDetail, setViewingDetail] = useState<UnifiedScheduleItem | null>(null);
  const [editingClass, setEditingClass] = useState<ClassSchedule | null | undefined>(undefined);
  const [editingExam, setEditingExam] = useState<ExamSchedule | null | undefined>(undefined);
  const [deletingItem, setDeletingItem] = useState<UnifiedScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN");
  const isTeacher = userRoleNames.includes("TEACHER") || userRoleNames.includes("ROLE_TEACHER");

  async function loadAllData() {
    setLoading(true);
    setError("");
    try {
      if (isAdmin) {
        const [classes, exams] = await Promise.all([
          apiListRequest<ClassSchedule>("/schedules?size=300").catch(() => []),
          apiListRequest<ExamSchedule>("/exam-schedules?size=200").catch(() => []),
        ]);
        setClassSchedules(classes);
        setExamSchedules(exams);
      } else {
        const [classes, exams] = await Promise.all([
          apiListRequest<ClassSchedule>(`/schedules/my?semester=${semester}&academicYear=${academicYear}`)
            .catch(async () => await apiListRequest<ClassSchedule>("/schedules?size=300").catch(() => [])),
          apiListRequest<ExamSchedule>(`/exam-schedules/my?semester=${semester}&academicYear=${academicYear}`)
            .catch(async () => await apiListRequest<ExamSchedule>("/exam-schedules?size=200").catch(() => [])),
        ]);
        setClassSchedules(classes);
        setExamSchedules(exams);
      }
    } catch (reason) {
      const apiError = reason as ApiError;
      if (apiError.status === 401) navigate("/login");
      else setError(apiError.message || "Không tải được dữ liệu thời khóa biểu & lịch thi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAllData();
  }, [semester, academicYear, isAdmin]);

  // Base Counts for Term (before scheduleType filter)
  const allTermClassCount = useMemo(() => {
    return classSchedules.filter((c) => {
      if (c.semester && c.semester !== semester) return false;
      if (c.academicYear && c.academicYear !== academicYear) return false;
      return true;
    }).length;
  }, [classSchedules, semester, academicYear]);

  const allTermExamCount = useMemo(() => {
    return examSchedules.filter((e) => {
      if (e.semester && e.semester !== semester) return false;
      if (e.academicYear && e.academicYear !== academicYear) return false;
      return true;
    }).length;
  }, [examSchedules, semester, academicYear]);

  // Combine into Unified Items based on scheduleTypeFilter
  const unifiedItems: UnifiedScheduleItem[] = useMemo(() => {
    const list: UnifiedScheduleItem[] = [];

    if (scheduleTypeFilter === "ALL" || scheduleTypeFilter === "CLASS") {
      classSchedules.forEach((c) => {
        list.push({
          type: "CLASS",
          id: `class-${c.id}`,
          originalId: c.id,
          code: c.scheduleCode,
          name: c.courseClassName || c.name || "Học phần",
          subCode: c.courseClassCode,
          dayOfWeek: c.dayOfWeek,
          startTime: c.startTime,
          endTime: c.endTime,
          startPeriod: c.startPeriod,
          endPeriod: c.endPeriod,
          room: c.room,
          teacherOrProctor: c.teacherName,
          semester: c.semester,
          academicYear: c.academicYear,
          note: c.note,
          rawClass: c,
        });
      });
    }

    if (scheduleTypeFilter === "ALL" || scheduleTypeFilter === "EXAM") {
      examSchedules.forEach((e) => {
        list.push({
          type: "EXAM",
          id: `exam-${e.id}`,
          originalId: e.id,
          code: e.examCode,
          name: e.subjectName || e.name || "Môn thi",
          subCode: e.subjectCode,
          dayOfWeek: getWeekDayFromDate(e.examDate),
          startTime: e.startTime,
          endTime: e.endTime,
          room: e.room,
          teacherOrProctor: e.proctorName,
          semester: e.semester,
          academicYear: e.academicYear,
          examDate: e.examDate,
          examFormat: e.examFormat || "Tự luận",
          rawExam: e,
        });
      });
    }

    return list;
  }, [classSchedules, examSchedules, scheduleTypeFilter]);

  // Extract unique filter options
  const teacherOptions = useMemo(() => {
    const set = new Set<string>();
    unifiedItems.forEach((s) => {
      if (s.teacherOrProctor) set.add(s.teacherOrProctor);
    });
    return Array.from(set).sort();
  }, [unifiedItems]);

  const roomOptions = useMemo(() => {
    const set = new Set<string>();
    unifiedItems.forEach((s) => {
      if (s.room) set.add(s.room);
    });
    return Array.from(set).sort();
  }, [unifiedItems]);

  // Filtered unified schedules
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      if (item.semester && item.semester !== semester) return false;
      if (item.academicYear && item.academicYear !== academicYear) return false;
      if (selectedTeacher !== "ALL" && item.teacherOrProctor !== selectedTeacher) return false;
      if (selectedRoom !== "ALL" && item.room !== selectedRoom) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const full = `${item.name || ""} ${item.code || ""} ${item.subCode || ""} ${item.teacherOrProctor || ""} ${item.room || ""} ${item.note || ""} ${item.examFormat || ""}`.toLowerCase();
        if (!full.includes(kw)) return false;
      }
      return true;
    });
  }, [unifiedItems, semester, academicYear, selectedTeacher, selectedRoom, searchKeyword]);

  // Grouping for matrix
  const matrixData = useMemo(() => {
    const matrix: Record<number, Record<WeekDay, UnifiedScheduleItem[]>> = {};
    SHIFTS.forEach((shift) => {
      matrix[shift.id] = {
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: [],
        SUNDAY: [],
      };
      WEEK_DAYS.forEach((day) => {
        matrix[shift.id][day] = filteredItems.filter(
          (s) => s.dayOfWeek === day && matchItemToShift(s, shift)
        );
      });
    });
    return matrix;
  }, [filteredItems]);

  async function handleDeleteConfirm() {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      if (deletingItem.type === "CLASS") {
        await apiRequest<string>(`/schedules/${deletingItem.originalId}`, { method: "DELETE" });
      } else {
        await apiRequest<string>(`/exam-schedules/${deletingItem.originalId}`, { method: "DELETE" });
      }
      setDeletingItem(null);
      setViewingDetail(null);
      await loadAllData();
    } catch (reason) {
      alert((reason as ApiError).message || "Lỗi khi xóa lịch.");
    } finally {
      setDeleting(false);
    }
  }

  function handleExportExcel() {
    exportToExcel(
      filteredItems.map((item) => ({
        type: item.type === "CLASS" ? "Lịch học" : "Lịch thi",
        code: item.code,
        name: item.name,
        subCode: item.subCode || "",
        dayOfWeek: WEEK_DAY_LABELS[item.dayOfWeek] || item.dayOfWeek,
        date: item.examDate || "",
        time: `${formatHour(item.startTime)} - ${formatHour(item.endTime)}`,
        room: item.room,
        teacherOrProctor: item.teacherOrProctor || "",
        format: item.examFormat || "",
        semester: `HK${item.semester}`,
        academicYear: item.academicYear,
      })),
      `Thoi_Khoa_Bieu_HK${semester}_${academicYear.replace("-", "_")}`,
      "ThoiKhoaBieu",
      [
        { key: "type", header: "Loại lịch" },
        { key: "code", header: "Mã lịch / Ca" },
        { key: "name", header: "Tên môn học / Môn thi" },
        { key: "subCode", header: "Mã HP" },
        { key: "dayOfWeek", header: "Thứ trong tuần" },
        { key: "date", header: "Ngày thi (nếu có)" },
        { key: "time", header: "Thời gian" },
        { key: "room", header: "Phòng" },
        { key: "teacherOrProctor", header: "Giảng viên / CB coi thi" },
        { key: "format", header: "Hình thức thi" },
        { key: "semester", header: "Học kỳ" },
        { key: "academicYear", header: "Năm học" },
      ]
    );
  }

  return (
    <AppShell
      title="Thời khóa biểu & Lịch thi"
      description="Quản lý và tra cứu linh hoạt lịch học tập và lịch thi học kỳ theo tuần, ca và phòng học."
    >
      {/* Top Header & Term Selector */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Term & Schedule Type Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Schedule Type Toggle: Lịch học vs Lịch thi vs Cả hai */}
          <div className="flex items-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setScheduleTypeFilter("ALL")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                scheduleTypeFilter === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tất cả ({allTermClassCount + allTermExamCount})
            </button>
            <button
              type="button"
              onClick={() => setScheduleTypeFilter("CLASS")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                scheduleTypeFilter === "CLASS"
                  ? "bg-cyan-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
              }`}
            >
              <span className="size-2 rounded-full bg-cyan-400" />
              <span>Lịch học ({allTermClassCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleTypeFilter("EXAM")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                scheduleTypeFilter === "EXAM"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              }`}
            >
              <span className="size-2 rounded-full bg-rose-400" />
              <span>Lịch thi ({allTermExamCount})</span>
            </button>
          </div>

          {/* Semester Selector */}
          <div className="flex items-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 p-1 shadow-xs">
            {["1", "2", "3"].map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setSemester(sem)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  semester === sem
                    ? "bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                HK {sem === "3" ? "Hè" : sem}
              </button>
            ))}
          </div>

          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none shadow-xs"
          >
            <option value="2024-2025">2024 - 2025</option>
            <option value="2025-2026">2025 - 2026</option>
            <option value="2023-2024">2023 - 2024</option>
          </select>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
          >
            <svg className="size-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8M8 17h8" />
            </svg>
            <span>Xuất Excel</span>
          </button>

          {(isAdmin || isTeacher) && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="inline-flex items-center gap-1 rounded-2xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                <PlusIcon size={14} />
                <span>Lịch học</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="inline-flex items-center gap-1 rounded-2xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                >
                  <PlusIcon size={14} />
                  <span>Ca thi</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar: Search, Filters & View Mode */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 p-2.5 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm môn học, môn thi, phòng, giảng viên..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-cyan-400 transition-colors"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none max-w-[170px] truncate"
          >
            <option value="ALL">Tất cả GV / CBCT</option>
            {teacherOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Tất cả phòng</option>
            {roomOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setViewMode("MATRIX")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "MATRIX"
                ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Ma trận Tuần
          </button>
          <button
            type="button"
            onClick={() => setViewMode("COLUMNS")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "COLUMNS"
                ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Cột 7 Ngày
          </button>
          <button
            type="button"
            onClick={() => setViewMode("LIST")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "LIST"
                ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Dạng Bảng
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {/* VIEW MODE 1: MATRIX TABLE */}
      {viewMode === "MATRIX" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/80 text-xs">
                  <th className="w-40 p-3.5 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-white/10 sticky left-0 z-20 bg-slate-50 dark:bg-slate-950">
                    Ca / Tiết học
                  </th>
                  {WEEK_DAYS.map((day) => {
                    const isSunday = day === "SUNDAY";
                    return (
                      <th
                        key={day}
                        className={`p-3.5 text-center font-bold border-r border-slate-200 dark:border-white/10 last:border-r-0 ${
                          isSunday ? "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{WEEK_DAY_LABELS[day]}</span>
                          {isSunday && (
                            <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                              CN
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {SHIFTS.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-3 border-r border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-950/70 align-top sticky left-0 z-10 text-center">
                      <span className="inline-block rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 px-2.5 py-0.5 text-xs font-black shadow-xs">
                        {shift.name.split(" ")[0]}
                      </span>
                      <p className="mt-1.5 text-xs font-black text-slate-950 dark:text-white tracking-tight">{shift.periods}</p>
                      <p className="mt-0.5 text-xs font-mono font-black text-slate-950 dark:text-slate-100">{shift.timeRange}</p>
                    </td>

                    {WEEK_DAYS.map((day) => {
                      const cellItems = matrixData[shift.id]?.[day] || [];
                      const isSunday = day === "SUNDAY";
                      return (
                        <td
                          key={day}
                          className={`p-2 align-top border-r border-slate-200 dark:border-white/10 last:border-r-0 min-w-[145px] ${
                            isSunday ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                          }`}
                        >
                          {cellItems.length === 0 ? (
                            <div className="h-20 rounded-xl border border-dashed border-slate-200/70 dark:border-white/5 flex items-center justify-center text-[11px] text-slate-400/60 select-none">
                              -
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {cellItems.map((item) => {
                                const isExam = item.type === "EXAM";
                                const theme = getClassTheme(item.code || item.name);

                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => setViewingDetail(item)}
                                    className={`group cursor-pointer rounded-xl border border-l-4 p-2.5 shadow-2xs transition-all hover:scale-[1.01] hover:shadow-md ${
                                      isExam
                                        ? "border-l-rose-500 bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                                        : `${theme.borderLeft} ${theme.bg} ${theme.border}`
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 text-[10px] font-medium mb-1">
                                      {isExam ? (
                                        <span className="rounded-md bg-rose-500 text-white px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wide">
                                          LỊCH THI
                                        </span>
                                      ) : (
                                        <span className={`rounded-md px-1.5 py-0.5 font-bold ${theme.roomBadge}`}>
                                          {item.room || "P.?"}
                                        </span>
                                      )}
                                      <span className={`font-mono text-[11px] font-extrabold ${isExam ? "text-rose-900 dark:text-rose-300" : "text-slate-950 dark:text-slate-100"}`}>
                                        {formatHour(item.startTime)} - {formatHour(item.endTime)}
                                      </span>
                                    </div>

                                    <p className={`text-xs font-bold line-clamp-2 leading-snug ${isExam ? "text-rose-950 dark:text-rose-100" : "text-slate-950 dark:text-white"}`}>
                                      {item.name}
                                    </p>

                                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                                      {isExam ? (
                                        <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                                          {item.examFormat} • {item.room || "P.?"}
                                        </span>
                                      ) : (
                                        <span className="truncate">{item.teacherOrProctor || "GV Bộ môn"}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: 7-COLUMNS VIEW */}
      {viewMode === "COLUMNS" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
            {WEEK_DAYS.map((day) => {
              const dayItems = filteredItems
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
              const isSunday = day === "SUNDAY";

              return (
                <div key={day} className={`flex flex-col min-h-[360px] ${isSunday ? "bg-rose-50/20 dark:bg-rose-950/10" : ""}`}>
                  <div className={`sticky top-0 z-10 border-b border-slate-200 dark:border-white/10 px-3 py-2.5 text-center backdrop-blur-md ${
                    isSunday ? "bg-rose-50/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300" : "bg-slate-50/90 dark:bg-slate-950/80 text-slate-800 dark:text-slate-200"
                  }`}>
                    <span className="text-xs font-bold">{WEEK_DAY_LABELS[day]}</span>
                    <span className="ml-1.5 rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {dayItems.length}
                    </span>
                  </div>

                  <div className="flex-1 p-2.5 space-y-2.5">
                    {dayItems.length === 0 ? (
                      <div className="grid h-28 place-items-center rounded-xl border border-dashed border-slate-200 dark:border-white/5 text-xs text-slate-400 select-none">
                        Không có lịch
                      </div>
                    ) : (
                      dayItems.map((item) => {
                        const isExam = item.type === "EXAM";
                        const theme = getClassTheme(item.code || item.name);
                        return (
                          <div
                            key={item.id}
                            onClick={() => setViewingDetail(item)}
                            className={`group cursor-pointer rounded-xl border border-l-4 p-3 shadow-2xs transition-all hover:shadow-md ${
                              isExam
                                ? "border-l-rose-500 bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30"
                                : `${theme.borderLeft} ${theme.bg} ${theme.border}`
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                              <span className={`font-extrabold ${isExam ? "text-rose-900 dark:text-rose-300" : "text-slate-950 dark:text-slate-100"}`}>
                                ⏰ {formatHour(item.startTime)} - {formatHour(item.endTime)}
                              </span>
                              {isExam ? (
                                <span className="rounded-md bg-rose-500 text-white px-1.5 py-0.2 text-[9px] font-bold">
                                  THI
                                </span>
                              ) : (
                                <span className={`rounded-md px-1.5 py-0.5 font-bold ${theme.roomBadge}`}>
                                  {item.room || "Chưa có"}
                                </span>
                              )}
                            </div>

                            <p className={`text-xs font-bold line-clamp-2 ${isExam ? "text-rose-950 dark:text-rose-100" : "text-slate-950 dark:text-white"}`}>
                              {item.name}
                            </p>

                            <p className="mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                              {isExam ? `Phòng: ${item.room} • ${item.examFormat}` : (item.teacherOrProctor || "GV Bộ môn")}
                            </p>
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
      )}

      {/* VIEW MODE 3: LIST TABLE VIEW */}
      {viewMode === "LIST" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-xs uppercase tracking-wider text-slate-900 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Loại</th>
                  <th className="px-5 py-3.5">Mã / Tên Lịch</th>
                  <th className="px-5 py-3.5">Thứ / Ngày</th>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5">Phòng</th>
                  <th className="px-5 py-3.5">GV / CBCT</th>
                  <th className="px-5 py-3.5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      Không tìm thấy lịch nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isExam = item.type === "EXAM";
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setViewingDetail(item)}
                        className={`cursor-pointer transition-colors ${
                          isExam
                            ? "bg-rose-50/30 dark:bg-rose-950/15 hover:bg-rose-50/60 dark:hover:bg-rose-950/30"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                              isExam
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30"
                                : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30"
                            }`}
                          >
                            {isExam ? "Lịch thi" : "Lịch học"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-950 dark:text-white">{item.name}</p>
                          <p className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">{item.code}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-950 dark:text-slate-200">
                            {WEEK_DAY_LABELS[item.dayOfWeek] || item.dayOfWeek}
                          </p>
                          {item.examDate && (
                            <p className="text-xs text-rose-700 dark:text-rose-400 font-mono font-bold">
                              {item.examDate}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs font-black text-slate-950 dark:text-slate-100">
                          {formatHour(item.startTime)} - {formatHour(item.endTime)}
                        </td>
                        <td className="px-5 py-3 font-semibold text-amber-700 dark:text-amber-300">{item.room || "Chưa có"}</td>
                        <td className="px-5 py-3 text-slate-800 dark:text-slate-200">{item.teacherOrProctor || "—"}</td>
                        <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <ActionDropdown
                            onView={() => setViewingDetail(item)}
                            onEdit={() => {
                              if (item.type === "CLASS") setEditingClass(item.rawClass || null);
                              else setEditingExam(item.rawExam || null);
                            }}
                            onDelete={() => setDeletingItem(item)}
                            canEdit={isAdmin}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    viewingDetail.type === "EXAM"
                      ? "bg-rose-500 text-white"
                      : "bg-cyan-500 text-white"
                  }`}
                >
                  {viewingDetail.type === "EXAM" ? "Lịch thi" : "Lịch học"}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Chi tiết {viewingDetail.type === "EXAM" ? "Ca thi" : "Lịch học"}</h3>
                  <p className="text-xs text-slate-500 font-mono">{viewingDetail.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDetail(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {viewingDetail.type === "EXAM" ? "Môn thi / Học phần" : "Học phần"}
                </p>
                <p className={`text-sm font-bold mt-0.5 ${viewingDetail.type === "EXAM" ? "text-rose-700 dark:text-rose-300" : "text-cyan-700 dark:text-cyan-300"}`}>
                  {viewingDetail.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Thứ trong tuần</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {WEEK_DAY_LABELS[viewingDetail.dayOfWeek]}
                  </p>
                  {viewingDetail.examDate && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold font-mono mt-0.5">
                      Ngày: {viewingDetail.examDate}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Phòng học / Phòng thi</p>
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                    {viewingDetail.room || "Chưa xếp phòng"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3">
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Khung giờ</p>
                  <p className="text-sm font-extrabold font-mono text-slate-950 dark:text-cyan-300 mt-0.5">
                    {formatHour(viewingDetail.startTime)} - {formatHour(viewingDetail.endTime)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {viewingDetail.type === "EXAM" ? "Hình thức thi" : "Tiết học"}
                  </p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                    {viewingDetail.type === "EXAM"
                      ? (viewingDetail.examFormat || "Tự luận")
                      : (viewingDetail.startPeriod && viewingDetail.endPeriod
                          ? `Tiết ${viewingDetail.startPeriod} - ${viewingDetail.endPeriod}`
                          : "Theo ca")}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {viewingDetail.type === "EXAM" ? "Cán bộ coi thi" : "Giảng viên phụ trách"}
                </p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                  {viewingDetail.teacherOrProctor || "Chưa phân công"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                HK{viewingDetail.semester} • {viewingDetail.academicYear}
              </span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (viewingDetail.type === "CLASS") setEditingClass(viewingDetail.rawClass || null);
                        else setEditingExam(viewingDetail.rawExam || null);
                        setViewingDetail(null);
                      }}
                      className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingItem(viewingDetail);
                        setViewingDetail(null);
                      }}
                      className="rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Xóa
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewingDetail(null)}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CLASS FORM MODAL */}
      {editingClass !== undefined && (
        <ScheduleForm
          schedule={editingClass}
          onSaved={() => {
            setEditingClass(undefined);
            void loadAllData();
          }}
          onClose={() => setEditingClass(undefined)}
        />
      )}

      {/* CREATE / EDIT EXAM FORM MODAL */}
      {editingExam !== undefined && (
        <ExamScheduleForm
          exam={editingExam}
          onSaved={() => {
            setEditingExam(undefined);
            void loadAllData();
          }}
          onClose={() => setEditingExam(undefined)}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingItem && (
        <ConfirmModal
          title={`Xác nhận xóa ${deletingItem.type === "EXAM" ? "lịch thi" : "lịch học"}`}
          message={`Bạn có chắc muốn xóa ${deletingItem.type === "EXAM" ? "ca thi" : "lịch học"} "${deletingItem.name}" (${WEEK_DAY_LABELS[deletingItem.dayOfWeek]})?`}
          confirmLabel="Xóa lịch này"
          cancelLabel="Hủy"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingItem(null)}
        />
      )}
    </AppShell>
  );
}
