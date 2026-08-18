import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest, fetchMasterData } from "../../lib/api";
import type { ClassGroup, Major } from "../../types/management";
import { emptyStudent, type Student, type StudentPayload } from "../../types/student";

type StudentFormProps = {
  student: Student | null;
  onClose: () => void;
  onSaved: () => void;
};

export function StudentForm({ student, onClose, onSaved }: StudentFormProps) {
  const [form, setForm] = useState<StudentPayload>(
    student
      ? {
          studentCode: student.studentCode || "",
          fullName: student.fullName || "",
          email: student.email || "",
          phoneNumber: student.phoneNumber || "",
          dob: dateValue(student.dob),
          gender: student.gender || "Nam",
          address: student.address || "",
          majorId: student.majorId ?? "",
          enrollmentYear: student.enrollmentYear || "",
          status: student.status || "ACTIVE",
          classGroupId: student.classGroupId ?? "",
          userId: student.userId || "",
        }
      : emptyStudent
  );

  const [classGroups, setClassGroups] = useState<{ id: string | number; name: string }[]>([]);
  const [majors, setMajors] = useState<{ id: string | number; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load Class Groups master data
    void fetchMasterData("CLASS_GROUP")
      .then((opts) => {
        setClassGroups(opts.map((o) => ({ id: o.value, name: o.label })));
      })
      .catch(async () => {
        const list = await apiListRequest<ClassGroup>("/class-groups/all").catch(() => []);
        setClassGroups(list.map((cg) => ({ id: cg.id, name: `${cg.className} (${cg.classCode})` })));
      });

    // Load Majors master data
    void fetchMasterData("MAJOR")
      .then((opts) => setMajors(opts.map((o) => ({ id: o.value, name: o.label }))))
      .catch(async () => {
        const list = await apiListRequest<Major>("/majors/all").catch(() => []);
        setMajors(list.map((m) => ({ id: m.id, name: `${m.name} (${m.majorCode})` })));
      });

    // Load Statuses master data
    void fetchMasterData("STUDENT_STATUS")
      .then((opts) => setStatuses(opts.map((o) => ({ value: o.value, label: o.label }))))
      .catch(() =>
        setStatuses([
          { value: "ACTIVE", label: "Đang học" },
          { value: "GRADUATED", label: "Đã tốt nghiệp" },
          { value: "SUSPENDED", label: "Bảo lưu kết quả" },
          { value: "DROPPED", label: "Thôi học" },
        ])
      );
  }, []);

  function update<K extends keyof StudentPayload>(key: K, value: StudentPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        classGroupId: form.classGroupId ? Number(form.classGroupId) : null,
        majorId: form.majorId ? Number(form.majorId) : null,
      };
      await apiRequest<Student>(student ? `/students/${student.id}` : "/students", {
        method: student ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu sinh viên.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 dark:bg-slate-50 dark:bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{student ? "Cập nhật thông tin sinh viên" : "Thêm sinh viên mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Nhập trực tiếp các thông tin sinh viên để lưu vào hệ thống.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã sinh viên *" value={form.studentCode} onChange={(v) => update("studentCode", v)} required placeholder="VD: SV2025001" />
          <Field label="Họ và tên *" value={form.fullName} onChange={(v) => update("fullName", v)} required placeholder="VD: Nguyễn Văn A" />
          <Field label="Email *" type="email" value={form.email} onChange={(v) => update("email", v)} required placeholder="nguyenvana@university.edu.vn" />
          <Field label="Số điện thoại *" value={form.phoneNumber} onChange={(v) => update("phoneNumber", v)} required placeholder="VD: 0912345678" />
          <Field label="Ngày sinh *" type="date" value={form.dob} onChange={(v) => update("dob", v)} required />

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Giới tính *
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Lớp sinh hoạt
            <select
              value={form.classGroupId || ""}
              onChange={(e) => update("classGroupId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="">-- Chọn lớp học --</option>
              {classGroups.map((cg) => (
                <option key={cg.id} value={cg.id}>
                  {cg.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Ngành học
            <select
              value={form.majorId || ""}
              onChange={(e) => update("majorId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="">-- Chọn ngành học --</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <Field label="Năm nhập học" value={form.enrollmentYear || ""} onChange={(v) => update("enrollmentYear", v)} placeholder="VD: 2024" />

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Trạng thái
            <select
              value={form.status || "ACTIVE"}
              onChange={(e) => update("status", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {statuses.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider sm:col-span-2">
            Địa chỉ *
            <input
              required
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="VD: 123 Đường Nguyễn Huệ, Quận 1, TP.HCM"
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-md disabled:opacity-50 cursor-pointer"
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
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs placeholder-slate-500 outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function dateValue(value: string) {
  if (!value) return "";
  return value.slice(0, 10);
}
