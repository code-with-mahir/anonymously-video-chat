# 🧪 TESTING GUIDE - Verify Your Installation

Complete these tests in order to ensure everything is working correctly.

---

## ✅ Pre-Flight Checklist

Before testing, verify:

- [ ] Node.js installed: `node --version` (should be v14+)
- [ ] All files created: `package.json`, `server.js`, `chat.html`
- [ ] Dependencies installed: `npm install` completed
- [ ] Server running: `npm start` (check terminal)
- [ ] Browser open: http://localhost:3000
- [ ] Permissions granted: Camera & microphone allowed

---

## 🔬 Test 1: Server Startup

### **Objective**: Verify server starts without errors

**Steps:**

1. Open PowerShell
2. Navigate: `cd "c:\Users\dell\Desktop\New folder"`
3. Run: `npm start`

**Expected Result:**

```
✅ See the startup banner with "SERVER STARTED"
✅ See "Server is running on: http://localhost:3000"
✅ Press Ctrl+C doesn't crash it
✅ No error messages
```

**If Failed:**

- [ ] Restart PowerShell
- [ ] Run `npm install` again
- [ ] Check Node.js version: `node --version`

---

## 🔬 Test 2: Frontend Loads

### **Objective**: Verify UI loads and is responsive

**Steps:**

1. Open browser
2. Go to: `http://localhost:3000`
3. Wait for page to load (3-5 seconds)

**Expected Result:**

```
✅ Split-screen layout visible
✅ Local video box on left
✅ Remote video box on right
✅ Chat panel on right side
✅ Keywords input field at top
✅ "Start Chat" button visible
✅ Your camera shows in local video box
✅ No JavaScript errors (F12 → Console)
```

**If Failed:**

- [ ] Check browser console (F12)
- [ ] Refresh page (Ctrl+R)
- [ ] Try different browser
- [ ] Clear browser cache (Ctrl+Shift+Delete)

---

## 🔬 Test 3: Camera/Microphone Access

### **Objective**: Verify camera and microphone permissions

**Steps:**

1. Refresh page: `F5`
2. Browser should ask for permissions
3. Click "Allow" for camera
4. Click "Allow" for microphone
5. Check local video box

**Expected Result:**

```
✅ Permission prompt appears
✅ Camera feed shows in "Your Camera" box
✅ Microphone indicator shows (if browser supports)
✅ Green light or video stream visible
✅ No "Permission Denied" errors
```

**If Failed:**

- [ ] Click browser lock icon → Permissions → Allow
- [ ] Check system settings (Settings → Privacy & Security → Camera/Mic)
- [ ] Restart browser
- [ ] Try different browser

---

## 🔬 Test 4: Single User Search

### **Objective**: Verify search initiates and shows waiting status

**Steps:**

1. Open Tab 1: `http://localhost:3000`
2. Enter keywords: `testing`
3. Click "Start Chat"
4. Watch for 3-5 seconds

**Expected Result:**

```
✅ Status changes to "🔍 Searching..."
✅ Button text changes to "Next"
✅ Chat box shows: "Searching for a stranger..."
✅ Remote video shows spinning loader
✅ Server terminal shows: "[SEARCH] User ... searching"
✅ No errors in browser console
```

**If Failed:**

- [ ] Check server terminal for errors
- [ ] Open browser console (F12 → Console)
- [ ] Verify Socket.io connected: F12 → Network → WS (green)

---

## 🔬 Test 5: Two-User Keyword Match

### **Objective**: Verify keyword-based matching works

**Steps:**

