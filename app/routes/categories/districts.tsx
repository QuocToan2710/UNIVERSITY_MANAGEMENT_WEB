import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ConfirmModal } from "../../components/confirm-modal";
import { DistrictForm } from "../../components/forms/district-form";
import { PlusIcon, RoomIcon } from "../../components/icons";
import { Pagination } from "../../components/pagination";
import { SearchExportBar, type FilterField } from "../../components/search-export-bar";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import { exportToExcel } from "../../lib/excel";
import type { District, Province, User } from "../../types/management";

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

export default function DistrictsCategoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const provinceParam = searchParams.get("provinceId") || "";

  const [user, setUser] = useState<User | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(provinceParam);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    districtCode: "",
    districtName: "",
    districtType: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<District | null | undefined>(undefined);
  const [deletingDistrict, setDeletingDistrict] = useState<District | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
    void apiListRequest<Province>("/provinces/all")
      .then(setProvinces)
      .catch(() => setProvinces([]));
  }, []);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN");

  async function loadDistricts(provId?: string) {
    setLoading(true);
    setError("");
    try {
      const url = provId ? `/districts/all?provinceId=${provId}` : "/districts/all";
      setDistricts(await apiListRequest<District>(url));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách Quận/Huyện.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDistricts(selectedProvinceId);
  }, [selectedProvinceId]);

  function handleProvinceFilterChange(newProvId: string) {
    setSelectedProvinceId(newProvId);
    if (newProvId) {
      setSearchParams({ provinceId: newProvId });
    } else {
      setSearchParams({});
    }
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleDistricts = useMemo(() => {
    const kw = search.trim().toLowerCase();
    const code = (filters.districtCode || "").trim().toLowerCase();
    const name = (filters.districtName || "").trim().toLowerCase();
    const type = (filters.districtType || "").trim().toLowerCase();

    return districts.filter((d) => {
      if (kw && !`${d.districtCode} ${d.districtName} ${d.districtType || ""} ${d.provinceName || ""}`.toLowerCase().includes(kw)) {
        return false;
      }
      if (code && !d.districtCode.toLowerCase().includes(code)) return false;
      if (name && !d.districtName.toLowerCase().includes(name)) return false;
      if (type && !(d.districtType || "").toLowerCase().includes(type)) return false;
      return true;
    });
  }, [districts, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, selectedProvinceId]);

  const totalItems = visibleDistricts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedDistricts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleDistricts.slice(start, start + pageSize);
  }, [visibleDistricts, currentPage, pageSize]);

  async function confirmDeleteDistrict() {
    if (!deletingDistrict) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/districts/${deletingDistrict.id}`, { method: "DELETE" });
      setDeletingDistrict(null);
      await loadDistricts(selectedProvinceId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa Quận/Huyện.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      let exportData: District[] = [];
      try {
        exportData = await apiRequest<District[]>("/districts/export", {
          method: "POST",
          body: JSON.stringify({
            keyword: search || undefined,
            districtCode: filters.districtCode || undefined,
            districtName: filters.districtName || undefined,
            districtType: filters.districtType || undefined,
            provinceId: selectedProvinceId ? Number(selectedProvinceId) : undefined,
          }),
        });
      } catch {
        exportData = visibleDistricts;
      }

      exportToExcel(
        exportData,
        "Danh_Sach_Quan_Huyen",
        "QuanHuyen",
        [
          { key: "districtCode", header: "Mã Quận / Huyện" },
          { key: "districtName", header: "Tên Quận / Huyện / TP" },
          { key: "districtType", header: "Loại đơn vị" },
          { key: "provinceName", header: "Tỉnh / TP trực thuộc" },
        ]
      );
    } catch {
      alert("Không thể xuất danh sách Quận / Huyện.");
    } finally {
      setExporting(false);
    }
  }

  const filterFields: FilterField[] = [
    { key: "districtCode", label: "Mã Quận / Huyện", placeholder: "VD: 318, 005..." },
    { key: "districtName", label: "Tên Quận / Huyện", placeholder: "VD: Thủy Nguyên..." },
    { key: "districtType", label: "Loại đơn vị", placeholder: "VD: Quận, Huyện, TP..." },
  ];

  return (
    <AppShell title="Danh mục Quận / Huyện / TP trực thuộc" description="Quản lý danh sách các Quận, Huyện, Thị xã, Thành phố trực thuộc tỉnh và TW.">
      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
        <Link
          to="/categories/provinces"
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          1. Tỉnh / Thành phố
        </Link>
        <Link
          to="/categories/districts"
          className="rounded-xl bg-cyan-500/15 border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 shadow-xs"
        >
          2. Quận / Huyện / TP trực thuộc ({districts.length})
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
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách Quận / Huyện / TP</h2>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusIcon size={16} />
              <span>Thêm Quận / Huyện / TP</span>
            </button>
          )}
        </div>

        {/* Province Quick Filter Bar */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-white/5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Lọc theo Tỉnh / TP:
          </label>
          <select
            value={selectedProvinceId}
            onChange={(e) => handleProvinceFilterChange(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-500"
          >
            <option value="">-- Tất cả 63 Tỉnh / Thành phố --</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.provinceName} ({p.provinceCode})
              </option>
            ))}
          </select>
          {selectedProvinceId && (
            <button
              onClick={() => handleProvinceFilterChange("")}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              Xóa bộ lọc Tỉnh
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
          onResetFilters={() => setFilters({ districtCode: "", districtName: "", districtType: "" })}
          onExport={handleExport}
          exporting={exporting}
        />

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Mã Quận / Huyện</th>
                <th className="px-6 py-4">Tên Quận / Huyện / TP</th>
                <th className="px-6 py-4">Loại đơn vị</th>
                <th className="px-6 py-4">Tỉnh / TP trực thuộc</th>
                <th className="px-6 py-4">Phường / Xã trực thuộc</th>
                {isAdmin && <th className="px-6 py-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu Quận / Huyện…
                  </td>
                </tr>
              ) : paginatedDistricts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có Quận/Huyện nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedDistricts.map((district) => (
                  <tr key={district.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-cyan-700 dark:text-cyan-300">{district.districtCode}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{district.districtName}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                      <span className="rounded-full border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold text-slate-800 dark:text-slate-300">
                        {district.districtType || "Quận"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{district.provinceName || "—"}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/categories/wards?districtId=${district.id}`}
                        className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Xem danh sách Phường/Xã ➔</span>
                      </Link>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <ActionIcon label="Sửa Quận/Huyện" color="blue" onClick={() => setEditing(district)}>
                          <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                          <path d="m13.5 7 3.5 3.5" />
                        </ActionIcon>
                        <ActionIcon label="Xóa Quận/Huyện" color="red" onClick={() => setDeletingDistrict(district)}>
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
        <DistrictForm
          district={editing}
          defaultProvinceId={selectedProvinceId}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadDistricts(selectedProvinceId);
          }}
        />
      )}

      {deletingDistrict && (
        <ConfirmModal
          title="Xác nhận xóa Quận / Huyện"
          message={`Bạn có chắc muốn xóa "${deletingDistrict.districtName}" (${deletingDistrict.districtCode})? Các Phường/Xã trực thuộc có thể bị ảnh hưởng.`}
          confirmLabel="Xóa Quận / Huyện"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={confirmDeleteDistrict}
          onClose={() => setDeletingDistrict(null)}
        />
      )}
    </AppShell>
  );
}
