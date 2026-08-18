import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { gsap } from "gsap";
import { ApiError, login } from "../lib/api";
import { isAuthenticated, setToken } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .from(".login-brand-3d", { opacity: 0, y: -20, duration: 0.8, clearProps: "all" })
        .from(".login-hero-title", { opacity: 0, y: 20, duration: 0.7, clearProps: "all" }, "-=0.4")
        .from(".login-feature-3d", { opacity: 0, y: 15, duration: 0.6, stagger: 0.1, clearProps: "all" }, "-=0.3")
        .from(".login-panel-3d", { opacity: 0, y: 15, duration: 0.85, clearProps: "all" }, "-=0.7")
        .from(".login-form-anim", { opacity: 0, y: 10, duration: 0.45, stagger: 0.08, clearProps: "all" }, "-=0.35");
    }, pageRef);

    return () => context.revert();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.authenticated || !result.token) throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
      setToken(result.token);
      window.location.href = "/";
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : "Đăng nhập thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      ref={pageRef}
      data-theme="dark"
      className="login-page relative isolate min-h-screen overflow-hidden bg-[#070e1e] text-white antialiased selection:bg-cyan-500 selection:text-slate-950 font-sans"
    >
      {/* Real 4K Ultra-HD University Campus Background - 100% Full Clarity */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100 scale-100"
        style={{
          backgroundImage: `url('/images/university-campus-bg.jpg')`,
        }}
      />

      {/* Ultra-Light Transparent Vignette: lets full 4K background shine through everywhere */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-black/35" />
      <div className="pointer-events-none absolute inset-0 bg-black/15" />

      {/* Ambient Lighting Orbs */}
      <div className="pointer-events-none absolute -left-20 top-10 size-[32rem] rounded-full bg-cyan-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-[-5%] size-[36rem] rounded-full bg-blue-500/15 blur-[140px]" />

      {/* Main Content Layout */}
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        {/* Left Side: Branding & Hero Info - Floating Naturally Over 4K Background */}
        <section className="mx-auto w-full max-w-2xl lg:mx-0">
          <div className="login-brand-3d flex items-center gap-4">
            {/* Transparent Glass Logo Box */}
            <div className="relative group grid size-13 place-items-center rounded-2xl border border-white/35 bg-black/25 p-0.5 shadow-lg backdrop-blur-[2px] transition-transform duration-300 group-hover:scale-105">
              <div className="grid size-full place-items-center rounded-[14px] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-2xl font-black text-white shadow-md">
                E
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  EduManage
                </p>
                <span className="rounded-full border border-cyan-300/50 bg-black/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200 tracking-wider uppercase backdrop-blur-[2px]">
                  Portal v2.4
                </span>
              </div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-200 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                Hệ thống Đào tạo Thông minh
              </p>
            </div>
          </div>

          {/* Giant Cascading Left-to-Right Animated Color Wave Title */}
          <div className="login-hero-title mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-3.5 py-1.5 backdrop-blur-[2px] shadow-sm mb-4">
              <span className="size-2 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_#67e8f9]" />
              <span className="text-xs font-bold text-cyan-100">
                Cổng Quản Trị Đào Tạo Thông Minh
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.65rem] xl:text-[4.15rem] font-black leading-[1.12] tracking-tight">
              <span className="block animate-wave-line1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] pr-2">
                Quản trị đào tạo
              </span>
              <span className="block mt-1.5 sm:mt-2 animate-wave-line2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] pr-3">
                Trực quan & Hiện đại
              </span>
            </h1>
          </div>

          {/* 100% See-Through Glass Feature Badges (01, 02, 03) */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { num: "01", title: "Quản lý tập trung", desc: "Đồng bộ dữ liệu đa nền tảng" },
              { num: "02", title: "Bảo mật an toàn", desc: "Mã hóa Token JWT xác thực" },
              { num: "03", title: "Vận hành thông minh", desc: "Tối ưu hóa thời khóa biểu" },
            ].map((item) => (
              <div
                key={item.num}
                className="login-feature-3d group relative rounded-2xl border border-white/30 bg-black/20 p-4.5 backdrop-blur-[2px] shadow-lg transition-all duration-300 hover:border-cyan-300 hover:bg-black/35 hover:-translate-y-0.5"
              >
                <div className="text-xs font-black tracking-widest text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {item.num}
                </div>
                <p className="mt-2 text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Right Side: 100% See-Through Transparent Glass Form Card */}
        <section
          className="login-panel-3d relative mx-auto w-full max-w-md rounded-[2.5rem] border border-white/35 bg-black/20 p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-[3px] transition-all duration-300 hover:border-cyan-300/70 hover:bg-black/30 sm:p-10"
        >
          {/* Top Edge Glossy Highlight Line */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_8px_#67e8f9]" />

          {/* Form Header */}
          <div className="login-form-anim flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-cyan-300 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                EduManage Portal
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                Cổng Đăng Nhập
              </h2>
            </div>
            {/* Shield Icon */}
            <div className="grid size-11 place-items-center rounded-xl border border-white/35 bg-white/10 text-cyan-200 shadow-sm backdrop-blur-[2px]">
              <svg viewBox="0 0 24 24" className="size-5.5 fill-none stroke-current" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <p className="login-form-anim mt-2.5 text-xs font-semibold leading-5 text-slate-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            Vui lòng nhập thông tin xác thực để truy cập hệ thống quản lý.
          </p>

          {/* Login Form */}
          <form className="mt-7 space-y-4.5" onSubmit={handleSubmit}>
            {/* Username Input - Transparent Glass */}
            <div className="login-form-anim">
              <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                Tên đăng nhập
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-4 text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2.2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/35 bg-black/30 pl-11 pr-4 py-3 text-sm font-semibold text-white placeholder-slate-200 outline-none backdrop-blur-[2px] transition duration-200 focus:border-cyan-300 focus:bg-black/50 focus:ring-2 focus:ring-cyan-400/30 shadow-inner"
                  placeholder="Nhập tên tài khoản"
                />
              </div>
            </div>

            {/* Password Input - Transparent Glass */}
            <div className="login-form-anim">
              <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                Mật khẩu
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-4 text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2.2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/35 bg-black/30 pl-11 pr-11 py-3 text-sm font-semibold text-white placeholder-slate-200 outline-none backdrop-blur-[2px] transition duration-200 focus:border-cyan-300 focus:bg-black/50 focus:ring-2 focus:ring-cyan-400/30 shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-200 hover:text-white focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2.2">
                    {showPassword ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="login-form-anim flex items-center gap-2 rounded-lg border border-red-400/50 bg-red-950/70 p-3 text-xs font-semibold text-red-100 backdrop-blur-sm shadow-md">
                <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-current" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="login-form-anim group relative overflow-hidden flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-3.5 font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <span className="relative z-10 text-sm tracking-wide">
                {isSubmitting ? "Đang xác thực dữ liệu..." : "Đăng Nhập Vào Hệ Thống"}
              </span>

              {!isSubmitting && (
                <svg viewBox="0 0 24 24" className="relative z-10 size-4 fill-none stroke-current transition-transform duration-200 group-hover:translate-x-1" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* Quick Demo Accounts Helper */}
            <div className="login-form-anim mt-5 pt-3.5 border-t border-white/20">
              <p className="text-xs font-bold text-white mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                Thử nghiệm nhanh với 3 Vai trò (Roles):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setUsername("admin"); setPassword("admin"); }}
                  className="rounded-lg border border-white/30 bg-black/25 px-2 py-2 text-[11px] font-bold text-cyan-200 hover:bg-black/45 hover:border-cyan-300 backdrop-blur-[2px] transition-all text-center cursor-pointer shadow-sm"
                >
                  Admin
                  <span className="block text-[9px] text-slate-200 font-mono font-medium">admin / admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("teacher"); setPassword("teacher123"); }}
                  className="rounded-lg border border-white/30 bg-black/25 px-2 py-2 text-[11px] font-bold text-violet-200 hover:bg-black/45 hover:border-violet-300 backdrop-blur-[2px] transition-all text-center cursor-pointer shadow-sm"
                >
                  Giảng viên
                  <span className="block text-[9px] text-slate-200 font-mono font-medium">teacher / teacher123</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("student"); setPassword("student123"); }}
                  className="rounded-lg border border-white/30 bg-black/25 px-2 py-2 text-[11px] font-bold text-emerald-200 hover:bg-black/45 hover:border-emerald-300 backdrop-blur-[2px] transition-all text-center cursor-pointer shadow-sm"
                >
                  Sinh viên
                  <span className="block text-[9px] text-slate-200 font-mono font-medium">student / student123</span>
                </button>
              </div>
            </div>
          </form>

          {/* Card Footer */}
          <div className="login-form-anim mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] font-semibold text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            <span>EduManage Portal</span>
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
              Bảo mật SSL 256-bit
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
