import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ScheduleForm } from "../../components/forms/schedule-form";
import { ConfirmModal } from "../../components/confirm-modal";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import type { User } from "../../types/management";
import type { ClassSchedule } from "../../types/schedule";
import { ActionDropdown } from "./timetable";

export default function ClassSchedulePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState("2024-2025");

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

  async function loadSchedules() {
    setLoading(true);
    setError("");
    try {
      if (isAdmin) {
        setSchedules(await apiListRequest<ClassSchedule>("/schedules?size=200"));
      } else {
        setSchedules(
          await apiListRequest<ClassSchedule>(
            `/schedules/my?semester=${semester}&academicYear=${academicYear}`
          ).catch(async () => await apiListRequest<ClassSchedule>("/schedules?size=200"))
        );
      }
    } catch (reason) {
      const apiError = reason as ApiError;
      if (apiError.status === 401) navigate("/login");
      else setError(apiError.message || "Không tải được lịch học.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, [semester, academicYear, isAdmin]);

  async function handleDeleteConfirm() {
    if (!deletingSchedule) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/schedules/${deletingSchedule.id}`, { method: "DELETE" });
      setDeletingSchedule(null);
      await loadSchedules();
    } catch (reason) {
      alert((reason as ApiError).message || "Lỗi khi xóa thời khóa biểu.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Màn Lịch học" description="Thời khóa biểu các môn học dành cho sinh viên và hệ thống đào tạo.">
      {/* Top Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Học kỳ:</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-400"
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
              className="rounded-xl border border-white/10 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-400"
            >
              <option value="2024-2025">2024 - 2025</option>
              <option value="2023-2024">2023 - 2024</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:brightness-110 transition-all cursor-pointer"
          >
            <span>+ Tạo lịch học mới</span>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-300 backdrop-blur-md">
          {error}
        </p>
      )}

      {/* Schedule Table */}
      <div className="mt-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Mã môn / Lớp HP</th>
                <th className="px-6 py-4">Thứ / Tiết học</th>
                <th className="px-6 py-4">Phòng học</th>
                <th className="px-6 py-4">Giảng viên phụ trách</th>
                <th className="px-6 py-4">Học kỳ / Năm</th>
                {isAdmin && <th className="px-6 py-4 text-center">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-xs text-slate-400">
                    Đang tải dữ liệu thời khóa biểu...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-xs text-slate-400">
                    Chưa có dữ liệu lịch học nào cho học kỳ này.
                  </td>
                </tr>
              ) : (
                schedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div>{item.courseClassId || "HP_DEFAULT"}</div>
                      <div className="text-xs text-cyan-700 dark:text-cyan-300 font-mono font-medium">Mã: {item.scheduleCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                        {item.dayOfWeek} • Tiết {item.startPeriod} - {item.endPeriod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{item.room || "Chưa xếp phòng"}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <div>{item.teacherName || "Giảng viên bộ môn"}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">{item.teacherId || "—"}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                      HK{item.semester} ({item.academicYear})
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <ActionDropdown
                          onEdit={() => setEditing(item)}
                          onDelete={() => setDeletingSchedule(item)}
                          canEdit={isAdmin}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== undefined && (
        <ScheduleForm
          schedule={editing}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            await loadSchedules();
          }}
        />
      )}

      {deletingSchedule && (
        <ConfirmModal
          title="Xác nhận xóa thời khóa biểu"
          message={`Bạn có chắc chắn muốn xóa lịch học [${deletingSchedule.scheduleCode}] phòng ${deletingSchedule.room || ""} không?`}
          confirmText="Xóa lịch học"
          confirmVariant="danger"
          isSubmitting={deleting}
          onConfirm={() => void handleDeleteConfirm()}
          onClose={() => setDeletingSchedule(null)}
        />
      )}
    </AppShell>
  );
}
