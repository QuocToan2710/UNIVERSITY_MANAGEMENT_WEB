import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, type NavLinkRenderProps } from "react-router";
import { apiRequest } from "../lib/api";
import { clearToken, getCachedUser, getToken, isAuthenticated, setCachedUser } from "../lib/auth";
import { canAccessNavItem, hasPermission, isAdmin as checkIsAdmin } from "../lib/permission";
import { ForbiddenState } from "./forbidden-state";
import type { User } from "../types/management";
import type { AppNotification, NotificationSummary } from "../types/notification";
import { notificationService } from "../services/notification.service";
import { webSocketService } from "../services/websocket.service";
import { useTheme } from "../lib/theme";
import {
  ArrowRightIcon,
  BanknotesIcon,
  BellIcon,
  BookOpenIcon,
  ClassGroupIcon,
  CourseIcon,
  DashboardIcon,
  EduManageLogo,
  LogoutIcon,
  MajorIcon,
  MoonIcon,
  ScheduleIcon,
  RoomIcon,
  StudentIcon,
  SunIcon,
  GradeIcon,
  TranscriptIcon,
  TeacherIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon,
  ClipboardCheckIcon,
} from "./icons";

type AppShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

type SubNavItem = {
  to: string;
  label: string;
  allowedRoles?: string[];
  requiredEndpoint?: string;
  requiredMethod?: "GET" | "POST" | "PUT" | "DELETE" | "*";
};

type NavItem = {
  to?: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  end?: boolean;
  allowedRoles?: string[];
  requiredEndpoint?: string;
  requiredMethod?: "GET" | "POST" | "PUT" | "DELETE" | "*";
  subItems?: SubNavItem[];
};

const allNavigation: NavItem[] = [
  { to: "/", label: "Tổng quan", Icon: DashboardIcon, end: true },
  {
    label: "Lịch",
    Icon: ScheduleIcon,
    subItems: [
      { to: "/schedule/timetable", label: "Thời khóa biểu", requiredEndpoint: "/schedules/**", allowedRoles: ["ADMIN", "TEACHER", "STUDENT"] },
      { to: "/schedule/class", label: "Lịch học", requiredEndpoint: "/schedules/**", allowedRoles: ["ADMIN", "TEACHER"] },
      { to: "/schedule/exam", label: "Lịch thi", requiredEndpoint: "/exam-schedules/**", allowedRoles: ["ADMIN", "TEACHER"] },
      { to: "/schedule/teaching", label: "Lịch dạy", requiredEndpoint: "/teaching-schedules/**", allowedRoles: ["ADMIN", "TEACHER"] },
    ],
  },
  { to: "/class-groups", label: "Lớp học", Icon: ClassGroupIcon, requiredEndpoint: "/class-groups/**", allowedRoles: ["ADMIN"] },
  { to: "/students", label: "Sinh viên", Icon: StudentIcon, requiredEndpoint: "/students/**", allowedRoles: ["ADMIN", "TEACHER"] },
  { to: "/teachers", label: "Giảng viên", Icon: TeacherIcon, requiredEndpoint: "/teachers/**", allowedRoles: ["ADMIN"] },
  { to: "/courses", label: "Môn học", Icon: CourseIcon, requiredEndpoint: "/courses/**", allowedRoles: ["ADMIN", "TEACHER"] },
  { to: "/course-registration", label: "Đăng ký tín chỉ", Icon: BookOpenIcon, requiredEndpoint: "/enrollments/**", allowedRoles: ["ADMIN", "STUDENT"] },
  { to: "/grades", label: "Quản lý điểm", Icon: GradeIcon, requiredEndpoint: "/grades/**", allowedRoles: ["ADMIN", "TEACHER"] },
  { to: "/transcripts", label: "Bảng điểm", Icon: TranscriptIcon, requiredEndpoint: "/grades/**", allowedRoles: ["ADMIN", "TEACHER", "STUDENT"] },
  {
    label: "Điểm danh & Chuyên cần",
    Icon: ClipboardCheckIcon,
    subItems: [
      { to: "/teaching/attendance", label: "Điểm danh học phần", requiredEndpoint: "/attendance/**", allowedRoles: ["ADMIN", "TEACHER"] },
      { to: "/student/attendance", label: "Tra cứu chuyên cần", requiredEndpoint: "/attendance/**", allowedRoles: ["STUDENT"] },
      { to: "/admin/attendance-reports", label: "Báo cáo cấm thi", requiredEndpoint: "/attendance/**", allowedRoles: ["ADMIN", "TEACHER"] },
    ],
  },
  {
    label: "Tài chính",
    Icon: BanknotesIcon,
    subItems: [
      { to: "/finance/tuition", label: "Học phí", requiredEndpoint: "/tuition-fees/**", allowedRoles: ["ADMIN", "STUDENT"] },
    ],
  },
  { to: "/majors", label: "Ngành học", Icon: MajorIcon, requiredEndpoint: "/majors/**", allowedRoles: ["ADMIN"] },
  {
    label: "Quản trị danh mục",
    Icon: RoomIcon,
    subItems: [
      { to: "/categories/buildings", label: "Tòa nhà", requiredEndpoint: "/master-data/**", allowedRoles: ["ADMIN"] },
      { to: "/categories/floors", label: "Tầng", requiredEndpoint: "/master-data/**", allowedRoles: ["ADMIN"] },
      { to: "/categories/rooms", label: "Phòng học", requiredEndpoint: "/master-data/**", allowedRoles: ["ADMIN"] },
      { to: "/categories/provinces", label: "Tỉnh/TP", requiredEndpoint: "/master-data/**", allowedRoles: ["ADMIN"] },
      { to: "/categories/districts", label: "Quận/Huyện", requiredEndpoint: "/master-data/**", allowedRoles: ["ADMIN"] },
      { to: "/categories/wards", label: "Xã/Phường", requiredEndpoint: "/master-data/**", allowedRoles: ["ADMIN"] },
    ],
  },
  {
    label: "Quản trị hệ thống",
    Icon: CogIcon,
    subItems: [
      { to: "/users", label: "Người dùng", requiredEndpoint: "/users/**", allowedRoles: ["ADMIN"] },
      { to: "/roles", label: "Vai trò", requiredEndpoint: "/roles/**", allowedRoles: ["ADMIN"] },
    ],
  },
  { to: "/notifications", label: "Thông báo", Icon: BellIcon, requiredEndpoint: "/notifications/**" },
];

