import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { ScheduleForm } from "../components/forms/schedule-form";
import { PlusIcon, ScheduleIcon } from "../components/icons";
import { Timetable } from "../components/timetable";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import type { User } from "../types/management";
import type { ClassSchedule } from "../types/schedule";

export default function Schedule() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [semester, setSemester] = useState("HK1");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<ClassSchedule | null | undefined>(undefined);
  const [deletingSchedule, setDeletingSchedule] = useState<ClassSchedule | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const userRoleNames = user?.roles?.map((r) => r.name.toUpperCase()) || [];
  const isAdmin = userRoleNames.length === 0 || userRoleNames.includes("ADMIN");

  async function loadSchedules() {
    setLoading(true);
    setError("");
    try {
      if (isAdmin) {
        // Admin: lấy toàn bộ lịch
        setSchedules(await apiListRequest<ClassSchedule>("/schedules?size=200"));
      } else {
        // Teacher / Student: xem lịch cá nhân
        setSchedules(
          await apiListRequest<ClassSchedule>(
            `/schedules/my?semester=${semester}&academicYear=${academicYear}`
          ).catch(async () => {
            // Fallback lấy toàn bộ nếu endpoint /my chưa phân quyền
            return await apiListRequest<ClassSchedule>("/schedules?size=200");
          })
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

  async function confirmDelete() {
    if (!deletingSchedule) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/schedules/${deletingSchedule.id}`, { method: "DELETE" });
      setDeletingSchedule(null);
      await loadSchedules();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa lịch học.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell
      title="Thời khóa biểu Lịch học"
      description="Lịch học cố định theo tuần, phân bổ môn học, giảng viên, phòng học và lớp học."
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              <ScheduleIcon size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Lịch học tuần</h2>
              <p className="text-xs text-slate-400">Hiển thị các slot giảng dạy và học tập trong tuần</p>
            </div>
          </div>

          {/* Filter + Admin Action */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Học Kỳ */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs">
              <span className="font-medium text-slate-400">Học kỳ:</span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="bg-transparent font-bold text-cyan-300 outline-none cursor-pointer"
              >
                <option value="HK1" className="bg-slate-900 text-white">Học kỳ 1</option>
                <option value="HK2" className="bg-slate-900 text-white">Học kỳ 2</option>
                <option value="HK3" className="bg-slate-900 text-white">Học kỳ 3 (Hè)</option>
              </select>
            </div>

            {/* Filter Năm Học */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs">
              <span className="font-medium text-slate-400">Năm học:</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-transparent font-bold text-cyan-300 outline-none cursor-pointer"
              >
                <option value="2025-2026" className="bg-slate-900 text-white">2025-2026</option>
                <option value="2024-2025" className="bg-slate-900 text-white">2024-2025</option>
              </select>
            </div>

            {/* Admin add button */}
            {isAdmin && (
              <button
                onClick={() => setEditing(null)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <PlusIcon size={16} />
                <span>Xếp lịch mới</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Timetable Grid View */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-sm text-cyan-400">
              <span className="size-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span>Đang tải lịch học…</span>
            </div>
          </div>
        ) : (
          <Timetable
            schedules={schedules}
            isAdmin={isAdmin}
            onEdit={(sched) => setEditing(sched)}
            onDelete={(sched) => setDeletingSchedule(sched)}
          />
        )}
      </div>

      {editing !== undefined && (
        <ScheduleForm
          schedule={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadSchedules();
          }}
        />
      )}

      {deletingSchedule && (
        <ConfirmModal
          title="Xác nhận xóa slot lịch học"
          message={`Bạn có chắc chắn muốn xóa lịch môn ${deletingSchedule.courseName} (${deletingSchedule.classGroupName}) vào ${deletingSchedule.dayOfWeek}?`}
          loading={deleting}
          onConfirm={confirmDelete}
          onClose={() => setDeletingSchedule(null)}
        />
      )}
    </AppShell>
  );
}
