/* =============================================
   D&D 2024 CHARACTER SHEET - APP LOGIC
   ============================================= */

'use strict';

// ---- CONSTANTS ----
const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_NAMES = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

const SKILLS = [
  { key: 'acrobatics',     label: 'Acrobatics',      ability: 'dex' },
  { key: 'animalHandling', label: 'Animal Handling',  ability: 'wis' },
  { key: 'arcana',         label: 'Arcana',           ability: 'int' },
  { key: 'athletics',      label: 'Athletics',        ability: 'str' },
  { key: 'deception',      label: 'Deception',        ability: 'cha' },
  { key: 'history',        label: 'History',          ability: 'int' },
  { key: 'insight',        label: 'Insight',          ability: 'wis' },
  { key: 'intimidation',   label: 'Intimidation',     ability: 'cha' },
  { key: 'investigation',  label: 'Investigation',    ability: 'int' },
  { key: 'medicine',       label: 'Medicine',         ability: 'wis' },
  { key: 'nature',         label: 'Nature',           ability: 'int' },
  { key: 'perception',     label: 'Perception',       ability: 'wis' },
  { key: 'performance',    label: 'Performance',      ability: 'cha' },
  { key: 'persuasion',     label: 'Persuasion',       ability: 'cha' },
  { key: 'religion',       label: 'Religion',         ability: 'int' },
  { key: 'sleightOfHand',  label: 'Sleight of Hand',  ability: 'dex' },
  { key: 'stealth',        label: 'Stealth',          ability: 'dex' },
  { key: 'survival',       label: 'Survival',         ability: 'wis' },
];

const SAVES = ABILITIES.map(a => ({ key: a, label: ABILITY_NAMES[a] }));

// ---- LOCAL STORAGE ----
const STORE_KEY = 'dnd2024_char_v2';
let _store = {};

function storeLoad() {
  try { _store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { _store = {}; }
}
function storeSave() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(_store)); } catch {}
}
function sv(key, val) { _store[key] = val; storeSave(); }
function lv(key, def) { return _store[key] !== undefined ? _store[key] : def; }

// ---- HELPERS ----
function getMod(score) { return Math.floor((parseInt(score) || 10 - 10) / 2); }
function getModFromScore(score) { return Math.floor(((parseInt(score) || 10) - 10) / 2); }
function fmtMod(mod) { return (mod >= 0 ? '+' : '') + mod; }
function getProfBonus(level) { return Math.floor(((parseInt(level) || 1) - 1) / 4) + 2; }
function $(id) { return document.getElementById(id); }
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

function getAbilityScore(ab) { return parseInt($(ab)?.value) || 10; }
function getLevel() { return Math.max(1, Math.min(20, parseInt($('charLevel')?.value) || 1)); }

// ---- THEME ----
function initTheme() {
  const saved = localStorage.getItem('dnd_theme');
  if (saved === 'dark') applyTheme('dark');
  else applyTheme('light');

  $('btn-theme')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dnd_theme', theme);
  const icon = $('theme-icon');
  const label = $('theme-label');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  storeLoad();
  initTabs();
  buildSaves();
  buildSkills();
  bindSimpleFields();
  buildAttacks();
  buildSpellSlots();
  buildSpellLevelSections();
  initDiceRoller();
  initTopButtons();
  initClassSelect();
  initSpeciesSelect();
  initBackgroundSelect();
  initFeatSystem();
  recalcAll();

  // Load data from 5etools
  loadAllData(progress => {
    const el = $('loading-text');
    if (el) el.textContent = progress;
    const fill = $('loading-fill');
    if (!fill) return;
    // Estimate progress based on keywords
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
      if (m) pct = 75 + Math.floor((parseInt(m[1]) / parseInt(m[2])) * 20);
    }
    else if (progress === 'Ready!') pct = 100;
    fill.style.width = pct + '%';
  }).then(() => {
    populateDataLists();
    initSpellSearch();
    initItemSearch();
    restoreSpells();
    restoreInventory();
    restoreFeats();
    applyClassSelection(lv('charClass', ''));
    applySpeciesSelection(lv('charSpecies', ''));
    applyBackgroundSelection(lv('charBackground', ''));

    setTimeout(() => {
      $('loading-overlay')?.classList.add('hidden');
    }, 400);
  }).catch(err => {
    console.error('Data load error:', err);
    $('loading-text').textContent = 'Data load failed. App will work without autocomplete.';
    setTimeout(() => $('loading-overlay')?.classList.add('hidden'), 1500);
  });
});

