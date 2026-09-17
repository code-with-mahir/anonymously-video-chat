# 🚀 SETUP & RUN INSTRUCTIONS - QUICK START

## ✅ Pre-Requirements Check

Before starting, ensure you have:

- [ ] **Node.js installed** (v14 or higher)
    - Download: https://nodejs.org/
    - Check: Open PowerShell and run `node --version`
- [ ] **Supported Browser**
    - Chrome/Chromium (recommended for WebRTC)
    - Firefox
    - Edge
    - Safari (iOS 11+)
- [ ] **Camera & Microphone** connected to your computer

---

## 📋 Complete Setup Walkthrough

### **Step 1: Verify Node.js Installation**

Open **PowerShell** and run:

```powershell
node --version
npm --version
```

You should see versions like:

```
v18.17.0
9.6.7
```

If not installed, download from [nodejs.org](https://nodejs.org/) and install.

---

### **Step 2: Navigate to Project Directory**

```powershell
cd "c:\Users\dell\Desktop\New folder"
```

Or copy the full path where you extracted the files.

---

### **Step 3: Install Dependencies**

```powershell
npm install
```

This will:

- Create `node_modules/` folder
- Install `express` (web server)
- Install `socket.io` (real-time communication)
- Create `package-lock.json` (dependency lock file)

**Expected output:**

```
added 47 packages in 12s
```

---

### **Step 4: Start the Server**

```powershell
npm start
```

Or:

```powershell
node server.js
```

**Expected output:**

```
╔════════════════════════════════════════════════════════════════════════╗
║                   TALKOYE - SERVER STARTED                             ║
╚════════════════════════════════════════════════════════════════════════╝

📺 Server is running on: http://localhost:3000
📝 Open http://localhost:3000 in multiple browser tabs to test

Features:
✅ Real-time video chat with WebRTC
✅ Text messaging
✅ Keyword-based matching
✅ Random matching fallback
✅ In-memory matchmaking (no database)

Press Ctrl+C to stop the server
════════════════════════════════════════════════════════════════════════
```

**Server is now running! Leave this terminal open.**

---

### **Step 5: Open Browser Tabs**

Open a **new PowerShell/Terminal window** (keep the server running).

Open your browser and go to:

```
http://localhost:3000
```

You should see:

- Split-screen layout
- Local video box (left)
- Remote video box (right)
- Keywords input field
- Chat panel (right side)

---

### **Step 6: Grant Camera & Microphone Permissions**

When browser asks, click **"Allow"** for:

- ✅ Camera
- ✅ Microphone

If you accidentally blocked it:

- **Chrome**: Click lock icon → Permissions → Camera/Mic → Allow
- **Firefox**: Refresh page, click lock icon, click "Remember this decision"
- **Edge**: Settings → Privacy → Camera/Microphone

---

### **Step 7: Test with Multiple Tabs**

**IMPORTANT: You need at least 2 browser tabs to test (or 2 browsers)**

#### **Tab 1 - First User:**

1. Enter keywords: `gaming, coding`
2. Click "Start Chat"
3. Watch status: 🔍 Searching...
4. Leave open

#### **Tab 2 - Second User:**

1. Enter keywords: `coding, movies`
2. Click "Start Chat"
3. Status: 🔍 Searching...
4. **Instant match** on common keyword: "coding"
5. Both see: ✨ You both like: coding
6. Remote video box shows waiting message (waiting for video)

#### **Enable Cameras on Both Tabs:**

1. Find the camera icon in the address bar or permission popup
2. Click and grant camera access
3. Now you should see both videos

---

### **Step 8: Test Video, Audio & Chat**

**Test Video:**

- Move in front of camera
- You should see yourself in "Your Camera" box
- If stranger enabled camera, see their video in "Stranger's Camera" box

**Test Audio:**

- Speak into microphone
- Stranger should hear you (WebRTC P2P)
- No server bandwidth used!

**Test Chat:**

1. Type: `Hello, can you hear me?`
2. Press **Enter** or click **Send**
3. Message appears in your chat (right side, blue)
4. Stranger receives it (appears in their chat, gray)
5. They reply and you see it

**Test "Next" Button:**

1. Click **Next**
2. Current connection closes
3. Status: 🔍 Searching... again
4. Enter different keywords
5. Match with different user

---

## 📊 Server Console Output (What You'll See)

While running, the server logs every action:

```
[NEW USER] Socket ID: pX1a2b3c4d
[SEARCH] User pX1a2b3c4d searching with keywords: gaming, coding
[KEYWORD POOL] User pX1a2b3c4d added to keyword waiting pools

[NEW USER] Socket ID: qY5e6f7g8h
[SEARCH] User qY5e6f7g8h searching with keywords: coding, movies
[KEYWORD MATCH] pX1a2b3c4d matched with qY5e6f7g8h on keywords: coding
[ROOM CREATED] Room room-1718041234567-abc123 created between pX1a2b3c4d and qY5e6f7g8h

[OFFER] User pX1a2b3c4d sending offer to qY5e6f7g8h in room room-1718041234567-abc123
[ANSWER] User qY5e6f7g8h sending answer to pX1a2b3c4d in room room-1718041234567-abc123
[ICE] User pX1a2b3c4d sending ICE candidate to qY5e6f7g8h
[ICE] User qY5e6f7g8h sending ICE candidate to pX1a2b3c4d

[CHAT] pX1a2b3c4d -> qY5e6f7g8h: Hello!
[CHAT] qY5e6f7g8h -> pX1a2b3c4d: Hey there!

[DISCONNECT] User pX1a2b3c4d disconnected
[STATE] Active users: 1, Active rooms: 0
```

This helps you understand what's happening behind the scenes!

---

## 🔧 Testing Scenarios

### **Scenario 1: Keyword Match Test**

```
Browser 1: "coding, gaming"
Browser 2: "gaming, music"
Result: Match on "gaming"
```

### **Scenario 2: Random Match Test**

```
Browser 1: "" (empty keywords)
Browser 2: "photography"
Result: Random match (no keywords)
```

### **Scenario 3: Multiple Matches Test**

```
Browser 1: "movies"
Browser 2: "movies"  ← Match with Browser 1
Browser 3: "movies"
Browser 4: "movies"  ← Match with Browser 3
Browser 5: "movies"  ← Waits for Browser 6
Browser 6: "movies"  ← Matches with Browser 5
```

### **Scenario 4: Disconnect Test**

```
Browser 1 & 2 are matched
Browser 1 closes tab
Browser 2 sees: "Stranger disconnected"
Browser 2 can click "Next" to find new match
```

---

## 🎮 Feature Testing Checklist

After each test, verify the feature works:

- [ ] **Keyword Input**: Can type keywords
- [ ] **Start Button**: Changes to "Next" when matched
- [ ] **Matching**: 2 users with same keywords match instantly
- [ ] **Fallback**: Users without keywords do random match
- [ ] **Common Keywords Display**: Shows "✨ You both like: X"
- [ ] **Video Stream**: Camera video appears in "Your Camera" box
- [ ] **Remote Video**: Stranger's video appears (if enabled)
- [ ] **Chat Messages**: Can send and receive messages
- [ ] **Next Button**: Disconnects and resets for new search
- [ ] **Tab Close**: Notifies partner when disconnected
- [ ] **Server Logs**: Can see matching process in server terminal
- [ ] **Status Indicator**: Shows 🔍 Searching or 🟢 Connected

---

## 🛑 Stopping the Server

To stop the server, press **Ctrl+C** in the PowerShell window where it's running:

```
^C
Graceful shutdown...
HTTP server closed
Process terminated successfully
```

---

## 📱 Using Different Machines (Not Localhost)

When ready to test across different machines on your network:

1. Find your computer's IP:

    ```powershell
    ipconfig
    ```

    Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. Update `server.js`:

    ```javascript
    const HOST = '0.0.0.0'; // Listen on all interfaces
    ```

3. On other machines, visit:
    ```
    http://YOUR_IP:3000
    ```
    (e.g., `http://192.168.1.100:3000`)

⚠️ **Note**: Different machines may have WebRTC issues due to firewalls/NAT. Test on localhost first.

---

## 🐛 Quick Troubleshooting

| Issue                               | Solution                                     |
| ----------------------------------- | -------------------------------------------- |
| "Cannot find module 'express'"      | Run `npm install`                            |
| Port 3000 in use                    | Change PORT in server.js to 3001+            |
| Camera not working                  | Check browser permissions, restart browser   |
| No video from stranger              | Wait 3 seconds, check browser console (F12)  |
| Chat not sending                    | Must be matched, check Socket.io connection  |
| Server crashes                      | Check terminal error, verify Node.js version |
| "localhost:3000 refused to connect" | Ensure server is running in terminal         |

---

## 🎓 Project Files Explained

| File           | Purpose                                     |
| -------------- | ------------------------------------------- |
| `package.json` | Lists dependencies (express, socket.io)     |
| `server.js`    | Backend - matchmaking, signaling, cleanup   |
| `chat.html`   | Frontend UI - video, chat, WebRTC client    |
| `README.md`    | Full documentation                          |
| `SETUP.md`     | This file - quick setup guide               |
| `.gitignore`   | Ignore node_modules etc. in version control |

---

## ✨ You're Ready!

Your Talkoye is ready for **localhost testing**!

**Next Steps:**

1. ✅ Install dependencies: `npm install`
2. ✅ Start server: `npm start`
3. ✅ Open `http://localhost:3000` in 2 tabs
4. ✅ Test matching, video, chat
5. ✅ When working, add ad scripts to `chat.html`
6. ✅ Deploy to VPS/cloud when ready

---

## 📞 Need Help?

1. **Server won't start?** → Check Node.js installation
2. **Can't see video?** → Grant camera permission
3. **Can't match users?** → Open at least 2 browser tabs
4. **Console errors?** → Press F12 in browser, check Console tab
5. **Server logs confusing?** → Read comments in `server.js`

**Happy testing!** 🎉

---

**Remember**: This is for **LOCALHOST TESTING ONLY**. For production:

- Add HTTPS/SSL
- Deploy to cloud (Render, AWS, Heroku, DigitalOcean, etc.)
- Add content moderation
- Add user reporting system
- Configure CORS properly
- Add rate limiting
