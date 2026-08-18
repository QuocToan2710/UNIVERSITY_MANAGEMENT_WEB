import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ConfirmModal } from "../../components/confirm-modal";
import { RoomForm } from "../../components/forms/room-form";
import { PlusIcon, RoomIcon, SearchIcon } from "../../components/icons";
import { Pagination } from "../../components/pagination";
import { ApiError, apiListRequest, apiRequest } from "../../lib/api";
import type { Room, User } from "../../types/management";

export default function RoomsCategoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Room | null | undefined>(undefined);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN");

  async function loadRooms() {
    setLoading(true);
    setError("");
    try {
      setRooms(await apiListRequest<Room>("/rooms?size=1000").catch(async () => apiListRequest<Room>("/rooms")));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải danh sách phòng học.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRooms();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleRooms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rooms.filter((r) => {
      const matchesSearch = term
        ? `${r.roomCode} ${r.name} ${r.building || ""} ${r.roomType || ""} ${r.description || ""}`.toLowerCase().includes(term)
        : true;
      const matchesStatus = statusFilter === "ALL" ? true : r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rooms, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalItems = visibleRooms.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleRooms.slice(start, start + pageSize);
  }, [visibleRooms, currentPage, pageSize]);

  async function confirmDeleteRoom() {
    if (!deletingRoom) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/rooms/${deletingRoom.id}`, { method: "DELETE" });
      setDeletingRoom(null);
      await loadRooms();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa phòng học.");
    } finally {
      setDeleting(false);
    }
  }

  function renderStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
      case "HOẠT ĐỘNG":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Hoạt động
          </span>
        );
      case "MAINTENANCE":
      case "ĐANG BẢO TRÌ":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Đang bảo trì
          </span>
        );
      case "INACTIVE":
      case "TẠM KHÓA":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-300">
            <span className="size-1.5 rounded-full bg-red-400" />
            Tạm khóa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/30 bg-slate-500/10 px-3 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  }

  return (
    <AppShell title="Danh mục Phòng học" description="Danh mục phòng học, tòa nhà, sức chứa và quản lý trạng thái thiết bị.">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                <RoomIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách Phòng học</h2>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{rooms.length} phòng học khả dụng trong khuôn viên trường</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusIcon size={16} />
              <span>Thêm phòng học mới</span>
            </button>
          )}
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 p-4 bg-slate-50 dark:bg-slate-950/40">
          <div className="relative flex items-center sm:max-w-md w-full">
            <span className="pointer-events-none absolute left-4 text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white dark:bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Tìm theo mã phòng, tên phòng, tòa nhà, loại phòng..."
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-cyan-400"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="MAINTENANCE">Đang bảo trì</option>
              <option value="INACTIVE">Tạm khóa</option>
            </select>
          </div>
        </div>

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Mã phòng</th>
                <th className="px-6 py-4">Tên phòng học</th>
                <th className="px-6 py-4">Tòa nhà</th>
                <th className="px-6 py-4">Sức chứa</th>
                <th className="px-6 py-4">Loại phòng</th>
                <th className="px-6 py-4">Trạng thái</th>
                {isAdmin && <th className="px-6 py-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-10 text-center text-slate-400">
                    Đang tải danh mục phòng học…
                  </td>
                </tr>
              ) : paginatedRooms.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-10 text-center text-slate-400">
                    Chưa có phòng học nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedRooms.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-mono font-bold text-cyan-300">
                        {r.roomCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{r.name}</td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{r.building || "—"}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{r.capacity || 40} SV</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{r.roomType || "Giảng đường"}</td>
                    <td className="px-6 py-4">{renderStatusBadge(r.status)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <ActionIcon label="Sửa phòng học" color="blue" onClick={() => setEditing(r)}>
                          <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                          <path d="m13.5 7 3.5 3.5" />
                        </ActionIcon>
                        <ActionIcon label="Xóa phòng học" color="red" onClick={() => setDeletingRoom(r)}>
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
        <RoomForm
          room={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadRooms();
          }}
        />
      )}

      {deletingRoom && (
        <ConfirmModal
          title="Xác nhận xóa phòng học"
          message={`Bạn có chắc chắn muốn xóa phòng học ${deletingRoom.name} (${deletingRoom.roomCode})? Dữ liệu sẽ không thể hoàn tác.`}
          confirmText="Xóa phòng học"
          confirmVariant="danger"
          isSubmitting={deleting}
          onConfirm={() => void confirmDeleteRoom()}
          onClose={() => setDeletingRoom(null)}
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
