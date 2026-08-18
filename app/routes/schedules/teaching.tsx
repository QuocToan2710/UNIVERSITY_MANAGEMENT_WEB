import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import type { ClassSchedule, User } from "../../types/management";

export default function TeachingSchedulePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState("2024-2025");

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN");

  async function loadTeachingSchedules() {
    setLoading(true);
    setError("");
    try {
      setSchedules(await apiListRequest<ClassSchedule>("/schedules?size=200"));
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

  return (
    <AppShell title="Màn Lịch giảng dạy" description="Quản lý định mức tiết dạy, ca lên lớp và phân công giảng đường cán bộ giảng dạy.">
      {/* Overview Stats Widgets */}
      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tổng số ca dạy</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{schedules.length} Lớp HP</p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Định mức tiết giảng dạy</p>
          <p className="mt-2 text-2xl font-black text-cyan-700 dark:text-cyan-700 dark:text-cyan-300">
            {schedules.reduce((acc, curr) => acc + ((curr.endPeriod ?? 0) >= (curr.startPeriod ?? 0) ? (curr.endPeriod ?? 0) - (curr.startPeriod ?? 0) + (curr.endPeriod !== undefined ? 1 : 0) : 0), 0)} Tiết / Tuần
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phòng máy / Giảng đường</p>
          <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {new Set(schedules.map((s) => s.room)).size} Phòng
          </p>
        </div>
      </div>

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
      </div>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-300 backdrop-blur-md">
          {error}
        </p>
      )}

      {/* Teaching Schedule Table */}
      <div className="mt-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Lớp Học phần</th>
                <th className="px-6 py-4">Giảng viên / Mã GV</th>
                <th className="px-6 py-4">Thời gian lên lớp</th>
                <th className="px-6 py-4">Số tiết</th>
                <th className="px-6 py-4">Giảng đường / Phòng máy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Đang tải dữ liệu lịch giảng dạy...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Chưa có lịch giảng dạy được phân công.
                  </td>
                </tr>
              ) : (
                schedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div>{item.courseClassId || "HP_DEFAULT"}</div>
                      <div className="text-xs text-cyan-700 dark:text-cyan-700 dark:text-cyan-300 font-bold font-mono font-normal">Mã TKB: {item.scheduleCode}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">
                      <div>{item.teacherName || "Giảng viên bộ môn"}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">{item.teacherId || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                        {item.dayOfWeek} • Tiết {item.startPeriod ?? "—"} - {item.endPeriod ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {item.endPeriod !== undefined && item.startPeriod !== undefined ? `${item.endPeriod - item.startPeriod + 1} Tiết` : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{item.room || "Chưa xếp phòng"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
