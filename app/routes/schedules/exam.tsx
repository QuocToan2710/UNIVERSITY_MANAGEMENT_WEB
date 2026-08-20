import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ExamScheduleForm } from "../../components/forms/exam-schedule-form";
import { ConfirmModal } from "../../components/confirm-modal";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import type { ExamSchedule, User } from "../../types/management";
import { ActionDropdown } from "./timetable";

export default function ExamSchedulePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState("2024-2025");

  const [editing, setEditing] = useState<ExamSchedule | null | undefined>(undefined);
  const [deletingExam, setDeletingExam] = useState<ExamSchedule | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN");

  async function loadExamSchedules() {
    setLoading(true);
    setError("");
    try {
      if (isAdmin) {
        setExams(await apiListRequest<ExamSchedule>("/exam-schedules?size=100"));
      } else {
        setExams(
          await apiListRequest<ExamSchedule>(
            `/exam-schedules/my?semester=${semester}&academicYear=${academicYear}`
          ).catch(async () => await apiListRequest<ExamSchedule>("/exam-schedules?size=100"))
        );
      }
    } catch (reason) {
      const apiError = reason as ApiError;
      if (apiError.status === 401) navigate("/login");
      else setError(apiError.message || "Không tải được dữ liệu lịch thi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExamSchedules();
  }, [semester, academicYear, isAdmin]);

  async function handleDeleteExamConfirm() {
    if (!deletingExam) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/exam-schedules/${deletingExam.id}`, { method: "DELETE" });
      setDeletingExam(null);
      await loadExamSchedules();
    } catch (reason) {
      alert((reason as ApiError).message || "Lỗi khi xóa lịch thi.");
    } finally {
      setDeleting(false);
    }
  }

  function getFormatBadgeColor(format?: string) {
    if (format === "Trắc nghiệm") return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-400/30";
    if (format === "Vấn đáp") return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-400/30";
    if (format === "Thực hành") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/30";
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-400/30";
  }

  return (
    <AppShell title="Tra cứu Lịch thi Học kỳ" description="Xem thông tin chi tiết các ca thi học phần, phòng thi, hình thức thi và cán bộ coi thi.">
      {/* Top Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Học kỳ:</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400"
            >
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
              <option value="3">Học kỳ Hè</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Năm học:</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400"
            >
              <option value="2024-2025">2024 - 2025</option>
              <option value="2025-2026">2025 - 2026</option>
              <option value="2023-2024">2023 - 2024</option>
            </select>
          </div>
        </div>

        {/* Chỉ Admin mới có quyền Tạo lịch thi */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span>+ Tạo ca thi mới</span>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-300 backdrop-blur-md">
          {error}
        </p>
      )}

      {/* Exam Schedule Table */}
      <div className="mt-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Môn thi / Mã ca thi</th>
                <th className="px-6 py-4">Ngày & Ca thi</th>
                <th className="px-6 py-4">Phòng thi</th>
                <th className="px-6 py-4">Hình thức thi</th>
                <th className="px-6 py-4">Cán bộ coi thi</th>
                {isAdmin && <th className="px-6 py-4 text-center">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-xs text-slate-400">
                    Đang tải dữ liệu lịch thi...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-xs text-slate-400">
                    Không có lịch thi nào phù hợp cho tài khoản của bạn.
                  </td>
                </tr>
              ) : (
                exams.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div>{item.name}</div>
                      <div className="text-xs text-cyan-700 dark:text-cyan-300 font-mono font-medium">Mã: {item.examCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{item.examDate}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
                        {String(item.startTime).slice(0, 5)} - {String(item.endTime).slice(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{item.room || "Chưa xếp phòng"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${getFormatBadgeColor(item.examFormat)}`}>
                        {item.examFormat || "Tự luận"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {item.proctorName || "Chưa phân công"}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <ActionDropdown
                          onEdit={() => setEditing(item)}
                          onDelete={() => setDeletingExam(item)}
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
        <ExamScheduleForm
          exam={editing}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            await loadExamSchedules();
          }}
        />
      )}

      {deletingExam && (
        <ConfirmModal
          title="Xác nhận xóa ca thi"
          message={`Bạn có chắc chắn muốn xóa ca thi [${deletingExam.examCode}] - ${deletingExam.name} không?`}
          confirmText="Xóa ca thi"
          confirmVariant="danger"
          isSubmitting={deleting}
          onConfirm={() => void handleDeleteExamConfirm()}
          onClose={() => setDeletingExam(null)}
        />
      )}
    </AppShell>
  );
}
