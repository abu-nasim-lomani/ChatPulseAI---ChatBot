(async function () {
    console.log("Chatbot Widget Loading (Premium Customization)...");

    const config = window.ChatbotConfig;
    if (!config || !config.apiKey) {
        console.error("ChatbotConfig with apiKey not found!");
        return;
    }

    // Default configuration
    let widgetSettings = {
        themeColor: '#4F46E5',
        fontColor: '#ffffff',
        fontFamily: 'Inter',
        widgetPosition: 'bottom-right',
        botName: 'Assistant',
        botAvatarType: 'emoji',
        botAvatar: '🤖',
        enableHumanAgent: true,
        suggestedMessages: '',
        launcherText: 'Hey, need help? 💬',
        removeBranding: false,
        // Advanced
        autoShowDelay: 0,
        themeMode: 'auto', // light, dark, auto
        paddingOffset: { x: 24, y: 24 },
        enableVoiceInput: false
    };

    const HOST = 'http://127.0.0.1:3001'; // Default to localhost for now
    try {
        const res = await fetch(`${HOST}/widget/config?tenantId=${config.apiKey}`);
        if (res.ok) {
            const data = await res.json();
            if (data.config && Object.keys(data.config).length > 0) {
                widgetSettings = { ...widgetSettings, ...data.config };
            }
        }
    } catch {
        console.warn("Failed to load widget customization. Using defaults.");
    }

    // Normalize paddingOffset in case it comes as a parsed JSON object or is missing
    if (widgetSettings.paddingOffset && typeof widgetSettings.paddingOffset === 'object') {
        widgetSettings.paddingOffset = {
            x: Number(widgetSettings.paddingOffset.x ?? 24),
            y: Number(widgetSettings.paddingOffset.y ?? 24)
        };
    } else {
        widgetSettings.paddingOffset = { x: 24, y: 24 };
    }

    // Detect system theme for 'auto' mode
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = widgetSettings.themeMode === 'dark' || (widgetSettings.themeMode === 'auto' && prefersDark);

    // 1. Inject CSS (Modern Messenger Style + Advanced Configs)
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --primary-color: ${widgetSettings.themeColor};
            --primary-gradient: linear-gradient(135deg, ${widgetSettings.themeColor} 0%, ${widgetSettings.themeColor}E6 100%);
            --secondary-color: ${isDark ? '#374151' : '#F3F4F6'};
            --bg-color: ${isDark ? '#1F2937' : '#FFFFFF'};
            --bg-secondary: ${isDark ? '#111827' : '#F9FAFB'};
            --text-color: ${isDark ? '#F9FAFB' : '#1F2937'};
            --text-muted: ${isDark ? '#9CA3AF' : '#6B7280'};
            --border-color: ${isDark ? '#374151' : '#E5E7EB'};
            --bot-bubble-bg: ${isDark ? '#374151' : '#F3F4F6'};
            --user-bubble-bg: ${widgetSettings.themeColor};
            --font-family: ${widgetSettings.fontFamily === 'system-ui' ? 'system-ui, -apple-system, sans-serif' : `'${widgetSettings.fontFamily}', sans-serif`};
            --padding-x: ${widgetSettings.paddingOffset?.x ?? 24}px;
            --padding-y: ${widgetSettings.paddingOffset?.y ?? 24}px;
        }

        /* Float Button */
        .sb-widget-button {
            position: fixed;
            bottom: var(--padding-y);
            ${widgetSettings.widgetPosition === 'bottom-left' ? 'left: var(--padding-x);' : 'right: var(--padding-x);'}
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
            bottom: calc(var(--padding-y) + 76px);
            ${widgetSettings.widgetPosition === 'bottom-left' ? 'left: var(--padding-x);' : 'right: var(--padding-x);'}
            width: 380px;
            height: 650px;
            max-height: 80vh;
            background-color: var(--bg-color);
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
            ${widgetSettings.widgetPosition === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
            border-radius: 0;
        }
        
        /* Header */
        .sb-header {
            background: var(--bg-color);
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
        }
        .sb-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .sb-header-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--secondary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            overflow: hidden;
            flex-shrink: 0;
        }
        .sb-header-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
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
            color: var(--text-muted);
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
            background: var(--secondary-color);
            color: var(--text-color);
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
            background-color: var(--bg-secondary);
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
            margin-left: auto;
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
            overflow: hidden;
        }

        .sb-avatar-small img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
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
            color: ${widgetSettings.fontColor || '#ffffff'};
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }

        /* Input Area (Floating Pill) */
        .sb-input-container {
            padding: 16px 20px;
            background: var(--bg-color);
            border-top: 1px solid var(--border-color);
        }
        .sb-input-wrapper {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
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
            background: var(--bg-color);
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
        .sb-mic-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }
        .sb-mic-btn:hover {
            color: var(--primary-color);
        }
        .sb-mic-btn.recording {
            color: #ef4444;
            animation: pulse-red 1.5s infinite;
        }
        @keyframes pulse-red {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
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
            background: var(--secondary-color);
            color: var(--primary-color);
            border: 1px solid var(--border-color);
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
            background: var(--border-color);
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

    // Add Launcher Tooltip
    let launcherTooltip = null;
    if (widgetSettings.launcherText) {
        launcherTooltip = document.createElement('div');
        launcherTooltip.innerHTML = widgetSettings.launcherText;
        launcherTooltip.style.cssText = `
            position: fixed;
            bottom: calc(var(--padding-y) + 14px);
            ${widgetSettings.widgetPosition === 'bottom-left' ? 'left: calc(var(--padding-x) + 71px);' : 'right: calc(var(--padding-x) + 71px);'}
            background: var(--bg-color);
            padding: 8px 16px;
            border-radius: 20px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.1);
            font-family: var(--font-family);
            font-size: 13px;
            font-weight: 500;
            color: var(--text-color);
            z-index: 99998;
            transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            pointer-events: none;
            border: 1px solid #F3F4F6;
        `;
        document.body.appendChild(launcherTooltip);
    }

    document.body.appendChild(button);

    // Dynamic Avatar Generator
    const avatarHTML = widgetSettings.botAvatarType === 'image' && widgetSettings.botAvatar.startsWith('http')
        ? `<img src="${widgetSettings.botAvatar}" alt="Bot Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : widgetSettings.botAvatar;

    // 3. Chat Window (Redesigned)
    const windowDiv = document.createElement('div');
    windowDiv.className = 'sb-chat-window';

    // Check if lead capture is needed
    const needsLeadCapture = widgetSettings.leadCaptureEnabled && !localStorage.getItem('chat_lead_submitted');

    let leadCaptureHTML = '';
    if (needsLeadCapture) {
        let fieldsHTML = '';
        if (widgetSettings.leadCaptureName) fieldsHTML += `<input type="text" id="sb-lead-name" placeholder="Your Name *" required class="sb-lead-input">`;
        if (widgetSettings.leadCaptureEmail) fieldsHTML += `<input type="email" id="sb-lead-email" placeholder="Email Address *" required class="sb-lead-input">`;
        if (widgetSettings.leadCapturePhone) fieldsHTML += `<input type="tel" id="sb-lead-phone" placeholder="Phone Number *" required class="sb-lead-input">`;
        if (widgetSettings.leadCaptureCompany) fieldsHTML += `<input type="text" id="sb-lead-company" placeholder="Company Name" class="sb-lead-input">`;

        // Render dynamic custom fields
        if (Array.isArray(widgetSettings.leadCaptureCustomFields)) {
            widgetSettings.leadCaptureCustomFields.forEach(field => {
                const requiredAttr = field.required ? 'required' : '';
                const placeholder = field.required ? `${field.label} *` : field.label;
                const fieldId = `sb-lead-custom-${field.id}`;
                fieldsHTML += `<input type="text" id="${fieldId}" data-custom-label="${field.label}" placeholder="${placeholder}" ${requiredAttr} class="sb-lead-input sb-lead-custom-input">`;
            });
        }

        leadCaptureHTML = `
            <div id="sb-lead-overlay" style="position: absolute; top: 60px; left: 0; right: 0; bottom: 0; background: var(--bg-color); z-index: 50; display: flex; flex-direction: column; padding: 24px; text-align: center;">
                <div style="font-size: 14px; font-weight: 600; color: var(--text-color); margin-bottom: 20px;">
                    ${widgetSettings.leadCaptureTitle || 'Let us know how to contact you'}
                </div>
                <form id="sb-lead-form" style="display: flex; flex-direction: column; gap: 12px; flex: 1; overflow-y: auto;">
                    ${fieldsHTML}
                    <button type="submit" id="sb-lead-submit" style="margin-top: auto; background: var(--primary-color); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: opacity 0.2s;">
                        Start Chat
                    </button>
                    <div id="sb-lead-error" style="color: #ef4444; font-size: 12px; margin-top: 8px; display: none;">Error submitting form</div>
                </form>
            </div>
        `;

        // Add Lead specific CSS
        style.innerHTML += `
            .sb-lead-input {
                width: 100%;
                padding: 10px 14px;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-secondary);
                color: var(--text-color);
                font-size: 13px;
                font-family: inherit;
                outline: none;
                transition: border-color 0.2s;
                box-sizing: border-box;
            }
            .sb-lead-input:focus {
                border-color: var(--primary-color);
            }
        `;
    }

    windowDiv.innerHTML = `
        <div class="sb-header">
            <div class="sb-header-info">
                <div class="sb-header-avatar">${avatarHTML}</div>
                <div class="sb-header-text">
                    <div class="sb-header-title">${widgetSettings.botName}</div>
                    <div class="sb-header-status">Online</div>
                </div>
            </div>
            <div class="sb-controls">
                <button class="sb-control-btn" id="sb-refresh" title="Restart Chat">
                    <svg class="sb-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                <button class="sb-control-btn" id="sb-close" title="Close">
                   <svg class="sb-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        </div>
        ${leadCaptureHTML}
        <div id="sb-status-banner" style="display: none;"></div>
        
        <div class="sb-messages" id="sb-messages">
            <!-- Messages go here -->
        </div>

        ${widgetSettings.enableHumanAgent ? `
        <div style="text-align: center; padding: 0 20px;">
             <button class="sb-agent-pill" id="sb-agent-btn">Speak to Human Agent</button>
        </div>` : ''}

        <div class="sb-input-container">
            <div class="sb-input-wrapper">
                <input type="text" class="sb-input" placeholder="Type a message..." ${needsLeadCapture ? 'disabled' : ''} />
                ${widgetSettings.enableVoiceInput ? `
                <button class="sb-mic-btn" id="sb-mic-btn" title="Voice Input">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>` : ''}
                <button class="sb-send-btn" ${needsLeadCapture ? 'disabled style="opacity:0.5"' : ''}>
                    <svg class="sb-send-icon" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
            ${!widgetSettings.removeBranding ? `<div style="text-align: center; margin-top: 8px; font-size: 10px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>Powered by ChatPulse AI</div>` : ''}
        </div>
    `;
    document.body.appendChild(windowDiv);

    // Render Suggested Messages - reusable, with dismiss button
    function buildSuggestedMessages() {
        // Remove existing container if any
        const existing = windowDiv.querySelector('.sb-suggested-container');
        if (existing) existing.remove();

        if (!widgetSettings.suggestedMessages) return;
        const messages = widgetSettings.suggestedMessages.split('\n').filter(m => m.trim() !== '');
        if (messages.length === 0) return;

        const container = document.createElement('div');
        container.className = 'sb-suggested-container';
        container.style.cssText = 'padding: 8px 20px 10px; display: flex; flex-direction: column; gap: 6px;';

        // Header row with label and dismiss button
        const headerRow = document.createElement('div');
        headerRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';
        headerRow.innerHTML = `
            <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Quick Replies</span>
            <button id="sb-dismiss-suggestions" title="Hide suggestions" style="background: transparent; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 2px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        container.appendChild(headerRow);

        // Chips row
        const chipsRow = document.createElement('div');
        chipsRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end;';

        messages.forEach(msg => {
            const btn = document.createElement('button');
            btn.className = 'sb-suggested-btn';
            btn.textContent = msg;
            btn.style.cssText = 'background: var(--bg-color); border: 1px solid var(--primary-color); color: var(--primary-color); padding: 6px 14px; border-radius: 20px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: var(--font-family); box-shadow: 0 1px 2px rgba(0,0,0,0.05);';
            btn.onmouseover = () => { btn.style.background = 'var(--primary-color)'; btn.style.color = 'white'; };
            btn.onmouseout = () => { btn.style.background = 'var(--bg-color)'; btn.style.color = 'var(--primary-color)'; };
            btn.onclick = () => window.sbSendSuggestedText(msg);
            chipsRow.appendChild(btn);
        });

        container.appendChild(chipsRow);

        const inputContainer = windowDiv.querySelector('.sb-input-container');
        windowDiv.insertBefore(container, inputContainer);

        // Wire up dismiss button AFTER inserting into DOM
        const dismissBtn = container.querySelector('#sb-dismiss-suggestions');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                container.remove();
            });
        }
    }

    buildSuggestedMessages();

    // Global method for suggested text
    window.sbSendSuggestedText = function (text) {
        const inputField = windowDiv.querySelector('.sb-input');
        if (inputField) {
            inputField.value = text;
            handleSend();
        }
    };

    // 4. Logic & Features
    let isOpen = false;

    // Elements
    const input = windowDiv.querySelector('input');
    const messagesDiv = windowDiv.querySelector('#sb-messages');
    const agentBtn = windowDiv.querySelector('#sb-agent-btn');
    const statusBanner = windowDiv.querySelector('#sb-status-banner');
    const btnRefresh = windowDiv.querySelector('#sb-refresh');
    const btnClose = windowDiv.querySelector('#sb-close');
    const micBtn = windowDiv.querySelector('#sb-mic-btn');

    // Voice Input Logic (Web Speech API)
    if (micBtn && widgetSettings.enableVoiceInput) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = function () {
                micBtn.classList.add('recording');
                input.placeholder = "Listening...";
            };

            recognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript;
                input.value = transcript;
            };

            recognition.onerror = function (event) {
                console.error("Speech recognition error", event.error);
                micBtn.classList.remove('recording');
                input.placeholder = "Type a message...";
            };

            recognition.onend = function () {
                micBtn.classList.remove('recording');
                input.placeholder = "Type a message...";
            };

            micBtn.addEventListener('click', () => {
                if (micBtn.classList.contains('recording')) {
                    recognition.stop();
                } else {
                    recognition.start();
                }
            });
        } else {
            console.warn("Web Speech API not supported in this browser.");
            micBtn.style.display = 'none';
        }
    }

    // Visitor Logic
    let visitorId = localStorage.getItem('chat_visitor_id');
    if (!visitorId) {
        visitorId = 'visitor-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chat_visitor_id', visitorId);
    }

    // Lead Capture Submission Logic
    const leadForm = windowDiv.querySelector('#sb-lead-form');
    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = leadForm.querySelector('#sb-lead-submit');
            const errorDiv = leadForm.querySelector('#sb-lead-error');

            const payload = {
                tenantId: config.apiKey,
                sessionId: localStorage.getItem('chat_session_id') || null,
                source: 'widget'
            };

            const nameInput = leadForm.querySelector('#sb-lead-name');
            const emailInput = leadForm.querySelector('#sb-lead-email');
            const phoneInput = leadForm.querySelector('#sb-lead-phone');
            const companyInput = leadForm.querySelector('#sb-lead-company');

            if (nameInput) payload.name = nameInput.value;
            if (emailInput) payload.email = emailInput.value;
            if (phoneInput) payload.phone = phoneInput.value;
            if (companyInput) payload.company = companyInput.value;

            // Collect Custom Fields Data
            const customInputs = leadForm.querySelectorAll('.sb-lead-custom-input');
            if (customInputs.length > 0) {
                payload.customData = {};
                customInputs.forEach(input => {
                    const label = input.getAttribute('data-custom-label');
                    if (label) {
                        payload.customData[label] = input.value;
                    }
                });
            }

            submitBtn.textContent = 'Starting...';
            submitBtn.style.opacity = '0.7';
            errorDiv.style.display = 'none';

            try {
                const response = await fetch(`${HOST}/widget/lead`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Failed to submit');

                // Success
                localStorage.setItem('chat_lead_submitted', 'true');
                const overlay = windowDiv.querySelector('#sb-lead-overlay');
                if (overlay) overlay.remove();

                // Unlock inputs
                input.disabled = false;
                const sendBtn = windowDiv.querySelector('.sb-send-btn');
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.style.opacity = '1';
                }

                // Show welcome message OR auto-trigger first message
                addMessage("Thank you! How can we help you today?", 'bot');
                input.focus();

            } catch (err) {
                console.error("Lead submission error:", err);
                submitBtn.textContent = 'Start Chat';
                submitBtn.style.opacity = '1';
                errorDiv.textContent = 'Submission failed. Please try again.';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Toggle Chat
    function toggleChat() {
        isOpen = !isOpen;
        windowDiv.classList.toggle('active', isOpen);
        if (launcherTooltip) {
            launcherTooltip.style.opacity = isOpen ? '0' : '1';
        }
        if (isOpen) {
            input.focus();
            scrollToBottom();
        }
    }

    // Event Listeners
    button.addEventListener('click', toggleChat);
    btnClose.addEventListener('click', toggleChat);

    btnRefresh.addEventListener('click', () => {
        // Clear chat UI and restart session
        if (confirm("Are you sure you want to restart this conversation?")) {
            localStorage.removeItem('chat_visitor_id');
            localStorage.removeItem('chat_session_id');
            // Clear auto-show flag so it can trigger again on next page load
            sessionStorage.removeItem('chat_auto_shown');
            messagesDiv.innerHTML = '';
            visitorId = 'visitor-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chat_visitor_id', visitorId);
            addMessage("Conversation restarted. How can I help you?", 'bot');
            // Re-build suggested messages after reset
            buildSuggestedMessages();
        }
    });

    // Agent Request
    if (agentBtn) {
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
    }

    // Helper: Add Message
    function addMessage(text, sender) {
        // Create Group
        const group = document.createElement('div');
        group.className = `sb-message-group ${sender} sb-anim-pop`;

        // Avatar (only for bot)
        if (sender === 'bot') {
            const avatar = document.createElement('div');
            avatar.className = 'sb-avatar-small';
            avatar.innerHTML = widgetSettings.botAvatarType === 'image' && widgetSettings.botAvatar.startsWith('http')
                ? `<img src="${widgetSettings.botAvatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
                : widgetSettings.botAvatar;
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

    // Helper: Typing Indicator
    function showTypingIndicator() {
        const group = document.createElement('div');
        group.className = 'sb-message-group bot sb-anim-pop sb-typing-indicator-group';

        const avatar = document.createElement('div');
        avatar.className = 'sb-avatar-small';
        avatar.innerHTML = widgetSettings.botAvatarType === 'image' && widgetSettings.botAvatar.startsWith('http')
            ? `<img src="${widgetSettings.botAvatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
            : widgetSettings.botAvatar;
        group.appendChild(avatar);

        const bubble = document.createElement('div');
        bubble.className = 'sb-bubble';
        bubble.style.display = 'flex';
        bubble.style.alignItems = 'center';
        bubble.style.padding = '12px 16px';
        bubble.innerHTML = '<div class="sb-typing"><div class="sb-dot"></div><div class="sb-dot"></div><div class="sb-dot"></div></div>';
        group.appendChild(bubble);

        messagesDiv.appendChild(group);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicators = messagesDiv.querySelectorAll('.sb-typing-indicator-group');
        indicators.forEach(ind => ind.remove());
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
        } catch { }
    }
    setInterval(pollMessages, 3000);

    // Send Logic
    async function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';

        showTypingIndicator();

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

            removeTypingIndicator();

            if (data.data && data.data.sessionId) {
                localStorage.setItem('chat_session_id', data.data.sessionId);
            }
            if (data.data && data.data.reply) {
                addMessage(data.data.reply, 'bot');
            }
        } catch {
            removeTypingIndicator();
            addMessage("Error: Failed to connect to server.", 'bot');
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
            } catch { }
        }, 5000);
    }

    // Initialize
    const savedSession = localStorage.getItem('chat_session_id');
    if (savedSession) startStatusPolling(savedSession);

    // Auto Show Logic: automatically open widget after N seconds if configured
    if (widgetSettings.autoShowDelay > 0) {
        const hasAutoShown = sessionStorage.getItem('chat_auto_shown');
        if (!hasAutoShown) {
            setTimeout(() => {
                if (!isOpen) {
                    toggleChat();
                    sessionStorage.setItem('chat_auto_shown', 'true');
                }
            }, widgetSettings.autoShowDelay * 1000);
        }
    }

    // Prevent repeat auto-show after user interacts
    windowDiv.addEventListener('click', () => {
        sessionStorage.setItem('chat_auto_shown', 'true');
    });

})();
