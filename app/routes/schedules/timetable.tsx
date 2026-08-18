import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ScheduleForm } from "../../components/forms/schedule-form";
import { ConfirmModal } from "../../components/confirm-modal";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import { exportToExcel } from "../../lib/excel";
import type { User } from "../../types/management";
import type { ClassSchedule, WeekDay } from "../../types/schedule";
import { WEEK_DAYS, WEEK_DAY_LABELS } from "../../types/schedule";
import { PlusIcon, ScheduleIcon, SearchIcon } from "../../components/icons";

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

const CARD_THEMES = [
  {
    bg: "bg-sky-50 dark:bg-gradient-to-br dark:from-cyan-950/60 dark:via-slate-900/90 dark:to-cyan-900/40",
    border: "border-sky-300 hover:border-sky-400 dark:border-cyan-400/40 dark:hover:border-cyan-300",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/30",
    accent: "text-sky-700 dark:text-cyan-400",
    glow: "shadow-xs dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]",
  },
  {
    bg: "bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-950/60 dark:via-slate-900/90 dark:to-indigo-900/40",
    border: "border-indigo-300 hover:border-indigo-400 dark:border-indigo-400/40 dark:hover:border-indigo-300",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400/30",
    accent: "text-indigo-700 dark:text-indigo-400",
    glow: "shadow-xs dark:hover:shadow-[0_0_20px_rgba(129,140,248,0.25)]",
  },
  {
    bg: "bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-950/60 dark:via-slate-900/90 dark:to-emerald-900/40",
    border: "border-emerald-300 hover:border-emerald-400 dark:border-emerald-400/40 dark:hover:border-emerald-300",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30",
    accent: "text-emerald-700 dark:text-emerald-400",
    glow: "shadow-xs dark:hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]",
  },
  {
    bg: "bg-amber-50 dark:bg-gradient-to-br dark:from-amber-950/60 dark:via-slate-900/90 dark:to-amber-900/40",
    border: "border-amber-300 hover:border-amber-400 dark:border-amber-400/40 dark:hover:border-amber-300",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/30",
    accent: "text-amber-700 dark:text-amber-400",
    glow: "shadow-xs dark:hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]",
  },
  {
    bg: "bg-purple-50 dark:bg-gradient-to-br dark:from-purple-950/60 dark:via-slate-900/90 dark:to-purple-900/40",
    border: "border-purple-300 hover:border-purple-400 dark:border-purple-400/40 dark:hover:border-purple-300",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-400/30",
    accent: "text-purple-700 dark:text-purple-400",
    glow: "shadow-xs dark:hover:shadow-[0_0_20px_rgba(192,132,252,0.25)]",
  },
  {
    bg: "bg-rose-50 dark:bg-gradient-to-br dark:from-rose-950/60 dark:via-slate-900/90 dark:to-rose-900/40",
    border: "border-rose-300 hover:border-rose-400 dark:border-rose-400/40 dark:hover:border-rose-300",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/30",
    accent: "text-rose-700 dark:text-rose-400",
    glow: "shadow-xs dark:hover:shadow-[0_0_20px_rgba(251,113,133,0.25)]",
  },
];

function getThemeForSubject(identifier: string | number) {
  const str = String(identifier || "default");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CARD_THEMES.length;
  return CARD_THEMES[index];
}

function matchScheduleToShift(schedule: ClassSchedule, shift: ShiftDefinition): boolean {
  if (schedule.startPeriod && schedule.endPeriod) {
    return (
      (schedule.startPeriod >= shift.startPeriod && schedule.startPeriod <= shift.endPeriod) ||
      (schedule.endPeriod >= shift.startPeriod && schedule.endPeriod <= shift.endPeriod)
    );
  }
  const start = schedule.startTime || "07:00";
  if (shift.id === 1 && start < "09:30") return true;
  if (shift.id === 2 && start >= "09:30" && start < "12:30") return true;
  if (shift.id === 3 && start >= "12:30" && start < "15:30") return true;
  if (shift.id === 4 && start >= "15:30" && start < "18:00") return true;
  if (shift.id === 5 && start >= "18:00") return true;
  return false;
}

