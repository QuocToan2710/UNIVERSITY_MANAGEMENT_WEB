import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { CourseForm } from "../components/forms/course-form";
import { EnrollmentManagementModal } from "../components/forms/enrollment-management-modal";
import { CourseIcon, PlusIcon } from "../components/icons";
import { Pagination } from "../components/pagination";
import { SearchExportBar, type FilterField } from "../components/search-export-bar";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import { exportToExcel } from "../lib/excel";
import type { Course, Teacher } from "../types/management";

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    courseCode: "",
    courseName: "",
    semester: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Course | null | undefined>(undefined);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [managingEnrollmentCourse, setManagingEnrollmentCourse] = useState<Course | null>(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [courseData, teacherData] = await Promise.all([
        apiListRequest<Course>("/courses?size=1000").catch(async () => apiListRequest<Course>("/courses")),
        apiListRequest<Teacher>("/teachers?size=1000").catch(async () => apiListRequest<Teacher>("/teachers")),
      ]);
      setCourses(courseData);
      setTeachers(teacherData);
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải dữ liệu môn học.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const teacherMap = useMemo(() => {
    return new Map(teachers.map((t) => [t.id, t]));
  }, [teachers]);

  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    const code = (filters.courseCode || "").trim().toLowerCase();
    const name = (filters.courseName || "").trim().toLowerCase();
    const sem = (filters.semester || "").trim().toLowerCase();

    return courses.filter((c) => {
      const teacherName = c.teacherId ? teacherMap.get(c.teacherId)?.fullName || "" : "";
      if (term && !`${c.courseCode} ${c.courseName} ${c.semester} ${teacherName}`.toLowerCase().includes(term)) {
        return false;
      }
      if (code && !(c.courseCode || "").toLowerCase().includes(code)) return false;
      if (name && !(c.courseName || "").toLowerCase().includes(name)) return false;
      if (sem && !(c.semester || "").toLowerCase().includes(sem)) return false;
      return true;
    });
  }, [courses, search, filters, teacherMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const totalItems = visibleCourses.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleCourses.slice(start, start + pageSize);
  }, [visibleCourses, currentPage, pageSize]);

  async function handleExport() {
    setExporting(true);
    try {
      const exportData = visibleCourses.map((c) => ({
        ...c,
        teacherName: c.teacherId ? teacherMap.get(c.teacherId)?.fullName || "Chưa phân công" : "Chưa phân công",
      }));

      exportToExcel(
        exportData,
        "Danh_Sach_Mon_Hoc",
        "MonHoc",
        [
          { key: "courseCode", header: "Mã Môn Học" },
          { key: "courseName", header: "Tên Môn Học" },
          { key: "credit", header: "Số Tín Chỉ" },
          { key: "semester", header: "Học Kỳ" },
          { key: "teacherName", header: "Giảng Viên Phụ Trách" },
        ]
      );
    } finally {
      setExporting(false);
    }
  }

  const filterFields: FilterField[] = [
    { key: "courseCode", label: "Mã Môn học", placeholder: "Ví dụ: CS101..." },
    { key: "courseName", label: "Tên Môn học", placeholder: "Ví dụ: Lập trình Java..." },
    { key: "semester", label: "Học kỳ", placeholder: "Ví dụ: HK1 2024-2025..." },
  ];

  async function confirmDeleteCourse() {
    if (!deletingCourse) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/courses/${deletingCourse.id}`, { method: "DELETE" });
      setDeletingCourse(null);
      await loadData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa môn học.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Quản lý Môn học" description="Danh sách môn học, lớp học phần, số tín chỉ và phân công giảng viên.">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                <CourseIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách môn học</h2>
            </div>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 px-5 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusIcon size={16} />
            <span>Thêm môn học mới</span>
          </button>
        </div>

        {/* Search & Export Controls Bar */}
        <SearchExportBar
          keyword={search}
          onKeywordChange={setSearch}
          filterFields={filterFields}
          filterValues={filters}
          onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          onResetFilters={() => setFilters({ courseCode: "", courseName: "", semester: "" })}
          onExport={handleExport}
          exporting={exporting}
        />

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Môn học / Học phần</th>
                <th className="px-6 py-4">Tín chỉ</th>
                <th className="px-6 py-4">Học kỳ</th>
                <th className="px-6 py-4">Giảng viên phụ trách</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu môn học…
                  </td>
                </tr>
              ) : paginatedCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có môn học nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedCourses.map((course) => {
                  const teacher = course.teacherId ? teacherMap.get(course.teacherId) : null;
                  return (
                    <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{course.courseName}</p>
                        <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300 font-bold font-mono">{course.courseCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          {course.credit} Tín chỉ
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{course.semester}</td>
                      <td className="px-6 py-4">
                        {teacher ? (
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{teacher.fullName}</p>
                            <p className="text-[10px] text-slate-400">{teacher.degree}</p>
                          </div>
                        ) : (
                          <span className="italic text-slate-500">Chưa phân công</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionIcon label="Quản lý sinh viên trong lớp" color="blue" onClick={() => setManagingEnrollmentCourse(course)}>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </ActionIcon>
                        <ActionIcon label="Sửa môn học" color="amber" onClick={() => setEditing(course)}>
                          <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                          <path d="m13.5 7 3.5 3.5" />
                        </ActionIcon>
                        <ActionIcon label="Xóa môn học" color="red" onClick={() => setDeletingCourse(course)}>
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

      {managingEnrollmentCourse && (
        <EnrollmentManagementModal
          isOpen={Boolean(managingEnrollmentCourse)}
          subjectClass={{
            id: Number(managingEnrollmentCourse.id),
            subjectClassCode: managingEnrollmentCourse.courseCode,
            name: managingEnrollmentCourse.courseName,
            semester: managingEnrollmentCourse.semester,
            teacherName: managingEnrollmentCourse.teacherId ? teacherMap.get(managingEnrollmentCourse.teacherId)?.fullName : undefined,
          }}
          onClose={() => setManagingEnrollmentCourse(null)}
          onSuccess={() => void loadData()}
        />
      )}

      {editing !== undefined && (
        <CourseForm
          course={editing}
          teachers={teachers}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadData();
          }}
        />
      )}

      {deletingCourse && (
        <ConfirmModal
          title="Xác nhận xóa môn học"
          message={`Bạn có chắc chắn muốn xóa môn học ${deletingCourse.courseName} (${deletingCourse.courseCode})? Dữ liệu sẽ không thể hoàn tác.`}
          loading={deleting}
          onConfirm={confirmDeleteCourse}
          onClose={() => setDeletingCourse(null)}
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
  color: "blue" | "red" | "amber";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tones =
    color === "amber" || color === "blue"
      ? "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