1. Open Tab 1: `http://localhost:3000`
    - Enter: `gaming, coding`
    - Click "Start Chat"
    - Watch it search (don't proceed yet)

2. Open Tab 2: `http://localhost:3000` (new tab in same browser)
    - Enter: `coding, movies`
    - Click "Start Chat"
    - **Should match instantly**

**Expected Result:**

```
✅ Both tabs show "🟢 Connected" status
✅ Both show: "✨ You both like: coding"
✅ Remote video boxes show loading state
✅ Chat panel activated (input enabled)
✅ Server terminal shows:
   - "[KEYWORD MATCH] ... matched with ..."
   - "[ROOM CREATED] Room ... created"
```

**If Failed:**

- [ ] Check server logs for keyword parsing errors
- [ ] Try more obvious common keywords (e.g., "test")
- [ ] Check browser console for Socket.io errors
- [ ] Verify both tabs loaded chat.html

---

## 🔬 Test 6: Random Matching

### **Objective**: Verify fallback to random matching

**Steps:**

1. Open Tab 1: `http://localhost:3000`
    - Leave keywords **empty** (blank)
    - Click "Start Chat"
    - Watch for searching

2. Open Tab 2: `http://localhost:3000`
    - Leave keywords **empty**
    - Click "Start Chat"
    - **Should match**

**Expected Result:**

```
✅ Both tabs connect (no keywords needed)
✅ Status shows "🟢 Connected"
✅ Chat panel activated
✅ No "matched keywords" message
✅ Server terminal shows random match
```

**If Failed:**

- [ ] Check if random waiting pool logic is working
- [ ] Verify Socket.io messages in browser DevTools
- [ ] Check server terminal for room creation logs

---

## 🔬 Test 7: Video Transmission (P2P)

### **Objective**: Verify WebRTC video stream works

**Steps:**

1. Have Tab 1 and Tab 2 matched (from Test 5 or 6)
2. Wave your hand in front of camera on Tab 1
3. Watch Tab 2's remote video box
4. Wave hand on Tab 2, watch Tab 1

**Expected Result:**

```
✅ Video appears in both remote boxes (after 2-3 seconds)
✅ Real-time video feed visible
✅ No delay (P2P direct connection)
✅ Server terminal shows "Received remote stream"
✅ No bandwidth spike at server (traffic is direct)
```

**If Failed:**

- [ ] Wait 3-5 seconds (ICE candidates need time)
- [ ] Check both tabs granted camera permission
- [ ] Check browser console for WebRTC errors
- [ ] Try with different browser (Chrome recommended)
- [ ] Add more STUN servers in `chat.html`

---

## 🔬 Test 8: Text Chat

### **Objective**: Verify text messaging works bidirectionally

**Steps:**

1. Have Tab 1 and Tab 2 matched
2. In Tab 1, type: `Hello from Tab 1!`
3. Press Enter or click Send
4. Check Tab 2 chat box
5. Type in Tab 2: `Hi Tab 1, I can hear you!`
6. Press Enter
7. Check Tab 1 chat box

**Expected Result:**

```
✅ Tab 1 message appears as blue (own) in Tab 1
✅ Tab 1 message appears as gray (stranger) in Tab 2
✅ Tab 2 message appears as gray (stranger) in Tab 1
✅ Tab 2 message appears as blue (own) in Tab 2
✅ Messages update instantly (real-time)
✅ Server terminal shows "[CHAT]" logs
✅ No message loss
```

**If Failed:**

- [ ] Check Socket.io connection (F12 → Network)
- [ ] Verify users are matched (check server logs)
- [ ] Try pressing Shift+Enter (multiline)
- [ ] Check browser console for errors

---

## 🔬 Test 9: Next Button / Disconnect

### **Objective**: Verify disconnect and cleanup works

**Steps:**

1. Have Tab 1 and Tab 2 matched
2. On Tab 1, click "Next"
3. Observe Tab 1 and Tab 2

**Expected Result:**

```
✅ Tab 1 shows: "Stranger disconnected. Click Next to find another..."
✅ Tab 1 remote video goes back to loading
✅ Tab 1 status back to searching (if you clicked Start again)
✅ Tab 2 sees: "Stranger disconnected"
✅ Tab 2 can click Next to search again
✅ Room deleted from server
✅ Server terminal shows cleanup logs
```

**If Failed:**

- [ ] Verify cleanupRoom function is called
- [ ] Check server terminal for disconnect logs
- [ ] Verify Socket.io sends 'stranger-disconnected' event

---

## 🔬 Test 10: Tab Close / Browser Close

### **Objective**: Verify server cleanup on abrupt disconnect

**Steps:**

1. Have Tab 1 and Tab 2 matched
2. **Close Tab 2 entirely** (or close the browser)
3. Observe Tab 1

**Expected Result:**

```
✅ Tab 1 automatically shows: "Stranger disconnected"
✅ Remote video goes back to loading
✅ Tab 1 stays functional (can click Next)
✅ Server terminal shows:
   - "[DISCONNECT] User ... disconnected"
   - "[STATE] Active users: 1, Active rooms: 0"
```

**If Failed:**

- [ ] Check if beforeunload event handler exists
- [ ] Verify Socket.io disconnect listener works
- [ ] Check cleanupUser function

---

## 🔬 Test 11: Concurrent Matches

### **Objective**: Verify server handles multiple simultaneous matches

**Steps:**

1. Open Tab 1: `http://localhost:3000`
    - Keywords: `music`
    - Click Start Chat

2. Open Tab 2: `http://localhost:3000`
    - Keywords: `music`
    - Click Start Chat
    - **Should match with Tab 1**

3. Open Tab 3: `http://localhost:3000`
    - Keywords: `music`
    - Click Start Chat

4. Open Tab 4: `http://localhost:3000`
    - Keywords: `music`
    - Click Start Chat
    - **Should match with Tab 3**

**Expected Result:**

```
✅ Tab 1 + Tab 2 are matched (pair 1)
✅ Tab 3 + Tab 4 are matched (pair 2)
✅ All 4 tabs show connected status
✅ All chat boxes work independently
✅ Video streams work independently
✅ Server terminal shows:
   - Multiple room creations
   - All connections tracked separately
```

**If Failed:**

- [ ] Check server user/room tracking
- [ ] Verify Socket.io room isolation
- [ ] Check for memory leaks (server.js cleanup)

---

## 🔬 Test 12: Server Memory Cleanup

### **Objective**: Verify server doesn't leak memory

**Steps:**

1. Create and destroy 10 matches:
    - Match → Chat briefly → Click Next
    - Repeat 10 times

2. Check server terminal for cleanup logs

3. Monitor server process:
    - Open Task Manager
    - Find Node.js process
    - Check memory usage (should stay relatively stable)

**Expected Result:**

```
✅ Each disconnect shows cleanup logs
✅ Server doesn't crash
✅ Memory usage stays stable (~50-100MB)
✅ No error messages accumulate
✅ Can create new matches after destroying old ones
```

**If Failed:**

- [ ] Check cleanupRoom/cleanupUser functions
- [ ] Look for event listener memory leaks
- [ ] Verify rooms/users objects are being cleared
- [ ] Check browser for memory leaks too

---

## 🔬 Test 13: Server Restart

### **Objective**: Verify server can restart cleanly

**Steps:**

1. Stop server: Press `Ctrl+C` in terminal
2. Verify all browser tabs disconnect
3. Restart server: `npm start`
4. Refresh browser tabs: `F5`
5. Try matching again

**Expected Result:**

```
✅ Server shuts down gracefully
✅ Browser shows disconnected
✅ Server starts without errors
✅ New clients connect successfully
✅ Fresh matching works
✅ Old room references gone
```

**If Failed:**

- [ ] Check for leftover processes: `Get-Process node`
- [ ] Kill process: `Stop-Process -Name node -Force`
- [ ] Check for port conflicts
- [ ] Try different port

---

## 🔬 Test 14: Edge Cases

### **Test 14a: Special Characters in Keywords**

```
Keywords: "gaming!, @#$, game&play"
Expected: Should strip/handle special chars gracefully
```

### **Test 14b: Very Long Keywords**

```
Keywords: "verylongkeywordthathasmorethan100charactersandshouldbetrimmed..."
Expected: Should truncate or handle without crashing
```

### **Test 14c: Empty Spaces**

```
Keywords: "   gaming   ,  coding   "
Expected: Should trim spaces: ["gaming", "coding"]
```

### **Test 14d: Duplicate Keywords**

```
Keywords: "gaming, gaming, gaming"
Expected: Should deduplicate or handle without issues
```

### **Test 14e: Mixed Case**

```
Keywords: "Gaming, CODING, ChESS"
Expected: Should convert to lowercase: ["gaming", "coding", "chess"]
```

---

## 📊 Testing Summary

| Test           | Status | Notes |
| -------------- | ------ | ----- |
| Server Startup | ✅/❌  |       |
| Frontend Load  | ✅/❌  |       |
| Camera Access  | ✅/❌  |       |
| Single User    | ✅/❌  |       |
| Keyword Match  | ✅/❌  |       |
| Random Match   | ✅/❌  |       |
| Video P2P      | ✅/❌  |       |
| Text Chat      | ✅/❌  |       |
| Disconnect     | ✅/❌  |       |
| Tab Close      | ✅/❌  |       |
| Concurrent     | ✅/❌  |       |
| Memory         | ✅/❌  |       |
| Restart        | ✅/❌  |       |
| Edge Cases     | ✅/❌  |       |

---

## 🎉 All Tests Passed?

Great! Your Talkoye is working correctly on localhost.

**Next Steps:**

- Add ad scripts to `chat.html`
- Deploy to cloud (Render, DigitalOcean, AWS, etc.)
- Add content moderation
- Configure production settings
- Set up monitoring

---

## 📞 Test Failed?

1. **Check browser console**: F12 → Console (Ctrl+Shift+K)
2. **Check server terminal**: Look for error messages
3. **Check Network tab**: F12 → Network → WS (WebSocket)
4. **Check browser permissions**: Camera/Microphone allowed?
5. **Try different browser**: Chrome/Firefox/Edge
6. **Restart everything**: Close browser, stop server, start fresh

**All tests should pass before moving to production.**

Good luck! 🚀
