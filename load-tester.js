const { io } = require("socket.io-client");

// Kitne fake users ek sath bhejne hain (Pehle 100 se start karte hain)
const TOTAL_CLIENTS = 100; 
const SERVER_URL = "http://localhost:3000";

let connectedCount = 0;
let matchCount = 0;

console.log(`🚀 Talkoye Load Tester Started! Sending ${TOTAL_CLIENTS} fake users...`);

for (let i = 1; i <= TOTAL_CLIENTS; i++) {
    // Ek sath saare users nahi bhejenge, har 50 millisecond mein ek user connect karenge
    setTimeout(() => {
        const socket = io(SERVER_URL, { 
            // 🚀 FIX: PM2 cluster mein polling fail hoti hai, isliye strictly websocket use karenge
            transports: ["websocket"] 
        });
        
        // 🚀 NAYA: Agar koi error aayi toh terminal mein dikhega
        socket.on("connect_error", (err) => {
            console.log(`❌ Connection Error:`, err.message);
        });

        socket.on("connect", () => {
            connectedCount++;
            console.log(`🟢 User ${i} connected. (Total Online: ${connectedCount})`);

            // Connect hote hi 'search' button daba dega
            socket.emit("search", {
                keywords: [],
                myGender: "Male",
                myCountry: "IN",
                prefGender: "Both",
                prefCountry: "ALL"
            });
        });

        socket.on("matched", (data) => {
            matchCount++;
            console.log(`🎉 User ${i} matched! (Total Matches: ${matchCount})`);
            
            // Match hone ke 5 second baad chat se bahar nikal jayega (taaki server par load badle)
            setTimeout(() => {
                socket.emit('leave-chat', { roomId: data.roomId, partnerId: data.partnerId });
                socket.disconnect();
            }, 5000);
        });

        socket.on("disconnect", () => {
            connectedCount--;
        });

    }, i * 250); // Har connection ke beech 50ms ka gap
}