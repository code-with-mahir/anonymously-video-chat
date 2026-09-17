const state = {
    socket: null,
    peerConnection: null,
    localStream: null,
    roomId: null,
    partnerId: null,
    isConnected: false,
    isSearching: false,
    keywords: [],
    pendingIceCandidates: [],
};

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');
const keywordInput = document.getElementById('keywordInput');
const addKeywordBtn = document.getElementById('addKeywordBtn');
const keywordTagsContainer = document.getElementById('keywordTagsContainer');
const onlineCountEl = document.getElementById('onlineCount');
const statusEl = document.getElementById('statusText');
const waitingMessage = document.getElementById('waitingMessage');

function log(msg, data = null) {
    console.log(`[${new Date().toLocaleTimeString()}] 🚀 ${msg}`, data || '');
}

function setStatus(type) {
    statusEl.className = 'status-text';
    if (type === 'idle') {
        statusEl.textContent = 'Disconnected';
        statusEl.classList.add('status-idle');
    } else if (type === 'searching') {
        statusEl.textContent = 'Searching...';
        statusEl.classList.add('status-searching');
    } else if (type === 'connected') {
        statusEl.textContent = 'Connected!';
        statusEl.classList.add('status-connected');
    }
}

function setChatEnabled(enabled) {
    messageInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
    // ❌ Auto-focus hata diya taaki mobile mein automatic keyboard na khule
    // if (enabled) messageInput.focus();
}

// 🛑 NAYA FUNCTION: Disconnect ko handle karne ke liye
function handleStrangerDisconnect() {
    // Agar pehle se disconnected hai, toh dobara run na kare (Double Search se bachane ke liye)
    if (!state.isConnected) return;

    addChatMessage('🔴 Stranger has disconnected. Finding a new match...', false, true);

    // Peer Connection Close karein
    if (state.peerConnection) {
        state.peerConnection.close();
        state.peerConnection = null;
    }

    state.isConnected = false;
    state.isSearching = true;
    state.roomId = null;
    state.partnerId = null;
    state.pendingIceCandidates = [];

    // 👇 Yahi line video ko atakne se rokti hai aur screen black karti hai
    remoteVideo.srcObject = null;
    setChatEnabled(false);

    waitingMessage.style.display = 'flex';
    waitingMessage.textContent = 'Looking for someone...';
    startBtn.textContent = 'Searching...';
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setStatus('searching');

    // Safe variables taaki koi error na aaye
    const prefGenderEl = document.getElementById('prefGender');
    const prefCountryEl = document.getElementById('prefCountry');

    const searchData = {
        keywords: state.keywords,
        myGender: localStorage.getItem('myGender') || 'Male',
        myCountry: localStorage.getItem('myCountry') || 'ALL',
        prefGender: prefGenderEl ? prefGenderEl.value : 'Both',
        prefCountry: prefCountryEl ? prefCountryEl.value : 'ALL',
    };

    // Auto-Next (Search) trigger karein
    state.socket.emit('search', searchData);
}

function clearChat() {
    chatMessages.innerHTML = '';
}

