// frontend/assets/js/notifications.js

let unreadCount = 0;
let isPolling = false;
let notificationPollInterval = null;

// The base endpoint
const NOTIF_API_URL = '/api/notifications';

function getAuthToken() {
  if (window.location.pathname.includes('admin')) {
    return localStorage.getItem('adminToken');
  }
  return localStorage.getItem('token');
}

// Jouer un son (synthesizer Web Audio API)
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Note A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn("La lecture audio a été bloquée par le navigateur ou n'est pas supportée.", e);
  }
}

// Afficher/Cacher le dropdown
function toggleNotificationDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('notification-dropdown');
  if (dropdown) {
    // Check if right offset needs adjustment depending on screen
    if (window.innerWidth < 768) {
      dropdown.style.right = '10px';
      dropdown.style.top = '60px';
      dropdown.style.width = 'calc(100% - 20px)';
    } else {
      dropdown.style.right = '40px';
      dropdown.style.top = '70px';
      dropdown.style.width = '350px';
    }
    
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

// Fermer le dropdown si on clique en dehors
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notification-dropdown');
  
  if (dropdown && dropdown.style.display === 'block') {
    if (!dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
});

async function fetchNotifications() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(NOTIF_API_URL, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const notifs = await res.json();
    
    let currentUnread = notifs.filter(n => !n.lu).length;
    
    // Si on a plus de notifications non lues qu'avant, on joue le son
    if (currentUnread > unreadCount && unreadCount !== 0) {
      playNotificationSound();
    } else if (currentUnread > 0 && unreadCount === 0) {
      // First load, let's not play sound to avoid annoying the user on refresh.
      // Sound will play only for NEW incoming notifications.
    }
    
    unreadCount = currentUnread;
    updateNotificationUI(notifs);
  } catch (err) {
    console.error("Erreur polling notifs:", err);
  }
}

function updateNotificationUI(notifs) {
  // Update badges
  const badges = document.querySelectorAll('.notif-badge');
  badges.forEach(b => {
    if (unreadCount > 0) {
      b.style.display = 'flex';
      b.innerText = unreadCount > 9 ? '9+' : unreadCount;
    } else {
      b.style.display = 'none';
    }
  });

  // Update List in dropdown
  const listContainer = document.getElementById('notification-list');
  if (!listContainer) return;
  
  if (notifs.length === 0) {
    listContainer.innerHTML = '<div style="padding:15px; text-align:center; color:#94A3B8; font-size:13px;">Aucune notification</div>';
    return;
  }
  
  listContainer.innerHTML = '';
  notifs.forEach(n => {
    const div = document.createElement('div');
    div.className = `notif-item ${!n.lu ? 'unread' : ''}`;
    div.style.padding = '12px 15px';
    div.style.borderBottom = '1px solid #e2e8f0';
    div.style.cursor = 'pointer';
    div.style.backgroundColor = !n.lu ? '#eff6ff' : '#ffffff';
    div.style.transition = 'background 0.2s';
    
    div.onclick = (e) => { e.stopPropagation(); markAsRead(n.id); };
    
    const date = new Date(n.created_at).toLocaleString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR'), { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
    
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:13px; font-weight:600; color:#0F172A;">${n.titre}</span>
        ${!n.lu ? '<span style="width:8px;height:8px;background:#3b82f6;border-radius:50%; flex-shrink:0;"></span>' : ''}
      </div>
      <p style="font-size:12px; color:#475569; margin:0 0 6px 0;">${n.message}</p>
      <div style="font-size:10px; color:#94A3B8;">${date}</div>
    `;
    listContainer.appendChild(div);
  });
}

async function markAsRead(id) {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch(`${NOTIF_API_URL}/${id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchNotifications(); // Refresh list
  } catch (err) {
    console.error("Erreur mark read:", err);
  }
}

async function markAllAsRead() {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch(`${NOTIF_API_URL}/read-all`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchNotifications(); // Refresh list
  } catch (err) {
    console.error("Erreur mark all read:", err);
  }
}

// Initialisation
function initNotifications() {
  if (isPolling) return;
  isPolling = true;
  
  // Inject Dropdown HTML in body if not exists
  if (!document.getElementById('notification-dropdown')) {
    const dropdownHtml = `
      <div id="notification-dropdown" style="display:none; position:fixed; right:40px; top:70px; width:350px; background:#fff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); border:1px solid #e2e8f0; z-index:9999; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #e2e8f0; background:#f8fafc;">
          <span style="font-weight:600; color:#0F172A;">Notifications</span>
          <span onclick="markAllAsRead()" style="font-size:12px; color:#3b82f6; cursor:pointer; font-weight:500;">Tout marquer lu</span>
        </div>
        <div id="notification-list" style="max-height:400px; overflow-y:auto;">
          <div style="padding:15px; text-align:center; color:#94A3B8; font-size:13px;">Chargement...</div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', dropdownHtml);
  }

  fetchNotifications();
  notificationPollInterval = setInterval(fetchNotifications, 15000);
}

// Auto init on load if token is present
document.addEventListener('DOMContentLoaded', () => {
  if (getAuthToken()) {
    initNotifications();
  }
});

// We can export this to global scope for onclick handlers
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.initNotifications = initNotifications;
window.fetchNotifications = fetchNotifications;
