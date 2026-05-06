import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

export default function AdminGuard() {
  const { tenant } = useParams<{ tenant: string }>();
  const { isAdmin, isSuperAdmin, isAuthLoading } = useRole();

  if (isAuthLoading) return null;
  if (!isAdmin) {
    if (isSuperAdmin) {
      return <Navigate to={`/${tenant}/leader-dashboard`} replace />;
    }

    return <Navigate to={`/${tenant}/dashboard`} replace />;
  }

  return <Outlet />;
}