function addChatMessage(text, isSender = false, isSystem = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    if (isSystem) {
        msgDiv.classList.add('system');
        msgDiv.textContent = text;
    } else {
        msgDiv.classList.add(isSender ? 'sender' : 'receiver');
        msgDiv.textContent = (isSender ? 'You: ' : 'Stranger: ') + text;
    }
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 🚀 NAYA: Premium UI Alert (Toast Notification) function
function showCustomAlert(message) {
    // Agar pehle se koi alert screen par hai, toh usko hata do
    let existingAlert = document.getElementById('customToastAlert');
    if (existingAlert) existingAlert.remove();

    // Naya alert div banao
    const alertDiv = document.createElement('div');
    alertDiv.id = 'customToastAlert';
    alertDiv.className = 'custom-toast-alert';
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    // Alert ko smoothly screen par lao
    setTimeout(() => alertDiv.classList.add('show'), 10);

    // 3 second baad alert ko khud gayab kardo
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Updated Keyword Tag Function
function addKeywordTag(text) {
    // Browser alert ki jagah apna naya premium alert use karein
    if (state.keywords.length >= 5) {
        showCustomAlert('You can only add up to 5 interests.');
        keywordInput.value = '';
        return;
    }

    const cleanText = text.trim().toLowerCase();
    if (!cleanText || state.keywords.includes(cleanText)) return;

    state.keywords.push(cleanText);

    const tag = document.createElement('div');
    tag.className = 'keyword-tag';
    tag.innerHTML = `<span>${cleanText}</span><button type="button">&times;</button>`;

    tag.querySelector('button').addEventListener('click', () => {
        state.keywords = state.keywords.filter((k) => k !== cleanText);
        tag.remove();

        // 🚀 NAYA LOGIC: Agar saare tags delete ho gaye, toh placeholder wapas le aao
        if (state.keywords.length === 0) {
            keywordInput.placeholder = 'Add interest (e.g., music)';
        }
    });

    keywordTagsContainer.appendChild(tag);
    keywordInput.value = '';

    // 🚀 NAYA LOGIC: Jaise hi pehla tag add ho, placeholder completely hata do
    if (state.keywords.length > 0) {
        keywordInput.placeholder = '';
    }
}

addKeywordBtn.addEventListener('click', () => addKeywordTag(keywordInput.value));
keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addKeywordTag(keywordInput.value);
});

async function initializeLocalMedia() {
    try {
        // 🚀 HIGH QUALITY CONFIG: Video ko HD karne aur audio clear karne ke liye constraints
        const highQualityConstraints = {
            video: {
                width: { ideal: 1280, min: 640 }, // 720p HD target resolution
                height: { ideal: 720, min: 480 },
                frameRate: { ideal: 30, max: 60 }, // 30 FPS smooth video ke liye
                facingMode: 'user', // Mobile par samne ka camera prefer karega
            },
            audio: {
                echoCancellation: true, // Seeti jaisi aawaz (echo) filter karega
                noiseSuppression: true, // Background ka shor/fan ki aawaz kam karega
                autoGainControl: true, // Aawaz ko automatic ek barabar clear rakhega
            },
        };

        state.localStream = await navigator.mediaDevices.getUserMedia(highQualityConstraints);
        localVideo.srcObject = state.localStream;
        log('Local hardware media components bound with HD config.');
    } catch (error) {
        log('Media hardware activation failed:', error);
        alert('Please allow camera/mic access to use the application.');
    }
}

function createPeerConnection() {
    if (state.peerConnection) {
        state.peerConnection.close();
        state.peerConnection = null;
    }

    state.pendingIceCandidates = [];
    state.peerConnection = new RTCPeerConnection(rtcConfig);

    // 🚀 NAYA: Chrome/Modern Browsers ke liye Connection State monitor
    state.peerConnection.onconnectionstatechange = () => {
        if (state.peerConnection) {
            const cs = state.peerConnection.connectionState;
            console.log('[WebRTC] Connection State changed to:', cs);
            if (cs === 'disconnected' || cs === 'failed' || cs === 'closed') {
                if (typeof handleStrangerDisconnect === 'function') {
                    handleStrangerDisconnect();
                } else if (typeof processStrangerDisconnect === 'function') {
                    processStrangerDisconnect();
                }
            }
        }
    };

    // 🚀 NAYA LOGIC: Native WebRTC State Monitor (Video atakne ka permanent solution)
    state.peerConnection.oniceconnectionstatechange = () => {
        if (state.peerConnection) {
            const iceState = state.peerConnection.iceConnectionState;
            // Agar connection fail, disconnect ya close ho jaye toh turant autoNext karo
            if (iceState === 'disconnected' || iceState === 'failed' || iceState === 'closed') {
                console.log('[WebRTC] Connection lost natively. Triggering disconnect.');
                handleStrangerDisconnect();
            }
        }
    };
    // -------------------------------------------------------------------

    if (state.localStream) {
        state.localStream.getTracks().forEach((track) => {
            state.peerConnection.addTrack(track, state.localStream);
        });
    }

    state.peerConnection.onicecandidate = (event) => {
        if (event.candidate && state.roomId) {
            state.socket.emit('ice-candidate', {
                candidate: event.candidate,
                roomId: state.roomId,
            });
        }
    };

    state.peerConnection.ontrack = (event) => {
        log('Remote media track received successfully.');
        if (event.streams && event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
            waitingMessage.style.display = 'none';
        }
    };
}