// ---- TABS ----
function initTabs() {
  qsa('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      qsa('.tab').forEach(t => t.classList.remove('active'));
      qsa('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $(`tab-${tab.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });
}

// ---- BUILD SAVES ----
function buildSaves() {
  const container = $('save-list');
  if (!container) return;
  SAVES.forEach(s => {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <input type="checkbox" class="save-prof" data-save-ab="${s.key}">
      <span class="stat-val" id="save-${s.key}">+0</span>
      <span class="stat-label">${s.label}</span>`;
    container.appendChild(row);
    const cb = row.querySelector('.save-prof');
    cb.checked = lv(`saveProf_${s.key}`, false);
    cb.addEventListener('change', () => { sv(`saveProf_${s.key}`, cb.checked); recalcAll(); });
  });
}

// ---- BUILD SKILLS ----
function buildSkills() {
  const container = $('skill-list');
  if (!container) return;
  SKILLS.forEach(s => {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <input type="checkbox" class="skill-prof" data-skill="${s.key}" title="Proficient">
      <input type="checkbox" class="skill-expert" data-skill="${s.key}" title="Expertise">
      <span class="stat-val" id="skill-${s.key}">+0</span>
      <span class="stat-label">${s.label}</span>
      <span class="stat-tag">${s.ability.toUpperCase()}</span>`;
    container.appendChild(row);
    const prof = row.querySelector('.skill-prof');
    const expert = row.querySelector('.skill-expert');
    prof.checked = lv(`skillProf_${s.key}`, false);
    expert.checked = lv(`skillExpert_${s.key}`, false);
    prof.addEventListener('change', () => {
      if (!prof.checked) { expert.checked = false; sv(`skillExpert_${s.key}`, false); }
      sv(`skillProf_${s.key}`, prof.checked);
      recalcAll();
    });
    expert.addEventListener('change', () => {
      if (expert.checked) { prof.checked = true; sv(`skillProf_${s.key}`, true); }
      sv(`skillExpert_${s.key}`, expert.checked);
      recalcAll();
    });
  });
}

// ---- RECALCULATION ENGINE ----
function recalcAll() {
  const level = getLevel();
  const prof = getProfBonus(level);
  const mods = {};

  ABILITIES.forEach(ab => {
    const score = getAbilityScore(ab);
    mods[ab] = getModFromScore(score);
    const el = $(`${ab}-mod`);
    if (el) el.textContent = fmtMod(mods[ab]);
  });

  const profEl = $('profBonus');
  if (profEl) profEl.textContent = fmtMod(prof);

  const initEl = $('initiative');
  if (initEl) initEl.textContent = fmtMod(mods.dex);

  // Saves
  SAVES.forEach(s => {
    const cb = qs(`.save-prof[data-save-ab="${s.key}"]`);
    const total = mods[s.key] + (cb?.checked ? prof : 0);
    const el = $(`save-${s.key}`);
    if (el) el.textContent = fmtMod(total);
  });

  // Skills
  let percBonus = 0;
  SKILLS.forEach(s => {
    const profCb = qs(`.skill-prof[data-skill="${s.key}"]`);
    const expertCb = qs(`.skill-expert[data-skill="${s.key}"]`);
    const isProficient = profCb?.checked;
    const isExpert = expertCb?.checked;
    const bonus = isExpert ? prof * 2 : isProficient ? prof : 0;
    const total = mods[s.ability] + bonus;
    const el = $(`skill-${s.key}`);
    if (el) el.textContent = fmtMod(total);
    if (s.key === 'perception') percBonus = bonus;
  });

  // Passive perception
  const passiveEl = $('passivePerception');
  if (passiveEl) passiveEl.textContent = 10 + mods.wis + percBonus;

  // Spell stats
  const spellAb = $('spellcastingAbility')?.value;
  if (spellAb && mods[spellAb] !== undefined) {
    const sm = mods[spellAb];
    const dcEl = $('spellSaveDC');
    const atkEl = $('spellAttackBonus');
    if (dcEl) dcEl.textContent = 8 + prof + sm;
    if (atkEl) atkEl.textContent = fmtMod(prof + sm);
  }
}

// ---- BIND SIMPLE FIELDS ----
function bindSimpleFields() {
  qsa('[data-save]').forEach(el => {
    const key = el.dataset.save;
    if (el.type === 'checkbox') el.checked = lv(key, false);
    else { const v = lv(key, null); if (v !== null) el.value = v; }
    const handler = () => {
      sv(key, el.type === 'checkbox' ? el.checked : el.value);
      if (ABILITIES.includes(key) || key === 'charLevel' || key === 'spellcastingAbility') recalcAll();
    };
    el.addEventListener('change', handler);
    el.addEventListener('input', handler);
  });
}

// ---- ATTACKS ----
let attackId = 0;
function buildAttacks() {
  const saved = lv('attacks', []);
  (saved.length ? saved : [{}, {}, {}]).forEach(a => addAttackRow(a));
}
function addAttackRow(data = {}) {
  const tbody = $('attacks-body');
  if (!tbody) return;
  const id = attackId++;
  const tr = document.createElement('tr');
  tr.dataset.id = id;
  tr.innerHTML = `
    <td><input type="text" class="atk-name" placeholder="Weapon name" value="${data.name || ''}" list="weapon-list"></td>
    <td><input type="text" class="atk-bonus" placeholder="+0" value="${data.bonus || ''}"></td>
    <td><input type="text" class="atk-damage" placeholder="1d8+3 S" value="${data.damage || ''}"></td>
    <td><input type="text" class="atk-mastery" placeholder="Mastery" value="${data.mastery || ''}"></td>
    <td><button class="del-btn" title="Remove">✕</button></td>`;
  tbody.appendChild(tr);
  tr.querySelectorAll('input').forEach(i => i.addEventListener('input', saveAttacks));
  tr.querySelector('.del-btn').addEventListener('click', () => { tr.remove(); saveAttacks(); });

  // Auto-fill weapon data on name change
  const nameInput = tr.querySelector('.atk-name');
  nameInput.addEventListener('change', () => {
    const weapon = DndData.allItems.find(i =>
      i.name.toLowerCase() === nameInput.value.toLowerCase() && i.weaponCategory
    );
    if (weapon) {
      const mod = getModFromScore(getAbilityScore(
        weapon.property?.some(p => p.startsWith?.('F') || p === 'F') ? 'dex'
        : weapon.type?.startsWith('R') ? 'dex' : 'str'
      ));
      const prof = getProfBonus(getLevel());
      tr.querySelector('.atk-bonus').value = fmtMod(mod + prof);
      tr.querySelector('.atk-damage').value = weapon._dmgStr || '';
      tr.querySelector('.atk-mastery').value = (weapon.mastery || []).join(', ');
      saveAttacks();
    }
  });
}
function saveAttacks() {
  const rows = [];
  qsa('#attacks-body tr').forEach(tr => {
    rows.push({
      name: tr.querySelector('.atk-name')?.value || '',
      bonus: tr.querySelector('.atk-bonus')?.value || '',
      damage: tr.querySelector('.atk-damage')?.value || '',
      mastery: tr.querySelector('.atk-mastery')?.value || '',
    });
  });
  sv('attacks', rows);
}

// ---- CLASS SELECTION ----
function initClassSelect() {
  const input = $('charClass');
  if (!input) return;
  input.addEventListener('change', () => {
    sv('charClass', input.value);
    applyClassSelection(input.value);
  });
}

function applyClassSelection(className) {
  if (!className || !DndData.loaded) return;
  const info = getClassInfo(className);
  if (!info) return;

  // Sync hit dice from class/level
  Combat.syncHitDice();

  // Auto-check saving throw proficiencies
  info.savingThrows.forEach(ab => {
    const cb = qs(`.save-prof[data-save-ab="${ab}"]`);
    if (cb) { cb.checked = true; sv(`saveProf_${ab}`, true); }
  });

  // Set spellcasting class
  const scInput = $('spellcastingClass');
  if (scInput) { scInput.value = className; sv('spellcastingClass', className); }

  // Display class features
  displayClassFeatures(className);

  // Populate subclass list
  const subList = $('subclass-list');
  if (subList) {
    subList.innerHTML = '';
    info.subclasses.forEach(sc => {
      const opt = document.createElement('option');
      opt.value = sc;
      subList.appendChild(opt);
    });
  }

  recalcAll();
}

function displayClassFeatures(className) {
  const features = getClassFeaturesByLevel(className);
  const level = getLevel();

  // Sidebar summary
  const box = $('class-features-box');
  const textEl = $('class-features-text');
  const subtitleEl = $('class-features-subtitle');
  if (box && textEl) {
    box.style.display = 'block';
    if (subtitleEl) subtitleEl.textContent = `(${className} Lv.${level})`;
    const summary = [];
    for (let l = 1; l <= level; l++) {
      if (features[l]) {
        features[l].forEach(f => summary.push(`Lv.${l}: ${f.name}`));
      }
    }
    textEl.textContent = summary.join('\n') || 'No features found.';
  }

  // Full features tab
  const fullBox = $('full-class-features-box');
  const fullEl = $('full-class-features');
  const fullSub = $('full-class-subtitle');
  if (fullEl) {
    if (fullSub) fullSub.textContent = `(${className})`;
    fullEl.innerHTML = '';
    for (let l = 1; l <= 20; l++) {
      if (!features[l]) continue;
      features[l].forEach(f => {
        const div = document.createElement('div');
        div.className = 'feature-entry' + (l > level ? ' style="opacity:0.4"' : '');
        div.style.opacity = l > level ? '0.4' : '1';
        div.innerHTML = `
          <div class="feature-entry-header">
            <span class="feature-entry-name">${f.name}</span>
            <span class="feature-entry-level">Level ${l}</span>
          </div>
          <div class="feature-entry-text">${f.text || ''}</div>`;
        fullEl.appendChild(div);
      });
    }
  }
}

// ---- SPECIES SELECTION ----
function initSpeciesSelect() {
  const input = $('charSpecies');
  if (!input) return;
  input.addEventListener('change', () => {
    sv('charSpecies', input.value);
    applySpeciesSelection(input.value);
  });
}

function applySpeciesSelection(name) {
  if (!name || !DndData.loaded) return;
  const info = getSpeciesInfo(name);
  if (!info) return;

  // Auto-set speed
  const speedInput = $('speed');
  if (speedInput && !speedInput.value) {
    speedInput.value = info.speed;
    sv('speed', info.speed.toString());
  }

  // Display traits
  const box = $('species-info-box');
  const textEl = $('species-traits-text');
  if (box && textEl) {
    box.style.display = 'block';
    let txt = `Source: ${info.src}`;
    txt += `\nSize: ${info.size}`;
    txt += `\nSpeed: ${info.speed} ft.`;
    if (info.darkvision) txt += `\nDarkvision: ${info.darkvision} ft.`;
    if (info.abilityBonus) txt += `\nAbility Bonus: ${info.abilityBonus}`;
    if (info.resist.length) txt += `\nResistances: ${info.resist.join(', ')}`;
    txt += '\n\n' + info.traits;
    textEl.textContent = txt;
  }

  // Full species tab
  const fullEl = $('full-species-traits');
  if (fullEl) {
    let html = `<div class="feature-entry">`;
    html += `<div class="feature-entry-header"><span class="feature-entry-name">${info.name}</span><span class="feature-entry-level">${info.src}</span></div>`;
    html += `<div class="feature-entry-text">Size: ${info.size} | Speed: ${info.speed} ft.`;
    if (info.darkvision) html += ` | Darkvision: ${info.darkvision} ft.`;
    if (info.abilityBonus) html += `\nAbility Bonus: ${info.abilityBonus}`;
    if (info.resist.length) html += `\nResistances: ${info.resist.join(', ')}`;
    html += `\n\n${(info.traits || '').replace(/\n/g, '<br>')}</div></div>`;
    fullEl.innerHTML = html;
  }
}

// ---- BACKGROUND SELECTION ----
function initBackgroundSelect() {
  const input = $('charBackground');
  if (!input) return;
  input.addEventListener('change', () => {
    sv('charBackground', input.value);
    applyBackgroundSelection(input.value);
  });
}

function applyBackgroundSelection(name) {
  if (!name || !DndData.loaded) return;
  const info = getBackgroundInfo(name);
  if (!info) return;

  // Auto-check skill proficiencies
  const skillMap = {};
  SKILLS.forEach(s => skillMap[s.label.toLowerCase()] = s.key);
  Object.keys(info.skillProf).forEach(sk => {
    const key = skillMap[sk.toLowerCase()];
    if (key) {
      const cb = qs(`.skill-prof[data-skill="${key}"]`);
      if (cb) { cb.checked = true; sv(`skillProf_${key}`, true); }
    }
  });

  // Display info
  const box = $('bg-info-box');
  const textEl = $('bg-traits-text');
  if (box && textEl) {
    box.style.display = 'block';
    let txt = `Skills: ${Object.keys(info.skillProf).join(', ')}`;
    const tools = Object.keys(info.toolProf);
    if (tools.length) txt += `\nTools: ${tools.join(', ')}`;
    if (info.feat) {
      const featName = Object.keys(info.feat)[0]?.split('|')[0] || '';
      txt += `\nOrigin Feat: ${featName}`;
    }
    txt += '\n\n' + info.description;
    textEl.textContent = txt;
  }

  const fullEl = $('full-bg-features');
  if (fullEl) {
    fullEl.innerHTML = `<div class="feature-entry"><div class="feature-entry-text">${(info.description || '').replace(/\n/g, '<br>')}</div></div>`;
  }

  recalcAll();
}

// ---- FEAT SYSTEM ----
function initFeatSystem() {
  const addBtn = $('btn-add-feat');
  const searchInput = $('feat-search');
  if (addBtn && searchInput) {
    addBtn.addEventListener('click', () => {
      const name = searchInput.value.trim();
      if (!name) return;
      addFeat(name);
      searchInput.value = '';
    });
  }
}

function addFeat(name) {
  const feats = lv('feats', []);
  if (feats.includes(name)) return;
  feats.push(name);
  sv('feats', feats);
  renderFeats();
}

function removeFeat(name) {
  const feats = lv('feats', []).filter(f => f !== name);
  sv('feats', feats);
  renderFeats();
}

function restoreFeats() {
  renderFeats();
}

function renderFeats() {
  const container = $('feats-container');
  const fullList = $('full-feats-list');
  if (!container) return;
  container.innerHTML = '';
  if (fullList) fullList.innerHTML = '';

  const feats = lv('feats', []);
  feats.forEach(name => {
    const info = getFeatInfo(name);
    const card = document.createElement('div');
    card.className = 'feat-card';
    card.innerHTML = `
      <div>
        <div class="feat-card-name">${name}</div>
        <div class="feat-card-cat">${info?.category || ''}</div>
      </div>
      <button class="feat-card-del" title="Remove">✕</button>`;
    card.querySelector('.feat-card-del').addEventListener('click', () => removeFeat(name));
    container.appendChild(card);

    // Full tab
    if (fullList && info) {
      const entry = document.createElement('div');
      entry.className = 'feature-entry';
      entry.innerHTML = `
        <div class="feature-entry-header">
          <span class="feature-entry-name">${info.name}</span>
          <span class="feature-entry-level">${info.category}</span>
        </div>
        <div class="feature-entry-text">${info.description || ''}</div>`;
      fullList.appendChild(entry);
    }
  });
}

// ---- POPULATE DATALISTS ----
function populateDataLists() {
  // Classes - deduplicate by name, prefer XPHB
  const classList = $('class-list');
  if (classList) {
    const seen = new Set();
    // Sort: XPHB first, then alphabetical
    const sorted = [...DndData.classes].sort((a, b) => {
      if (a.source === 'XPHB' && b.source !== 'XPHB') return -1;
      if (b.source === 'XPHB' && a.source !== 'XPHB') return 1;
      return a.name.localeCompare(b.name);
    });
    sorted.forEach(c => {
      const key = c.name;
      if (seen.has(key)) return;
      seen.add(key);
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = `${c.name} — ${c._src}`;
      classList.appendChild(opt);
    });
  }

  // Species - ALL races from all books
  const speciesList = $('species-list');
  if (speciesList) {
    // Sort alphabetically
    const sorted = [...DndData.races].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.name;
      opt.textContent = `${r._displayName} — ${r._src}`;
      speciesList.appendChild(opt);
    });
  }

  // Backgrounds - ALL
  const bgList = $('bg-list');
  if (bgList) {
    const sorted = [...DndData.backgrounds].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = `${b.name} — ${b._src}`;
      bgList.appendChild(opt);
    });
  }

  // Feats - ALL
  const featList = $('feat-list');
  if (featList) {
    const sorted = [...DndData.feats].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.name;
      opt.textContent = `${f.name} — ${f._catName || ''} — ${f._src}`;
      featList.appendChild(opt);
    });
  }

  // Weapons list for attacks
  const weaponList = document.createElement('datalist');
  weaponList.id = 'weapon-list';
  DndData.allItems.filter(i => i.weaponCategory).forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.name;
    opt.textContent = `${w._dmgStr} | ${(w.mastery || []).join(', ')} — ${w._src}`;
    weaponList.appendChild(opt);
  });
  document.body.appendChild(weaponList);

  console.log(`Loaded: ${DndData.races.length} species, ${DndData.classes.length} classes, ${DndData.spells.length} spells, ${DndData.allItems.length} items, ${DndData.backgrounds.length} backgrounds, ${DndData.feats.length} feats`);
}

