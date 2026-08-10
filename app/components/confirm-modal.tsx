import { AlertTriangleIcon } from "./icons";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Xóa ngay",
  cancelLabel = "Hủy",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
            <AlertTriangleIcon size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{loading ? "Đang xử lý..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
