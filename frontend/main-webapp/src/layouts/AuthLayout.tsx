import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="h-screen overflow-auto flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 50%, #dce3ed 100%)',
      }}
    >
      <Outlet />
    </div>
  );
}