export function getTenantFromPath(pathname: string = window.location.pathname): string | null {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 0 ? segments[0] : null;
}

export function buildTenantPath(tenant: string | null | undefined, path: string): string {
  const base = tenant ? `/${tenant}` : '';
  if (!path.startsWith('/')) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}
