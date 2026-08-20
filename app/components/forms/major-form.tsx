import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest, fetchMasterData } from "../../lib/api";
import { emptyMajor, type Department, type Major, type MajorPayload } from "../../types/management";

type MajorFormProps = {
  major: Major | null;
  onClose: () => void;
  onSaved: () => void;
};

export function MajorForm({ major, onClose, onSaved }: MajorFormProps) {
  const [form, setForm] = useState<MajorPayload>(
    major
      ? {
          majorCode: major.majorCode || "",
          name: major.name || "",
          departmentId: major.departmentId || "",
        }
      : emptyMajor
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchMasterData("DEPARTMENT")
      .then((opts) => {
        setDepartments(opts.map((o) => ({ id: o.value, departmentCode: o.code || o.value, name: o.label })));
      })
      .catch(async () => {
        setDepartments(await apiListRequest<Department>("/departments/all").catch(() => []));
      });
  }, []);

  function update<K extends keyof MajorPayload>(key: K, value: MajorPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      };
      await apiRequest<Major>(major ? `/majors/${major.id}` : "/majors", {
        method: major ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin ngành học.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 dark:bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{major ? "Cập nhật ngành học" : "Tạo ngành học mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Điền thông tin mã ngành, tên ngành và Khoa quản lý trực thuộc.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã ngành học *" value={form.majorCode} onChange={(v) => update("majorCode", v)} required placeholder="VD: MJ_KTPM, CNTT" />
          <Field label="Tên ngành học *" value={form.name} onChange={(v) => update("name", v)} required placeholder="VD: Kỹ thuật Phần mềm" />

          {/* Khoa trực thuộc */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
              Khoa trực thuộc quản lý
              <select
                value={form.departmentId || ""}
                onChange={(e) => update("departmentId", e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-emerald-400"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-400">-- Chưa chọn Khoa --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {dept.name} ({dept.departmentCode})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs placeholder-slate-500 outline-none focus:border-emerald-400"
      />
    </label>
  );
}
