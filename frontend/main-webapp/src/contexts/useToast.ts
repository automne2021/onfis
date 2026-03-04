import { createContext, useContext } from "react";

export type ToastType = "error" | "warning" | "success" | "info";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

export interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

export function useToast(): ToastContextType {
    return useContext(ToastContext);
}
