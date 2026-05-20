# ONFIS Test Suite

Complete automated testing infrastructure for the ONFIS ERP platform.

## Directory Structure

```
tests/
├── setup/
│   ├── seed-test-data.js       Node.js — create test tenant + users + data
│   └── cleanup-test-data.js    Node.js — delete all test data (tenant-scoped)
├── api/
│   ├── onfis-collection.json   Newman/Postman collection (38 test cases)
│   └── environments/
│       ├── local.json          Environment for local Docker Compose
│       └── production.json     Environment for smoke tests post-deploy
├── performance/
│   ├── config.js               Shared configuration (URLs, credentials, UUIDs)
│   ├── http-load-test.js       k6 REST API load test (0→50 VUs)
│   └── ws-chat-load-test.js    k6 WebSocket/STOMP chat load test (50 VUs)
├── results/                    Generated reports (gitignored)
├── run-api-tests.ps1           Runs Newman collection
├── run-unit-tests.ps1          Runs Maven JUnit tests
├── run-performance-tests.ps1   Runs k6 scripts
└── run-all-tests.ps1           Orchestrator (unit → API → perf)
```

## Prerequisites

| Tool     | Install                              | Purpose              |
|----------|--------------------------------------|----------------------|
| Node.js  | nodejs.org                           | Seed / cleanup scripts |
| Maven    | maven.apache.org                     | JUnit tests          |
| Newman   | `npm install -g newman newman-reporter-htmlextra` | API tests |
| k6       | `winget install k6`                  | Performance tests    |
| Docker   | docker.com                           | Local service stack  |

## Quick Start

### 1. Start the local stack
```powershell
docker-compose up -d
```

### 2. Seed test data (one-time, or after cleanup)
```powershell
node tests/setup/seed-test-data.js
```

### 3. Run tests

**Unit tests only (no stack required):**
```powershell
.\tests\run-unit-tests.ps1
```

**API integration tests:**
```powershell
.\tests\run-api-tests.ps1
```

**Performance tests (local only):**
```powershell
.\tests\run-performance-tests.ps1 -Test all
```

**Everything:**
```powershell
.\tests\run-all-tests.ps1 -Seed -IncludePerf
```

### 4. Cleanup test data
```powershell
node tests/setup/cleanup-test-data.js
```

---

## Test Tenant

| Field       | Value                                  |
|-------------|----------------------------------------|
| Tenant ID   | `00000000-0000-0000-0000-000000000099` |
| Slug        | `test-corp`                            |
| Manager     | `manager@test-corp.local` / `Test@12345` |
| Employee    | `employee@test-corp.local` / `Test@12345` |
| Project ID  | `00000000-0000-0000-0000-000000000401` |
| Conversation| `00000000-0000-0000-0000-000000000501` |

---

## Test Coverage Map

| Area              | Tool    | Count | File                                  |
|-------------------|---------|-------|---------------------------------------|
| Task state machine| JUnit   | 20+   | `TaskStatusTransitionTest.java`       |
| Role/permission   | JUnit   | 18+   | `PermissionCheckTest.java`            |
| Auth endpoints    | Newman  | 5     | `onfis-collection.json` → TC-AUTH     |
| Multi-tenant      | Newman  | 3     | `onfis-collection.json` → TC-TENANT   |
| Project CRUD      | Newman  | 7     | `onfis-collection.json` → TC-PROJ     |
| Task workflow     | Newman  | 7     | `onfis-collection.json` → TC-TASK     |
| Announcements     | Newman  | 3     | `onfis-collection.json` → TC-ANN      |
| Positions/depts   | Newman  | 3     | `onfis-collection.json` → TC-POS      |
| Chat REST         | Newman  | 2     | `onfis-collection.json` → TC-CHAT     |
| HTTP load (50 VU) | k6      | –     | `http-load-test.js`                   |
| WS chat (50 VU)   | k6      | –     | `ws-chat-load-test.js`                |

---

## Performance Thresholds

| Metric                      | Threshold      |
|-----------------------------|----------------|
| HTTP p95 response time      | < 500 ms       |
| HTTP error rate             | < 1%           |
| WebSocket connect latency   | p95 < 3 s      |
| WebSocket message roundtrip | p95 < 2 s      |
| WS connection errors        | < 5            |

---

## ⚠️ Warning

**Never run the k6 performance scripts against the production environment
(`onfis.me`).** The load profiles generate hundreds of concurrent connections
and will impact real users. Performance tests are designed exclusively for the
local Docker Compose stack.
