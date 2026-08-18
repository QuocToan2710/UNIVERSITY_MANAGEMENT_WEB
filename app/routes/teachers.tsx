import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { TeacherForm } from "../components/forms/teacher-form";
import { PlusIcon, TeacherIcon } from "../components/icons";
import { Pagination } from "../components/pagination";
import { SearchExportBar, type FilterField } from "../components/search-export-bar";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import { exportToExcel } from "../lib/excel";
import type { Teacher } from "../types/management";

export default function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({
    teacherCode: "",
    fullName: "",
    degree: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Teacher | null | undefined>(undefined);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadTeachers() {
    setLoading(true);
    setError("");
    try {
      setTeachers(
        await apiListRequest<Teacher>("/teachers?size=1000").catch(async () => apiListRequest<Teacher>("/teachers/all"))
      );
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const code = (filters.teacherCode || "").trim().toLowerCase();
    const name = (filters.fullName || "").trim().toLowerCase();
    const deg = (filters.degree || "").trim().toLowerCase();

    return teachers.filter((t) => {
      if (term && !`${t.teacherCode} ${t.fullName} ${t.email} ${t.degree || ""} ${t.departmentName || ""}`.toLowerCase().includes(term)) {
        return false;
      }
      if (code && !(t.teacherCode || "").toLowerCase().includes(code)) return false;
      if (name && !(t.fullName || "").toLowerCase().includes(name)) return false;
      if (deg && !(t.degree || "").toLowerCase().includes(deg)) return false;
      return true;
    });
  }, [teachers, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const totalItems = visibleTeachers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleTeachers.slice(start, start + pageSize);
  }, [visibleTeachers, currentPage, pageSize]);

  async function handleExport() {
    setExporting(true);
    try {
      let exportData: Teacher[] = [];
      try {
        exportData = await apiRequest<Teacher[]>("/teachers/export", {
          method: "POST",
          body: JSON.stringify({ keyword: search, ...filters }),
        });
      } catch {
        exportData = visibleTeachers;
      }

      exportToExcel(
        exportData,
        "Danh_Sach_Giang_Vien",
        "GiangVien",
        [
          { key: "teacherCode", header: "Mã Giảng Viên" },
          { key: "fullName", header: "Họ và Tên" },
          { key: "degree", header: "Học vị" },
          { key: "email", header: "Email" },
          { key: "phoneNumber", header: "Số điện thoại" },
          { key: "departmentName", header: "Khoa/Bộ môn" },
        ]
      );
    } catch {
      alert("Không thể xuất danh sách giảng viên.");
    } finally {
      setExporting(false);
    }
  }

  const filterFields: FilterField[] = [
    { key: "teacherCode", label: "Mã Giảng viên", placeholder: "Ví dụ: GV01..." },
    { key: "fullName", label: "Họ và Tên", placeholder: "Ví dụ: Nguyễn Văn..." },
    { key: "degree", label: "Học vị", placeholder: "Ví dụ: Tiến sĩ..." },
  ];

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
    <AppShell title="Quản lý Giảng viên" description="Danh sách cán bộ giảng dạy, bằng cấp và Khoa trực thuộc trong hệ thống.">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300">
                <TeacherIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách giảng viên</h2>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{teachers.length} giảng viên đã đồng bộ dữ liệu</p>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-slate-900 dark:text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusIcon size={16} />
            <span>Thêm giảng viên mới</span>
          </button>
        </div>

        {/* Search & Export Controls Bar */}
        <SearchExportBar
          keyword={search}
          onKeywordChange={setSearch}
          filterFields={filterFields}
          filterValues={filters}
          onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          onResetFilters={() => setFilters({ teacherCode: "", fullName: "", degree: "" })}
          onExport={handleExport}
          exporting={exporting}
        />

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Giảng viên</th>
                <th className="px-6 py-4">Bằng cấp</th>
                <th className="px-6 py-4">Khoa trực thuộc</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu giảng viên…
                  </td>
                </tr>
              ) : paginatedTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có giảng viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{teacher.fullName}</p>
                      <p className="mt-0.5 text-[11px] text-purple-700 dark:text-violet-300 font-bold font-mono">{teacher.teacherCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.15)]">
                        {teacher.degree || "Thạc sĩ"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {teacher.departmentName || "Chưa phân Khoa"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 dark:text-slate-200">{teacher.email}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{teacher.phoneNumber}</p>
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
          confirmText="Xóa giảng viên"
          confirmVariant="danger"
          isSubmitting={deleting}
          onConfirm={() => void confirmDeleteTeacher()}
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
      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors cursor-pointer ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
