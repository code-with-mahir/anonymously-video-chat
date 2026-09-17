# 🚀 PRODUCTION DEPLOYMENT GUIDE - TALKOYE v1.0

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Production Features](#key-production-features)
3. [Monetization Integration](#monetization-integration)
4. [Security & Performance](#security--performance)
5. [Deployment Steps](#deployment-steps)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## 📌 Overview

This is a **production-grade TALKOYE video chat platform** built with:

- **Node.js + Express + Socket.io** (backend)
- **HTML5 + WebRTC** (frontend)
- **Production security** (CORS, rate limiting, input validation)
- **Monetization hooks** (PopAds, ExoClick/JuicyAds)
- **Real-time metrics** (users online counter)
- **Automatic recovery** (ICE restart logic)

**Version:** 2.0.0 (Production Release)
**Last Updated:** June 2026

---

## ✨ Key Production Features

### 1. 🔒 Security Hardening

- **CORS Protection**: Configure allowed origins per environment
- **Rate Limiting**: Max 10 searches per 30 seconds per user
- **Search Cooldown**: 2-second minimum between searches
- **Message Validation**: Max 1000 chars, type checking
- **Keyword Limits**: Max 20 keywords per user, 30 chars each
- **Trust Proxy**: Correct IP detection behind reverse proxies
- **Try-Catch Blocks**: Prevents server crashes from unexpected errors

### 2. 📊 Real-Time Monitoring

- **Active Users Counter**: Broadcasts online count every 30 seconds
- **Connection Logging**: IP tracking, detailed event logs
- **Error Tracking**: Comprehensive error reporting
- **State Reporting**: Active users, rooms, waiting pools

### 3. 🎯 Monetization Ready

- **PopAds Integration**: Click-tracking trigger function
- **Banner Ad Space**: 728x90 or 300x250 ExoClick/JuicyAds placement
- **Users Online Display**: Live counter in header (great for ads)
- **Clear Integration Points**: Documented code hooks for ad networks

### 4. 🌐 Network Resilience

- **ICE Restart Logic**: Auto-reconnect on network switching
- **Multiple ICE Servers**: STUN fallback for NAT traversal
- **WebSocket + HTTP Polling**: Fallback transport for unreliable networks
- **Graceful Disconnection**: Proper cleanup on all exit paths

### 5. 📱 Mobile-First UI

- **Responsive Design**: Works on mobile, tablet, desktop
- **Touch-Friendly**: Larger buttons, optimized for touch
- **Permission Error Handling**: User-friendly messages instead of alerts
- **Adaptive Layouts**: Grid changes based on screen size

---

## 💰 Monetization Integration

### PopAds (Pop-Under Ads)

#### Integration Steps:

1. Sign up at **PopAds.net**
2. Create your pop-under campaign
3. Get your PopAds script code
4. Add to `<head>` of chat.html:

```html
<!-- PopAds Integration -->
<script async src="https://a.popads.net/show.php?l=4"></script>
```

#### Trigger Point:

The function `triggerPopUnderAd()` is called every time user clicks "Next" button. This allows PopAds to track engagement.

```javascript
// Located in JavaScript section of chat.html
function triggerPopUnderAd() {
    // PopAds shows pop-under on click
    // Revenue: ~$5-15 per 1000 impressions
}
```

---

### ExoClick / JuicyAds (Banner Ads)

#### Integration Steps:

1. Sign up at **ExoClick.com** or **JuicyAds.com**
2. Create a 728x90 Leaderboard or 300x250 Medium Rectangle ad
3. Copy your ad code
4. Paste into `#banner-ad-space` div in chat.html:

```html
<!-- Current Placeholder (Line ~730) -->
<div id="banner-ad-space">
    <!-- PASTE YOUR ExoClick/JuicyAds CODE HERE -->
    <!-- Your ad code like: -->
    <!-- <script type='text/javascript' src='https://...' async></script> -->
</div>
```

#### Revenue Tracking:

- **Impressions**: ~$0.5-2 CPM (cost per thousand impressions)
- **Users Online**: Real-time counter helps optimize ad placement
- **Frequency**: Banner displays to every user, every session
- **Mobile**: Responsive - scales to fit screen

#### Example Ad Code (ExoClick):

```html
<script type="text/javascript" src="//a.exoclick.com/ads.js"></script>
<ins class="eeaa" data-eeaa="123456789"></ins>
<script>
    adunitDiv = document.querySelector('.eeaa');
    adunitDiv.setAttribute('id', 'ad-unit-123456789');
    try {
        window.eeaa.queue.push(function () {
            eeaa_display('123456789');
        });
    } catch (e) {}
</script>
```

---

### Revenue Estimation

**Monthly Estimates (10,000 users):**

- PopAds: 1,000 pop-unders × $0.05-0.15 = **$50-150/month**
- Banner Ads: 10,000 users × 10 sessions × 1 banner = **100,000 impressions**
    - At $1 CPM = **$100/month**
    - At $2 CPM = **$200/month**
- **Total: $150-350/month** (varies by traffic quality)

---

## 🔐 Security & Performance

### Rate Limiting

**Configuration (server.js, line ~40):**

```javascript
const RATE_LIMIT_CONFIG = {
    SEARCH_MAX_PER_USER: 10, // Max 10 searches per user
    SEARCH_WINDOW_MS: 30000, // Per 30 seconds
    SEARCH_COOLDOWN_MS: 2000, // Minimum 2 seconds between searches
};
```

**Adjustments:**

```javascript
// For high-traffic servers (increase limits):
SEARCH_MAX_PER_USER: 20,            // Allow more searches
SEARCH_WINDOW_MS: 60000,            // Per 60 seconds
SEARCH_COOLDOWN_MS: 1000,           // 1 second cooldown

// For strict DDoS protection (decrease limits):
SEARCH_MAX_PER_USER: 5,             // Very strict
SEARCH_WINDOW_MS: 30000,
SEARCH_COOLDOWN_MS: 5000,           // 5 second cooldown
```

### CORS Configuration

**Default (for testing):**

```bash
ALLOWED_ORIGINS=*
```

**Production (your domain only):**

```bash
ALLOWED_ORIGINS=https://talkoye.com,https://www.talkoye.com
```

---

## 🚀 Deployment Steps

### Prerequisites

- Node.js 14+ installed
- npm or yarn
- A server or platform (Render, Heroku, DigitalOcean, AWS, etc.)

### Step 1: Prepare Code

```bash
cd "c:\Users\dell\Desktop\talkoye"
npm install
```

### Step 2: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your production settings
# Important: Set ALLOWED_ORIGINS to your domain
nano .env
```

### Step 3: Test Locally

```bash
# Development mode (with verbose logging)
npm run dev

# Or production mode
npm run prod
```

Visit `http://localhost:3000` in two browser tabs to test.

### Step 4: Deploy to Render.com (Recommended for Beginners)

#### 4a. Create Render Account

- Go to https://render.com
- Sign up with GitHub / Google

#### 4b. Create Web Service

1. Click "New +" → "Web Service"
2. Connect GitHub repo or use CLI
3. Settings:
    - **Name**: talkoye-prod
    - **Environment**: Node
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
    - **Instance Type**: Free (or Starter for production)

#### 4c. Set Environment Variables

1. In Render dashboard, go to "Environment"
2. Add:
    ```
    NODE_ENV=production
    PORT=     (leave blank - Render sets it)
    HOST=0.0.0.0
    ALLOWED_ORIGINS=https://talkoye.onrender.com
    ```
3. Click "Save"

#### 4d. Deploy

- Render auto-deploys on git push
- Your app: `https://talkoye.onrender.com`

### Step 5: Deploy to DigitalOcean / VPS

#### 5a. SSH into Server

```bash
ssh root@your-server-ip
```

#### 5b. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 5c. Clone & Setup

```bash
cd /var/www
git clone https://github.com/code-with-mahir/talkoye.git
cd talkoye
npm install
cp .env.example .env
nano .env  # Edit with your domain
```

#### 5d. Setup Nginx Reverse Proxy

```bash
sudo apt-get install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/talkoye

# Add:
server {
    listen 80;
    server_name talkoye.com www.talkoye.com;

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

# Enable site
sudo ln -s /etc/nginx/sites-available/talkoye /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5e. Setup SSL (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d talkoye.com -d www.talkoye.com
```

#### 5f. Start App with PM2 (Process Manager)

```bash
sudo npm install -g pm2

pm2 start server.js --name "talkoye"
pm2 startup
pm2 save

# Monitor logs
pm2 logs talkoye
```

### Step 6: Setup Monitoring

#### 6a. View Server Logs

```bash
# Render: In dashboard → Logs
# DigitalOcean: ssh root@ip && pm2 logs talkoye
# Heroku: heroku logs --tail
```

#### 6b. Monitor Performance

```bash
# Check CPU/Memory (on VPS)
htop

# Check connections
netstat -an | grep ESTABLISHED | wc -l

# Monitor Node.js memory
node --max-old-space-size=2048 server.js
```

---

## ⚙️ Environment Configuration

### .env Variables Explained

```bash
PORT=3000
# The port the server listens on
# Render/Heroku: Leave empty (they assign it)
# VPS: Use 3000 or your custom port

NODE_ENV=production
# Controls logging verbosity and optimizations
# development: Verbose logs, detailed errors
# production: Minimal logs, optimized performance

HOST=0.0.0.0
# Which network interface to bind to
# localhost: Only local connections (for testing)
# 0.0.0.0: Accept connections from any IP (production)

ALLOWED_ORIGINS=https://talkoye.com
# Comma-separated list of allowed frontend domains
# Only these origins can connect via WebSocket
# Always use HTTPS in production
```

---

## 📊 Monitoring & Troubleshooting

### Key Metrics to Monitor

**Server Health:**

```bash
# CPU Usage: Should be < 30% idle
# Memory: Should not grow indefinitely
# Connections: Track active WebSocket connections
```

**Application Metrics:**

```
- Online users count (displayed in header)
- Rooms created per minute
- Search requests per minute
- ICE restart attempts
- Rate limit hits
```

### Common Issues & Solutions

#### Issue: "CORS policy violation"

**Solution:** Update ALLOWED_ORIGINS in .env

```bash
ALLOWED_ORIGINS=https://your-actual-domain.com
```

#### Issue: "Too many ICE restart attempts"

**Solution:** Users have unstable network. Consider:

- Increasing maxIceRestartAttempts from 3 to 5
- Adding more STUN servers
- Checking client network (WiFi issues)

#### Issue: "High memory usage"

**Solution:** Clean up old connections:

- Increase autoconnectivity timeouts
- Monitor for socket leak
- Restart server (PM2 handles this)

#### Issue: "Rate limited errors"

**Solution:** Users hitting rate limit. Either:

- Users are spamming "Next" - this is expected
- Increase cooldown if needed:
    ```javascript
    SEARCH_COOLDOWN_MS: 1000,  // Decrease from 2000
    ```

#### Issue: "Connection failed - ICE"

**Solution:** This is normal for some networks:

- Add more STUN servers in CONFIG.ICE_SERVERS
- Client-side can reconnect (already implemented)
- Consider TURN server for restricted networks

---

## 📈 Scaling Recommendations

### Single Server Setup (Current)

- **Max Users**: ~1000 concurrent
- **RAM Needed**: 512MB
- **CPU**: 1 core minimum, 2+ recommended
- **Bandwidth**: ~2Mbps per user video (peer-to-peer)

### Load Balancing (For Growth)

```
    ┌─────────────────────┐
    │  Nginx Load Balancer │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
  Server1   Server2   Server3
  Node.js   Node.js   Node.js
  :3001     :3002     :3003
```

### Database Addition (For Persistence)

- Add MongoDB/PostgreSQL for:
    - User profiles
    - Chat history
    - Statistics
    - Banned users list

---

## 🎯 Next Steps

1. **Ad Integration**: Add PopAds and ExoClick codes
2. **Domain Setup**: Get your domain + SSL certificate
3. **Deployment**: Choose Render or DigitalOcean
4. **Monitoring**: Set up uptime monitoring (Uptime Robot)
5. **Analytics**: Add Google Analytics for traffic tracking
6. **Support**: Create Discord for user support

---

## 📞 Support & Resources

- **Socket.io Docs**: https://socket.io/docs/
- **WebRTC Guide**: https://webrtc.org/
- **Render Docs**: https://render.com/docs
- **Let's Encrypt**: https://letsencrypt.org/

---

## 📄 License

MIT License - Free to use and modify

---

**Version 2.0.0 - Production Release**
Ready for deployment. Happy monetization! 🚀💰
