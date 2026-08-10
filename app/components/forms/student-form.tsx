import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest } from "../../lib/api";
import type { ClassGroup, Teacher } from "../../types/management";
import { emptyStudent, type Student, type StudentPayload } from "../../types/student";

type StudentFormProps = {
  student: Student | null;
  onClose: () => void;
  onSaved: () => void;
};

export function StudentForm({ student, onClose, onSaved }: StudentFormProps) {
  const [form, setForm] = useState<StudentPayload>(student ? { ...student, dob: dateValue(student.dob) } : emptyStudent);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiListRequest<ClassGroup>("/class-groups/all")
      .then(setClassGroups)
      .catch(() => setClassGroups([]));
  }, []);

  function update<K extends keyof StudentPayload>(key: K, value: StudentPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<Student>(student ? `/students/${student.id}` : "/students", {
        method: student ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu sinh viên.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-white"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{student ? "Cập nhật thông tin sinh viên" : "Thêm sinh viên mới"}</h2>
            <p className="mt-1 text-xs text-slate-400">Điền thông tin hồ sơ theo mẫu StudentRequest.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã sinh viên" value={form.studentCode} onChange={(v) => update("studentCode", v)} required />
          <Field label="Họ và tên" value={form.fullName} onChange={(v) => update("fullName", v)} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
          <Field label="Số điện thoại" value={form.phoneNumber} onChange={(v) => update("phoneNumber", v)} required />
          <Field label="Ngày sinh" type="date" value={form.dob} onChange={(v) => update("dob", v)} required />

          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Giới tính
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            >
              <option value="Nam" className="bg-slate-900 text-white">Nam</option>
              <option value="Nữ" className="bg-slate-900 text-white">Nữ</option>
              <option value="Khác" className="bg-slate-900 text-white">Khác</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Lớp học
            <select
              value={form.classGroupId || ""}
              onChange={(e) => update("classGroupId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-white">-- Chọn lớp học --</option>
              {classGroups.map((cg) => (
                <option key={cg.id} value={cg.id} className="bg-slate-900 text-white">
                  {cg.classCode} - {cg.className}
                </option>
              ))}
            </select>
          </label>

          <Field label="Ngành học" value={form.major || ""} onChange={(v) => update("major", v)} />
          <Field label="Năm nhập học" value={form.enrollmentYear || ""} onChange={(v) => update("enrollmentYear", v)} placeholder="VD: 2023" />

          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Trạng thái
            <select
              value={form.status || "ACTIVE"}
              onChange={(e) => update("status", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            >
              <option value="ACTIVE" className="bg-slate-900 text-white">Đang học</option>
              <option value="GRADUATED" className="bg-slate-900 text-white">Tốt nghiệp</option>
              <option value="SUSPENDED" className="bg-slate-900 text-white">Bảo lưu</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider sm:col-span-2">
            Địa chỉ
            <input
              required
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            />
          </label>
        </div>


        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md disabled:opacity-50"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu sinh viên"}</span>
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
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function dateValue(value: string) {
  return value ? value.slice(0, 10) : "";
}
