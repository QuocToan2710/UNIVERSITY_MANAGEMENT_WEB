import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ScheduleForm } from "../../components/forms/schedule-form";
import { ConfirmModal } from "../../components/confirm-modal";
import { ActionDropdown } from "./timetable";
import { CloseIcon, DownloadIcon, PlusIcon, RefreshIcon, SearchIcon } from "../../components/icons";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import { exportToExcel } from "../../lib/excel";
import type { User } from "../../types/management";
import type { ClassSchedule } from "../../types/schedule";

export default function TeachingSchedulePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState("2024-2025");

  const [editing, setEditing] = useState<ClassSchedule | null | undefined>(undefined);
  const [deletingSchedule, setDeletingSchedule] = useState<ClassSchedule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewingSchedule, setViewingSchedule] = useState<ClassSchedule | null>(null);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN") || (user?.username || "").toLowerCase() === "admin";
  const isTeacher = userRoleNames.includes("TEACHER");

  async function loadTeachingSchedules() {
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
      else setError(apiError.message || "Không tải được lịch giảng dạy.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeachingSchedules();
  }, [semester, academicYear, isAdmin]);

  // Filtered schedules based on search and semester/year
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchSem = !s.semester || s.semester === semester || s.semester === `HK${semester}`;
      const matchYear = !s.academicYear || s.academicYear === academicYear;
      if (!matchSem || !matchYear) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (s.scheduleCode && s.scheduleCode.toLowerCase().includes(q)) ||
        (s.courseClassId && String(s.courseClassId).toLowerCase().includes(q)) ||
        (s.teacherName && s.teacherName.toLowerCase().includes(q)) ||
        (s.teacherId && String(s.teacherId).toLowerCase().includes(q)) ||
        (s.room && s.room.toLowerCase().includes(q))
      );
    });
  }, [schedules, semester, academicYear, search]);

  async function handleDeleteConfirm() {
    if (!deletingSchedule) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/schedules/${deletingSchedule.id}`, { method: "DELETE" });
      setDeletingSchedule(null);
      await loadTeachingSchedules();
    } catch (reason) {
      alert((reason as ApiError).message || "Lỗi khi xóa lịch giảng dạy.");
    } finally {
      setDeleting(false);
    }
  }

  function handleExportExcel() {
    exportToExcel(
      filteredSchedules as unknown as Record<string, unknown>[],
      `Lich_Giang_Day_HK${semester}_${academicYear}`,
      "LichGiangDay",
      [
        { key: "scheduleCode", header: "Mã Thời Khóa Biểu" },
        { key: "courseClassId", header: "Lớp Học Phần" },
        { key: "teacherName", header: "Giảng Viên Phụ Trách" },
        { key: "dayOfWeek", header: "Thứ" },
        { key: "startTime", header: "Giờ Bắt Đầu" },
        { key: "endTime", header: "Giờ Kết Thúc" },
        { key: "startPeriod", header: "Tiết Bắt Đầu" },
        { key: "endPeriod", header: "Tiết Kết Thúc" },
        { key: "room", header: "Phòng Học / Giảng Đường" },
        { key: "semester", header: "Học Kỳ" },
        { key: "academicYear", header: "Năm Học" },
      ]
    );
  }

  const totalPeriods = filteredSchedules.reduce((acc, curr) => {
    if (curr.endPeriod !== undefined && curr.startPeriod !== undefined && curr.endPeriod >= curr.startPeriod) {
      return acc + (curr.endPeriod - curr.startPeriod + 1);
    }
    return acc;
  }, 0);

  const uniqueRooms = new Set(filteredSchedules.map((s) => s.room).filter(Boolean)).size;

  return (
    <AppShell
      title="Lịch giảng dạy"
      description="Quản lý định mức tiết dạy, ca lên lớp và phân công giảng đường của cán bộ giảng viên."
    >
      {/* Overview Stats Widgets */}
      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng số ca dạy</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{filteredSchedules.length} Lớp HP</p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Định mức tiết giảng dạy</p>
          <p className="mt-2 text-2xl font-black text-cyan-600 dark:text-cyan-300">
            {totalPeriods} Tiết / Tuần
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phòng máy / Giảng đường</p>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">
            {uniqueRooms} Phòng
          </p>
        </div>
      </div>

      {/* Top Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Học kỳ:</span>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="1" className="text-slate-900">Học kỳ 1</option>
              <option value="2" className="text-slate-900">Học kỳ 2</option>
              <option value="3" className="text-slate-900">Học kỳ Hè</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Năm học:</span>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="2024-2025" className="text-slate-900">2024 - 2025</option>
              <option value="2025-2026" className="text-slate-900">2025 - 2026</option>
              <option value="2026-2027" className="text-slate-900">2026 - 2027</option>
            </select>
          </div>

          <div className="relative w-60">
            <input
              type="text"
              placeholder="Mã TKB, lớp HP, GV, phòng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-slate-100"
            />
            <SearchIcon size={14} className="text-slate-400 absolute left-2.5 top-2" />
          </div>

          <button
            type="button"
            onClick={() => void loadTeachingSchedules()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshIcon size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {filteredSchedules.length > 0 && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <DownloadIcon size={14} />
              Xuất Excel
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 text-xs font-bold shadow-md transition cursor-pointer"
            >
              <PlusIcon size={14} />
              <span>Phân công lịch dạy</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Teaching Schedule Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-700 dark:text-cyan-300 font-bold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="w-12 px-3 py-3.5 text-center">STT</th>
                <th className="w-48 px-4 py-3.5">Lớp Học Phần</th>
                <th className="px-4 py-3.5 min-w-[160px]">Giảng Viên Phụ Trách</th>
                <th className="px-4 py-3.5 min-w-[150px]">Thời Gian Lên Lớp</th>
                <th className="w-20 px-3 py-3.5 text-center">Số Tiết</th>
                <th className="px-4 py-3.5 min-w-[130px]">Giảng Đường / Phòng</th>
                <th className="w-16 px-3 py-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Đang tải dữ liệu lịch giảng dạy...
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Chưa có lịch giảng dạy nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      <div>{item.courseClassId || "HP_DEFAULT"}</div>
                      <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">Mã TKB: {item.scheduleCode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                      <div className="font-bold">{item.teacherName || "Giảng viên bộ môn"}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.teacherId || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                        {item.dayOfWeek} • Tiết {item.startPeriod ?? "—"} - {item.endPeriod ?? "—"}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.startTime} - {item.endTime}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.endPeriod !== undefined && item.startPeriod !== undefined && item.endPeriod >= item.startPeriod
                        ? `${item.endPeriod - item.startPeriod + 1} Tiết`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                        {item.room || "Chưa xếp phòng"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <ActionDropdown
                        onView={() => setViewingSchedule(item)}
                        onEdit={isAdmin ? () => setEditing(item) : undefined}
                        onDelete={isAdmin ? () => setDeletingSchedule(item) : undefined}
                        canEdit={isAdmin}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add / Edit Form */}
      {editing !== undefined && (
        <ScheduleForm
          schedule={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadTeachingSchedules();
          }}
        />
      )}

      {/* Modal 2: View Detail */}
      {viewingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingSchedule(null)}>
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Chi Tiết Lịch Giảng Dạy</h3>
              <button onClick={() => setViewingSchedule(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer">
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Mã TKB:</span>
                <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400">{viewingSchedule.scheduleCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Lớp Học Phần:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{viewingSchedule.courseClassId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Giảng Viên:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{viewingSchedule.teacherName || "Chưa gán"} ({viewingSchedule.teacherId || "—"})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Thứ trong tuần:</span>
                <span className="font-bold">{viewingSchedule.dayOfWeek}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Tiết học:</span>
                <span className="font-bold">Tiết {viewingSchedule.startPeriod} - {viewingSchedule.endPeriod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Thời gian:</span>
                <span className="font-bold">{viewingSchedule.startTime} - {viewingSchedule.endTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Phòng học:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{viewingSchedule.room || "Chưa xếp phòng"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Học kỳ / Năm học:</span>
                <span className="font-bold">HK{viewingSchedule.semester} ({viewingSchedule.academicYear})</span>
              </div>
              {viewingSchedule.note && (
                <div className="pt-2 text-slate-500 dark:text-slate-400">
                  <span className="font-bold">Ghi chú:</span> {viewingSchedule.note}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingSchedule(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Delete */}
      <ConfirmModal
        open={Boolean(deletingSchedule)}
        title="Xóa Lịch Giảng Dạy"
        description={`Bạn có chắc chắn muốn xóa lịch giảng dạy của lớp học phần "${deletingSchedule?.courseClassId}" (${deletingSchedule?.scheduleCode}) không? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa lịch dạy"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingSchedule(null)}
      />
    </AppShell>
  );
}
