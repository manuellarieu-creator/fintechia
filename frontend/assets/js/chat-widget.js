// frontend/assets/js/chat-widget.js

const CHAT_API_BASE = '/api/chat';
let chatConvId = localStorage.getItem('chat_conv_id') || null;
let isChatUser = false; // true si c'est un client connecté
let chatPollInterval = null;

// Initialisation de l'UI du Widget
function initChatWidgetUI() {
  const token = localStorage.getItem('token');
  if (token) isChatUser = true;

  const html = `
    <!-- Floating Button -->
    <div id="chat-widget-btn" onclick="toggleChatWindow()" style="position:fixed; bottom:20px; right:20px; width:60px; height:60px; background:#F05A28; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 12px rgba(240,90,40,0.3); z-index:9999; transition:transform 0.2s;">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
    </div>

    <!-- Chat Window -->
    <div id="chat-widget-window" style="display:none; position:fixed; bottom:90px; right:20px; width:350px; height:500px; max-height:80vh; background:white; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); border:1px solid #e2e8f0; z-index:9999; flex-direction:column; overflow:hidden; font-family:'Inter', sans-serif;">
      
      <!-- Header -->
      <div style="background:#F05A28; color:white; padding:15px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-weight:600; display:flex; align-items:center; gap:8px;">
          <div style="width:8px; height:8px; background:#22c55e; border-radius:50%;"></div> Support Fintechia
        </div>
        <span onclick="toggleChatWindow()" style="cursor:pointer; font-size:20px; line-height:1;">&times;</span>
      </div>

      <!-- Visitor Form (if no token & no convId) -->
      <div id="chat-visitor-form" style="padding:20px; display:none; flex:1; overflow-y:auto;">
        <p style="font-size:14px; color:#475569; margin-bottom:20px;">Veuillez renseigner vos informations pour discuter avec un conseiller.</p>
        <input type="text" id="chat-vis-name" placeholder="Nom complet" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
        <input type="email" id="chat-vis-email" placeholder="Adresse Email" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
        <input type="tel" id="chat-vis-phone" placeholder="Numéro de téléphone" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
        <button onclick="startVisitorChat()" style="width:100%; background:#F05A28; color:white; border:none; padding:12px; border-radius:6px; font-weight:600; cursor:pointer;">Démarrer le chat</button>
      </div>

      <!-- Messages Area -->
      <div id="chat-messages-area" style="flex:1; padding:15px; overflow-y:auto; background:#f8fafc; display:flex; flex-direction:column; gap:10px;">
        <!-- Messages injectés ici -->
      </div>

      <!-- Input Area -->
      <div id="chat-input-area" style="padding:15px; border-top:1px solid #e2e8f0; display:flex; gap:10px; background:white; display:none;">
        <input type="text" id="chat-input-field" placeholder="Votre message..." style="flex:1; padding:10px; border:1px solid #cbd5e1; border-radius:20px; outline:none;" onkeypress="if(event.key==='Enter') sendChatMessage()">
        <button onclick="sendChatMessage()" style="background:#F05A28; color:white; border:none; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  
  if (window.innerWidth < 400) {
      document.getElementById('chat-widget-window').style.width = 'calc(100% - 40px)';
  }
}

function toggleChatWindow() {
  const win = document.getElementById('chat-widget-window');
  if (win.style.display === 'none') {
    win.style.display = 'flex';
    checkChatState();
  } else {
    win.style.display = 'none';
    if (chatPollInterval) clearInterval(chatPollInterval);
  }
}

async function checkChatState() {
  const form = document.getElementById('chat-visitor-form');
  const msgArea = document.getElementById('chat-messages-area');
  const inputArea = document.getElementById('chat-input-area');

  if (isChatUser) {
    // Connecté
    form.style.display = 'none';
    msgArea.style.display = 'flex';
    inputArea.style.display = 'flex';
    if (!chatConvId) {
      await initUserChat();
    }
    startChatPolling();
  } else {
    // Visiteur
    if (chatConvId) {
      form.style.display = 'none';
      msgArea.style.display = 'flex';
      inputArea.style.display = 'flex';
      startChatPolling();
    } else {
      form.style.display = 'block';
      msgArea.style.display = 'none';
      inputArea.style.display = 'none';
    }
  }
}

async function initUserChat() {
  try {
    const res = await fetch(`${CHAT_API_BASE}/user/init`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (data.conversation_id) {
      chatConvId = data.conversation_id;
    }
  } catch (e) {
    console.error("Erreur init user chat", e);
  }
}

async function startVisitorChat() {
  const name = document.getElementById('chat-vis-name').value.trim();
  const email = document.getElementById('chat-vis-email').value.trim();
  const phone = document.getElementById('chat-vis-phone').value.trim();

  if (!name || !email || !phone) return alert("Veuillez remplir tous les champs.");

  try {
    const res = await fetch(`${CHAT_API_BASE}/visitor/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    });
    const data = await res.json();
    if (data.conversation_id) {
      chatConvId = data.conversation_id;
      localStorage.setItem('chat_conv_id', chatConvId);
      checkChatState();
    }
  } catch (e) {
    console.error("Erreur start visitor chat", e);
  }
}

