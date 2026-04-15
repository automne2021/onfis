#!/bin/bash
# ==============================================================
# Onfis - Production Server Setup Script
# Server : DigitalOcean Droplet (146.190.98.126)
# Domain : onfis.me
# OS     : Ubuntu 22.04 / 24.04
#
# USAGE:
#   Chạy từng phase một, KHÔNG chạy toàn bộ script cùng lúc.
#   Mỗi phase là một function. Ví dụ:
#     chmod +x server-setup.sh
#     ./server-setup.sh phase1   # chạy phase 1
#     ./server-setup.sh phase2   # sau khi phase 1 xong
#     ...
# ==============================================================

set -e  # Dừng nếu có lỗi

log()  { echo -e "\n\033[1;36m>>> $1\033[0m"; }
ok()   { echo -e "\033[1;32m✓ $1\033[0m"; }
warn() { echo -e "\033[1;33m⚠ $1\033[0m"; }
fail() { echo -e "\033[1;31m✗ $1\033[0m"; exit 1; }

APP_DIR="/opt/onfis"
DOMAIN="onfis.me"

# ==============================================================
# PHASE 1 — Chuẩn bị hệ thống
# ==============================================================
phase1() {
    log "PHASE 1: Chuẩn bị hệ thống"

    apt-get update -y
    apt-get upgrade -y
    apt-get install -y \
        curl wget git unzip \
        ca-certificates gnupg \
        lsb-release software-properties-common

    ok "Hệ thống đã được cập nhật"
}

# ==============================================================
# PHASE 2 — Cài đặt Docker & Docker Compose
# ==============================================================
phase2() {
    log "PHASE 2: Cài đặt Docker"

    # Xóa phiên bản cũ nếu có
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Thêm GPG key và repo của Docker
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Bật Docker chạy tự động khi reboot
    systemctl enable docker
    systemctl start docker

    ok "Docker $(docker --version) đã được cài đặt"
    ok "Docker Compose $(docker compose version) đã được cài đặt"
}

# ==============================================================
# PHASE 3 — Tạo Swap File (4GB — bù đắp RAM cho 7 Java services)
# ==============================================================
phase3() {
    log "PHASE 3: Tạo swap file 4GB"

    if swapon --show | grep -q "/swapfile"; then
        warn "Swap file đã tồn tại, bỏ qua."
        return
    fi

    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile

    # Thêm vào /etc/fstab để auto-mount sau reboot
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi

    # Giảm swappiness (ưu tiên RAM hơn swap)
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf

    ok "Swap file 4GB đã được tạo và kích hoạt"
    free -h
}

# ==============================================================
# PHASE 4 — Cấu hình Firewall (UFW)
# ==============================================================
phase4() {
    log "PHASE 4: Cấu hình firewall"

    apt-get install -y ufw

    ufw default deny incoming
    ufw default allow outgoing

    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS

    # KHÔNG mở port 8080-8086 (backend chạy nội bộ Docker network)

    ufw --force enable

    ok "Firewall đã được cấu hình"
    ufw status
}

# ==============================================================
# PHASE 5 — Deploy ứng dụng
# ==============================================================
phase5() {
    log "PHASE 5: Deploy ứng dụng"

    # --- Kiểm tra files đã có chưa ---
    if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
        # Files chưa có → thử unzip từ ~/
        ZIPFILE=$(ls ~/onfis-deploy-*.zip 2>/dev/null | head -1)
        if [ -z "$ZIPFILE" ]; then
            fail "Không tìm thấy files tại $APP_DIR và không có onfis-deploy-*.zip trong ~/\nHãy upload zip trước: scp onfis-deploy-*.zip root@146.190.98.126:~/"
        fi
        mkdir -p "$APP_DIR"
        log "Giải nén $ZIPFILE vào $APP_DIR ..."
        unzip -o "$ZIPFILE" -d "$APP_DIR"
    else
        ok "Files đã tồn tại tại $APP_DIR, bỏ qua bước giải nén"
    fi

    cd "$APP_DIR"

    # --- Sao chép .env.production thành .env ---
    if [ ! -f ".env.production" ]; then
        fail ".env.production không tồn tại trong $APP_DIR"
    fi
    cp .env.production .env
    ok "Đã tạo .env từ .env.production"

    # --- Build & chạy containers ---
    log "Build và khởi động containers (lần đầu mất 15-30 phút do build Maven + npm)..."
    docker compose up --build -d

    ok "Deploy xong! Kiểm tra trạng thái:"
    docker compose ps
    echo ""
    warn "Nếu có service nào không phải 'running', xem log: docker compose logs <service-name>"
}