// ---- SPELL SEARCH / AUTOCOMPLETE ----
function initSpellSearch() {
  const input = $('spell-search');
  const dropdown = $('spell-search-results');
  if (!input || !dropdown) return;

  let selectedIdx = -1;

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (query.length < 2) { dropdown.style.display = 'none'; return; }

    const className = lv('charClass', '');
    let pool = className ? getSpellsForClass(className) : DndData.spells;
    const matches = pool.filter(s => s.name.toLowerCase().includes(query)).slice(0, 30);

    dropdown.innerHTML = '';
    selectedIdx = -1;
    if (!matches.length) { dropdown.style.display = 'none'; return; }

    matches.forEach((spell, idx) => {
      const div = document.createElement('div');
      div.className = 'ac-item';
      div.dataset.idx = idx;
      div.innerHTML = `
        <span class="ac-item-name">${spell.name} <small style="color:#8B7355">[${spell._src || ''}]</small></span>
        <span class="ac-item-detail">${spell._levelStr} ${spell._schoolName} | ${spell._castTime} | ${spell._rangeStr} | ${spell._durationStr}</span>`;
      div.addEventListener('click', () => {
        addSpellToSheet(spell);
        input.value = '';
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(div);
    });
    dropdown.style.display = 'block';
  });

  input.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.ac-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, items.length - 1); updateACSelection(items, selectedIdx); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); updateACSelection(items, selectedIdx); }
    else if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); items[selectedIdx]?.click(); }
    else if (e.key === 'Escape') { dropdown.style.display = 'none'; }
  });

  input.addEventListener('blur', () => setTimeout(() => dropdown.style.display = 'none', 200));
}

