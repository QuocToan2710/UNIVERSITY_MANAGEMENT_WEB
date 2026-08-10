import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { ClassGroupForm } from "../components/forms/class-group-form";
import { ClassGroupIcon, PlusIcon, SearchIcon } from "../components/icons";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import type { ClassGroup } from "../types/management";

export default function ClassGroups() {
  const navigate = useNavigate();
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ClassGroup | null | undefined>(undefined);
  const [deletingGroup, setDeletingGroup] = useState<ClassGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadClassGroups() {
    setLoading(true);
    setError("");
    try {
      setClassGroups(await apiListRequest<ClassGroup>("/class-groups/all"));
    } catch (reason) {
      const apiError = reason as ApiError;
      if (apiError.status === 401) navigate("/login");
      else setError(apiError.message || "Không tải được danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClassGroups();
  }, []);

  const visibleClassGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return term
      ? classGroups.filter((cg) =>
          `${cg.classCode} ${cg.className} ${cg.major || ""} ${cg.homeroomTeacherName || ""}`
            .toLocaleLowerCase()
            .includes(term)
        )
      : classGroups;
  }, [classGroups, search]);

  async function confirmDelete() {
    if (!deletingGroup) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/class-groups/${deletingGroup.id}`, { method: "DELETE" });
      setDeletingGroup(null);
      await loadClassGroups();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa lớp học.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Quản lý Lớp học" description="Danh sách các lớp hành chính, gán giáo viên chủ nhiệm và ngành đào tạo.">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-teal-400/30 bg-teal-500/10 text-teal-300">
                <ClassGroupIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-white">Danh sách lớp học</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">{classGroups.length} lớp học trong hệ thống</p>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-green-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <PlusIcon size={16} />
            <span>Tạo lớp học mới</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-white/5 p-4 bg-slate-950/40">
          <div className="relative flex items-center sm:max-w-md">
            <span className="pointer-events-none absolute left-4 text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Tìm theo mã lớp, tên lớp, ngành hoặc GVCN..."
            />
          </div>
        </div>

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-teal-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Mã & Tên Lớp</th>
                <th className="px-6 py-4">Ngành học</th>
                <th className="px-6 py-4">Niên khóa</th>
                <th className="px-6 py-4">GV Chủ Nhiệm</th>
                <th className="px-6 py-4 text-center">Sĩ số</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu lớp học…
                  </td>
                </tr>
              ) : visibleClassGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Chưa có lớp học nào phù hợp.
                  </td>
                </tr>
              ) : (
                visibleClassGroups.map((cg) => (
                  <tr key={cg.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-100">{cg.className}</p>
                      <p className="mt-0.5 text-[11px] text-teal-300 font-mono">{cg.classCode}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{cg.major || "Chưa phân ngành"}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono">{cg.academicYear || "N/A"}</td>
                    <td className="px-6 py-4">
                      {cg.homeroomTeacherName ? (
                        <span className="font-medium text-slate-200">{cg.homeroomTeacherName}</span>
                      ) : (
                        <span className="text-slate-500 italic">Chưa gán</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-300 border border-teal-400/20">
                        {cg.studentCount} SV
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa lớp học" color="teal" onClick={() => setEditing(cg)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa lớp học" color="red" onClick={() => setDeletingGroup(cg)}>
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
        <ClassGroupForm
          classGroup={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadClassGroups();
          }}
        />
      )}

      {deletingGroup && (
        <ConfirmModal
          title="Xác nhận xóa lớp học"
          message={`Bạn có chắc chắn muốn xóa lớp học ${deletingGroup.className} (${deletingGroup.classCode})?`}
          loading={deleting}
          onConfirm={confirmDelete}
          onClose={() => setDeletingGroup(null)}
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
  color: "teal" | "red";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tones =
    color === "teal"
      ? "text-teal-400 hover:bg-teal-500/10 hover:text-teal-300"
      : "text-red-400 hover:bg-red-500/10 hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
