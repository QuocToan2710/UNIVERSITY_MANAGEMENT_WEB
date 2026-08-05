import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { PlusIcon, SearchIcon, UsersIcon } from "../components/icons";
import { ApiError, apiRequest } from "../lib/api";
import { emptyUser, type User, type UserPayload } from "../types/management";

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<User | null | undefined>(undefined);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      setUsers(await apiRequest<User[]>("/users"));
    } catch (reason) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.status === 403 ? "Bạn không có quyền xem danh sách người dùng." : err.message || "Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? users.filter((u) =>
          `${u.username} ${u.fullName} ${u.email}`.toLowerCase().includes(term)
        )
      : users;
  }, [users, search]);

  async function deleteUser(user: User) {
    if (!window.confirm(`Xóa tài khoản người dùng ${user.username}?`)) return;
    try {
      await apiRequest<string>(`/users/${user.id}`, { method: "DELETE" });
      await loadUsers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa tài khoản.");
    }
  }

  return (
    <AppShell title="Quản lý Tài khoản" description="Danh sách tài khoản người dùng và vai trò phân quyền hệ thống.">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.25)]">
                <UsersIcon size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Tài khoản hệ thống</h2>
                <p className="mt-0.5 text-xs text-slate-400">{users.length} tài khoản quản trị đã tạo</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 px-5 py-3 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <PlusIcon size={16} />
            <span>Tạo tài khoản mới</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-white/5 p-4 bg-slate-950/40">
          <div className="relative flex items-center sm:max-w-md">
            <span className="pointer-events-none absolute left-4 text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Tìm theo username, tên hoặc email tài khoản..."
            />
          </div>
        </div>

        {error && <p className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">{error}</p>}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-emerald-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Họ và tên</th>
                <th className="px-6 py-4">Tên tài khoản</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Vai trò phân quyền</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Đang tải dữ liệu tài khoản…
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Chưa có tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-100">{user.fullName}</td>
                    <td className="px-6 py-4 font-mono text-cyan-300">{user.username}</td>
                    <td className="px-6 py-4 text-slate-300">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.roles?.map((role) => (
                        <span
                          key={role.name}
                          className="mr-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider shadow-[0_0_10px_rgba(34,211,238,0.15)]"
                        >
                          {role.name}
                        </span>
                      )) || <span className="text-slate-500">USER</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionIcon label="Sửa người dùng" color="blue" onClick={() => setEditing(user)}>
                        <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
                        <path d="m13.5 7 3.5 3.5" />
                      </ActionIcon>
                      <ActionIcon label="Xóa người dùng" color="red" onClick={() => void deleteUser(user)}>
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
    </AppShell>
  );
}

function UserForm({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<UserPayload>(
    user
      ? { id: user.id, username: user.username, fullName: user.fullName, email: user.email, password: "" }
      : emptyUser
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof UserPayload>(key: K, value: UserPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (user) {
        // Backend update API is PUT /users/update with body { id, username, fullName, email }
        await apiRequest<User>("/users/update", {
          method: "PUT",
          body: JSON.stringify({
            id: user.id,
            username: form.username,
            fullName: form.fullName,
            email: form.email,
          }),
        });
      } else {
        // Backend create API is POST /users with body { username, password, fullName, email }
        await apiRequest<User>("/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin tài khoản.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-xl">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-white"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{user ? "Cập nhật thông tin tài khoản" : "Tạo tài khoản mới"}</h2>
            <p className="mt-1 text-xs text-slate-400">
              {user ? "Chỉnh sửa tên, email và thông tin tài khoản." : "Nhập thông tin username và password để tạo tài khoản mới."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Tên tài khoản (Username)"
            value={form.username}
            onChange={(v) => update("username", v)}
            required
            placeholder="Min 6 ký tự"
          />
          <Field label="Họ và tên" value={form.fullName} onChange={(v) => update("fullName", v)} required />
          <Field label="Email liên hệ" type="email" value={form.email} onChange={(v) => update("email", v)} required />

          {!user && (
            <Field
              label="Mật khẩu (Password)"
              type="password"
              value={form.password || ""}
              onChange={(v) => update("password", v)}
              required
              placeholder="Min 5 ký tự"
            />
          )}
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu tài khoản"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400"
      />
    </label>
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
      ? "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
      : "text-red-400 hover:bg-red-500/10 hover:text-red-300";
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`mr-1 rounded-xl p-2 transition-colors ${tones}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        {children}
      </svg>
    </button>
  );
}