function updateACSelection(items, idx) {
  items.forEach((it, i) => it.classList.toggle('selected', i === idx));
  items[idx]?.scrollIntoView({ block: 'nearest' });
}

function addSpellToSheet(spell) {
  const level = spell.level;
  const spells = lv('charSpells', []);
  if (spells.find(s => s.name === spell.name && s.level === level)) return; // Already added
  spells.push({ name: spell.name, level, prepared: false });
  sv('charSpells', spells);
  renderSpellCard(spell, level);
}

function renderSpellCard(spell, level) {
  const container = $(`spell-cards-${level}`);
  if (!container) return;
  const card = document.createElement('div');
  card.className = 'spell-card';
  card.dataset.spellName = spell.name;
  card.innerHTML = `
    <input type="checkbox" title="Prepared" ${lv('charSpells', []).find(s => s.name === spell.name)?.prepared ? 'checked' : ''}>
    <span class="spell-card-name">${spell.name}</span>
    <span class="spell-card-meta">${spell._schoolName || ''} | ${spell._castTime || ''}</span>
    <button class="del-btn" title="Remove">✕</button>`;

  card.querySelector('input[type="checkbox"]').addEventListener('change', function () {
    const spells = lv('charSpells', []);
    const s = spells.find(s => s.name === spell.name);
    if (s) s.prepared = this.checked;
    sv('charSpells', spells);
  });

  card.querySelector('.del-btn').addEventListener('click', () => {
    const spells = lv('charSpells', []).filter(s => s.name !== spell.name);
    sv('charSpells', spells);
    card.remove();
  });

  container.appendChild(card);
}

