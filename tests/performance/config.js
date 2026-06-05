/**
 * Shared configuration for k6 performance tests.
 *
 * Import this in each test script:
 *   import { BASE_URL, WS_URL, TENANT_ID, MANAGER_CREDS, EMPLOYEE_CREDS } from './config.js';
 */

// ── API Gateway base URL ───────────────────────────────────────────────────
export const BASE_URL = __ENV.BASE_URL || "http://localhost/test-corp";

// ── Chat-service native WebSocket URL (bypasses gateway — direct to port 8085)
// In production, chat is behind the gateway under /ws-native.
export const WS_URL = __ENV.WS_URL || "ws://localhost:8085/ws-native";

// ── Supabase token endpoint (for authentication) ──────────────────────────
export const SUPABASE_AUTH_URL =
  "https://jtoibkbaomzqmseveplp.supabase.co/auth/v1/token?grant_type=password";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0b2lia2Jhb216cW1zZXZlcGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTM5ODgsImV4cCI6MjA4ODM4OTk4OH0.QEXvX2e4nP7z76qpi-HOM2tSDug4gx1_nhVXXnUAeEI";

// ── Test tenant ───────────────────────────────────────────────────────────
export const TENANT_ID       = "00000000-0000-0000-0000-000000000099";
export const MANAGER_ID      = "00000000-0000-0000-0000-000000000101";
export const EMPLOYEE_ID     = "00000000-0000-0000-0000-000000000102";
export const PROJECT_ID      = "00000000-0000-0000-0000-000000000401";
export const CONVERSATION_ID = "00000000-0000-0000-0000-000000000501";

export const MANAGER_CREDS  = { email: "manager@test-corp.local",  password: "Test@12345" };
export const EMPLOYEE_CREDS = { email: "employee@test-corp.local", password: "Test@12345" };

// ── Performance thresholds shared across tests ────────────────────────────
export const COMMON_THRESHOLDS = {
  // 95th-percentile response time under 500 ms
  http_req_duration: ["p(95)<500"],
  // Error rate below 1 %
  http_req_failed: ["rate<0.01"],
};
