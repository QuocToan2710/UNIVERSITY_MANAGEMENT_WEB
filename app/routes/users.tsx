import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { UserForm } from "../components/forms/user-form";
import { PlusIcon, SearchIcon, UsersIcon } from "../components/icons";
import { Pagination } from "../components/pagination";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import type { User } from "../types/management";

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<User | null | undefined>(undefined);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      setUsers(await apiListRequest<User>("/users?size=1000").catch(async () => apiListRequest<User>("/users")));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else if (err.status === 403) setError("Bạn cần quyền quản trị viên (ADMIN) để quản lý tài khoản người dùng.");
      else setError(err.message || "Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? users.filter((u) => `${u.username} ${u.fullName} ${u.email}`.toLowerCase().includes(term))
      : users;
  }, [users, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalItems = visibleUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleUsers.slice(start, start + pageSize);
  }, [visibleUsers, currentPage, pageSize]);

  async function confirmDeleteUser() {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await apiRequest<string>(`/users/${deletingUser.id}`, { method: "DELETE" });
      setDeletingUser(null);
      await loadUsers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa tài khoản.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Quản lý Tài khoản" description="Phân quyền quản trị viên và người dùng hệ thống EduManage.">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                <UsersIcon size={18} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách tài khoản hệ thống</h2>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{users.length} tài khoản người dùng đã đăng ký</p>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 px-5 py-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusIcon size={16} />
            <span>Tạo tài khoản mới</span>
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-white/5 p-4 bg-slate-50 dark:bg-slate-950/40">
          <div className="relative flex items-center sm:max-w-md">
            <span className="pointer-events-none absolute left-4 text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white dark:bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Tìm theo username, tên người dùng, email..."
            />
          </div>
        </div>

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Tài khoản (Username)</th>
                <th className="px-6 py-4">Họ và tên</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Vai trò (Roles)</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                    Đang tải dữ liệu tài khoản…
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                    Chưa có tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-cyan-700 dark:text-cyan-300 font-mono">{user.username}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{user.fullName}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role.name}
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                role.name === "ADMIN"
                                  ? "border-amber-400/40 bg-amber-500/10 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                                  : "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                              }`}
                            >
                              {role.name}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                            USER
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa tài khoản" color="blue" onClick={() => setEditing(user)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa tài khoản" color="red" onClick={() => setDeletingUser(user)}>
                        <path d="M4 7h16" />
                        <path d="M10 11v5M14 11v5M6 7l1-3h10l1 3M7 7l1 13h8l1-13" />
                      </ActionIcon>
                    </td>
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
        <UserForm
          user={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadUsers();
          }}
        />
      )}

      {deletingUser && (
        <ConfirmModal
          title="Xác nhận xóa tài khoản"
          message={`Bạn có chắc chắn muốn xóa tài khoản ${deletingUser.username} (${deletingUser.fullName})? Dữ liệu sẽ không thể hoàn tác.`}
          loading={deleting}
          onConfirm={confirmDeleteUser}
          onClose={() => setDeletingUser(null)}
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
      ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300"
      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}
