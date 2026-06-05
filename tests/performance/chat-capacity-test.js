/**
 * chat-capacity-test.js — Tìm Ngưỡng Chịu Tải Tối Đa Của Chat (WebSocket)
 *
 * Mục đích: Xác định bao nhiêu kết nối WebSocket đồng thời chat-service
 *            có thể chịu được trước khi thất bại.
 *
 * Chiến lược: Staircase load — tăng dần theo bậc thang để quan sát tại đó
 *             lỗi bắt đầu xuất hiện và latency vượt ngưỡng.
 *
 *   Bậc 1 (1 min):  50  VUs → ngưỡng cơ sở (đã biết hoạt động OK)
 *   Bậc 2 (2 min): 150  VUs → tải trung bình
 *   Bậc 3 (2 min): 300  VUs → tải cao
 *   Bậc 4 (2 min): 500  VUs → tải rất cao
 *   Bậc 5 (2 min): 800  VUs → điểm break point dự kiến
 *   Cool-down:        0  VUs
 *
 * Chạy lệnh:
 *   k6 run tests/performance/chat-capacity-test.js
 *   k6 run --out json=tests/results/chat-capacity.json tests/performance/chat-capacity-test.js
 *
 * Điều kiện trước khi chạy:
 *   1. docker-compose up -d  (toàn bộ stack)
 *   2. Mở cổng 8085 trong docker-compose.yml (bỏ comment dòng ports 8085:8085)
 *   3. node tests/setup/seed-test-data.js  (dữ liệu test cần thiết)
 *
 * Quan sát:
 *   - ws_connect_errors tăng đột biến ở bậc nào → đó là break point
 *   - ws_msg_roundtrip_ms p(95) vượt quá 5s → hệ thống bắt đầu quá tải
 *   - Theo dõi JVM memory của chat-service: docker stats onfis-chat-service
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
  MANAGER_CREDS,
  EMPLOYEE_CREDS,
  CONVERSATION_ID,
  MANAGER_ID,
  EMPLOYEE_ID,
} from "./config.js";

// ── Custom metrics ─────────────────────────────────────────────────────────
const wsConnectLatency  = new Trend("ws_connect_latency_ms",   true);
const wsMsgRoundtrip    = new Trend("ws_msg_roundtrip_ms",     true);
const wsConnectErrors   = new Counter("ws_connect_errors");
const wsAuthErrors      = new Counter("ws_auth_errors");
const wsMsgSent         = new Counter("ws_messages_sent");
const wsMsgReceived     = new Counter("ws_messages_received");
const wsActiveConns     = new Gauge("ws_active_connections");
const wsStompErrors     = new Counter("ws_stomp_errors");

// ── Staircase load profile ─────────────────────────────────────────────────
export const options = {
  stages: [
    // Ramp lên từng bậc — mỗi bậc có giai đoạn ramp ngắn + giữ để đo ổn định
    // Lần 1 đã chạy tới 800 VU không có lỗi → tăng trần lên 2000 VU
    { duration: "30s", target: 100  }, // Bậc 1: ramp 0 → 100  (warm-up)
    { duration: "60s", target: 100  }, // Bậc 1: giữ 100
    { duration: "30s", target: 300  }, // Bậc 2: ramp → 300
    { duration: "90s", target: 300  }, // Bậc 2: giữ 300
    { duration: "30s", target: 600  }, // Bậc 3: ramp → 600
    { duration: "90s", target: 600  }, // Bậc 3: giữ 600
    { duration: "30s", target: 1000 }, // Bậc 4: ramp → 1000
    { duration: "90s", target: 1000 }, // Bậc 4: giữ 1000
    { duration: "30s", target: 1500 }, // Bậc 5: ramp → 1500
    { duration: "90s", target: 1500 }, // Bậc 5: giữ 1500
    { duration: "30s", target: 2000 }, // Bậc 6: ramp → 2000 (break point dự kiến)
    { duration: "90s", target: 2000 }, // Bậc 6: giữ 2000
    { duration: "30s", target: 0    }, // Cool-down
  ],
  // Threshold: TEST FAIL khi vượt ngưỡng này (giúp nhận biết break point)
  thresholds: {
    ws_connect_errors:     ["count<20"],      // Tối đa 20 lần connect thất bại
    ws_stomp_errors:       ["count<20"],      // Tối đa 20 lần STOMP thất bại
    ws_connect_latency_ms: ["p(95)<5000"],    // Connect trong 5s (nới rộng cho tải cao)
    ws_msg_roundtrip_ms:   ["p(95)<10000"],   // Message roundtrip tối đa 10s
  },
};

// ── STOMP frame helpers ────────────────────────────────────────────────────
function stompFrame(command, headers = {}, body = "") {
  let frame = `${command}\n`;
  for (const [k, v] of Object.entries(headers)) {
    frame += `${k}:${v}\n`;
  }
  return frame + "\n" + body + "\x00";
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

function stompSubscribe(destination, id) {
  return stompFrame("SUBSCRIBE", { destination, id, ack: "auto" });
}

function stompSend(destination, payload) {
  return stompFrame(
    "SEND",
    { destination, "content-type": "application/json" },
    JSON.stringify(payload)
  );
}

function stompDisconnect() {
  return stompFrame("DISCONNECT", {});
}

// ── Setup: lấy JWT token một lần ─────────────────────────────────────────
export function setup() {
  // Dùng 2 tài khoản xen kẽ để giảm rate-limit từ Supabase
  const managerRes  = http.post(
    SUPABASE_AUTH_URL,
    JSON.stringify(MANAGER_CREDS),
    { headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY } }
  );
  const employeeRes = http.post(
    SUPABASE_AUTH_URL,
    JSON.stringify(EMPLOYEE_CREDS),
    { headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY } }
  );

  const managerToken  = managerRes.json("access_token");
  const employeeToken = employeeRes.json("access_token");

  if (!managerToken || !employeeToken) {
    console.error("❌ Không lấy được token! Kiểm tra seed data và Supabase creds.");
    wsAuthErrors.add(2);
    return {};
  }

  console.log(`✅ Setup hoàn tất. Tokens ready.`);
  return {
    managerToken,  managerId:  MANAGER_ID,
    employeeToken, employeeId: EMPLOYEE_ID,
  };
}

// ── Main VU function ──────────────────────────────────────────────────────
export default function (data) {
  if (!data || !data.managerToken) {
    wsAuthErrors.add(1);
    sleep(1);
    return;
  }

  // VU số lẻ dùng manager, số chẵn dùng employee → xen kẽ để đa dạng
  const useManager = __VU % 2 === 1;
  const token  = useManager ? data.managerToken  : data.employeeToken;
  const userId = useManager ? data.managerId     : data.employeeId;

  const subId  = `sub-${__VU}-${__ITER}`;
  const topic  = `/topic/room.${CONVERSATION_ID}`;
  const sendDest = `/app/chat/${CONVERSATION_ID}`;

  const connectStart = Date.now();
  let connected = false;
  const pendingTimestamps = new Map();
  let messageLoop;

  const res = ws.connect(WS_URL, {}, function (socket) {
    socket.on("open", () => {
      wsConnectLatency.add(Date.now() - connectStart);
      wsActiveConns.add(1);
      connected = true;

      // Gửi STOMP CONNECT ngay sau khi WS handshake xong
      socket.send(stompConnect(token, userId, TENANT_ID));
    });

    socket.on("message", (rawFrame) => {
      if (!rawFrame || rawFrame.trim() === "" || rawFrame === "\n") return; // heartbeat

      const firstLine = rawFrame.split("\n")[0].trim();

      if (firstLine === "CONNECTED") {
        // STOMP handshake xong → subscribe và bắt đầu gửi
        socket.send(stompSubscribe(topic, subId));

        let msgCount = 0;
        messageLoop = socket.setInterval(() => {
          const correlationId = `${__VU}-${__ITER}-${msgCount++}`;
          pendingTimestamps.set(correlationId, Date.now());

          socket.send(stompSend(sendDest, {
            conversationId: CONVERSATION_ID,
            content:        `[k6 VU-${__VU}] capacity test msg #${correlationId}`,
            tenantId:       TENANT_ID,
            senderId:       userId,
            correlationId,
          }));
          wsMsgSent.add(1);
        }, 8000); // 1 message mỗi 8s (giảm tần suất ở tải cao)

      } else if (firstLine === "MESSAGE") {
        wsMsgReceived.add(1);
        try {
          const bodyStart = rawFrame.indexOf("\n\n");
          if (bodyStart > -1) {
            const bodyStr = rawFrame.substring(bodyStart + 2).replace(/\x00$/, "");
            const body = JSON.parse(bodyStr);
            const cid = body?.correlationId ?? body?.content?.match(/\[k6 VU-\d+\] .+ #(.+)$/)?.[1];
            if (cid && pendingTimestamps.has(cid)) {
              wsMsgRoundtrip.add(Date.now() - pendingTimestamps.get(cid));
              pendingTimestamps.delete(cid);
            }
          }
        } catch (_) { /* bỏ qua parse error ở tải cao */ }

      } else if (firstLine === "ERROR") {
        wsStompErrors.add(1);
        console.warn(`⚠️ VU-${__VU} nhận STOMP ERROR: ${rawFrame.substring(0, 200)}`);
        socket.close();
      }
    });

    socket.on("error", (e) => {
      wsConnectErrors.add(1);
      console.error(`❌ VU-${__VU} WS error: ${e.error()}`);
    });

    socket.on("close", () => {
      if (connected) wsActiveConns.add(-1);
    });

    // Mỗi VU giữ kết nối 60 giây rồi disconnect sạch
    socket.setTimeout(() => {
      if (messageLoop) clearInterval(messageLoop);
      socket.send(stompDisconnect());
      socket.close();
    }, 60000);

    socket.setTimeout(() => { /* wait */ }, 65000);
  });

  check(res, {
    "WS connect không bị lỗi HTTP": (r) => r && r.status !== 0,
  });

  if (res && res.status !== 0 && !connected) {
    wsConnectErrors.add(1);
    console.warn(`⚠️ VU-${__VU} connect failed: status=${res?.status}`);
  }

  sleep(1);
}

// ── Teardown: tóm tắt kết quả ─────────────────────────────────────────────
export function teardown(data) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 CHAT CAPACITY TEST — KẾT QUẢ TÓM TẮT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Xem chi tiết metrics trong summary ở trên.");
  console.log("Lưu ý: Theo dõi 'ws_connect_errors' theo từng bậc tải.");
  console.log("Break point = bậc mà ws_connect_errors tăng đột biến.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}
