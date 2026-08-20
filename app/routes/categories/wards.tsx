import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ConfirmModal } from "../../components/confirm-modal";
import { WardForm } from "../../components/forms/ward-form";
import { PlusIcon, RoomIcon } from "../../components/icons";
import { Pagination } from "../../components/pagination";
import { SearchExportBar, type FilterField } from "../../components/search-export-bar";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import { exportToExcel } from "../../lib/excel";
import type { District, Province, User, Ward } from "../../types/management";

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

export default function WardsCategoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const districtParam = searchParams.get("districtId") || "";

  const [user, setUser] = useState<User | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState(districtParam);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    wardCode: "",
    wardName: "",
    wardType: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Ward | null | undefined>(undefined);
  const [deletingWard, setDeletingWard] = useState<Ward | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
    void apiListRequest<Province>("/provinces/all")
      .then(setProvinces)
      .catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    const url = selectedProvinceId ? `/districts/all?provinceId=${selectedProvinceId}` : "/districts/all";
    void apiListRequest<District>(url)
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, [selectedProvinceId]);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN");

  async function loadWards(distId?: string) {
    setLoading(true);
    setError("");
    try {
      const url = distId ? `/wards/all?districtId=${distId}` : "/wards/all";
      setWards(await apiListRequest<Ward>(url));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách Phường/Xã.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWards(selectedDistrictId);
  }, [selectedDistrictId]);

  function handleDistrictFilterChange(newDistId: string) {
    setSelectedDistrictId(newDistId);
    if (newDistId) {
      setSearchParams({ districtId: newDistId });
    } else {
      setSearchParams({});
    }
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleWards = useMemo(() => {
    const kw = search.trim().toLowerCase();
    const code = (filters.wardCode || "").trim().toLowerCase();
    const name = (filters.wardName || "").trim().toLowerCase();
    const type = (filters.wardType || "").trim().toLowerCase();

    return wards.filter((w) => {
      if (kw && !`${w.wardCode} ${w.wardName} ${w.wardType || ""} ${w.districtName || ""} ${w.provinceName || ""}`.toLowerCase().includes(kw)) {
        return false;
      }
      if (code && !w.wardCode.toLowerCase().includes(code)) return false;
      if (name && !w.wardName.toLowerCase().includes(name)) return false;
      if (type && !(w.wardType || "").toLowerCase().includes(type)) return false;
      return true;
    });
  }, [wards, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, selectedDistrictId]);

  const totalItems = visibleWards.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedWards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleWards.slice(start, start + pageSize);
  }, [visibleWards, currentPage, pageSize]);

  async function confirmDeleteWard() {
    if (!deletingWard) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/wards/${deletingWard.id}`, { method: "DELETE" });
      setDeletingWard(null);
      await loadWards(selectedDistrictId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa Phường/Xã.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      let exportData: Ward[] = [];
      try {
        exportData = await apiRequest<Ward[]>("/wards/export", {
          method: "POST",
          body: JSON.stringify({
            keyword: search || undefined,
            wardCode: filters.wardCode || undefined,
            wardName: filters.wardName || undefined,
            wardType: filters.wardType || undefined,
            districtId: selectedDistrictId ? Number(selectedDistrictId) : undefined,
          }),
        });
      } catch {
        exportData = visibleWards;
      }

      exportToExcel(
        exportData,
        "Danh_Sach_Phuong_Xa",
        "PhuongXa",
        [
          { key: "wardCode", header: "Mã Phường / Xã" },
          { key: "wardName", header: "Tên Phường / Xã / Thị trấn" },
          { key: "wardType", header: "Loại đơn vị" },
          { key: "districtName", header: "Quận / Huyện" },
          { key: "provinceName", header: "Tỉnh / Thành phố" },
        ]
      );
    } catch {
      alert("Không thể xuất danh sách Phường / Xã.");
    } finally {
      setExporting(false);
    }
  }

  const filterFields: FilterField[] = [
    { key: "wardCode", label: "Mã Phường / Xã", placeholder: "VD: 31804, 00160..." },
    { key: "wardName", label: "Tên Phường / Xã", placeholder: "VD: Tam Hưng, Dịch Vọng..." },
    { key: "wardType", label: "Loại đơn vị", placeholder: "VD: Phường, Xã..." },
  ];

  return (
    <AppShell title="Danh mục Phường / Xã / Thị trấn" description="Quản lý danh sách các Phường, Xã, Thị trấn cấp 3 theo CCCD/VNeID.">
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
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          2. Quận / Huyện / TP trực thuộc
        </Link>
        <Link
          to="/categories/wards"
          className="rounded-xl bg-cyan-500/15 border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 shadow-xs"
        >
          3. Phường / Xã / Thị trấn ({wards.length})
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
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách Phường / Xã / Thị trấn</h2>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusIcon size={16} />
              <span>Thêm Phường / Xã</span>
            </button>
          )}
        </div>

        {/* District Quick Filter Bar */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Tỉnh / TP:
            </label>
            <select
              value={selectedProvinceId}
              onChange={(e) => {
                setSelectedProvinceId(e.target.value);
                setSelectedDistrictId("");
              }}
              className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-500"
            >
              <option value="">-- Tất cả Tỉnh / TP --</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.provinceName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Quận / Huyện:
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => handleDistrictFilterChange(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-500"
            >
              <option value="">-- Tất cả Quận / Huyện --</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.districtName} ({d.districtCode})
                </option>
              ))}
            </select>
          </div>

          {selectedDistrictId && (
            <button
              onClick={() => handleDistrictFilterChange("")}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              Xóa bộ lọc Quận/Huyện
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
          onResetFilters={() => setFilters({ wardCode: "", wardName: "", wardType: "" })}
          onExport={handleExport}
          exporting={exporting}
        />

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Mã Phường / Xã</th>
                <th className="px-6 py-4">Tên Phường / Xã / Thị trấn</th>
                <th className="px-6 py-4">Loại đơn vị</th>
                <th className="px-6 py-4">Quận / Huyện</th>
                <th className="px-6 py-4">Tỉnh / Thành phố</th>
                {isAdmin && <th className="px-6 py-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu Phường / Xã…
                  </td>
                </tr>
              ) : paginatedWards.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có Phường/Xã nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedWards.map((ward) => (
                  <tr key={ward.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-cyan-700 dark:text-cyan-300">{ward.wardCode}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{ward.wardName}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                      <span className="rounded-full border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold text-slate-800 dark:text-slate-300">
                        {ward.wardType || "Phường"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{ward.districtName || "—"}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{ward.provinceName || "—"}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <ActionIcon label="Sửa Phường/Xã" color="blue" onClick={() => setEditing(ward)}>
                          <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                          <path d="m13.5 7 3.5 3.5" />
                        </ActionIcon>
                        <ActionIcon label="Xóa Phường/Xã" color="red" onClick={() => setDeletingWard(ward)}>
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
        <WardForm
          ward={editing}
          defaultDistrictId={selectedDistrictId}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadWards(selectedDistrictId);
          }}
        />
      )}

      {deletingWard && (
        <ConfirmModal
          title="Xác nhận xóa Phường / Xã"
          message={`Bạn có chắc muốn xóa "${deletingWard.wardName}" (${deletingWard.wardCode})?`}
          confirmLabel="Xóa Phường / Xã"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={confirmDeleteWard}
          onClose={() => setDeletingWard(null)}
        />
      )}
    </AppShell>
  );
}
