import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

export default function LeaderGuard() {
  const { tenant } = useParams<{ tenant: string }>();
  const { isAdmin, isSuperAdmin, isAuthLoading } = useRole();

  if (isAuthLoading) return null;
  if (!isSuperAdmin) {
    if (isAdmin) {
      return <Navigate to={`/${tenant}/admin/dashboard`} replace />;
    }

    return <Navigate to={`/${tenant}/dashboard`} replace />;
  }

  return <Outlet />;
}