import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { PlusIcon, SearchIcon, TeacherIcon } from "../components/icons";
import { ApiError, apiRequest } from "../lib/api";
import { emptyTeacher, type Teacher, type TeacherPayload } from "../types/management";

export default function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Teacher | null | undefined>(undefined);

  async function loadTeachers() {
    setLoading(true);
    setError("");
    try {
      setTeachers(await apiRequest<Teacher[]>("/teachers"));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách giảng viên.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeachers();
  }, []);

  const visibleTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? teachers.filter((t) =>
          `${t.teacherCode} ${t.fullName} ${t.email} ${t.specialization}`.toLowerCase().includes(term)
        )
      : teachers;
  }, [teachers, search]);

  async function deleteTeacher(teacher: Teacher) {
    if (!window.confirm(`Xóa giảng viên ${teacher.fullName}?`)) return;
    try {
      await apiRequest<string>(`/teachers/${teacher.id}`, { method: "DELETE" });
      await loadTeachers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa giảng viên.");
    }
  }

  return (
    <AppShell title="Quản lý Giảng viên" description="Quản lý thông tin, mã giảng viên và chuyên môn đào tạo.">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300 shadow-[0_0_15px_rgba(167,139,250,0.25)]">
                <TeacherIcon size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Danh sách giảng viên</h2>
                <p className="mt-0.5 text-xs text-slate-400">{teachers.length} giảng viên trong hệ thống EduManage</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-indigo-600 to-cyan-500 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <PlusIcon size={16} />
            <span>Thêm giảng viên mới</span>
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
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Tìm theo tên, mã giảng viên hoặc chuyên môn..."
            />
          </div>
        </div>

        {error && <p className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</p>}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-violet-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Giảng viên</th>
                <th className="px-6 py-4">Email liên hệ</th>
                <th className="px-6 py-4">Số điện thoại</th>
                <th className="px-6 py-4">Chuyên môn</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu giảng viên…
                  </td>
                </tr>
              ) : visibleTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có giảng viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                visibleTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <p className="font-semibold text-slate-100">{teacher.fullName}</p>
                      <p className="mt-0.5 text-[11px] text-violet-300 font-mono">{teacher.teacherCode}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-200">{teacher.email}</td>
                    <td className="px-6 py-4 text-slate-400">{teacher.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.15)]">
                        {teacher.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa giảng viên" color="blue" onClick={() => setEditing(teacher)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa giảng viên" color="red" onClick={() => void deleteTeacher(teacher)}>
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
        <TeacherForm
          teacher={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadTeachers();
          }}
        />
      )}
    </AppShell>
  );
}

function TeacherForm({ teacher, onClose, onSaved }: { teacher: Teacher | null; onClose: () => void; onSaved: () => void }) {
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-xl">
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
          <div className="sm:col-span-2">
            <Field label="Chuyên môn / Bộ môn" value={form.specialization} onChange={(v) => update("specialization", v)} required />
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu thông tin"}
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
      ? "text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
      : "text-red-400 hover:bg-red-500/10 hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}


