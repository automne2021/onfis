import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export interface TenantFeatures {
  chatEnabled: boolean;
  announcementsEnabled: boolean;
  meetingsEnabled: boolean;
  projectManagementEnabled: boolean;
  maintenanceMode: boolean;
}

const DEFAULT_FEATURES: TenantFeatures = {
  chatEnabled: true,
  announcementsEnabled: true,
  meetingsEnabled: true,
  projectManagementEnabled: true,
  maintenanceMode: false,
};

interface TenantSettingsContextType {
  features: TenantFeatures;
  companyName: string;
  logoUrl: string | null;
  loading: boolean;
}

const TenantSettingsContext = createContext<TenantSettingsContextType>({
  features: DEFAULT_FEATURES,
  companyName: "",
  logoUrl: null,
  loading: true,
});

export function TenantSettingsProvider({ children }: { children: ReactNode }) {
  const { tenant } = useParams<{ tenant: string }>();
  const [features, setFeatures] = useState<TenantFeatures>(DEFAULT_FEATURES);
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;

    let mounted = true;

    const loadSettings = async () => {
      try {
        const res = await api.get<TenantFeatures>("/admin/tenant/features");
        if (mounted) setFeatures(res.data);
      } catch {
        // keep defaults if fetch fails
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, [tenant]);

  // Load company name + logo from tenants table via Supabase
  useEffect(() => {
    if (!tenant) return;

    let mounted = true;

    const loadTenant = async () => {
      try {
        const { supabase } = await import("../services/supabaseClient");
        const { data } = await supabase
          .from("tenants")
          .select("name, logo_url")
          .eq("slug", tenant)
          .single();

        if (mounted && data) {
          setCompanyName(data.name ?? "");
          setLogoUrl(data.logo_url ?? null);
        }
      } catch {
        // non-critical
      }
    };

    void loadTenant();

    return () => {
      mounted = false;
    };
  }, [tenant]);

  return (
    <TenantSettingsContext.Provider value={{ features, companyName, logoUrl, loading }}>
      {children}
    </TenantSettingsContext.Provider>
  );
}

export function useTenantSettings() {
  return useContext(TenantSettingsContext);
}
