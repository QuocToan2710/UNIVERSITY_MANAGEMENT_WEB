import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { CourseIcon, PlusIcon, SearchIcon } from "../components/icons";
import { ApiError, apiRequest } from "../lib/api";
import { emptyCourse, type Course, type CoursePayload, type Teacher } from "../types/management";

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Course | null | undefined>(undefined);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [courseData, teacherData] = await Promise.all([
        apiRequest<Course[]>("/courses"),
        apiRequest<Teacher[]>("/teachers").catch(() => []),
      ]);
      setCourses(courseData);
      setTeachers(teacherData);
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? courses.filter((c) =>
          `${c.courseCode} ${c.courseName} ${c.semester} ${c.teacherName || ""}`.toLowerCase().includes(term)
        )
      : courses;
  }, [courses, search]);

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Xóa khóa học ${course.courseName}?`)) return;
    try {
      await apiRequest<string>(`/courses/${course.id}`, { method: "DELETE" });
      await loadData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa khóa học.");
    }
  }

  return (
    <AppShell title="Quản lý Khóa học" description="Quản lý các môn học, tín chỉ và giảng viên phụ trách.">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                <CourseIcon size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Danh sách khóa học</h2>
                <p className="mt-0.5 text-xs text-slate-400">{courses.length} học phần đang hoạt động</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <PlusIcon size={16} />
            <span>Thêm khóa học mới</span>
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
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
              placeholder="Tìm theo mã môn, tên khóa học, học kỳ..."
            />
          </div>
        </div>

        {error && <p className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</p>}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-amber-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Tên khóa học</th>
                <th className="px-6 py-4">Học kỳ</th>
                <th className="px-6 py-4">Số tín chỉ</th>
                <th className="px-6 py-4">Giảng viên phụ trách</th>
                <th className="px-6 py-4">Sinh viên đăng ký</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu khóa học…
                  </td>
                </tr>
              ) : visibleCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Chưa có khóa học nào phù hợp.
                  </td>
                </tr>
              ) : (
                visibleCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <p className="font-semibold text-slate-100">{course.courseName}</p>
                      <p className="mt-0.5 text-[11px] text-amber-300 font-mono">{course.courseCode}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-200">{course.semester}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                        {course.credit} Tín chỉ
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{course.teacherName || "Chưa phân công"}</td>
                    <td className="px-6 py-4 text-cyan-300 font-medium">{course.students?.length || 0} học viên</td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa khóa học" color="blue" onClick={() => setEditing(course)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa khóa học" color="red" onClick={() => void deleteCourse(course)}>
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
    </AppShell>
  );
}

function CourseForm({
  course,
  teachers,
  onClose,
  onSaved,
}: {
  course: Course | null;
  teachers: Teacher[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CoursePayload>(
    course
      ? {
          courseCode: course.courseCode,
          courseName: course.courseName,
          credit: course.credit,
          semester: course.semester,
          teacherId: course.teacherId || "",
        }
      : emptyCourse
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof CoursePayload>(key: K, value: CoursePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<Course>(course ? `/courses/${course.id}` : "/courses", {
        method: course ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu khóa học.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-xl">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-white"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{course ? "Cập nhật khóa học" : "Tạo khóa học mới"}</h2>
            <p className="mt-1 text-xs text-slate-400">Thiết lập học phần, tín chỉ và giảng viên giảng dạy.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã học phần / môn học" value={form.courseCode} onChange={(v) => update("courseCode", v)} required />
          <Field label="Tên khóa học" value={form.courseName} onChange={(v) => update("courseName", v)} required />
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Số tín chỉ
            <input
              type="number"
              min="1"
              max="10"
              required
              value={form.credit}
              onChange={(e) => update("credit", parseInt(e.target.value) || 1)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-amber-400"
            />
          </label>
          <Field label="Học kỳ (VD: HK1-2025)" value={form.semester} onChange={(v) => update("semester", v)} required />

          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider sm:col-span-2">
            Giảng viên phụ trách
            <select
              value={form.teacherId}
              onChange={(e) => update("teacherId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-amber-400"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                -- Chọn giảng viên (Có thể bổ sung sau) --
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.fullName} ({t.teacherCode} - {t.specialization})
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu khóa học"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-amber-400"
      />
    </label>
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


