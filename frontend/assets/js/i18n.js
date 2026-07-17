// Système de traduction i18n
const I18N = {
  currentLang: localStorage.getItem('fintech_lang') || 'fr',
  dict: {},
  nodesToTranslate: [],
  attributesToTranslate: [],

  init: async function() {
    this.setupLanguageSwitcher();
    this.scanDOM();
    if (this.currentLang !== 'fr') {
      await this.setLanguage(this.currentLang);
    }
  },

  scanDOM: function() {
    // Collect text nodes
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let n;
    while ((n = walk.nextNode())) {
      if (n.parentElement && n.parentElement.tagName !== 'SCRIPT' && n.parentElement.tagName !== 'STYLE' && n.parentElement.tagName !== 'NOSCRIPT') {
        const text = n.nodeValue;
        const trimmed = text.replace(/\\s+/g, ' ').trim();
        if (trimmed.length > 1 && !/^[0-9\\s€$.,;:\\-+*/=()!%_a-zA-Z0-9]$/.test(trimmed) && !trimmed.includes('{')) {
          if (!n._originalText) n._originalText = trimmed;
          this.nodesToTranslate.push(n);
        }
      }
    }

    // Collect placeholders
    document.querySelectorAll('[placeholder]').forEach(el => {
      if (!el._originalPlaceholder) el._originalPlaceholder = el.placeholder.replace(/\\s+/g, ' ').trim();
      this.attributesToTranslate.push({ el, attr: 'placeholder' });
    });

    // Collect buttons with value
    document.querySelectorAll('input[type="submit"], input[type="button"]').forEach(el => {
      if (!el._originalValue) el._originalValue = el.value.replace(/\\s+/g, ' ').trim();
      this.attributesToTranslate.push({ el, attr: 'value' });
    });
  },

  setLanguage: async function(lang) {
    this.currentLang = lang;
    localStorage.setItem('fintech_lang', lang);
    
    if (lang === 'fr') {
      this.dict = {};
      this.applyTranslations();
      this.updateSwitcherUI();
      return;
    }

    try {
      // Determine base path depending on current page location
      const basePath = window.location.pathname.includes('/pages/') ? '../assets/locales/' : './frontend/assets/locales/';
      const res = await fetch(basePath + lang + '.json');
      if (res.ok) {
        this.dict = await res.json();
        this.applyTranslations();
      } else {
        console.warn('Traduction introuvable pour : ' + lang);
      }
    } catch (e) {
      console.error('Erreur de chargement du dictionnaire', e);
    }
    
    this.updateSwitcherUI();
  },

  applyTranslations: function() {
    this.nodesToTranslate.forEach(n => {
      const orig = n._originalText;
      if (orig) {
        const trans = this.dict[orig] || orig;
        n.nodeValue = n.nodeValue.replace(orig, trans);
        // update memory of what it is now, so we can replace it next time
        n._originalText = trans; // Wait, if we switch fr -> en -> de, we need the original French key!
      }
    });

    this.attributesToTranslate.forEach(item => {
      const orig = item.el['_original' + item.attr.charAt(0).toUpperCase() + item.attr.slice(1)];
      if (orig) {
        const trans = this.dict[orig] || orig;
        item.el[item.attr] = trans;
      }
    });
  },

  setupLanguageSwitcher: function() {
    const langs = [
      { code: 'fr', flag: '🇫🇷', label: 'Français' },
      { code: 'en', flag: '🇬🇧', label: 'English' },
      { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
      { code: 'es', flag: '🇪🇸', label: 'Español' },
      { code: 'da', flag: '🇩🇰', label: 'Dansk' },
      { code: 'hu', flag: '🇭🇺', label: 'Magyar' },
      { code: 'hr', flag: '🇭🇷', label: 'Hrvatski' }
    ];

    const switcherHTML = \`
      <div id="i18n-switcher" style="position:fixed; bottom:90px; right:20px; z-index:100; font-family:'Inter',sans-serif;">
        <button id="i18n-btn" style="background:white; border:1px solid #E2E8F0; padding:10px 15px; border-radius:30px; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.05); display:flex; align-items:center; gap:8px; font-weight:600; font-size:14px; color:#0F172A;">
          <span id="i18n-current-flag">🇫🇷</span> <span id="i18n-current-code">FR</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div id="i18n-menu" style="display:none; position:absolute; bottom:50px; right:0; background:white; border:1px solid #E2E8F0; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); width:150px; overflow:hidden;">
          \${langs.map(l => \`
            <div class="i18n-option" data-lang="\${l.code}" style="padding:10px 15px; cursor:pointer; display:flex; align-items:center; gap:10px; font-size:14px; color:#475569; transition:0.2s;">
              <span>\${l.flag}</span> <span>\${l.label}</span>
            </div>
          \`).join('')}
        </div>
      </div>
    \`;

    document.body.insertAdjacentHTML('beforeend', switcherHTML);

    const btn = document.getElementById('i18n-btn');
    const menu = document.getElementById('i18n-menu');
    
    btn.addEventListener('click', () => {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('.i18n-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        const lang = e.currentTarget.getAttribute('data-lang');
        this.setLanguage(lang);
        menu.style.display = 'none';
      });
      opt.addEventListener('mouseover', e => e.currentTarget.style.background = '#F8FAFC');
      opt.addEventListener('mouseout', e => e.currentTarget.style.background = 'white');
    });

    this.updateSwitcherUI();
  },

  updateSwitcherUI: function() {
    const flags = { fr: '🇫🇷', en: '🇬🇧', de: '🇩🇪', es: '🇪🇸', da: '🇩🇰', hu: '🇭🇺', hr: '🇭🇷' };
    const btnFlag = document.getElementById('i18n-current-flag');
    const btnCode = document.getElementById('i18n-current-code');
    if (btnFlag) btnFlag.innerText = flags[this.currentLang] || '🇫🇷';
    if (btnCode) btnCode.innerText = this.currentLang.toUpperCase();
    
    document.querySelectorAll('.i18n-option').forEach(opt => {
      if (opt.getAttribute('data-lang') === this.currentLang) {
        opt.style.fontWeight = '700';
        opt.style.color = '#0F172A';
        opt.style.background = '#F1F5F9';
      } else {
        opt.style.fontWeight = '500';
        opt.style.color = '#475569';
        opt.style.background = 'white';
      }
    });
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => I18N.init(), 500); // delay to let dynamic content load
});
