import { useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import { emptyCourse, type Course, type CoursePayload, type Teacher } from "../../types/management";

type CourseFormProps = {
  course: Course | null;
  teachers: Teacher[];
  onClose: () => void;
  onSaved: () => void;
};

export function CourseForm({ course, teachers, onClose, onSaved }: CourseFormProps) {
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
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
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md disabled:opacity-50"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu khóa học"}</span>
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
