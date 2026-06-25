#!/bin/bash
# =============================================================================
# setup.sh — Εγκατάσταση Vetty στο mini PC (Ubuntu Server 24.04)
# Τρέξε ως root: sudo bash setup.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠  $1${NC}"; }
fail() { echo -e "${RED}✗  $1${NC}"; exit 1; }

[[ $EUID -ne 0 ]] && fail "Τρέξε ως root: sudo bash setup.sh"

APP_DIR="/opt/vetty/vet-api"
APP_USER="vetty"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo "======================================="
echo "   Εγκατάσταση Vetty API — vetty.gr"
echo "======================================="
echo ""

# ── 1. System update ──────────────────────────────────────────────────────────
echo "→ System update..."
apt-get update -qq
apt-get upgrade -y -qq
ok "System updated"

# ── 2. Node.js 22 ─────────────────────────────────────────────────────────────
echo "→ Node.js 22..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - &>/dev/null
  apt-get install -y nodejs -qq
fi
ok "Node.js $(node -v)"

# ── 3. Nginx ──────────────────────────────────────────────────────────────────
echo "→ Nginx..."
apt-get install -y nginx -qq
systemctl enable nginx --quiet
ok "Nginx installed"

# ── 4. Cloudflared ────────────────────────────────────────────────────────────
echo "→ Cloudflared..."
if ! command -v cloudflared &>/dev/null; then
  curl -fsSL -o /tmp/cloudflared.deb \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i /tmp/cloudflared.deb &>/dev/null
  rm /tmp/cloudflared.deb
fi
ok "Cloudflared $(cloudflared version 2>&1 | head -1)"

# ── 5. Dedicated system user ──────────────────────────────────────────────────
echo "→ User '$APP_USER'..."
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -m -d /opt/vetty -s /bin/bash "$APP_USER"
fi
ok "User $APP_USER"

# ── 6. Directories ────────────────────────────────────────────────────────────
echo "→ Directories..."
mkdir -p "$APP_DIR"
mkdir -p /var/www/vetty-app          # React build
mkdir -p /var/www/vetty-landing      # Landing page
mkdir -p /var/log/vetty
chown -R "$APP_USER:$APP_USER" /opt/vetty /var/log/vetty
ok "Directories created"

# ── 7. Copy API source ────────────────────────────────────────────────────────
echo "→ Copy API files..."
rsync -a \
  --exclude node_modules \
  --exclude .env \
  --exclude '__tests__' \
  --exclude '*.test.js' \
  "$PROJECT_ROOT/vet-api/" "$APP_DIR/"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "API copied → $APP_DIR"

# ── 8. npm install (production only) ──────────────────────────────────────────
echo "→ npm install..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm install --omit=dev --silent"
ok "Dependencies installed"

# ── 9. Nginx config ───────────────────────────────────────────────────────────
echo "→ Nginx config..."
cp "$SCRIPT_DIR/nginx/vetty.conf" /etc/nginx/sites-available/vetty
ln -sf /etc/nginx/sites-available/vetty /etc/nginx/sites-enabled/vetty
rm -f /etc/nginx/sites-enabled/default
nginx -t -q && systemctl reload nginx
ok "Nginx configured"

# ── 10. Systemd service ───────────────────────────────────────────────────────
echo "→ Systemd service vetapi..."
cp "$SCRIPT_DIR/systemd/vetapi.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable vetapi --quiet
ok "vetapi.service enabled"

# ── 11. .env check ────────────────────────────────────────────────────────────
echo ""
if [[ -f "$APP_DIR/.env" ]]; then
  ok ".env βρέθηκε — εκκίνηση API..."
  systemctl start vetapi
  ok "API ξεκίνησε (systemctl status vetapi)"
else
  warn ".env ΔΕΝ βρέθηκε στο $APP_DIR/.env"
  echo "   1. Αντέγραψε deploy/.env.production.example → $APP_DIR/.env"
  echo "   2. Συμπλήρωσε τα credentials (MONGO_URI, JWT_SECRET κλπ.)"
  echo "   3. systemctl start vetapi"
fi

# ── 12. Cloudflare Tunnel οδηγίες ────────────────────────────────────────────
echo ""
echo "======================================="
echo "   Τελευταίο βήμα: Cloudflare Tunnel"
echo "======================================="
echo ""
echo "  Τρέξε τα παρακάτω ΜΙΑ ΦΟΡΑ με τη σειρά:"
echo ""
echo "  1)  cloudflared tunnel login"
echo "      (ανοίγει browser → κάνεις login στο Cloudflare dashboard)"
echo ""
echo "  2)  cloudflared tunnel create vetty-tunnel"
echo "      → θα εμφανιστεί ένα Tunnel ID (π.χ. a1b2c3d4-...)"
echo ""
echo "  3)  Άνοιξε deploy/cloudflare/config.yml"
echo "      Αντικατάστησε TUNNEL_ID_HERE με το Tunnel ID"
echo ""
echo "  4)  cp $SCRIPT_DIR/cloudflare/config.yml /home/$APP_USER/.cloudflared/"
echo "      chown $APP_USER:$APP_USER /home/$APP_USER/.cloudflared/config.yml"
echo ""
echo "  5)  cloudflared tunnel route dns vetty-tunnel api.vetty.gr"
echo "      cloudflared tunnel route dns vetty-tunnel app.vetty.gr"
echo "      cloudflared tunnel route dns vetty-tunnel www.vetty.gr"
echo ""
echo "  6)  cloudflared service install"
echo "      systemctl start cloudflared"
echo ""
echo -e "${GREEN}Εγκατάσταση ολοκληρώθηκε!${NC}"
echo ""
