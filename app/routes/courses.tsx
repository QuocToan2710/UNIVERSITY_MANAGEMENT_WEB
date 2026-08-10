import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { CourseForm } from "../components/forms/course-form";
import { CourseIcon, PlusIcon, SearchIcon } from "../components/icons";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import type { Course, Teacher } from "../types/management";

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Course | null | undefined>(undefined);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [courseData, teacherData] = await Promise.all([
        apiListRequest<Course>("/courses"),
        apiListRequest<Teacher>("/teachers"),
      ]);
      setCourses(courseData);
      setTeachers(teacherData);
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải dữ liệu khóa học.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const teacherMap = useMemo(() => {
    return new Map(teachers.map((t) => [t.id, t]));
  }, [teachers]);

  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? courses.filter((c) => {
          const teacherName = c.teacherId ? teacherMap.get(c.teacherId)?.fullName || "" : "";
          return `${c.courseCode} ${c.courseName} ${c.semester} ${teacherName}`.toLowerCase().includes(term);
        })
      : courses;
  }, [courses, search, teacherMap]);

  async function confirmDeleteCourse() {
    if (!deletingCourse) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/courses/${deletingCourse.id}`, { method: "DELETE" });
      setDeletingCourse(null);
      await loadData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa khóa học.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Quản lý Khóa học" description="Danh sách học phần, số tín chỉ và phân công giảng viên.">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
                <CourseIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-white">Danh sách khóa học</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">{courses.length} môn học đã được đăng ký</p>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <PlusIcon size={16} />
            <span>Tạo khóa học mới</span>
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
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
              placeholder="Tìm theo mã học phần, tên khóa học, giảng viên..."
            />
          </div>
        </div>

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-amber-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Học phần</th>
                <th className="px-6 py-4">Tín chỉ</th>
                <th className="px-6 py-4">Học kỳ</th>
                <th className="px-6 py-4">Giảng viên phụ trách</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu khóa học…
                  </td>
                </tr>
              ) : visibleCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có khóa học nào phù hợp.
                  </td>
                </tr>
              ) : (
                visibleCourses.map((course) => {
                  const teacher = course.teacherId ? teacherMap.get(course.teacherId) : null;
                  return (
                    <tr key={course.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100">{course.courseName}</p>
                        <p className="mt-0.5 text-[11px] text-amber-300 font-mono">{course.courseCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
                          {course.credit} Tín chỉ
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{course.semester}</td>
                      <td className="px-6 py-4">
                        {teacher ? (
                          <div>
                            <p className="font-medium text-slate-200">{teacher.fullName}</p>
                            <p className="text-[10px] text-slate-400">{teacher.specialization}</p>
                          </div>
                        ) : (
                          <span className="italic text-slate-500">Chưa phân công</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionIcon label="Sửa khóa học" color="blue" onClick={() => setEditing(course)}>
                          <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                          <path d="m13.5 7 3.5 3.5" />
                        </ActionIcon>
                        <ActionIcon label="Xóa khóa học" color="red" onClick={() => setDeletingCourse(course)}>
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
      </div>

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
          title="Xác nhận xóa khóa học"
          message={`Bạn có chắc chắn muốn xóa khóa học ${deletingCourse.courseName} (${deletingCourse.courseCode})? Dữ liệu sẽ không thể hoàn tác.`}
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
  color: "blue" | "red";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tones =
    color === "blue"
      ? "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
      : "text-red-400 hover:bg-red-500/10 hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
