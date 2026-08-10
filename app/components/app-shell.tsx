import { useEffect, useState } from "react";
import { NavLink, useNavigate, type NavLinkRenderProps } from "react-router";
import { apiRequest } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";
import type { User } from "../types/management";
import {
  BellIcon,
  ClassGroupIcon,
  CourseIcon,
  DashboardIcon,
  EduManageLogo,
  LogoutIcon,
  ScheduleIcon,
  StudentIcon,
  TeacherIcon,
  UsersIcon,
} from "./icons";

type AppShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const allNavigation = [
  { to: "/", label: "Tổng quan", Icon: DashboardIcon, end: true, allowedRoles: ["ADMIN", "TEACHER", "STUDENT", "USER"] },
  { to: "/schedule", label: "Lịch học", Icon: ScheduleIcon, allowedRoles: ["ADMIN", "TEACHER", "STUDENT"] },
  { to: "/class-groups", label: "Lớp học", Icon: ClassGroupIcon, allowedRoles: ["ADMIN"] },
  { to: "/students", label: "Sinh viên", Icon: StudentIcon, allowedRoles: ["ADMIN", "TEACHER"] },
  { to: "/teachers", label: "Giảng viên", Icon: TeacherIcon, allowedRoles: ["ADMIN", "STUDENT"] },
  { to: "/courses", label: "Khóa học", Icon: CourseIcon, allowedRoles: ["ADMIN", "TEACHER", "STUDENT"] },
  { to: "/users", label: "Người dùng", Icon: UsersIcon, allowedRoles: ["ADMIN"] },
];


function navClassName({ isActive }: NavLinkRenderProps) {
  return [
    "group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-indigo-600/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:border hover:border-white/10",
  ].join(" ");
}

export function AppShell({ title, description, children }: AppShellProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    const token = getToken();
    setLoggingOut(true);
    try {
      if (token) {
        await apiRequest<void>("/auth/logout", {
          method: "POST",
          authenticated: false,
          body: JSON.stringify({ token }),
        });
      }
    } catch {
      // Clear token locally
    } finally {
      clearToken();
      setProfileOpen(false);
      navigate("/login");
    }
  }

  const userRoleNames = user?.roles?.map((r) => r.name.toUpperCase()) || [];
  const isAdmin = userRoleNames.length === 0 || userRoleNames.includes("ADMIN");

  const filteredNavigation = allNavigation.filter((item) => {
    if (isAdmin) return true;
    return item.allowedRoles.some((role) => userRoleNames.includes(role));
  });

  const displayName = user?.fullName || "Người dùng";
  const primaryRole = userRoleNames.length > 0 ? userRoleNames.join(", ") : "ADMIN";
  const initials = displayName.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#070e1e] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed -left-40 top-0 size-[32rem] rounded-full bg-cyan-500/10 blur-[130px]" />
      <div className="pointer-events-none fixed -bottom-40 right-0 size-[36rem] rounded-full bg-indigo-600/15 blur-[150px]" />

      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-800/80 bg-slate-950/80 p-4.5 backdrop-blur-2xl md:flex md:flex-col">
        {/* Brand Header */}
        <div className="mb-8 flex items-center gap-3.5 px-2 pt-2">
          <EduManageLogo size={42} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold tracking-tight text-white text-base">EduManage</p>
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-[11px] font-medium tracking-wider text-cyan-400 uppercase">3D Engine Portal</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Điều hướng chính">
          {filteredNavigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClassName}>
              {({ isActive }) => (
                <>
                  <span
                    className={`grid size-7 place-items-center rounded-lg transition-transform group-hover:scale-110 ${
                      isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    <item.Icon size={19} />
                  </span>
                  <span className="tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Widget */}
        <div className="mt-auto rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            Hệ thống Hoạt động
          </div>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            EduManage v2.4 • Kết nối API bảo mật.
          </p>
        </div>
      </aside>

      {/* Main Container */}
      <main className="md:ml-64 relative min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-6 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <EduManageLogo size={32} />
            <span className="font-bold text-white text-base">EduManage</span>
          </div>

          <div className="hidden text-xs font-medium tracking-wider text-slate-400 uppercase md:block">
            Cổng Quản lý Đào tạo Thông minh 3D
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              className="relative grid size-10 place-items-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors"
              aria-label="Thông báo"
            >
              <BellIcon size={18} />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative border-l border-slate-800 pl-4">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-1.5 pr-3 text-left hover:border-cyan-400/30 transition-all"
              >
                <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-slate-950 shadow-md">
                  {initials}
                </div>
                <div className="hidden text-xs sm:block">
                  <p className="font-semibold text-slate-200">{displayName}</p>
                  <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    <span>{user?.username || "Đang tải..."}</span>
                    <span className="rounded bg-cyan-500/20 px-1 py-0.2 text-[9px] font-bold text-cyan-300 border border-cyan-400/30 uppercase">{primaryRole}</span>
                  </p>
                </div>
                <svg viewBox="0 0 24 24" className="hidden size-4 fill-none stroke-slate-400 sm:block" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-52 rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl"
                >
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tài khoản</p>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50 transition-colors"
                  >
                    <LogoutIcon size={16} />
                    {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <section className="mx-auto max-w-7xl px-6 py-8 md:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-400">{description}</p>
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}

