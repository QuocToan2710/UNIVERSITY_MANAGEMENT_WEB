import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { EmptyState } from "../components/empty-state";
import {
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "../components/icons";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import { exportToExcel } from "../lib/excel";
import type { Permission, Role } from "../types/management";

export function meta() {
  return [
    { title: "EduManage | Quản lý Vai trò & Phân quyền" },
    { name: "description", content: "Quản lý vai trò người dùng, phân quyền truy cập chức năng và bảo mật hệ thống" },
  ];
}

/**
 * Dropdown menu 3 chấm (...) cho cột Thao tác
 */
function RoleActionDropdown({
  onView,
  onEditPermissions,
  onDelete,
  isSystemRole = false,
}: {
  onView: () => void;
  onEditPermissions: () => void;
  onDelete?: () => void;
  isSystemRole?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs active:scale-95 cursor-pointer"
        title="Tùy chọn hành động"
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 origin-top-right rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-1 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-left">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onView();
            }}
            className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-2"
          >
            Xem quyền hạn
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEditPermissions();
            }}
            className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-2"
          >
            Phân quyền / Sửa
          </button>

          {!isSystemRole && onDelete && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-2"
            >
              Xóa vai trò
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RolesPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [editingRole, setEditingRole] = useState<Role | null | undefined>(undefined);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [formRoleCode, setFormRoleCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [permissionSearch, setPermissionSearch] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [roleList, permList] = await Promise.all([
        apiRequest<Role[]>("/roles"),
        apiRequest<Permission[]>("/permissions").catch(() => []),
      ]);
      setRoles(roleList || []);
      setAllPermissions(permList || []);
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else if (err.status === 403) setError("Bạn cần quyền quản trị viên (ADMIN) để truy cập quản lý vai trò.");
      else setError(err.message || "Không thể tải danh sách vai trò.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // System roles that shouldn't be deleted
  const systemRoleCodes = ["ADMIN", "TEACHER", "STUDENT", "USER"];

  // Filtered roles
  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        (r.roleCode && r.roleCode.toLowerCase().includes(q)) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, search]);

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const map = new Map<string, Permission[]>();
    const q = permissionSearch.trim().toLowerCase();

    allPermissions.forEach((p) => {
      if (q) {
        const match =
          (p.permissionCode && p.permissionCode.toLowerCase().includes(q)) ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.endpoint && p.endpoint.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q));
        if (!match) return;
      }
      const mod = p.module || "HỆ THỐNG / KHÁC";
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(p);
    });
    return map;
  }, [allPermissions, permissionSearch]);

  // Open Create/Edit modal
  function handleOpenForm(role?: Role | null) {
    if (role) {
      setEditingRole(role);
      setFormRoleCode(role.roleCode || role.name || "");
      setFormName(role.name || "");
      setFormDescription(role.description || "");
      const existingCodes = new Set((role.permissions || []).map((p) => p.permissionCode || p.name));
      setSelectedPermissions(existingCodes);
    } else {
      setEditingRole(null);
      setFormRoleCode("");
      setFormName("");
      setFormDescription("");
      setSelectedPermissions(new Set());
    }
    setPermissionSearch("");
    setError("");
  }

  // Toggle single permission
  function togglePermission(code: string) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  // Toggle all permissions in a module
  function toggleModulePermissions(modulePerms: Permission[]) {
    const codes = modulePerms.map((p) => p.permissionCode || p.name).filter(Boolean);
    const allChecked = codes.every((c) => selectedPermissions.has(c));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      codes.forEach((c) => {
        if (allChecked) next.delete(c);
        else next.add(c);
      });
      return next;
    });
  }

  // Save Role
  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      if (editingRole) {
        // Update permissions for existing role
        await apiRequest<Role>(`/roles/${editingRole.roleCode || editingRole.name}/permissions`, {
          method: "PUT",
          body: JSON.stringify(Array.from(selectedPermissions)),
        });
        setSuccessMsg(`Đã cập nhật quyền hạn cho vai trò "${editingRole.name}".`);
      } else {
        // Create new role
        await apiRequest<Role>("/roles", {
          method: "POST",
          body: JSON.stringify({
            roleCode: formRoleCode.trim().toUpperCase(),
            name: formName.trim(),
            description: formDescription.trim(),
            permissions: Array.from(selectedPermissions),
          }),
        });
        setSuccessMsg(`Đã tạo vai trò mới "${formName}".`);
      }
      setEditingRole(undefined);
      await loadData();
    } catch (reason) {
      const err = reason as ApiError;
      setError(err.message || "Lỗi khi lưu vai trò.");
    } finally {
      setSaving(false);
    }
  }

  // Delete Role
  async function handleDeleteConfirm() {
    if (!deletingRole) return;
    setDeleting(true);
    setError("");
    try {
      await apiRequest<void>(`/roles/${deletingRole.roleCode || deletingRole.name}`, {
        method: "DELETE",
      });
      setSuccessMsg(`Đã xóa vai trò "${deletingRole.name}".`);
      setDeletingRole(null);
      await loadData();
    } catch (reason) {
      const err = reason as ApiError;
      setError(err.message || "Không thể xóa vai trò.");
    } finally {
      setDeleting(false);
    }
  }

  // Export Excel
  function handleExportExcel() {
    exportToExcel(
      filteredRoles.map((r) => ({
        roleCode: r.roleCode || r.name,
        name: r.name,
        description: r.description || "—",
        permissionCount: (r.permissions || []).length,
      })) as unknown as Record<string, unknown>[],
      "Danh_Sach_Vai_Tro_He_Thong",
      "VaiTro",
      [
        { key: "roleCode", header: "Mã Vai Trò" },
        { key: "name", header: "Tên Vai Trò" },
        { key: "description", header: "Mô Tả Chức Năng" },
        { key: "permissionCount", header: "Số Lượng Quyền Hạn" },
      ]
    );
  }

  return (
    <AppShell
      title="Quản lý Vai trò & Phân quyền"
      description="Cấu hình nhóm quyền hạn, vai trò truy cập API và bảo mật chức năng toàn trường."
    >
      <div className="space-y-6">
        {/* KPI Stats Overview */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng số vai trò</p>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{roles.length} Vai trò</p>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng số quyền hệ thống</p>
            <p className="mt-2 text-2xl font-black text-cyan-600 dark:text-cyan-300">
              {allPermissions.length} API Permissions
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl p-5 backdrop-blur-xl">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vai trò mặc định</p>
            <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">
              {systemRoleCodes.length} Core Roles
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 cursor-pointer">
              <CloseIcon size={16} />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300 flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">
              <CloseIcon size={16} />
            </button>
          </div>
        )}

        {/* Main Card Container */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-72">
                <input
                  type="text"
                  placeholder="Tìm mã vai trò, tên, mô tả..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-slate-100"
                />
                <SearchIcon size={14} className="text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <button
                type="button"
                onClick={() => void loadData()}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <RefreshIcon size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {filteredRoles.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <DownloadIcon size={14} />
                  Xuất Excel
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenForm(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition cursor-pointer"
              >
                <PlusIcon size={14} />
                <span>Thêm vai trò mới</span>
              </button>
            </div>
          </div>

          {/* Roles Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                Đang tải danh sách vai trò hệ thống...
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Không tìm thấy vai trò nào"
                  description="Chưa có vai trò nào khớp với từ khóa tìm kiếm."
                />
              </div>
            ) : (
              <table className="w-full min-w-[750px] text-left text-xs table-auto">
                <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="w-12 px-3 py-3.5 text-center">STT</th>
                    <th className="w-36 px-4 py-3.5">Mã Vai Trò</th>
                    <th className="px-4 py-3.5 min-w-[150px]">Tên Vai Trò</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Mô Tả Chức Năng</th>
                    <th className="w-32 px-4 py-3.5 text-center">Quyền Hạn</th>
                    <th className="w-24 px-3 py-3.5 text-center">Phân Loại</th>
                    <th className="w-16 px-3 py-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
                  {filteredRoles.map((role, idx) => {
                    const isSystem = systemRoleCodes.includes((role.roleCode || role.name || "").toUpperCase());
                    const permCount = (role.permissions || []).length;

                    return (
                      <tr key={role.id || role.roleCode || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold font-mono text-blue-600 dark:text-cyan-400">
                          {role.roleCode || role.name}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                          {role.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {role.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingRole(role)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition cursor-pointer"
                          >
                            <ShieldCheckIcon size={13} />
                            <span>{permCount} quyền</span>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isSystem ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                              Hệ thống
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                              Tùy chỉnh
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <RoleActionDropdown
                            onView={() => setViewingRole(role)}
                            onEditPermissions={() => handleOpenForm(role)}
                            onDelete={!isSystem ? () => setDeletingRole(role) : undefined}
                            isSystemRole={isSystem}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FORM THÊM / PHÂN QUYỀN VAI TRÒ */}
      {/* ========================================================================= */}
      {editingRole !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingRole(undefined)}>
          <div
            className="w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 grid place-items-center font-bold shrink-0">
                  <ShieldCheckIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {editingRole ? `Phân Quyền Vai Trò: ${editingRole.name}` : "Tạo Vai Trò Mới"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Đã chọn {selectedPermissions.size} / {allPermissions.length} quyền hạn hệ thống
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRole(undefined)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Role Details (only editable on creation) */}
                {!editingRole && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mã vai trò (Role Code) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: ACCOUNTANT, MANAGER..."
                        value={formRoleCode}
                        onChange={(e) => setFormRoleCode(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tên hiển thị <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Kế toán viên, Quản lý..."
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mô tả vai trò
                      </label>
                      <input
                        type="text"
                        placeholder="Mô tả phạm vi quyền hạn và trách nhiệm..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Permissions Tree Matrix */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Danh Sách Quyền Hạn (Permissions)
                    </h4>
                    <div className="relative w-64">
                      <input
                        type="text"
                        placeholder="Tìm quyền theo API, tên, mã..."
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <SearchIcon size={13} className="text-slate-400 absolute left-2.5 top-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Array.from(permissionsByModule.entries()).map(([moduleName, modulePerms]) => {
                      const allInModuleChecked = modulePerms.every((p) =>
                        selectedPermissions.has(p.permissionCode || p.name)
                      );
                      const someInModuleChecked = modulePerms.some((p) =>
                        selectedPermissions.has(p.permissionCode || p.name)
                      );

                      return (
                        <div
                          key={moduleName}
                          className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/30"
                        >
                          <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allInModuleChecked}
                                ref={(input) => {
                                  if (input) input.indeterminate = someInModuleChecked && !allInModuleChecked;
                                }}
                                onChange={() => toggleModulePermissions(modulePerms)}
                                className="rounded text-cyan-600 focus:ring-cyan-500 size-4 cursor-pointer"
                              />
                              <span>Phân hệ: {moduleName}</span>
                              <span className="text-[11px] font-normal text-slate-400">
                                ({modulePerms.length} quyền)
                              </span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {modulePerms.map((perm) => {
                              const code = perm.permissionCode || perm.name;
                              const isChecked = selectedPermissions.has(code);

                              return (
                                <label
                                  key={code}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                                    isChecked
                                      ? "border-cyan-500/40 bg-cyan-50/60 dark:bg-cyan-950/20 text-slate-900 dark:text-slate-100"
                                      : "border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(code)}
                                    className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 size-3.5 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-xs truncate">
                                      {perm.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 truncate">
                                      [{perm.method || "API"}] {perm.endpoint || perm.permissionCode}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingRole(undefined)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editingRole && (!formRoleCode || !formName))}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {saving ? "Đang lưu..." : editingRole ? "Cập nhật phân quyền" : "Tạo vai trò mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: XEM CHI TIẾT QUYỀN HẠN CỦA VAI TRÒ */}
      {/* ========================================================================= */}
      {viewingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingRole(null)}>
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 grid place-items-center font-bold shrink-0">
                  <ShieldCheckIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Bảng Kê Quyền Hạn: {viewingRole.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mã: <strong className="font-mono text-cyan-600 dark:text-cyan-400">{viewingRole.roleCode || viewingRole.name}</strong> • Tổng: {(viewingRole.permissions || []).length} quyền
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRole(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {(viewingRole.permissions || []).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  Vai trò này chưa được gán bất kỳ quyền hạn nào.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="w-12 px-3 py-2.5 text-center">STT</th>
                        <th className="px-4 py-2.5 min-w-[150px]">Tên Quyền Hạn</th>
                        <th className="px-4 py-2.5 min-w-[120px]">Phân Hệ</th>
                        <th className="px-4 py-2.5">Endpoint API</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-300">
                      {(viewingRole.permissions || []).map((perm, idx) => (
                        <tr key={perm.id || perm.permissionCode || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5 text-center text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">
                            {perm.name}
                          </td>
                          <td className="px-4 py-2.5 text-cyan-600 dark:text-cyan-400 font-medium">
                            {perm.module || "HỆ THỐNG"}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            [{perm.method || "API"}] {perm.endpoint || perm.permissionCode}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  const roleToEdit = viewingRole;
                  setViewingRole(null);
                  handleOpenForm(roleToEdit);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-xs font-bold text-white transition cursor-pointer"
              >
                Chỉnh sửa phân quyền
              </button>
              <button
                type="button"
                onClick={() => setViewingRole(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XÁC NHẬN XÓA VAI TRÒ */}
      {/* ========================================================================= */}
      <ConfirmModal
        open={Boolean(deletingRole)}
        title="Xóa Vai Trò Người Dùng"
        description={`Bạn có chắc chắn muốn xóa vai trò "${deletingRole?.name}" (${deletingRole?.roleCode}) không? Các tài khoản đang giữ vai trò này sẽ bị thu hồi quyền tương ứng.`}
        confirmLabel="Xóa vai trò"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingRole(null)}
      />
    </AppShell>
  );
}