async function applyPendingIceCandidates() {
    if (!state.peerConnection || !state.peerConnection.remoteDescription) return;
    while (state.pendingIceCandidates.length > 0) {
        const candidate = state.pendingIceCandidates.shift();
        try {
            await state.peerConnection.addIceCandidate(candidate);
        } catch (e) {
            log('Ice buffering error:', e);
        }
    }
}

function initializeSocket() {
    state.socket = io({ transports: ['websocket', 'polling'] });

    state.socket.on('connect', () => {
        setStatus('idle');
    });
    state.socket.on('online-count', (data) => {
        onlineCountEl.textContent = data.count || 0;
    });

    state.socket.on('searching', () => {
        state.isSearching = true;
        setStatus('searching');
        startBtn.textContent = 'Searching...';
        startBtn.disabled = true;
        stopBtn.disabled = false;

        setTimeout(() => {
            clearChat();
        }, 3000);
    });

    state.socket.on('matched', (data) => {
        state.roomId = data.roomId;
        state.partnerId = data.partnerId;
        state.isSearching = false;
        state.isConnected = true;

        clearChat();

        if (data.commonKeywords && data.commonKeywords.length > 0) {
            const matchText = data.commonKeywords.join(', ');
            addChatMessage(`✨ You both like: ${matchText}`, false, true);
        }
        startBtn.textContent = 'Next';
        startBtn.disabled = false;
        stopBtn.disabled = false;
        setStatus('connected');

        remoteVideo.srcObject = null;
        waitingMessage.style.display = 'flex';
        waitingMessage.textContent = 'Connecting video streams...';

        createPeerConnection();

        if (data.isInitiator) {
            log('Acting as Initiator. Generating offer packet.');
            setTimeout(async () => {
                try {
                    const offer = await state.peerConnection.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                    });
                    await state.peerConnection.setLocalDescription(offer);
                    state.socket.emit('offer', { offer, roomId: state.roomId });
                } catch (e) {
                    log('Offer crash:', e);
                }
            }, 500);
        }
        setChatEnabled(true);
    });

    state.socket.on('offer', async (data) => {
        try {
            if (!state.peerConnection) createPeerConnection();
            await state.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            await applyPendingIceCandidates();

            const answer = await state.peerConnection.createAnswer();
            await state.peerConnection.setLocalDescription(answer);
            state.socket.emit('answer', { answer, roomId: state.roomId });
        } catch (e) {
            log('Error processing offer packet:', e);
        }
    });

    state.socket.on('answer', async (data) => {
        try {
            if (state.peerConnection) {
                await state.peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.answer),
                );
                await applyPendingIceCandidates();
            }
        } catch (e) {
            log('Error processing answer packet:', e);
        }
    });

    state.socket.on('ice-candidate', async (data) => {
        const candidate = new RTCIceCandidate(data.candidate);
        if (state.peerConnection && state.peerConnection.remoteDescription) {
            try {
                await state.peerConnection.addIceCandidate(candidate);
            } catch (e) {}
        } else {
            state.pendingIceCandidates.push(candidate);
        }
    });

    state.socket.on('chat-message', (data) => {
        addChatMessage(data.message, false);
    });

    state.socket.on('stranger-disconnected', () => {
        handleStrangerDisconnect();
    });

    state.socket.on('disconnect', () => {
        resetSessionState();
    });
}

