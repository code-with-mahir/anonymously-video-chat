# 🎥 TALKOYE - Anonymous Video Chat Platform

A lightweight, free, **no sign-up** anonymous video and text chat platform with **keyword-based matching system**, built with modern web technologies for.

🌍 **Live Website:** [https://talkoye.onrender.com/](https://talkoye.onrender.com/)

---

## 📋 Features

✅ **Real-Time Video Chat** - P2P video streaming using WebRTC  
✅ **Text Messaging** - Live text communication with matched users  
✅ **Keyword-Based Matching** - Find strangers with shared interests  
✅ **Random Matching Fallback** - Connect with anyone if no keyword match  
✅ **In-Memory Matchmaking** - Ultra-fast matching engine (no database)  
✅ **Responsive UI** - Split-screen design for local and remote video  
✅ **Zero Setup Required** - Anonymous, no sign-up, no authentication  
✅ **Ad-Ready Architecture** - Pre-configured banner ad space for monetization

---

## 🛠️ Tech Stack

| Component        | Technology                             |
| ---------------- | -------------------------------------- |
| **Frontend**     | HTML5, CSS3, Vanilla JavaScript        |
| **Backend**      | Node.js, Express.js, Socket.io         |
| **Real-Time**    | WebRTC (P2P), Socket.io (Signaling)    |
| **STUN Servers** | Google's free STUN (stun.l.google.com) |
| **Deployment**   | Localhost (for testing)                |

---

## 📁 Project Structure

```
talkoye/
├── package.json          # Node.js dependencies
├── server.js             # Backend server (Express + Socket.io)
├── chat.html            # Frontend UI + WebRTC + Socket.io client
├── README.md             # This file
└── .gitignore            # (Optional) Git ignore file
```

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Install Node.js**

If you don't have Node.js installed:

- Download from [nodejs.org](https://nodejs.org/)
- Install the LTS (Long-Term Support) version
- Verify installation:
    ```bash
    node --version
    npm --version
    ```

### **Step 2: Navigate to Project Directory**

```bash
cd "c:\Users\dell\Desktop\New folder"
```

Or use the exact path where you extracted the files.

### **Step 3: Install Dependencies**

```bash
npm install
```

This installs:

- `express` - Web server framework
- `socket.io` - Real-time communication library

### **Step 4: Start the Server**

```bash
npm start
```

Or directly:

```bash
node server.js
```

You should see:

```
╔════════════════════════════════════════════════════════════════════════╗
║                   TALKOYE - SERVER STARTED                             ║
╚════════════════════════════════════════════════════════════════════════╝

📺 Server is running on: http://localhost:3000
📝 Open http://localhost:3000 in multiple browser tabs to test
...
```

### **Step 5: Open Browser Tabs**

Open **at least 2 browser tabs** with:

```
http://localhost:3000
```

Allow **camera and microphone** access when prompted.

### **Step 6: Test the Chat**

**Tab 1:**

1. Enter interests: `coding, gaming`
2. Click "Start Chat"
3. Wait for match

**Tab 2:**

1. Enter interests: `coding, movies`
2. Click "Start Chat"
3. You'll be matched (common keyword: "coding")
4. See "✨ You both like: coding" message
5. Video/audio should transmit P2P
6. Type messages and send

---

## 📖 How the Matchmaking Works

### **Matching Algorithm**

```
User clicks "Start Chat" with keywords
        ↓
[Server] Check for common keywords with waiting users
        ↓
IF (common keyword found) → Immediate match → Show matched keywords
        ↓
ELSE → Add to random waiting pool → Wait for next user
        ↓
Match complete → Create room → Trigger WebRTC signaling
```

### **Example Scenarios**

**Scenario 1: Keyword Match**

```
User A: interests = ["coding", "gaming", "movies"]
User B: interests = ["gaming", "books"]
         ↓
Common keyword found: "gaming"
         ↓
✨ Both see: "You both like: gaming"
```

**Scenario 2: No Keyword Match**

```
User A: interests = ["coding"]
User B: interests = ["music"]  (waiting)
         ↓
No common keywords
         ↓
Random match instead
```

**Scenario 3: Empty Keywords**

```
User C: interests = "" (empty)
         ↓
Goes to random waiting pool
         ↓
Matches with next person
```

---

## 🎮 Usage Guide

### **Starting a Chat**

1. **Enter Keywords** (Optional)
    - Type interests separated by commas: `coding, gaming, movies`
    - Leave blank for random matching

2. **Click "Start Chat"**
    - Server searches for matches
    - You'll see "🔍 Searching..." status

3. **When Matched**
    - Remote video appears (if they enabled camera)
    - See matched keywords (if any)
    - Chat becomes active (green indicator)

### **During Chat**

- **Video/Audio**: WebRTC handles this (P2P, server doesn't see/hear)
- **Text Messages**: Type in the chat box and press Enter or click Send
- **View Keywords**: Matched keywords display at top of chat
- **Next Button**: Click anytime to disconnect and search again

### **Ending Chat**

- Click **"Next"** button to disconnect and search again
- Close tab/browser to fully disconnect
- Server automatically cleans up

---

## 🔧 Backend API (Socket.io Events)

### **Client → Server Events**

#### `search(keywords)`

```javascript
// Sent when user clicks "Start Chat"
socket.emit('search', 'coding, gaming');
```

#### `offer(data)`

```javascript
// WebRTC offer
socket.emit('offer', { offer, roomId });
```

#### `answer(data)`

```javascript
// WebRTC answer
socket.emit('answer', { answer, roomId });
```

#### `ice-candidate(data)`

```javascript
// ICE candidate for NAT traversal
socket.emit('ice-candidate', { candidate, roomId });
```

#### `chat-message(message)`

```javascript
// Text message to stranger
socket.emit('chat-message', 'Hello!');
```

### **Server → Client Events**

#### `searching`

```javascript
// User is now searching for match
socket.on('searching', () => { ... });
```

#### `matched(data)`

```javascript
// Match found!
socket.on('matched', (data) => {
    // data = { roomId, partnerId, commonKeywords }
});
```

#### `offer` / `answer` / `ice-candidate`

```javascript
// WebRTC signaling
socket.on('offer', (data) => { ... });
```

#### `chat-message(message)`

```javascript
// Received message from stranger
socket.on('chat-message', (msg) => { ... });
```

#### `stranger-disconnected`

```javascript
// Stranger left
socket.on('stranger-disconnected', () => { ... });
```

---

## 💾 In-Memory Data Structures

### **Users Object** (Server-side)

```javascript
users = {
  "socket-id-1": {
    id: "socket-id-1",
    keywords: ["coding", "gaming"],
    status: "matched",
    partnerId: "socket-id-2",
    roomId: "room-12345-abc"
  },
  "socket-id-2": { ... }
}
```

### **Rooms Object** (Server-side)

```javascript
rooms = {
    'room-12345-abc': {
        roomId: 'room-12345-abc',
        user1Id: 'socket-id-1',
        user2Id: 'socket-id-2',
        commonKeywords: ['gaming'],
        createdAt: 1718041234567,
    },
};
```

### **Waiting Pools** (Server-side)

```javascript
randomWaitingPool = ['socket-id-3', 'socket-id-4'];

keywordWaitingPools = {
    coding: ['socket-id-5', 'socket-id-6'],
    gaming: ['socket-id-7'],
    movies: ['socket-id-8', 'socket-id-9'],
};
```

---

## 🎯 WebRTC Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBRTC SIGNALING FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User A (Offerer)              Server         User B (Answerer) │
│      │                            │                    │        │
│      ├─── search() ───────────→   │                    │        │
│      │                      ┌─────┴─────┐              │        │
│      │                      │   Match   │              │        │
│      │                      └─────┬─────┘              │        │
│      │                            ├───── search() ───→ │        │
│      │                            │                    │        │
│      ├─ matched(roomId) ←─────────┤                    │        │
│      │                            ├─ matched(roomId) ──│        │
│      │                            │                    │        │
│      ├─── offer ────────────────→ ├─── offer ───────→  │        │
│      │    (via server)            │   (via server)     │        │
│      │                            │                    │        │
│      │                     ┌──────┴──────┐             │        │
│      │                     │ ICE Checks  │             │        │
│      │                     └──────┬──────┘             │        │
│      │                            │                    │        │
│      ├─ ice-candidate ────────────┤─── answer ────→    │        │
│      │    (multiple)              │                    │        │
│      │                            ├─ ice-candidate ──→ │        │
│      │ ←──────────── answer ──────┤                    │        │
│      │    (via server)            │                    │        │
│      │                            │                    │        │
│      ├─────────────────────────────────────────────────│        │
│      │          P2P VIDEO/AUDIO STREAM                 │        │
│      │       (No traffic through server!)              │        │
│      ├─────────────────────────────────────────────────│        │
│      │                            │                    │        │
│      └─── chat messages ─────────→(signal routing)     │        │
│           (via Socket.io/server)  ├──→ chat message ───│        │
│                                   │                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**

- ✅ Server only handles **signaling** (offer/answer/ICE)
- ✅ Video/audio streams are **P2P** (direct between users)
- ✅ Server bandwidth is **minimal** (only text, no media)
- ✅ Uses Google's **free STUN servers** for NAT traversal

---

## 🍕 Adding Ads (Banner Space Ready)

The HTML includes a pre-built ad space:

```html
<div id="banner-ad-space">Banner ad space - Ready for monetization scripts</div>
```

### **To Add ExoClick Banner:**

1. Get your ExoClick ad code
2. Replace the div content in `chat.html`:

```html
<div id="banner-ad-space">
    <!-- ExoClick Banner Code -->
    <script type="text/javascript">
        // Your ExoClick code here
    </script>
</div>
```

### **To Add PopAds Pop-Unders (on "Next" button):**

Add to the "Next" button click handler in `chat.html`:

```javascript
startBtn.addEventListener('click', async () => {
    // Show pop-under ad
    if (typeof popunder !== 'undefined') {
        popunder.open();
    }

    // ... rest of code
});
```

---

## 🔒 Security Notes (Localhost Testing)

⚠️ **This setup is for LOCALHOST/TESTING ONLY**

For production deployment, you'll need:

- ✅ HTTPS (SSL certificate)
- ✅ Environment variables (.env file)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation & sanitization
- ✅ Proper error handling
- ✅ Logging & monitoring
- ✅ DDoS protection
- ✅ Content moderation

**Example production setup** (coming later):

```bash
npm install dotenv cors helmet express-rate-limit
```

---

## 📊 Performance Optimization

### **Server-Side**

- In-memory matching (instant)
- No database queries
- Efficient cleanup on disconnect
- Room pooling reduces memory leaks

### **Client-Side**

- Vanilla JavaScript (no framework overhead)
- Canvas-free UI (all CSS3)
- Auto-garbage collection
- Track cleanup on disconnect

### **Network**

- P2P video/audio (saves bandwidth)
- Minimal signaling messages
- Compressed text messages
- ICE candidate throttling

---

## 🐛 Troubleshooting

### **Problem: "Cannot find module 'express'"**

**Solution:** Run `npm install`

### **Problem: "Port 3000 already in use"**

**Solution:** Change PORT in `server.js`:

```javascript
const PORT = 3001; // or another free port
```

### **Problem: Camera/microphone not working**

**Solution:**

- Check browser permissions (Settings → Privacy)
- Try a different browser
- Restart browser
- Grant permissions when prompted

### **Problem: No video from stranger**

**Solution:**

- Wait 2-3 seconds (ICE candidates need time)
- Check browser console (F12) for errors
- Try different networks (some corporate firewalls block WebRTC)
- Use `stun:stun1.l.google.com:19302` instead

### **Problem: Server keeps crashing**

**Solution:**

- Check for errors in terminal
- Ensure ports are free
- Try different port number
- Check Node.js version (should be v14+)

### **Problem: Chat messages not sending**

**Solution:**

- Must be in "matched" state
- Check Socket.io connection (see server logs)
- Try typing and pressing Enter (not just clicking Send)

---

## 📝 Advanced Configuration

### **Change Default Port**

Edit `server.js`:

```javascript
const PORT = 3000; // Change to any port
```

### **Add More STUN Servers**

Edit `chat.html`:

```javascript
const CONFIG = {
    ICE_SERVERS: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ],
    },
};
```

### **Customize Video Quality**

Edit `chat.html`:

```javascript
state.localStream = await navigator.mediaDevices.getUserMedia({
    video: {
        width: { ideal: 1920 }, // Higher resolution
        height: { ideal: 1080 },
    },
    audio: true,
});
```

---

## 🚀 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication
- [ ] Video recording
- [ ] Screen sharing
- [ ] Call history
- [ ] Report/Block system
- [ ] Moderation tools
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Docker containerization
- [ ] Kubernetes deployment

---

## 📄 License

MIT License - Free to use and modify

---

## 🤝 Support

For issues or questions:

1. Check the troubleshooting section
2. Look at browser console (F12 → Console)
3. Check server terminal logs
4. Verify all files are in the correct directory

---

## 🎓 Learning Resources

- **WebRTC Docs**: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- **Socket.io Docs**: https://socket.io/docs/
- **Express Docs**: https://expressjs.com/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

## 🎉 You're All Set!

Start the server, open two tabs, and enjoy your anonymous video chat platform!

```bash
npm start
```

Then visit: `http://localhost:3000`

**Happy coding! 🚀**
