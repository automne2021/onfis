import { Outlet } from "react-router-dom";
import { TenantSettingsProvider } from "../contexts/TenantSettingsContext";

export default function SetupLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#0d1340] to-[#1a1060]">
      <TenantSettingsProvider>
        <Outlet />
      </TenantSettingsProvider>
    </div>
  );
}
