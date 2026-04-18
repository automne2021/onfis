import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: {
    icon: "delete_forever",
    iconColor: "text-red-500 bg-red-50",
    confirmBtn:
      "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
  },
  warning: {
    icon: "warning",
    iconColor: "text-amber-500 bg-amber-50",
    confirmBtn:
      "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white",
  },
  info: {
    icon: "info",
    iconColor: "text-primary bg-primary/10",
    confirmBtn:
      "bg-primary hover:bg-primary/90 focus:ring-primary text-white",
  },
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-neutral-200 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${styles.iconColor}`}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 28 }}
            >
              {styles.icon}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-neutral-900">{title}</h3>

          {/* Message */}
          <div className="text-sm text-neutral-500 leading-relaxed">
            {message}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 pb-6 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${styles.confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
