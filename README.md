Bash
cat << 'EOF' > README.md

# 🎥 Anonymous Video Chat - Anonymous Video Chat Platform

A lightweight, free, **no sign-up** anonymous video and text chat platform with **keyword-based matching system**, built with modern web technologies.

🌍 **Live Website:** Anonymous Video Chat.onrender.com

---

## 📋 Features

✅ **Real-Time Video Chat** - P2P video streaming using WebRTC  
✅ **Text Messaging** - Live text communication with matched users  
✅ **Keyword-Based Matching** - Find strangers with shared interests  
✅ **Random Matching Fallback** - Connect with anyone if no keyword match  
✅ **In-Memory Matchmaking** - Ultra-fast matching engine (no database)  
✅ **Responsive UI** - Split-screen design for local and remote video  
✅ **Zero Setup Required** - Anonymous, no sign-up, no authentication

---

## 🛠️ Tech Stack

| Component        | Technology                             |
| ---------------- | -------------------------------------- |
| **Frontend**     | HTML5, CSS3, Vanilla JavaScript        |
| **Backend**      | Node.js, Express.js, Socket.io         |
| **Real-Time**    | WebRTC (P2P), Socket.io (Signaling)    |
| **STUN Servers** | Google's free STUN (stun.l.google.com) |

---

## 📁 Project Structure

Anonymous Video Chat/
├── package.json # Node.js dependencies
├── server.js # Backend server (Express + Socket.io)
├── chat.html # Frontend UI + WebRTC + Socket.io client
├── README.md # This file
└── .gitignore # Git ignore file

---

## 🚀 Quick Start (Local Development)

### **Step 1: Install Node.js**

If you don't have Node.js installed:

- Download from nodejs.org
- Verify installation:
    ```bash
    node --version
    npm --version
    ```

### **Step 2: Clone & Install Dependencies**

```bash
git clone <your-repo-url>
cd Anonymous Video Chat
npm install
Step 3: Start the Server
Bash
npm start
You should see:
```
---
```
╔════════════════════════════════════════════════════════════════════════╗
║                   Anonymous Video Chat - SERVER STARTED                             ║
╚════════════════════════════════════════════════════════════════════════╝
📺 Server is running on: http://localhost:3000
Step 4: Test the Chat
Open at least 2 browser tabs at http://localhost:3000. Allow camera and microphone access to test the P2P connection locally.

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
Key Points:

Server only handles signaling (offer/answer/ICE).

Video/audio streams are P2P (direct between users).

Server bandwidth is minimal (only text routing).

CORS Configuration: Restricts WebSocket connections to allowed origins.

Rate Limiting: Prevents search spamming (e.g., max 10 searches per 30 seconds).

Input Validation & Sanitization: Limits message lengths and keyword counts.

Trust Proxy Support: Accurately detects client IPs behind reverse proxies (like Nginx or Cloudflare).

Memory Management: Efficient in-memory state tracking with automatic cleanup on disconnect to prevent memory leaks.

📄 License
MIT License - Free to use and modify