function startChatPolling() {
  fetchChatMessages();
  if (chatPollInterval) clearInterval(chatPollInterval);
  chatPollInterval = setInterval(fetchChatMessages, 5000);
}

async function fetchChatMessages() {
  if (!chatConvId) return;
  const url = isChatUser 
    ? `${CHAT_API_BASE}/user/${chatConvId}/messages`
    : `${CHAT_API_BASE}/visitor/${chatConvId}/messages`;
  
  const headers = isChatUser ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {};

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return;
    const messages = await res.json();
    renderChatMessages(messages);
  } catch (e) {
    console.error("Erreur fetch messages", e);
  }
}

function renderChatMessages(messages) {
  const area = document.getElementById('chat-messages-area');
  if (!area) return;
  
  // Save scroll state
  const isAtBottom = area.scrollHeight - area.scrollTop === area.clientHeight;
  
  area.innerHTML = '';
  
  if (messages.length === 0) {
    area.innerHTML = '<div style="text-align:center; color:#94A3B8; font-size:13px; margin-top:auto; margin-bottom:auto;">Un conseiller va vous répondre très bientôt.</div>';
    return;
  }

  messages.forEach(m => {
    const isMe = (isChatUser && m.sender_type === 'user') || (!isChatUser && m.sender_type === 'visitor');
    const bubble = document.createElement('div');
    bubble.style.maxWidth = '80%';
    bubble.style.padding = '10px 14px';
    bubble.style.borderRadius = '16px';
    bubble.style.fontSize = '14px';
    bubble.style.lineHeight = '1.4';
    bubble.style.wordBreak = 'break-word';
    
    if (isMe) {
      bubble.style.background = '#F05A28';
      bubble.style.color = 'white';
      bubble.style.alignSelf = 'flex-end';
      bubble.style.borderBottomRightRadius = '4px';
    } else {
      bubble.style.background = '#e2e8f0';
      bubble.style.color = '#0F172A';
      bubble.style.alignSelf = 'flex-start';
      bubble.style.borderBottomLeftRadius = '4px';
    }
    
    bubble.innerText = m.content;
    area.appendChild(bubble);
  });
  
  if (isAtBottom) {
    area.scrollTop = area.scrollHeight;
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input-field');
  const content = input.value.trim();
  if (!content || !chatConvId) return;

  const url = isChatUser 
    ? `${CHAT_API_BASE}/user/${chatConvId}/message`
    : `${CHAT_API_BASE}/visitor/${chatConvId}/message`;
  
  const headers = { 'Content-Type': 'application/json' };
  if (isChatUser) headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

  input.value = '';

  try {
    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content })
    });
    fetchChatMessages();
    setTimeout(() => {
        const area = document.getElementById('chat-messages-area');
        if (area) area.scrollTop = area.scrollHeight;
    }, 100);
  } catch (e) {
    console.error("Erreur envoi message", e);
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', initChatWidgetUI);
