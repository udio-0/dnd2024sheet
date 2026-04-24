/* =============================================
   APP BOOTSTRAP
   Initializes router, loads data, coordinates modules
   ============================================= */
'use strict';

// Replace native <datalist> with a custom fixed-position dropdown on any input.
// Reads options from the datalist element at query time, dispatches 'change' on pick.
window.setupAutocomplete = function (input, datalistId) {
  input.removeAttribute('list');
  const dd = document.createElement('div');
  dd.className = 'autocomplete-dropdown wiz-ac-fixed';
  document.body.appendChild(dd);
  const show = (q) => {
    const opts = Array.from(document.getElementById(datalistId)?.options || []);
    const matches = q ? opts.filter(o => o.value.toLowerCase().includes(q.toLowerCase())) : opts;
    if (!matches.length) { dd.style.display = 'none'; return; }
    dd.innerHTML = '';
    matches.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'ac-item';
      div.textContent = opt.value;
      div.addEventListener('mousedown', e => e.preventDefault());
      div.addEventListener('click', () => {
        input.value = opt.value;
        dd.style.display = 'none';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      dd.appendChild(div);
    });
    const r = input.getBoundingClientRect();
    dd.style.top = r.bottom + 'px';
    dd.style.left = r.left + 'px';
    dd.style.width = r.width + 'px';
    dd.style.display = 'block';
  };
  input.addEventListener('focus', () => show(''));
  input.addEventListener('click', () => show(''));
  input.addEventListener('input', () => show(input.value.trim()));
  input.addEventListener('blur', () => setTimeout(() => { dd.style.display = 'none'; }, 200));
  const obs = new MutationObserver(() => { if (!document.contains(input)) { dd.remove(); obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });
  return dd;
};

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
    dungeon: { dark: true, label: 'Dungeon', bg: '#262626', accent: '#725353',
      vars: {
        '--red':'#725353', '--red-accent':'#936868',
        '--gold':'#beae88', '--gold-light':'#e3d5ae', '--gold-dark':'#827d6e',
        '--parchment':'#262626', '--parchment-dk':'#1f1f1f',
        '--ink':'#dfdcd9', '--ink-light':'#a8a8a8', '--ink-faint':'#6c6c6c',
        '--white':'#353535', '--border':'#484848',
        '--body-bg':'#131317', '--topbar-bg':'#1d1d23', '--tab-bar-bg':'#16161a',
        '--combat-border':'#725353', '--input-bg':'#2f2f2f',
        '--ac-bg':'#353535', '--ac-hover':'#424242',
      }},
    abyss: { dark: true, label: 'Abyss', bg: '#1e1e1e', accent: '#876641',
      vars: {
        '--red':'#876641', '--red-accent':'#a97e4f',
        '--gold':'#b6975a', '--gold-light':'#dbc07d', '--gold-dark':'#836837',
        '--parchment':'#272727', '--parchment-dk':'#1c1c1c',
        '--ink':'#e6e1db', '--ink-light':'#acacac', '--ink-faint':'#656565',
        '--white':'#292929', '--border':'#424242',
        '--body-bg':'#171717', '--topbar-bg':'#1b1916', '--tab-bar-bg':'#131313',
        '--combat-border':'#876641', '--input-bg':'#272727',
        '--ac-bg':'#292929', '--ac-hover':'#353535',
      }},
    crimson: { dark: true, label: 'Crimson', bg: '#222222', accent: '#8e4242',
      vars: {
        '--red':'#8e4242', '--red-accent':'#a85858',
        '--gold':'#b89a6c', '--gold-light':'#dfc391', '--gold-dark':'#86704a',
        '--parchment':'#282828', '--parchment-dk':'#1e1e1e',
        '--ink':'#e9e5e1', '--ink-light':'#b0b0b0', '--ink-faint':'#747474',
        '--white':'#2f2f2f', '--border':'#454545',
        '--body-bg':'#151515', '--topbar-bg':'#1b1b1b', '--tab-bar-bg':'#181818',
        '--combat-border':'#8e4242', '--input-bg':'#282828',
        '--ac-bg':'#2f2f2f', '--ac-hover':'#393939',
      }},
    emerald: { dark: true, label: 'Emerald', bg: '#242424', accent: '#3c644e',
      vars: {
        '--red':'#3c644e', '--red-accent':'#4d7f63',
        '--gold':'#aea582', '--gold-light':'#cfc5a1', '--gold-dark':'#79735b',
        '--parchment':'#282828', '--parchment-dk':'#1c1c1c',
        '--ink':'#e2e4e0', '--ink-light':'#b4b4b4', '--ink-faint':'#6c6c6c',
        '--white':'#2b2b2b', '--border':'#414141',
        '--body-bg':'#161616', '--topbar-bg':'#1c1c1c', '--tab-bar-bg':'#181818',
        '--combat-border':'#3c644e', '--input-bg':'#292929',
        '--ac-bg':'#2b2b2b', '--ac-hover':'#353535',
      }},
    midnight: { dark: true, label: 'Midnight', bg: '#26282e', accent: '#555e93',
      vars: {
        '--red':'#555e93', '--red-accent':'#6874b4',
        '--gold':'#b2ac96', '--gold-light':'#d1ccb7', '--gold-dark':'#7b746d',
        '--parchment':'#2b2b2b', '--parchment-dk':'#1f2128',
        '--ink':'#e6e6ea', '--ink-light':'#bcbcbc', '--ink-faint':'#787878',
        '--white':'#303438', '--border':'#474a53',
        '--body-bg':'#1a1a1e', '--topbar-bg':'#1f222b', '--tab-bar-bg':'#191c25',
        '--combat-border':'#555e93', '--input-bg':'#313131',
        '--ac-bg':'#303438', '--ac-hover':'#3c3c44',
      }},
  };

  // ---- CUSTOM THEME ----
  // User-picked 4-color theme (bg, accent, gold, ink). Other CSS vars are derived.
  const CUSTOM_DEFAULTS = { bg: '#FDF1DC', accent: '#58180D', gold: '#C9AD6A', ink: '#1A1208' };

  function _hexToRgb(hex) {
    const c = (hex || '').replace('#','');
    const v = c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c;
    return { r: parseInt(v.slice(0,2),16) || 0, g: parseInt(v.slice(2,4),16) || 0, b: parseInt(v.slice(4,6),16) || 0 };
  }
  function _rgbToHex(r, g, b) {
    const h = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + h(r) + h(g) + h(b);
  }
  // Linear blend in RGB space. t in [0,1]: 0 = a, 1 = b.
  function _mix(hexA, hexB, t) {
    const a = _hexToRgb(hexA), b = _hexToRgb(hexB);
    return _rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }
  // Relative luminance (0..1) — only used to set the data-theme attribute, not for derivations.
  function _lum(hex) {
    const { r, g, b } = _hexToRgb(hex);
    const ch = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  }

  // Derive a full theme from the 4 picked colors using smooth blends only.
  // Every output is a continuous function of the inputs, so dragging any picker
  // produces a smooth visual change with no threshold jumps.
  function buildCustomTheme(colors) {
    const c = Object.assign({}, CUSTOM_DEFAULTS, colors || {});
    const W = '#FFFFFF', K = '#000000';
    return {
      dark: _lum(c.bg) < 0.45, label: 'Custom', bg: c.bg, accent: c.accent,
      vars: {
        // Accent shades
        '--red':           c.accent,
        '--red-accent':    _mix(c.accent, W, 0.20),
        // Gold shades
        '--gold':          c.gold,
        '--gold-light':    _mix(c.gold, W, 0.30),
        '--gold-dark':     _mix(c.gold, K, 0.30),
        // Background shades
        '--parchment':     c.bg,
        '--parchment-dk': _mix(c.bg, K, 0.10),
        // Ink — secondary tones are blended toward bg so they always read as "softer"
        '--ink':           c.ink,
        '--ink-light':    _mix(c.ink, c.bg, 0.40),
        '--ink-faint':    _mix(c.ink, c.bg, 0.65),
        // Raised surface ("white") — slightly lifted from bg toward white in every theme
        '--white':        _mix(c.bg, W, 0.30),
        // Muted gold edge
        '--border':       _mix(c.gold, c.ink, 0.20),
        // Page chrome — frame around the parchment, derived from accent
        '--body-bg':      _mix(c.accent, K, 0.55),
        '--topbar-bg':     c.accent,
        '--tab-bar-bg':   _mix(c.accent, K, 0.30),
        '--combat-border': c.accent,
        '--input-bg':      c.bg,
        '--ac-bg':        _mix(c.bg, W, 0.30),
        '--ac-hover':     _mix(c.bg, c.ink, 0.08),
      }
    };
  }

  function loadCustomColors() {
    try {
      const raw = localStorage.getItem('dnd_custom_theme');
      if (raw) return Object.assign({}, CUSTOM_DEFAULTS, JSON.parse(raw));
    } catch (_) {}
    return Object.assign({}, CUSTOM_DEFAULTS);
  }

  function saveCustomColors(colors) {
    localStorage.setItem('dnd_custom_theme', JSON.stringify(colors));
  }

  function applyCustomTheme(colors) {
    const t = buildCustomTheme(colors);
    THEMES.custom = t;
    const root = document.documentElement;
    root.setAttribute('data-theme', t.dark ? 'dark' : 'light');
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem('dnd_theme_name', 'custom');
    document.querySelectorAll('.theme-swatch').forEach(el =>
      el.classList.toggle('active', el.dataset.theme === 'custom'));
  }

  const FONTS = [
    { id: 'classic',  label: 'Classic',  title: "'Cinzel', serif",                    body: "'Crimson Text', Georgia, serif" },
    { id: 'elegant',  label: 'Elegant',  title: "'Playfair Display', Georgia, serif",  body: "'Libre Baskerville', Georgia, serif" },
    { id: 'fantasy',  label: 'Fantasy',  title: "'Uncial Antiqua', serif",             body: "'IM Fell English', Georgia, serif" },
    { id: 'modern',   label: 'Modern',   title: "'Raleway', sans-serif",               body: "'Nunito', sans-serif" },
    { id: 'refined',  label: 'Refined',  title: "'Cormorant Garamond', serif",         body: "'Lato', sans-serif" },
    { id: 'clean',    label: 'Clean',    title: "'Inter', sans-serif",                  body: "'Inter', sans-serif" },
  ];

  const FONT_SIZES = [
    { id: 'xs',  label: 'XS',  value: '14px' },
    { id: 'sm',  label: 'S',   value: '15px' },
    { id: 'md',  label: 'M',   value: '16px' },
    { id: 'lg',  label: 'L',   value: '17px' },
    { id: 'xl',  label: 'XL',  value: '18px' },
  ];

  function applyBold(on) {
    document.documentElement.classList.toggle('font-bold', on);
    localStorage.setItem('dnd_font_bold', on ? '1' : '0');
    const btn = document.getElementById('btn-font-bold');
    if (btn) btn.classList.toggle('active', on);
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('dnd_theme_name') || 'crimson';
    const savedFont  = localStorage.getItem('dnd_font')       || 'clean';
    const savedSize  = localStorage.getItem('dnd_font_size')  || 'md';
    const savedBold  = localStorage.getItem('dnd_font_bold')  === '1';
    // Always pre-register the custom theme so it can be selected from the panel.
    THEMES.custom = buildCustomTheme(loadCustomColors());
    applyTheme(savedTheme);
    applyFont(savedFont);
    applyFontSize(savedSize);
    applyBold(savedBold);
    buildThemePanel();
    document.getElementById('btn-font-bold')?.addEventListener('click', () => {
      applyBold(!document.documentElement.classList.contains('font-bold'));
    });

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
    if (name === 'custom') { applyCustomTheme(loadCustomColors()); return; }
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
    requestAnimationFrame(fitAll);
  }

  // ---- AUTO-FIT TEXT ----
  // Shrinks font-size on elements whose content overflows their box.
  // Applied to inputs/elements matching AUTOFIT_SEL.
  const AUTOFIT_SEL = '.combat-value-input, [data-autofit]';

  function fitElement(el) {
    if (!el || !el.isConnected) return;
    el.style.fontSize = '';
    const base = parseFloat(getComputedStyle(el).fontSize) || 16;
    const min = Math.max(8, base * 0.4);
    const overflow = (e) =>
      e.tagName === 'INPUT' || e.tagName === 'TEXTAREA'
        ? e.scrollWidth > e.clientWidth + 1
        : e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1;
    let size = base;
    let guard = 40;
    while (overflow(el) && size > min && guard-- > 0) {
      size -= 0.5;
      el.style.fontSize = size + 'px';
    }
  }

  function fitAll(root) {
    (root || document).querySelectorAll(AUTOFIT_SEL).forEach(fitElement);
  }

  function initAutoFit() {
    document.addEventListener('input', (e) => {
      if (e.target.matches && e.target.matches(AUTOFIT_SEL)) fitElement(e.target);
    });
    window.addEventListener('resize', () => requestAnimationFrame(() => fitAll()));
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        m.addedNodes.forEach(n => {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches(AUTOFIT_SEL)) fitElement(n);
          if (n.querySelectorAll) n.querySelectorAll(AUTOFIT_SEL).forEach(fitElement);
        });
        if (m.type === 'attributes' && m.target.matches && m.target.matches(AUTOFIT_SEL)) {
          fitElement(m.target);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
    // Re-fit after programmatic value changes (which don't fire 'input').
    document.addEventListener('change', (e) => {
      if (e.target.matches && e.target.matches(AUTOFIT_SEL)) fitElement(e.target);
    }, true);
    // Catch hydration from character load that sets .value directly.
    [100, 500, 1500].forEach(d => setTimeout(fitAll, d));
    requestAnimationFrame(() => fitAll());
    window.fitAutoFit = fitAll;
  }

  function buildThemePanel() {
    const lightEl = document.getElementById('light-swatches');
    const darkEl  = document.getElementById('dark-swatches');
    const fontEl  = document.getElementById('font-options');
    if (!lightEl || !darkEl || !fontEl) return;

    const savedTheme = localStorage.getItem('dnd_theme_name') || 'crimson';
    const savedFont  = localStorage.getItem('dnd_font')       || 'clean';

    // Wire up the custom-theme color pickers (live preview on input, persist on Apply).
    const customColors = loadCustomColors();
    document.querySelectorAll('#custom-theme-pickers .custom-theme-input').forEach(inp => {
      const role = inp.dataset.role;
      if (customColors[role]) inp.value = customColors[role];
      inp.addEventListener('input', () => {
        customColors[role] = inp.value;
        applyCustomTheme(customColors);
      });
    });
    document.getElementById('custom-theme-apply')?.addEventListener('click', () => {
      saveCustomColors(customColors);
      applyCustomTheme(customColors);
    });

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
    return localStorage.getItem('dnd_show_ua') === 'true';
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
      Router._guard = null;
      Router.showView('view-home');
      const titleEl = document.getElementById('topbar-title');
      if (titleEl) titleEl.textContent = '';
      const pdfBtn = document.getElementById('btn-export-pdf');
      if (pdfBtn) pdfBtn.style.display = 'none';
      const saveBtn = document.getElementById('btn-save-char');
      if (saveBtn) saveBtn.style.display = 'none';
      Home.render();
    });

    // Wizard
    Router.register('wizard', () => {
      Router._guard = null;
      Router.showView('view-wizard');
      const titleEl = document.getElementById('topbar-title');
      if (titleEl) titleEl.textContent = '';
      const pdfBtn = document.getElementById('btn-export-pdf');
      if (pdfBtn) pdfBtn.style.display = 'none';
      const saveBtn2 = document.getElementById('btn-save-char');
      if (saveBtn2) saveBtn2.style.display = 'none';
      Wizard.start();
    });

    // Character sheet
    Router.register('sheet/:id', async (params) => {
      Router.showView('view-sheet');
      const pdfBtn = document.getElementById('btn-export-pdf');
      if (pdfBtn) pdfBtn.style.display = 'inline-block';
      const saveBtn = document.getElementById('btn-save-char');
      if (saveBtn) saveBtn.style.display = 'inline-flex';
      Sheet.teardown();
      await Sheet.init(params.id);
      // Guard: intercept in-app navigation away from a dirty sheet
      Router._guard = () => {
        if (typeof FileSync !== 'undefined' && FileSync.isDirty(params.id)) {
          const name = (CharStore.activeData && CharStore.activeData.charName) || 'this character';
          return confirm(`"${name}" has unsaved changes.\n\nLeave without saving to file?`);
        }
        return true;
      };

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

  // ---- PDF EXPORT ----
  document.getElementById('btn-export-pdf').addEventListener('click', () => {
    document.body.classList.add('pdf-printing');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('pdf-printing');
    }, { once: true });
  });

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

  // ---- SAVE BUTTON ----
  function initSaveButton() {
    const btn = document.getElementById('btn-save-char');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.classList.add('saving');
      btn.querySelector('.save-btn-text').textContent = 'Saving...';
      try {
        // Save character data
        if (CharStore.activeId) {
          await FileSync.saveCharacterToFile(CharStore.activeId);
        }
        // Save notes (independent from character)
        await FileSync.saveNotesToFile();
      } catch (e) {
        console.warn('Save error:', e);
      }
      btn.classList.remove('saving');
      btn.querySelector('.save-btn-text').textContent = 'Save';
    });
  }

  // ---- INIT ----
  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initAutoFit();
    initUAToggle();
    init2024Toggle();
    init2014Toggle();
    Dice.initLogPanel();
    Sheet.initDiceRoller();
    CharStore.initUndo();

    // Init file sync (await so directory handle is restored before router starts)
    if (typeof FileSync !== 'undefined') await FileSync.init();

    // Migrate old single-character data if present
    CharStore.migrateV1();

    // Init home page event listeners
    Home.init();

    // Init save button
    initSaveButton();

    // Setup router and start
    setupRouter();

    // Load data
    loadData().finally(() => {
      hideLoadingOverlay();
    });

    Router.init();
  });
})();
