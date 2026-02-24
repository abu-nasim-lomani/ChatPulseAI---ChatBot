(function () {
    console.log("Chatbot Widget Loading (Premium v2)...");

    const config = window.ChatbotConfig;
    if (!config) {
        console.error("ChatbotConfig not found!");
        return;
    }

    // 1. Inject CSS (Premium Intercom Style)
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --primary-color: #4F46E5; /* Indigo-600 */
            --primary-gradient: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            --background-color: #ffffff;
            --text-color: #1F2937;
            --gray-100: #F3F4F6;
            --gray-200: #E5E7EB;
        }

        .sb-widget-button {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 64px;
            height: 64px;
            background: var(--primary-gradient);
            border-radius: 50%;
            box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
            cursor: pointer;
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            animation: sb-float 3s ease-in-out infinite;
        }
        .sb-widget-button:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 32px rgba(79, 70, 229, 0.5);
        }
        .sb-widget-icon {
            width: 32px;
            height: 32px;
            fill: white;
            transition: transform 0.3s;
        }
        
        .sb-chat-window {
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 380px;
            height: 600px;
            max-height: 80vh;
            background-color: var(--background-color);
            border-radius: 20px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.15);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
        
        .sb-header {
            background: var(--primary-gradient);
            color: white;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .sb-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .sb-avatar-group {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .sb-avatar {
            width: 40px;
            height: 40px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            border: 2px solid rgba(255,255,255,0.4);
        }
        .sb-title {
            font-size: 18px;
            font-weight: 700;
        }
        .sb-subtitle {
            font-size: 13px;
            opacity: 0.9;
        }

        .sb-close-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: background 0.2s;
        }
        .sb-close-btn:hover {
            background: rgba(255,255,255,0.4);
        }

        .sb-agent-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.4);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            margin-right: 8px;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .sb-agent-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-1px);
        }
        .sb-agent-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Status Banner Styles */
        .sb-status-banner {
            padding: 12px 16px;
            margin: -16px -16px 16px -16px;
            border-radius: 16px 16px 0 0;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            animation: slideDown 0.3s ease-out;
        }
        .sb-status-waiting {
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
            color: #92400E;
        }
        .sb-status-live {
            background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
            color: #065F46;
        }
        .sb-status-busy {
            background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
            color: #991B1B;
        }
        @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .sb-messages {
            flex: 1;
            padding: 20px;
            background-color: #FAFAFA;
            overflow-y: auto;
            scroll-behavior: smooth;
        }
        .sb-message {
            margin-bottom: 16px;
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.5;
            position: relative;
            animation: sb-slide-up 0.3s ease-out;
        }
        .sb-message.bot {
            background-color: white;
            color: var(--text-color);
            border: 1px solid var(--gray-200);
            border-bottom-left-radius: 4px;
            align-self: flex-start;
            margin-right: auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .sb-message.user {
            background: var(--primary-gradient);
            color: white;
            border-bottom-right-radius: 4px;
            align-self: flex-end;
            margin-left: auto;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        
        .sb-typing-indicator {
            display: none;
            background: white;
            padding: 12px;
            border-radius: 16px;
            border-bottom-left-radius: 4px;
            margin-bottom: 16px;
            width: fit-content;
            border: 1px solid var(--gray-200);
            align-items: center;
            gap: 4px;
            margin-left: 0;
            margin-right: auto;
        }
        .sb-typing-dot {
            width: 6px;
            height: 6px;
            background: #9CA3AF;
            border-radius: 50%;
            animation: sb-typing 1.4s infinite ease-in-out both;
        }
        .sb-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .sb-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        .sb-input-area {
            padding: 16px;
            border-top: 1px solid var(--gray-200);
            background: white;
            display: flex;
            gap: 12px;
            align-items: center;
        }
        .sb-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid var(--gray-200);
            background: #F9FAFB;
            border-radius: 24px;
            outline: none;
            transition: all 0.2s;
            font-size: 14px;
        }
        .sb-input:focus {
            background: white;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .sb-send-btn {
            background: var(--primary-gradient);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
            flex-shrink: 0;
        }
        .sb-send-btn:hover {
            transform: scale(1.05);
        }
        .sb-send-icon {
            width: 18px;
            height: 18px;
            fill: white;
            margin-left: 2px;
            pointer-events: none; /* Ensure click passes to button */
        }

        @keyframes sb-float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
        @keyframes sb-slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sb-typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    `;
    document.head.appendChild(style);

    // 2. Create Chat Button
    const button = document.createElement('div');
    button.className = 'sb-widget-button';
    button.innerHTML = `
        <svg class="sb-widget-icon" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
    `;
    document.body.appendChild(button);

    // 3. Create Chat Window
    const windowDiv = document.createElement('div');
    windowDiv.className = 'sb-chat-window';
    windowDiv.innerHTML = `
        <div class="sb-header">
            <div class="sb-header-top">
                <div class="sb-avatar-group">
                    <div class="sb-avatar">🤖</div>
                    <div>
                        <div class="sb-title">Chat Assistant</div>
                        <div class="sb-subtitle">Always here to help</div>
                    </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <button class="sb-agent-btn" id="sb-agent-btn">Speak to Agent</button>
                    <button class="sb-close-btn">&times;</button>
                </div>
            </div>
        </div>
        <div id="sb-status-banner" style="display: none;"></div>
        <div class="sb-messages" id="sb-messages">
            <div class="sb-message bot">Hello! 👋 How can I help you today?</div>
            <div class="sb-typing-indicator" id="sb-typing">
                <div class="sb-typing-dot"></div>
                <div class="sb-typing-dot"></div>
                <div class="sb-typing-dot"></div>
            </div>
        </div>
        <div class="sb-input-area">
            <input type="text" class="sb-input" placeholder="Type a message...">
            <button class="sb-send-btn">
                <svg class="sb-send-icon" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
        </div>
    `;
    document.body.appendChild(windowDiv);

    // 4. Logic
    let isOpen = false;
    const input = windowDiv.querySelector('input');
    const messagesDiv = windowDiv.querySelector('#sb-messages');
    const typingIndicator = windowDiv.querySelector('#sb-typing');
    const agentBtn = windowDiv.querySelector('#sb-agent-btn');

    // Visitor ID Persistence
    let visitorId = localStorage.getItem('chat_visitor_id');
    if (!visitorId) {
        visitorId = 'visitor-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chat_visitor_id', visitorId);
    }
    console.log("Visitor ID:", visitorId);

    function toggleChat() {
        isOpen = !isOpen;
        windowDiv.classList.toggle('active', isOpen);
        if (isOpen) {
            input.focus();
            scrollToBottom();
        }
    }

    button.addEventListener('click', toggleChat);
    windowDiv.querySelector('.sb-close-btn').addEventListener('click', toggleChat);

    agentBtn.addEventListener('click', async () => {
        const sessionId = localStorage.getItem('chat_session_id');

        if (!sessionId) {
            alert("Please send a message first before requesting an agent!");
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
                agentBtn.innerText = "✓ Agent Requested";
                showStatusBanner('waiting');
                input.disabled = true;
                sendBtn.disabled = true;
                addMessage("System: An agent has been notified. Please wait.", "bot");
                startStatusPolling(sessionId);
            } else {
                agentBtn.innerText = "Try Again";
                agentBtn.disabled = false;
                alert("Error: " + (data.message || "Failed to request agent"));
            }
        } catch (e) {
            console.error(e);
            agentBtn.innerText = "Try Again";
            agentBtn.disabled = false;
            alert("Network error. Please try again.");
        }
    });

    function addMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = 'sb-message ' + sender;
        msg.innerText = text;
        messagesDiv.insertBefore(msg, typingIndicator); // Insert BEFORE typing indicator

        // Ensure typing indicator is always last in DOM flow (though visually hidden/shown)
        messagesDiv.appendChild(typingIndicator);

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function showTyping(show) {
        typingIndicator.style.display = show ? 'flex' : 'none';
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function scrollToBottom() {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Track the number of messages received from API
    let lastMessageCount = 0;

    // Polling for new messages
    async function pollMessages() {
        try {
            const response = await fetch(`http://127.0.0.1:3001/messages?tenant_id=${config.apiKey}&visitor_id=${visitorId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && Array.isArray(data.data)) {

                    const newMessages = data.data;

                    if (newMessages.length > lastMessageCount) {
                        lastMessageCount = newMessages.length;

                        const currentMessages = messagesDiv.querySelectorAll('.sb-message');
                        // Store current typing state
                        const isTyping = typingIndicator.style.display === 'flex';

                        // Remove all existing messages to rebuild from definitive state
                        currentMessages.forEach(el => el.remove());

                        // Re-add all messages in order
                        newMessages.forEach(msg => {
                            const sender = msg.role === 'user' ? 'user' : 'bot';
                            const m = document.createElement('div');
                            m.className = 'sb-message ' + sender;
                            m.innerText = msg.content;
                            messagesDiv.insertBefore(m, typingIndicator);
                        });

                        if (isTyping) showTyping(true);
                        scrollToBottom();
                    }
                }
            }
        } catch (e) {
            // console.error("Poll error", e);
        }
    }

    // Poll every 3 seconds
    setInterval(pollMessages, 3000);

    // Initial Load
    pollMessages();

    // Handle Send
    async function handleSend() {
        console.log("Send Triggered");
        const text = input.value.trim();
        if (!text) {
            console.log("Input is empty");
            return;
        }

        // 1. Show User Message
        try {
            addMessage(text, 'user');
            input.value = ''; // Clear input

            // 2. Show Typing Indicator
            showTyping(true);

            // 3. Send to API
            console.log("Sending to API:", text);
            const response = await fetch('http://127.0.0.1:3001/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: config.apiKey,
                    text: text,
                    sender: visitorId // User Visitor ID from localStorage
                })
            });

            const data = await response.json();
            console.log("API Response:", data);

            // Store or Update Session ID
            if (data && data.data && data.data.sessionId) {
                localStorage.setItem('chat_session_id', data.data.sessionId);
            }

            showTyping(false);

            // Handle reply - don't show error if in agent mode (agent will reply manually)
            if (data && data.data && data.data.reply) {
                // If there is an immediate AI reply, let the next poll fetch it cleanly
                // or we could append it, but resetting lastMessageCount ensures 100% sync
            }

            // Force the next poll to do a full refresh to ensure perfect sync
            // including human agent messages that might have arrived at the exact same time
            lastMessageCount = 0;
            pollMessages();

            // Note: No error message if no reply - agent might be typing in live mode

        } catch (error) {
            showTyping(false);
            console.error("API Fetch Error:", error);
            addMessage("App Error: " + error.message, 'bot');
        }
    }

    const sendBtn = windowDiv.querySelector('.sb-send-btn');
    sendBtn.addEventListener('click', () => {
        console.log("Send Button Clicked");
        handleSend();
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log("Enter Key Pressed");
            handleSend();
        }
    });

    console.log("Chatbot Widget UI Loaded (Debug Mode)");

    // Initialize widget state based on current session status
    async function initializeWidgetState() {
        const sessionId = localStorage.getItem('chat_session_id');
        if (!sessionId) return; // No active session

        try {
            const status = await checkSessionStatus(sessionId);

            if (status === 'agent_requested') {
                // Restore waiting state
                showStatusBanner('waiting');
                input.disabled = true;
                sendBtn.disabled = true;
                agentBtn.disabled = true;
                agentBtn.innerText = '✓ Agent Requested';
                startStatusPolling(sessionId);
            } else if (status === 'agent_connected') {
                // Restore live state
                showStatusBanner('live');
                input.disabled = false;
                sendBtn.disabled = false;
                agentBtn.style.display = 'none';
                startStatusPolling(sessionId); // Continue polling to detect end
            }
        } catch (error) {
            console.error('Failed to initialize widget state:', error);
        }
    }

    // Call init function after widget loads
    initializeWidgetState();

    // Status Banner Helper Functions
    const statusBanner = windowDiv.querySelector('#sb-status-banner');
    let statusPollInterval = null;

    function showStatusBanner(status) {
        statusBanner.style.display = 'block';
        statusBanner.className = 'sb-status-banner';

        if (status === 'waiting') {
            statusBanner.classList.add('sb-status-waiting');
            statusBanner.innerHTML = '⏳ Waiting for Agent...';
        } else if (status === 'live') {
            statusBanner.classList.add('sb-status-live');
            statusBanner.innerHTML = '🟢 Live with Agent';
        } else if (status === 'busy') {
            statusBanner.classList.add('sb-status-busy');
            statusBanner.innerHTML = '🔴 Agent Busy - Try Again Later';
        }
    }

    function hideStatusBanner() {
        statusBanner.style.display = 'none';
    }

    async function checkSessionStatus(sessionId) {
        try {
            const response = await fetch(`http://127.0.0.1:3001/chats/session-status?sessionId=${sessionId}`);
            const data = await response.json();

            if (data.status) {
                return data.status;
            }
        } catch (error) {
            console.error('Status poll error:', error);
        }
        return null;
    }

    function startStatusPolling(sessionId) {
        if (statusPollInterval) clearInterval(statusPollInterval);

        statusPollInterval = setInterval(async () => {
            const status = await checkSessionStatus(sessionId);

            if (status === 'agent_connected') {
                if (!statusBanner.classList.contains('sb-status-live')) {
                    // First time connecting
                    showStatusBanner('live');
                    input.disabled = false;
                    sendBtn.disabled = false;
                    agentBtn.style.display = 'none';
                    addMessage("System: Agent connected! You can now chat.", "bot");
                }
                // Keep polling to detect when agent ends chat
            } else if (status === 'active') {
                // Check if we were in agent mode before
                if (statusBanner.classList.contains('sb-status-live')) {
                    // Agent ended chat - back to normal
                    hideStatusBanner();
                    agentBtn.style.display = 'inline-block';
                    agentBtn.disabled = false;
                    agentBtn.innerText = 'Speak to Agent';
                    addMessage("System: Agent has left the chat. AI assistant is back.", "bot");
                    clearInterval(statusPollInterval);
                } else if (statusBanner.classList.contains('sb-status-waiting')) {
                    // Agent rejected - show busy message
                    showStatusBanner('busy');
                    setTimeout(() => {
                        hideStatusBanner();
                        input.disabled = false;
                        sendBtn.disabled = false;
                        agentBtn.disabled = false;
                        agentBtn.innerText = 'Speak to Agent';
                    }, 3000);
                    addMessage("System: Agent is busy. Please try again later.", "bot");
                    clearInterval(statusPollInterval);
                }
            }
        }, 2000); // Poll every 2 seconds
    }

})();
