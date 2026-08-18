import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ConfirmModal } from "../../components/confirm-modal";
import { FloorForm } from "../../components/forms/floor-form";
import { PlusIcon, RoomIcon, SearchIcon } from "../../components/icons";
import { Pagination } from "../../components/pagination";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import type { Floor, User } from "../../types/management";

export default function FloorsCategoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Floor | null | undefined>(undefined);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN");

  async function loadFloors() {
    setLoading(true);
    setError("");
    try {
      setFloors(await apiListRequest<Floor>("/floors?size=1000").catch(async () => apiListRequest<Floor>("/floors")));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách tầng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFloors();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleFloors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? floors.filter((f) =>
          `${f.floorCode} ${f.name} ${f.buildingName || ""} ${f.description || ""}`.toLowerCase().includes(term)
        )
      : floors;
  }, [floors, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalItems = visibleFloors.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedFloors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleFloors.slice(start, start + pageSize);
  }, [visibleFloors, currentPage, pageSize]);

  async function confirmDeleteFloor() {
    if (!deletingFloor) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/floors/${deletingFloor.id}`, { method: "DELETE" });
      setDeletingFloor(null);
      await loadFloors();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa tầng.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Danh mục Tầng" description="Quản lý danh sách các tầng trong từng tòa nhà thuộc khuôn viên đào tạo.">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                <RoomIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách Tầng</h2>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{floors.length} tầng đã được phân chia theo tòa nhà</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusIcon size={16} />
              <span>Thêm tầng mới</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="border-b border-white/5 p-4 bg-slate-50 dark:bg-slate-950/40">
          <div className="relative flex items-center sm:max-w-md w-full">
            <span className="pointer-events-none absolute left-4 text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white dark:bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Tìm theo mã tầng, tên tầng, tòa nhà..."
            />
          </div>
        </div>

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Mã tầng</th>
                <th className="px-6 py-4">Tên tầng</th>
                <th className="px-6 py-4">Tòa nhà trực thuộc</th>
                <th className="px-6 py-4">Số thứ tự tầng</th>
                <th className="px-6 py-4">Trạng thái</th>
                {isAdmin && <th className="px-6 py-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu tầng…
                  </td>
                </tr>
              ) : paginatedFloors.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có tầng nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedFloors.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-mono font-bold text-cyan-300">
                        {f.floorCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{f.name}</td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{f.buildingName || "—"}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">Tầng {f.floorNumber || 1}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {f.status || "Hoạt động"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <ActionIcon label="Sửa tầng" color="blue" onClick={() => setEditing(f)}>
                          <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                          <path d="m13.5 7 3.5 3.5" />
                        </ActionIcon>
                        <ActionIcon label="Xóa tầng" color="red" onClick={() => setDeletingFloor(f)}>
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

        {/* Pagination Bar */}
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
        <FloorForm
          floor={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadFloors();
          }}
        />
      )}

      {deletingFloor && (
        <ConfirmModal
          title="Xác nhận xóa tầng"
          message={`Bạn có chắc chắn muốn xóa tầng ${deletingFloor.name} (${deletingFloor.floorCode})? Dữ liệu sẽ không thể hoàn tác.`}
          confirmText="Xóa tầng"
          confirmVariant="danger"
          isSubmitting={deleting}
          onConfirm={() => void confirmDeleteFloor()}
          onClose={() => setDeletingFloor(null)}
        />
      )}
    </AppShell>
  );
}

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
  const tones =
    color === "blue"
      ? "text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors cursor-pointer ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
