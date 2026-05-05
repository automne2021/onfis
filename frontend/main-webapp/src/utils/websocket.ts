/**
 * Builds a WebSocket URL relative to the current host.
 * Uses wss:// on HTTPS pages and ws:// on HTTP pages,
 * so the same code works in both local dev and production.
 *
 * @param tenant - The tenant slug (e.g. "onfis")
 */
export function buildWebSocketUrl(tenant: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/${tenant}/ws/websocket`;
}