function restoreSpells() {
  const spells = lv('charSpells', []);
  spells.forEach(s => {
    const spell = DndData.spells.find(sp => sp.name === s.name);
    if (spell) renderSpellCard(spell, s.level);
  });
}

// ---- SPELL SLOTS ----
function buildSpellSlots() {
  const bar = $('spell-slots-bar');
  if (!bar) return;
  for (let lvl = 1; lvl <= 9; lvl++) {
    const total = lv(`slotMax_${lvl}`, 0);
    const div = document.createElement('div');
    div.className = 'slot-level';
    div.innerHTML = `
      <h4>Level ${lvl}</h4>
      <input type="number" class="slot-total-input" min="0" max="9" value="${total}" data-lvl="${lvl}">
      <div class="slot-checkboxes" id="slot-cbs-${lvl}"></div>`;
    bar.appendChild(div);
    renderSlotCheckboxes(lvl, total);
  }
  bar.querySelectorAll('.slot-total-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const lvl = parseInt(inp.dataset.lvl);
      const max = Math.max(0, Math.min(9, parseInt(inp.value) || 0));
      inp.value = max;
      sv(`slotMax_${lvl}`, max);
      renderSlotCheckboxes(lvl, max);
    });
  });
}

function renderSlotCheckboxes(level, count) {
  const container = $(`slot-cbs-${level}`);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'slot-cb';
    const key = `slotUsed_${level}_${i}`;
    cb.checked = lv(key, false);
    cb.addEventListener('change', () => sv(key, cb.checked));
    container.appendChild(cb);
  }
}

