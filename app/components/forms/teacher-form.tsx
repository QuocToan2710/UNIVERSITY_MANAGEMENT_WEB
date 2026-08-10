import { useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import { emptyTeacher, type Teacher, type TeacherPayload } from "../../types/management";

type TeacherFormProps = {
  teacher: Teacher | null;
  onClose: () => void;
  onSaved: () => void;
};

export function TeacherForm({ teacher, onClose, onSaved }: TeacherFormProps) {
  const [form, setForm] = useState<TeacherPayload>(teacher ? { ...teacher } : emptyTeacher);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof TeacherPayload>(key: K, value: TeacherPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<Teacher>(teacher ? `/teachers/${teacher.id}` : "/teachers", {
        method: teacher ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin giảng viên.");
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
            <h2 className="text-lg font-bold">{teacher ? "Cập nhật hồ sơ giảng viên" : "Thêm giảng viên mới"}</h2>
            <p className="mt-1 text-xs text-slate-400">Điền đầy đủ thông tin giảng viên theo mẫu quy định.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã giảng viên" value={form.teacherCode} onChange={(v) => update("teacherCode", v)} required />
          <Field label="Họ và tên" value={form.fullName} onChange={(v) => update("fullName", v)} required />
          <Field label="Email liên hệ" type="email" value={form.email} onChange={(v) => update("email", v)} required />
          <Field label="Số điện thoại" value={form.phoneNumber} onChange={(v) => update("phoneNumber", v)} required />
          <Field label="Học vị" value={form.degree || ""} onChange={(v) => update("degree", v)} placeholder="VD: ThS, TS, PGS, GS" />
          <Field label="Khoa / Trực thuộc" value={form.department || ""} onChange={(v) => update("department", v)} placeholder="VD: Khoa CNTT" />
          <div className="sm:col-span-2">
            <Field label="Chuyên môn" value={form.specialization} onChange={(v) => update("specialization", v)} required />
          </div>
        </div>


        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md disabled:opacity-50"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu thông tin"}</span>
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
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-violet-400"
      />
    </label>
  );
}
