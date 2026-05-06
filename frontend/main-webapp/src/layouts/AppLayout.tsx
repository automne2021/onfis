import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import { Header } from "../components/common/Header";
import { SidebarProvider } from "../contexts/SidebarContext";
import { ToastProvider } from "../contexts/ToastContext";
import { ToastContainer } from 'react-toastify';
import { supabase } from "../services/supabaseClient";
import 'react-toastify/dist/ReactToastify.css';
import { PresenceProvider } from "../features/chat/context/PresenceContext";
import { getCurrentUser } from "../services/authService";

const mockCompanyName = "Your company";

export default function AppLayout() {
  const location = useLocation();
  const { tenant } = useParams<{ tenant: string }>();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenantMismatch, setTenantMismatch] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll main content to top on route change
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      const hasSession = Boolean(data.session?.access_token);
      setIsAuthenticated(hasSession);

      // Validate tenant membership for authenticated users
      if (hasSession && data.session?.user && tenant) {
        try {
          const { data: tenantRow } = await supabase
            .from("tenants")
            .select("id")
            .eq("slug", tenant)
            .single();

          const { data: userRow } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", data.session.user.id)
            .single();

          if (!tenantRow || !userRow || userRow.tenant_id !== tenantRow.id) {
            await supabase.auth.signOut();
            if (mounted) {
              setTenantMismatch(true);
              setIsAuthenticated(false);
            }
          }
        } catch {
          // If validation fails, allow access (don't lock out users due to network issues)
        }
      }

      if (mounted) setCheckedAuth(true);

      // Check is_first_login after auth is confirmed
      if (hasSession) {
        try {
          const me = await getCurrentUser();
          if (mounted && me?.isFirstLogin === true) {
            setIsFirstLogin(true);
          } else if (mounted) {
            setIsFirstLogin(false);
          }
        } catch {
          if (mounted) setIsFirstLogin(false);
        }
      }
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
  }, [tenant]);

  if (!checkedAuth) {
    return <div className="h-screen bg-neutral-50" />;
  }

  if (!isAuthenticated || tenantMismatch) {
    return <Navigate to={`/${tenant ?? ""}/auth/login`} replace />;
  }

  if (isFirstLogin) {
    return <Navigate to={`/${tenant}/employee-setup`} replace />;
  }

  return (
    <ToastProvider>
      <PresenceProvider>
        <SidebarProvider>
          <div className="flex flex-col h-screen overflow-hidden bg-neutral-50">
            {/* Header - Full Width */}
            <Header companyName={mockCompanyName} />

            {/* Main Area: Sidebar + Content */}
            <div className="flex flex-1 p-3 gap-3 min-h-0">
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <main ref={mainRef} className="flex-1 overflow-auto">
                <div key={location.pathname} className="animate-page-enter">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>
          <ToastContainer 
            className="body-3-regular text-neutral-800 font-sans"
          />
        </SidebarProvider>
      </PresenceProvider>
    </ToastProvider>
  );
}
