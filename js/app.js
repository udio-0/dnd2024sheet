/* =============================================
   APP BOOTSTRAP
   Initializes router, loads data, coordinates modules
   ============================================= */
'use strict';

// Blur any datalist input after a selection is made, app-wide
document.addEventListener('change', e => {
  if (e.target.tagName === 'INPUT' && e.target.getAttribute('list')) e.target.blur();
});

(function () {
  // ---- THEME ----
  // Each theme defines ALL CSS custom properties to ensure consistent contrast.
  // Roles: --red=primary accent/header bg, --gold=secondary accent/logo,
  //        --gold-light=text ON the dark topbar, --ink=main text ON parchment bg,
  //        --ink-light=secondary text, --ink-faint=placeholders/disabled.
  const THEMES = {
    // ===== LIGHT THEMES =====
    // 4 core colors: bg (card), accent (topbar/header), gold (secondary accent), ink (text)
    // Rules: topbar-bg=accent, tab-bar=accent darkened, body-bg=accent very dark, border=gold muted
    parchment: { dark: false, label: 'Parchment', bg: '#FDF1DC', accent: '#58180D',
      vars: {
        '--red':'#58180D', '--red-accent':'#8B2A1A',
        '--gold':'#C9AD6A', '--gold-light':'#E8D5A3', '--gold-dark':'#8B7240',
        '--parchment':'#FDF1DC', '--parchment-dk':'#EDE0C8',
        '--ink':'#1A1208', '--ink-light':'#3D2B18', '--ink-faint':'#8B7355',
        '--white':'#FFFFFF', '--border':'#C4A87A',
        '--body-bg':'#2C1810', '--topbar-bg':'#58180D', '--tab-bar-bg':'#3B1108',
        '--combat-border':'#58180D', '--input-bg':'#FDF1DC',
        '--ac-bg':'#FFFFFF', '--ac-hover':'#FDF1DC',
      }},
    ivory: { dark: false, label: 'Ivory', bg: '#F6F8FF', accent: '#1B3A6B',
      vars: {
        '--red':'#1B3A6B', '--red-accent':'#2E5A9B',
        '--gold':'#9B7A28', '--gold-light':'#D8BC70', '--gold-dark':'#7A5C18',
        '--parchment':'#F6F8FF', '--parchment-dk':'#E8ECF8',
        '--ink':'#080A18', '--ink-light':'#1E2A48', '--ink-faint':'#6070A0',
        '--white':'#FFFFFF', '--border':'#A8B8D8',
        '--body-bg':'#0A1228', '--topbar-bg':'#1B3A6B', '--tab-bar-bg':'#102048',
        '--combat-border':'#1B3A6B', '--input-bg':'#F6F8FF',
        '--ac-bg':'#FFFFFF', '--ac-hover':'#EEF0FF',
      }},
    sage: { dark: false, label: 'Sage', bg: '#F2F8EE', accent: '#1E4A1A',
      vars: {
        '--red':'#1E4A1A', '--red-accent':'#2E6828',
        '--gold':'#7A8830', '--gold-light':'#C8D080', '--gold-dark':'#5A6020',
        '--parchment':'#F2F8EE', '--parchment-dk':'#E0ECD8',
        '--ink':'#060E06', '--ink-light':'#183018', '--ink-faint':'#507050',
        '--white':'#FFFFFF', '--border':'#A0C098',
        '--body-bg':'#0A1A08', '--topbar-bg':'#1E4A1A', '--tab-bar-bg':'#143210',
        '--combat-border':'#1E4A1A', '--input-bg':'#F2F8EE',
        '--ac-bg':'#FFFFFF', '--ac-hover':'#E8F4E0',
      }},
    rose: { dark: false, label: 'Rose', bg: '#FFF0F6', accent: '#6A1040',
      vars: {
        '--red':'#6A1040', '--red-accent':'#901858',
        '--gold':'#C06840', '--gold-light':'#F0A878', '--gold-dark':'#904828',
        '--parchment':'#FFF0F6', '--parchment-dk':'#F8D8E8',
        '--ink':'#160610', '--ink-light':'#401030', '--ink-faint':'#A07090',
        '--white':'#FFFFFF', '--border':'#E0A0C0',
        '--body-bg':'#200818', '--topbar-bg':'#6A1040', '--tab-bar-bg':'#480A2A',
        '--combat-border':'#6A1040', '--input-bg':'#FFF0F6',
        '--ac-bg':'#FFFFFF', '--ac-hover':'#FDE8F2',
      }},
    stone: { dark: false, label: 'Stone', bg: '#F4F6F8', accent: '#2A3C50',
      vars: {
        '--red':'#2A3C50', '--red-accent':'#3C5470',
        '--gold':'#7080A0', '--gold-light':'#C0C8E0', '--gold-dark':'#506080',
        '--parchment':'#F4F6F8', '--parchment-dk':'#E4E8EE',
        '--ink':'#080C18', '--ink-light':'#1A2838', '--ink-faint':'#607080',
        '--white':'#FFFFFF', '--border':'#A8B8CC',
        '--body-bg':'#0A1220', '--topbar-bg':'#2A3C50', '--tab-bar-bg':'#1A2838',
        '--combat-border':'#2A3C50', '--input-bg':'#F4F6F8',
        '--ac-bg':'#FFFFFF', '--ac-hover':'#ECF0F4',
      }},
    // ===== DARK THEMES =====
    // 4 swatch colors: bg, accent (--red / block borders), gold (highlights), ink (text)
    // topbar-bg = darker shade of bg hue (derived, not a 5th color)
    dungeon: { dark: true, label: 'Dungeon', bg: '#1E1E2E', accent: '#8B3A3A',
      vars: {
        '--red':'#8B3A3A', '--red-accent':'#B34848',
        '--gold':'#D4B872', '--gold-light':'#F0DCA0', '--gold-dark':'#A08850',
        '--parchment':'#1E1E2E', '--parchment-dk':'#181826',
        '--ink':'#E8E0D0', '--ink-light':'#C0B090', '--ink-faint':'#806858',
        '--white':'#2A2A40', '--border':'#3A3858',
        '--body-bg':'#0E0E1C', '--topbar-bg':'#16162A', '--tab-bar-bg':'#101020',
        '--combat-border':'#8B3A3A', '--input-bg':'#262638',
        '--ac-bg':'#2A2A40', '--ac-hover':'#323250',
      }},
    abyss: { dark: true, label: 'Abyss', bg: '#1A1808', accent: '#986020',
      vars: {
        '--red':'#986020', '--red-accent':'#C07828',
        '--gold':'#E0A828', '--gold-light':'#F8D060', '--gold-dark':'#A07018',
        '--parchment':'#1A1808', '--parchment-dk':'#120E06',
        '--ink':'#F0D888', '--ink-light':'#C8A850', '--ink-faint':'#806830',
        '--white':'#222010', '--border':'#3A3018',
        '--body-bg':'#0C0A04', '--topbar-bg':'#100E06', '--tab-bar-bg':'#0A0804',
        '--combat-border':'#986020', '--input-bg':'#201E0A',
        '--ac-bg':'#222010', '--ac-hover':'#2C2A14',
      }},
    crimson: { dark: true, label: 'Crimson', bg: '#1C0808', accent: '#901818',
      vars: {
        '--red':'#901818', '--red-accent':'#B82020',
        '--gold':'#E8B820', '--gold-light':'#FFD860', '--gold-dark':'#B08010',
        '--parchment':'#1C0808', '--parchment-dk':'#140606',
        '--ink':'#F8E8D0', '--ink-light':'#D0B890', '--ink-faint':'#906858',
        '--white':'#2C1010', '--border':'#401818',
        '--body-bg':'#0A0202', '--topbar-bg':'#120404', '--tab-bar-bg':'#0C0404',
        '--combat-border':'#901818', '--input-bg':'#220E0E',
        '--ac-bg':'#2C1010', '--ac-hover':'#381818',
      }},
    emerald: { dark: true, label: 'Emerald', bg: '#081A08', accent: '#186A28',
      vars: {
        '--red':'#186A28', '--red-accent':'#209838',
        '--gold':'#58C858', '--gold-light':'#88E888', '--gold-dark':'#389838',
        '--parchment':'#081A08', '--parchment-dk':'#061406',
        '--ink':'#C8F0C0', '--ink-light':'#88C880', '--ink-faint':'#488040',
        '--white':'#0E2A0E', '--border':'#1A3A1A',
        '--body-bg':'#030E03', '--topbar-bg':'#041204', '--tab-bar-bg':'#030E03',
        '--combat-border':'#186A28', '--input-bg':'#0C1E0C',
        '--ac-bg':'#0E2A0E', '--ac-hover':'#143214',
      }},
    midnight: { dark: true, label: 'Midnight', bg: '#080A28', accent: '#2828A8',
      vars: {
        '--red':'#2828A8', '--red-accent':'#3838D0',
        '--gold':'#8888F0', '--gold-light':'#B8B8FF', '--gold-dark':'#5858C0',
        '--parchment':'#080A28', '--parchment-dk':'#06081E',
        '--ink':'#D8D8FF', '--ink-light':'#A0A0D8', '--ink-faint':'#5858A0',
        '--white':'#101230', '--border':'#1C2050',
        '--body-bg':'#030416', '--topbar-bg':'#04061A', '--tab-bar-bg':'#030414',
        '--combat-border':'#2828A8', '--input-bg':'#0E1030',
        '--ac-bg':'#101230', '--ac-hover':'#181848',
      }},
  };

  const FONTS = [
    { id: 'classic',  label: 'Classic',  title: "'Cinzel', serif",                    body: "'Crimson Text', Georgia, serif" },
    { id: 'elegant',  label: 'Elegant',  title: "'Playfair Display', Georgia, serif",  body: "'Libre Baskerville', Georgia, serif" },
    { id: 'fantasy',  label: 'Fantasy',  title: "'Uncial Antiqua', serif",             body: "'IM Fell English', Georgia, serif" },
    { id: 'modern',   label: 'Modern',   title: "'Raleway', sans-serif",               body: "'Nunito', sans-serif" },
    { id: 'refined',  label: 'Refined',  title: "'Cormorant Garamond', serif",         body: "'Lato', sans-serif" },
  ];

  const FONT_SIZES = [
    { id: 'xs',  label: 'XS',  value: '14px' },
    { id: 'sm',  label: 'S',   value: '15px' },
    { id: 'md',  label: 'M',   value: '16px' },
    { id: 'lg',  label: 'L',   value: '17px' },
    { id: 'xl',  label: 'XL',  value: '18px' },
  ];

  function initTheme() {
    const savedTheme = localStorage.getItem('dnd_theme_name') || 'parchment';
    const savedFont  = localStorage.getItem('dnd_font')       || 'classic';
    const savedSize  = localStorage.getItem('dnd_font_size')  || 'md';
    applyTheme(savedTheme);
    applyFont(savedFont);
    applyFontSize(savedSize);
    buildThemePanel();

    document.getElementById('btn-theme')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('theme-panel')?.classList.toggle('open');
      document.getElementById('roll-log-panel')?.classList.remove('open');
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#theme-menu')) {
        document.getElementById('theme-panel')?.classList.remove('open');
      }
    });
  }

  function applyTheme(name) {
    const t = THEMES[name];
    if (!t) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', t.dark ? 'dark' : 'light');
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem('dnd_theme_name', name);
    document.querySelectorAll('.theme-swatch').forEach(el =>
      el.classList.toggle('active', el.dataset.theme === name));
  }

  function applyFont(id) {
    const f = FONTS.find(x => x.id === id);
    if (!f) return;
    const root = document.documentElement;
    root.style.setProperty('--font-title', f.title);
    root.style.setProperty('--font-body', f.body);
    localStorage.setItem('dnd_font', id);
    document.querySelectorAll('.font-btn').forEach(el =>
      el.classList.toggle('active', el.dataset.font === id));
  }

  function applyFontSize(id) {
    const s = FONT_SIZES.find(x => x.id === id);
    if (!s) return;
    document.documentElement.style.setProperty('font-size', s.value);
    localStorage.setItem('dnd_font_size', id);
    document.querySelectorAll('.font-size-btn').forEach(el =>
      el.classList.toggle('active', el.dataset.size === id));
  }

  function buildThemePanel() {
    const lightEl = document.getElementById('light-swatches');
    const darkEl  = document.getElementById('dark-swatches');
    const fontEl  = document.getElementById('font-options');
    if (!lightEl || !darkEl || !fontEl) return;

    const savedTheme = localStorage.getItem('dnd_theme_name') || 'parchment';
    const savedFont  = localStorage.getItem('dnd_font')       || 'classic';

    Object.entries(THEMES).forEach(([key, t]) => {
      const colors = [t.bg, t.vars['--gold'], t.accent, t.vars['--ink'] || '#000'];
      const btn = document.createElement('button');
      btn.className = 'theme-swatch' + (key === savedTheme ? ' active' : '');
      btn.dataset.theme = key;
      const strip = colors.map(c => `<span class="swatch-color" style="background:${c}"></span>`).join('');
      btn.innerHTML = `<span class="swatch-strip">${strip}</span><span class="swatch-label">${t.label}</span>`;
      btn.addEventListener('click', () => applyTheme(key));
      (t.dark ? darkEl : lightEl).appendChild(btn);
    });

    FONTS.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'font-btn' + (f.id === savedFont ? ' active' : '');
      btn.dataset.font = f.id;
      btn.textContent = f.label;
      btn.style.fontFamily = f.title;
      btn.addEventListener('click', () => applyFont(f.id));
      fontEl.appendChild(btn);
    });

    const sizeEl = document.getElementById('font-size-options');
    const savedSize = localStorage.getItem('dnd_font_size') || 'md';
    if (sizeEl) {
      FONT_SIZES.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'font-size-btn' + (s.id === savedSize ? ' active' : '');
        btn.dataset.size = s.id;
        btn.textContent = s.label;
        btn.addEventListener('click', () => applyFontSize(s.id));
        sizeEl.appendChild(btn);
      });
    }
  }

  // 2024-era source codes (UA handled separately)
  const SOURCES_2024_SET = new Set(['XPHB', 'XDMG', 'XMM', 'EFA', 'LFL', 'ABH', 'FRHoF']);

  // True if a source is explicitly a 2024-era publication
  function is2024Source(src) { return SOURCES_2024_SET.has(src); }

  // True if a source is 2014-era (not 2024, not UA)
  function is2014Source(src) { return src !== 'UA2024' && !SOURCES_2024_SET.has(src); }

  function _refreshAll() {
    if (DndData.loaded) populateGlobalDataLists();
    if (document.getElementById('view-wizard')?.style.display !== 'none') {
      if (typeof Wizard !== 'undefined') Wizard.renderStep();
    }
  }

  // ---- UA TOGGLE ----
  function isUAEnabled() {
    return localStorage.getItem('dnd_show_ua') !== 'false';
  }

  function initUAToggle() {
    applyUAToggle(isUAEnabled());
    document.getElementById('btn-ua')?.addEventListener('click', () => {
      const next = !isUAEnabled();
      localStorage.setItem('dnd_show_ua', next ? 'true' : 'false');
      applyUAToggle(next);
      _refreshAll();
    });
  }

  function applyUAToggle(enabled) {
    const btn = document.getElementById('btn-ua');
    if (btn) btn.classList.toggle('ua-active', enabled);
    document.documentElement.setAttribute('data-ua', enabled ? 'on' : 'off');
  }

  // ---- 2024 TOGGLE ----
  function is2024Enabled() {
    return localStorage.getItem('dnd_show_2024') !== 'false';
  }

  function init2024Toggle() {
    apply2024Toggle(is2024Enabled());
    document.getElementById('btn-2024')?.addEventListener('click', () => {
      const turning2024Off = is2024Enabled();
      // Never allow both off — if 2014 is already off, turn it on first
      if (turning2024Off && !is2014Enabled()) {
        localStorage.setItem('dnd_show_2014', 'true');
        apply2014Toggle(true);
      }
      const next = !turning2024Off;
      localStorage.setItem('dnd_show_2024', next ? 'true' : 'false');
      apply2024Toggle(next);
      _refreshAll();
    });
  }

  function apply2024Toggle(enabled) {
    const btn = document.getElementById('btn-2024');
    if (btn) btn.classList.toggle('ua-active', enabled);
    document.documentElement.setAttribute('data-2024', enabled ? 'on' : 'off');
  }

  // ---- 2014 TOGGLE ----
  function is2014Enabled() {
    return localStorage.getItem('dnd_show_2014') === 'true';
  }

  function init2014Toggle() {
    apply2014Toggle(is2014Enabled());
    document.getElementById('btn-2014')?.addEventListener('click', () => {
      const turning2014Off = is2014Enabled();
      // Never allow both off — if 2024 is already off, turn it on first
      if (turning2014Off && !is2024Enabled()) {
        localStorage.setItem('dnd_show_2024', 'true');
        apply2024Toggle(true);
      }
      const next = !turning2014Off;
      localStorage.setItem('dnd_show_2014', next ? 'true' : 'false');
      apply2014Toggle(next);
      _refreshAll();
    });
  }

  function apply2014Toggle(enabled) {
    const btn = document.getElementById('btn-2014');
    if (btn) btn.classList.toggle('ua-active', enabled);
    document.documentElement.setAttribute('data-2014', enabled ? 'on' : 'off');
  }

  window.isUAEnabled = isUAEnabled;
  window.is2024Enabled = is2024Enabled;
  window.is2014Enabled = is2014Enabled;
  window.is2024Source = is2024Source;
  window.is2014Source = is2014Source;

  // ---- DATA LOADING ----
  let dataReady = false;
  let dataPromise = null;

  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = loadAllData(progress => {
      const el = document.getElementById('loading-text');
      if (el) el.textContent = progress;
      const fill = document.getElementById('loading-fill');
      if (!fill) return;
      let pct = 5;
      if (progress.includes('base items')) pct = 8;
      else if (progress.includes('items')) pct = 15;
      else if (progress.includes('spell index')) pct = 20;
      else if (progress.includes('spells (')) {
        const m = progress.match(/(\d+)\/(\d+)/);
        if (m) pct = 20 + Math.floor((parseInt(m[1]) / parseInt(m[2])) * 30);
      }
      else if (progress.includes('spell class')) pct = 55;
      else if (progress.includes('species')) pct = 60;
      else if (progress.includes('backgrounds')) pct = 65;
      else if (progress.includes('feats')) pct = 70;
      else if (progress.includes('class index')) pct = 75;
      else if (progress.includes('classes (')) {
        const m = progress.match(/(\d+)\/(\d+)/);
        if (m) pct = 75 + Math.floor((parseInt(m[1]) / parseInt(m[2])) * 15);
      }
      else if (progress.includes('character options')) pct = 93;
      else if (progress === 'Ready!') pct = 100;
      fill.style.width = pct + '%';
    }).then(() => {
      dataReady = true;
      populateGlobalDataLists();
      // If the wizard is currently showing, re-render the current step so dropdowns populate
      if (document.getElementById('view-wizard')?.style.display !== 'none') {
        if (typeof Wizard !== 'undefined') Wizard.renderStep();
      }
    }).catch(err => {
      console.error('Data load error:', err);
      const el = document.getElementById('loading-text');
      if (el) el.textContent = 'Data load failed. App will work without autocomplete.';
    });
    return dataPromise;
  }

  // ---- POPULATE SHARED DATALISTS (global, called once data is ready) ----
  function populateGlobalDataLists() {
    const ua      = isUAEnabled();
    const show24  = is2024Enabled();
    const show14  = is2014Enabled();

    const filter = item => {
      if (item.source === 'UA2024') return ua && show24;
      if (is2024Source(item.source) || item.edition === 'one') return show24;
      return show14;
    };

    const fill = (id, items, valueFn, textFn) => {
      const dl = document.getElementById(id);
      if (!dl) return;
      dl.innerHTML = '';
      items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = valueFn(item);
        if (textFn) opt.textContent = textFn(item);
        dl.appendChild(opt);
      });
    };

    // Classes (deduplicated by name, prefer XPHB, filter UA)
    const seen = new Set();
    const sortedClasses = [...DndData.classes].sort((a, b) => {
      if (a.source === 'XPHB' && b.source !== 'XPHB') return -1;
      if (b.source === 'XPHB' && a.source !== 'XPHB') return 1;
      return a.name.localeCompare(b.name);
    }).filter(c => {
      if (!filter(c)) return false;
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
    fill('class-list', sortedClasses, c => c.name);

    // Species — for duplicate names include source + edition year so user can tell versions apart
    const _speciesList = [...DndData.races].filter(r => !r._skipPlayer && filter(r)).sort((a, b) => a.name.localeCompare(b.name));
    // Count races by name, and by name+displaySource to detect same-src collisions
    const _speciesNameCount = {}, _speciesSrcCount = {};
    _speciesList.forEach(r => {
      _speciesNameCount[r.name] = (_speciesNameCount[r.name] || 0) + 1;
      const k = r.name + '|' + r._src;
      _speciesSrcCount[k] = (_speciesSrcCount[k] || 0) + 1;
    });
    // If _src already contains a year indicator ("'14","'24","2024") don't add one
    const _srcHasYear = src => /'\d{2}|\d{4}/.test(src);
    // Source codes that belong to the 2024 edition but whose display name lacks a year
    const _2024Sources = SOURCES_2024_SET;
    // Value and label are always identical (name + source) so the browser shows only one line
    const _speciesLabel = r => {
      const k = r.name + '|' + r._src;
      const yearSuffix = _srcHasYear(r._src) ? '' : (_2024Sources.has(r.source) ? ' 2024' : ' 2014');
      if (_speciesSrcCount[k] > 1) return `${r.name} — ${r._src}${yearSuffix} (${r.source})`;
      return `${r.name} — ${r._src}${yearSuffix}`;
    };
    fill('species-list', _speciesList, r => _speciesLabel(r), r => _speciesLabel(r));

    // Backgrounds — always show source; for duplicates use it as the value too for disambiguation
    const _bgList = [...DndData.backgrounds].filter(filter).sort((a, b) => a.name.localeCompare(b.name));
    const _bgNameCount = {};
    _bgList.forEach(b => { _bgNameCount[b.name] = (_bgNameCount[b.name] || 0) + 1; });
    const _bgLabel = b => `${b.name} — ${b._src}`;
    fill('bg-list', _bgList, b => _bgLabel(b), b => _bgLabel(b));

    // Feats
    fill('feat-list', [...DndData.feats].filter(filter).sort((a, b) => a.name.localeCompare(b.name)),
      f => f.name, f => `${f.name} — ${f._catName || ''} — ${f._src}`);

    // Char options
    fill('charopt-list', DndData.charOptions.filter(filter).sort((a, b) => a.name.localeCompare(b.name)),
      o => o.name, o => `${o.name} — ${o._typeName} — ${o._src}`);

    // Weapons (for attack auto-fill on sheet) — weapons don't have UA entries so no filter needed
    let weaponList = document.getElementById('weapon-list');
    if (!weaponList) {
      weaponList = document.createElement('datalist');
      weaponList.id = 'weapon-list';
      document.body.appendChild(weaponList);
    }
    weaponList.innerHTML = '';
    DndData.allItems.filter(i => i.weaponCategory).sort((a, b) => a.name.localeCompare(b.name)).forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.name;
      weaponList.appendChild(opt);
    });
  }

  function hideLoadingOverlay() {
    setTimeout(() => {
      document.getElementById('loading-overlay')?.classList.add('hidden');
    }, 400);
  }

  // ---- ROUTER SETUP ----
  function setupRouter() {
    // Home page
    Router.register('home', () => {
      Router.showView('view-home');
      const titleEl = document.getElementById('topbar-title');
      if (titleEl) titleEl.textContent = '';
      Home.render();
    });

    // Wizard
    Router.register('wizard', () => {
      Router.showView('view-wizard');
      const titleEl = document.getElementById('topbar-title');
      if (titleEl) titleEl.textContent = '';
      Wizard.start();
    });

    // Character sheet
    Router.register('sheet/:id', (params) => {
      Router.showView('view-sheet');
      Sheet.init(params.id);
      Combat.init();

      // If data is ready, notify sheet
      if (dataReady) {
        Sheet.onDataReady();
      } else if (dataPromise) {
        dataPromise.then(() => {
          if (CharStore.activeId === params.id) {
            Sheet.onDataReady();
          }
        });
      }
    });
  }

  // ---- DATALIST SHOW-ALL ON FOCUS ----
  // Clears the input on focus so all datalist options show, restores if user doesn't pick anything
  document.addEventListener('focusin', e => {
    const el = e.target;
    if (el.tagName === 'INPUT' && el.hasAttribute('list')) {
      el._savedValue = el.value;
      el.value = '';
    }
  }, true);

  document.addEventListener('focusout', e => {
    const el = e.target;
    if (el.tagName === 'INPUT' && el.hasAttribute('list')) {
      if (el.value === '') {
        el.value = el._savedValue || '';
      }
      el._savedValue = undefined;
    }
  }, true);

  // ---- INIT ----
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initUAToggle();
    init2024Toggle();
    init2014Toggle();
    Dice.initLogPanel();
    CharStore.initUndo();

    // Migrate old single-character data if present
    CharStore.migrateV1();

    // Init home page event listeners
    Home.init();

    // Setup router and start
    setupRouter();

    // Load data
    loadData().finally(() => {
      hideLoadingOverlay();
    });

    Router.init();
  });
})();
