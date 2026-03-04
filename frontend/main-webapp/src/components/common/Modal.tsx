import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ModalCloseIcon as CloseIcon } from "./Icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const maxWidthStyles = {
  sm: "max-w-[500px]",
  md: "max-w-[700px]",
  lg: "max-w-[800px]",
  xl: "max-w-[900px]",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "lg",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`
          bg-white w-full ${maxWidthStyles[maxWidth]} rounded-xl shadow-2xl 
          flex flex-col max-h-[95vh] overflow-hidden 
          border border-neutral-200 relative z-10 animate-slideUp
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-neutral-200 bg-white shrink-0">
          <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-8 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-8 py-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
