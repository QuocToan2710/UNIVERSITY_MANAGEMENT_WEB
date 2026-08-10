import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest } from "../../lib/api";
import { emptyClassGroup, type ClassGroup, type ClassGroupPayload, type Teacher } from "../../types/management";

type ClassGroupFormProps = {
  classGroup: ClassGroup | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ClassGroupForm({ classGroup, onClose, onSaved }: ClassGroupFormProps) {
  const [form, setForm] = useState<ClassGroupPayload>(
    classGroup
      ? {
          classCode: classGroup.classCode,
          className: classGroup.className,
          major: classGroup.major || "",
          academicYear: classGroup.academicYear || "",
          homeroomTeacherId: classGroup.homeroomTeacherId || "",
        }
      : emptyClassGroup
  );
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiListRequest<Teacher>("/teachers/all")
      .then(setTeachers)
      .catch(() => setTeachers([]));
  }, []);

  function update<K extends keyof ClassGroupPayload>(key: K, value: ClassGroupPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<ClassGroup>(classGroup ? `/class-groups/${classGroup.id}` : "/class-groups", {
        method: classGroup ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu lớp học.");
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
            <h2 className="text-lg font-bold">{classGroup ? "Cập nhật lớp học" : "Tạo lớp học mới"}</h2>
            <p className="mt-1 text-xs text-slate-400">Quản lý lớp hành chính và gán GVCN.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã lớp" value={form.classCode} onChange={(v) => update("classCode", v)} required placeholder="VD: 21DTH1" />
          <Field label="Tên lớp" value={form.className} onChange={(v) => update("className", v)} required placeholder="VD: Công nghệ thông tin 1" />
          <Field label="Ngành học" value={form.major || ""} onChange={(v) => update("major", v)} placeholder="VD: Công nghệ thông tin" />
          <Field label="Niên khóa" value={form.academicYear || ""} onChange={(v) => update("academicYear", v)} placeholder="VD: 2023-2027" />

          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider sm:col-span-2">
            Giáo viên chủ nhiệm (GVCN)
            <select
              value={form.homeroomTeacherId || ""}
              onChange={(e) => update("homeroomTeacherId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-teal-400"
            >
              <option value="" className="bg-slate-900 text-white">-- Chưa chọn GVCN --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.teacherCode} - {t.fullName} ({t.specialization || "Giảng viên"})
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
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md disabled:opacity-50"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu lớp học"}</span>
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
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
      {label}
      <input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-teal-400"
      />
    </label>
  );
}