function resetSessionState() {
    state.isConnected = false;
    state.isSearching = false;
    state.roomId = null;
    state.partnerId = null;
    state.pendingIceCandidates = [];
    if (state.peerConnection) {
        state.peerConnection.close();
        state.peerConnection = null;
    }
    remoteVideo.srcObject = null;
    waitingMessage.style.display = 'flex';
    waitingMessage.textContent = 'Click "Start Chat" to find a match';
    startBtn.textContent = 'Start Chat';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setChatEnabled(false);
    setStatus('idle');
}

startBtn.addEventListener('click', () => {
    if (!state.localStream) {
        alert('Camera/Mic access is required to chat.');
        return;
    }

    // 🚀 ADs SMART TAB-UNDER & CLICK LIMIT LOGIC
    try {
        const buttonText = startBtn.textContent.trim();
        const today = new Date().toISOString().split('T')[0];
        const savedDate = localStorage.getItem('pop_date');

        // Naya din shuru hone par reset karein
        if (savedDate !== today) {
            localStorage.setItem('pop_date', today);
            localStorage.setItem('pop_click_count', '0');
            localStorage.setItem('pop_ad_shown_today', '0');
        }

        // Check karein ki user 'Next' button dabaya hai aur aaj ki 20 ads ki limit bachi hai ya nahi
        let adsShownToday = parseInt(localStorage.getItem('pop_ad_shown_today') || '0', 20);

        if (buttonText === 'Next' && adsShownToday < 20) {
            let currentClicks = parseInt(localStorage.getItem('pop_click_count') || '0', 20);
            currentClicks++;

            console.log(`Next Clicks: ${currentClicks}/20 | Total Ads Today: ${adsShownToday}/20`);

            if (currentClicks >= 20) {
                // 🎉 10 Clicks pure ho gaye! Ab Tab-Under trigger karein
                localStorage.setItem('pop_click_count', '0');
                localStorage.setItem('pop_ad_shown_today', (adsShownToday + 1).toString());

                // ⚠️ APNA ADSTERRA DIRECT LINK YAHAN DALO
                const adUrl = 'https://www.profitableratecpmnetwork.com/m894pmhkr3?key=990bc4ec360831bfb05a487f598975ae';

                // 1. Current website ka poora state/URL lo
                const currentUrl = window.location.href;

                // 2. Ek naya tab kholo jisme user ki chat window chalegi (taaki user active rahe)
                const newChatTab = window.open(currentUrl, '_blank');

                if (newChatTab) {
                    // 3. Purane chal rahe tab ka URL badal kar ad link bana do (Pichhe background mein)
                    window.location.replace(adUrl);

                    // 4. Naye chat tab par focus shift kar do taaki user bina ruke chat kare
                    newChatTab.focus();
                    return; // Is trigger par execution yahin stop hoga kyunki naye tab mein fresh session khul chuka hai
                }
            } else {
                localStorage.setItem('pop_click_count', currentClicks.toString());
            }
        }
    } catch (e) {
        console.log('Adsterra premium load failed safely:', e);
    }

    // 🚀 FIXED: "Next" no longer fires 'search' directly on top of a still-active
    // room. It now mirrors the Stop→Start flow: tear down the local peer
    // connection/UI state immediately, tell the server we're leaving the current
    // room (so the partner gets notified promptly), and only THEN search again.
    // This removes the client-side half of the race that used to leave the
    // partner's re-search overlapping with our own cleanup.
    const wasInRoomOrPartnered = !!(state.roomId || state.partnerId);
    const currentRoom = state.roomId;
    const currentPartner = state.partnerId;

    function beginSearch() {
        if (state.peerConnection) {
            state.peerConnection.close();
            state.peerConnection = null;
        }
        state.isConnected = false;
        state.isSearching = true;
        state.roomId = null;
        state.partnerId = null;
        state.pendingIceCandidates = [];

        remoteVideo.srcObject = null;
        setChatEnabled(false);
        clearChat();

        waitingMessage.style.display = 'flex';
        waitingMessage.textContent = 'Looking for someone...';
        startBtn.textContent = 'Searching...';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        setStatus('searching');

        const searchData = {
            keywords: state.keywords,
            myGender: localStorage.getItem('myGender') || 'Male',
            myCountry: localStorage.getItem('myCountry') || 'ALL',
            prefGender: document.getElementById('prefGender').value,
            prefCountry: document.getElementById('prefCountry').value,
        };
        state.socket.emit('search', searchData);
    }

    if (wasInRoomOrPartnered) {
        state.socket.emit(
            'leave-chat',
            { roomId: currentRoom, partnerId: currentPartner },
            (ack) => {
                console.log('✅ [DEBUG] Server acknowledged leave-chat before Next:', ack);
                beginSearch();
            },
        );
    } else {
        beginSearch();
    }
});

