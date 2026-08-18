import { AlertTriangleIcon } from "./icons";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  loading?: boolean;
  isSubmitting?: boolean;
  confirmVariant?: "danger" | "warning" | "primary" | string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel = "Hủy",
  loading = false,
  isSubmitting = false,
  confirmVariant = "danger",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const isBusy = loading || isSubmitting;
  const label = confirmText || confirmLabel || "Xóa ngay";
  const buttonStyle =
    confirmVariant === "primary"
      ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/25"
      : "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-100 dark:bg-slate-950/75 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
            <AlertTriangleIcon size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-white/10 pt-4">
          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void onConfirm()}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all ${buttonStyle}`}
          >
            {isBusy && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{isBusy ? "Đang xử lý..." : label}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
