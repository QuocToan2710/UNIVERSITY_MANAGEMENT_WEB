import React, { useState } from "react";
import { SearchIcon } from "./icons";

export type FilterField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select";
  options?: { value: string | number; label: string }[];
};

type SearchExportBarProps = {
  keyword: string;
  onKeywordChange: (val: string) => void;
  filterFields?: FilterField[];
  filterValues?: Record<string, any>;
  onFilterChange?: (key: string, value: any) => void;
  onResetFilters?: () => void;
  onExport: () => void;
  exporting?: boolean;
};

export function SearchExportBar({
  keyword,
  onKeywordChange,
  filterFields = [],
  filterValues = {},
  onFilterChange,
  onResetFilters,
  onExport,
  exporting = false,
}: SearchExportBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = Object.values(filterValues).filter(
    (v) => v !== undefined && v !== null && v !== "" && v !== "ALL"
  ).length;

  return (
    <div className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/60 p-4 space-y-4">
      {/* Primary Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg flex items-center">
          <span className="pointer-events-none absolute left-4 text-slate-400 dark:text-slate-400">
            <SearchIcon size={16} />
          </span>
          <input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/90 pl-11 pr-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-2xs"
            placeholder="Nhập từ khóa tìm kiếm nhanh (mã, tên, ghi chú...)..."
          />
          {keyword && (
            <button
              type="button"
              onClick={() => onKeywordChange("")}
              className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full text-xs cursor-pointer"
              title="Xóa từ khóa"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {filterFields.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition cursor-pointer shadow-2xs ${
                showAdvanced || activeFilterCount > 0
                  ? "border-cyan-400 bg-cyan-50 text-cyan-800 shadow-xs dark:border-cyan-400/60 dark:bg-cyan-500/20 dark:text-cyan-200 dark:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "border-slate-300 bg-white text-slate-700 hover:border-cyan-400 hover:text-cyan-700 dark:border-white/15 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-cyan-400/40 dark:hover:text-white"
              }`}
            >
              <svg className="size-3.5 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Bộ lọc nâng cao</span>
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-cyan-500 text-[10px] font-black text-slate-900 dark:text-white dark:bg-cyan-400 dark:text-slate-950">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:border-emerald-400 transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{exporting ? "Đang xuất..." : "Xuất Excel"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Advanced Filters */}
      {showAdvanced && filterFields.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/90 p-4 space-y-4 shadow-sm dark:shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filterFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    value={filterValues[field.key] ?? "ALL"}
                    onChange={(e) => onFilterChange?.(field.key, e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-2xs"
                  >
                    <option value="ALL">Tất cả {field.label.toLowerCase()}</option>
                    {field.options?.map((opt) => (
                      <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={filterValues[field.key] ?? ""}
                    onChange={(e) => onFilterChange?.(field.key, e.target.value)}
                    placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-2xs"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Action Button Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {activeFilterCount > 0 ? (
                <span className="text-cyan-700 dark:text-cyan-300 font-bold">Đang kích hoạt {activeFilterCount} điều kiện lọc</span>
              ) : (
                <span>Nhập thông tin để lọc danh sách tức thì</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onResetFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  disabled={activeFilterCount === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Xóa bộ lọc</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAdvanced(false)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                <SearchIcon size={14} />
                <span>Tìm kiếm / Đóng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
