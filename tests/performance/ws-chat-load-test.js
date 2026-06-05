/**
 * k6 WebSocket Chat Load Test — ONFIS Chat Service
 *
 * Simulates 50 concurrent users each:
 *   1. Authenticating via Supabase Auth REST API
 *   2. Connecting via native WebSocket to chat-service (/ws-native)
 *   3. Sending a STOMP CONNECT frame with JWT + tenant headers
 *   4. Subscribing to a shared conversation topic
 *   5. Sending a chat message every 5 s for 2 minutes
 *   6. Measuring roundtrip latency (send → receive echo)
 *   7. Disconnecting cleanly
 *
 * Load profile:
 *   Stage 1 (30 s): ramp 0 → 50 VUs
 *   Stage 2 (2 min): hold 50 VUs
 *   Stage 3 (30 s): ramp 50 → 0 VUs
 *
 * Run:
 *   k6 run tests/performance/ws-chat-load-test.js
 *   k6 run --out json=tests/results/ws-results.json tests/performance/ws-chat-load-test.js
 *
 * Prerequisites:
 *   - Chat-service running on port 8085 (or WS_URL env var set)
 *   - seed-test-data.js already executed
 *
 * WARNING: Run against local/test environment ONLY. Never run against production.
 */

import ws from "k6/ws";
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Gauge, Rate, Trend } from "k6/metrics";
import {
  WS_URL,
  SUPABASE_AUTH_URL,
  SUPABASE_ANON_KEY,
  TENANT_ID,
  MANAGER_ID,
  EMPLOYEE_ID,
  CONVERSATION_ID,
  MANAGER_CREDS,
  EMPLOYEE_CREDS,
} from "./config.js";

// ── Custom metrics ────────────────────────────────────────────────────────
const wsConnectLatency  = new Trend("ws_connect_latency_ms",   true);
const wsMsgRoundtrip    = new Trend("ws_msg_roundtrip_ms",     true);
const wsConnectErrors   = new Counter("ws_connect_errors");
const wsAuthErrors      = new Counter("ws_auth_errors");
const wsMsgSent         = new Counter("ws_messages_sent");
const wsMsgReceived     = new Counter("ws_messages_received");
const wsActiveConns     = new Gauge("ws_active_connections");

// ── k6 options ────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "2m",  target: 50 },
    { duration: "30s", target: 0  },
  ],
  thresholds: {
    ws_connect_latency_ms: ["p(95)<3000"],   // connect within 3 s
    ws_msg_roundtrip_ms:   ["p(95)<2000"],   // message delivered within 2 s
    ws_connect_errors:     ["count<5"],      // fewer than 5 failed connections
    ws_auth_errors:        ["count<5"],
  },
};

// STOMP frame builder helpers
function stompFrame(command, headers = {}, body = "") {
  let frame = `${command}\n`;
  for (const [k, v] of Object.entries(headers)) {
    frame += `${k}:${v}\n`;
  }
  frame += "\n" + body + "\x00";
  return frame;
}

function stompConnect(token, userId, tenantId) {
  return stompFrame("CONNECT", {
    "accept-version": "1.2",
    "heart-beat":     "10000,10000",
    "Authorization":  `Bearer ${token}`,
    "X-User-ID":      userId,
    "X-Company-ID":   tenantId,
  });
}

function stompSubscribe(destination, subscriptionId) {
  return stompFrame("SUBSCRIBE", {
    "destination": destination,
    "id":          subscriptionId,
    "ack":         "auto",
  });
}

function stompSend(destination, payload) {
  return stompFrame("SEND", {
    "destination":  destination,
    "content-type": "application/json",
  }, JSON.stringify(payload));
}

function stompDisconnect() {
  return stompFrame("DISCONNECT", {});
}

// ── Setup: obtain JWT tokens ───────────────────────────────────────────────
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
    wsAuthErrors.add(1);
    console.error("Authentication failed during setup");
    return { managerToken: "", employeeToken: "" };
  }

  return {
    managerToken:  managerRes.json("access_token"),
    employeeToken: employeeRes.json("access_token"),
  };
}