# ==============================================================
# PHASE 6 — Cài đặt SSL/HTTPS với Let's Encrypt
#
# CHỈ chạy phase này sau khi:
#   1) DNS A record đã trỏ đến 146.190.98.126
#   2) http://onfis.me hoạt động bình thường (HTTP OK)
# ==============================================================
phase6() {
    log "PHASE 6: Cài đặt SSL/HTTPS (Let's Encrypt)"
    cd "$APP_DIR"

    # --- Kiểm tra DNS đã trỏ đúng chưa ---
    RESOLVED_IP=$(dig +short $DOMAIN | tail -1)
    SERVER_IP="146.190.98.126"
    if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
        warn "DNS chưa trỏ đúng: $DOMAIN → $RESOLVED_IP (cần $SERVER_IP)"
        warn "Đợi DNS propagate rồi chạy lại phase6."
        exit 1
    fi
    ok "DNS OK: $DOMAIN → $RESOLVED_IP"

    # --- Kiểm tra HTTP đang hoạt động ---
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ || echo "000")
    if [ "$HTTP_STATUS" = "000" ]; then
        fail "http://$DOMAIN không phản hồi. Deploy ứng dụng (phase5) trước!"
    fi
    ok "HTTP OK (status $HTTP_STATUS)"

    # --- Cài certbot ---
    apt-get install -y certbot

    # --- Dừng nginx container để certbot dùng port 80 ---
    log "Dừng nginx tạm thời để lấy certificate..."
    docker compose stop nginx

    # --- Lấy certificate ---
    certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "admin@$DOMAIN" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

    ok "Certificate đã được tạo tại /etc/letsencrypt/live/$DOMAIN/"

    # --- Ghi nginx.conf phiên bản HTTPS ---
    log "Cập nhật nginx.conf cho HTTPS..."
    cat > "$APP_DIR/infrastructure/nginx/nginx.conf" << 'NGINX_CONF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    upstream api_gateway {
        server api-gateway:8080;
    }

    # Chuyển hướng HTTP → HTTPS
    server {
        listen 80;
        server_name onfis.me www.onfis.me;
        return 301 https://$host$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        server_name onfis.me www.onfis.me;

        ssl_certificate     /etc/letsencrypt/live/onfis.me/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/onfis.me/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_session_cache   shared:SSL:10m;
        ssl_session_timeout 10m;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # --- API routes (tenant-prefixed) ---
        location ~ ^/[^/]+/api/ {
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # --- WebSocket routes (tenant-prefixed) ---
        location ~ ^/[^/]+/ws/ {
            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
        }

        # --- Main Webapp static assets (built with base: '/_app/') ---
        location ^~ /_app/ {
            alias /usr/share/nginx/html/webapp/;
            try_files $uri $uri/ /usr/share/nginx/html/webapp/index.html;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # --- Landing Page static assets ---
        location ^~ /assets/ {
            root /usr/share/nginx/html/landing;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # --- Tenant routes → Main Webapp SPA ---
        location ~ ^/[^/]+/ {
            root /usr/share/nginx/html/webapp;
            try_files $uri $uri/ /index.html;
        }

        # --- Root → Landing Page ---
        location / {
            root /usr/share/nginx/html/landing;
            try_files $uri $uri/ /index.html;
        }
    }
}
NGINX_CONF

    # --- Thêm volume mount certificate vào docker-compose.yml ---
    # Thêm volumes cho nginx service để truy cập certs trên host
    if ! grep -q "letsencrypt" "$APP_DIR/docker-compose.yml"; then
        # Dùng Python vì sed trên YAML multi-line dễ sai
        python3 << 'PYEOF'
import re

with open('/opt/onfis/docker-compose.yml', 'r') as f:
    content = f.read()

# Thêm volumes vào nginx service (trước networks)
nginx_volumes = '''    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
'''
content = content.replace(
    '    container_name: onfis-nginx\n    ports:',
    '    container_name: onfis-nginx\n' + nginx_volumes + '    ports:'
)

with open('/opt/onfis/docker-compose.yml', 'w') as f:
    f.write(content)

print("docker-compose.yml updated with certificate volume mount")
PYEOF
        ok "docker-compose.yml đã được cập nhật với volume mount certificate"
    else
        warn "Volume letsencrypt đã tồn tại trong docker-compose.yml, bỏ qua."
    fi

    # --- Rebuild nginx với config HTTPS và khởi động lại ---
    log "Rebuild và khởi động lại nginx với HTTPS..."
    docker compose up --build -d nginx

    ok "HTTPS đã được cấu hình!"
    echo ""
    ok "Kiểm tra tại: https://onfis.me"

    # --- Cài đặt tự gia hạn certificate ---
    log "Cài đặt tự gia hạn certificate (cron)..."
    # Script gia hạn: dừng nginx → certbot renew → rebuild nginx
    cat > /usr/local/bin/certbot-renew-onfis.sh << RENEW_SCRIPT
#!/bin/bash
cd $APP_DIR
docker compose stop nginx
certbot renew --quiet
docker compose up --build -d nginx
RENEW_SCRIPT
    chmod +x /usr/local/bin/certbot-renew-onfis.sh

    # Chạy lúc 3 giờ sáng ngày 1 mỗi tháng
    (crontab -l 2>/dev/null; echo "0 3 1 * * /usr/local/bin/certbot-renew-onfis.sh >> /var/log/certbot-renew.log 2>&1") | crontab -
    ok "Cron job gia hạn certificate đã được cài đặt"
}

# ==============================================================
# PHASE 7 — Kiểm tra hệ thống
# ==============================================================
phase7() {
    log "PHASE 7: Kiểm tra hệ thống"
    cd "$APP_DIR"

    echo ""
    echo "=== Container Status ==="
    docker compose ps
    echo ""

    echo "=== Kiểm tra HTTP/HTTPS ==="
    for URL in "http://onfis.me" "https://onfis.me"; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/" 2>/dev/null || echo "ERROR")
        if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
            ok "$URL → HTTP $STATUS"
        else
            warn "$URL → HTTP $STATUS"
        fi
    done

    echo ""
    echo "=== RAM Usage ==="
    free -h
    echo ""

    echo "=== Docker Stats (snapshot) ==="
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    echo ""

    warn "Nếu Java service nào bị OOM (Out of Memory), tăng -Xmx trong docker-compose.yml:"
    warn "  JAVA_TOOL_OPTIONS: \"-Xmx384m -Xms128m\"  # tăng từ 256m lên 384m"
    warn "Rồi chạy: docker compose up -d <service-name>"
}

# ==============================================================
# ENTRYPOINT
# ==============================================================
case "$1" in
    phase1) phase1 ;;
    phase2) phase2 ;;
    phase3) phase3 ;;
    phase4) phase4 ;;
    phase5) phase5 ;;
    phase6) phase6 ;;
    phase7) phase7 ;;
    *)
        echo ""
        echo "Onfis Server Setup Script"
        echo ""
        echo "Sử dụng: ./server-setup.sh <phase>"
        echo ""
        echo "Thứ tự chạy:"
        echo "  ./server-setup.sh phase1   # Cập nhật hệ thống"
        echo "  ./server-setup.sh phase2   # Cài Docker"
        echo "  ./server-setup.sh phase3   # Tạo Swap 4GB"
        echo "  ./server-setup.sh phase4   # Cấu hình Firewall"
        echo "  ./server-setup.sh phase5   # Deploy ứng dụng"
        echo "  ./server-setup.sh phase6   # Cài SSL/HTTPS (sau khi DNS hoạt động)"
        echo "  ./server-setup.sh phase7   # Kiểm tra hệ thống"
        echo ""
        echo "Lưu ý: Upload zip lên server TRƯỚC khi chạy phase5:"
        echo "  scp onfis-deploy-*.zip root@146.190.98.126:~/"
        ;;
esac