function buildSpellLevelSections() {
  const mount = $('spell-levels-mount');
  if (!mount) return;
  for (let lvl = 1; lvl <= 9; lvl++) {
    const section = document.createElement('div');
    section.className = 'spell-level-section';
    section.id = `spell-section-${lvl}`;
    section.innerHTML = `
      <h3 class="spell-level-heading">${['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'][lvl]} Level</h3>
      <div class="spell-cards" id="spell-cards-${lvl}"></div>`;
    mount.appendChild(section);
  }
}

// ---- ITEM SEARCH / INVENTORY ----
function initItemSearch() {
  const input = $('item-search');
  const dropdown = $('item-search-results');
  if (!input || !dropdown) return;

  let selectedIdx = -1;

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (query.length < 2) { dropdown.style.display = 'none'; return; }

    const matches = DndData.allItems.filter(i => i.name.toLowerCase().includes(query)).slice(0, 30);
    dropdown.innerHTML = '';
    selectedIdx = -1;
    if (!matches.length) { dropdown.style.display = 'none'; return; }

    matches.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'ac-item';
      div.dataset.idx = idx;
      let detail = item._type;
      if (item._dmgStr) detail += ` | ${item._dmgStr}`;
      if (item._valueStr) detail += ` | ${item._valueStr}`;
      if (item.weight) detail += ` | ${item.weight} lb.`;
      if (item._propStr) detail += ` | ${item._propStr}`;
      if (item.rarity && item.rarity !== 'none') detail += ` | ${item.rarity}`;
      div.innerHTML = `
        <span class="ac-item-name">${item.name} <small style="color:#8B7355">[${item._src || ''}]</small></span>
        <span class="ac-item-detail">${detail}</span>`;
      div.addEventListener('click', () => {
        addItemToInventory(item);
        input.value = '';
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(div);
    });
    dropdown.style.display = 'block';
  });

  input.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.ac-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, items.length - 1); updateACSelection(items, selectedIdx); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); updateACSelection(items, selectedIdx); }
    else if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); items[selectedIdx]?.click(); }
    else if (e.key === 'Escape') { dropdown.style.display = 'none'; }
  });

  input.addEventListener('blur', () => setTimeout(() => dropdown.style.display = 'none', 200));
}

