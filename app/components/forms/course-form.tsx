import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, fetchMasterData } from "../../lib/api";
import { emptyCourse, type Course, type CoursePayload, type Teacher } from "../../types/management";

type CourseFormProps = {
  course: Course | null;
  teachers?: Teacher[];
  onClose: () => void;
  onSaved: () => void;
};

export function CourseForm({ course, teachers: initialTeachers, onClose, onSaved }: CourseFormProps) {
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
  const [teacherList, setTeacherList] = useState<Teacher[]>(initialTeachers || []);
  const [subjectList, setSubjectList] = useState<{ id: string; code: string; name: string }[]>([]);
  const [semesters, setSemesters] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchMasterData("TEACHER")
      .then((opts) =>
        setTeacherList(
          opts.map((o) => ({ id: o.value, teacherCode: o.code || o.value, fullName: o.label, email: "", phoneNumber: "" }))
        )
      )
      .catch(() => {});

    void fetchMasterData("SUBJECT")
      .then((opts) => setSubjectList(opts.map((o) => ({ id: o.value, code: o.code || o.value, name: o.label }))))
      .catch(() => {});

    void fetchMasterData("SEMESTER")
      .then((opts) => setSemesters(opts.map((o) => ({ value: o.value, label: o.label }))))
      .catch(() => setSemesters([
        { value: "1", label: "Học kỳ 1" },
        { value: "2", label: "Học kỳ 2" },
        { value: "3", label: "Học kỳ Hè" }
      ]));
  }, []);

  function update<K extends keyof CoursePayload>(key: K, value: CoursePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        id: course?.id ? Number(course.id) : undefined,
        courseClassCode: form.courseCode,
        courseCode: form.courseCode,
        name: form.courseName,
        courseName: form.courseName,
        teacherId: form.teacherId ? Number(form.teacherId) : null,
        semester: form.semester,
        academicYear: "2024-2025",
      };
      await apiRequest<Course>(course ? `/courses/${course.id}` : "/courses", {
        method: course ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu môn học.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 dark:bg-slate-50 dark:bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{course ? "Cập nhật lớp học phần" : "Tạo lớp học phần mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Thiết lập môn học, tín chỉ và giảng viên giảng dạy.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {subjectList.length > 0 ? (
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider sm:col-span-2">
              Môn học / Học phần
              <select
                value={form.courseCode}
                onChange={(e) => {
                  const sel = subjectList.find((s) => s.code === e.target.value || s.id === e.target.value);
                  update("courseCode", e.target.value);
                  if (sel) update("courseName", sel.name);
                }}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-amber-400"
              >
                <option value="">-- Chọn môn học từ danh mục --</option>
                {subjectList.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <Field label="Mã môn học / học phần" value={form.courseCode} onChange={(v) => update("courseCode", v)} required />
              <Field label="Tên môn học" value={form.courseName} onChange={(v) => update("courseName", v)} required />
            </>
          )}

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Số tín chỉ
            <input
              type="number"
              min="1"
              max="10"
              required
              value={form.credit}
              onChange={(e) => update("credit", parseInt(e.target.value) || 1)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-amber-400"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Học kỳ
            <select
              value={form.semester || "1"}
              onChange={(e) => update("semester", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-amber-400"
            >
              {semesters.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider sm:col-span-2">
            Giảng viên phụ trách
            <select
              value={form.teacherId}
              onChange={(e) => update("teacherId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-amber-400"
            >
              <option value="">
                -- Chọn giảng viên phụ trách --
              </option>
              {teacherList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.teacherCode})
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-md disabled:opacity-50"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu môn học"}</span>
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
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-amber-400"
      />
    </label>
  );
}
