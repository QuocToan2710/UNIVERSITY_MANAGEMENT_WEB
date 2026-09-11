import { Link } from "react-router";

export interface ForbiddenStateProps {
  title?: string;
  description?: string;
  requiredEndpoint?: string;
}

export function ForbiddenState({
  title = "403 - Quyền Truy Cập Bị Từ Chối",
  description = "Tài khoản hiện tại của bạn không có quyền hạn truy cập chức năng này. Vui lòng liên hệ Quản trị viên nếu bạn cho rằng đây là sự nhầm lẫn.",
  requiredEndpoint,
}: ForbiddenStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative flex size-24 items-center justify-center rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xl backdrop-blur-xl">
        <svg className="size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.714zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs">
          !
        </span>
      </div>

      <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-2.5 max-w-md text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>

      {requiredEndpoint && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 px-3 py-1 font-mono text-xs text-slate-600 dark:text-slate-400">
          <span>Yêu cầu quyền:</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">{requiredEndpoint}</span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span>Quay Về Trang Chủ</span>
        </Link>
      </div>
    </div>
  );
}
