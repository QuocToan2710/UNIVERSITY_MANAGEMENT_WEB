import React from "react";

type PaginationProps = {
  currentPage: number; // 1-indexed
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/40 text-xs font-medium text-slate-600 dark:text-slate-400">
      {/* Information & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Hiển thị <strong className="font-bold text-slate-900 dark:text-white">{startItem}</strong> - <strong className="font-bold text-slate-900 dark:text-white">{endItem}</strong> trên <strong className="font-bold text-slate-900 dark:text-white">{totalItems}</strong> kết quả
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2 border-l border-slate-300 dark:border-white/10 pl-3">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-white outline-none focus:border-cyan-500 cursor-pointer shadow-2xs font-semibold"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className="grid size-8 place-items-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:border-cyan-400 hover:text-cyan-700 dark:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          title="Trang đầu"
        >
          «
        </button>

        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="grid size-8 place-items-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:border-cyan-400 hover:text-cyan-700 dark:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          title="Trang trước"
        >
          ‹
        </button>

        {getPageNumbers().map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={idx}
              type="button"
              onClick={() => onPageChange(p)}
              className={`grid min-w-8 h-8 px-2.5 place-items-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                p === currentPage
                  ? "border-cyan-400 bg-cyan-50 text-cyan-800 shadow-xs dark:border-cyan-400/50 dark:bg-cyan-500/20 dark:text-cyan-300 dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-700 dark:hover:text-white shadow-2xs"
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-slate-400 dark:text-slate-500 font-bold">
              ...
            </span>
          )
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="grid size-8 place-items-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:border-cyan-400 hover:text-cyan-700 dark:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          title="Trang sau"
        >
          ›
        </button>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="grid size-8 place-items-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:border-cyan-400 hover:text-cyan-700 dark:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          title="Trang cuối"
        >
          »
        </button>
      </div>
    </div>
  );
}
