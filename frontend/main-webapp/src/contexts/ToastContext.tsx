import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastType = "error" | "warning" | "success" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

const TOAST_COLORS: Record<ToastType, string> = {
    error: "bg-red-600",
    warning: "bg-amber-500",
    success: "bg-green-600",
    info: "bg-blue-600",
};

const TOAST_ICONS: Record<ToastType, string> = {
    error: "✕",
    warning: "⚠",
    success: "✓",
    info: "ℹ",
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "error") => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container — fixed bottom-right */}
            {toasts.length > 0 && (
                <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`${TOAST_COLORS[toast.type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] max-w-[420px] pointer-events-auto animate-slideUp`}
                        >
                            <span className="text-sm font-bold shrink-0">
                                {TOAST_ICONS[toast.type]}
                            </span>
                            <span className="text-sm font-medium leading-5">{toast.message}</span>
                            <button
                                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                                className="ml-auto text-white/70 hover:text-white shrink-0 text-lg leading-none"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextType {
    return useContext(ToastContext);
}
