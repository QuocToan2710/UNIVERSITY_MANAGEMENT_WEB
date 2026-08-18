import { useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import { emptyBuilding, type Building, type BuildingPayload } from "../../types/management";

type BuildingFormProps = {
  building: Building | null;
  onClose: () => void;
  onSaved: () => void;
};

const BUILDING_STATUSES = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "MAINTENANCE", label: "Đang bảo trì" },
  { value: "INACTIVE", label: "Tạm khóa" },
];

export function BuildingForm({ building, onClose, onSaved }: BuildingFormProps) {
  const [form, setForm] = useState<BuildingPayload>(
    building
      ? {
          buildingCode: building.buildingCode || "",
          name: building.name || "",
          totalFloors: building.totalFloors || 5,
          status: building.status || "ACTIVE",
          description: building.description || "",
        }
      : emptyBuilding
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof BuildingPayload>(key: K, value: BuildingPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<Building>(building ? `/buildings/${building.id}` : "/buildings", {
        method: building ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin tòa nhà.");
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
            <h2 className="text-lg font-bold">{building ? "Cập nhật tòa nhà" : "Tạo tòa nhà mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Điền mã tòa nhà, tên tòa nhà, tổng số tầng và trạng thái.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã tòa nhà *" value={form.buildingCode} onChange={(v) => update("buildingCode", v)} required placeholder="VD: TOA_A2, TOA_B1" />
          <Field label="Tên tòa nhà *" value={form.name} onChange={(v) => update("name", v)} required placeholder="VD: Tòa nhà A2 Giảng đường" />

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Tổng số tầng *
            <input
              type="number"
              min={1}
              max={50}
              required
              value={form.totalFloors || 5}
              onChange={(e) => update("totalFloors", Number(e.target.value))}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Trạng thái *
            <select
              value={form.status || "ACTIVE"}
              onChange={(e) => update("status", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400 font-bold"
            >
              {BUILDING_STATUSES.map((st) => (
                <option key={st.value} value={st.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">
                  ● {st.label}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <Field label="Ghi chú / Mô tả" value={form.description || ""} onChange={(v) => update("description", v)} placeholder="VD: Tòa nhà chính 10 tầng có điều hòa..." />
          </div>
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
            <span>{saving ? "Đang lưu..." : "Lưu tòa nhà"}</span>
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
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs placeholder-slate-500 outline-none focus:border-cyan-400"
      />
    </label>
  );
}