function navClassName({ isActive }: NavLinkRenderProps) {
  return [
    "group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200",
    isActive
      ? "bg-cyan-50 text-cyan-950 font-bold border border-cyan-300 shadow-sm dark:bg-gradient-to-r dark:from-cyan-500/25 dark:via-blue-600/20 dark:to-indigo-600/20 dark:text-white dark:border-cyan-400/40 dark:shadow-[0_0_15px_rgba(34,211,238,0.25)]"
      : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-white",
  ].join(" ");
}

function subNavClassName({ isActive }: NavLinkRenderProps) {
  return [
    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all duration-200 pl-9",
    isActive
      ? "bg-cyan-50 text-cyan-950 font-bold border-l-4 border-cyan-600 dark:bg-cyan-500/20 dark:text-white dark:border-cyan-400 font-bold"
      : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/40 dark:hover:text-white",
  ].join(" ");
}

export function AppShell({ title, description, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(() => getCachedUser<User>());
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "Lịch": true,
    "Điểm danh & Chuyên cần": true,
    "Tài chính": true,
    "Quản trị danh mục": true,
    "Quản trị hệ thống": true,
  });

  // Notification State
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifSummary, setNotifSummary] = useState<NotificationSummary>({ unreadCount: 0, recentNotifications: [] });
  const [toastNotif, setToastNotif] = useState<AppNotification | null>(null);

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio not supported or blocked by browser policy
    }
  };

  const loadNotifications = async () => {
    try {
      const summary = await notificationService.getMySummary();
      if (summary) setNotifSummary(summary);
    } catch {
      // ignore in unauthorized context
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }

    void apiRequest<User>("/users/myInfo")
      .then((u) => {
        setUser(u);
        setCachedUser(u);
        void loadNotifications();
      })
      .catch(() => {
        clearToken();
        navigate("/login", { replace: true });
      });

    // Real-time WebSocket connection & subscription
    webSocketService.connect();
    const unsubscribeSocket = webSocketService.subscribe((incomingNotif) => {
      setNotifSummary((prev) => ({
        unreadCount: prev.unreadCount + 1,
        recentNotifications: [
          incomingNotif,
          ...prev.recentNotifications.filter((n) => n.id !== incomingNotif.id).slice(0, 4),
        ],
      }));
      setToastNotif(incomingNotif);
      playNotificationSound();
    });

    // Polling backup every 60s
    const timer = setInterval(() => {
      if (getToken()) {
        void loadNotifications();
      }
    }, 60000);

    const handleNotificationsUpdated = () => {
      void loadNotifications();
    };
    window.addEventListener("notifications-updated", handleNotificationsUpdated);

    return () => {
      clearInterval(timer);
      unsubscribeSocket();
      window.removeEventListener("notifications-updated", handleNotificationsUpdated);
    };
  }, []);

  // Auto-dismiss toast notification after 6 seconds
  useEffect(() => {
    if (toastNotif) {
      const timer = setTimeout(() => {
        setToastNotif(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotif]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (profileOpen || notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen, notifOpen]);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifSummary((prev) => ({
          unreadCount: Math.max(0, prev.unreadCount - 1),
          recentNotifications: prev.recentNotifications.map((n) =>
            n.id === notif.id ? { ...n, read: true } : n
          ),
        }));
      } catch {
        // ignore
      }
    }
    setNotifOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifSummary((prev) => ({
        unreadCount: 0,
        recentNotifications: prev.recentNotifications.map((n) => ({ ...n, read: true })),
      }));
    } catch {
      // ignore
    }
  };

  const navRef = useRef<HTMLElement>(null);

  // Restore and keep sidebar scroll position
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const savedTop = sessionStorage.getItem("sidebar_scroll_top");
    if (savedTop) {
      nav.scrollTop = Number(savedTop);
    }

    const handleScroll = () => {
      sessionStorage.setItem("sidebar_scroll_top", String(nav.scrollTop));
    };

    nav.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      nav.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Khi chuyển route, phục hồi ngay vị trí cuộn của sidebar từ sessionStorage
    const savedTop = sessionStorage.getItem("sidebar_scroll_top");
    if (savedTop && navRef.current) {
      navRef.current.scrollTop = Number(savedTop);
    }
  }, [location.pathname]);

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

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = Boolean(user) && (userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN"));

  const filteredNavigation = useMemo(() => {
    return allNavigation
      .map((item) => {
        if (item.subItems) {
          const filteredSubs = item.subItems.filter((sub) => canAccessNavItem(user, sub));
          if (filteredSubs.length === 0) return null;
          return { ...item, subItems: filteredSubs };
        }
        return canAccessNavItem(user, item) ? item : null;
      })
      .filter((item): item is NavItem => item !== null);
  }, [user]);

  // Find matching navigation item for current path to check authorization
  const currentRouteItem = useMemo(() => {
    for (const item of allNavigation) {
      if (item.subItems) {
        for (const sub of item.subItems) {
          if (location.pathname === sub.to || (sub.to !== "/" && location.pathname.startsWith(sub.to))) {
            return sub;
          }
        }
      } else if (item.to) {
        if (item.to === "/" && location.pathname === "/") {
          return item;
        }
        if (item.to !== "/" && (location.pathname === item.to || location.pathname.startsWith(item.to))) {
          return item;
        }
      }
    }
    return null;
  }, [location.pathname]);

  const isCurrentRouteAuthorized = useMemo(() => {
    if (!currentRouteItem) return true;
    if (!user && isAuthenticated()) return true; // While initial user profile is in-flight, avoid flash of 403
    return canAccessNavItem(user, currentRouteItem);
  }, [user, currentRouteItem]);

  const displayName = user?.fullName || (user ? "Người dùng" : "Đang tải...");
  const primaryRoleCode = (userRoleNames[0] || (user ? "USER" : "")).toUpperCase();

  const roleStyles = useMemo(() => {
    if (!user) {
      return {
        badge: "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400",
        avatar: "from-slate-500 via-slate-600 to-slate-700",
        glow: "",
        label: "Đang tải...",
      };
    }
    if (primaryRoleCode.includes("ADMIN")) {
      return {
        badge: "border-purple-300 dark:border-purple-400/40 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300",
        avatar: "from-violet-500 via-purple-600 to-indigo-700",
        glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]",
        label: "Quản trị viên",
      };
    }
    if (primaryRoleCode.includes("TEACHER")) {
      return {
        badge: "border-emerald-300 dark:border-emerald-400/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        avatar: "from-emerald-400 via-teal-500 to-cyan-600",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
        label: "Giảng viên",
      };
    }
    if (primaryRoleCode.includes("STUDENT")) {
      return {
        badge: "border-cyan-300 dark:border-cyan-400/40 bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
        avatar: "from-cyan-400 via-sky-500 to-blue-600",
        glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]",
        label: "Sinh viên",
      };
    }
    return {
      badge: "border-blue-300 dark:border-blue-400/40 bg-blue-50 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300",
      avatar: "from-blue-500 via-indigo-600 to-slate-700",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      label: "Người dùng",
    };
  }, [user, primaryRoleCode]);

  const initials = displayName.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "U";

  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070e1e] text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans transition-colors duration-200">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed -left-40 top-0 size-[32rem] rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 blur-[130px] opacity-20 dark:opacity-100" />
      <div className="pointer-events-none fixed -bottom-40 right-0 size-[36rem] rounded-full bg-indigo-600/10 dark:bg-indigo-600/15 blur-[150px] opacity-20 dark:opacity-100" />

      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/80 p-4.5 backdrop-blur-2xl md:flex md:flex-col shadow-xs">
        {/* Brand Header */}
        <div className="mb-6 flex items-center gap-3.5 px-2 pt-2">
          <EduManageLogo size={42} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold tracking-tight text-slate-900 dark:text-white text-base">EduManage</p>
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-[11px] font-bold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase">3D Engine Portal</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav ref={navRef} className="space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" aria-label="Điều hướng chính">
          {filteredNavigation.map((item) => {
            if (item.subItems) {
              const isChildActive = item.subItems.some((sub) => location.pathname.startsWith(sub.to));
              const isExpanded = expandedMenus[item.label] ?? true;
              const toggleExpanded = () => {
                setExpandedMenus((prev) => ({ ...prev, [item.label]: !isExpanded }));
              };

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={toggleExpanded}
                    className={`group flex w-full items-center justify-between gap-3.5 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 cursor-pointer ${
                      isChildActive
                        ? "bg-cyan-50 text-cyan-950 font-bold border border-cyan-300 shadow-sm dark:bg-gradient-to-r dark:from-cyan-500/25 dark:via-blue-600/20 dark:to-indigo-600/20 dark:text-white dark:border-cyan-400/40 dark:shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                        : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`grid size-7 place-items-center rounded-lg transition-transform group-hover:scale-110 ${isChildActive ? "text-cyan-700 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                        <item.Icon size={19} />
                      </span>
                      <span className="tracking-wide">{item.label}</span>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-cyan-700 dark:text-cyan-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {/* Sub-menu Dropdown Items right underneath */}
                  {isExpanded && (
                    <div className="space-y-1 pt-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      {item.subItems.map((sub) => (
                        <NavLink key={sub.to} to={sub.to} preventScrollReset className={subNavClassName}>
                          {({ isActive }) => (
                            <>
                              <span className={`size-1.5 rounded-full ${isActive ? "bg-cyan-600 dark:bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-slate-400 dark:bg-slate-600 group-hover:bg-cyan-600 dark:group-hover:bg-cyan-300"}`} />
                              <span>{sub.label}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink key={item.to} to={item.to!} end={item.end} preventScrollReset className={navClassName}>
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid size-7 place-items-center rounded-lg transition-transform group-hover:scale-110 ${
                        isActive ? "text-cyan-700 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                      }`}
                    >
                      <item.Icon size={19} />
                    </span>
                    <span className="tracking-wide">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Container */}
      <main className="md:ml-64 relative min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/70 px-6 backdrop-blur-xl md:px-8 transition-colors shadow-xs">
          <div className="flex items-center gap-3 md:hidden">
            <EduManageLogo size={32} />
            <span className="font-bold text-slate-900 dark:text-white text-base">EduManage</span>
          </div>

          <div className="hidden text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-400 uppercase md:block">
            Cổng Quản lý Đào tạo Thông minh
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative grid size-10 place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
              title={isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
              aria-label="Đổi giao diện sáng/tối"
            >
              {isDark ? (
                <SunIcon size={18} className="text-amber-400 animate-in spin-in-90 duration-300" />
              ) : (
                <MoonIcon size={18} className="text-indigo-600 animate-in spin-in-90 duration-300" />
              )}
            </button>

            {/* Notification Bell & Dropdown */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((open) => !open)}
                className={`relative grid size-10 place-items-center rounded-xl border transition-all duration-300 cursor-pointer shadow-sm ${
                  notifOpen
                    ? "border-cyan-400 bg-cyan-50 dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 ring-2 ring-cyan-400/20"
                    : notifSummary.unreadCount > 0
                    ? "border-rose-300 dark:border-rose-500/60 bg-rose-50/50 dark:bg-slate-900/80 text-rose-600 dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:border-rose-400"
                    : "border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
                }`}
                title={notifSummary.unreadCount > 0 ? `Bạn có ${notifSummary.unreadCount} thông báo chưa đọc` : "Thông báo hệ thống"}
                aria-label="Thông báo"
              >
                <BellIcon size={18} className={notifSummary.unreadCount > 0 ? "animate-[bounce_2s_infinite]" : ""} />
                {notifSummary.unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-1 text-[10px] font-black text-white shadow-[0_0_10px_#f43f5e] ring-2 ring-white dark:ring-slate-950">
                      {notifSummary.unreadCount > 9 ? "9+" : notifSummary.unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">Thông báo</span>
                      {notifSummary.unreadCount > 0 && (
                        <span className="rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                          {notifSummary.unreadCount} mới
                        </span>
                      )}
                    </div>
                    {notifSummary.unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  {/* Popover List */}
                  <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
                    {notifSummary.recentNotifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        <p className="text-2xl mb-1.5">🔕</p>
                        Không có thông báo mới nào
                      </div>
                    ) : (
                      notifSummary.recentNotifications.map((notif) => {
                        const typeConfig = {
                          EXAM: { bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", icon: "📝", label: "Lịch thi" },
                          SCHEDULE: { bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20", icon: "📅", label: "Lịch học" },
                          ENROLLMENT: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: "🎓", label: "Đăng ký" },
                          GRADE: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: "📊", label: "Điểm số" },
                          SYSTEM: { bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: "⚡", label: "Hệ thống" },
                          ACADEMIC: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: "📚", label: "Học vụ" },
                          GENERAL: { bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", icon: "📢", label: "Chung" },
                        }[notif.type] || { bg: "bg-slate-500/10 text-slate-600", icon: "📢", label: "Chung" };

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`group relative flex items-start gap-3 rounded-xl p-2.5 transition-colors cursor-pointer pt-3 ${
                              notif.read
                                ? "hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75 hover:opacity-100"
                                : "bg-cyan-50/40 dark:bg-cyan-950/20 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-cyan-200/50 dark:border-cyan-500/20"
                            }`}
                          >
                            <span className="text-base mt-0.5 shrink-0">{typeConfig.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold border ${typeConfig.bg}`}>
                                  {typeConfig.label}
                                </span>
                                {!notif.read && (
                                  <span className="size-1.5 rounded-full bg-cyan-500 shrink-0" />
                                )}
                              </div>
                              <p className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                                {notif.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {notif.content}
                              </p>
                              <span className="mt-1 block text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono">
                                {new Date(notif.createdAt).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div className="mt-2.5 border-t border-slate-100 dark:border-slate-800 pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate("/notifications");
                      }}
                      className="w-full rounded-xl py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Xem toàn bộ thông báo →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cyberpunk Glass Capsule Profile Widget */}
            <div ref={profileRef} className="relative border-l border-slate-200 dark:border-white/10 pl-3">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className={`group relative flex items-center gap-3 rounded-2xl border p-1.5 pr-3.5 text-left transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                  profileOpen
                    ? "border-cyan-500 dark:border-cyan-400/60 bg-cyan-50/80 dark:bg-slate-900/95 shadow-[0_0_20px_rgba(34,211,238,0.25)] ring-2 ring-cyan-400/20"
                    : "border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-900/70 hover:border-cyan-500 hover:bg-slate-100 dark:hover:border-cyan-400/50 dark:hover:bg-slate-800/80 dark:bg-slate-900/90 shadow-sm"
                }`}
              >
                {/* 3D Gradient Avatar with Pulsing Status Indicator */}
                <div className="relative">
                  <div
                    className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${roleStyles.avatar} text-xs font-black text-white ${roleStyles.glow} transition-transform duration-300 group-hover:scale-105`}
                  >
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                </div>

                {/* User Identity Info */}
                <div className="hidden text-xs sm:block">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-white transition-colors">
                      {displayName}
                    </p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`rounded-md border px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider ${roleStyles.badge}`}
                    >
                      {roleStyles.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      @{user?.username || "..."}
                    </span>
                  </div>
                </div>

                {/* Animated Chevron */}
                <svg
                  viewBox="0 0 24 24"
                  className={`hidden size-4 transition-transform duration-300 sm:block ${
                    profileOpen ? "rotate-180 text-cyan-600 dark:text-cyan-300" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Rich Profile Dropdown Menu */}
              {profileOpen && (
                <div
                  role="menu"
                  className="user-profile-menu absolute right-0 top-[calc(100%+0.75rem)] z-30 w-72 sm:w-80 rounded-3xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-950 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_20px_rgba(34,211,238,0.1)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
                >
                  {/* Top Profile Card Banner */}
                  <div className="user-profile-banner relative overflow-hidden rounded-2xl border border-sky-200 dark:border-white/10 bg-gradient-to-br from-sky-50 via-blue-50/60 to-slate-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 p-3.5 mb-3.5">
                    <div className="absolute top-0 right-0 h-16 w-24 bg-cyan-500/10 blur-xl pointer-events-none" />
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${roleStyles.avatar} text-sm font-black text-white ${roleStyles.glow}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900 dark:text-white text-sm">
                          {displayName}
                        </p>
                        <p className="truncate text-[11px] text-slate-600 dark:text-slate-400 font-mono font-semibold">
                          {user?.email || `@${user?.username || "user"}`}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${roleStyles.badge}`}
                          >
                            <span className="size-1 rounded-full bg-current" />
                            {roleStyles.label}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Navigation Links */}
                  <div className="space-y-1 mb-3.5 border-t border-b border-slate-200 dark:border-white/10 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-6 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                          <UsersIcon size={13} />
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">Thông tin tài khoản</span>
                      </div>
                      <ArrowRightIcon size={12} className="text-slate-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        setPasswordMsg(null);
                        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                        setShowPasswordModal(true);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-6 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">Đổi mật khẩu & Bảo mật</span>
                      </div>
                      <ArrowRightIcon size={12} className="text-slate-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors" />
                    </button>
                  </div>

                  {/* Theme Switcher Header */}
                  <div className="mb-3.5 space-y-1.5">
                    <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Chế độ hiển thị
                    </p>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          theme === "light"
                            ? "bg-white text-cyan-800 border border-cyan-300 shadow-xs dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40"
                            : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <SunIcon size={14} className="mb-0.5 text-amber-500" />
                        <span>Sáng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          theme === "dark"
                            ? "bg-white text-cyan-800 border border-cyan-300 shadow-xs dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40"
                            : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <MoonIcon size={14} className="mb-0.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Tối</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("system")}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          theme === "system"
                            ? "bg-white text-cyan-800 border border-cyan-300 shadow-xs dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40"
                            : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span className="text-xs mb-0.5">💻</span>
                        <span>Tự động</span>
                      </button>
                    </div>
                  </div>

                  {/* System Version Meta */}
                  <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40 px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between mb-3.5 font-medium">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <span className="size-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                      <span>EduManage Portal</span>
                    </span>
                    <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold text-[10px] bg-cyan-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-400/20">v2.4.0</span>
                  </div>

                  {/* Logout Button */}
                  <div className="border-t border-slate-200 dark:border-white/10 pt-2">
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => void handleLogout()}
                      disabled={loggingOut}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-400 dark:hover:border-red-500/40 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <LogoutIcon size={16} />
                      <span>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất khỏi hệ thống"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <section className="mx-auto max-w-7xl px-6 py-8 md:px-8">
          {!isCurrentRouteAuthorized ? (
            <ForbiddenState
              requiredEndpoint={currentRouteItem?.requiredEndpoint}
              requiredRole={currentRouteItem?.allowedRoles?.[0]}
            />
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
                {description ? (
                  <p className="mt-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">{description}</p>
                ) : null}
              </div>
              {children}
            </>
          )}
        </section>
      </main>

      {/* Modal 1: Thông tin chi tiết tài khoản */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-800 dark:text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${roleStyles.avatar} text-white font-black text-sm ${roleStyles.glow}`}>
                  {initials}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Thông tin tài khoản</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Chi tiết hồ sơ định danh người dùng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="grid size-8 place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content List */}
            <div className="mt-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-500 dark:text-slate-400">Họ và tên</span>
                <span className="font-bold text-slate-900 dark:text-white">{displayName}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-500 dark:text-slate-400">Tên đăng nhập (Username)</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300">@{user?.username || "..."}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{user?.email || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-500 dark:text-slate-400">Mã định danh ID</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#{user?.id ?? "1"}</span>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-2">
                <span className="text-slate-500 dark:text-slate-400 block">Quyền hạn hệ thống (Roles)</span>
                <div className="flex flex-wrap gap-1.5">
                  {(userRoleNames.length > 0 ? userRoleNames : (user ? ["USER"] : [])).map((r) => (
                    <span
                      key={r}
                      className="rounded-lg border border-cyan-300 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase"
                    >
                      ROLE_{r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-300 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-3">
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">Trạng thái phiên</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Đang hoạt động (Authenticated)
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Đổi mật khẩu */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-800 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white font-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  🔒
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Đổi mật khẩu</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bảo mật tài khoản của bạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="grid size-8 place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
                  setPasswordMsg({ text: "Vui lòng nhập đầy đủ các trường mật khẩu.", type: "error" });
                  return;
                }
                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                  setPasswordMsg({ text: "Mật khẩu xác nhận không khớp.", type: "error" });
                  return;
                }
                if (passwordForm.newPassword.length < 6) {
                  setPasswordMsg({ text: "Mật khẩu mới phải có ít nhất 6 ký tự.", type: "error" });
                  return;
                }
                setChangingPassword(true);
                setPasswordMsg(null);
                try {
                  if (user?.id) {
                    await apiRequest<User>("/users/update", {
                      method: "PUT",
                      body: JSON.stringify({
                        id: user.id,
                        username: user.username,
                        fullName: user.fullName,
                        email: user.email,
                        password: passwordForm.newPassword,
                      }),
                    });
                  }
                  setPasswordMsg({ text: "Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.", type: "success" });
                  setTimeout(() => {
                    setShowPasswordModal(false);
                  }, 1500);
                } catch (err) {
                  setPasswordMsg({ text: err instanceof Error ? err.message : "Không thể cập nhật mật khẩu.", type: "error" });
                } finally {
                  setChangingPassword(false);
                }
              }}
              className="mt-5 space-y-4 text-xs"
            >
              {passwordMsg && (
                <div
                  className={`rounded-xl border p-3 ${
                    passwordMsg.type === "success"
                      ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới..."
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
                >
                  {changingPassword ? "Đang lưu..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Notification Toast Popup */}
      {toastNotif && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full animate-bounce-in duration-300">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl shadow-cyan-500/20 text-white">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 animate-pulse">
                <BellIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">
                    Thông báo mới
                  </span>
                  <button
                    type="button"
                    onClick={() => setToastNotif(null)}
                    className="text-slate-400 hover:text-white transition p-0.5 rounded-lg hover:bg-white/10 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <h4 className="mt-1 text-sm font-bold text-white truncate">
                  {toastNotif.title}
                </h4>
                <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {toastNotif.content}
                </p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[10px] text-slate-400">Vừa xong</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleNotificationClick(toastNotif);
                      setToastNotif(null);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                  >
                    Xem chi tiết <ArrowRightIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
