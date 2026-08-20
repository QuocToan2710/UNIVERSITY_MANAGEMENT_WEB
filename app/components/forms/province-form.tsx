import { useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import type { Province } from "../../types/management";

type ProvinceFormProps = {
  province: Province | null;
  onClose: () => void;
  onSaved: () => void;
};

const PROVINCE_TYPE_OPTIONS = [
  "Thành phố Trung ương",
  "Tỉnh",
];

export function ProvinceForm({ province, onClose, onSaved }: ProvinceFormProps) {
  const [provinceCode, setProvinceCode] = useState(province?.provinceCode || "");
  const [provinceName, setProvinceName] = useState(province?.provinceName || "");
  const [provinceType, setProvinceType] = useState(province?.provinceType || "Tỉnh");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        provinceCode: provinceCode.trim(),
        provinceName: provinceName.trim(),
        provinceType,
      };

      await apiRequest<Province>(province ? `/provinces/${province.id}` : "/provinces", {
        method: province ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin Tỉnh/Thành phố.");
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
            <h2 className="text-lg font-bold">{province ? "Cập nhật Tỉnh / Thành phố" : "Thêm Tỉnh / Thành phố mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Quản lý danh mục cấp Tỉnh/Thành phố trực thuộc Trung ương.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Mã Tỉnh / TP (Mã hành chính theo Tổng cục Thống kê) *
            </label>
            <input
              required
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              placeholder="VD: 01 (Hà Nội), 31 (Hải Phòng), 79 (TP.HCM)"
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Tên Tỉnh / Thành phố *
            </label>
            <input
              required
              value={provinceName}
              onChange={(e) => setProvinceName(e.target.value)}
              placeholder="VD: Thành phố Hải Phòng, Thành phố Hà Nội"
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Loại đơn vị hành chính
            </label>
            <select
              value={provinceType}
              onChange={(e) => setProvinceType(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {PROVINCE_TYPE_OPTIONS.map((opt) => (
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
            <span>{saving ? "Đang lưu..." : "Lưu Tỉnh / TP"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
