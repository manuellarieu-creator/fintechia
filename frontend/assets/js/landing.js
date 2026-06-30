function setLang(lang) {
  document.body.className = 'lang-' + lang;
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('overlay').classList.add('on');
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('on');
}

function switchTab(tabId) {
  document.querySelectorAll('.products-layout').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.ptab').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById('tab-' + tabId).style.display = 'grid';
  event.currentTarget.classList.add('active');
}
