// Check if the user has already verified their age in this session
            window.onload = function () {
                if (sessionStorage.getItem('ageVerified') === 'true') {
                    document.getElementById('ageModal').style.display = 'none';
                }
            };

            function verifyAge(is18Plus) {
                if (is18Plus) {
                    // Save state to sessionStorage so modal doesn't show up on reload during the session
                    sessionStorage.setItem('ageVerified', 'true');
                    document.getElementById('ageModal').style.display = 'none';
                } else {
                    // If the user clicks 'No', attempt to go back in browser history
                    if (
                        navigator.userAgent.match(/MSIE|Internet Explorer/i) ||
                        navigator.userAgent.match(/Trident/i)
                    ) {
                        window.location.href = 'https://www.google.com';
                    } else {
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            // Fallback option if there's no back history
                            window.location.href = 'https://www.google.com';
                        }
                    }
                }
            }

            // --- AGE VERIFICATION LOGIC ---
            window.onload = function () {
                if (sessionStorage.getItem('ageVerified') === 'true') {
                    document.getElementById('ageModal').style.display = 'none';
                }
            };

            function verifyAge(is18Plus) {
                if (is18Plus) {
                    sessionStorage.setItem('ageVerified', 'true');
                    document.getElementById('ageModal').style.display = 'none';
                } else {
                    if (
                        navigator.userAgent.match(/MSIE|Internet Explorer/i) ||
                        navigator.userAgent.match(/Trident/i)
                    ) {
                        window.location.href = 'https://www.google.com';
                    } else {
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            window.location.href = 'https://www.google.com';
                        }
                    }
                }
            }

            // --- REAL ONLINE COUNT SOCKET CONNECTION ---
            document.addEventListener('DOMContentLoaded', () => {
                try {
                    // Aapke server se connection establish karein (sirf simple text polling/websocket data ke liye)
                    const socket = io({ transports: ['websocket', 'polling'] });

                    const onlineCountSpan = document.querySelector('.stats span');

                    // Jaise hi server 'online-count' emit karega, yeh use live update kar dega
                    socket.on('online-count', (data) => {
                        if (data && typeof data.count !== 'undefined') {
                            // Number ko comma formatting (e.g., 3,482) ke sath display karega
                            onlineCountSpan.innerText = `${Number(data.count).toLocaleString()} `;
                        }
                    });

                    // Error handle karne ke liye taaki fallback value dikhti rahe
                    socket.on('connect_error', () => {
                        console.log('Socket connection issue on home page. Retrying...');
                    });
                } catch (error) {
                    console.error('Socket initialize karne me error:', error);
                }
            });