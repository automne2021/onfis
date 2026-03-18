import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import { Header } from "../components/common/Header";
import { SidebarProvider } from "../contexts/SidebarContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { supabase } from "../services/supabaseClient";

const mockCompanyName = "Your company";

export default function AppLayout() {
  const location = useLocation();
  const { tenant } = useParams<{ tenant: string }>();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }
      setIsAuthenticated(Boolean(data.session?.access_token));
      setCheckedAuth(true);
    };

    void checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.access_token));
      setCheckedAuth(true);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!checkedAuth) {
    return <div className="h-screen bg-neutral-50" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/${tenant ?? ""}/auth/login`} replace />;
  }

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
              <main className="flex-1 overflow-auto">
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
