import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { TeacherForm } from "../components/forms/teacher-form";
import { PlusIcon, SearchIcon, TeacherIcon } from "../components/icons";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import type { Teacher } from "../types/management";

export default function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Teacher | null | undefined>(undefined);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadTeachers() {
    setLoading(true);
    setError("");
    try {
      setTeachers(await apiListRequest<Teacher>("/teachers"));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách giảng viên.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeachers();
  }, []);

  const visibleTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? teachers.filter((t) =>
          `${t.teacherCode} ${t.fullName} ${t.email} ${t.specialization}`.toLowerCase().includes(term)
        )
      : teachers;
  }, [teachers, search]);

  async function confirmDeleteTeacher() {
    if (!deletingTeacher) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/teachers/${deletingTeacher.id}`, { method: "DELETE" });
      setDeletingTeacher(null);
      await loadTeachers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa giảng viên.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Quản lý Giảng viên" description="Danh sách cán bộ giảng dạy và bộ môn trong hệ thống EduManage.">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300">
                <TeacherIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-white">Danh sách giảng viên</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">{teachers.length} giảng viên đã đồng bộ dữ liệu</p>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <PlusIcon size={16} />
            <span>Thêm giảng viên mới</span>
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-white/5 p-4 bg-slate-950/40">
          <div className="relative flex items-center sm:max-w-md">
            <span className="pointer-events-none absolute left-4 text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Tìm theo mã giảng viên, tên, email hoặc chuyên môn..."
            />
          </div>
        </div>

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-violet-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Giảng viên</th>
                <th className="px-6 py-4">Chuyên môn</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu giảng viên…
                  </td>
                </tr>
              ) : visibleTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    Chưa có giảng viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                visibleTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-100">{teacher.fullName}</p>
                      <p className="mt-0.5 text-[11px] text-violet-300 font-mono">{teacher.teacherCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-300">
                        {teacher.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-200">{teacher.email}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{teacher.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa thông tin" color="blue" onClick={() => setEditing(teacher)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa giảng viên" color="red" onClick={() => setDeletingTeacher(teacher)}>
                        <path d="M4 7h16" />
                        <path d="M10 11v5M14 11v5M6 7l1-3h10l1 3M7 7l1 13h8l1-13" />
                      </ActionIcon>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== undefined && (
        <TeacherForm
          teacher={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadTeachers();
          }}
        />
      )}

      {deletingTeacher && (
        <ConfirmModal
          title="Xác nhận xóa giảng viên"
          message={`Bạn có chắc chắn muốn xóa hồ sơ giảng viên ${deletingTeacher.fullName} (${deletingTeacher.teacherCode})? Dữ liệu sẽ không thể hoàn tác.`}
          loading={deleting}
          onConfirm={confirmDeleteTeacher}
          onClose={() => setDeletingTeacher(null)}
        />
      )}
    </AppShell>
  );
}

function ActionIcon({
  label,
  color,
  onClick,
  children,
}: {
  label: string;
  color: "blue" | "red";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tones =
    color === "blue"
      ? "text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
      : "text-red-400 hover:bg-red-500/10 hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
