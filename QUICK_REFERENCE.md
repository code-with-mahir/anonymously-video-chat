# 🚀 QUICK REFERENCE CARD - PRODUCTION V1.0

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (verbose logging)
npm run dev

# Production mode (optimized)
npm run prod

# Start server (production)
npm start
```

---

## Environment Variables

```bash
# Create .env file with:
NODE_ENV=production
PORT=3000              # Leave blank for Render/Heroku
HOST=0.0.0.0          # Accept all connections
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## Server Limits & Config

```javascript
// Rate Limiting (server.js, line ~40)
SEARCH_MAX_PER_USER: 10      // Max 10 searches
SEARCH_WINDOW_MS: 30000      // Per 30 seconds
SEARCH_COOLDOWN_MS: 2000     // Min 2 sec between

// Message Validation
Max message length: 1000 chars
Max keywords: 20 per user
Max keyword length: 30 chars

// ICE Servers (WebRTC)
stun.l.google.com:19302      // Public STUN server
```

---

## Socket.io Events

### Server → Client

```javascript
// Matched with user
socket.on('matched', (data) => {
    // data.roomId, data.partnerId
});

// User online count (real-time)
socket.on('online-count', (data) => {
    // data.count = number of online users
});

// Rate limited (too many searches)
socket.on('rate-limited', (data) => {
    // data.message = "Too fast. Wait X seconds"
});

// WebRTC Signaling
socket.on('offer', (data) => {
    /* data.offer */
});
socket.on('answer', (data) => {
    /* data.answer */
});
socket.on('ice-candidate', (data) => {
    /* data.candidate */
});

// Partner disconnected
socket.on('stranger-disconnected', () => {});

// Chat message from partner
socket.on('chat-message', (data) => {
    // data.message, data.sender
});
```

### Client → Server

```javascript
// Search for partner
socket.emit('search', 'keyword1, keyword2, ...');

// WebRTC Signaling
socket.emit('offer', { roomId, offer });
socket.emit('answer', { roomId, answer });
socket.emit('ice-candidate', { roomId, candidate });

// Send message to partner
socket.emit('chat-message', {
    roomId,
    message: 'text',
});

// Disconnect
socket.emit('disconnect');
```

---

## Frontend Hooks

### Monetization Triggers

```javascript
// PopAds (called on "Next" button)
triggerPopUnderAd();

// Banner Ad Space (in HTML)
<div id="banner-ad-space">
    <!-- Paste ExoClick/JuicyAds code here -->
</div>

// Online Counter (auto-updating)
<div id="online-counter">
    <span id="online-count">0</span> online
</div>
```

### Error Handling

```javascript
// Camera Permission Error
// Shows friendly overlay instead of alert
// Handled by initializeLocalMedia()

// Rate Limited
// Shows message in chat: "Too fast. Wait X seconds"
// Handled by socket.on('rate-limited')

// Connection Failed
// ICE restart attempts up to 3 times automatically
// Handled by attemptIceRestart()
```

---

## Deployment URLs

### Local Development

```
http://localhost:3000
```

### Render.com

```
https://app-name.onrender.com
```

### DigitalOcean/VPS

```
https://your-domain.com
```

### Heroku

```
https://app-name.herokuapp.com
```

---

## Monitoring & Logs

### View Server Logs

```bash
# Local development
npm run dev          # Shows logs in console

# Production (Render)
# Dashboard → Logs tab

# Production (DigitalOcean/VPS with PM2)
pm2 logs talkoye
pm2 monit

# Production (Heroku)
heroku logs --tail
```

### Key Metrics

```
- Online users count (in header)
- Rate limit hits (in console)
- Connection errors (in logs)
- ICE restart attempts (in console)
- Message counts (track in code)
```

---

## Troubleshooting

### "CORS policy violation"

→ Update ALLOWED_ORIGINS in .env

### "Rate limited" messages

→ Users are clicking too fast (expected)
→ Or increase SEARCH_COOLDOWN_MS in server.js

### "Connection failed - ICE"

→ Normal for some networks
→ Client attempts 3 restarts automatically
→ Add more STUN servers if issue persists

### "Too many open files"

