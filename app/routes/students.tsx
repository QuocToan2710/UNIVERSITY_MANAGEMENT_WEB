import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { StudentForm } from "../components/forms/student-form";
import { PlusIcon, StudentIcon } from "../components/icons";
import { Pagination } from "../components/pagination";
import { SearchExportBar, type FilterField } from "../components/search-export-bar";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import { exportToExcel } from "../lib/excel";
import type { Student } from "../types/student";

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    studentCode: "",
    fullName: "",
    gender: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Student | null | undefined>(undefined);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadStudents() {
    setLoading(true);
    setError("");
    try {
      setStudents(
        await apiListRequest<Student>("/students?size=1000").catch(async () => apiListRequest<Student>("/students/all"))
      );
    } catch (reason) {
      const apiError = reason as ApiError;
      if (apiError.status === 401) navigate("/login");
      else setError(apiError.message || "Không tải được danh sách sinh viên.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const code = (filters.studentCode || "").trim().toLowerCase();
    const name = (filters.fullName || "").trim().toLowerCase();
    const mail = (filters.email || "").trim().toLowerCase();

    return students.filter((student) => {
      if (term && !`${student.studentCode} ${student.fullName} ${student.email}`.toLocaleLowerCase().includes(term)) {
        return false;
      }
      if (code && !(student.studentCode || "").toLowerCase().includes(code)) return false;
      if (name && !(student.fullName || "").toLowerCase().includes(name)) return false;
      if (mail && !(student.email || "").toLowerCase().includes(mail)) return false;
      return true;
    });
  }, [students, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const totalItems = visibleStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleStudents.slice(start, start + pageSize);
  }, [visibleStudents, currentPage, pageSize]);

  async function handleExport() {
    setExporting(true);
    try {
      let exportData: Student[] = [];
      try {
        exportData = await apiRequest<Student[]>("/students/export", {
          method: "POST",
          body: JSON.stringify({ keyword: search, ...filters }),
        });
      } catch {
        exportData = visibleStudents;
      }

      exportToExcel(
        exportData,
        "Danh_Sach_Sinh_Vien",
        "SinhVien",
        [
          { key: "studentCode", header: "Mã Sinh Viên" },
          { key: "fullName", header: "Họ và Tên" },
          { key: "email", header: "Email" },
          { key: "phoneNumber", header: "Số điện thoại" },
          { key: "gender", header: "Giới tính" },
          { key: "dob", header: "Ngày sinh" },
          { key: "address", header: "Địa chỉ" },
          { key: "classGroupName", header: "Lớp hành chính" },
          { key: "majorName", header: "Ngành đào tạo" },
        ]
      );
    } catch {
      alert("Không thể xuất danh sách sinh viên.");
    } finally {
      setExporting(false);
    }
  }

  const filterFields: FilterField[] = [
    { key: "studentCode", label: "Mã Sinh viên", placeholder: "Ví dụ: SV2026..." },
    { key: "fullName", label: "Họ và Tên", placeholder: "Ví dụ: Nguyễn Văn..." },
    { key: "email", label: "Email", placeholder: "Ví dụ: @student.edu.vn..." },
  ];

  async function confirmDeleteStudent() {
    if (!deletingStudent) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/students/${deletingStudent.id}`, { method: "DELETE" });
      setDeletingStudent(null);
      await loadStudents();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa sinh viên.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Quản lý Sinh viên" description="Danh sách hồ sơ học viên trong hệ thống đào tạo EduManage.">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                <StudentIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách sinh viên</h2>
            </div>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusIcon size={16} />
            <span>Thêm sinh viên mới</span>
          </button>
        </div>

        {/* Search & Export Controls Bar */}
        <SearchExportBar
          keyword={search}
          onKeywordChange={setSearch}
          filterFields={filterFields}
          filterValues={filters}
          onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          onResetFilters={() => setFilters({ studentCode: "", fullName: "", email: "" })}
          onExport={handleExport}
          exporting={exporting}
        />

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Sinh viên</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Giới tính</th>
                <th className="px-6 py-4">Địa chỉ</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu sinh viên…
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có sinh viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{student.fullName}</p>
                      <p className="mt-0.5 text-[11px] text-cyan-700 dark:text-cyan-300 font-bold font-mono">{student.studentCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 dark:text-slate-200">{student.email}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{student.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {student.gender}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-6 py-4">
                      {student.fullAddress || student.address ? (
                        <div className="flex items-start gap-1.5" title={student.fullAddress || student.address}>
                          <span className="text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0 text-xs">📍</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2 text-xs leading-relaxed">
                            {student.fullAddress || student.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-xs">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa sinh viên" color="blue" onClick={() => setEditing(student)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa sinh viên" color="red" onClick={() => setDeletingStudent(student)}>
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
        <StudentForm
          student={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadStudents();
          }}
        />
      )}

      {deletingStudent && (
        <ConfirmModal
          title="Xác nhận xóa sinh viên"
          message={`Bạn có chắc chắn muốn xóa hồ sơ sinh viên ${deletingStudent.fullName} (${deletingStudent.studentCode})? Dữ liệu sẽ không thể hoàn tác.`}
          loading={deleting}
          onConfirm={confirmDeleteStudent}
          onClose={() => setDeletingStudent(null)}
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
      ? "text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
