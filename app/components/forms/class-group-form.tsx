import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest, fetchMasterData } from "../../lib/api";
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
          majorId: classGroup.majorId ?? "",
          academicYear: classGroup.academicYear || "2024-2025",
          homeroomTeacherId: classGroup.homeroomTeacherId || "",
        }
      : emptyClassGroup
  );
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [majors, setMajors] = useState<{ id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchMasterData("TEACHER")
      .then((opts) => {
        setTeachers(
          opts.map((o) => ({
            id: o.value,
            teacherCode: o.code || o.value,
            fullName: o.label,
            email: "",
            phoneNumber: "",
          }))
        );
      })
      .catch(async () => {
        setTeachers(await apiListRequest<Teacher>("/teachers/all").catch(() => []));
      });

    void fetchMasterData("MAJOR")
      .then((opts) => setMajors(opts.map((o) => ({ id: o.value, name: o.label }))))
      .catch(() => setMajors([]));

    void fetchMasterData("ACADEMIC_YEAR")
      .then((opts) => setAcademicYears(opts.map((o) => ({ value: o.value, label: o.label }))))
      .catch(() => setAcademicYears([
        { value: "2024-2025", label: "2024 - 2025" },
        { value: "2025-2026", label: "2025 - 2026" },
        { value: "2023-2024", label: "2023 - 2024" }
      ]));
  }, []);

  function update<K extends keyof ClassGroupPayload>(key: K, value: ClassGroupPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        majorId: form.majorId ? Number(form.majorId) : null,
        homeroomTeacherId: form.homeroomTeacherId ? Number(form.homeroomTeacherId) : null,
      };
      await apiRequest<ClassGroup>(classGroup ? `/class-groups/${classGroup.id}` : "/class-groups", {
        method: classGroup ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu lớp học.");
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
            <h2 className="text-lg font-bold">{classGroup ? "Cập nhật thông tin lớp học" : "Thêm lớp học mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Quản lý danh mục lớp sinh hoạt và giáo viên chủ nhiệm.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã lớp *" value={form.classCode} onChange={(v) => update("classCode", v)} required placeholder="VD: 21DTH1" />
          <Field label="Tên lớp *" value={form.className} onChange={(v) => update("className", v)} required placeholder="VD: Công nghệ thông tin 1" />
          
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Ngành học
            <select
              value={form.majorId || ""}
              onChange={(e) => update("majorId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-teal-400"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-400">-- Chọn ngành học --</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Niên khóa
            <select
              value={form.academicYear || "2024-2025"}
              onChange={(e) => update("academicYear", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-teal-400"
            >
              {academicYears.map((ay) => (
                <option key={ay.value} value={ay.value}>
                  {ay.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider sm:col-span-2">
            Giáo viên chủ nhiệm (GVCN)
            <select
              value={form.homeroomTeacherId || ""}
              onChange={(e) => update("homeroomTeacherId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-teal-400"
            >
              <option value="">-- Chưa chọn GVCN --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teacherCode} - {t.fullName}
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
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-md disabled:opacity-50"
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
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
      {label}
      <input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-teal-400"
      />
    </label>
  );
}
