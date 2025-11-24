# P2P Share Server Deployment Guide

This guide covers deploying your own PairDrop signaling server for use with the P2P Share Obsidian plugin.

## Why Self-Host?

- **Privacy**: Keep peer discovery traffic on your own infrastructure
- **Reliability**: No dependency on third-party servers
- **Customization**: Configure rate limits, TURN servers, and branding
- **Compliance**: Meet organizational security requirements

## Quick Start

The PairDrop server is a Node.js application. Clone the official repo:

```bash
git clone https://github.com/schlagmichdoch/pairdrop.git
cd pairdrop
npm install
npm start
```

Default: `http://localhost:3000`

## Deployment Options

### 1. Use Public PairDrop (Free, No Setup)

The plugin defaults to `wss://pairdrop.net` - no deployment needed.

**Pros**: Zero setup, always available
**Cons**: Shared infrastructure, no control

---

### 2. Docker (Recommended for Self-Hosting)

```bash
docker run -d \
  --name pairdrop \
  -p 3000:3000 \
  --restart unless-stopped \
  lscr.io/linuxserver/pairdrop:latest
```

With environment variables:

```bash
docker run -d \
  --name pairdrop \
  -p 3000:3000 \
  -e PUID=1000 \
  -e PGID=1000 \
  -e WS_FALLBACK=true \
  -e RATE_LIMIT=100 \
  --restart unless-stopped \
  lscr.io/linuxserver/pairdrop:latest
```

**Docker Compose**:

```yaml
version: "3"
services:
  pairdrop:
    image: lscr.io/linuxserver/pairdrop:latest
    container_name: pairdrop
    environment:
      - PUID=1000
      - PGID=1000
      - WS_FALLBACK=true
    ports:
      - 3000:3000
    restart: unless-stopped
```

---

### 3. Fly.io (Free Tier Available)

**Setup**:

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Clone PairDrop
git clone https://github.com/schlagmichdoch/pairdrop.git
cd pairdrop

# Create fly.toml
cat > fly.toml << 'EOF'
app = "my-pairdrop"
primary_region = "iad"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"
  WS_FALLBACK = "true"

[http_service]
  internal_port = 8080
  force_https = true

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
EOF

# Deploy
fly launch
fly deploy
```

**Cost**: Free tier includes 3 shared VMs, 160GB outbound transfer

**Plugin URL**: `wss://my-pairdrop.fly.dev`

---

### 4. Railway (Simple Deploy)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect to the PairDrop repo or your fork
4. Railway auto-detects Node.js and deploys

**Cost**: Free tier with $5 credit/month

**Plugin URL**: `wss://your-app.up.railway.app`

---

### 5. Render (Free Web Services)

1. Go to [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Add `WS_FALLBACK=true`

**Cost**: Free tier (spins down after inactivity)

**Plugin URL**: `wss://your-app.onrender.com`

---

### 6. Cloudflare Workers (Edge Deployment)

Requires adapting PairDrop for Workers. More complex but ultra-low latency.

See: [Cloudflare WebSocket docs](https://developers.cloudflare.com/workers/runtime-apis/websockets/)

**Cost**: Free tier with 100k requests/day

---

### 7. VPS (Full Control)

**Providers**: DigitalOcean, Linode, Hetzner, Vultr ($4-10/month)

```bash
# On your VPS (Ubuntu/Debian)
sudo apt update && sudo apt install -y nodejs npm nginx certbot

# Clone and setup
git clone https://github.com/schlagmichdoch/pairdrop.git
cd pairdrop
npm install

# Create systemd service
sudo cat > /etc/systemd/system/pairdrop.service << 'EOF'
[Unit]
Description=PairDrop Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/user/pairdrop
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=PORT=3000
Environment=WS_FALLBACK=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable pairdrop
sudo systemctl start pairdrop
```

**Nginx reverse proxy** (for HTTPS):

```nginx
server {
    listen 443 ssl http2;
    server_name pairdrop.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/pairdrop.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pairdrop.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Get SSL cert:

```bash
sudo certbot --nginx -d pairdrop.yourdomain.com
```

**Plugin URL**: `wss://pairdrop.yourdomain.com`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `WS_FALLBACK` | `false` | Enable WebSocket fallback (for restricted networks) |
| `RATE_LIMIT` | `false` | Rate limiting (set to number of proxies, e.g., `1`) |
| `RTC_CONFIG` | - | Path to custom WebRTC config JSON |
| `DEBUG_MODE` | `false` | Enable debug logging |
| `IPV6_LOCALIZE` | - | IPv6 localization segments |

## WebRTC Configuration

For networks that block direct P2P, you may need TURN servers:

Create `rtc_config.json`:

```json
{
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    {
      "urls": "turn:your-turn-server.com:3478",
      "username": "user",
      "credential": "password"
    }
  ]
}
```

Set `RTC_CONFIG=./rtc_config.json` environment variable.

**Free TURN options**:
- [Metered TURN](https://www.metered.ca/tools/openrelay/) - Free tier available
- [Twilio TURN](https://www.twilio.com/stun-turn) - Pay-as-you-go

## Security Considerations

1. **Always use HTTPS/WSS** in production
2. **Enable rate limiting** to prevent abuse
3. **Consider IP restrictions** for private deployments
4. **Monitor logs** for unusual activity
5. **Keep dependencies updated**

## Testing Your Deployment

1. Open your server URL in a browser - you should see the PairDrop web UI
2. In Obsidian, update Settings → P2P Share → Signaling Server URL
3. Open two vaults and verify peer discovery works
4. Test a file transfer

## Troubleshooting

### WebSocket connection fails
- Ensure your reverse proxy supports WebSocket upgrades
- Check firewall allows ports 80/443
- Verify SSL certificate is valid

### Peers don't see each other
- Both must be on the same server
- Check server logs for connection errors
- Ensure `WS_FALLBACK=true` if WebRTC is blocked

### Transfers timeout
- May need TURN server for restrictive networks
- Check if P2P connections are being blocked
- Try increasing client-side timeouts

## Cost Summary

| Platform | Free Tier | Paid |
|----------|-----------|------|
| pairdrop.net | Unlimited | - |
| Fly.io | 3 VMs, 160GB transfer | $0.0071/hr |
| Railway | $5/month credit | Pay-as-you-go |
| Render | Basic tier (sleeps) | $7/month |
| DigitalOcean | - | $4-6/month |
| Hetzner | - | €3.79/month |
