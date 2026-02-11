"use client";

import { useId } from "react";

type ModalType = "success" | "error";

type ModalProps = {
  open: boolean;
  title: string;
  message: string;
  type?: ModalType;
  onClose: () => void;
};

export default function Modal({ open, title, message, type = "success", onClose }: ModalProps) {
  const titleId = useId();
  const messageId = useId();

  if (!open) return null;

  const isSuccess = type === "success";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-white/30 overflow-hidden">
        <div className={`px-5 py-4 ${isSuccess ? "bg-green-50" : "bg-red-50"}`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isSuccess ? "bg-green-500" : "bg-red-500"
              } text-white shadow-md`}
            >
              {isSuccess ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h3 id={titleId} className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
        </div>
        <div className="px-5 py-4">
          <p id={messageId} className="text-sm text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C] text-white font-semibold px-4 py-2.5 hover:shadow-lg transition-all hover:scale-[1.01]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
