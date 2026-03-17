import { useParams } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenant';

export function useTenantPath() {
  const { tenant } = useParams<{ tenant: string }>();

  return {
    tenant,
    withTenant: (path: string) => buildTenantPath(tenant, path),
  };
}
