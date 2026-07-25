// frontend/assets/js/notifications.js

let unreadCount = 0;
let isPolling = false;
let notificationPollInterval = null;
let latestNotifIds = new Set();

// The base endpoint
const NOTIF_API_URL = '/api/notifications';

function getAuthToken() {
  return localStorage.getItem('fintech_token');
}

// Biscuits de notifications (Toast)
function showToast(title, message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.zIndex = '99999';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'succes' ? '#10B981' : type === 'erreur' ? '#EF4444' : type === 'alerte' ? '#F59E0B' : '#3B82F6';
  
  toast.style.background = bgColor;
  toast.style.color = '#fff';
  toast.style.padding = '16px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
  toast.style.fontFamily = 'Inter, sans-serif';
  toast.style.fontSize = '14px';
  toast.style.minWidth = '250px';
  toast.style.maxWidth = '350px';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'opacity 0.3s, transform 0.3s';
  toast.style.cursor = 'pointer';

  toast.innerHTML = `
    <div style="font-weight:600; margin-bottom:4px;">${title}</div>
    <div style="font-size:13px; opacity:0.9;">${message}</div>
  `;

  // Click to dismiss
  toast.onclick = () => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  };

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
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
    
    // Check for NEW notifications
    let newNotifs = false;
    notifs.forEach(n => {
      if (!n.lu && !latestNotifIds.has(n.id)) {
        newNotifs = true;
        // Don't show toast on very first load (when latestNotifIds is empty, unless we want to bombard them)
        if (latestNotifIds.size > 0) {
          showToast(n.titre, n.message, n.type || 'info');
        }
      }
      latestNotifIds.add(n.id);
    });

    if (newNotifs && latestNotifIds.size > notifs.length) { 
       // actually the check above `latestNotifIds.size > 0` before adding the new ones handles the first load bombard issue.
    }

    // Si on a de nouvelles notifications, on actualise la page dynamiquement
    if (newNotifs && latestNotifIds.size > 1) { // >1 to avoid reloading immediately on first boot if there are existing unread
        if (typeof window.checkAuth === 'function') {
            window.checkAuth();
        }
    }

    if (currentUnread > unreadCount && unreadCount !== 0) {
      playNotificationSound();
    } else if (newNotifs && unreadCount !== 0) {
      playNotificationSound();
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

  // Filter out read notifications
  notifs = notifs.filter(n => !n.lu);

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
    
    div.onclick = (e) => { 
      e.stopPropagation(); 
      showNotificationModal(n.id, n.titre, n.message); 
    };
    
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

function showNotificationModal(id, titre, message) {
  let modal = document.getElementById('notif-read-modal');
  if (!modal) {
    const modalHtml = `
      <div id="notif-read-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999999; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
        <div style="background:var(--bg-body, #fff); border-radius:16px; padding:32px; max-width:450px; width:90%; box-shadow:0 20px 40px rgba(0,0,0,0.2);">
          <h3 id="notif-read-title" style="margin:0 0 16px; font-size:20px; font-weight:700; color:#0F172A;"></h3>
          <p id="notif-read-message" style="margin:0 0 24px; font-size:15px; color:#475569; line-height:1.5; white-space:pre-wrap;"></p>
          <button onclick="closeNotificationModal()" style="background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:10px; font-weight:600; width:100%; cursor:pointer;">Fermer</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modal = document.getElementById('notif-read-modal');
  }
  document.getElementById('notif-read-title').innerText = titre;
  document.getElementById('notif-read-message').innerText = message;
  modal.style.display = 'flex';
  
  // Mark as read behind the scenes, and hide dropdown
  const dropdown = document.getElementById('notification-dropdown');
  if (dropdown) dropdown.style.display = 'none';
  markAsRead(id);
}

window.closeNotificationModal = function() {
  const modal = document.getElementById('notif-read-modal');
  if (modal) modal.style.display = 'none';
};

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
