import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import { Header } from "../components/common/Header";
import { SidebarProvider } from "../contexts/SidebarContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";

const mockCompanyName = "Your company";

export default function AppLayout() {
  const location = useLocation();

  return (
    <AuthProvider>
      <ToastProvider>
        <SidebarProvider>
          <div className="flex flex-col h-screen overflow-hidden bg-neutral-50">
            {/* Header - Full Width */}
            <Header companyName={mockCompanyName} />

            {/* Main Area: Sidebar + Content */}
            <div className="flex flex-1 p-3 gap-3 min-h-0">
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <main className="flex-1 bg-white rounded-[12px] shadow-md border-2 border-neutral-200 p-4 overflow-auto">
                <div key={location.pathname} className="animate-page-enter">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
