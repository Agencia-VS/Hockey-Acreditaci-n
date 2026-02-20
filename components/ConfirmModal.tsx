"use client";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-white/30 overflow-hidden">
        <div className={`px-5 py-4 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                danger ? "bg-red-500" : "bg-amber-500"
              } text-white shadow-md`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold px-4 py-2.5 hover:bg-gray-50 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full rounded-xl text-white font-semibold px-4 py-2.5 transition-all hover:shadow-lg ${
              danger
                ? "bg-gradient-to-r from-[#FD4727] via-[#CC0000] to-[#A00000]"
                : "bg-gradient-to-r from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