stopBtn.addEventListener('click', () => {
    const currentRoom = state.roomId;
    const currentPartner = state.partnerId;

    if (state.socket && (currentRoom || currentPartner)) {
        // 🚀 NAYA: Ack callback ke sath emit kar rahe hain
        state.socket.emit('leave-chat', {
            roomId: currentRoom, 
            partnerId: currentPartner
        }, (ack) => {
            console.log('✅ [DEBUG] Server acknowledged leave-chat:', ack);
        });
    }

    resetSessionState();
    addChatMessage('⚠️ You have disconnected.', false, true);
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !state.isConnected) return;
    state.socket.emit('chat-message', text);
    addChatMessage(text, true);
    messageInput.value = '';
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

document.addEventListener('DOMContentLoaded', async () => {
    // MODAL FUNCTION: Gender Save Karne ke liye
    window.saveMyGender = function (gender) {
        localStorage.setItem('myGender', gender);
        document.getElementById('genderModal').classList.remove('show');
    };

    // --- NEW: Custom Gender Dropdown Logic ---
    function initGenderDropdown() {
        const genderSelect = document.getElementById('customGenderSelect');
        if (!genderSelect) return; // Agar HTML mein ID nahi hai toh error na de

        const optionsList = genderSelect.querySelector('.custom-gender-options');
        const triggerContent = document.getElementById('selectedGenderContent');
        const hiddenInput = document.getElementById('prefGender');

        // Dropdown open/close
        genderSelect.addEventListener('click', (e) => {
            optionsList.classList.toggle('show');
            e.stopPropagation();
        });

        // Jab kisi option par click ho
        const options = genderSelect.querySelectorAll('.custom-gender-option');
        options.forEach((option) => {
            option.addEventListener('click', (e) => {
                const val = option.getAttribute('data-value');
                const html = option.innerHTML;

                // Hidden input ki value change karein (Backend JS ke liye)
                hiddenInput.value = val;

                // UI trigger ka text/SVG change karein
                triggerContent.innerHTML = html;
                triggerContent.style.display = 'flex';
                triggerContent.style.alignItems = 'center';
                triggerContent.style.gap = '8px';

                optionsList.classList.remove('show');
                e.stopPropagation();
            });
        });

        // Agar kahin bahar click ho toh band karein
        document.addEventListener('click', (e) => {
            if (!genderSelect.contains(e.target)) {
                optionsList.classList.remove('show');
            }
        });
    }
    // ----------------------------------------

    async function initUserPreferences() {
        // 🚀 NEW: Search variables ko function ke top par define kiya taaki har jagah access ho sake
        let typingTimer;
        let searchKeyword = '';

        // 1. Gender Check
        if (!localStorage.getItem('myGender')) {
            document.getElementById('genderModal').classList.add('show');
        }

        // 2. IP-based Country Fetch
        if (!localStorage.getItem('myCountry')) {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                localStorage.setItem('myCountry', data.country_code || 'ALL');
            } catch (e) {
                console.log('Ad blocker blocked IP fetch, setting to ALL');
                localStorage.setItem('myCountry', 'ALL');
            }
        }

        // 3. Populate Custom Country Dropdown with FlagsAPI
        const optionsContainer = document.getElementById('countryOptionsList');
        const triggerContent = document.getElementById('selectedCountryContent');
        const hiddenInput = document.getElementById('prefCountry');
        const selectWrapper = document.getElementById('customCountrySelect');

        const savedCountry = localStorage.getItem('myCountry') || 'ALL';

        // Helper function flag image banane ke liye
        function getFlagImgHTML(code) {
            if (code === 'ALL') return '🌍';
            return `<img src="https://flagsapi.com/${code}/flat/24.png" alt="${code}" style="width:24px; height:24px; margin-right:8px; vertical-align:middle;">`;
        }

        // Agar purane options hain toh clear karein
        if (optionsContainer) optionsContainer.innerHTML = '';

        // --- Hamesha top par "All Countries" add karein ---
        if (optionsContainer) {
            const allOptionDiv = document.createElement('div');
            allOptionDiv.className = 'custom-option';
            allOptionDiv.dataset.value = 'ALL';

            allOptionDiv.innerHTML = `${getFlagImgHTML('ALL')} <span>&nbsp;&nbsp;&nbsp;All Countries</span>`;

            allOptionDiv.addEventListener('click', function (e) {
                hiddenInput.value = 'ALL';
                triggerContent.innerHTML = `${getFlagImgHTML('ALL')} <span>&nbsp;&nbsp;&nbsp;All Countries</span>`;
                localStorage.setItem('myCountry', 'ALL');

                optionsContainer.classList.remove('open');
                e.stopPropagation();
            });

            optionsContainer.appendChild(allOptionDiv);
        }
        // -------------------------------------------------------------

        if (typeof countryList !== 'undefined') {
            countryList.forEach((c) => {
                if (c.code === 'ALL') return;

                const optionDiv = document.createElement('div');
                optionDiv.className = 'custom-option';
                optionDiv.dataset.value = c.code;

                optionDiv.innerHTML = `${getFlagImgHTML(c.code)} <span>${c.name}</span>`;

                // Jab user kisi country par click kare
                optionDiv.addEventListener('click', function (e) {
                    hiddenInput.value = c.code;
                    triggerContent.innerHTML = `${getFlagImgHTML(c.code)} <span>${c.name}</span>`;
                    localStorage.setItem('myCountry', c.code);

                    optionsContainer.classList.remove('open');
                    e.stopPropagation();
                });

                if (optionsContainer) optionsContainer.appendChild(optionDiv);

                if (c.code === savedCountry && triggerContent) {
                    hiddenInput.value = c.code;
                    triggerContent.innerHTML = `${getFlagImgHTML(c.code)} <span>${c.name}</span>`;
                }
            });

            if (savedCountry === 'ALL' && triggerContent) {
                hiddenInput.value = 'ALL';
                triggerContent.innerHTML = `${getFlagImgHTML('ALL')} <span>&nbsp;&nbsp;&nbsp;All Countries</span>`;
            }
        }

        // Dropdown kholne/band karne ka logic
        if (selectWrapper) {
            const trigger = selectWrapper.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.addEventListener('click', function (e) {
                    optionsContainer.classList.toggle('open');

                    // 🚀 FIXED: Jab bhi list open ho, purani typing memory aur color reset kar do
                    if (optionsContainer.classList.contains('open')) {
                        optionsContainer.scrollTop = 0;
                        searchKeyword = ''; // Purani search clear

                        // Purana highlight color hata do
                        const allOptions = optionsContainer.querySelectorAll('.custom-option');
                        allOptions.forEach((opt) => (opt.style.backgroundColor = ''));
                    }

                    e.stopPropagation();
                });
            }
        }

        // Type karke dhundhne (Search & Scroll) ka logic
        document.addEventListener('keydown', function (e) {
            if (!optionsContainer || !optionsContainer.classList.contains('open')) return;
            if (e.key.length !== 1) return;

            searchKeyword += e.key.toLowerCase();

            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                searchKeyword = '';
            }, 1000);

            const allOptions = optionsContainer.querySelectorAll('.custom-option');
            for (let option of allOptions) {
                const countrySpan = option.querySelector('span');
                if (countrySpan) {
                    const countryName = countrySpan.textContent.trim().toLowerCase();

                    if (countryName.startsWith(searchKeyword)) {
                        option.scrollIntoView({ behavior: 'auto', block: 'nearest' });

                        allOptions.forEach((opt) => (opt.style.backgroundColor = ''));
                        option.style.backgroundColor = '#bbe0ff';
                        break;
                    }
                }
            }
        });

        // Agar screen par kahin aur click ho, toh dropdown band ho jaye
        document.addEventListener('click', function (e) {
            if (selectWrapper && !selectWrapper.contains(e.target)) {
                if (optionsContainer) {
                    optionsContainer.classList.remove('open');
                    searchKeyword = ''; // Bahar click hone par bhi clear karein
                }
            }
        });
    }

    // ⬇️ UPDATE YOUR EXISTING DOMContentLoaded EVENT ⬇️
    initGenderDropdown(); // 👈 Naya Gender Dropdown Initialize karein
    initUserPreferences();
    await initializeLocalMedia();
    initializeSocket();
    addChatMessage(
        'Welcome to talkoye.com! Add your interests and click "Start Chat".',
        false,
        true,
    );
});

