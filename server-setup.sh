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
#   1) DNS A record (apex + www) đã trỏ đến 146.190.98.126
#   2) http://onfis.me hoạt động bình thường (HTTP OK)
# ==============================================================
phase6() {
    log "PHASE 6: Cài đặt SSL/HTTPS (Let's Encrypt)"
    cd "$APP_DIR"

    # --- Kiểm tra DNS đã trỏ đúng chưa (apex + www) ---
    SERVER_IP="146.190.98.126"
    for HOST in "$DOMAIN" "www.$DOMAIN"; do
        RESOLVED_IP=$(dig +short "$HOST" | tail -1)
        if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
            warn "DNS chưa trỏ đúng: $HOST → $RESOLVED_IP (cần $SERVER_IP)"
            warn "Đợi DNS propagate rồi chạy lại phase6."
            exit 1
        fi
        ok "DNS OK: $HOST → $RESOLVED_IP"
    done

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

    # --- Chuyển sang HTTPS config (file đã có sẵn trong repo) ---
    log "Chuyển nginx.conf sang HTTPS config..."
    cp "$APP_DIR/infrastructure/nginx/nginx.https.conf" \
       "$APP_DIR/infrastructure/nginx/nginx.conf"
    ok "nginx.conf đã được cập nhật"

    # --- Khởi động lại nginx (không cần rebuild — config dùng bind-mount) ---
    log "Khởi động lại nginx với HTTPS..."
    docker compose start nginx

    ok "HTTPS đã được cấu hình!"
    echo ""
    ok "Kiểm tra tại: https://$DOMAIN"

    # --- Cài đặt tự gia hạn certificate ---
    log "Cài đặt tự gia hạn certificate (cron)..."
    cat > /usr/local/bin/certbot-renew-onfis.sh << RENEW_SCRIPT
#!/bin/bash
cd $APP_DIR
docker compose stop nginx
certbot renew --quiet
docker compose start nginx
RENEW_SCRIPT
    chmod +x /usr/local/bin/certbot-renew-onfis.sh

    # Chạy lúc 3 giờ sáng ngày 1 mỗi tháng
    (crontab -l 2>/dev/null; echo "0 3 1 * * /usr/local/bin/certbot-renew-onfis.sh >> /var/log/certbot-renew.log 2>&1") | crontab -
    ok "Cron job gia hạn certificate đã được cài đặt"
}

# ==============================================================
# REDEPLOY — Xóa toàn bộ phiên bản cũ, deploy lại từ zip mới
#
# Dùng khi đã deploy trước đó và muốn cập nhật lên phiên bản mới.
# Lệnh này sẽ:
#   1) Dừng và xóa TẤT CẢ containers, images, volumes cũ
#   2) Xóa toàn bộ code cũ tại /opt/onfis
#   3) Giải nén zip mới và deploy lại
#
# SSL certs tại /etc/letsencrypt sẽ được GIỮ NGUYÊN (không bị xóa).
# Nếu SSL đã được cấu hình, HTTPS config sẽ tự động được áp dụng.
#
# USAGE:
#   Upload zip mới: scp onfis-deploy-*.zip root@146.190.98.126:~/
#   Chạy:          ./server-setup.sh redeploy
# ==============================================================
redeploy() {
    log "REDEPLOY: Xóa phiên bản cũ và deploy từ zip mới"

    # --- Tìm file zip mới nhất trong ~/ ---
    ZIPFILE=$(ls ~/onfis-deploy-*.zip 2>/dev/null | sort | tail -1)
    if [ -z "$ZIPFILE" ]; then
        fail "Không tìm thấy onfis-deploy-*.zip trong ~/\nHãy upload zip trước:\n  scp onfis-deploy-*.zip root@146.190.98.126:~/"
    fi
    ok "Sẽ deploy từ: $ZIPFILE"

    # --- Dừng và xóa toàn bộ containers, images, volumes ---
    if [ -f "$APP_DIR/docker-compose.yml" ]; then
        log "Dừng và xóa containers, local images và volumes cũ..."
        cd "$APP_DIR"
        docker compose down --volumes --rmi local 2>/dev/null || true
    else
        warn "$APP_DIR/docker-compose.yml không tìm thấy, bỏ qua bước dọn dẹp container."
    fi

    # --- Xóa toàn bộ code cũ ---
    log "Xóa code cũ tại $APP_DIR ..."
    rm -rf "$APP_DIR"
    mkdir -p "$APP_DIR"

    # --- Giải nén code mới ---
    log "Giải nén $ZIPFILE vào $APP_DIR ..."
    unzip -o "$ZIPFILE" -d "$APP_DIR"
    cd "$APP_DIR"

    # --- Sao chép .env.production thành .env ---
    if [ ! -f ".env.production" ]; then
        fail ".env.production không tồn tại trong $APP_DIR\nHãy thêm file này vào zip trước khi redeploy."
    fi
    cp .env.production .env
    ok "Đã tạo .env từ .env.production"

    # --- Nếu SSL đã được cấu hình, tự động dùng HTTPS config ---
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        cp "$APP_DIR/infrastructure/nginx/nginx.https.conf" \
           "$APP_DIR/infrastructure/nginx/nginx.conf"
        ok "SSL certs đã có → tự động dùng HTTPS config"
    else
        warn "SSL chưa được cấu hình → dùng HTTP config (chạy phase6 sau khi deploy)"
    fi

    # --- Build & chạy toàn bộ containers ---
    log "Build và khởi động containers (lần đầu mất 15-30 phút)..."
    docker compose up --build -d

    ok "Redeploy hoàn tất!"
    echo ""
    docker compose ps
    echo ""
    warn "Nếu có service nào không phải 'running', xem log: docker compose logs <service-name>"
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
    phase1)   phase1   ;;
    phase2)   phase2   ;;
    phase3)   phase3   ;;
    phase4)   phase4   ;;
    phase5)   phase5   ;;
    phase6)   phase6   ;;
    phase7)   phase7   ;;
    redeploy) redeploy ;;
    *)
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "  Initial deployment (run in order):"
        echo "    phase1   — Update system packages"
        echo "    phase2   — Install Docker"
        echo "    phase3   — Create 4GB swap file"
        echo "    phase4   — Configure firewall (UFW)"
        echo "    phase5   — Deploy app from zip"
        echo "    phase6   — Setup SSL/HTTPS (Let's Encrypt)"
        echo "    phase7   — Health check"
        echo ""
        echo "  Subsequent updates:"
        echo "    redeploy — Wipe old version, deploy new zip"
        echo ""
        exit 1
        ;;
esac
