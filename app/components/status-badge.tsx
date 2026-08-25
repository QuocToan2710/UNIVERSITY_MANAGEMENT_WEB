import React from "react";

export type StatusVariant =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "GRADUATED"
  | "LOCKED"
  | "SUBMITTED"
  | "PUBLISHED"
  | "DRAFT"
  | "PENDING"
  | "SUCCESS"
  | "DANGER"
  | "WARNING"
  | "INFO";

interface StatusBadgeProps {
  status?: string | null;
  label?: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, label, variant, className = "" }: StatusBadgeProps) {
  const normalized = (variant || status || "ACTIVE").toUpperCase();

  const getStyle = (): { bg: string; text: string; dot: string; defaultLabel: string } => {
    switch (normalized) {
      case "ACTIVE":
      case "SUCCESS":
      case "PUBLISHED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          text: "text-emerald-700 dark:text-emerald-300",
          dot: "bg-emerald-500",
          defaultLabel: "Đang hoạt động",
        };
      case "INACTIVE":
      case "LOCKED":
      case "SUSPENDED":
      case "DANGER":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
          text: "text-rose-700 dark:text-rose-300",
          dot: "bg-rose-500",
          defaultLabel: "Đã khóa / Tạm dừng",
        };
      case "SUBMITTED":
      case "PENDING":
      case "WARNING":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          text: "text-amber-700 dark:text-amber-300",
          dot: "bg-amber-500",
          defaultLabel: "Chờ phê duyệt",
        };
      case "GRADUATED":
      case "INFO":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
          text: "text-sky-700 dark:text-sky-300",
          dot: "bg-sky-500",
          defaultLabel: "Đã tốt nghiệp",
        };
      case "DRAFT":
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          text: "text-slate-700 dark:text-slate-300",
          dot: "bg-slate-400",
          defaultLabel: status || "Mặc định",
        };
    }
  };

  const style = getStyle();
  const displayLabel = label || style.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${style.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {displayLabel}
    </span>
  );
}
