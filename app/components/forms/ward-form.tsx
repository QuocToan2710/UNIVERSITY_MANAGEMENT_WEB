import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest } from "../../lib/api";
import type { District, Province, Ward } from "../../types/management";

type WardFormProps = {
  ward: Ward | null;
  onClose: () => void;
  onSaved: () => void;
  defaultDistrictId?: number | string;
};

const WARD_TYPE_OPTIONS = [
  "Phường",
  "Xã",
  "Thị trấn",
  "Khu dân cư",
];

export function WardForm({ ward, onClose, onSaved, defaultDistrictId }: WardFormProps) {
  const [wardCode, setWardCode] = useState(ward?.wardCode || "");
  const [wardName, setWardName] = useState(ward?.wardName || "");
  const [wardType, setWardType] = useState(ward?.wardType || "Phường");
  const [provinceId, setProvinceId] = useState<number | string>("");
  const [districtId, setDistrictId] = useState<number | string>(ward?.districtId || defaultDistrictId || "");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiListRequest<Province>("/provinces/all")
      .then(setProvinces)
      .catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    void apiListRequest<District>(provinceId ? `/districts/all?provinceId=${provinceId}` : "/districts/all")
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, [provinceId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!districtId) {
      setError("Vui lòng chọn Quận / Huyện trực thuộc.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload = {
        wardCode: wardCode.trim(),
        wardName: wardName.trim(),
        wardType,
        districtId: Number(districtId),
      };

      await apiRequest<Ward>(ward ? `/wards/${ward.id}` : "/wards", {
        method: ward ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin Phường/Xã.");
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
            <h2 className="text-lg font-bold">{ward ? "Cập nhật Phường / Xã / Thị trấn" : "Thêm Phường / Xã / Thị trấn mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Quản lý danh mục cấp Phường, Xã, Thị trấn.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Lọc theo Tỉnh / Thành phố (Tùy chọn để thu gọn danh sách Quận/Huyện)
            </label>
            <select
              value={provinceId}
              onChange={(e) => setProvinceId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="">-- Tất cả Tỉnh / TP --</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.provinceName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Quận / Huyện / TP trực thuộc *
            </label>
            <select
              required
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="">-- Chọn Quận / Huyện / TP --</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.districtName} ({d.districtCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Mã Phường / Xã *
            </label>
            <input
              required
              value={wardCode}
              onChange={(e) => setWardCode(e.target.value)}
              placeholder="VD: 31804 (Tam Hưng), 00160 (Dịch Vọng Hậu)"
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Tên Phường / Xã *
            </label>
            <input
              required
              value={wardName}
              onChange={(e) => setWardName(e.target.value)}
              placeholder="VD: Xã Tam Hưng, Phường Hoàng Văn Thụ"
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider mb-1.5">
              Loại đơn vị hành chính
            </label>
            <select
              value={wardType}
              onChange={(e) => setWardType(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {WARD_TYPE_OPTIONS.map((opt) => (
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
            <span>{saving ? "Đang lưu..." : "Lưu Phường / Xã"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
