import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest } from "../../lib/api";
import type { District, Province } from "../../types/management";

type DistrictFormProps = {
  district: District | null;
  onClose: () => void;
  onSaved: () => void;
  defaultProvinceId?: number | string;
};

const DISTRICT_TYPE_OPTIONS = [
  "Quận",
  "Huyện",
  "Thị xã",
  "Thành phố thuộc tỉnh",
  "Thành phố thuộc thành phố trực thuộc Trung ương",
];

export function DistrictForm({ district, onClose, onSaved, defaultProvinceId }: DistrictFormProps) {
  const [districtCode, setDistrictCode] = useState(district?.districtCode || "");
  const [districtName, setDistrictName] = useState(district?.districtName || "");
  const [districtType, setDistrictType] = useState(district?.districtType || "Quận");
  const [provinceId, setProvinceId] = useState<number | string>(district?.provinceId || defaultProvinceId || "");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiListRequest<Province>("/provinces/all")
      .then(setProvinces)
      .catch(() => setProvinces([]));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!provinceId) {
      setError("Vui lòng chọn Tỉnh / Thành phố trực thuộc.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload = {
        districtCode: districtCode.trim(),
        districtName: districtName.trim(),
        districtType,
        provinceId: Number(provinceId),
      };

      await apiRequest<District>(district ? `/districts/${district.id}` : "/districts", {
        method: district ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin Quận/Huyện.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 dark:bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{district ? "Cập nhật Quận / Huyện / TP" : "Thêm Quận / Huyện / TP mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Quản lý danh mục cấp Quận, Huyện, Thị xã, TP thuộc tỉnh/thành.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Tỉnh / Thành phố trực thuộc *
            </label>
            <select
              required
              value={provinceId}
              onChange={(e) => setProvinceId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="">-- Chọn Tỉnh / Thành phố --</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.provinceName} ({p.provinceCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Mã Quận / Huyện / TP *
            </label>
            <input
              required
              value={districtCode}
              onChange={(e) => setDistrictCode(e.target.value)}
              placeholder="VD: 318 (Thủy Nguyên), 312 (An Dương), 005 (Cầu Giấy)"
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Tên Quận / Huyện / TP *
            </label>
            <input
              required
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              placeholder="VD: Thành phố Thủy Nguyên, Quận An Dương, Quận Cầu Giấy"
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Loại đơn vị hành chính
            </label>
            <select
              value={districtType}
              onChange={(e) => setDistrictType(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {DISTRICT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
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
            <span>{saving ? "Đang lưu..." : "Lưu Quận / Huyện"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
