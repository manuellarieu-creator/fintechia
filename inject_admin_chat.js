const fs = require('fs');

function injectAdminChat() {
  let c = fs.readFileSync('./frontend/pages/admin-dashboard.html', 'utf8');

  if (!c.includes('view-chat')) {
    // Insert nav-item (we match the Supervision item to append after it)
    const supervisionNav = `<a href="#" class="nav-item" onclick="showAdminView('view-supervision', this)">\r\n                    <i class="ti ti-eye"></i>\r\n                    <span>Supervision live</span>\r\n                </a>`;
    const supervisionNavUnix = `<a href="#" class="nav-item" onclick="showAdminView('view-supervision', this)">\n                    <i class="ti ti-eye"></i>\n                    <span>Supervision live</span>\n                </a>`;
    
    const newNav = `<a href="#" class="nav-item" onclick="showAdminView('view-supervision', this)">
                    <i class="ti ti-eye"></i>
                    <span>Supervision live</span>
                </a>
                <a href="#" class="nav-item" onclick="showAdminView('view-chat', this); loadAdminChats();">
                    <i class="ti ti-messages"></i>
                    <span>Messagerie Live</span>
                </a>`;
                
    if (c.includes(supervisionNav)) {
      c = c.replace(supervisionNav, newNav);
    } else if (c.includes(supervisionNavUnix)) {
      c = c.replace(supervisionNavUnix, newNav);
    }

    // Insert view-chat container before closing main
    const chatViewHtml = `
            <!-- VUE CHAT SUPPORT -->
            <div id="view-chat" class="admin-view" style="display:none; height:calc(100vh - 100px); flex-direction:row; background:white; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
              <!-- Liste des conversations -->
              <div style="width:300px; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; background:#f8fafc;">
                <div style="padding:20px; border-bottom:1px solid #e2e8f0; font-weight:600;">Conversations actives</div>
                <div id="admin-chat-list" style="flex:1; overflow-y:auto; padding:10px;">
                  <div style="padding:20px; text-align:center; color:#94A3B8; font-size:13px;">Chargement...</div>
                </div>
              </div>
              <!-- Zone de message -->
              <div style="flex:1; display:flex; flex-direction:column; background:#ffffff;">
                <div id="admin-chat-header" style="padding:20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h3 style="margin:0; font-size:16px; color:#0F172A;" id="admin-chat-title">Sélectionnez une conversation</h3>
                    <p style="margin:4px 0 0; font-size:13px; color:#64748B;" id="admin-chat-subtitle"></p>
                  </div>
                  <button id="btn-close-chat" style="display:none; padding:8px 12px; border-radius:6px; border:1px solid #ef4444; color:#ef4444; background:transparent; font-weight:600; cursor:pointer;" onclick="closeAdminChat()">Fermer</button>
                </div>
                <div id="admin-chat-messages" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:10px; background:#f1f5f9;">
                  <div style="margin:auto; color:#94A3B8; font-size:14px;">Aucune conversation sélectionnée</div>
                </div>
                <div id="admin-chat-input-area" style="padding:20px; border-top:1px solid #e2e8f0; background:#ffffff; display:none; gap:15px; align-items:center;">
                  <textarea id="admin-chat-input" rows="2" placeholder="Répondez ici..." style="flex:1; padding:12px; border:1px solid #cbd5e1; border-radius:8px; resize:none; font-family:'Inter', sans-serif;" onkeypress="if(event.key==='Enter' && !event.shiftKey) { event.preventDefault(); sendAdminChatMessage(); }"></textarea>
                  <button onclick="sendAdminChatMessage()" style="background:#2563EB; color:white; border:none; padding:0 24px; height:48px; border-radius:8px; font-weight:600; cursor:pointer;">Envoyer</button>
                </div>
              </div>
            </div>
`;
    c = c.replace('        </main>', chatViewHtml + '\n        </main>');
    fs.writeFileSync('./frontend/pages/admin-dashboard.html', c, 'utf8');
    console.log('Admin Chat UI inserted');
  } else {
    console.log('Admin Chat UI already present');
  }
}

injectAdminChat();
