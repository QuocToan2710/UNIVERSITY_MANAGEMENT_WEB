import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest, fetchMasterData } from "../../lib/api";
import { emptyFloor, type Building, type Floor, type FloorPayload } from "../../types/management";

type FloorFormProps = {
  floor: Floor | null;
  onClose: () => void;
  onSaved: () => void;
};

const FLOOR_STATUSES = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "MAINTENANCE", label: "Đang bảo trì" },
  { value: "INACTIVE", label: "Tạm khóa" },
];

export function FloorForm({ floor, onClose, onSaved }: FloorFormProps) {
  const [form, setForm] = useState<FloorPayload>(
    floor
      ? {
          floorCode: floor.floorCode || "",
          name: floor.name || "",
          buildingId: floor.buildingId || "",
          floorNumber: floor.floorNumber || 1,
          status: floor.status || "ACTIVE",
          description: floor.description || "",
        }
      : emptyFloor
  );
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchMasterData("BUILDING")
      .then((opts) => {
        setBuildings(opts.map((o) => ({ id: o.value, buildingCode: o.code || o.value, name: o.label, status: "ACTIVE" })));
      })
      .catch(async () => {
        setBuildings(await apiListRequest<Building>("/buildings/all").catch(() => []));
      });
  }, []);

  function update<K extends keyof FloorPayload>(key: K, value: FloorPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        buildingId: form.buildingId ? Number(form.buildingId) : null,
      };
      await apiRequest<Floor>(floor ? `/floors/${floor.id}` : "/floors", {
        method: floor ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin tầng.");
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
            <h2 className="text-lg font-bold">{floor ? "Cập nhật thông tin tầng" : "Tạo tầng mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Điền mã tầng, tên tầng, chọn tòa nhà trực thuộc và số tầng.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã tầng *" value={form.floorCode} onChange={(v) => update("floorCode", v)} required placeholder="VD: TANG_04_A2" />
          <Field label="Tên tầng *" value={form.name} onChange={(v) => update("name", v)} required placeholder="VD: Tầng 4 - Khu A2" />

          {/* Tòa nhà trực thuộc */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
              Tòa nhà trực thuộc *
              <select
                required
                value={form.buildingId || ""}
                onChange={(e) => update("buildingId", e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-400">-- Chọn tòa nhà --</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {b.name} ({b.buildingCode})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Số thứ tự tầng *
            <input
              type="number"
              min={-5}
              max={50}
              required
              value={form.floorNumber || 1}
              onChange={(e) => update("floorNumber", Number(e.target.value))}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Trạng thái *
            <select
              value={form.status || "ACTIVE"}
              onChange={(e) => update("status", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400 font-bold"
            >
              {FLOOR_STATUSES.map((st) => (
                <option key={st.value} value={st.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">
                  ● {st.label}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <Field label="Ghi chú" value={form.description || ""} onChange={(v) => update("description", v)} placeholder="VD: Khu vực học lý thuyết chất lượng cao..." />
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu thông tin tầng"}</span>
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
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs placeholder-slate-500 outline-none focus:border-cyan-400"
      />
    </label>
  );
}