function addItemToInventory(item) {
  const inv = lv('inventory', []);
  const existing = inv.find(i => i.name === item.name);
  if (existing) { existing.qty++; }
  else {
    inv.push({
      name: item.name,
      type: item._type,
      damage: item._dmgStr || '',
      mastery: (item.mastery || []).join(', '),
      properties: item._propStr || '',
      weight: item.weight || 0,
      value: item._valueStr || '',
      ac: item.ac || 0,
      rarity: item.rarity || 'none',
      category: item._category,
      qty: 1,
    });
  }
  sv('inventory', inv);
  renderInventory();
}

function removeFromInventory(name) {
  const inv = lv('inventory', []).filter(i => i.name !== name);
  sv('inventory', inv);
  renderInventory();
}

function restoreInventory() {
  renderInventory();
}

function renderInventory() {
  const inv = lv('inventory', []);
  const sections = { weapon: $('inv-weapons'), armor: $('inv-armor'), gear: $('inv-gear'), magic: $('inv-magic') };
  Object.values(sections).forEach(el => { if (el) el.innerHTML = ''; });

  inv.forEach(item => {
    const container = sections[item.category] || sections.gear;
    if (!container) return;
    const card = document.createElement('div');
    card.className = 'inv-card';
    let detail = '';
    if (item.damage) detail += item.damage;
    if (item.mastery) detail += (detail ? ' | ' : '') + item.mastery;
    if (item.properties) detail += (detail ? ' | ' : '') + item.properties;
    if (item.ac) detail += (detail ? ' | ' : '') + `AC ${item.ac}`;
    if (item.weight) detail += (detail ? ' | ' : '') + `${item.weight} lb.`;
    if (item.value) detail += (detail ? ' | ' : '') + item.value;
    if (item.rarity && item.rarity !== 'none') detail += (detail ? ' | ' : '') + item.rarity;

    card.innerHTML = `
      <div class="inv-card-info">
        <div class="inv-card-name">${item.name}</div>
        <div class="inv-card-detail">${detail}</div>
      </div>
      <div class="inv-card-qty">
        <input type="number" value="${item.qty}" min="1" max="999" data-item="${item.name}">
        <button class="del-btn" title="Remove">✕</button>
      </div>`;

    card.querySelector('input').addEventListener('change', function () {
      const inv = lv('inventory', []);
      const it = inv.find(i => i.name === this.dataset.item);
      if (it) it.qty = parseInt(this.value) || 1;
      sv('inventory', inv);
    });

    card.querySelector('.del-btn').addEventListener('click', () => removeFromInventory(item.name));
    container.appendChild(card);
  });
}

