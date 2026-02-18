(function () {
    console.log("Chatbot Widget Loading (Premium v3)...");

    const config = window.ChatbotConfig;
    if (!config) {
        console.error("ChatbotConfig not found!");
        return;
    }

    // 1. Inject CSS (Modern Messenger Style)
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --primary-color: #4F46E5; /* Indigo-600 */
            --primary-gradient: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            --secondary-color: #F3F4F6;
            --text-color: #1F2937;
            --bot-bubble-bg: #F3F4F6;
            --user-bubble-bg: #4F46E5;
            --font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        /* Float Button */
        .sb-widget-button {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            background: var(--primary-gradient);
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
            cursor: pointer;
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .sb-widget-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
        }
        .sb-widget-icon {
            width: 28px;
            height: 28px;
            fill: white;
            transition: transform 0.3s;
        }
        
        /* Chat Window */
        .sb-chat-window {
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 380px;
            height: 650px;
            max-height: 80vh;
            background-color: #fff;
            border-radius: 20px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.12);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: var(--font-family);
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .sb-chat-window.active {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: all;
        }

        /* Full Screen Text Mode */
        .sb-chat-window.full-screen {
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            bottom: 0;
            right: 0;
            border-radius: 0;
        }
        
        /* Header */
        .sb-header {
            background: #fff;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #F3F4F6;
        }
        .sb-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .sb-header-avatar {
            width: 36px;
            height: 36px;
            background: var(--primary-gradient);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: white;
        }
        .sb-header-text {
            display: flex;
            flex-direction: column;
        }
        .sb-header-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-color);
        }
        .sb-header-status {
            font-size: 12px;
            color: #10B981; /* Green */
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .sb-header-status::before {
            content: '';
            display: block;
            width: 6px;
            height: 6px;
            background: #10B981;
            border-radius: 50%;
        }

        /* Window Controls */
        .sb-controls {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .sb-control-btn {
            background: transparent;
            border: none;
            color: #6B7280;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .sb-control-btn:hover {
            background: #F3F4F6;
            color: #111827;
        }
        .sb-control-icon {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }

        /* Messages Area */
        .sb-messages {
            flex: 1;
            padding: 20px;
            background-color: #fff;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* Message Bubbles */
        .sb-message-group {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            max-width: 85%;
        }
        
        .sb-message-group.bot {
            align-self: flex-start;
        }
        .sb-message-group.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }

        .sb-avatar-small {
            width: 28px;
            height: 28px;
            background: var(--primary-gradient);
            border-radius: 50%;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: white;
            margin-bottom: 4px;
        }

        .sb-bubble {
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.5;
            position: relative;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .sb-message-group.bot .sb-bubble {
            background-color: var(--bot-bubble-bg);
            color: var(--text-color);
            border-bottom-left-radius: 4px;
        }

        .sb-message-group.user .sb-bubble {
            background: var(--primary-gradient);
            color: white;
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }

        /* Input Area (Floating Pill) */
        .sb-input-container {
            padding: 16px 20px;
            background: white;
            border-top: 1px solid transparent; /* Removed border specifically */
        }
        .sb-input-wrapper {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 28px;
            padding: 4px 8px 4px 16px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.02);
            transition: all 0.2s;
        }
        .sb-input-wrapper:focus-within {
            border-color: var(--primary-color);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
            background: white;
        }
        .sb-input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 12px 0;
            outline: none;
            font-size: 14px;
            color: var(--text-color);
        }
        .sb-send-btn {
            width: 36px;
            height: 36px;
            background: var(--primary-gradient);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .sb-send-btn:hover {
            transform: scale(1.05);
        }
        .sb-send-icon {
            width: 16px;
            height: 16px;
            fill: white;
            margin-left: 2px;
        }

        /* Agent Button */
        .sb-agent-pill {
            margin: 0 auto 10px auto;
            background: #EEF2FF;
            color: #4F46E5;
            border: 1px solid #E0E7FF;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            display: block;
            width: fit-content;
        }
        .sb-agent-pill:hover {
            background: #E0E7FF;
        }
        .sb-agent-pill:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Status Banner */
        .sb-status-banner {
            font-size: 12px;
            padding: 8px;
            text-align: center;
            font-weight: 500;
        }
        .sb-status-banner.waiting { background: #FFFBEB; color: #B45309; }
        .sb-status-banner.live { background: #ECFDF5; color: #047857; }
        .sb-status-banner.busy { background: #FEF2F2; color: #B91C1C; }
        .sb-status-banner.blocked { background: #FEF2F2; color: #B91C1C; font-weight: bold; }

        /* Animations */
        @keyframes sb-pop-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .sb-anim-pop { animation: sb-pop-in 0.3s ease-out; }
        
        .sb-typing { display: flex; gap: 4px; padding: 4px; }
        .sb-dot { width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%; animation: bounce 1.4s infinite; }
        .sb-dot:nth-child(2) { animation-delay: 0.2s; }
        .sb-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    `;
    document.head.appendChild(style);

    // 2. Chat Button
    const button = document.createElement('div');
    button.className = 'sb-widget-button';
    button.innerHTML = `
        <svg class="sb-widget-icon" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
    `;
    document.body.appendChild(button);

    // 3. Chat Window (Redesigned)
    const windowDiv = document.createElement('div');
    windowDiv.className = 'sb-chat-window';
    windowDiv.innerHTML = `
        <div class="sb-header">
            <div class="sb-header-info">
                <div class="sb-header-avatar">🤖</div>
                <div class="sb-header-text">
                    <div class="sb-header-title">Assistant</div>
                    <div class="sb-header-status">Online</div>
                </div>
            </div>
            <div class="sb-controls">
                <button class="sb-control-btn" id="sb-minimize" title="Minimize">
                    <svg class="sb-control-icon" viewBox="0 0 24 24"><path d="M6 11h12v2H6z"/></svg>
                </button>
                <button class="sb-control-btn" id="sb-maximize" title="Maximize">
                    <svg class="sb-control-icon" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zm2 2v12h12V6H6z"/></svg>
                </button>
                <button class="sb-control-btn" id="sb-close" title="Close">
                   <svg class="sb-control-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        </div>
        
        <div id="sb-status-banner" style="display: none;"></div>
        
        <div class="sb-messages" id="sb-messages">
            <!-- Messages go here -->
            <div class="sb-message-group bot sb-anim-pop">
                <div class="sb-avatar-small">🤖</div>
                <div class="sb-bubble">Hello! 👋 How can I help you today?</div>
            </div>
        </div>

        <div style="text-align: center; padding: 0 20px;">
             <button class="sb-agent-pill" id="sb-agent-btn">Speak to Human Agent</button>
        </div>

        <div class="sb-input-container">
            <div class="sb-input-wrapper">
                <input type="text" class="sb-input" placeholder="Type a message..." />
                <button class="sb-send-btn">
                    <svg class="sb-send-icon" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(windowDiv);

    // 4. Logic & Features
    let isOpen = false;
    let isMaximized = false;

    // Elements
    const input = windowDiv.querySelector('input');
    const messagesDiv = windowDiv.querySelector('#sb-messages');
    const agentBtn = windowDiv.querySelector('#sb-agent-btn');
    const statusBanner = windowDiv.querySelector('#sb-status-banner');
    const btnMinimize = windowDiv.querySelector('#sb-minimize');
    const btnMaximize = windowDiv.querySelector('#sb-maximize');
    const btnClose = windowDiv.querySelector('#sb-close');

    // Visitor Logic
    let visitorId = localStorage.getItem('chat_visitor_id');
    if (!visitorId) {
        visitorId = 'visitor-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chat_visitor_id', visitorId);
    }

    // Toggle Chat
    function toggleChat() {
        isOpen = !isOpen;
        windowDiv.classList.toggle('active', isOpen);
        if (isOpen) {
            input.focus();
            scrollToBottom();
        }
    }

    // Maximize/Minimize
    function toggleMaximize() {
        isMaximized = !isMaximized;
        windowDiv.classList.toggle('full-screen', isMaximized);
        // Clean up icons or tooltip if needed, but simple toggle is enough
    }

    // Event Listeners
    button.addEventListener('click', toggleChat);
    btnClose.addEventListener('click', toggleChat); // Close hides chat

    btnMinimize.addEventListener('click', () => {
        toggleChat(); // Minimize effectively just hides it
    });

    btnMaximize.addEventListener('click', toggleMaximize);

    // Agent Request
    agentBtn.addEventListener('click', async () => {
        const sessionId = localStorage.getItem('chat_session_id');
        if (!sessionId) {
            alert("Please say hello first!");
            return;
        }

        agentBtn.innerText = "Requesting...";
        agentBtn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:3001/chats/request-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sessionId })
            });

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                updateStatus('waiting');
                addMessage("System: An agent has been notified. Please wait.", "bot");
                startStatusPolling(sessionId);
                agentBtn.style.display = 'none';
            } else {
                alert("Failed to request agent: " + data.message);
                agentBtn.disabled = false;
                agentBtn.innerText = "Speak to Human Agent";
            }
        } catch (e) {
            console.error(e);
            agentBtn.disabled = false;
            agentBtn.innerText = "Speak to Human Agent";
        }
    });

    // Helper: Add Message
    function addMessage(text, sender) {
        // Create Group
        const group = document.createElement('div');
        group.className = `sb-message-group ${sender} sb-anim-pop`;

        // Avatar (only for bot)
        if (sender === 'bot') {
            const avatar = document.createElement('div');
            avatar.className = 'sb-avatar-small';
            avatar.innerText = '🤖';
            group.appendChild(avatar);
        }

        // Bubble
        const bubble = document.createElement('div');
        bubble.className = 'sb-bubble';
        bubble.innerText = text;
        group.appendChild(bubble);

        messagesDiv.appendChild(group);
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Polling logic (Simpler version)
    async function pollMessages() {
        if (!isOpen) return;
        try {
            const response = await fetch(`http://127.0.0.1:3001/messages?tenant_id=${config.apiKey}&visitor_id=${visitorId}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data.data)) {
                    // Very simple sync: If count changes, redraw formatted
                    // Production would use IDs and delta updates
                    const currentCount = messagesDiv.querySelectorAll('.sb-message-group').length;
                    if (data.data.length > currentCount) {
                        messagesDiv.innerHTML = ''; // Clear
                        data.data.forEach(msg => {
                            addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot');
                        });
                    }
                }
            }
        } catch (e) { }
    }
    setInterval(pollMessages, 3000);

    // Send Logic
    async function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';

        try {
            const response = await fetch('http://127.0.0.1:3001/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: config.apiKey,
                    text: text,
                    sender: visitorId
                })
            });
            const data = await response.json();
            if (data.data && data.data.sessionId) {
                localStorage.setItem('chat_session_id', data.data.sessionId);
            }
            if (data.data && data.data.reply) {
                setTimeout(() => addMessage(data.data.reply, 'bot'), 500);
            }
        } catch (e) {
            addMessage("Error: " + e.message, 'bot');
        }
    }

    windowDiv.querySelector('.sb-send-btn').addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => e.key === 'Enter' && handleSend());

    // Status Helper
    function updateStatus(status) {
        statusBanner.style.display = 'block';
        statusBanner.className = 'sb-status-banner ' + status;
        if (status === 'waiting') statusBanner.innerText = '⏳ Waiting for Agent...';
        else if (status === 'live') statusBanner.innerText = '🟢 Live with Agent';
        else if (status === 'busy') statusBanner.innerText = '🔴 Agent Busy';
        else if (status === 'blocked') statusBanner.innerText = '🚫 Account Blocked';
        else statusBanner.style.display = 'none';
    }

    // Status Polling (Simplified)
    function startStatusPolling(sessionId) {
        setInterval(async () => {
            try {
                const res = await fetch(`http://127.0.0.1:3001/chats/session-status?sessionId=${sessionId}`);
                const data = await res.json();

                if (data.isBlocked) {
                    updateStatus('blocked');
                    input.disabled = true;
                    input.placeholder = "You have been blocked.";
                    windowDiv.querySelector('.sb-send-btn').disabled = true;
                    if (agentBtn) agentBtn.style.display = 'none';
                } else {
                    // Enable if previously blocked
                    input.disabled = false;
                    input.placeholder = "Type a message...";
                    windowDiv.querySelector('.sb-send-btn').disabled = false;

                    if (data.status === 'agent_connected') {
                        updateStatus('live');
                        if (agentBtn) agentBtn.style.display = 'none';
                    } else if (data.status === 'active') {
                        updateStatus('none');
                        if (agentBtn) agentBtn.style.display = 'block';
                    }
                }
            } catch (e) { }
        }, 5000);
    }

    // Initialize
    const savedSession = localStorage.getItem('chat_session_id');
    if (savedSession) startStatusPolling(savedSession);

})();
