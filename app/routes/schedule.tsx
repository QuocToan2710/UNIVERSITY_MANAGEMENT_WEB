import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function ScheduleIndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/schedule/timetable", { replace: true });
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-[#070e1e] text-slate-600 dark:text-slate-400 text-xs">
      <div className="flex items-center gap-2">
        <span className="size-4 rounded-full border-2 border-cyan-500 dark:border-cyan-400 border-t-transparent animate-spin" />
        <span>Đang chuyển hướng đến Thời khóa biểu...</span>
      </div>
    </div>
  );
}