// ---- TOP BUTTONS ----
function initTopButtons() {
  $('btn-export')?.addEventListener('click', () => {
    const data = JSON.stringify(_store, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lv('charName', 'character') || 'character'}_dnd2024.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  $('btn-import')?.addEventListener('click', () => $('import-file')?.click());
  $('import-file')?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (confirm('Import this character? Current data will be replaced.')) {
          _store = data;
          storeSave();
          window.location.reload();
        }
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
  });

  $('btn-clear')?.addEventListener('click', () => {
    if (confirm('Clear ALL character data? This cannot be undone.')) {
      localStorage.removeItem(STORE_KEY);
      window.location.reload();
    }
  });

  $('btn-print')?.addEventListener('click', () => window.print());
  $('btn-add-attack')?.addEventListener('click', () => addAttackRow());
}

// ---- DICE ROLLER ----
function initDiceRoller() {
  const toggle = $('dice-toggle');
  const panel = $('dice-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
  }

  qsa('.dice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = parseInt(btn.dataset.sides);
      const count = Math.max(1, parseInt($('diceCount')?.value) || 1);
      const mod = parseInt($('diceMod')?.value) || 0;
      let total = 0;
      const rolls = [];
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        total += r;
      }
      total += mod;
      const resultEl = $('dice-result');
      if (resultEl) {
        let txt = `${count}d${sides}`;
        if (mod) txt += (mod > 0 ? '+' : '') + mod;
        txt += ` = ${total}`;
        if (count > 1) txt += ` [${rolls.join(', ')}]`;
        resultEl.textContent = txt;
      }
    });
  });
}
