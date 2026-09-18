# 🚀 Project Showcase: Anonymous Video Chat

## 📖 Overview

Anonymous Video Chat. It features a custom in-memory keyword-based matching engine, allowing users to connect based on shared interests without any sign-up or database overhead.

---

## 🎯 Core Features

- **Real-time Video & Audio:** Peer-to-peer streaming powered by WebRTC.
- **Live Text Messaging:** Low-latency chat routed via Socket.io.
- **Smart Matchmaking:** Custom algorithm matching users by common keywords, with a random fallback.
- **Zero Friction:** No authentication, no sign-up, fully anonymous.
- **Responsive Design:** Split-screen UI optimized for desktop and mobile devices.

---

## 🛠️ Technical Architecture

### Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Real-Time Communication:** WebRTC, Socket.io
- **Infrastructure:** Google STUN servers for NAT traversal


---

## 🔄 How the System Works

### **Matchmaking Flow**

````
User clicks "Start Chat"
    ↓
Server receives keywords
    ↓
Check for common keywords with waiting users
    ├─ FOUND: Create match → Emit matched event
    └─ NOT FOUND: Add to waiting pools
    ↓
Both users notified
    ↓
Create peer connection
    ↓
Exchange WebRTC offer/answer
    ↓
Video stream established (P2P, direct)
    ↓
Text messages routed via server
    ↓
User clicks "Next" or closes tab
    ↓
Clean up room, notify partner
    ↓
Both users back to searching

````

### **Technical Architecture**

```
┌─────────────────────────────────────────────────────┐
│  CLIENT 1 (Browser Tab)                             │
│  ┌──────────────────────────────────┐               │
│  │ WebRTC Peer Connection           │               │
│  │ - Video/Audio Stream             │ ─────────────┐│
│  │ - ICE Candidates                 │              ││
│  └──────────────────────────────────┘              ││
│  ┌──────────────────────────────────┐              ││
│  │ Socket.io Client                 │              ││
│  │ - Search request                 │              ││
│  │ - Chat messages                  │              ││
│  │ - Signaling                      │ ─────────────┘│
│  └──────────────────────────────────┘               │
└─────────────────────────────────────────────────────┘
                          │
                    P2P VIDEO/AUDIO
                    (Direct connection
                     No server bandwidth)
                          │
        ┌─────────────────┼─────────────────┐
        │ SIGNALING & MSG │   SIGNALING & MSG
        ↓                 ↓
┌──────────────────────────────────────────────┐
│  NODE.JS SERVER                              │
│  ┌───────────────────────────────────────┐   │
│  │ Express HTTP Server                   │   │
│  │ - Serve chat.html                     │   │
│  │ - Socket.io connections               │   │
│  └───────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐│
│  │ In-Memory Matchmaking Engine             ││
│  │ - User tracking: { socketId: {...} }     ││
│  │ - Room tracking: { roomId: {...} }       ││
│  │ - Waiting pools: randomPool, keywordPools││
│  │ - Keyword matching algorithm             ││
│  └──────────────────────────────────────────┘│
│  ┌───────────────────────────────────────┐   │
│  │ Connection Management                 │   │
│  │ - Track pairs                         │   │
│  │ - Route signals                       │   │
│  │ - Auto-cleanup                        │   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ↓                                   ↓
┌─────────────────────────────────┐  ┌──────────────────────────────────┐
│ CLIENT 2 (Browser Tab)          │  │  Google STUN Server              │
│ ┌──────────────────────────────┐│  │  (Free, used by ICE candidates)  │
│ │ WebRTC Peer Connection       ││  │                                  │
│ │ - Video/Audio Stream         ││  │  stun.l.google.com:19302         │
│ │ - ICE Candidates             ││  │  stun1.l.google.com:19302        │
│ └──────────────────────────────┘│  │                                  │
│ ┌──────────────────────────────┐│  └──────────────────────────────────┘
│ │ Socket.io Client             ││
│ │ - Search request             ││
│ │ - Chat messages              ││
│ │ - Signaling                  ││
│ └──────────────────────────────┘│
└─────────────────────────────────┘
```


---

## 📋 File Descriptions

### **1. package.json**

```json
{
    "name": "Anonymous Video Chat",
    "dependencies": {
        "express": "^4.18.2",
        "socket.io": "^4.5.4"
    },
    "scripts": {
        "start": "node server.js"
    }
}
```
---

---

## 📖 Learning Resources

### **WebRTC**

- MDN WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- WebRTC.org: https://webrtc.org

### **Socket.io**

- Socket.io Official Docs: https://socket.io/docs/
- Socket.io Tutorial: https://www.youtube.com/results?search_query=socket.io+tutorial

### **Node.js & Express**

- Node.js Docs: https://nodejs.org/docs/
- Express Docs: https://expressjs.com/

### **Video Conferencing**

- WebRTC Security: https://webrtc-security.github.io/

---

## 🎯 Project Summary

| Aspect             | Details                                      |
| ------------------ | -------------------------------------------- |
| **Type**           | Real-time video chat application             |
| **Architecture**   | Node.js backend, Vanilla JS frontend         |
| **Real-time Tech** | Socket.io + WebRTC                           |
| **Matchmaking**    | In-memory keyword-based algorithm            |
| **Video**          | P2P WebRTC, Google STUN servers              |
| **Chat**           | Real-time Socket.io messages                 |
| **Storage**        | In-memory (no database)                      |
| **Users**          | Anonymous, no sign-up                        |
| **Concurrent**     | Unlimited (limited by server resources)      |
| **Latency**        | <100ms (direct P2P)                          |
| **Bandwidth**      | Minimal server usage                         |
| **Scalability**    | Horizontal (add more servers)                |
| **License**        | MIT (free to use)                            |

---

**Made with 🤎 by Mahir**