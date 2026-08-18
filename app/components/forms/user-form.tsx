import { useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/api";
import { emptyUser, type User, type UserPayload } from "../../types/management";

type UserFormProps = {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
};

export function UserForm({ user, onClose, onSaved }: UserFormProps) {
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
        const payload: Record<string, any> = {
          id: user.id,
          username: form.username,
          fullName: form.fullName,
          email: form.email,
        };
        if (form.password && form.password.trim().length > 0) {
          payload.password = form.password;
        }
        await apiRequest<User>("/users/update", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 dark:bg-slate-50 dark:bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{user ? "Cập nhật thông tin tài khoản" : "Tạo tài khoản mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              {user ? "Chỉnh sửa tên, email và thông tin tài khoản." : "Nhập thông tin username và password để tạo tài khoản mới."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
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

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu tài khoản"}</span>
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
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-emerald-400 placeholder:text-slate-600"
      />
    </label>
  );
}