→ Increase system limits: `ulimit -n 65535`

### "Server won't start"

→ Check Node version: `node -v` (14+ required)
→ Check port not in use: `lsof -i :3000`
→ Check .env syntax

### "High memory usage"

→ Check for connection leaks
→ Restart server: `pm2 restart talkoye`
→ Increase max memory: `node --max-old-space-size=2048`

---

## Security Checklist

- [ ] ALLOWED_ORIGINS set to your domain
- [ ] NODE_ENV=production in .env
- [ ] HTTPS enabled (use reverse proxy)
- [ ] Rate limiting not disabled
- [ ] Trust proxy enabled
- [ ] Error handling in place
- [ ] SSL certificate valid
- [ ] Firewall configured
- [ ] Logs monitored
- [ ] Backups configured

---

## Performance Optimization

### If server is slow:

1. Check CPU/memory: `htop`
2. Monitor connections: `netstat -an | grep ESTABLISHED | wc -l`
3. Check for connection leaks
4. Enable compression: `app.use(compression());`
5. Add caching headers

### If high CPU usage:

1. Profile with: `node --prof server.js`
2. Check for infinite loops
3. Reduce rate limit if needed
4. Check for DDoS (monitor ALLOWED_ORIGINS)

### If high memory:

1. Check connection count
2. Verify proper cleanup on disconnect
3. Monitor user object size
4. Use PM2 for auto-restart

---

## Monetization Tips

### PopAds Optimization

- Revenue: ~$5-15 per 1000 impressions
- Triggered on every "Next" button click
- Best for high-engagement users
- Can adjust frequency if too aggressive

### Banner Ad Optimization

- Revenue: ~$1-2 CPM (per thousand impressions)
- Place above chat area for visibility
- Responsive: works on all screen sizes
- A/B test 728x90 vs 300x250

### Combined Revenue

- 10,000 monthly users
- Average 10 sessions per user
- Total: 100,000 ad impressions
- Estimated: $100-350/month

### Best Practices

1. Never block ads (users rely on them)
2. Test with AdBlocker disabled
3. Monitor ad performance metrics
4. Use reputable ad networks
5. Keep balance between revenue and UX

---

## File Structure

```
talkoye/
├── server.js                    # Backend server
├── chat.html                   # Frontend UI
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── .env                         # Your actual env vars
├── PRODUCTION_DEPLOYMENT.md     # Full deployment guide
├── PRODUCTION_SUMMARY.md        # This summary
├── CHANGELOG.md                 # What's new in V1.0
├── SETUP.md                     # Initial setup
├── README.md                    # Features overview
├── TEST.md                      # Testing guide
└── deploy.sh                    # Quick setup script
```

---

## Useful Links

- **Socket.io Docs**: https://socket.io/docs/
- **WebRTC Guide**: https://webrtc.org/
- **Node.js Docs**: https://nodejs.org/docs/
- **Render Deploy**: https://render.com/docs
- **DigitalOcean**: https://www.digitalocean.com/docs
- **Let's Encrypt**: https://letsencrypt.org/
- **Nginx Config**: https://nginx.org/en/docs/
- **PM2 Docs**: https://pm2.keymetrics.io/docs/

---

## Time Estimates

| Task              | Time      |
| ----------------- | --------- |
| npm install       | 2-5 min   |
| Setup .env        | 2 min     |
| Test locally      | 5 min     |
| Deploy Render     | 10-15 min |
| Deploy VPS        | 30-45 min |
| Add PopAds code   | 5 min     |
| Add ExoClick code | 5 min     |
| Monitor setup     | 10 min    |

**Total time to production**: 30-90 minutes

---

## Support Checklist

Before asking for help, verify:

- [ ] Node.js 14+ installed
- [ ] npm install completed
- [ ] .env file exists and configured
- [ ] npm run dev works locally
- [ ] Server logs show no errors
- [ ] Browser console shows no JS errors
- [ ] ALLOWED_ORIGINS matches your domain
- [ ] PORT not in use

---

**Version**: 2.0.0 Production
**Last Updated**: June 2026
**Status**: ✅ Ready to Deploy

Keep this card handy during development and deployment! 🚀
