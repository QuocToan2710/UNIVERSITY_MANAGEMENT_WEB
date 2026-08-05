import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { PlusIcon, SearchIcon, StudentIcon } from "../components/icons";
import { ApiError, apiRequest } from "../lib/api";
import { emptyStudent, type Student, type StudentPayload } from "../types/student";

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Student | null | undefined>(undefined);

  async function loadStudents() {
    setLoading(true);
    setError("");
    try {
      setStudents(await apiRequest<Student[]>("/students"));
    } catch (reason) {
      const apiError = reason as ApiError;
      if (apiError.status === 401) navigate("/login");
      else setError(apiError.message || "Không tải được danh sách sinh viên.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return term
      ? students.filter((student) =>
          `${student.studentCode} ${student.fullName} ${student.email}`.toLocaleLowerCase().includes(term)
        )
      : students;
  }, [students, search]);

  async function deleteStudent(student: Student) {
    if (!window.confirm(`Xóa sinh viên ${student.fullName}?`)) return;
    try {
      await apiRequest<string>(`/students/${student.id}`, { method: "DELETE" });
      await loadStudents();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa sinh viên.");
    }
  }

  return (
    <AppShell title="Quản lý Sinh viên" description="Danh sách hồ sơ học viên trong hệ thống đào tạo EduManage.">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                <StudentIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-white">Danh sách sinh viên</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">{students.length} sinh viên đã đăng ký dữ liệu</p>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <PlusIcon size={16} />
            <span>Thêm sinh viên mới</span>
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
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Tìm theo mã sinh viên, tên hoặc email..."
            />
          </div>
        </div>

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-cyan-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Sinh viên</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Giới tính</th>
                <th className="px-6 py-4">Địa chỉ</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu sinh viên…
                  </td>
                </tr>
              ) : visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có sinh viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                visibleStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-100">{student.fullName}</p>
                      <p className="mt-0.5 text-[11px] text-cyan-300 font-mono">{student.studentCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-200">{student.email}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{student.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                        {student.gender}
                      </span>
                    </td>
                    <td className="max-w-48 truncate px-6 py-4 text-slate-400">{student.address}</td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa sinh viên" color="blue" onClick={() => setEditing(student)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa sinh viên" color="red" onClick={() => void deleteStudent(student)}>
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
        <StudentForm
          student={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadStudents();
          }}
        />
      )}
    </AppShell>
  );
}

function StudentForm({ student, onClose, onSaved }: { student: Student | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<StudentPayload>(student ? { ...student, dob: dateValue(student.dob) } : emptyStudent);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-xl">
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
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu sinh viên"}
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
      ? "text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
      : "text-red-400 hover:bg-red-500/10 hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}

