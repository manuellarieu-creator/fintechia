// frontend/assets/js/admin-chat.js

const ADMIN_CHAT_API = '/api/chat/admin';
let activeAdminChatConvId = null;
let adminChatPollInterval = null;

async function loadAdminChats() {
  const token = localStorage.getItem('adminToken');
  if (!token) return;

  try {
    const res = await fetch(`${ADMIN_CHAT_API}/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const convs = await res.json();
    renderAdminChatList(convs);
  } catch (e) {
    console.error("Erreur chargement convs admin", e);
  }
}

function renderAdminChatList(convs) {
  const list = document.getElementById('admin-chat-list');
  if (!list) return;

  if (convs.length === 0) {
    list.innerHTML = '<div style="padding:20px; text-align:center; color:#94A3B8; font-size:13px;">Aucune conversation</div>';
    return;
  }

  list.innerHTML = '';
  convs.forEach(c => {
    const isClient = !!c.user_id;
    const name = isClient ? `${c.prenom} ${c.nom}` : c.visitor_name;
    const typeBadge = isClient 
      ? '<span style="background:#dbeafe; color:#1e40af; padding:2px 6px; border-radius:4px; font-size:10px;">Client</span>'
      : '<span style="background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px;">Visiteur</span>';
    
    const div = document.createElement('div');
    div.style.padding = '12px';
    div.style.borderBottom = '1px solid #e2e8f0';
    div.style.cursor = 'pointer';
    div.style.background = (activeAdminChatConvId === c.id) ? '#eff6ff' : '#ffffff';
    div.onclick = () => openAdminConversation(c.id, name, isClient ? c.user_email : c.visitor_email);

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items:center;">
        <span style="font-weight:600; font-size:13px; color:#0f172a;">${name}</span>
        ${typeBadge}
      </div>
      <p style="margin:0; font-size:12px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.last_message || 'Nouveau chat'}</p>
    `;
    list.appendChild(div);
  });
}

function openAdminConversation(convId, name, email) {
  activeAdminChatConvId = convId;
  document.getElementById('admin-chat-title').innerText = name;
  document.getElementById('admin-chat-subtitle').innerText = email;
  document.getElementById('admin-chat-input-area').style.display = 'flex';
  document.getElementById('btn-close-chat').style.display = 'block';

  loadAdminChats(); // refresh list to highlight active
  fetchAdminChatMessages();

  if (adminChatPollInterval) clearInterval(adminChatPollInterval);
  adminChatPollInterval = setInterval(fetchAdminChatMessages, 5000);
}

async function fetchAdminChatMessages() {
  if (!activeAdminChatConvId) return;
  const token = localStorage.getItem('adminToken');
  
  try {
    const res = await fetch(`${ADMIN_CHAT_API}/${activeAdminChatConvId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const messages = await res.json();
    renderAdminMessages(messages);
  } catch (e) {
    console.error("Erreur messages admin", e);
  }
}

function renderAdminMessages(messages) {
  const area = document.getElementById('admin-chat-messages');
  if (!area) return;
  
  const isAtBottom = area.scrollHeight - area.scrollTop === area.clientHeight;
  
  area.innerHTML = '';
  if (messages.length === 0) {
    area.innerHTML = '<div style="margin:auto; color:#94A3B8; font-size:14px;">Envoyez un message pour démarrer</div>';
    return;
  }

  messages.forEach(m => {
    const isAdmin = m.sender_type === 'admin';
    const bubble = document.createElement('div');
    bubble.style.maxWidth = '70%';
    bubble.style.padding = '10px 14px';
    bubble.style.borderRadius = '12px';
    bubble.style.fontSize = '14px';
    bubble.style.lineHeight = '1.4';
    bubble.style.wordBreak = 'break-word';

    if (isAdmin) {
      bubble.style.background = '#2563EB';
      bubble.style.color = 'white';
      bubble.style.alignSelf = 'flex-end';
      bubble.style.borderBottomRightRadius = '4px';
    } else {
      bubble.style.background = 'white';
      bubble.style.color = '#0F172A';
      bubble.style.border = '1px solid #e2e8f0';
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

async function sendAdminChatMessage() {
  if (!activeAdminChatConvId) return;
  const input = document.getElementById('admin-chat-input');
  const content = input.value.trim();
  if (!content) return;

  const token = localStorage.getItem('adminToken');
  input.value = '';

  try {
    await fetch(`${ADMIN_CHAT_API}/${activeAdminChatConvId}/message`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    fetchAdminChatMessages();
    setTimeout(() => {
        const area = document.getElementById('admin-chat-messages');
        if (area) area.scrollTop = area.scrollHeight;
    }, 100);
  } catch (e) {
    console.error("Erreur envoi admin", e);
  }
}

async function closeAdminChat() {
  if (!activeAdminChatConvId || !confirm("Voulez-vous vraiment clôturer cette demande ?")) return;
  const token = localStorage.getItem('adminToken');
  try {
    await fetch(`${ADMIN_CHAT_API}/${activeAdminChatConvId}/close`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Clear view
    activeAdminChatConvId = null;
    document.getElementById('admin-chat-title').innerText = 'Sélectionnez une conversation';
    document.getElementById('admin-chat-subtitle').innerText = '';
    document.getElementById('admin-chat-messages').innerHTML = '<div style="margin:auto; color:#94A3B8; font-size:14px;">Aucune conversation sélectionnée</div>';
    document.getElementById('admin-chat-input-area').style.display = 'none';
    document.getElementById('btn-close-chat').style.display = 'none';
    if (adminChatPollInterval) clearInterval(adminChatPollInterval);
    
    loadAdminChats();
  } catch (e) {
    console.error("Erreur clôture", e);
  }
}

// Ensure the interval is cleared when leaving the view
const originalShowAdminView = window.showAdminView;
if (originalShowAdminView) {
  window.showAdminView = function(viewId, element) {
    if (viewId !== 'view-chat' && adminChatPollInterval) {
      clearInterval(adminChatPollInterval);
    }
    originalShowAdminView(viewId, element);
  }
}
