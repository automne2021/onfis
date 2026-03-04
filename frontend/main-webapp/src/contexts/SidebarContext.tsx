import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};

interface SidebarProviderProps {
    children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed((prev) => !prev);
    };

    const setSidebarCollapsed = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
    };

    return (
        <SidebarContext.Provider
            value={{ isCollapsed, toggleSidebar, setSidebarCollapsed }}
        >
            {children}
        </SidebarContext.Provider>
    );
};
