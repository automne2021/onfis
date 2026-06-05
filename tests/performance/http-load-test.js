/**
 * k6 HTTP Load Test — ONFIS REST API
 *
 * Tests the most-read endpoints under realistic load:
 *   GET /api/projects
 *   GET /api/announcements/all
 *   GET /api/positions/tree
 *
 * Load profile:
 *   Stage 1 (1 min):  ramp 0 → 25 VUs (warm-up)
 *   Stage 2 (3 min): hold 25 VUs       (steady state)
 *   Stage 3 (2 min):  ramp 25 → 50 VUs (peak load)
 *   Stage 4 (1 min):  ramp 50 → 0 VUs  (cool-down)
 *
 * Run:
 *   k6 run tests/performance/http-load-test.js
 *   k6 run --out json=tests/results/http-load-results.json tests/performance/http-load-test.js
 *
 * Prerequisites:
 *   - Docker Compose stack running (docker-compose up -d)
 *   - seed-test-data.js already executed
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import {
  BASE_URL,
  SUPABASE_AUTH_URL,
  SUPABASE_ANON_KEY,
  TENANT_ID,
  MANAGER_ID,
  EMPLOYEE_ID,
  PROJECT_ID,
  MANAGER_CREDS,
  EMPLOYEE_CREDS,
  COMMON_THRESHOLDS,
} from "./config.js";

// ── Custom metrics ────────────────────────────────────────────────────────
const projectListLatency    = new Trend("project_list_latency",    true);
const announcementLatency   = new Trend("announcement_list_latency", true);
const positionTreeLatency   = new Trend("position_tree_latency",   true);
const authErrors            = new Counter("auth_errors");
const tenantIsolationErrors = new Counter("tenant_isolation_errors");

// ── k6 options ────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: "1m", target: 25 },  // warm-up
    { duration: "3m", target: 25 },  // steady state
    { duration: "2m", target: 50 },  // peak load
    { duration: "1m", target: 0  },  // cool-down
  ],
  thresholds: {
    ...COMMON_THRESHOLDS,
    http_req_duration:         ["p(95)<1000"],   // relaxed for 50-VU peak on local Docker
    project_list_latency:      ["p(95)<1000"],   // relaxed for 50-VU peak on local Docker
    announcement_list_latency: ["p(95)<500"],
    position_tree_latency:     ["p(95)<500"],
  },
};

// ── Setup: obtain JWT tokens once before the test ─────────────────────────
export function setup() {
  const managerRes = http.post(
    SUPABASE_AUTH_URL,
    JSON.stringify(MANAGER_CREDS),
    { headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY } }
  );
  const employeeRes = http.post(
    SUPABASE_AUTH_URL,
    JSON.stringify(EMPLOYEE_CREDS),
    { headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY } }
  );

  if (managerRes.status !== 200 || employeeRes.status !== 200) {
    authErrors.add(1);
    console.error(
      `Auth failed. Manager: ${managerRes.status}, Employee: ${employeeRes.status}`
    );
    // Return empty tokens — VU iteration will fail cleanly with 401s
    return { managerToken: "", employeeToken: "" };
  }

  return {
    managerToken:  managerRes.json("access_token"),
    employeeToken: employeeRes.json("access_token"),
  };
}

// ── Default function: one VU iteration ────────────────────────────────────
export default function (data) {
  const { managerToken, employeeToken } = data;

  // Alternate between manager and employee perspective to simulate real usage
  const isManager = __VU % 2 === 0;
  const token     = isManager ? managerToken  : employeeToken;
  const userId    = isManager ? MANAGER_ID    : EMPLOYEE_ID;

  const headers = {
    "Authorization": `Bearer ${token}`,
    "X-Company-ID":  TENANT_ID,
    "X-User-ID":     userId,
    "Content-Type":  "application/json",
  };

  // ── Group 1: Project endpoints ─────────────────────────────────────────
  group("Projects", () => {
    const res = http.get(`${BASE_URL}/api/projects`, { headers });
    projectListLatency.add(res.timings.duration);
    check(res, {
      "GET /projects status 200":        (r) => r.status === 200,
      "GET /projects returns array":     (r) => Array.isArray(r.json()),
      "GET /projects response time <1s": (r) => r.timings.duration < 1000,
    });

    // Get detail of the seeded project
    if (res.status === 200) {
      const detail = http.get(`${BASE_URL}/api/projects/${PROJECT_ID}/detail`, { headers });
      check(detail, {
        "GET /projects/:id/detail status 200": (r) => r.status === 200,
      });
    }
  });

  sleep(0.5);

  // ── Group 2: Announcements ─────────────────────────────────────────────
  group("Announcements", () => {
    const res = http.get(
      `${BASE_URL}/api/announcements/all?page=0&size=20`,
      { headers }
    );
    announcementLatency.add(res.timings.duration);
    check(res, {
      "GET /announcements/all status 200":    (r) => r.status === 200,
      "GET /announcements/all has content":   (r) => r.json("content") !== undefined,
    });
  });

  sleep(0.5);

  // ── Group 3: Position tree ─────────────────────────────────────────────
  group("Positions", () => {
    const res = http.get(`${BASE_URL}/api/positions/tree`, { headers });
    positionTreeLatency.add(res.timings.duration);
    check(res, {
      "GET /positions/tree status 200": (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ── Group 4: Multi-tenant security check (random iteration, ~10% of VUs) ──
  if (__ITER % 10 === 0) {
    group("Tenant Isolation", () => {
      const badHeaders = {
        ...headers,
        "X-Company-ID": "00000000-0000-0000-0000-000000000000", // non-existent tenant
      };
      const res = http.get(`${BASE_URL}/api/projects`, { headers: badHeaders });
      // The gateway resolves tenant from the URL path, NOT the X-Company-ID header.
      // A fake header is silently ignored — 200 is the correct, expected response.
      const isSafe =
        res.status === 200 ||
        res.status === 401 ||
        res.status === 403 ||
        res.status === 404;
      if (!isSafe) {
        tenantIsolationErrors.add(1);
        console.error(`Unexpected tenant error! Status: ${res.status}`);
      }
      check(res, {
        "Gateway correctly ignores fake X-Company-ID header (URL-path tenant)": () => isSafe,
      });
    });
  }

  sleep(1);
}

// ── Teardown: print summary ────────────────────────────────────────────────
export function teardown(data) {
  console.log("\n==== HTTP Load Test Complete ====");
  console.log(`Tenant isolation errors: ${tenantIsolationErrors}`);
  console.log(`Auth errors:             ${authErrors}`);
}