// ── Default function: one VU (one chat participant) ───────────────────────
export default function (data) {
  const { managerToken, employeeToken } = data;

  const isManager = __VU % 2 === 0;
  const token     = isManager ? managerToken  : employeeToken;
  const userId    = isManager ? MANAGER_ID    : EMPLOYEE_ID;

  if (!token) {
    wsAuthErrors.add(1);
    sleep(1);
    return;
  }

  const subId       = `sub-${__VU}-${__ITER}`;
  const topic       = `/topic/room.${CONVERSATION_ID}`;
  const sendDest    = `/app/chat.sendMessage`;

  // Track pending sends for roundtrip measurement
  const pendingTimestamps = new Map(); // msgCorrelationId → sendTime

  const connectStart = Date.now();
  let connected = false;
  let messageLoop;

  const res = ws.connect(WS_URL, null, (socket) => {
    wsConnectLatency.add(Date.now() - connectStart);
    wsActiveConns.add(1);
    connected = true;

    // ── On open: STOMP CONNECT ─────────────────────────────────────────
    socket.on("open", () => {
      socket.send(stompConnect(token, userId, TENANT_ID));
    });

    // ── On message: handle STOMP frames ───────────────────────────────
    socket.on("message", (rawFrame) => {
      if (!rawFrame || rawFrame === "\n") return; // heartbeat

      const firstLine = rawFrame.split("\n")[0];

      if (firstLine === "CONNECTED") {
        // Subscriptions after STOMP CONNECT acknowledged
        socket.send(stompSubscribe(topic, subId));
        socket.send(stompSubscribe("/topic/users.status", `status-${subId}`));

        // Start sending messages on a timer
        let msgCount = 0;
        messageLoop = socket.setInterval(() => {
          const correlationId = `${__VU}-${__ITER}-${msgCount++}`;
          pendingTimestamps.set(correlationId, Date.now());

          socket.send(stompSend(sendDest, {
            conversationId: CONVERSATION_ID,
            content:        `[k6 VU ${__VU}] Load test message #${correlationId}`,
            tenantId:       TENANT_ID,
            senderId:       userId,
            correlationId,
          }));
          wsMsgSent.add(1);
        }, 5000); // send every 5 seconds

      } else if (firstLine === "MESSAGE") {
        wsMsgReceived.add(1);
        // Try to parse the body for a correlationId to measure roundtrip
        try {
          const bodyStart = rawFrame.indexOf("\n\n");
          if (bodyStart > -1) {
            const bodyRaw = rawFrame.substring(bodyStart + 2).replace(/\x00$/, "");
            const body = JSON.parse(bodyRaw);
            if (body.correlationId && pendingTimestamps.has(body.correlationId)) {
              const latency = Date.now() - pendingTimestamps.get(body.correlationId);
              wsMsgRoundtrip.add(latency);
              pendingTimestamps.delete(body.correlationId);
            }
          }
        } catch (_) {
          // Body parsing errors are non-fatal
        }

      } else if (firstLine === "ERROR") {
        console.error(`STOMP ERROR from server (VU ${__VU}): ${rawFrame.substring(0, 200)}`);
      }
    });

    // ── On error ──────────────────────────────────────────────────────
    socket.on("error", (e) => {
      wsConnectErrors.add(1);
      console.error(`WS error VU ${__VU}: ${e}`);
    });

    // ── On close ──────────────────────────────────────────────────────
    socket.on("close", () => {
      wsActiveConns.add(-1);
      connected = false;
    });

    // Keep each VU connected for its share of the 2-minute hold phase
    socket.setTimeout(() => {
      if (messageLoop) socket.clearInterval(messageLoop);
      socket.send(stompDisconnect());
      socket.close();
    }, 120000); // 2 minutes max per VU session
  });

  check(res, {
    "WebSocket connection established": (r) => r && r.status === 101,
  });

  if (!res || res.status !== 101) {
    wsConnectErrors.add(1);
  }

  sleep(1);
}

export function teardown(data) {
  console.log("\n==== WebSocket Chat Load Test Complete ====");
  console.log(`Total messages sent:     ${wsMsgSent.value}`);
  console.log(`Total messages received: ${wsMsgReceived.value}`);
  console.log(`Connect errors:          ${wsConnectErrors.value}`);
  console.log(`Auth errors:             ${wsAuthErrors.value}`);
}
