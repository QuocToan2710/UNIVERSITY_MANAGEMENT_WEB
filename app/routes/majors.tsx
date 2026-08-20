import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { MajorForm } from "../components/forms/major-form";
import { MajorIcon, PlusIcon } from "../components/icons";
import { Pagination } from "../components/pagination";
import { SearchExportBar, type FilterField } from "../components/search-export-bar";
import { ApiError, apiListRequest, apiRequest, fetchMasterData } from "../lib/api";
import { exportToExcel } from "../lib/excel";
import type { Department, Major } from "../types/management";

export default function Majors() {
  const navigate = useNavigate();
  const [majors, setMajors] = useState<Major[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    majorCode: "",
    name: "",
    departmentId: "ALL",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Major | null | undefined>(undefined);
  const [deletingMajor, setDeletingMajor] = useState<Major | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadMajors() {
    setLoading(true);
    setError("");
    try {
      const [majorData, deptData] = await Promise.all([
        apiListRequest<Major>("/majors?size=1000").catch(async () => apiListRequest<Major>("/majors")),
        fetchMasterData("DEPARTMENT")
          .then((opts) => opts.map((o) => ({ id: o.value, departmentCode: o.code || String(o.value), name: o.label } as Department)))
          .catch(async () => apiListRequest<Department>("/departments/all").catch(() => [])),
      ]);
      setMajors(majorData);
      setDepartments(deptData);
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách ngành học.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMajors();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const departmentMap = useMemo(() => {
    return new Map(departments.map((d) => [String(d.id), d]));
  }, [departments]);

  const visibleMajors = useMemo(() => {
    const term = search.trim().toLowerCase();
    const code = (filters.majorCode || "").trim().toLowerCase();
    const nameFilter = (filters.name || "").trim().toLowerCase();
    const deptFilter = filters.departmentId;

    return majors.filter((m) => {
      const deptName = m.departmentName || (m.departmentId ? departmentMap.get(String(m.departmentId))?.name : "") || "";
      if (term && !`${m.majorCode} ${m.name} ${deptName}`.toLowerCase().includes(term)) {
        return false;
      }
      if (code && !(m.majorCode || "").toLowerCase().includes(code)) return false;
      if (nameFilter && !(m.name || "").toLowerCase().includes(nameFilter)) return false;
      if (deptFilter && deptFilter !== "ALL" && String(m.departmentId || "") !== String(deptFilter)) return false;
      return true;
    });
  }, [majors, search, filters, departmentMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const totalItems = visibleMajors.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedMajors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleMajors.slice(start, start + pageSize);
  }, [visibleMajors, currentPage, pageSize]);

  function handleExport() {
    setExporting(true);
    try {
      const exportData = visibleMajors.map((m) => ({
        majorCode: m.majorCode,
        name: m.name,
        departmentName: m.departmentName || (m.departmentId ? departmentMap.get(String(m.departmentId))?.name : "") || "Chưa phân Khoa",
      }));

      exportToExcel(
        exportData,
        "Danh_Sach_Nganh_Hoc",
        "NganhHoc",
        [
          { key: "majorCode", header: "Mã Ngành" },
          { key: "name", header: "Tên Ngành Học" },
          { key: "departmentName", header: "Khoa Quản Lý" },
        ]
      );
    } finally {
      setExporting(false);
    }
  }

  const filterFields: FilterField[] = [
    { key: "majorCode", label: "Mã ngành", placeholder: "Ví dụ: CNTT, KTPM..." },
    { key: "name", label: "Tên ngành học", placeholder: "Ví dụ: Công nghệ thông tin..." },
    {
      key: "departmentId",
      label: "Khoa trực thuộc",
      type: "select",
      options: [
        { value: "ALL", label: "Tất cả Khoa" },
        ...departments.map((d) => ({ value: String(d.id), label: d.name })),
      ],
    },
  ];

  async function confirmDeleteMajor() {
    if (!deletingMajor) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/majors/${deletingMajor.id}`, { method: "DELETE" });
      setDeletingMajor(null);
      await loadMajors();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa ngành học.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Quản lý Ngành học" description="Danh sách ngành đào tạo và Khoa quản lý trực thuộc trong hệ thống EduManage.">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <MajorIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách ngành học</h2>
            </div>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusIcon size={16} />
            <span>Thêm ngành học mới</span>
          </button>
        </div>

        {/* Search & Export Toolbar with Advanced Filter */}
        <SearchExportBar
          keyword={search}
          onKeywordChange={setSearch}
          filterFields={filterFields}
          filterValues={filters}
          onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          onResetFilters={() => setFilters({ majorCode: "", name: "", departmentId: "ALL" })}
          onExport={handleExport}
          exporting={exporting}
        />

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Mã ngành</th>
                <th className="px-6 py-4">Tên ngành học</th>
                <th className="px-6 py-4">Khoa trực thuộc</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu ngành học…
                  </td>
                </tr>
              ) : paginatedMajors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    Chưa có ngành học nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedMajors.map((major) => (
                  <tr key={major.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {major.majorCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{major.name}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                      {major.departmentName || (major.departmentId ? departmentMap.get(String(major.departmentId))?.name : null) || "Chưa phân Khoa"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa ngành học" color="blue" onClick={() => setEditing(major)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa ngành học" color="red" onClick={() => setDeletingMajor(major)}>
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
        <MajorForm
          major={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadMajors();
          }}
        />
      )}

      {deletingMajor && (
        <ConfirmModal
          title="Xác nhận xóa ngành học"
          message={`Bạn có chắc chắn muốn xóa ngành học ${deletingMajor.name} (${deletingMajor.majorCode})? Dữ liệu sẽ không thể hoàn tác.`}
          confirmText="Xóa ngành học"
          confirmVariant="danger"
          isSubmitting={deleting}
          onConfirm={() => void confirmDeleteMajor()}
          onClose={() => setDeletingMajor(null)}
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
      ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300"
      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors cursor-pointer ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
