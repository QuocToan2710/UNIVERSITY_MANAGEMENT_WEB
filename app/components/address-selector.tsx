import React, { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { SelectOption } from "../types/response";

export type AddressData = {
  provinceId?: number | string;
  provinceName?: string;
  districtId?: number | string;
  districtName?: string;
  wardId?: number | string;
  wardName?: string;
  specificAddress?: string;
  fullAddress?: string;
};

type AddressSelectorProps = {
  provinceId?: number | string | null;
  districtId?: number | string | null;
  wardId?: number | string | null;
  specificAddress?: string;
  currentAddress?: string;
  onChange: (data: AddressData) => void;
  disabled?: boolean;
  required?: boolean;
};

export function AddressSelector({
  provinceId,
  districtId,
  wardId,
  specificAddress = "",
  currentAddress = "",
  onChange,
  disabled = false,
  required = false,
}: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<SelectOption[]>([]);
  const [districts, setDistricts] = useState<SelectOption[]>([]);
  const [wards, setWards] = useState<SelectOption[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingProvinces(true);
    apiRequest<SelectOption[]>("/master-data?type=PROVINCE")
      .then((res) => {
        if (isMounted) setProvinces(res || []);
      })
      .catch(() => {
        if (isMounted) setProvinces([]);
      })
      .finally(() => {
        if (isMounted) setLoadingProvinces(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load districts when provinceId changes
  useEffect(() => {
    let isMounted = true;
    if (!provinceId) {
      setDistricts([]);
      setWards([]);
      return;
    }
    setLoadingDistricts(true);
    apiRequest<SelectOption[]>(`/master-data?type=DISTRICT&cascader=${provinceId}`)
      .then((res) => {
        if (isMounted) setDistricts(res || []);
      })
      .catch(() => {
        if (isMounted) setDistricts([]);
      })
      .finally(() => {
        if (isMounted) setLoadingDistricts(false);
      });
    return () => {
      isMounted = false;
    };
  }, [provinceId]);

  // Load wards when districtId changes
  useEffect(() => {
    let isMounted = true;
    if (!districtId) {
      setWards([]);
      return;
    }
    setLoadingWards(true);
    apiRequest<SelectOption[]>(`/master-data?type=WARD&cascader=${districtId}`)
      .then((res) => {
        if (isMounted) setWards(res || []);
      })
      .catch(() => {
        if (isMounted) setWards([]);
      })
      .finally(() => {
        if (isMounted) setLoadingWards(false);
      });
    return () => {
      isMounted = false;
    };
  }, [districtId]);

  function buildFullAddressStr(spec: string, wId?: number | string, dId?: number | string, pId?: number | string) {
    const pName = provinces.find((p) => String(p.value) === String(pId))?.label || "";
    const dName = districts.find((d) => String(d.value) === String(dId))?.label || "";
    const wName = wards.find((w) => String(w.value) === String(wId))?.label || "";

    const parts = [spec.trim(), wName, dName, pName].filter(Boolean);
    return {
      provinceName: pName,
      districtName: dName,
      wardName: wName,
      fullAddress: parts.join(", "),
    };
  }

  function handleProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newProvId = e.target.value;
    const { provinceName, fullAddress } = buildFullAddressStr(specificAddress, undefined, undefined, newProvId);
    onChange({
      provinceId: newProvId,
      provinceName,
      districtId: "",
      districtName: "",
      wardId: "",
      wardName: "",
      specificAddress,
      fullAddress,
    });
  }

  function handleDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newDistId = e.target.value;
    const { provinceName, districtName, fullAddress } = buildFullAddressStr(specificAddress, undefined, newDistId, provinceId || undefined);
    onChange({
      provinceId: provinceId || undefined,
      provinceName,
      districtId: newDistId,
      districtName,
      wardId: "",
      wardName: "",
      specificAddress,
      fullAddress,
    });
  }

  function handleWardChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newWardId = e.target.value;
    const { provinceName, districtName, wardName, fullAddress } = buildFullAddressStr(specificAddress, newWardId, districtId || undefined, provinceId || undefined);
    onChange({
      provinceId: provinceId || undefined,
      provinceName,
      districtId: districtId || undefined,
      districtName,
      wardId: newWardId,
      wardName,
      specificAddress,
      fullAddress,
    });
  }

  function handleSpecificAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newSpecific = e.target.value;
    const { provinceName, districtName, wardName, fullAddress } = buildFullAddressStr(newSpecific, wardId || undefined, districtId || undefined, provinceId || undefined);
    onChange({
      provinceId: provinceId || undefined,
      provinceName,
      districtId: districtId || undefined,
      districtName,
      wardId: wardId || undefined,
      wardName,
      specificAddress: newSpecific,
      fullAddress,
    });
  }

  return (
    <div className="space-y-3">
      {/* Current Saved Address Display */}
      {(currentAddress || specificAddress) && (
        <div className="flex items-center gap-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/20 px-3.5 py-2.5 text-xs text-cyan-900 dark:text-cyan-200">
          <span className="shrink-0 text-sm">📍</span>
          <div className="flex-1 min-w-0">
            <span className="font-bold">Địa chỉ hiện tại:</span>{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {currentAddress || specificAddress}
            </span>
          </div>
        </div>
      )}

      {/* 3-Tier Cascading Dropdowns */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Tỉnh / Thành phố */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tỉnh / Thành phố {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={provinceId ? String(provinceId) : ""}
            onChange={handleProvinceChange}
            disabled={disabled || loadingProvinces}
            required={required}
            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
          >
            <option value="">
              {loadingProvinces ? "-- Đang tải danh sách Tỉnh/TP --" : "-- Chọn Tỉnh / Thành phố --"}
            </option>
            {provinces.map((p) => (
              <option key={p.value} value={String(p.value)}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quận / Huyện / TP thuộc tỉnh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Quận / Huyện / TP trực thuộc {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={districtId ? String(districtId) : ""}
            onChange={handleDistrictChange}
            disabled={disabled || !provinceId || loadingDistricts}
            required={required}
            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
          >
            <option value="">
              {!provinceId
                ? "-- Hãy chọn Tỉnh/TP trước --"
                : loadingDistricts
                ? "-- Đang tải Quận/Huyện --"
                : "-- Chọn Quận / Huyện / TP --"}
            </option>
            {districts.map((d) => (
              <option key={d.value} value={String(d.value)}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Phường / Xã / Thị trấn */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Phường / Xã / Thị trấn {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={wardId ? String(wardId) : ""}
            onChange={handleWardChange}
            disabled={disabled || !districtId || loadingWards}
            required={required}
            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
          >
            <option value="">
              {!districtId
                ? "-- Hãy chọn Quận/Huyện trước --"
                : loadingWards
                ? "-- Đang tải Phường/Xã --"
                : "-- Chọn Phường / Xã --"}
            </option>
            {wards.map((w) => (
              <option key={w.value} value={String(w.value)}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Số nhà, Thôn, Xóm, Tổ dân phố */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Số nhà, Thôn / Xóm / Tên đường (Chi tiết theo CCCD)
        </label>
        <input
          type="text"
          value={specificAddress}
          onChange={handleSpecificAddressChange}
          disabled={disabled}
          placeholder="Ví dụ: Thôn 3, Xóm Cầu, hoặc Số 12 Ngõ 45"
          className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}
