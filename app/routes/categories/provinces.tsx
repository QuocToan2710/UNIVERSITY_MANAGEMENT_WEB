import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ConfirmModal } from "../../components/confirm-modal";
import { ProvinceForm } from "../../components/forms/province-form";
import { PlusIcon, RoomIcon } from "../../components/icons";
import { Pagination } from "../../components/pagination";
import { SearchExportBar, type FilterField } from "../../components/search-export-bar";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import { exportToExcel } from "../../lib/excel";
import type { Province, User } from "../../types/management";

function ActionIcon({
  label,
  color,
  onClick,
  children,
}: {
  label: string;
  color: "blue" | "red";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const colorClass =
    color === "blue"
      ? "text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
      : "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-grid size-8 place-items-center rounded-lg transition-colors cursor-pointer ${colorClass}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
        {children}
      </svg>
    </button>
  );
}

export default function ProvincesCategoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    provinceCode: "",
    provinceName: "",
    provinceType: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Province | null | undefined>(undefined);
  const [deletingProvince, setDeletingProvince] = useState<Province | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN");

  async function loadProvinces() {
    setLoading(true);
    setError("");
    try {
      setProvinces(await apiListRequest<Province>("/provinces/all"));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách Tỉnh / Thành phố.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProvinces();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleProvinces = useMemo(() => {
    const kw = search.trim().toLowerCase();
    const code = (filters.provinceCode || "").trim().toLowerCase();
    const name = (filters.provinceName || "").trim().toLowerCase();
    const type = (filters.provinceType || "").trim().toLowerCase();

    return provinces.filter((p) => {
      if (kw && !`${p.provinceCode} ${p.provinceName} ${p.provinceType || ""}`.toLowerCase().includes(kw)) {
        return false;
      }
      if (code && !p.provinceCode.toLowerCase().includes(code)) return false;
      if (name && !p.provinceName.toLowerCase().includes(name)) return false;
      if (type && !(p.provinceType || "").toLowerCase().includes(type)) return false;
      return true;
    });
  }, [provinces, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const totalItems = visibleProvinces.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProvinces = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleProvinces.slice(start, start + pageSize);
  }, [visibleProvinces, currentPage, pageSize]);

  async function confirmDeleteProvince() {
    if (!deletingProvince) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/provinces/${deletingProvince.id}`, { method: "DELETE" });
      setDeletingProvince(null);
      await loadProvinces();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa Tỉnh/Thành phố.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      let exportData: Province[] = [];
      try {
        exportData = await apiRequest<Province[]>("/provinces/export", {
          method: "POST",
          body: JSON.stringify({
            keyword: search || undefined,
            provinceCode: filters.provinceCode || undefined,
            provinceName: filters.provinceName || undefined,
            provinceType: filters.provinceType || undefined,
          }),
        });
      } catch {
        exportData = visibleProvinces;
      }

      exportToExcel(
        exportData,
        "Danh_Sach_Tinh_Thanh_Pho",
        "TinhThanh",
        [
          { key: "provinceCode", header: "Mã Tỉnh / TP" },
          { key: "provinceName", header: "Tên Tỉnh / Thành phố" },
          { key: "provinceType", header: "Loại đơn vị" },
        ]
      );
    } catch {
      alert("Không thể xuất danh sách Tỉnh / Thành phố.");
    } finally {
      setExporting(false);
    }
  }

  const filterFields: FilterField[] = [
    { key: "provinceCode", label: "Mã Tỉnh / TP", placeholder: "VD: 31, 01..." },
    { key: "provinceName", label: "Tên Tỉnh / TP", placeholder: "VD: Hải Phòng..." },
    { key: "provinceType", label: "Loại đơn vị", placeholder: "VD: Thành phố Trung ương..." },
  ];

  return (
    <AppShell title="Danh mục Tỉnh / Thành phố" description="Quản lý danh sách các tỉnh, thành phố trực thuộc Trung ương trong hệ thống.">
      {/* Navigation Tabs for Administrative Units */}
      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
        <Link
          to="/categories/provinces"
          className="rounded-xl bg-cyan-500/15 border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 shadow-xs"
        >
          1. Tỉnh / Thành phố ({provinces.length})
        </Link>
        <Link
          to="/categories/districts"
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          2. Quận / Huyện / TP trực thuộc
        </Link>
        <Link
          to="/categories/wards"
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          3. Phường / Xã / Thị trấn
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <RoomIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách Tỉnh / Thành phố</h2>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusIcon size={16} />
              <span>Thêm Tỉnh / Thành phố</span>
            </button>
          )}
        </div>

        {/* Search & Export Bar */}
        <SearchExportBar
          keyword={search}
          onKeywordChange={setSearch}
          filterFields={filterFields}
          filterValues={filters}
          onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          onResetFilters={() => setFilters({ provinceCode: "", provinceName: "", provinceType: "" })}
          onExport={handleExport}
          exporting={exporting}
        />

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Mã Tỉnh / TP</th>
                <th className="px-6 py-4">Tên Tỉnh / Thành phố</th>
                <th className="px-6 py-4">Loại đơn vị</th>
                <th className="px-6 py-4">Quận / Huyện trực thuộc</th>
                {isAdmin && <th className="px-6 py-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu Tỉnh / Thành phố…
                  </td>
                </tr>
              ) : paginatedProvinces.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-10 text-center text-slate-400">
                    Chưa có Tỉnh/Thành phố nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedProvinces.map((province) => (
                  <tr key={province.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-cyan-700 dark:text-cyan-300">{province.provinceCode}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{province.provinceName}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                      <span className="rounded-full border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold text-slate-800 dark:text-slate-300">
                        {province.provinceType || "Tỉnh"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/categories/districts?provinceId=${province.id}`}
                        className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Xem danh sách Quận/Huyện ➔</span>
                      </Link>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <ActionIcon label="Sửa Tỉnh/TP" color="blue" onClick={() => setEditing(province)}>
                          <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                          <path d="m13.5 7 3.5 3.5" />
                        </ActionIcon>
                        <ActionIcon label="Xóa Tỉnh/TP" color="red" onClick={() => setDeletingProvince(province)}>
                          <path d="M4 7h16" />
                          <path d="M10 11v5M14 11v5M6 7l1-3h10l1 3M7 7l1 13h8l1-13" />
                        </ActionIcon>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>

      {editing !== undefined && (
        <ProvinceForm
          province={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadProvinces();
          }}
        />
      )}

      {deletingProvince && (
        <ConfirmModal
          title="Xác nhận xóa Tỉnh / Thành phố"
          message={`Bạn có chắc muốn xóa "${deletingProvince.provinceName}" (${deletingProvince.provinceCode})? Các Quận/Huyện trực thuộc có thể bị ảnh hưởng.`}
          confirmLabel="Xóa Tỉnh / TP"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={confirmDeleteProvince}
          onClose={() => setDeletingProvince(null)}
        />
      )}
    </AppShell>
  );
}
