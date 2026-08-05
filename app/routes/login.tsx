import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { gsap } from "gsap";
import { ApiError, login } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mouse move handler for 3D Tilt effect on the card
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateX = (-y / (rect.height / 2)) * 8; // Max 8 deg rotation
    const rotateY = (x / (rect.width / 2)) * 8;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 1000,
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.4)",
    });
  };

  useEffect(() => {
    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .from(".login-brand-3d", { autoAlpha: 0, y: -30, scale: 0.9, duration: 0.8 })
        .from(".login-hero-title", { autoAlpha: 0, y: 25, duration: 0.7 }, "-=0.4")
        .from(".login-feature-3d", { autoAlpha: 0, z: -50, y: 20, duration: 0.6, stagger: 0.12 }, "-=0.3")
        .from(".login-panel-3d", { autoAlpha: 0, scale: 0.92, rotateY: 15, duration: 0.85 }, "-=0.7")
        .from(".login-form-anim", { autoAlpha: 0, y: 14, duration: 0.45, stagger: 0.08 }, "-=0.35");

      // Continuous 3D Floating Orbs and Elements
      gsap.to(".orb-3d-cyan", {
        y: "-=25",
        x: "+=15",
        rotation: 12,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".orb-3d-indigo", {
        y: "+=30",
        x: "-=20",
        rotation: -15,
        duration: 6.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".cube-3d-element", {
        rotationX: 360,
        rotationY: 360,
        duration: 20,
        repeat: -1,
        ease: "none",
      });
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
      localStorage.setItem("access_token", result.token);
      navigate("/");
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : "Đăng nhập thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      ref={pageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative isolate min-h-screen overflow-hidden bg-[#050b18] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans"
      style={{ perspective: "1200px" }}
    >
      {/* Dynamic Ambient 3D Glow Backgrounds */}
      <div className="orb-3d-cyan pointer-events-none absolute -left-32 top-10 size-[30rem] rounded-full bg-cyan-500/15 blur-[120px] will-change-transform" />
      <div className="orb-3d-indigo pointer-events-none absolute -bottom-40 right-[-10%] size-[36rem] rounded-full bg-indigo-600/20 blur-[140px] will-change-transform" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 size-[25rem] rounded-full bg-blue-500/10 blur-[100px]" />

      {/* 3D Wireframe Grid Floor Effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Floating 3D Geometric Accents */}
      <div className="cube-3d-element pointer-events-none absolute top-20 right-1/4 size-16 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent backdrop-blur-md hidden lg:block" />
      <div className="orb-3d-cyan pointer-events-none absolute bottom-24 left-1/4 size-20 rounded-full border border-indigo-400/30 bg-gradient-to-tr from-indigo-500/15 to-purple-500/5 backdrop-blur-md hidden lg:block" />

      {/* Main Content Layout */}
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        {/* Left Side: 3D Branding & Hero Info */}
        <section className="mx-auto w-full max-w-xl lg:mx-0">
          <div className="login-brand-3d flex items-center gap-4">
            {/* 3D Glass Box Logo */}
            <div className="relative group grid size-14 place-items-center rounded-2xl border border-cyan-300/40 bg-gradient-to-br from-cyan-400/20 via-blue-600/30 to-indigo-900/40 p-0.5 shadow-[0_0_25px_rgba(34,211,238,0.25)] backdrop-blur-xl transition-transform duration-300 group-hover:scale-105">
              <div className="grid size-full place-items-center rounded-[14px] bg-slate-950/80 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-200">
                E
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold tracking-tight text-white">EduManage</p>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300 tracking-wider uppercase">
                  3D Engine v2.4
                </span>
              </div>
              <p className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">Hệ thống Đào tạo Thông minh</p>
            </div>
          </div>

          <div className="login-hero-title mt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-slate-900/60 px-3.5 py-1.5 backdrop-blur-md">
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-medium text-cyan-300">Giao diện Độc quyền & Trải nghiệm 3D</span>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl text-slate-100">
              Quản trị đào tạo <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400">
                Trực quan & Hiện đại.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Quản lý danh sách sinh viên, giảng viên và các khóa học trên giao diện kính 3D với hiệu ứng mượt mà và bảo mật tối đa.
            </p>
          </div>

          {/* 3D Glass Feature Badges */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { num: "01", title: "Quản lý tập trung", desc: "Đồng bộ đa nền tảng" },
              { num: "02", title: "Bảo mật 3 lớp", desc: "Mã hóa Token JWT" },
              { num: "03", title: "Vận hành liền mạch", desc: "Tối ưu hiệu năng GSAP" },
            ].map((item) => (
              <div
                key={item.num}
                className="login-feature-3d group relative rounded-2xl border border-white/10 bg-slate-900/40 p-4.5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-cyan-400/40 hover:bg-slate-900/60 hover:-translate-y-1"
              >
                <div className="text-xs font-bold tracking-widest text-cyan-400">{item.num}</div>
                <p className="mt-3 text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right Side: Floating 3D Glass Form Card */}
        <section
          ref={cardRef}
          className="login-panel-3d relative mx-auto w-full max-w-md rounded-[2.5rem] border border-white/15 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-950/95 p-8 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-2xl transition-shadow duration-500 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(6,182,212,0.25)] sm:p-10"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Top Edge Glossy Highlight Line */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          {/* Form Header */}
          <div className="login-form-anim flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-cyan-400 uppercase">EduManage Portal</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Cổng Đăng Nhập</h2>
            </div>
            {/* 3D Shield Icon */}
            <div className="grid size-12 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]">
              <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <p className="login-form-anim mt-3 text-xs leading-5 text-slate-400">
            Vui lòng nhập thông tin xác thực để truy cập hệ thống quản lý.
          </p>

          {/* Login Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="login-form-anim">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-4 text-slate-400">
                  <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition duration-200 focus:border-cyan-400 focus:bg-slate-950/90 focus:ring-4 focus:ring-cyan-500/20 shadow-inner"
                  placeholder="Nhập tên tài khoản"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="login-form-anim">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Mật khẩu
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-4 text-slate-400">
                  <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
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
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition duration-200 focus:border-cyan-400 focus:bg-slate-950/90 focus:ring-4 focus:ring-cyan-500/20 shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
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
              <div role="alert" className="login-form-anim flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-current" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* 3D Glossy Neon Submit Button */}
            <button
              disabled={isSubmitting}
              className="login-form-anim group relative overflow-hidden flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-4 font-semibold text-white shadow-[0_10px_30px_-5px_rgba(6,182,212,0.4)] transition-all duration-300 hover:shadow-[0_15px_35px_-5px_rgba(6,182,212,0.65)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {/* Button Sheen Light Sweep Animation */}
              <div className="pointer-events-none absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-pulse" />

              <span className="relative z-10 text-sm tracking-wide">
                {isSubmitting ? "Đang xác thực dữ liệu..." : "Đăng Nhập Vào Hệ Thống"}
              </span>

              {!isSubmitting && (
                <svg viewBox="0 0 24 24" className="relative z-10 size-4 fill-none stroke-current transition-transform duration-300 group-hover:translate-x-1.5" strokeWidth="2.2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="login-form-anim mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
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