/**
 * ============================================================================
 * ADS JS
 * ============================================================================
 */

function refreshAdsterraBanner() {
    const isMobile = window.innerWidth <= 950;

    const middleAdKey = isMobile
        ? '57426ec9b989ed963c561d8dd44b3de9'
        : '0aec7916c0e345d42bce96f49b467477';
    const middleWidth = isMobile ? 320 : 468;
    const middleHeight = isMobile ? 50 : 60;

    const adsConfig = [
        {
            parentId: 'adsterra-banner-container',
            key: middleAdKey,
            w: middleWidth,
            h: middleHeight,
        },
        {
            parentId: 'adsterra-left-banner',
            key: '57426ec9b989ed963c561d8dd44b3de9',
            w: 320,
            h: 50,
        },
        {
            parentId: 'adsterra-right-banner',
            key: '57426ec9b989ed963c561d8dd44b3de9',
            w: 320,
            h: 50,
        },
    ];

    adsConfig.forEach((ad) => {
        const parent = document.getElementById(ad.parentId);
        if (!parent) return;

        if (window.getComputedStyle(parent).display === 'none') return;

        parent.innerHTML = '';

        // 🟢 IFRAME RAKHNA HAI (Layout locked rahega, CSS nahi hilegi)
        const iframe = document.createElement('iframe');
        iframe.width = ad.w;
        iframe.height = ad.h;
        iframe.scrolling = 'no';
        iframe.frameBorder = '0';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';

        // ✨ THE ULTIMATE BYPASS USING SRCDOC:
        // document.write ya dynamic appends ko desktop browser block kar rahe hain.
        // srcdoc se poora HTML structure iframe ke initialization ke sath hi lock ho jata hai.
        // Isse desktop browser ise cross-origin restriction nahi bol pata aur 403 bypass ho jata hai.
        const iframeContent = `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    html, body { margin: 0; padding: 0; overflow: hidden; background: transparent; width: 100%; height: 100%; }
                </style>
            </head>
            <body>
                <script type="text/javascript">
                    var atOptions = {
                        'key' : '${ad.key}',
                        'format' : 'iframe',
                        'height' : ${ad.h},
                        'width' : ${ad.w},
                        'params' : {}
                    };
                <\/script>
                <script type="text/javascript" src="https://www.highperformanceformat.com/${ad.key}/invoke.js"><\/script>
            </body>
            </html>`;

        iframe.srcdoc = iframeContent;

        parent.appendChild(iframe);
    });

    console.log(`[${new Date().toLocaleTimeString()}] 💸 Standard layout protected ads refreshed.`);
}

// Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshAdsterraBanner);
} else {
    refreshAdsterraBanner();
}

clearInterval(window.adInterval);
window.adInterval = setInterval(refreshAdsterraBanner, 30000);