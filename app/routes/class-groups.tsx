import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { ClassGroupForm } from "../components/forms/class-group-form";
import { ClassGroupIcon, PlusIcon } from "../components/icons";
import { Pagination } from "../components/pagination";
import { SearchExportBar, type FilterField } from "../components/search-export-bar";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import { exportToExcel } from "../lib/excel";
import type { ClassGroup } from "../types/management";

export default function ClassGroups() {
  const navigate = useNavigate();
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    classCode: "",
    className: "",
    academicYear: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleClassGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const code = (filters.classCode || "").trim().toLowerCase();
    const name = (filters.className || "").trim().toLowerCase();
    const year = (filters.academicYear || "").trim().toLowerCase();

    return classGroups.filter((cg) => {
      if (term && !`${cg.classCode} ${cg.className} ${cg.major || ""} ${cg.homeroomTeacherName || ""}`.toLocaleLowerCase().includes(term)) {
        return false;
      }
      if (code && !(cg.classCode || "").toLowerCase().includes(code)) return false;
      if (name && !(cg.className || "").toLowerCase().includes(name)) return false;
      if (year && !(cg.academicYear || "").toLowerCase().includes(year)) return false;
      return true;
    });
  }, [classGroups, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const totalItems = visibleClassGroups.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedClassGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleClassGroups.slice(start, start + pageSize);
  }, [visibleClassGroups, currentPage, pageSize]);

  async function handleExport() {
    setExporting(true);
    try {
      exportToExcel(
        visibleClassGroups,
        "Danh_Sach_Lop_Hoc",
        "LopHoc",
        [
          { key: "classCode", header: "Mã Lớp" },
          { key: "className", header: "Tên Lớp" },
          { key: "major", header: "Ngành đào tạo" },
          { key: "academicYear", header: "Niên khóa" },
          { key: "homeroomTeacherName", header: "GV Chủ Nhiệm" },
          { key: "currentStudents", header: "Số SV thực tế" },
          { key: "maxStudents", header: "Sĩ số tối đa" },
        ]
      );
    } finally {
      setExporting(false);
    }
  }

  const filterFields: FilterField[] = [
    { key: "classCode", label: "Mã Lớp", placeholder: "Ví dụ: DPM22..." },
    { key: "className", label: "Tên Lớp", placeholder: "Ví dụ: KTPM 01..." },
    { key: "academicYear", label: "Niên khóa", placeholder: "Ví dụ: 2024-2028..." },
  ];

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
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-teal-400/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                <ClassGroupIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách lớp học</h2>
            </div>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-cyan-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusIcon size={16} />
            <span>Thêm Lớp học</span>
          </button>
        </div>

        {/* Search & Export Bar */}
        <SearchExportBar
          keyword={search}
          onKeywordChange={setSearch}
          filterFields={filterFields}
          filterValues={filters}
          onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          onResetFilters={() => setFilters({ classCode: "", className: "", academicYear: "" })}
          onExport={handleExport}
          exporting={exporting}
        />

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Mã & Tên Lớp</th>
                <th className="px-6 py-4">Ngành học</th>
                <th className="px-6 py-4">Niên khóa</th>
                <th className="px-6 py-4">GV Chủ Nhiệm</th>
                <th className="px-6 py-4 text-center">Sĩ số (Thực tế / Tối đa)</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu lớp học…
                  </td>
                </tr>
              ) : paginatedClassGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Chưa có lớp học nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedClassGroups.map((cg) => {
                  const current = cg.currentStudents ?? cg.studentCount ?? 0;
                  const max = cg.maxStudents ?? 50;
                  const percent = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
                  const isFull = current >= max;
                  const isNearFull = current >= max * 0.85;

                  const badgeColor = isFull
                    ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/30"
                    : isNearFull
                    ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30"
                    : "bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-400/30";

                  const barColor = isFull ? "bg-rose-500" : isNearFull ? "bg-amber-500" : "bg-teal-500";

                  return (
                    <tr key={cg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{cg.className}</p>
                        <p className="mt-0.5 text-[11px] text-teal-700 dark:text-teal-300 font-bold font-mono">{cg.classCode}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{cg.major || "Chưa phân ngành"}</td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400 font-mono">{cg.academicYear || "N/A"}</td>
                      <td className="px-6 py-4">
                        {cg.homeroomTeacherName ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200">{cg.homeroomTeacherName}</span>
                        ) : (
                          <span className="text-slate-500 italic">Chưa gán</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${badgeColor}`}>
                            <span>{current}</span>
                            <span className="opacity-60">/</span>
                            <span>{max}</span>
                            <span className="text-[10px] opacity-75 ml-0.5">SV</span>
                          </span>
                          <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
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
      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