function formatHour(timeStr?: string) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  return `${parts[0]}:${parts[1] || "00"}`;
}

export default function TimetablePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("ALL");
  const [selectedRoom, setSelectedRoom] = useState("ALL");
  const [viewMode, setViewMode] = useState<"MATRIX" | "COLUMNS" | "LIST">("MATRIX");

  // Modals & State
  const [viewingDetail, setViewingDetail] = useState<ClassSchedule | null>(null);
  const [editing, setEditing] = useState<ClassSchedule | null | undefined>(undefined);
  const [deletingSchedule, setDeletingSchedule] = useState<ClassSchedule | null>(null);
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

  async function loadSchedules() {
    setLoading(true);
    setError("");
    try {
      if (isAdmin) {
        setSchedules(await apiListRequest<ClassSchedule>("/schedules?size=300"));
      } else {
        setSchedules(
          await apiListRequest<ClassSchedule>(
            `/schedules/my?semester=${semester}&academicYear=${academicYear}`
          ).catch(async () => await apiListRequest<ClassSchedule>("/schedules?size=300"))
        );
      }
    } catch (reason) {
      const apiError = reason as ApiError;
      if (apiError.status === 401) navigate("/login");
      else setError(apiError.message || "Không tải được dữ liệu thời khóa biểu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, [semester, academicYear, isAdmin]);

  // Extract unique filter options
  const teacherOptions = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => {
      if (s.teacherName) set.add(s.teacherName);
    });
    return Array.from(set).sort();
  }, [schedules]);

  const roomOptions = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => {
      if (s.room) set.add(s.room);
    });
    return Array.from(set).sort();
  }, [schedules]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      // Semester & Year
      if (item.semester && item.semester !== semester) return false;
      if (item.academicYear && item.academicYear !== academicYear) return false;

      // Teacher filter
      if (selectedTeacher !== "ALL" && item.teacherName !== selectedTeacher) return false;

      // Room filter
      if (selectedRoom !== "ALL" && item.room !== selectedRoom) return false;

      // Keyword search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const full = `${item.name || ""} ${item.courseClassName || ""} ${item.courseClassCode || ""} ${item.teacherName || ""} ${item.room || ""} ${item.scheduleCode || ""} ${item.note || ""}`.toLowerCase();
        if (!full.includes(kw)) return false;
      }

      return true;
    });
  }, [schedules, semester, academicYear, selectedTeacher, selectedRoom, searchKeyword]);

  // Quick stats
  const totalClasses = filteredSchedules.length;
  const totalRoomsUsed = new Set(filteredSchedules.map((s) => s.room).filter(Boolean)).size;
  const totalTeachers = new Set(filteredSchedules.map((s) => s.teacherName).filter(Boolean)).size;
  const totalPeriods = filteredSchedules.reduce((acc, s) => {
    const p = s.endPeriod && s.startPeriod ? s.endPeriod - s.startPeriod + 1 : 3;
    return acc + p;
  }, 0);

  // Grouping for matrix
  const matrixData = useMemo(() => {
    const matrix: Record<number, Record<WeekDay, ClassSchedule[]>> = {};
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
        matrix[shift.id][day] = filteredSchedules.filter(
          (s) => s.dayOfWeek === day && matchScheduleToShift(s, shift)
        );
      });
    });
    return matrix;
  }, [filteredSchedules]);

  async function handleDeleteConfirm() {
    if (!deletingSchedule) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/schedules/${deletingSchedule.id}`, { method: "DELETE" });
      setDeletingSchedule(null);
      setViewingDetail(null);
      await loadSchedules();
    } catch (reason) {
      alert((reason as ApiError).message || "Lỗi khi xóa lịch học.");
    } finally {
      setDeleting(false);
    }
  }

  function handleExportExcel() {
    exportToExcel(
      filteredSchedules,
      `Thoi_Khoa_Bieu_HK${semester}_${academicYear.replace("-", "_")}`,
      "ThoiKhoaBieu",
      [
        { key: "scheduleCode", header: "Mã TKB" },
        { key: "name", header: "Tên lịch học" },
        { key: "courseClassName", header: "Lớp học phần" },
        { key: "dayOfWeek", header: "Thứ trong tuần" },
        { key: "startTime", header: "Giờ bắt đầu" },
        { key: "endTime", header: "Giờ kết thúc" },
        { key: "startPeriod", header: "Tiết bắt đầu" },
        { key: "endPeriod", header: "Tiết kết thúc" },
        { key: "room", header: "Phòng học" },
        { key: "teacherName", header: "Giảng viên" },
        { key: "semester", header: "Học kỳ" },
        { key: "academicYear", header: "Năm học" },
        { key: "note", header: "Ghi chú" },
      ]
    );
  }

  function handlePrint() {
    window.print();
  }

  return (
    <AppShell
      title="Bảng Thời khóa biểu Toàn trường"
      description="Xem chi tiết lịch giảng dạy & học tập theo ma trận ca học, tiết học từ Thứ 2 đến Chủ nhật."
    >
      {/* Top Overview KPI Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-3xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-slate-900/60 p-5 backdrop-blur-xl shadow-xs dark:shadow-xl hover:border-cyan-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Lớp học phần</span>
            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">HK{semester}</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? "…" : totalClasses}</p>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Tổng số ca học trong kỳ</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-slate-900/60 p-5 backdrop-blur-xl shadow-xs dark:shadow-xl hover:border-indigo-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Thời lượng tuần</span>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">7 ngày</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-indigo-900 dark:text-indigo-200">{loading ? "…" : totalPeriods}</p>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Tổng số tiết học / tuần</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-slate-900/60 p-5 backdrop-blur-xl shadow-xs dark:shadow-xl hover:border-emerald-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phòng & Giảng đường</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Active</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">{loading ? "…" : totalRoomsUsed}</p>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Phòng học & Lab máy tính</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-slate-900/60 p-5 backdrop-blur-xl shadow-xs dark:shadow-xl hover:border-purple-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Giảng viên đứng lớp</span>
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">Cán bộ</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-purple-900 dark:text-purple-200">{loading ? "…" : totalTeachers}</p>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Giảng viên tham gia giảng dạy</p>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-5 backdrop-blur-2xl shadow-xs dark:shadow-2xl mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Main Selection Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Học kỳ:</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
                <option value="3">Học kỳ Hè</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Năm học:</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="2024-2025">2024 - 2025</option>
                <option value="2025-2026">2025 - 2026</option>
                <option value="2023-2024">2023 - 2024</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Giảng viên:</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400 max-w-[180px] truncate"
              >
                <option value="ALL">Tất cả giảng viên</option>
                {teacherOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phòng:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400"
              >
                <option value="ALL">Tất cả phòng</option>
                {roomOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons & View Mode Toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setViewMode("MATRIX")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "MATRIX"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Ma trận Ca học
              </button>
              <button
                type="button"
                onClick={() => setViewMode("COLUMNS")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "COLUMNS"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Cột 7 Ngày
              </button>
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "LIST"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Dạng Bảng
              </button>
            </div>

            {/* Export & Print */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm"
              title="Xuất file Excel"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8M8 17h8M8 9h2" />
              </svg>
              <span>Xuất Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-100 dark:bg-slate-950/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all"
              title="In thời khóa biểu"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>In TKB</span>
            </button>

            {(isAdmin || isTeacher) && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
              >
                <PlusIcon size={16} />
                <span>Thêm lịch học</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm nhanh môn học, mã lớp HP, phòng học, giảng viên phụ trách..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-cyan-400/50 transition-all"
          />
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-300 backdrop-blur-md">
          {error}
        </p>
      )}

      {/* VIEW MODE 1: MATRIX TABLE (Theo Ca & Tiết học x 7 Ngày trong tuần bao gồm Chủ nhật) */}
      {viewMode === "MATRIX" && (
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-white dark:bg-slate-900/90 shadow-2xl backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[1100px]">
              {/* Header: Ca / Tiết + 7 Ngày trong tuần */}
              <thead>
                <tr className="border-b border-white/15 bg-slate-100 dark:bg-slate-950">
                  <th className="w-44 p-4 text-center text-xs font-extrabold uppercase tracking-wider text-cyan-300 border-r border-slate-200 dark:border-white/10 sticky left-0 z-20 bg-slate-100 dark:bg-slate-950">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <ScheduleIcon size={20} className="text-cyan-400" />
                      <span>Ca / Tiết học</span>
                    </div>
                  </th>
                  {WEEK_DAYS.map((day) => {
                    const isSunday = day === "SUNDAY";
                    return (
                      <th
                        key={day}
                        className={`p-4 text-center text-xs font-extrabold uppercase tracking-wider border-r border-slate-200 dark:border-white/10 last:border-r-0 ${
                          isSunday
                            ? "bg-rose-950/40 text-rose-300"
                            : "bg-slate-100 dark:bg-slate-950 text-slate-200"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-black">{WEEK_DAY_LABELS[day]}</span>
                          {isSunday && (
                            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/30 uppercase">
                              Cuối tuần
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body: Các hàng tương ứng với 5 Ca học */}
              <tbody className="divide-y divide-white/10">
                {SHIFTS.map((shift) => {
                  return (
                    <tr key={shift.id} className="hover:bg-slate-800/20 transition-colors">
                      {/* Cột 1: Thông tin Ca & Tiết học */}
                      <td className="p-4 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/90 align-top sticky left-0 z-10">
                        <div className="space-y-1.5 text-center">
                          <span className="inline-block rounded-xl bg-cyan-500/15 px-2.5 py-1 text-xs font-black text-cyan-300 border border-cyan-400/30">
                            {shift.name}
                          </span>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{shift.periods}</p>
                          <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-cyan-400 bg-white dark:bg-slate-900/80 rounded-lg py-1 px-1.5 border border-slate-200 dark:border-white/5">
                            <span>⏰ {shift.timeRange}</span>
                          </div>
                        </div>
                      </td>

                      {/* 7 Cột Ngày trong tuần */}
                      {WEEK_DAYS.map((day) => {
                        const cellSchedules = matrixData[shift.id]?.[day] || [];
                        const isSunday = day === "SUNDAY";
                        return (
                          <td
                            key={day}
                            className={`p-2.5 align-top border-r border-slate-200 dark:border-white/10 last:border-r-0 min-w-[155px] ${
                              isSunday ? "bg-rose-950/5" : ""
                            }`}
                          >
                            {cellSchedules.length === 0 ? (
                              <div className="h-28 rounded-2xl border border-dashed border-slate-200 dark:border-white/5 grid place-items-center text-[11px] text-slate-600 select-none">
                                Trống
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {cellSchedules.map((item) => {
                                  const theme = getThemeForSubject(item.courseClassId || item.name);
                                  const periodText =
                                    item.startPeriod && item.endPeriod
                                      ? `Tiết ${item.startPeriod} - ${item.endPeriod}`
                                      : shift.periods;
                                  const timeText =
                                    item.startTime && item.endTime
                                      ? `${formatHour(item.startTime)} - ${formatHour(item.endTime)}`
                                      : shift.timeRange;

                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => setViewingDetail(item)}
                                      className={`group relative cursor-pointer rounded-2xl border p-3.5 shadow-lg transition-all duration-200 hover:-translate-y-1 ${theme.bg} ${theme.border} ${theme.glow}`}
                                    >
                                      {/* Header: Ca & Giờ */}
                                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold mb-1.5">
                                        <span className={`rounded-md px-1.5 py-0.5 border ${theme.badgeBg}`}>
                                          {shift.name.split(" ")[0]} • {periodText}
                                        </span>
                                        <span className="text-slate-300 font-semibold">{timeText}</span>
                                      </div>

                                      {/* Tên Môn & Lớp HP */}
                                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                                        {item.courseClassName || item.name || "Học phần"}
                                      </p>
                                      <p className="text-[10px] font-mono text-cyan-300 mt-0.5 font-semibold">
                                        {item.courseClassCode || item.scheduleCode}
                                      </p>

                                      {/* Phòng học & Giảng viên */}
                                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/10 space-y-1 text-[11px]">
                                        <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
                                          <span className="text-amber-400 font-bold">🏢</span>
                                          <span className="font-bold text-amber-300 truncate">
                                            {item.room || "Chưa xếp phòng"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                          <span className="text-cyan-400">👨‍🏫</span>
                                          <span className="font-medium truncate">{item.teacherName || "GV Bộ môn"}</span>
                                        </div>
                                      </div>

                                      {/* Action buttons hover */}
                                      <div className="mt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-semibold text-cyan-300">Xem chi tiết ↗</span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: 7-COLUMNS VIEW (Cột 7 ngày từ Thứ 2 đến Chủ nhật) */}
      {viewMode === "COLUMNS" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {WEEK_DAYS.map((day) => {
              const daySchedules = filteredSchedules
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
              const isSunday = day === "SUNDAY";

              return (
                <div key={day} className={`flex flex-col min-h-[380px] ${isSunday ? "bg-rose-950/10" : ""}`}>
                  {/* Header Ngày */}
                  <div
                    className={`sticky top-0 z-10 border-b border-slate-200 dark:border-white/10 px-3 py-3.5 text-center backdrop-blur-md ${
                      isSunday ? "bg-rose-950/60 text-rose-300" : "bg-white dark:bg-slate-950/90 text-cyan-400"
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">
                      {WEEK_DAY_LABELS[day]}
                    </span>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isSunday ? "bg-rose-900/40 text-rose-300" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {daySchedules.length}
                    </span>
                  </div>

                  {/* Danh sách lớp trong ngày */}
                  <div className="flex-1 p-3 space-y-3">
                    {daySchedules.length === 0 ? (
                      <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-slate-200 dark:border-white/5 text-xs text-slate-600 select-none">
                        Không có lịch
                      </div>
                    ) : (
                      daySchedules.map((schedule) => {
                        const theme = getThemeForSubject(schedule.courseClassId || schedule.name);
                        return (
                          <div
                            key={schedule.id}
                            onClick={() => setViewingDetail(schedule)}
                            className={`group relative cursor-pointer rounded-2xl border p-3.5 transition-all hover:scale-[1.02] hover:shadow-lg ${theme.bg} ${theme.border} ${theme.glow}`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1.5">
                              <span className={`rounded-md px-1.5 py-0.5 border ${theme.badgeBg}`}>
                                ⏰ {formatHour(schedule.startTime)} - {formatHour(schedule.endTime)}
                              </span>
                              <span className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950/80 px-1.5 py-0.5 text-slate-300 text-[10px]">
                                {schedule.startPeriod && schedule.endPeriod
                                  ? `Tiết ${schedule.startPeriod}-${schedule.endPeriod}`
                                  : "Ca học"}
                              </span>
                            </div>

                            <p className="font-bold text-xs leading-snug text-slate-900 dark:text-white line-clamp-2">
                              {schedule.courseClassName || schedule.name || "Môn học"}
                            </p>
                            <p className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 font-bold mt-0.5">
                              {schedule.courseClassCode || schedule.scheduleCode}
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] space-y-1">
                              <p className="text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                                <span>🏢</span>
                                <span className="truncate">{schedule.room || "Chưa xếp phòng"}</span>
                              </p>
                              <p className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                                <span>👨‍🏫</span>
                                <span className="truncate">{schedule.teacherName || "GV Bộ môn"}</span>
                              </p>
                            </div>
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

      {/* VIEW MODE 3: DETAILED LIST TABLE (Dạng Bảng Danh sách chi tiết) */}
      {viewMode === "LIST" && (
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-white dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-950/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-4">Mã TKB / Tên Lịch</th>
                  <th className="px-6 py-4">Lớp Học Phần</th>
                  <th className="px-6 py-4">Thứ trong tuần</th>
                  <th className="px-6 py-4">Ca / Tiết học</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Phòng học</th>
                  <th className="px-6 py-4">Giảng viên</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      Không tìm thấy lịch học nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setViewingDetail(item)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{item.scheduleCode}</p>
                        <p className="text-xs text-slate-400">{item.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-cyan-300">{item.courseClassName || item.courseClassId}</span>
                        <p className="text-[11px] font-mono text-slate-400">{item.courseClassCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${
                            item.dayOfWeek === "SUNDAY"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-cyan-500/10 text-cyan-300 border border-cyan-400/30"
                          }`}
                        >
                          {WEEK_DAY_LABELS[item.dayOfWeek] || item.dayOfWeek}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {item.startPeriod && item.endPeriod ? `Tiết ${item.startPeriod} - ${item.endPeriod}` : "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatHour(item.startTime)} - {formatHour(item.endTime)}
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-300">{item.room || "Chưa có"}</td>
                      <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{item.teacherName || "—"}</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setViewingDetail(item)}
                          className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all mr-2"
                        >
                          Chi tiết
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditing(item)}
                              className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all mr-2"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSchedule(item)}
                              className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (Khi bấm vào bất kỳ Thẻ Tiết học / Lớp học nào) */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-100 dark:bg-slate-950/80 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-400/30 bg-white dark:bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-400/40">
                  <ScheduleIcon size={24} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Chi tiết Lịch học & Ca giảng dạy</h3>
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono mt-0.5 font-bold">{viewingDetail.scheduleCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDetail(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Môn học & Học phần</p>
                <p className="text-sm font-extrabold text-cyan-700 dark:text-cyan-300">{viewingDetail.courseClassName || viewingDetail.name}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">Mã HP: {viewingDetail.courseClassCode || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thứ trong tuần</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {WEEK_DAY_LABELS[viewingDetail.dayOfWeek]}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phòng học</p>
                  <p className="text-sm font-extrabold text-amber-700 dark:text-amber-300 mt-1">
                    🏢 {viewingDetail.room || "Chưa xếp phòng"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Khung giờ lên lớp</p>
                  <p className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300 font-bold font-mono mt-1">
                    ⏰ {formatHour(viewingDetail.startTime)} - {formatHour(viewingDetail.endTime)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tiết học</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {viewingDetail.startPeriod && viewingDetail.endPeriod
                      ? `Tiết ${viewingDetail.startPeriod} đến Tiết ${viewingDetail.endPeriod}`
                      : "Theo ca học chuẩn"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Giảng viên phụ trách</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  👨‍🏫 {viewingDetail.teacherName || "Chưa phân công"}
                </p>
              </div>

              {viewingDetail.note && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ghi chú</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">{viewingDetail.note}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Học kỳ {viewingDetail.semester} • Năm học {viewingDetail.academicYear}
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(viewingDetail);
                        setViewingDetail(null);
                      }}
                      className="rounded-xl border border-amber-400/30 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingSchedule(viewingDetail);
                        setViewingDetail(null);
                      }}
                      className="rounded-xl border border-red-400/30 bg-red-500/20 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30 transition-all"
                    >
                      Xóa
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewingDetail(null)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-700 transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL Tạo / Sửa Lịch học */}
      {editing !== undefined && (
        <ScheduleForm
          schedule={editing}
          onSaved={() => {
            setEditing(undefined);
            void loadSchedules();
          }}
          onClose={() => setEditing(undefined)}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingSchedule && (
        <ConfirmModal
          title="Xác nhận xóa lịch học"
          message={`Bạn có chắc muốn xóa lịch học "${deletingSchedule.name || deletingSchedule.scheduleCode}" (${WEEK_DAY_LABELS[deletingSchedule.dayOfWeek]})?`}
          confirmLabel="Xóa lịch này"
          cancelLabel="Hủy"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingSchedule(null)}
        />
      )}
    </AppShell>
  );
}
