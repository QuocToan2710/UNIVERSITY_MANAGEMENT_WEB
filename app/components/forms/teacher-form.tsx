import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest, fetchMasterData } from "../../lib/api";
import { emptyTeacher, type Department, type Teacher, type TeacherPayload } from "../../types/management";
import { AddressSelector } from "../address-selector";

type TeacherFormProps = {
  teacher: Teacher | null;
  onClose: () => void;
  onSaved: () => void;
};

const DEGREE_OPTIONS = [
  "Thạc sĩ",
  "Tiến sĩ",
  "Phó Giáo sư",
  "Giáo sư",
  "Cử nhân",
  "Kỹ sư",
];

export function TeacherForm({ teacher, onClose, onSaved }: TeacherFormProps) {
  const [form, setForm] = useState<TeacherPayload>(
    teacher
      ? {
          teacherCode: teacher.teacherCode || "",
          fullName: teacher.fullName || "",
          email: teacher.email || "",
          phoneNumber: teacher.phoneNumber || "",
          degree: teacher.degree || "Thạc sĩ",
          departmentId: teacher.departmentId || "",
          address: teacher.fullAddress || teacher.address || "",
          provinceId: teacher.provinceId ?? "",
          districtId: teacher.districtId ?? "",
          wardId: teacher.wardId ?? "",
          specificAddress: teacher.specificAddress || (!teacher.provinceId ? (teacher.address || teacher.fullAddress || "") : ""),
        }
      : emptyTeacher
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<string[]>(DEGREE_OPTIONS);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Load fresh teacher detail by id when editing
  useEffect(() => {
    if (teacher?.id) {
      apiRequest<Teacher>(`/teachers/${teacher.id}`)
        .then((fresh) => {
          if (fresh) {
            setForm({
              teacherCode: fresh.teacherCode || "",
              fullName: fresh.fullName || "",
              email: fresh.email || "",
              phoneNumber: fresh.phoneNumber || "",
              degree: fresh.degree || "Thạc sĩ",
              departmentId: fresh.departmentId || "",
              address: fresh.fullAddress || fresh.address || "",
              provinceId: fresh.provinceId ?? "",
              districtId: fresh.districtId ?? "",
              wardId: fresh.wardId ?? "",
              specificAddress: fresh.specificAddress || (!fresh.provinceId ? (fresh.address || fresh.fullAddress || "") : ""),
            });
          }
        })
        .catch((err) => {
          console.error("Error loading fresh teacher detail:", err);
        });
    }
  }, [teacher?.id]);

  useEffect(() => {
    void fetchMasterData("DEPARTMENT")
      .then((opts) => {
        setDepartments(opts.map((o) => ({ id: o.value, departmentCode: o.code || o.value, name: o.label })));
      })
      .catch(async () => {
        setDepartments(await apiListRequest<Department>("/departments/all").catch(() => []));
      });

    void fetchMasterData("DEGREE")
      .then((opts) => {
        setDegreeOptions(opts.map((o) => o.label));
      })
      .catch(() => setDegreeOptions(DEGREE_OPTIONS));
  }, []);

  function update<K extends keyof TeacherPayload>(key: K, value: TeacherPayload[K]) {
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
        provinceId: form.provinceId ? Number(form.provinceId) : null,
        districtId: form.districtId ? Number(form.districtId) : null,
        wardId: form.wardId ? Number(form.wardId) : null,
      };
      await apiRequest<Teacher>(teacher?.id ? `/teachers/${teacher.id}` : "/teachers", {
        method: teacher?.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin giảng viên.");
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
            <h2 className="text-lg font-bold">{teacher ? "Cập nhật hồ sơ giảng viên" : "Thêm giảng viên mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Điền đầy đủ thông tin bằng cấp và Khoa trực thuộc của giảng viên.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã giảng viên *" value={form.teacherCode} onChange={(v) => update("teacherCode", v)} required />
          <Field label="Họ và tên *" value={form.fullName} onChange={(v) => update("fullName", v)} required />
          <Field label="Email liên hệ *" type="email" value={form.email} onChange={(v) => update("email", v)} required />
          <Field label="Số điện thoại" value={form.phoneNumber} onChange={(v) => update("phoneNumber", v)} />
          
          {/* Bằng cấp */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Bằng cấp *
            <select
              required
              value={form.degree || "Thạc sĩ"}
              onChange={(e) => update("degree", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-violet-400"
            >
              {degreeOptions.map((d) => (
                <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {d}
                </option>
              ))}
            </select>
          </label>

          {/* Khoa trực thuộc */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Khoa trực thuộc
            <select
              value={form.departmentId || ""}
              onChange={(e) => update("departmentId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-violet-400"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-400">-- Chưa chọn Khoa --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {dept.name} ({dept.departmentCode})
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-3">
              Thông tin Địa chỉ Cư trú (Theo CCCD / VNeID)
            </h4>
            <AddressSelector
              provinceId={form.provinceId}
              districtId={form.districtId}
              wardId={form.wardId}
              specificAddress={form.specificAddress}
              currentAddress={form.address || (teacher ? (teacher.fullAddress || teacher.address) : "")}
              onChange={(addr) => {
                setForm((prev) => ({
                  ...prev,
                  provinceId: addr.provinceId,
                  districtId: addr.districtId,
                  wardId: addr.wardId,
                  specificAddress: addr.specificAddress,
                  address: addr.fullAddress || prev.address,
                }));
              }}
            />
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
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
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-violet-400"
      />
    </label>
  );
}
