// Système de traduction i18n
const I18N = {
  currentLang: localStorage.getItem('fintech_lang') || 'fr',
  dict: {},
  nodesToTranslate: [],
  attributesToTranslate: [],

  init: async function() {
    this.setupLanguageSwitcher();
    this.scanDOM(document.body);
    if (this.currentLang !== 'fr') {
      await this.setLanguage(this.currentLang);
    }
    this.setupObserver();
  },

  scanDOM: function(rootNode = document.body) {
    // Collect text nodes
    const walk = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null, false);
    let n;
    while ((n = walk.nextNode())) {
      if (n.parentElement && n.parentElement.tagName !== 'SCRIPT' && n.parentElement.tagName !== 'STYLE' && n.parentElement.tagName !== 'NOSCRIPT') {
        const text = n.nodeValue;
        const trimmed = text.replace(/\\s+/g, ' ').trim();
        if (trimmed.length > 1 && !/^[0-9\\s€$.,;:+\\*/=()!%_a-zA-Z\\-]+$/.test(trimmed) && !trimmed.includes('{')) {
          if (!n._originalText) n._originalText = trimmed;
          if (!this.nodesToTranslate.includes(n)) this.nodesToTranslate.push(n);
        }
      }
    }

    // Collect placeholders
    const rootEl = rootNode.nodeType === Node.ELEMENT_NODE ? rootNode : document.body;
    
    rootEl.querySelectorAll?.('[placeholder]').forEach(el => {
      if (!el._originalPlaceholder) el._originalPlaceholder = el.placeholder.replace(/\s+/g, ' ').trim();
      if (!this.attributesToTranslate.find(a => a.el === el && a.attr === 'placeholder')) {
        this.attributesToTranslate.push({ el, attr: 'placeholder' });
      }
    });

    // Collect buttons with value
    rootEl.querySelectorAll?.('input[type="submit"], input[type="button"]').forEach(el => {
      if (!el._originalValue) el._originalValue = el.value.replace(/\s+/g, ' ').trim();
      if (!this.attributesToTranslate.find(a => a.el === el && a.attr === 'value')) {
        this.attributesToTranslate.push({ el, attr: 'value' });
      }
    });
  },

  setupObserver: function() {
    this.observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      mutations.forEach(m => {
        if (m.addedNodes.length > 0) {
          m.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              if (node.id === 'i18n-switcher' || (node.classList && node.classList.contains('i18n-option'))) return; // Skip translation UI
              this.scanDOM(node);
              shouldTranslate = true;
            }
          });
        }
      });
      if (shouldTranslate && this.currentLang !== 'fr') {
        this.applyTranslations();
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
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
        let trans = this.dict[orig] || orig;
        if (typeof trans === 'string' && trans.length > 0) {
          trans = trans.charAt(0).toUpperCase() + trans.slice(1);
        }
        const current = n._currentTrans || orig;
        n.nodeValue = n.nodeValue.replace(current, trans);
        n._currentTrans = trans;
      }
    });

    this.attributesToTranslate.forEach(item => {
      const orig = item.el['_original' + item.attr.charAt(0).toUpperCase() + item.attr.slice(1)];
      if (orig) {
        let trans = this.dict[orig] || orig;
        if (typeof trans === 'string' && trans.length > 0) {
          trans = trans.charAt(0).toUpperCase() + trans.slice(1);
        }
        item.el[item.attr] = trans;
      }
    });
  },

  setupLanguageSwitcher: function() {
    const langs = [
      { code: 'fr', flag: '<img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" style="border-radius:2px;">', label: 'Français' },
      { code: 'en', flag: '<img src="https://flagcdn.com/w20/gb.png" width="16" alt="EN" style="border-radius:2px;">', label: 'English' },
      { code: 'de', flag: '<img src="https://flagcdn.com/w20/de.png" width="16" alt="DE" style="border-radius:2px;">', label: 'Deutsch' },
      { code: 'es', flag: '<img src="https://flagcdn.com/w20/es.png" width="16" alt="ES" style="border-radius:2px;">', label: 'Español' },
      { code: 'da', flag: '<img src="https://flagcdn.com/w20/dk.png" width="16" alt="DK" style="border-radius:2px;">', label: 'Dansk' },
      { code: 'hu', flag: '<img src="https://flagcdn.com/w20/hu.png" width="16" alt="HU" style="border-radius:2px;">', label: 'Magyar' },
      { code: 'hr', flag: '<img src="https://flagcdn.com/w20/hr.png" width="16" alt="HR" style="border-radius:2px;">', label: 'Hrvatski' }
    ];

    const switcherHTML = `
      <div id="i18n-switcher" style="position:relative; font-family:'Inter',sans-serif; display:inline-block;">
        <button id="i18n-btn" style="background:white; border:1px solid #E2E8F0; padding:10px 15px; border-radius:30px; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.05); display:flex; align-items:center; gap:8px; font-weight:600; font-size:14px; color:#0F172A;">
          <span id="i18n-current-flag" style="display:flex;"><img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" style="border-radius:2px;"></span> <span id="i18n-current-code">FR</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div id="i18n-menu" style="display:none; position:absolute; top:100%; margin-top:10px; right:0; background:white; border:1px solid #E2E8F0; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); width:150px; overflow:hidden;">
          ${langs.map(l => `
            <div class="i18n-option" data-lang="${l.code}" style="padding:10px 15px; cursor:pointer; display:flex; align-items:center; gap:10px; font-size:14px; color:#475569; transition:0.2s;">
              <span>${l.flag}</span> <span>${l.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const containers = document.querySelectorAll('.i18n-container, #i18n-container');
    if (containers.length > 0) {
      containers.forEach(c => c.innerHTML = switcherHTML);
    } else {
      const floatingSwitcher = switcherHTML.replace('position:relative;', 'position:fixed; bottom:90px; right:20px; z-index:100;');
      document.body.insertAdjacentHTML('beforeend', floatingSwitcher);
    }

    document.querySelectorAll('#i18n-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const menu = e.currentTarget.nextElementSibling;
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
    });

    document.querySelectorAll('.i18n-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        const lang = e.currentTarget.getAttribute('data-lang');
        this.setLanguage(lang);
        document.querySelectorAll('#i18n-menu').forEach(m => m.style.display = 'none');
      });
      opt.addEventListener('mouseover', e => e.currentTarget.style.background = '#F8FAFC');
      opt.addEventListener('mouseout', e => e.currentTarget.style.background = 'white');
    });

    this.updateSwitcherUI();
  },

  updateSwitcherUI: function() {
    const flags = { 
      fr: '<img src="https://flagcdn.com/w20/fr.png" width="16" alt="FR" style="border-radius:2px;">', 
      en: '<img src="https://flagcdn.com/w20/gb.png" width="16" alt="EN" style="border-radius:2px;">', 
      de: '<img src="https://flagcdn.com/w20/de.png" width="16" alt="DE" style="border-radius:2px;">', 
      es: '<img src="https://flagcdn.com/w20/es.png" width="16" alt="ES" style="border-radius:2px;">', 
      da: '<img src="https://flagcdn.com/w20/dk.png" width="16" alt="DK" style="border-radius:2px;">', 
      hu: '<img src="https://flagcdn.com/w20/hu.png" width="16" alt="HU" style="border-radius:2px;">', 
      hr: '<img src="https://flagcdn.com/w20/hr.png" width="16" alt="HR" style="border-radius:2px;">' 
    };
    document.querySelectorAll('#i18n-current-flag').forEach(btnFlag => {
      btnFlag.innerHTML = flags[this.currentLang] || flags['fr'];
    });
    document.querySelectorAll('#i18n-current-code').forEach(btnCode => {
      btnCode.innerText = this.currentLang.toUpperCase();
    });
    
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
