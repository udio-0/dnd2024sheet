/* =============================================
   CHARACTER SHEET - Main sheet view logic
   Refactored from app.js to use CharStore
   ============================================= */
'use strict';

// Instant custom tooltip — reuses .cf-tooltip styling, shows with zero delay.
// Call on any element: attachInstantTooltip(el, '<strong>Title</strong><br>Body text')
window.attachInstantTooltip = function(el, html) {
  let tip = null;
  el.removeAttribute('title');
  el.addEventListener('mouseenter', () => {
    tip = document.createElement('div');
    tip.className = 'cf-tooltip';
    tip.innerHTML = html;
    document.body.appendChild(tip);
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight, vw = window.innerWidth;
    let top = rect.bottom + 4, left = rect.left;
    tip.style.visibility = 'hidden';
    tip.style.display = 'block';
    if (top + tip.offsetHeight > vh) top = rect.top - tip.offsetHeight - 4;
    top = Math.max(8, Math.min(top, vh - tip.offsetHeight - 8));
    left = Math.max(8, Math.min(left, vw - tip.offsetWidth - 8));
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
    tip.style.visibility = '';
    tip.addEventListener('mouseleave', () => { tip?.remove(); tip = null; });
  });
  el.addEventListener('mouseleave', (e) => {
    if (tip && e.relatedTarget && tip.contains(e.relatedTarget)) return;
    tip?.remove(); tip = null;
  });
};

window.Sheet = {
  // ---- CONSTANTS ----
  ABILITIES: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
  ABILITY_NAMES: { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' },
  SKILLS: [
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
  ],
  attackId: 0,

  // XP thresholds per level (index 0 = level 1)
  XP_THRESHOLDS: [
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
  ],

  levelForXP(xp) {
    for (let i = this.XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= this.XP_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  },

  // Ensure XP field reflects at least the minimum XP for the current level
  syncXPToLevel() {
    const xpEl = this.$('charXP');
    if (!xpEl) return;
    const level = this.getLevel();
    const minXP = this.XP_THRESHOLDS[level - 1] || 0;
    const currentXP = parseInt(xpEl.value) || 0;
    if (currentXP < minXP) {
      xpEl.value = minXP;
      this.sv('charXP', minXP);
    }
  },

  // Shorthand helpers
  $(id) { return document.getElementById(id); },
  qs(sel) { return document.querySelector(sel); },
  qsa(sel) { return document.querySelectorAll(sel); },
  sv(key, val) { CharStore.sv(key, val); },
  lv(key, def) { return CharStore.lv(key, def); },

  getModFromScore(score) { return Math.floor(((parseInt(score) || 10) - 10) / 2); },
  fmtMod(mod) { return (mod >= 0 ? '+' : '') + mod; },
  getProfBonus(level) { return Math.floor(((parseInt(level) || 1) - 1) / 4) + 2; },
  getAbilityScore(ab) { return parseInt(this.$(ab)?.value) || 10; },
  getLevel() { return Math.max(1, Math.min(20, parseInt(this.$('charLevel')?.value) || 1)); },

  // ---- INIT (called when navigating to #sheet/:id) ----
  async init(charId) {
    // Always prefer the file on disk over localStorage if a folder is connected
    if (typeof FileSync !== 'undefined' && FileSync.hasFolder()) {
      await FileSync.loadCharacterFromFile(charId);
    }
    CharStore.openCharacter(charId);

    // Set topbar title
    const titleEl = this.$('topbar-title');
    if (titleEl) titleEl.textContent = '';

    this.initTabs();
    this.buildAbilityColumn();
    this.buildSaves();
    this.buildSkills();
    this.bindSimpleFields();
    this.buildSpellSlots();
    this.buildSpellLevelSections();
    this.initDiceRoller();
    this.initSheetButtons();
    this.initNumberSpinners();
    this.initClassSelect();
    this.initSpeciesSelect();
    this.initBackgroundSelect();
    this.initFeatSystem();
    this.initCharOptions();
    this.initResources();
    this.initHpControls();
    this.initWeightTracking();
    this._initSpellConcentration();
    this._initSpellFilters();
    this._initSpellAttackRoll();
    this._initDeathSaves();
    this._initHpRecalc();
    this._initHitDice();
    this._initRestButtons();
    this._initScrollButtons();

    this.recalcAll();
    this.syncXPToLevel();
    this.refreshAttackList();
    this.updateSubclassAccess();
    this.initEquippedGear();
    if (typeof LevelUp !== 'undefined') LevelUp.init();
    if (typeof Multiclass !== 'undefined') Multiclass.init();
    if (typeof NotesManager !== 'undefined') NotesManager.init();
    this.migrateSubclassGrants();

  },

  onDataReady() {
    this.populateDataLists();
    this.buildAttacks();
    this._initAddSpellButton();
    this.initItemSearch();
    this.initMagicItemSearch();
    this.restoreSpells();
    this.restoreInventory();
    this.restoreFeats();
    this._syncFeatSpells();
    this.restoreCharOptions();
    this.initPortrait();
    this.applyClassSelection(this.lv('charClass', ''));
    this.applySpeciesSelection(this.lv('charSpecies', ''));
    this.applyBackgroundSelection(this.lv('charBackground', ''));
    // All init writes are done — clear the loading flag so user edits mark dirty normally
    CharStore.finishLoading();
  },

  teardown() {
    CharStore.closeCharacter();
    // Clear dynamic content
    const containers = ['ability-column', 'save-list', 'skill-list', 'attacks-body',
      'spell-slots-bar', 'spell-levels-mount', 'spell-cards-0',
      'charopts-container', 'full-charopts-list', 'charopt-list'];
    containers.forEach(id => {
      const el = this.$(id);
      if (el) el.innerHTML = '';
    });
    this.attackId = 0;
    if (typeof NotesManager !== 'undefined') NotesManager.teardown();
  },

  // ---- TABS ----
  initTabs() {
    const sheetView = this.$('view-sheet');
    if (!sheetView) return;
    sheetView.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        sheetView.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        sheetView.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = this.$(`tab-${tab.dataset.tab}`);
        if (panel) panel.classList.add('active');
        // Hide undo/redo on Notes tab
        const isNotes = tab.dataset.tab === 'notes';
        const undoBtn = this.$('btn-undo');
        const redoBtn = this.$('btn-redo');
        if (undoBtn) undoBtn.style.display = isNotes ? 'none' : '';
        if (redoBtn) redoBtn.style.display = isNotes ? 'none' : '';
      });
    });
  },

  // ---- BUILD ABILITY COLUMN ----
  buildAbilityColumn() {
    const container = this.$('ability-column');
    if (!container) return;
    container.innerHTML = '';
    this.ABILITIES.forEach(ab => {
      const block = document.createElement('div');
      block.className = 'ability-block';
      const savedScore = this.lv(ab, 10);
      block.innerHTML = `
        <div class="ability-name">${this.ABILITY_NAMES[ab]}</div>
        <div class="ability-mod-circle" id="${ab}-mod">${this.fmtMod(this.getModFromScore(savedScore))}</div>
        <div class="spin-wrap">
          <button class="spin-btn spin-minus" tabindex="-1">−</button>
          <input type="number" class="ability-score-input" id="${ab}" value="${savedScore}" min="1" max="30" data-save="${ab}">
          <button class="spin-btn spin-plus" tabindex="-1">+</button>
        </div>`;
      container.appendChild(block);
    });
  },

  // ---- BUILD SAVES ----
  buildSaves() {
    const container = this.$('save-list');
    if (!container) return;
    container.innerHTML = '';
    const SAVES = this.ABILITIES.map(a => ({ key: a, label: this.ABILITY_NAMES[a] }));
    SAVES.forEach(s => {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <input type="checkbox" class="save-prof" data-save-ab="${s.key}">
        <span class="stat-val stat-val-btn" id="save-${s.key}" title="Roll ${s.label} save">+0</span>
        <span class="stat-label">${s.label}</span>`;
      container.appendChild(row);
      const cb = row.querySelector('.save-prof');
      cb.checked = this.lv(`saveProf_${s.key}`, false);
      cb.addEventListener('change', () => { this.sv(`saveProf_${s.key}`, cb.checked); this.recalcAll(); });
      row.querySelector('.stat-val').addEventListener('click', () => {
        const mod = parseInt(this.$(`save-${s.key}`)?.textContent) || 0;
        this._conditionRollD20(`${s.label} Save`, mod, 'save', s.key);
      });
    });
  },

  // ---- BUILD TOOL PROFICIENCIES (appended to skill-list) ----
  buildToolProficiencies() {
    const container = this.$('skill-list');
    if (!container) return;
    // Remove any existing tool rows
    container.querySelectorAll('.tool-prof-row').forEach(r => r.remove());
    const tools = CharStore.lv('toolProficiencies', []);
    if (!tools.length) return;
    const prof = this.getProfBonus(this.getLevel());
    tools.forEach((toolName, idx) => {
      const key = 'tool_' + toolName.replace(/\W+/g, '_').toLowerCase();
      const isProf = CharStore.lv(`toolProf_${key}`, true);
      const isExpert = CharStore.lv(`toolExpert_${key}`, false);
      const initState = isExpert ? 2 : isProf ? 1 : 0;
      const bonus = isExpert ? prof * 2 : isProf ? prof : 0;
      const row = document.createElement('div');
      row.className = 'stat-row tool-prof-row' + (idx === 0 ? ' tool-prof-separator' : '');
      row.innerHTML = `
        <span class="skill-state-toggle" data-toolkey="${key}" data-state="${initState}" title="Click to cycle: none / proficient / expertise"></span>
        <span class="stat-val stat-val-btn" id="tool-val-${key}" title="Roll ${toolName} check">${this.fmtMod(bonus)}</span>
        <span class="stat-label">${toolName.replace(/\b\w/g, c => c.toUpperCase())}</span>
        <span class="stat-tag" style="opacity:0.5">TOOL</span>`;
      container.appendChild(row);
      const toggle = row.querySelector('.skill-state-toggle');
      toggle.addEventListener('click', () => {
        const cur = parseInt(toggle.dataset.state);
        const next = (cur + 1) % 3;
        toggle.dataset.state = next;
        CharStore.sv(`toolProf_${key}`, next >= 1);
        CharStore.sv(`toolExpert_${key}`, next === 2);
        this.recalcAll();
      });
      row.querySelector('.stat-val').addEventListener('click', () => {
        const p = this.getProfBonus(this.getLevel());
        const st = parseInt(toggle.dataset.state);
        const b = st === 2 ? p * 2 : st === 1 ? p : 0;
        Dice.showResult(`${toolName} Check`, Dice.rollD20(b));
      });
    });
  },

  // ---- REFRESH PROFICIENCIES & LANGUAGES TEXTAREA ----
  refreshProfLanguages() {
    const el = this.$('profLanguages');
    if (!el) return;
    const parts = [];
    const toSentenceCase = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
    // Merge background-chosen languages and class languages (e.g. Thieves' Cant) into one line
    const classLangs = CharStore.lv('classLanguages', []);
    const chosenLangs = CharStore.lv('languages', []);
    const allLangs = [
      ...(chosenLangs.length ? chosenLangs : (() => {
        const bgLang = CharStore.lv('bgLanguages', { fixed: [], chooseCount: 0 });
        return bgLang.fixed;
      })()),
      ...classLangs.filter(l => !chosenLangs.some(c => c.toLowerCase() === l.toLowerCase())),
    ];
    if (allLangs.length) parts.push(`Languages: ${allLangs.map(toSentenceCase).join(', ')}`);
    else {
      const bgLang = CharStore.lv('bgLanguages', { fixed: [], chooseCount: 0 });
      if (bgLang.chooseCount) parts.push(`Languages: +${bgLang.chooseCount} of your choice`);
    }
    // Tool proficiencies from background
    const tools = CharStore.lv('toolProficiencies', []);
    if (tools.length) parts.push(`Tools: ${tools.map(toSentenceCase).join(', ')}`);
    // Weapon proficiencies from class
    const wpn = CharStore.lv('classWeaponProf', []);
    if (wpn.length) parts.push(`Weapons: ${wpn.map(w => toSentenceCase(stripTags(w))).join(', ')}`);
    // Armor proficiencies from class
    const arm = CharStore.lv('classArmorProf', []);
    if (arm.length) parts.push(`Armor: ${arm.map(a => toSentenceCase(stripTags(a))).join(', ')}`);
    el.value = parts.join('\n');
    CharStore.sv('profLanguages', el.value);
  },

  // ---- BUILD SKILLS ----
  buildSkills() {
    const container = this.$('skill-list');
    if (!container) return;
    container.innerHTML = '';
    this.SKILLS.forEach(s => {
      const isProficient = this.lv(`skillProf_${s.key}`, false);
      const isExpert = this.lv(`skillExpert_${s.key}`, false);
      const initState = isExpert ? 2 : isProficient ? 1 : 0;
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <span class="skill-state-toggle" data-skill="${s.key}" data-state="${initState}" title="Click to cycle: none / proficient / expertise"></span>
        <span class="stat-val stat-val-btn" id="skill-${s.key}" title="Roll ${s.label} check">+0</span>
        <span class="stat-label">${s.label}</span>
        <span class="stat-tag">${s.ability.toUpperCase()}</span>`;
      container.appendChild(row);
      const toggle = row.querySelector('.skill-state-toggle');
      toggle.addEventListener('click', () => {
        const cur = parseInt(toggle.dataset.state);
        const next = (cur + 1) % 3;
        toggle.dataset.state = next;
        this.sv(`skillProf_${s.key}`, next >= 1);
        this.sv(`skillExpert_${s.key}`, next === 2);
        this.recalcAll();
      });
      row.querySelector('.stat-val').addEventListener('click', () => {
        const mod = parseInt(this.$(`skill-${s.key}`)?.textContent) || 0;
        this._conditionRollD20(`${s.label} Check`, mod, 'check', s.ability);
      });
    });
    this.buildToolProficiencies();
  },

  // ---- RECALCULATION ENGINE ----
  recalcAll() {
    const level = this.getLevel();
    // Proficiency bonus is based on total character level (primary + multiclass levels).
    const totalLevel = (typeof Multiclass !== 'undefined') ? Multiclass.getTotalLevel() : level;
    const lvDisplay = this.$('charLevel-display');
    if (lvDisplay) lvDisplay.textContent = totalLevel;
    const prof = this.getProfBonus(totalLevel);
    const mods = {};

    this.ABILITIES.forEach(ab => {
      const score = this.getAbilityScore(ab);
      mods[ab] = this.getModFromScore(score);
      const el = this.$(`${ab}-mod`);
      if (el) el.textContent = this.fmtMod(mods[ab]);
    });

    const profEl = this.$('profBonus');
    if (profEl) profEl.textContent = this.fmtMod(prof);

    // Jack of All Trades: Bard level 2+ adds half proficiency (rounded down) to non-proficient ability checks
    const _className = this.lv('charClass', '');
    const _jackOfAllTrades = _className === 'Bard' && level >= 2;
    const halfProf = Math.floor(prof / 2);

    const initEl = this.$('initiative');
    if (initEl) {
      // Alert feat (2024): adds Proficiency Bonus to initiative
      const _feats = this.lv('feats', []);
      const _hasAlert = _feats.some(f => this._featName(f).toLowerCase() === 'alert');
      const initMod = mods.dex + (_jackOfAllTrades ? halfProf : 0) + (_hasAlert ? prof : 0);
      initEl.textContent = this.fmtMod(initMod);
      if (!initEl.dataset.rollBound) {
        initEl.dataset.rollBound = '1';
        initEl.style.cursor = 'pointer';
        initEl.addEventListener('click', () => {
          const mod = parseInt(initEl.textContent) || 0;
          this._conditionRollD20('Initiative', mod, 'initiative', 'dex');
        });
      }
    }

    // Saves
    const coverBonus = this._getCoverBonus();
    const SAVES = this.ABILITIES.map(a => ({ key: a, label: this.ABILITY_NAMES[a] }));
    SAVES.forEach(s => {
      const cb = this.qs(`.save-prof[data-save-ab="${s.key}"]`);
      let total = mods[s.key] + (cb?.checked ? prof : 0);
      // Cover applies to Dex saves
      if (s.key === 'dex' && coverBonus > 0) total += coverBonus;
      const el = this.$(`save-${s.key}`);
      if (el) el.textContent = this.fmtMod(total);
    });

    // Skills
    let percBonus = 0;
    const _divineOrder = this.lv('charDivineOrder', '');
    const _thaumaturgeBonus = (_className === 'Cleric' && _divineOrder === 'Thaumaturge')
      ? Math.max(1, mods.wis || 0) : 0;

    this.SKILLS.forEach(s => {
      const toggle = this.qs(`.skill-state-toggle[data-skill="${s.key}"]`);
      const state = parseInt(toggle?.dataset.state || '0');
      const isProficient = state >= 1;
      const isExpert = state === 2;
      const bonus = isExpert ? prof * 2 : isProficient ? prof : (_jackOfAllTrades ? halfProf : 0);
      let total = mods[s.ability] + bonus;
      // Thaumaturge: +Wisdom mod (min 1) to Arcana and Religion checks
      if (_thaumaturgeBonus && (s.key === 'arcana' || s.key === 'religion')) total += _thaumaturgeBonus;
      const el = this.$(`skill-${s.key}`);
      if (el) el.textContent = this.fmtMod(total);
      if (s.key === 'perception') percBonus = bonus;
    });

    // Tool proficiencies
    const tools = CharStore.lv('toolProficiencies', []);
    tools.forEach(toolName => {
      const key = 'tool_' + toolName.replace(/\W+/g, '_').toLowerCase();
      const toggle = this.qs(`.skill-state-toggle[data-toolkey="${key}"]`);
      const state = parseInt(toggle?.dataset.state || '1');
      const bonus = state === 2 ? prof * 2 : state === 1 ? prof : 0;
      const el = this.$(`tool-val-${key}`);
      if (el) el.textContent = this.fmtMod(bonus);
    });

    // Passive perception
    const passiveEl = this.$('passivePerception');
    if (passiveEl) passiveEl.textContent = 10 + mods.wis + percBonus;

    // Spell stats
    const spellAb = this.$('spellcastingAbility')?.value;
    if (spellAb && mods[spellAb] !== undefined) {
      const sm = mods[spellAb];
      const dcEl = this.$('spellSaveDC');
      const atkEl = this.$('spellAttackBonus');
      if (dcEl) dcEl.textContent = 8 + prof + sm;
      if (atkEl) atkEl.textContent = this.fmtMod(prof + sm);
    }

    // Auto-calculate prepared spells max and spell slots
    this._calcPreparedMax(mods, level);
    this.buildSpellSlots();

    this.refreshFeatList();
    this.renderCarryCapacity();
    this.qsa('#attacks-body tr').forEach(tr => tr._refreshRow?.());
    this.syncHitDice();
    this._updateEquippedACSummary();
    this.applyConditionEffects();

    // Sync resource maxes that depend on ability scores (e.g. Bardic Inspiration = CHA mod)
    if (typeof ClassResources !== 'undefined') {
      ClassResources.updateResourcesOnLevelUp(level);
      this.renderResources();
    }

    // Re-render multiclass section on main sheet
    if (typeof Multiclass !== 'undefined') Multiclass.renderSection();
  },

  // ---- BIND SIMPLE FIELDS ----
  bindSimpleFields() {
    const _acMap = { charSubclass: 'subclass-list', charAlignment: 'alignment-list' };
    this.qsa('[data-save]').forEach(el => {
      const key = el.dataset.save;
      if (_acMap[key] && window.setupAutocomplete) setupAutocomplete(el, _acMap[key]);
      if (el.type === 'checkbox') el.checked = this.lv(key, false);
      else el.value = this.lv(key, '');
      const handler = () => {
        this.sv(key, el.type === 'checkbox' ? el.checked : el.value);
        if (this.ABILITIES.includes(key) || key === 'charLevel' || key === 'spellcastingAbility') this.recalcAll();
        if (key === 'charLevel') this.updateSubclassAccess();
        if (key === 'spellPreparedMax') this._updatePreparedCount();
        if (key === 'charSubclass') { const cls = this.lv('charClass', ''); if (cls) this.displayClassFeatures(cls); }
        if (key === 'charName') {
          const titleEl = this.$('topbar-title');
          if (titleEl) titleEl.textContent = el.value || 'Character Sheet';
        }
      };
      el.addEventListener('change', handler);
      el.addEventListener('input', handler);
    });

    // XP change -> detect level difference and open level-up
    const xpEl = this.$('charXP');
    if (xpEl) {
      let xpSnapshot = parseInt(xpEl.value) || 0;
      xpEl.addEventListener('focus', () => {
        xpSnapshot = parseInt(xpEl.value) || 0;
      });
      xpEl.addEventListener('change', () => {
        const xp = parseInt(xpEl.value) || 0;
        const xpLevel = this.levelForXP(xp);
        const currentLevel = this.getLevel();
        if (xpLevel > currentLevel && xpLevel <= 20) {
          LevelUp._xpBeforeLevelUp = xpSnapshot;
          LevelUp._startLevel = currentLevel;
          LevelUp._newLevel = xpLevel;
          LevelUp._pending = {};
          LevelUp._hp = { choice: 'avg', rolls: [], manualValue: null };
          LevelUp._buildModal();
          document.getElementById('levelup-backdrop').style.display = 'flex';
        } else {
          xpSnapshot = xp;
        }
      });
    }
  },

  // ---- ATTACKS ----
  buildAttacks() {
    const saved = this.lv('attacks', []);
    saved.forEach(a => this.addAttackRow(a));
    this._initAttackDragDrop();
  },

  _initAttackDragDrop() {
    const tbody = this.$('attacks-body');
    if (!tbody || tbody._dragInited) return;
    tbody._dragInited = true;
    let dragRow = null;

    tbody.addEventListener('dragstart', e => {
      const tr = e.target.closest('tr');
      if (!tr || !tbody.contains(tr)) return;
      dragRow = tr;
      tr.classList.add('atk-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    tbody.addEventListener('dragend', e => {
      if (dragRow) dragRow.classList.remove('atk-dragging');
      tbody.querySelectorAll('tr').forEach(r => r.classList.remove('atk-drag-over'));
      dragRow = null;
    });

    tbody.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const tr = e.target.closest('tr');
      if (!tr || tr === dragRow || !tbody.contains(tr)) return;
      tbody.querySelectorAll('tr').forEach(r => r.classList.remove('atk-drag-over'));
      tr.classList.add('atk-drag-over');
    });

    tbody.addEventListener('dragleave', e => {
      const tr = e.target.closest('tr');
      if (tr) tr.classList.remove('atk-drag-over');
    });

    tbody.addEventListener('drop', e => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      if (!tr || !dragRow || tr === dragRow || !tbody.contains(tr)) return;
      // Determine if we should insert before or after
      const rect = tr.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        tbody.insertBefore(dragRow, tr);
      } else {
        tbody.insertBefore(dragRow, tr.nextSibling);
      }
      tbody.querySelectorAll('tr').forEach(r => r.classList.remove('atk-drag-over'));
      this.saveAttacks();
    });
  },

  addAttackRow(data = {}) {
    const tbody = this.$('attacks-body');
    if (!tbody) return;
    const id = this.attackId++;
    const tr = document.createElement('tr');
    tr.dataset.id = id;

    const abilities = ['str','dex','con','int','wis','cha'];
    const savedAb = data.ability || 'str';
    const abilityOpts = abilities.map(a =>
      `<option value="${a}"${savedAb === a ? ' selected' : ''}>${a.toUpperCase()}</option>`
    ).join('');

    tr.innerHTML = `
      <td class="atk-drag-cell"><span class="atk-drag-handle" title="Drag to reorder">⠿</span></td>
      <td><input type="text" class="atk-name" placeholder="Weapon name" value="${data.name || ''}"></td>
      <td class="atk-ability-cell"><select class="atk-ability">${abilityOpts}</select></td>
      <td class="atk-prof-cell"><span class="skill-state-toggle atk-prof-cb" data-state="${data.prof ? '1' : '0'}" title="Add proficiency bonus to attack roll"></span></td>
      <td class="atk-bonus-cell"><button class="atk-bonus-btn" title="Click to roll attack">+0</button></td>
      <td class="atk-dice-cell">
        <button class="atk-dice-btn" title="Click to roll damage · Double-click to edit dice">—</button>
        <input type="text" class="atk-dice-edit" placeholder="1d8" value="${data.damageDice || ''}" style="display:none">
      </td>
      <td><input type="text" class="atk-type" placeholder="Slashing" value="${data.damageType || ''}"></td>
      <td><input type="text" class="atk-mastery" placeholder="—" value="${data.mastery || ''}"></td>
      <td class="atk-ed-cell"><button class="atk-src-btn" title="Toggle edition"></button></td>`;
    tbody.appendChild(tr);

    // Drag handle — only allow drag when grabbing the handle
    const handle = tr.querySelector('.atk-drag-handle');
    handle.addEventListener('mousedown', () => { tr.draggable = true; });
    tr.addEventListener('dragend', () => { tr.draggable = false; });

    const nameInput    = tr.querySelector('.atk-name');
    if (window.setupAutocomplete) setupAutocomplete(nameInput, 'attack-list');
    const abilitySelect= tr.querySelector('.atk-ability');
    const profCb       = tr.querySelector('.atk-prof-cb');
    const bonusBtn     = tr.querySelector('.atk-bonus-btn');
    const diceBtn      = tr.querySelector('.atk-dice-btn');
    const diceEdit     = tr.querySelector('.atk-dice-edit');
    const masteryInput = tr.querySelector('.atk-mastery');
    const srcBtn       = tr.querySelector('.atk-src-btn');

    const DMG_NAMES = { S:'Slashing', P:'Piercing', B:'Bludgeoning', N:'Necrotic', R:'Radiant', F:'Fire', C:'Cold', L:'Lightning', T:'Thunder', O:'Force', A:'Acid', Y:'Psychic', I:'Poison' };

    // ---- refreshRow: recalculate bonus and damage display ----
    const refreshRow = () => {
      const level = this.getLevel();
      const prof  = this.getProfBonus(level);
      const ab    = abilitySelect.value;
      const mod   = this.getModFromScore(this.getAbilityScore(ab));
      const bonus = mod + (profCb.dataset.state === '1' ? prof : 0);
      bonusBtn.textContent = this.fmtMod(bonus);

      const baseDice = diceEdit.value.trim();
      if (baseDice) {
        diceBtn.textContent = mod !== 0
          ? `${baseDice}${mod >= 0 ? '+' : ''}${mod}`
          : baseDice;
      } else {
        diceBtn.textContent = '—';
      }

      // Mastery enabled only when edition is XPHB
      const src = srcBtn.dataset.src || '';
      const isXphb = /^xphb$/i.test(src);
      masteryInput.disabled = !isXphb;

      // Highlight mastery input if weapon is in character's weaponMastery list
      const weaponName = nameInput.value.trim();
      const charMastery = CharStore.lv('weaponMastery', []) || [];
      const isActive = weaponName &&
        charMastery.some(m => m.toLowerCase() === weaponName.toLowerCase()) &&
        masteryInput.value.trim();
      masteryInput.classList.toggle('active-mastery', !!isActive);
      masteryInput.title = isActive ? 'Weapon Mastery active: ' + masteryInput.value.trim() : '';
    };
    tr._refreshRow = refreshRow;

    // ---- bonus button: click to roll attack ----
    bonusBtn.addEventListener('click', () => {
      const bonusVal = parseInt(bonusBtn.textContent) || 0;
      this._conditionRollD20(`${nameInput.value || 'Attack'} Attack`, bonusVal, 'attack');
    });

    // ---- damage button: click to roll, double-click to edit ----
    diceBtn.addEventListener('click', () => {
      const baseDice = diceEdit.value.trim();
      if (!baseDice) return;
      const mod = this.getModFromScore(this.getAbilityScore(abilitySelect.value));
      const expr = mod !== 0 ? `${baseDice}${mod >= 0 ? '+' : ''}${mod}` : baseDice;
      const result = Dice.rollDamageString(expr);
      if (result && result.total !== undefined) Dice.showResult(`${nameInput.value || 'Attack'} Damage`, result);
    });
    diceBtn.addEventListener('dblclick', () => {
      diceBtn.style.display = 'none';
      diceEdit.style.display = '';
      diceEdit.focus(); diceEdit.select();
    });
    diceEdit.addEventListener('blur', () => {
      diceEdit.style.display = 'none';
      diceBtn.style.display = '';
      refreshRow(); this.saveAttacks();
    });
    diceEdit.addEventListener('keydown', e => {
      if (e.key === 'Enter') diceEdit.blur();
      if (e.key === 'Escape') { diceEdit.style.display = 'none'; diceBtn.style.display = ''; }
    });

    // ---- change listeners ----
    abilitySelect.addEventListener('change', () => { refreshRow(); this.saveAttacks(); });
    profCb.addEventListener('click', () => { profCb.dataset.state = profCb.dataset.state === '1' ? '0' : '1'; refreshRow(); this.saveAttacks(); });
    tr.querySelectorAll('.atk-name, .atk-type, .atk-mastery').forEach(i => i.addEventListener('input', () => this.saveAttacks()));

    // ---- source/edition toggle ----
    let variants = [];
    let variantIdx = 0;
    const updateSrcBtn = () => {
      if (variants.length === 0) {
        srcBtn.textContent = '—'; srcBtn.dataset.src = ''; srcBtn.disabled = true;
      } else {
        const realSrc = variants[variantIdx]._src || '';
        srcBtn.dataset.src = realSrc;
        srcBtn.textContent = realSrc.replace(/PHB/gi, '').trim() || '—';
        srcBtn.disabled = variants.length <= 1;
      }
      refreshRow();
    };
    updateSrcBtn();
    srcBtn.addEventListener('click', () => {
      variantIdx = (variantIdx + 1) % variants.length;
      fillFromItem(variants[variantIdx]);
      updateSrcBtn();
      this.saveAttacks();
    });

    // ---- fill row from a DndData weapon item ----
    const fillFromItem = (item) => {
      if (!item) return;
      const isFinesse = item.property?.some(p => p === 'F' || (typeof p === 'string' && p.startsWith('F')));
      const isRanged  = item.type?.startsWith?.('R');
      abilitySelect.value = isFinesse ? 'dex' : isRanged ? 'dex' : 'str';
      diceEdit.value = item.dmg1 || '';
      tr.querySelector('.atk-type').value = DMG_NAMES[item.dmgType] || item.dmgType || '';
      masteryInput.value = (item.mastery || []).map(m => m.split('|')[0]).join(', ');
      refreshRow();
    };

    // ---- name change: auto-fill from DndData ----
    nameInput.addEventListener('change', () => {
      const val = nameInput.value.trim().toLowerCase();
      if (val === '✕ delete this entry') { tr.remove(); this.saveAttacks(); this.refreshAttackList(); return; }
      if (!val) return;

      if (val === 'unarmed strike') {
        abilitySelect.value = 'str'; diceEdit.value = '';
        tr.querySelector('.atk-type').value = 'Bludgeoning'; masteryInput.value = '';
        variants = []; updateSrcBtn(); refreshRow(); this.saveAttacks(); return;
      }
      if (val === 'improvised weapon') {
        abilitySelect.value = 'str'; diceEdit.value = '1d4';
        tr.querySelector('.atk-type').value = 'Bludgeoning'; masteryInput.value = '';
        variants = []; updateSrcBtn(); refreshRow(); this.saveAttacks(); return;
      }

      variants = DndData.loaded
        ? DndData.allItems.filter(i => i.name.toLowerCase() === val && i.weaponCategory)
        : [];
      variantIdx = 0;
      if (variants.length > 0) {
        fillFromItem(variants[0]);
        updateSrcBtn();
      } else {
        const invItem = this.lv('inventory', []).find(i => i.name.toLowerCase() === val);
        if (invItem) {
          const parts = (invItem.damage || '').split(' ');
          diceEdit.value = parts[0] || '';
          tr.querySelector('.atk-type').value = parts[1] || '';
          refreshRow();
        }
      }
      this.saveAttacks();
    });

    // ---- restore saved state on load ----
    if (data.name) {
      variants = (DndData.allItems || []).filter(i =>
        i.name.toLowerCase() === data.name.toLowerCase() && i.weaponCategory
      );
      variantIdx = data._src ? Math.max(0, variants.findIndex(v => v._src === data._src)) : 0;
      updateSrcBtn();
    }
    refreshRow();
  },

  saveAttacks() {
    const rows = [];
    this.qsa('#attacks-body tr').forEach(tr => {
      const srcBtn = tr.querySelector('.atk-src-btn');
      rows.push({
        name:       tr.querySelector('.atk-name')?.value || '',
        ability:    tr.querySelector('.atk-ability')?.value || 'str',
        prof:       tr.querySelector('.atk-prof-cb')?.dataset.state === '1' || false,
        damageDice: tr.querySelector('.atk-dice-edit')?.value || '',
        damageType: tr.querySelector('.atk-type')?.value || '',
        mastery:    tr.querySelector('.atk-mastery')?.value || '',
        _src:       srcBtn?.dataset.src || '',
      });
    });
    this.sv('attacks', rows);
    this.refreshAttackList();
  },

  // ---- CLASS SELECTION ----
  initClassSelect() {
    const input = this.$('charClass');
    if (!input) return;
    if (window.setupAutocomplete) setupAutocomplete(input, 'class-list');
    input.addEventListener('change', () => {
      this.sv('charClass', input.value);
      this.applyClassSelection(input.value);
      this.recalcAll();
      this._updateLearnScrollVisibility();
    });
  },

  applyClassSelection(className) {
    if (!className || !DndData.loaded) return;
    const info = getClassInfo(className);
    if (!info) return;

    // Sync hit dice from class/level
    this.syncHitDice();

    // Clear all saving throw proficiencies first, then apply the new class's
    ['str','dex','con','int','wis','cha'].forEach(ab => {
      const cb = this.qs(`.save-prof[data-save-ab="${ab}"]`);
      if (cb) { cb.checked = false; this.sv(`saveProf_${ab}`, false); }
    });
    info.savingThrows.forEach(ab => {
      const cb = this.qs(`.save-prof[data-save-ab="${ab}"]`);
      if (cb) { cb.checked = true; this.sv(`saveProf_${ab}`, true); }
    });

    const scInput = this.$('spellcastingClass');
    if (scInput) { scInput.value = className; this.sv('spellcastingClass', className); }

    // Store class weapon/armor proficiencies (augmented by Divine Order for Cleric)
    const _baseWeaponProf = [...(info.weaponProf || [])];
    const _baseArmorProf  = [...(info.armorProf  || [])];
    if (className === 'Cleric' && this.lv('charDivineOrder', '') === 'Protector') {
      if (!_baseWeaponProf.some(p => /martial/i.test(p))) _baseWeaponProf.push('Martial Weapons');
      if (!_baseArmorProf.some(p => /heavy/i.test(p)))   _baseArmorProf.push('Heavy Armor');
    }
    this.sv('classWeaponProf', _baseWeaponProf);
    this.sv('classArmorProf',  _baseArmorProf);

    // Store fixed class tool proficiencies (e.g. Rogue's Thieves' Tools) and merge into toolProficiencies
    const fixedClassTools = info.fixedToolProf || [];
    this.sv('classFixedToolProf', fixedClassTools);
    if (fixedClassTools.length) {
      const existing = (this.lv('toolProficiencies', []) || []).map(t => t.toLowerCase());
      const toAdd = fixedClassTools.filter(t => !existing.includes(t.toLowerCase()));
      if (toAdd.length) this.sv('toolProficiencies', [...(this.lv('toolProficiencies', []) || []), ...toAdd]);
    }

    // Store class language proficiencies (e.g. Thieves' Cant for Rogue, Druidic)
    const classLangs = [];
    if (typeof getClassFeaturesByLevel === 'function') {
      const features = getClassFeaturesByLevel(className);
      const level1 = features[1] || [];
      level1.filter(f => /thieves.+cant|druidic/i.test(f.name)).forEach(f => classLangs.push(f.name));
    }
    this.sv('classLanguages', classLangs);

    this.refreshProfLanguages();
    this.displayClassFeatures(className);
    this.renderFightingStylePicker(info);

    const subList = this.$('subclass-list');
    if (subList) {
      subList.innerHTML = '';
      const ua     = typeof isUAEnabled  === 'function' ? isUAEnabled()  : true;
      const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
      const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
      info.subclasses
        .filter(sc => {
          if (sc.source === 'UA2024') return ua && show24;
          if (typeof is2024Source === 'function' && is2024Source(sc.source)) return show24;
          return show14;
        })
        .sort((a, b) => (a.name ?? a).localeCompare(b.name ?? b))
        .forEach(sc => {
          const opt = document.createElement('option');
          opt.value = sc.name ?? sc;
          opt.textContent = sc.src ? `${sc.name} — ${sc.src}` : (sc.name ?? sc);
          subList.appendChild(opt);
        });
    }

    this.updateSubclassAccess();
    this.recalcAll();
  },

  // Enable or disable the subclass input based on current level vs subclass unlock level
  updateSubclassAccess() {
    const subInput = this.$('charSubclass');
    if (!subInput) return;
    const className = this.lv('charClass', '');
    const level = this.getLevel();
    const subclassLevel = (typeof LevelUp !== 'undefined' && LevelUp.SUBCLASS_LEVELS)
      ? (LevelUp.SUBCLASS_LEVELS[className] || 3)
      : 3;
    const locked = level < subclassLevel;
    subInput.disabled = locked;
    subInput.title = locked ? `Subclass unlocks at level ${subclassLevel}` : '';
    if (locked) {
      subInput.value = '';
      this.sv('charSubclass', '');
    }
  },

  displayClassFeatures(className) {
    const features = getClassFeaturesByLevel(className);
    const level = this.getLevel();

    const box = this.$('class-features-box');
    const textEl = this.$('class-features-text');
    const subtitleEl = this.$('class-features-subtitle');
    if (box && textEl) {
      box.style.display = 'block';
      if (subtitleEl) subtitleEl.textContent = `(${className} Lv.${level})`;
      const items = [];
      const subclassName = this.lv('charSubclass', '');
      const details = DndData.classDetails?.[className];
      const scEntry = subclassName ? (details?.subclasses || []).find(sc => sc.name === subclassName) : null;
      const scShortName = scEntry?.shortName || subclassName;
      for (let l = 1; l <= level; l++) {
        if (features[l]) {
          features[l].forEach(f => {
            const isPlaceholder = /subclass feature/i.test(f.name) || /\bsubclass$/i.test(f.name);
            if (isPlaceholder && subclassName && details) {
              const scFeatures = (details.subclassFeatures || []).filter(sf =>
                sf.level === l && (
                  sf.subclassShortName === scShortName ||
                  sf.subclassShortName === subclassName ||
                  sf.subclassShortName?.toLowerCase() === scShortName.toLowerCase() ||
                  sf.subclassShortName?.toLowerCase() === subclassName.toLowerCase()
                )
              );
              if (scFeatures.length) {
                const _mergedFeatures = this._mergeSubclassFeatures(scFeatures, className, subclassName, scShortName);
                _mergedFeatures.forEach(sf => {
                  const sfHtml = typeof entriesToHtml === 'function' ? entriesToHtml(sf.entries) : (sf._mergedHtml || '');
                  items.push({ label: `Lv.${l}: ${sf.name}`, html: sf._mergedHtml || sfHtml, subclass: true });
                });
                return;
              }
              // Fallback: check UA subclass data
              const uaFeatures = this._getUASubclassFeatures(subclassName, className, l);
              if (uaFeatures.length) {
                uaFeatures.forEach(sf => {
                  items.push({ label: `Lv.${l}: ${sf.name}`, html: sf.html, subclass: true });
                });
                return;
              }
            }
            let html = f.html || f.text || '';
            // Append chosen Psionic Disciplines to the Psionic Discipline feature tooltip
            if (f.name === 'Psionic Discipline') {
              html = this._appendPsionicDisciplines(html);
            }
            // Append chosen Metamagic options to the Metamagic feature tooltip
            if (/^Metamagic$/i.test(f.name)) {
              html = this._appendMetamagicChoices(html, 'Metamagic');
            }
            items.push({ label: `Lv.${l}: ${f.name}`, html });
          });
        }
      }
      if (!items.length) {
        textEl.innerHTML = '<div>No features found.</div>';
      } else {
        textEl.innerHTML = `<div class="cf-two-col">${items.map((it, i) =>
          `<div class="cf-item" data-cf-idx="${i}">${it.label}</div>`
        ).join('')}</div>`;
        // JS-driven tooltips with keyword highlighting
        let tip = null;
        const _highlightTooltip = this._highlightKeywords.bind(this);
        textEl.querySelectorAll('.cf-item').forEach(el => {
          const idx = parseInt(el.dataset.cfIdx);
          const rawHtml = items[idx]?.html;
          if (!rawHtml) return;
          el.addEventListener('mouseenter', () => {
            if (tip) tip.remove();
            tip = document.createElement('div');
            tip.className = 'cf-tooltip';
            tip.innerHTML = _highlightTooltip(rawHtml);
            document.body.appendChild(tip);
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            let top = rect.bottom + 4;
            let left = rect.left;
            // Flip above if overflowing bottom
            if (top + tip.offsetHeight > vh) top = rect.top - tip.offsetHeight - 4;
            // Clamp to viewport edges
            top = Math.max(8, Math.min(top, vh - tip.offsetHeight - 8));
            left = Math.max(8, Math.min(left, vw - tip.offsetWidth - 8));
            tip.style.top = top + 'px';
            tip.style.left = left + 'px';
            // Allow mouse to enter tooltip for scrolling
            tip.addEventListener('mouseleave', () => { if (tip) { tip.remove(); tip = null; } });
          });
          el.addEventListener('mouseleave', (e) => {
            // Don't remove if mouse moved onto the tooltip itself
            if (tip && e.relatedTarget && tip.contains(e.relatedTarget)) return;
            if (tip) { tip.remove(); tip = null; }
          });
        });
      }
    }

    const fullEl = this.$('full-class-features');
    const fullSub = this.$('full-class-subtitle');
    if (fullEl) {
      if (fullSub) fullSub.textContent = `(${className})`;
      fullEl.innerHTML = '';

      // Get subclass features if a subclass is selected
      const subclassName = this.lv('charSubclass', '');
      const details = DndData.classDetails?.[className];
      const scEntry = subclassName ? (details?.subclasses || []).find(sc => sc.name === subclassName) : null;
      const scShortName = scEntry?.shortName || subclassName;

      for (let l = 1; l <= 20; l++) {
        if (!features[l]) continue;
        features[l].forEach(f => {
          const isSubclassPlaceholder = /subclass feature/i.test(f.name) || /\bsubclass$/i.test(f.name);

          if (isSubclassPlaceholder && subclassName && details) {
            // Find actual subclass features for this level (standard 5etools data)
            const scFeatures = (details.subclassFeatures || []).filter(sf =>
              sf.level === l && (
                sf.subclassShortName === scShortName ||
                sf.subclassShortName === subclassName ||
                sf.subclassShortName?.toLowerCase() === scShortName.toLowerCase() ||
                sf.subclassShortName?.toLowerCase() === subclassName.toLowerCase()
              )
            );

            if (scFeatures.length) {
              const _mergedFeatures = this._mergeSubclassFeatures(scFeatures, className, subclassName, scShortName);
              _mergedFeatures.forEach(sf => {
                const div = document.createElement('div');
                div.className = 'feature-entry feature-entry-subclass';
                div.style.opacity = l > level ? '0.4' : '1';
                const sfHtml = sf._mergedHtml || (typeof entriesToHtml === 'function' ? entriesToHtml(sf.entries) : '');
                div.innerHTML = `
                  <div class="feature-entry-header">
                    <span class="feature-entry-name">${sf.name}</span>
                    <span class="feature-entry-level">Level ${l}</span>
                    <span class="feature-entry-subclass-badge">${subclassName}</span>
                  </div>
                  <div class="feature-entry-text">${this._highlightSpellText(sfHtml)}</div>`;
                fullEl.appendChild(div);
              });
              return; // skip the placeholder
            }

            // Fallback: check UA subclass data (features stored inline in subclass entries)
            const uaFeatures = this._getUASubclassFeatures(subclassName, className, l);
            if (uaFeatures.length) {
              uaFeatures.forEach(sf => {
                const div = document.createElement('div');
                div.className = 'feature-entry feature-entry-subclass';
                div.style.opacity = l > level ? '0.4' : '1';
                div.innerHTML = `
                  <div class="feature-entry-header">
                    <span class="feature-entry-name">${sf.name}</span>
                    <span class="feature-entry-level">Level ${l}</span>
                    <span class="feature-entry-subclass-badge">${subclassName}</span>
                  </div>
                  <div class="feature-entry-text">${this._highlightSpellText(sf.html)}</div>`;
                fullEl.appendChild(div);
              });
              return; // skip the placeholder
            }
          }

          let featureHtml = f.html || f.text || '';
          if (f.name === 'Psionic Discipline') {
            featureHtml = this._appendPsionicDisciplines(featureHtml);
          }
          if (/^Metamagic$/i.test(f.name)) {
            featureHtml = this._appendMetamagicChoices(featureHtml, 'Metamagic');
          }
          const div = document.createElement('div');
          div.className = 'feature-entry';
          div.style.opacity = l > level ? '0.4' : '1';
          div.innerHTML = `
            <div class="feature-entry-header">
              <span class="feature-entry-name">${f.name}</span>
              <span class="feature-entry-level">Level ${l}</span>
            </div>
            <div class="feature-entry-text">${this._highlightSpellText(featureHtml)}</div>`;
          fullEl.appendChild(div);
        });
      }
    }
  },

  // Merge child subclass features into their parent based on LevelUp.SUBCLASS_FEATURE_MERGES.
  // Returns a new array with child features absorbed into the parent's HTML, children removed.
  _mergeSubclassFeatures(scFeatures, className, subclassName, scShortName) {
    if (typeof LevelUp === 'undefined' || !LevelUp.SUBCLASS_FEATURE_MERGES) return scFeatures;
    const toAbsorb = new Set();
    const overrides = {};
    for (const [key, childNames] of Object.entries(LevelUp.SUBCLASS_FEATURE_MERGES)) {
      const colonIdx = key.indexOf(':');
      const secondColon = key.indexOf(':', colonIdx + 1);
      const kClass   = key.slice(0, colonIdx);
      const kSubclass = key.slice(colonIdx + 1, secondColon);
      const kParent  = key.slice(secondColon + 1);
      if (kClass !== className) continue;
      if (kSubclass !== subclassName && kSubclass !== (scShortName || '')) continue;
      const parent = scFeatures.find(sf => sf.name === kParent);
      if (!parent) continue;
      let parentHtml = typeof entriesToHtml === 'function' ? entriesToHtml(parent.entries) : '';
      for (const childName of childNames) {
        const child = scFeatures.find(sf => sf.name === childName);
        if (!child) continue;
        const childHtml = typeof entriesToHtml === 'function' ? entriesToHtml(child.entries) : '';
        parentHtml += `<p><strong>${childName}.</strong></p>${childHtml}`;
        toAbsorb.add(childName);
      }
      overrides[kParent] = parentHtml;
    }
    return scFeatures
      .filter(sf => !toAbsorb.has(sf.name))
      .map(sf => overrides[sf.name] ? { ...sf, _mergedHtml: overrides[sf.name] } : sf);
  },

  // Extract UA subclass features for a given level from inline entries
  _getUASubclassFeatures(subclassName, className, level) {
    const ORDINALS = {1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',7:'7th',8:'8th',
      9:'9th',10:'10th',11:'11th',12:'12th',13:'13th',14:'14th',15:'15th',
      16:'16th',17:'17th',18:'18th',19:'19th',20:'20th'};
    const prefix = ORDINALS[level];
    if (!prefix) return [];
    const uaData = window.UA2024_DATA;
    if (!uaData) return [];
    const sc = (uaData.subclass || []).find(s => s.name === subclassName && s.className === className);
    if (!sc) return [];
    const results = [];
    const walk = (entries) => {
      if (!Array.isArray(entries)) return;
      entries.forEach(e => {
        if (typeof e === 'object' && e.type === 'entries') {
          if (e.name && e.name.startsWith(`${prefix} Level:`)) {
            const featureName = e.name.replace(`${prefix} Level:`, '').trim();
            const html = Array.isArray(e.entries) && typeof entriesToHtml === 'function'
              ? entriesToHtml(e.entries) : '';
            results.push({ name: featureName, html });
          } else if (Array.isArray(e.entries)) {
            walk(e.entries);
          }
        }
      });
    };
    (sc.entries || []).forEach(topEntry => {
      if (Array.isArray(topEntry.entries)) walk(topEntry.entries);
    });
    return results;
  },

  // ---- FIGHTING STYLE PICKER (shown when class grants one) ----
  renderFightingStylePicker(info) {
    // Remove any existing picker
    const existing = document.getElementById('fighting-style-picker');
    if (existing) existing.remove();

    if (!info?.fightingStyleLevel) return;
    const level = this.getLevel();
    if (level < info.fightingStyleLevel) return;

    // Check if user already has a fighting style feat
    const feats = this.lv('feats', []);
    const styles = typeof getFightingStyles === 'function' ? getFightingStyles() : [];
    if (!styles.length) return;
    const hasOne = feats.some(f => styles.some(s => s.name.toLowerCase() === this._featName(f).toLowerCase()));
    if (hasOne) return;

    // Build picker UI
    const box = this.$('class-features-box');
    if (!box) return;

    const picker = document.createElement('div');
    picker.id = 'fighting-style-picker';
    picker.className = 'sheet-box fighting-style-picker';
    picker.innerHTML = `
      <div class="box-title">Choose a Fighting Style</div>
      <p class="fs-picker-desc">Your class grants a Fighting Style feat. Select one:</p>
      <div class="fs-picker-grid"></div>
      <div class="fs-picker-preview"></div>`;

    const grid = picker.querySelector('.fs-picker-grid');
    const preview = picker.querySelector('.fs-picker-preview');

    styles.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'fs-picker-btn';
      btn.textContent = f.name;
      btn.title = f._src;
      btn.addEventListener('mouseenter', () => {
        const fInfo = typeof getFeatInfo === 'function' ? getFeatInfo(f.name) : null;
        if (fInfo) preview.innerHTML = `<strong>${fInfo.name}</strong>: ${fInfo.description}`;
      });
      btn.addEventListener('click', () => {
        this.addFeat(f.name);
        picker.remove();
      });
      grid.appendChild(btn);
    });

    box.insertAdjacentElement('afterend', picker);
  },

  // ---- SPECIES SELECTION ----
  initSpeciesSelect() {
    const input = this.$('charSpecies');
    if (!input) return;
    if (window.setupAutocomplete) setupAutocomplete(input, 'species-list');
    input.addEventListener('change', () => {
      this.sv('charSpecies', input.value);
      this.applySpeciesSelection(input.value);
      this.populateCharOptsList();
    });
  },

  applySpeciesSelection(name, subraceOverride) {
    if (!name || !DndData.loaded) return;
    const info = getSpeciesInfo(name);
    if (!info) return;

    // If this species has subraces and none chosen yet, show picker
    const savedSubrace = subraceOverride || this.lv('charSubrace', '');
    if (info.subraces.length > 0 && !savedSubrace) {
      this._showSubracePicker(info);
      return;
    }

    // Merge subrace traits if chosen
    let subraceInfo = null;
    if (savedSubrace && info.subraces.length > 0) {
      subraceInfo = info.subraces.find(sr => sr.name === savedSubrace);
    }

    const speedInput = this.$('speed');
    if (speedInput && !speedInput.value) {
      speedInput.value = info.speed;
      this.sv('speed', info.speed.toString());
    }

    // Apply fly speed
    if (info.flySpeed) {
      const flyEl = this.$('flySpeed');
      if (flyEl) { flyEl.value = info.flySpeed; this.sv('flySpeed', info.flySpeed); }
    }

    // Apply racial spells
    this._applyRacialSpells(info, savedSubrace);

    // Apply racial spellcasting ability if no class-based one is set
    const racialSpellAb = this.lv('racialSpellAbility', '');
    if (racialSpellAb) {
      const spellAbEl = this.$('spellcastingAbility');
      if (spellAbEl && !spellAbEl.value) {
        spellAbEl.value = racialSpellAb.toLowerCase();
        this.sv('spellcastingAbility', racialSpellAb.toLowerCase());
        this.recalcAll();
      }
    }

    this._renderSpeciesTraits(info, subraceInfo);
    this.refreshFeatList();
  },

  _applyRacialSpells(info, subraceName) {
    if (!info.additionalSpells?.length) return;
    const subraceEntries = info.subraces?.find(sr => sr.name === subraceName)?.entries;
    const cantripChoice = this.lv('racialCantripChoice', null);
    const racialSpells = parseRacialSpells(info.additionalSpells, subraceName, subraceEntries, cantripChoice);
    const level = this.getLevel();

    // Clean up duplicate racial spells from saved data
    const current = this.lv('charSpells', []) || [];
    const seenRacial = new Set();
    let hadDupes = false;
    const cleaned = current.filter(s => {
      if (!s.racial) return true;
      const key = s.name.toLowerCase();
      if (seenRacial.has(key)) { hadDupes = true; return false; }
      seenRacial.add(key);
      return true;
    });
    if (hadDupes) this.sv('charSpells', cleaned);

    // Get all existing spell names to avoid duplicates (normalised to lowercase)
    const existingRacial = new Set(
      cleaned.map(s => s.name.toLowerCase())
    );

    const capName = n => n ? n.replace(/\b\w/g, c => c.toUpperCase()) : n;
    const toAdd = [];
    racialSpells.cantrips.forEach(name => {
      if (name && !existingRacial.has(name.toLowerCase()))
        toAdd.push({ name: capName(name), level: 0, prepared: true, racial: true });
    });
    if (level >= 3) {
      racialSpells.level3.forEach(name => {
        if (name && !existingRacial.has(name.toLowerCase()))
          toAdd.push({ name: capName(name), level: 1, prepared: true, alwaysPrepared: true, racial: true });
      });
    }
    if (level >= 5) {
      racialSpells.level5.forEach(name => {
        if (name && !existingRacial.has(name.toLowerCase()))
          toAdd.push({ name: capName(name), level: 2, prepared: true, alwaysPrepared: true, racial: true });
      });
    }

    if (!toAdd.length) return;
    const updated = [...cleaned, ...toAdd];
    this.sv('charSpells', updated);
    // Render the new spell cards directly
    toAdd.forEach(s => {
      const spell = DndData.spells.find(sp => sp.name.toLowerCase() === s.name.toLowerCase()) || { name: s.name, level: s.level, _schoolName: 'Racial', _castTime: '' };
      this.renderSpellCard(spell, s.level);
    });
  },

  _showSubracePicker(info) {
    const existing = document.getElementById('subrace-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'subrace-modal';
    modal.className = 'levelup-backdrop';
    modal.style.display = 'flex';

    const opts = info.subraces.map(sr => `
      <label class="lu-subclass-option">
        <input type="radio" name="subrace-pick" value="${sr.name}">
        <div>
          <div class="lu-subclass-name">${sr.name}</div>
          <div class="lu-subclass-src">${entriesToText(sr.entries).slice(0, 120)}…</div>
        </div>
      </label>`).join('');

    modal.innerHTML = `
      <div class="levelup-modal">
        <div class="levelup-header">
          <h2 class="levelup-title">Choose ${info.name} Lineage</h2>
          <button class="levelup-close" id="subrace-close">&times;</button>
        </div>
        <div class="levelup-body">
          <p style="margin-bottom:0.8rem;font-size:0.9rem;color:var(--ink-faint)">
            This species requires you to choose a subrace or lineage.
          </p>
          <div class="lu-subclass-list">${opts}</div>
        </div>
        <div class="levelup-footer">
          <button class="btn levelup-btn-cancel" id="subrace-cancel">Cancel</button>
          <button class="btn levelup-btn-confirm" id="subrace-confirm">Confirm</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    modal.querySelector('#subrace-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#subrace-cancel').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('input[name="subrace-pick"]').forEach(r => {
      r.addEventListener('change', () => {
        modal.querySelectorAll('.lu-subclass-option').forEach(el => el.classList.remove('selected'));
        r.closest('.lu-subclass-option').classList.add('selected');
      });
    });
    modal.querySelector('#subrace-confirm').addEventListener('click', () => {
      const chosen = modal.querySelector('input[name="subrace-pick"]:checked');
      if (!chosen) { alert('Please choose a lineage.'); return; }
      this.sv('charSubrace', chosen.value);
      modal.remove();
      this.applySpeciesSelection(info.name, chosen.value);
    });
  },

  _renderSpeciesTraits(info, subraceInfo) {
    // Merge subrace physical stats — subrace values take priority over parent race
    const sr = subraceInfo;
    const darkvision = sr?.darkvision ?? info.darkvision;
    const flySpeed = sr?.speed?.fly ?? info.flySpeed;
    const swimSpeed = sr?.speed?.swim ?? info.swimSpeed;
    const rawResist = (sr?.resist?.length ? sr.resist : info.resist) || [];
    const formatResistEntry = r => typeof r === 'string'
      ? r.charAt(0).toUpperCase() + r.slice(1)
      : (r?.choose?.from ? r.choose.from.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(', ') + ' (choose one)' : null);
    const resist = rawResist.map(formatResistEntry).filter(Boolean);

    const box = this.$('species-info-box');
    const textEl = this.$('species-traits-text');
    if (box && textEl) {
      box.style.display = 'block';
      const titleEl = box.querySelector('.box-title');
      if (titleEl) titleEl.textContent = `Specie Traits - ${info.name}`;
      let parts = [];
      const chosenSize = this.lv('charSize', '');
      let statLine = `<strong class="trait-keyword">Size:</strong> ${chosenSize || info.size}`;
      if (flySpeed) statLine += ` | <strong class="trait-keyword">Fly:</strong> ${flySpeed} ft.`;
      if (swimSpeed) statLine += ` | <strong class="trait-keyword">Swim:</strong> ${swimSpeed} ft.`;
      if (darkvision) statLine += ` | <strong class="trait-keyword">Darkvision:</strong> ${darkvision} ft.`;
      parts.push(`<p>${statLine}</p>`);
      if (resist.length) parts.push(`<p><strong class="trait-keyword">Resistances:</strong> ${resist.join(', ')}</p>`);
      if (subraceInfo) parts.push(`<p><strong class="trait-keyword">Lineage:</strong> ${subraceInfo.name}</p>`);
      // Extract trait names from race entries for the compact box
      const traitEntries = [
        ...(Array.isArray(info.traitsRaw) ? info.traitsRaw : (info._rawEntries || [])),
        ...(subraceInfo?.entries || []),
      ].filter(e => e && typeof e === 'object' && e.name);
      if (!traitEntries.length && info.traitsHtml) {
        // Fallback: parse trait names from entries on the actual race object
        const raceObj = DndData?.races?.find(r => r.name === info.name);
        if (raceObj?.entries) {
          raceObj.entries.filter(e => e && typeof e === 'object' && e.name).forEach(e => traitEntries.push(e));
        }
        if (subraceInfo) {
          // Also get subrace entries from the versions/subraces data
          const srObj = raceObj?._versions?.find(v => v.name === subraceInfo.name)
            || DndData?.subraces?.find(sr => sr.name === subraceInfo.name && sr.raceName === info.name);
          if (srObj?.entries) srObj.entries.filter(e => e && typeof e === 'object' && e.name).forEach(e => traitEntries.push(e));
        }
      }
      // Skip traits that are already represented by stats above
      const skipNames = /^(creature type|size|darkvision|speed)$/i;
      const shownTraits = traitEntries.filter(e => e.name && !skipNames.test(e.name));
      if (shownTraits.length) {
        shownTraits.forEach(e => {
          // Show trait name + first sentence as summary
          const entryText = (e.entries || []).map(x => typeof x === 'string' ? stripTags(x) : '').join(' ').trim();
          const firstSentence = entryText.match(/^[^.]+\./)?.[0] || entryText.slice(0, 80);
          if (firstSentence) parts.push(`<p><strong class="trait-keyword">${e.name}.</strong> ${firstSentence}</p>`);
          else parts.push(`<p><strong class="trait-keyword">${e.name}.</strong></p>`);
        });
      }
      textEl.innerHTML = parts.join('');
    }

    const fullEl = this.$('full-species-traits');
    if (fullEl) {
      fullEl.innerHTML = '';

      // Base race entry
      const div = document.createElement('div');
      div.className = 'feature-entry';
      let statsHtml = `<p><strong>Size:</strong> ${this.lv('charSize', '') || info.size}`;
      if (flySpeed) statsHtml += ` &nbsp;|&nbsp; <strong>Fly:</strong> ${flySpeed} ft.`;
      if (swimSpeed) statsHtml += ` &nbsp;|&nbsp; <strong>Swim:</strong> ${swimSpeed} ft.`;
      if (darkvision) statsHtml += ` &nbsp;|&nbsp; <strong>Darkvision:</strong> ${darkvision} ft.`;
      if (resist.length) statsHtml += `</p><p><strong>Resistances:</strong> ${resist.join(', ')}`;
      statsHtml += '</p>';
      div.innerHTML = `
        <div class="feature-entry-header">
          <span class="feature-entry-name">${info.name}</span>
          <span class="feature-entry-level">${info.src}</span>
        </div>
        <div class="feature-entry-text">${this._highlightSpellText(statsHtml + (info.traitsHtml || ''))}</div>`;
      fullEl.appendChild(div);

      // Subrace entry
      if (subraceInfo) {
        const srDiv = document.createElement('div');
        srDiv.className = 'feature-entry';
        srDiv.innerHTML = `
          <div class="feature-entry-header">
            <span class="feature-entry-name">${subraceInfo.name} Lineage</span>
            <span class="feature-entry-level">${subraceInfo._src || info.src}</span>
          </div>
          <div class="feature-entry-text">${this._highlightSpellText(entriesToHtml(subraceInfo.entries))}</div>`;
        fullEl.appendChild(srDiv);
      }
    }
  },

  // ---- BACKGROUND SELECTION ----
  initBackgroundSelect() {
    const input = this.$('charBackground');
    if (!input) return;
    if (window.setupAutocomplete) setupAutocomplete(input, 'bg-list');
    input.addEventListener('change', () => {
      this.sv('charBackground', input.value);
      this.applyBackgroundSelection(input.value);
    });
  },

  applyBackgroundSelection(name) {
    if (!name || !DndData.loaded) return;
    const info = getBackgroundInfo(name);
    if (!info) return;

    // Track background changes to clean up the old one
    const prevBg = this.lv('_appliedBg', '');
    const isNewBg = prevBg !== name;
    if (isNewBg) {
      if (prevBg) {
        const prev = getBackgroundInfo(prevBg);
        if (prev?.feat) {
          const oldFeat = Object.keys(prev.feat)[0]?.split('|')[0];
          if (oldFeat) this.removeFeat(oldFeat);
        }
      }
      this.sv('_appliedBg', name);
    }

    // Apply skill proficiency via 3-state toggle
    const skillMap = {};
    this.SKILLS.forEach(s => skillMap[s.label.toLowerCase()] = s.key);
    Object.keys(info.skillProf).forEach(sk => {
      const key = skillMap[sk.toLowerCase()];
      if (key) {
        const toggle = this.qs(`.skill-state-toggle[data-skill="${key}"]`);
        if (toggle && parseInt(toggle.dataset.state || '0') < 1) {
          toggle.dataset.state = '1';
          this.sv(`skillProf_${key}`, true);
          this.sv(`skillExpert_${key}`, false);
        }
      }
    });

    // Auto-add origin feat (show spell picker if feat has spell choices)
    if (info.featName) {
      const featName = info.featName;
      if (featName) {
        const canonical = (typeof getFeatInfo === 'function' ? getFeatInfo(featName)?.name : null) || featName;
        const spellConfig = typeof ClassResources !== 'undefined'
          ? ClassResources.FEAT_SPELL_CHOICES?.[canonical] : null;
        const customConfig = typeof ClassResources !== 'undefined'
          ? ClassResources.FEAT_CUSTOM_CHOICES?.[canonical] : null;
        const featInfo = typeof getFeatInfo === 'function' ? getFeatInfo(featName) : null;
        if (spellConfig || customConfig) {
          const already = this.lv('feats', []).some(f => this._featName(f).toLowerCase() === canonical.toLowerCase());
          if (!already) {
            this._showFeatOptionsPicker(canonical, featInfo, [], spellConfig, null, customConfig);
          }
        } else {
          this.addFeat(featName);
        }
      }
    }

    // Store background tool & language proficiencies, then refresh display
    if (isNewBg) {
      // Tool proficiencies → go to skills list, not the textarea
      const toolKeys = Object.keys(info.toolProf);
      const fixedTools = toolKeys.filter(k => k !== 'choose' && info.toolProf[k] === true);
      const chooseTools = info.toolProf.choose;
      const allTools = [...fixedTools];
      if (chooseTools) {
        const count = chooseTools.count || 1;
        for (let i = 0; i < count; i++) allTools.push(`Tool (choose ${i + 1})`);
      }
      // Preserve class-chosen tools (e.g. Monk's artisan/instrument choice) so they aren't lost
      const classChosenTools = this.lv('_classToolChoices', []).filter(Boolean);
      classChosenTools.forEach(t => { if (!allTools.some(x => x.toLowerCase() === t.toLowerCase())) allTools.push(t); });
      // Preserve fixed class tool profs (e.g. Rogue's Thieves' Tools)
      const classFixedTools = this.lv('classFixedToolProf', []).filter(Boolean);
      classFixedTools.forEach(t => { if (!allTools.some(x => x.toLowerCase() === t.toLowerCase())) allTools.push(t); });
      this.sv('toolProficiencies', allTools);
      this.buildToolProficiencies();

      // Languages → store for textarea
      if (typeof parseLanguageProf === 'function') {
        const lang = parseLanguageProf(info.languageProf);
        this.sv('bgLanguages', { fixed: lang.fixed, chooseCount: lang.chooseCount });
      } else {
        this.sv('bgLanguages', { fixed: [], chooseCount: 0 });
      }
      this.refreshProfLanguages();
    }

    // Look up flavor text from the fluff file (matched by name + source)
    const bgNameMatch = name.match(/^(.+?)\s+—\s+(.+)$/);
    const bgBaseName = bgNameMatch ? bgNameMatch[1] : name;
    const rawBg = DndData.backgrounds.find(b => b.name === name) ||
      (bgNameMatch ? DndData.backgrounds.find(b => b.name === bgBaseName && b._src === bgNameMatch[2]) : null);
    const fluff = (DndData.backgroundFluff || []).find(f =>
      f.name === bgBaseName && f.source === rawBg?.source
    );
    const flavorHtml = (fluff?.entries || [])
      .map(e => typeof e === 'string' ? `<p>${stripTags(e)}</p>` : '')
      .join('');

    // Chronicle tab: flavor text only
    const box = this.$('bg-flavor-box');
    const textEl = this.$('bg-flavor-text');
    const titleEl = this.$('bg-flavor-title');
    if (box && textEl) {
      box.style.display = 'block';
      if (titleEl) titleEl.textContent = `Background - ${name}`;
      textEl.innerHTML = flavorHtml;
    }

    // Faceless: show fake persona picker in Chronicle
    const facelessBox = this.$('faceless-persona-box');
    if (facelessBox) {
      if (info?.name === 'Faceless') {
        facelessBox.style.display = '';
        this._renderFacelessPersonaSection();
      } else {
        facelessBox.style.display = 'none';
      }
    }

    this.recalcAll();
  },

  _renderFacelessPersonaSection() {
    const contentDiv = this.$('faceless-persona-content');
    if (!contentDiv) return;
    const savedBg = this.lv('facelessPersonaBg', '');
    contentDiv.innerHTML = `
      <p style="font-size:0.82rem;color:var(--ink-light);margin:0 0 8px">Choose a background for your fake persona. Click any trait to add it to the fields on the left.</p>
      <input type="text" id="faceless-persona-bg-input" class="sheet-input" placeholder="Search background..." value="${savedBg}" autocomplete="off" style="width:100%;box-sizing:border-box">
      <div id="faceless-persona-traits" style="margin-top:8px"></div>`;
    const input = contentDiv.querySelector('#faceless-persona-bg-input');
    if (window.setupAutocomplete) setupAutocomplete(input, 'bg-list');
    input.addEventListener('change', () => {
      const bgName = input.value.trim();
      this.sv('facelessPersonaBg', bgName);
      this._renderFacelessPersonaTraits(bgName);
    });
    if (savedBg) this._renderFacelessPersonaTraits(savedBg);
  },

  _renderFacelessPersonaTraits(bgName) {
    const traitsDiv = this.$('faceless-persona-traits');
    if (!traitsDiv) return;
    if (!bgName) { traitsDiv.innerHTML = ''; return; }
    const info = typeof getBackgroundInfo === 'function' ? getBackgroundInfo(bgName) : null;
    if (!info) { traitsDiv.innerHTML = ''; return; }
    const sc = info.suggestedCharacteristics;
    if (!sc || !(sc.traits.length || sc.ideals.length || sc.bonds.length || sc.flaws.length)) {
      traitsDiv.innerHTML = '<p style="color:var(--ink-faint);font-size:0.82rem">No suggested characteristics for this background.</p>';
      return;
    }
    const fieldMap = { traits: 'personalityTraits', ideals: 'ideals', bonds: 'bonds', flaws: 'flaws' };
    const sections = [
      { key: 'traits', label: 'Personality Traits', items: sc.traits },
      { key: 'ideals', label: 'Ideals',             items: sc.ideals },
      { key: 'bonds',  label: 'Bonds',              items: sc.bonds  },
      { key: 'flaws',  label: 'Flaws',              items: sc.flaws  },
    ].filter(s => s.items.length);
    traitsDiv.innerHTML = sections.map(sec => `
      <div style="margin-bottom:10px">
        <div style="font-size:0.75rem;font-weight:600;color:var(--ink-light);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${sec.label}</div>
        ${sec.items.map((text, i) => `
          <div class="faceless-trait-chip" data-field="${fieldMap[sec.key]}" data-text="${text.replace(/"/g, '&quot;')}" title="Click to add to ${sec.label}" style="font-size:0.8rem;padding:4px 8px;border:1px solid var(--border);border-radius:4px;margin-bottom:3px;cursor:pointer;color:var(--ink-light);display:flex;align-items:flex-start;gap:6px">
            <span style="color:var(--ink-faint);flex-shrink:0;min-width:1.4em;text-align:right">${i + 1}.</span><span>${text}</span>
          </div>`).join('')}
      </div>`).join('');
    traitsDiv.querySelectorAll('.faceless-trait-chip').forEach(chip => {
      chip.addEventListener('mouseenter', () => { chip.style.background = 'var(--parchment-dk)'; chip.style.borderColor = 'var(--gold)'; });
      chip.addEventListener('mouseleave', () => { chip.style.background = ''; chip.style.borderColor = 'var(--border)'; });
      chip.addEventListener('click', () => {
        const fieldId = chip.dataset.field;
        const text = chip.dataset.text;
        const textarea = this.$(fieldId);
        if (!textarea) return;
        const current = textarea.value.trim();
        textarea.value = current ? current + '\n' + text : text;
        this.sv(fieldId, textarea.value);
        chip.style.background = 'rgba(var(--gold-rgb,180,140,60),0.15)';
        chip.style.borderColor = 'var(--gold)';
      });
    });
  },

  // ---- CHAR OPTIONS SYSTEM ----
  initCharOptions() {
    const addBtn = this.$('btn-add-charopt');
    const searchInput = this.$('charopt-search');
    if (searchInput && window.setupAutocomplete) setupAutocomplete(searchInput, 'charopt-list');
    if (addBtn && searchInput) {
      addBtn.addEventListener('click', () => {
        const name = searchInput.value.trim();
        if (!name) return;
        this.addCharOption(name);
        searchInput.value = '';
      });
    }

    // Type filter buttons
    this.qsa('.charopt-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.qsa('.charopt-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._currentCharOptFilter = btn.dataset.type;
        this.renderCharOptions();
      });
    });

    this._currentCharOptFilter = '';
  },

  addCharOption(name) {
    const match = DndData.charOptions.find(o => o.name.toLowerCase() === name.toLowerCase());
    const actualName = match ? match.name : name;
    const opts = this.lv('charOptions', []);
    if (opts.includes(actualName)) return;
    opts.push(actualName);
    this.sv('charOptions', opts);
    this.renderCharOptions();
    // If this option grants an attack, add it automatically
    if (match?._grantsAttack) {
      const atk = match._grantsAttack;
      const attacks = this.lv('attacks', []);
      if (!attacks.some(a => a.name === atk.name)) {
        attacks.push({ ...atk });
        this.sv('attacks', attacks);
        this.buildAttacks();
      }
    }
  },

  removeCharOption(name) {
    const match = DndData.charOptions.find(o => o.name === name);
    const opts = this.lv('charOptions', []).filter(o => o !== name);
    this.sv('charOptions', opts);
    this.renderCharOptions();
    // Remove the granted attack if present
    if (match?._grantsAttack) {
      const atkName = match._grantsAttack.name;
      const attacks = this.lv('attacks', []).filter(a => a.name !== atkName);
      this.sv('attacks', attacks);
      this.buildAttacks();
    }
  },

  restoreCharOptions() { this.renderCharOptions(); },

  initPortrait() {
    const img = this.$('portrait-img');
    const placeholder = this.$('portrait-placeholder');
    const fileInput = this.$('portrait-file');
    const uploadBtn = this.$('portrait-upload-btn');
    const clearBtn = this.$('portrait-clear-btn');
    const portrait = this.$('chronicle-portrait');
    if (!img || !fileInput) return;

    const saved = this.lv('portraitData', '');
    if (saved) {
      img.src = saved;
      img.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      if (clearBtn) clearBtn.style.display = '';
    }

    const applyImage = dataUrl => {
      img.src = dataUrl;
      img.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      if (clearBtn) clearBtn.style.display = '';
      this.sv('portraitData', dataUrl);
    };

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => applyImage(e.target.result);
      reader.readAsDataURL(file);
    });

    if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
    if (portrait) portrait.addEventListener('click', () => fileInput.click());

    if (clearBtn) clearBtn.addEventListener('click', e => {
      e.stopPropagation();
      img.src = '';
      img.style.display = 'none';
      if (placeholder) placeholder.style.display = '';
      clearBtn.style.display = 'none';
      this.sv('portraitData', '');
      fileInput.value = '';
    });
  },

  renderCharOptions() {
    const container = this.$('charopts-container');
    const fullList = this.$('full-charopts-list');
    if (!container) return;
    container.innerHTML = '';
    if (fullList) fullList.innerHTML = '';

    const opts = this.lv('charOptions', []);
    const filter = this._currentCharOptFilter || '';

    opts.forEach(name => {
      const info = typeof getCharOptionInfo === 'function' ? getCharOptionInfo(name) : null;
      if (filter && info && info.typeCode !== filter) return;

      const desc = info?.description || '';
      const card = document.createElement('div');
      card.className = 'feat-card charopt-card';
      card.innerHTML = `
        <div class="feat-card-header">
          <div class="feat-card-meta">
            <span class="feat-card-name">${name}</span>
            <span class="feat-card-cat charopt-type-badge" data-type="${info?.typeCode || ''}">${info?.typeName || 'Custom'}${info?.src ? ' — ' + info.src : ''}</span>
          </div>
          <div class="feat-card-actions">
            ${desc ? `<button class="feat-card-toggle" title="Expand description">▶</button>` : ''}
            <button class="feat-card-del" title="Remove">✕</button>
          </div>
        </div>
        ${desc ? `<div class="feat-card-body" style="display:none"><div class="feat-card-desc">${desc}</div></div>` : ''}`;
      if (desc) {
        const toggle = card.querySelector('.feat-card-toggle');
        const body = card.querySelector('.feat-card-body');
        toggle.addEventListener('click', () => {
          const open = body.style.display !== 'none';
          body.style.display = open ? 'none' : 'block';
          toggle.textContent = open ? '▶' : '▼';
          toggle.classList.toggle('open', !open);
        });
      }
      card.querySelector('.feat-card-del').addEventListener('click', () => this.removeCharOption(name));
      container.appendChild(card);

      if (fullList) {
        const entry = document.createElement('div');
        entry.className = 'feature-entry';
        entry.innerHTML = `
          <div class="feature-entry-header">
            <span class="feature-entry-name">${name}</span>
            <span class="feature-entry-level charopt-type-badge" data-type="${info?.typeCode || ''}">${info?.typeName || 'Custom'}</span>
            ${info?.src ? `<span class="feature-entry-level">${info.src}</span>` : ''}
          </div>
          <div class="feature-entry-text">${this._highlightSpellText(info?.description || '(No data found — check the source book)')}</div>`;
        fullList.appendChild(entry);
      }
    });

    if (fullList && !opts.length) {
      fullList.innerHTML = '<div style="color:var(--ink-faint);font-size:0.82rem">No character options added.</div>';
    }
  },

  populateCharOptsList() {
    const datalist = this.$('charopt-list');
    if (!datalist) return;
    datalist.innerHTML = '';
    const currentSpecies = (this.lv('charSpecies', '') || '').toLowerCase();
    DndData.charOptions.forEach(opt => {
      if (opt._requiresSpecies && opt._requiresSpecies.toLowerCase() !== currentSpecies) return;
      const o = document.createElement('option');
      o.value = opt.name;
      o.textContent = `${opt.name} — ${opt._typeName} — ${opt._src}`;
      datalist.appendChild(o);
    });
  },

  // ---- FEAT SYSTEM ----
  initFeatSystem() {
    const addBtn = this.$('btn-add-feat');
    const searchInput = this.$('feat-search');
    if (searchInput && window.setupAutocomplete) setupAutocomplete(searchInput, 'feat-list');
    if (addBtn && searchInput) {
      addBtn.addEventListener('click', () => {
        const name = searchInput.value.trim();
        if (!name) return;
        const info = typeof getFeatInfo === 'function' ? getFeatInfo(name) : null;
        const canonical = info?.name || name;
        const rawAllowed = info?.ability?.length && typeof LevelUp !== 'undefined'
          ? LevelUp._parseFeatAbilities(info.ability) : [];
        const spellConfig = typeof ClassResources !== 'undefined'
          ? ClassResources.FEAT_SPELL_CHOICES?.[canonical] : null;
        const customConfig = typeof ClassResources !== 'undefined'
          ? ClassResources.FEAT_CUSTOM_CHOICES?.[canonical] : null;
        // 2014 feats with metamagic custom choices grant +1 to any ability
        const allowed = rawAllowed.length === 0 && customConfig?.type === 'metamagic'
          ? ['str', 'dex', 'con', 'int', 'wis', 'cha']
          : rawAllowed;
        if (allowed.length > 0 || spellConfig || customConfig) {
          this._showFeatOptionsPicker(canonical, info, allowed, spellConfig, () => { searchInput.value = ''; }, customConfig);
        } else {
          this.addFeat(name);
          searchInput.value = '';
        }
      });
    }
  },

  _showFeatOptionsPicker(featName, featInfo, abilities, spellConfig, onDone, customConfig) {
    document.querySelector('.feat-opts-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'feat-opts-overlay';
    const modal = document.createElement('div');
    modal.className = 'feat-opts-modal';

    // State
    let selectedAbility = null;
    let selectedClass = '';
    let selectedSpellAbility = null; // for Wild Talent psionic ability choice
    const chosenSpells = [];
    const chosenCustom = [];

    const abNames = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

    // --- Build header ---
    const header = document.createElement('div');
    header.className = 'feat-opts-header';
    header.innerHTML = `<div class="feat-opts-title">${featName}</div>`;
    if (featInfo?.category) header.innerHTML += `<span class="feat-opts-cat">${featInfo.category}</span>`;
    modal.appendChild(header);

    if (featInfo?.description) {
      const desc = document.createElement('div');
      desc.className = 'feat-opts-desc';
      desc.innerHTML = featInfo.description;
      modal.appendChild(desc);
    }

    // --- Ability score section ---
    let abilitySection = null;
    if (abilities.length > 0) {
      abilitySection = document.createElement('div');
      abilitySection.className = 'feat-opts-section';
      abilitySection.innerHTML = `<div class="feat-opts-section-title">Ability Score Increase <span class="feat-opts-section-hint">Choose one (+1)</span></div>`;
      const grid = document.createElement('div');
      grid.className = 'feat-opts-ab-grid';

      const nonCapped = abilities.filter(ab => this.getAbilityScore(ab) < 20);

      abilities.forEach(ab => {
        const score = this.getAbilityScore(ab);
        const atCap = score >= 20;
        const card = document.createElement('div');
        card.className = 'feat-opts-ab-card' + (atCap ? ' capped' : '');
        card.dataset.ab = ab;
        card.innerHTML = `
          <div class="feat-opts-ab-name">${ab.toUpperCase()}</div>
          <div class="feat-opts-ab-label">${abNames[ab] || ab}</div>
          <div class="feat-opts-ab-score">${atCap
            ? `<span class="feat-opts-ab-current">${score}</span> <span class="feat-opts-ab-max">max</span>`
            : `<span class="feat-opts-ab-current">${score}</span> <span class="feat-opts-ab-arrow">→</span> <span class="feat-opts-ab-new">${score + 1}</span>`
          }</div>`;
        if (!atCap) {
          card.addEventListener('click', () => {
            grid.querySelectorAll('.feat-opts-ab-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedAbility = ab;
            updateConfirm();
          });
        }
        grid.appendChild(card);
      });

      // Auto-select if only one non-capped
      if (nonCapped.length === 1) {
        selectedAbility = nonCapped[0];
        setTimeout(() => grid.querySelector(`.feat-opts-ab-card[data-ab="${nonCapped[0]}"]`)?.classList.add('selected'), 0);
      }

      abilitySection.appendChild(grid);
      modal.appendChild(abilitySection);
    }

    // --- Spell choices section ---
    let spellSection = null;
    if (spellConfig) {
      spellSection = document.createElement('div');
      spellSection.className = 'feat-opts-section';
      spellSection.innerHTML = `<div class="feat-opts-section-title">Spell Choices</div>`;
      const spellContent = document.createElement('div');
      spellContent.className = 'feat-opts-spell-content';
      spellSection.appendChild(spellContent);
      modal.appendChild(spellSection);

      const buildSpellPickers = (cls) => {
        spellContent.innerHTML = '';

        // Class picker
        if (spellConfig.requireClassPick) {
          const classRow = document.createElement('div');
          classRow.className = 'feat-opts-class-row';
          classRow.innerHTML = `<label class="feat-opts-label">Spellcasting Class:</label>`;
          const select = document.createElement('select');
          select.className = 'feat-opts-class-select';
          select.innerHTML = `<option value="">Choose class...</option>` +
            spellConfig.classOptions.map(c => `<option value="${c}" ${c === cls ? 'selected' : ''}>${c}</option>`).join('');
          select.addEventListener('change', () => {
            selectedClass = select.value;
            chosenSpells.length = 0;
            buildSpellPickers(select.value);
            updateConfirm();
          });
          classRow.appendChild(select);
          spellContent.appendChild(classRow);
        }

        // Auto-spells
        if (spellConfig.autoSpells?.length) {
          const autoDiv = document.createElement('div');
          autoDiv.className = 'feat-opts-auto-spells';
          autoDiv.innerHTML = `<span class="feat-opts-label">Always prepared:</span> ${
            spellConfig.autoSpells.map(s => `<span class="feat-opts-spell-tag auto">${s}</span>`).join('')}`;
          spellContent.appendChild(autoDiv);
        }

        // Spell pick sections
        spellConfig.picks.forEach((pickDef, pickIdx) => {
          const pool = typeof ClassResources !== 'undefined'
            ? ClassResources.getFeatSpellPool(pickDef, cls) : [];
          const pickSection = document.createElement('div');
          pickSection.className = 'feat-opts-pick-section';

          const pickLabel = document.createElement('div');
          pickLabel.className = 'feat-opts-pick-label';
          pickLabel.textContent = `${pickDef.label || 'Choose spell(s)'} (${pickDef.count})`;
          pickSection.appendChild(pickLabel);

          // Figure out which spells belong to this pick
          const prevCount = spellConfig.picks.slice(0, pickIdx).reduce((s, p) => s + p.count, 0);
          const mySpells = chosenSpells.slice(prevCount, prevCount + pickDef.count);

          // Show chosen spell tags
          const tagsDiv = document.createElement('div');
          tagsDiv.className = 'feat-opts-spell-tags';
          mySpells.forEach((spellName, i) => {
            const tag = document.createElement('span');
            tag.className = 'feat-opts-spell-tag chosen';
            tag.innerHTML = `${spellName} <button class="feat-opts-spell-remove" title="Remove">&times;</button>`;
            tag.querySelector('.feat-opts-spell-remove').addEventListener('click', () => {
              chosenSpells.splice(prevCount + i, 1);
              buildSpellPickers(cls);
              updateConfirm();
            });
            tagsDiv.appendChild(tag);
          });
          pickSection.appendChild(tagsDiv);

          // Search input if still need more picks
          if (mySpells.length < pickDef.count && pool.length) {
            const searchWrap = document.createElement('div');
            searchWrap.className = 'feat-opts-spell-search-wrap';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'feat-opts-spell-search';
            input.placeholder = `Search ${pickDef.label || 'spells'}...`;
            const dropdown = document.createElement('div');
            dropdown.className = 'feat-opts-spell-dropdown';

            const renderDropdown = (filter) => {
              const query = (filter || '').toLowerCase();
              const filtered = pool.filter(s =>
                s.name.toLowerCase().includes(query) &&
                !chosenSpells.some(c => c.toLowerCase() === s.name.toLowerCase())
              ).slice(0, 30);
              dropdown.innerHTML = '';
              if (!filtered.length) {
                dropdown.innerHTML = '<div class="feat-opts-dd-empty">No matches</div>';
                return;
              }
              filtered.forEach(spell => {
                const item = document.createElement('div');
                item.className = 'feat-opts-dd-item';
                item.innerHTML = `<span class="feat-opts-dd-name">${spell.name}</span>
                  <span class="feat-opts-dd-meta">${spell._schoolName || ''} · ${spell._src || ''}</span>`;
                item.addEventListener('click', () => {
                  dropdown.style.display = 'none';
                  chosenSpells.splice(prevCount + mySpells.length, 0, spell.name);
                  buildSpellPickers(cls);
                  updateConfirm();
                });
                dropdown.appendChild(item);
              });
            };

            const positionDropdown = () => {
              const rect = input.getBoundingClientRect();
              dropdown.style.left = rect.left + 'px';
              dropdown.style.top = rect.bottom + 'px';
              dropdown.style.width = rect.width + 'px';
            };
            const showDropdown = () => { dropdown.style.display = 'block'; positionDropdown(); renderDropdown(input.value); };
            input.addEventListener('input', showDropdown);
            input.addEventListener('focus', showDropdown);
            modal.addEventListener('scroll', () => { if (dropdown.style.display === 'block') positionDropdown(); });
            document.addEventListener('click', e => { if (!searchWrap.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none'; });

            searchWrap.appendChild(input);
            document.body.appendChild(dropdown);
            // Clean up dropdown when overlay is removed
            const obs = new MutationObserver(() => { if (!document.body.contains(overlay)) { dropdown.remove(); obs.disconnect(); } });
            obs.observe(document.body, { childList: true });
            pickSection.appendChild(searchWrap);
          }

          spellContent.appendChild(pickSection);
        });
      };

      buildSpellPickers(selectedClass);
    }

    // --- Psionic spell ability section (Wild Talent feats) ---
    if (customConfig && customConfig.type === 'spellAbility') {
      const psionicSection = document.createElement('div');
      psionicSection.className = 'feat-opts-section';
      psionicSection.innerHTML = `<div class="feat-opts-section-title">${customConfig.label} <span class="feat-opts-section-hint">Choose one</span></div>`;
      if (customConfig.hint) {
        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.82rem;color:var(--ink-faint);margin-bottom:8px;';
        hint.textContent = customConfig.hint;
        psionicSection.appendChild(hint);
      }
      const abGrid = document.createElement('div');
      abGrid.className = 'feat-opts-ab-grid';
      [['int', 'INT', 'Intelligence'], ['wis', 'WIS', 'Wisdom'], ['cha', 'CHA', 'Charisma']].forEach(([key, abbr, label]) => {
        const card = document.createElement('div');
        card.className = 'feat-opts-ab-card';
        card.dataset.ab = key;
        card.innerHTML = `<div class="feat-opts-ab-name">${abbr}</div><div class="feat-opts-ab-label">${label}</div>`;
        card.addEventListener('click', () => {
          abGrid.querySelectorAll('.feat-opts-ab-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedSpellAbility = key;
          updateConfirm();
        });
        abGrid.appendChild(card);
      });
      psionicSection.appendChild(abGrid);
      modal.appendChild(psionicSection);
    }

    // --- Custom choices section (e.g. Metamagic) ---
    let customSection = null;
    if (customConfig && customConfig.type === 'metamagic') {
      customSection = document.createElement('div');
      customSection.className = 'feat-opts-section';
      customSection.innerHTML = `<div class="feat-opts-section-title">${customConfig.label} <span class="feat-opts-section-hint">Choose ${customConfig.count}</span></div>`;
      if (customConfig.hint) {
        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.82rem;color:var(--ink-faint);margin-bottom:8px;';
        hint.textContent = customConfig.hint;
        customSection.appendChild(hint);
      }
      const mmList = document.createElement('div');
      mmList.className = 'feat-opts-mm-list';

      const renderMmOptions = () => {
        mmList.innerHTML = '';
        const options = ClassResources?.METAMAGIC_OPTIONS || [];
        options.forEach(opt => {
          const isSelected = chosenCustom.includes(opt.name);
          const atMax = !isSelected && chosenCustom.length >= customConfig.count;
          const card = document.createElement('div');
          card.className = 'feat-opts-mm-card' + (isSelected ? ' selected' : '') + (atMax ? ' disabled' : '');
          card.innerHTML = `
            <div class="feat-opts-mm-header">
              <span class="feat-opts-mm-name">${opt.name}</span>
              <span class="feat-opts-mm-cost">${opt.cost} SP</span>
            </div>
            <div class="feat-opts-mm-text">${this._highlightKeywords(opt.text)}</div>`;
          if (!atMax || isSelected) {
            card.addEventListener('click', () => {
              if (isSelected) {
                chosenCustom.splice(chosenCustom.indexOf(opt.name), 1);
              } else if (chosenCustom.length < customConfig.count) {
                chosenCustom.push(opt.name);
              }
              renderMmOptions();
              updateConfirm();
            });
          }
          mmList.appendChild(card);
        });
      };

      customSection.appendChild(mmList);
      modal.appendChild(customSection);
      renderMmOptions();
    }

    // --- Actions ---
    const actions = document.createElement('div');
    actions.className = 'feat-opts-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'feat-opts-btn cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => overlay.remove());
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'feat-opts-btn confirm';
    confirmBtn.textContent = 'Add Feat';
    confirmBtn.disabled = true;

    const updateConfirm = () => {
      let ready = true;
      // Need ability selected if half-feat
      if (abilities.length > 0 && !selectedAbility) ready = false;
      // Need spell choices filled if spell feat
      if (spellConfig) {
        const totalNeeded = spellConfig.picks.reduce((s, p) => s + p.count, 0);
        if (chosenSpells.length < totalNeeded) ready = false;
        if (spellConfig.requireClassPick && !selectedClass) ready = false;
      }
      // Need custom choices filled
      if (customConfig && customConfig.type === 'metamagic' && chosenCustom.length < customConfig.count) ready = false;
      // Need psionic spell ability chosen
      if (customConfig && customConfig.type === 'spellAbility' && !selectedSpellAbility) ready = false;
      confirmBtn.disabled = !ready;
    };
    updateConfirm();

    confirmBtn.addEventListener('click', () => {
      if (confirmBtn.disabled) return;
      // Apply ability increase
      if (selectedAbility) {
        const scoreEl = this.$(selectedAbility);
        if (scoreEl) scoreEl.value = parseInt(scoreEl.value || 10) + 1;
        this.recalcAll();
      }
      // Build feat object
      const featObj = { name: featName };
      if (selectedAbility) featObj.spellAbility = selectedAbility;
      if (selectedSpellAbility) featObj.spellAbility = selectedSpellAbility;
      if (spellConfig && chosenSpells.length) featObj.chosenSpells = [...chosenSpells];
      if (selectedClass) featObj.spellClass = selectedClass;
      if (customConfig && chosenCustom.length) featObj.customChoices = [...chosenCustom];
      this.addFeat(featObj);
      overlay.remove();
      if (onDone) onDone();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  // Helper: extract feat name from string or object
  _featName(f) { return typeof f === 'string' ? f : f.name; },

  addFeat(nameOrObj) {
    const isObj = typeof nameOrObj === 'object';
    const rawName = isObj ? nameOrObj.name : nameOrObj;
    const info = typeof getFeatInfo === 'function' ? getFeatInfo(rawName) : null;
    const canonical = info?.name || rawName;
    const feats = this.lv('feats', []);
    // De-duplicate case-insensitively
    if (feats.some(f => this._featName(f).toLowerCase() === canonical.toLowerCase())) return;
    // Wild Talent feats are exclusive — only one allowed
    if ((info?.category || '') === 'Wild Talent') {
      const existing = feats.find(f => {
        const fi = typeof getFeatInfo === 'function' ? getFeatInfo(this._featName(f)) : null;
        return (fi?.category || '') === 'Wild Talent';
      });
      if (existing) {
        alert(`You already have the ${this._featName(existing)} Wild Talent feat. A character can't have more than one Wild Talent feat.`);
        return;
      }
    }
    if (isObj) {
      feats.push({ ...nameOrObj, name: canonical });
    } else {
      feats.push(canonical);
    }
    this.sv('feats', feats);
    this.renderFeats();
    // Auto-add any limited resources from this feat
    if (typeof ClassResources !== 'undefined') {
      const level = parseInt(this.lv('charLevel', 1)) || 1;
      const storedEntry = feats.find(f => this._featName(f).toLowerCase() === canonical.toLowerCase());
      const featRes = ClassResources.getFeatResources(storedEntry || canonical, level);
      if (featRes.length) {
        const resources = this.lv('resources', []);
        let added = false;
        featRes.forEach(r => {
          if (!resources.some(x => x.name === r.name)) {
            resources.push(r);
            added = true;
          }
        });
        if (added) { this.sv('resources', resources); this.renderResources(); }
      }
    }
    // Auto-add feat spells to charSpells
    if (isObj && nameOrObj.chosenSpells?.length) {
      this._syncFeatSpells();
    }
  },

  addFeatByName(name) { this.addFeat(name); },

  removeFeat(nameOrObj) {
    const targetName = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj.name;
    const feats = this.lv('feats', []).filter(f => this._featName(f) !== targetName);
    this.sv('feats', feats);
    this._syncFeatSpells();
    this.renderFeats();
  },

  restoreFeats() { this.renderFeats(); },

  renderFeats() {
    const container = this.$('feats-container');
    const fullList = this.$('full-feats-list');
    if (!container) return;
    container.innerHTML = '';
    if (fullList) fullList.innerHTML = '';

    const feats = this.lv('feats', []);
    feats.forEach((entry, idx) => {
      const name = this._featName(entry);
      const featObj = typeof entry === 'object' ? entry : null;
      const info = typeof getFeatInfo === 'function' ? getFeatInfo(name) : null;
      const desc = info?.description || '';
      const spellConfig = ClassResources?.FEAT_SPELL_CHOICES?.[name];
      const card = document.createElement('div');
      card.className = 'feat-card';

      // Build spell choices display
      let spellsHtml = '';
      if (spellConfig) {
        const autoSpells = spellConfig.autoSpells || [];
        const chosenSpells = featObj?.chosenSpells || [];
        const spellClass = featObj?.spellClass || '';
        const tags = [];
        if (spellClass) tags.push(`<span class="feat-spell-tag feat-spell-class">${spellClass}</span>`);
        autoSpells.forEach(s => tags.push(`<span class="feat-spell-tag feat-spell-auto" title="Always prepared">${s}</span>`));
        chosenSpells.forEach(s => tags.push(`<span class="feat-spell-tag">${s}</span>`));
        const needsPick = !chosenSpells.length;
        spellsHtml = `<div class="feat-spell-choices">
          <span class="feat-spell-label">Spells:</span>
          ${tags.join('')}
          ${needsPick ? '<span class="feat-spell-needed">Choose spells</span>' : ''}
          <button class="feat-spell-edit-btn" title="Edit spell choices">${needsPick ? 'Pick' : 'Edit'}</button>
        </div>`;
      }

      // Build custom choices display (e.g. Metamagic)
      let customHtml = '';
      const customConfig = ClassResources?.FEAT_CUSTOM_CHOICES?.[name];
      if (customConfig && customConfig.type === 'metamagic') {
        const chosen = featObj?.customChoices || [];
        const mmOptions = ClassResources?.METAMAGIC_OPTIONS || [];
        const tags = chosen.map(c => {
          const opt = mmOptions.find(o => o.name === c);
          return `<span class="feat-spell-tag" title="${opt?.text || ''}">${c}${opt ? ` (${opt.cost} SP)` : ''}</span>`;
        }).join('');
        const needsPick = chosen.length < customConfig.count;
        customHtml = `<div class="feat-spell-choices">
          <span class="feat-spell-label">Metamagic:</span>
          ${tags}
          ${needsPick ? `<span class="feat-spell-needed">Choose ${customConfig.count - chosen.length} more</span>` : ''}
          <button class="feat-spell-edit-btn" data-custom-edit title="Edit metamagic choices">${needsPick ? 'Pick' : 'Edit'}</button>
        </div>`;
      }

      card.innerHTML = `
        <div class="feat-card-header">
          <div class="feat-card-meta">
            <span class="feat-card-name">${info?.name || name}</span>
            ${info?.category ? `<span class="feat-card-cat">${info.category}</span>` : ''}
          </div>
          <div class="feat-card-actions">
            ${desc ? `<button class="feat-card-toggle" title="Expand description">▶</button>` : ''}
            <button class="feat-card-del" title="Remove">✕</button>
          </div>
        </div>
        ${spellsHtml}
        ${customHtml}
        ${desc ? `<div class="feat-card-body" style="display:none"><div class="feat-card-desc">${desc}</div></div>` : ''}`;
      if (desc) {
        const toggle = card.querySelector('.feat-card-toggle');
        const body = card.querySelector('.feat-card-body');
        toggle.addEventListener('click', () => {
          const open = body.style.display !== 'none';
          body.style.display = open ? 'none' : 'block';
          toggle.textContent = open ? '▶' : '▼';
          toggle.classList.toggle('open', !open);
        });
      }
      card.querySelector('.feat-card-del').addEventListener('click', () => this.removeFeat(entry));

      // Spell edit button
      const editBtn = card.querySelector('.feat-spell-edit-btn');
      if (editBtn && spellConfig) {
        editBtn.addEventListener('click', () => {
          this._openFeatSpellEditor(idx, name, featObj, spellConfig, card);
        });
      }

      // Metamagic edit button
      const customEditBtn = card.querySelector('[data-custom-edit]');
      if (customEditBtn && customConfig) {
        customEditBtn.addEventListener('click', () => {
          this._openFeatCustomEditor(idx, name, featObj, customConfig);
        });
      }

      container.appendChild(card);

      if (fullList && info) {
        const entry2 = document.createElement('div');
        entry2.className = 'feature-entry';
        entry2.innerHTML = `
          <div class="feature-entry-header">
            <span class="feature-entry-name">${info.name}</span>
            <span class="feature-entry-level">${info.category}</span>
          </div>
          <div class="feature-entry-text">${this._highlightSpellText(info.description || '')}</div>`;
        fullList.appendChild(entry2);
      }
    });
  },

  // ---- FEAT SPELL SYNC ----
  // Keeps charSpells in sync with feat-sourced spells
  _syncFeatSpells() {
    const feats = this.lv('feats', []);
    const charSpells = this.lv('charSpells', []) || [];
    // Remove all feat-sourced spells
    const nonFeat = charSpells.filter(s => !s.featSource);
    // Re-add from current feat objects
    feats.forEach(f => {
      if (typeof f === 'string') return;
      const config = ClassResources?.FEAT_SPELL_CHOICES?.[f.name];
      if (!config) return;
      const charLevel = parseInt(this.lv('charLevel', 1)) || 1;
      const levelSpells = (config.levelSpells || [])
        .filter(entry => charLevel >= entry.minLevel)
        .flatMap(entry => entry.spells || []);
      const allSpells = [...(config.autoSpells || []), ...levelSpells, ...(f.chosenSpells || [])];
      allSpells.forEach(spellName => {
        const spellData = DndData?.spells?.find(s => s.name.toLowerCase() === spellName.toLowerCase());
        if (spellData && !nonFeat.some(s => s.name.toLowerCase() === spellName.toLowerCase())) {
          nonFeat.push({
            name: spellData.name,
            level: spellData.level,
            prepared: true,
            featSource: f.name,
            ...(f.spellAbility && { featSpellAbility: f.spellAbility }),
          });
        }
      });
    });
    this.sv('charSpells', nonFeat);
    this.restoreSpells();

    // Migrate any stale "Magic Initiate Spell" resource names to "Magic Initiate: <SpellName>"
    // and deduplicate in case updateResourcesOnLevelUp already added the new name
    if (typeof ClassResources !== 'undefined') {
      const resources = this.lv('resources', []) || [];
      let resourcesChanged = false;
      feats.forEach(f => {
        if (typeof f === 'string' || f.name !== 'Magic Initiate') return;
        if (!f.chosenSpells?.length) return;
        const cantripCount = (ClassResources.FEAT_SPELL_CHOICES?.['Magic Initiate']?.picks || [])
          .filter(p => p.level === 0)
          .reduce((sum, p) => sum + p.count, 0);
        const lvl1Spell = f.chosenSpells[cantripCount] ?? f.chosenSpells[f.chosenSpells.length - 1];
        if (!lvl1Spell) return;
        const targetName = `Magic Initiate: ${lvl1Spell}`;
        // Remove any stale "Magic Initiate Spell" entries
        const staleIdx = resources.findIndex(r => r.name === 'Magic Initiate Spell');
        if (staleIdx !== -1) {
          if (resources.some(r => r.name === targetName)) {
            resources.splice(staleIdx, 1); // target already exists — just delete the stale one
          } else {
            resources[staleIdx].name = targetName; // rename stale to correct name
          }
          resourcesChanged = true;
        }
        // Remove duplicate targetName entries (keep only the first)
        let firstIdx = resources.findIndex(r => r.name === targetName);
        if (firstIdx !== -1) {
          for (let i = resources.length - 1; i > firstIdx; i--) {
            if (resources[i].name === targetName) { resources.splice(i, 1); resourcesChanged = true; }
          }
        }
      });
      if (resourcesChanged) { this.sv('resources', resources); this.renderResources(); }
    }
  },

  // ---- FEAT SPELL EDITOR ----
  _openFeatSpellEditor(featIdx, featName, featObj, spellConfig, cardEl) {
    // Remove any existing editor
    cardEl.querySelector('.feat-spell-editor')?.remove();

    const editor = document.createElement('div');
    editor.className = 'feat-spell-editor';

    const chosenSpells = [...(featObj?.chosenSpells || [])];
    const chosenClass = featObj?.spellClass || '';

    // Build the picker content
    const buildPickers = (selectedClass) => {
      editor.innerHTML = '';

      // Class picker for Magic Initiate etc.
      if (spellConfig.requireClassPick) {
        const classRow = document.createElement('div');
        classRow.className = 'feat-spell-class-row';
        classRow.innerHTML = `<label class="feat-spell-label">Class:</label>`;
        const select = document.createElement('select');
        select.className = 'feat-spell-class-select';
        select.innerHTML = `<option value="">Choose class...</option>` +
          spellConfig.classOptions.map(c =>
            `<option value="${c}" ${c === selectedClass ? 'selected' : ''}>${c}</option>`
          ).join('');
        select.addEventListener('change', () => {
          chosenSpells.length = 0;
          buildPickers(select.value);
        });
        classRow.appendChild(select);
        editor.appendChild(classRow);
      }

      // Auto-spells display
      if (spellConfig.autoSpells?.length) {
        const autoDiv = document.createElement('div');
        autoDiv.className = 'feat-spell-auto-row';
        autoDiv.innerHTML = `<span class="feat-spell-label">Always prepared:</span> ${
          spellConfig.autoSpells.map(s => `<span class="feat-spell-tag feat-spell-auto">${s}</span>`).join('')
        }`;
        editor.appendChild(autoDiv);
      }

      // Spell pickers for each pick definition
      spellConfig.picks.forEach((pickDef, pickIdx) => {
        const pool = ClassResources.getFeatSpellPool(pickDef, selectedClass);
        const section = document.createElement('div');
        section.className = 'feat-spell-pick-section';

        const label = document.createElement('div');
        label.className = 'feat-spell-pick-label';
        label.textContent = pickDef.label || `Choose ${pickDef.count} spell(s)`;
        section.appendChild(label);

        // Figure out which spells in chosenSpells belong to this pick
        // For simplicity: spells are stored flat, picks are filled in order
        const prevCount = spellConfig.picks.slice(0, pickIdx).reduce((s, p) => s + p.count, 0);
        const mySpells = chosenSpells.slice(prevCount, prevCount + pickDef.count);

        // Show selected spell tags
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'feat-spell-selected-tags';
        mySpells.forEach((spellName, i) => {
          const tag = document.createElement('span');
          tag.className = 'feat-spell-tag';
          tag.innerHTML = `${spellName} <button class="feat-spell-tag-remove" title="Remove">&times;</button>`;
          tag.querySelector('.feat-spell-tag-remove').addEventListener('click', () => {
            chosenSpells.splice(prevCount + i, 1);
            buildPickers(selectedClass);
          });
          tagsDiv.appendChild(tag);
        });
        section.appendChild(tagsDiv);

        // Search input if we still need more picks
        if (mySpells.length < pickDef.count && pool.length) {
          const searchWrap = document.createElement('div');
          searchWrap.className = 'feat-spell-search-wrap';
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'feat-spell-search';
          input.placeholder = `Search ${pickDef.label || 'spells'}...`;
          const dropdown = document.createElement('div');
          dropdown.className = 'feat-spell-dropdown';

          const renderDropdown = (filter) => {
            const query = (filter || '').toLowerCase();
            const filtered = pool.filter(s =>
              s.name.toLowerCase().includes(query) &&
              !chosenSpells.some(c => c.toLowerCase() === s.name.toLowerCase())
            ).slice(0, 30);
            dropdown.innerHTML = '';
            if (!filtered.length) {
              dropdown.innerHTML = '<div class="feat-spell-dd-empty">No matches</div>';
              return;
            }
            filtered.forEach(spell => {
              const item = document.createElement('div');
              item.className = 'feat-spell-dd-item';
              item.innerHTML = `<span class="feat-spell-dd-name">${spell.name}</span>
                <span class="feat-spell-dd-meta">${spell._schoolName} · ${spell._src || ''}</span>`;
              item.addEventListener('click', () => {
                // Insert at correct position
                chosenSpells.splice(prevCount + mySpells.length, 0, spell.name);
                buildPickers(selectedClass);
              });
              dropdown.appendChild(item);
            });
          };

          input.addEventListener('input', () => {
            dropdown.style.display = 'block';
            renderDropdown(input.value);
          });
          input.addEventListener('focus', () => {
            dropdown.style.display = 'block';
            renderDropdown(input.value);
          });
          // Close dropdown on outside click
          document.addEventListener('click', (e) => {
            if (!searchWrap.contains(e.target)) dropdown.style.display = 'none';
          }, { once: false });

          searchWrap.appendChild(input);
          searchWrap.appendChild(dropdown);
          section.appendChild(searchWrap);
        }

        editor.appendChild(section);
      });

      // Save / Cancel buttons
      const actions = document.createElement('div');
      actions.className = 'feat-spell-editor-actions';
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-sm feat-spell-save-btn';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', () => {
        const feats = this.lv('feats', []);
        const newObj = {
          name: featName,
          chosenSpells: [...chosenSpells],
          ...(selectedClass && { spellClass: selectedClass }),
        };
        feats[featIdx] = newObj;
        this.sv('feats', feats);
        this._syncFeatSpells();
        this.renderFeats();
      });
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-sm';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => editor.remove());
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      editor.appendChild(actions);
    };

    buildPickers(chosenClass);

    // Insert editor after the spell choices row
    const spellRow = cardEl.querySelector('.feat-spell-choices');
    if (spellRow) spellRow.after(editor);
    else cardEl.appendChild(editor);
  },

  _openFeatCustomEditor(featIdx, featName, featObj, customConfig) {
    // Use the feat options modal approach — show an overlay picker
    document.querySelector('.feat-opts-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'feat-opts-overlay';
    const modal = document.createElement('div');
    modal.className = 'feat-opts-modal';

    const header = document.createElement('div');
    header.className = 'feat-opts-header';
    header.innerHTML = `<div class="feat-opts-title">${featName} — ${customConfig.label}</div>`;
    modal.appendChild(header);

    if (customConfig.hint) {
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:0.82rem;color:var(--ink-faint);margin-bottom:8px;';
      hint.textContent = customConfig.hint;
      modal.appendChild(hint);
    }

    const chosen = [...(featObj?.customChoices || [])];

    const mmList = document.createElement('div');
    mmList.className = 'feat-opts-mm-list';
    modal.appendChild(mmList);

    const renderMmOptions = () => {
      mmList.innerHTML = '';
      const options = ClassResources?.METAMAGIC_OPTIONS || [];
      options.forEach(opt => {
        const isSelected = chosen.includes(opt.name);
        const atMax = !isSelected && chosen.length >= customConfig.count;
        const card = document.createElement('div');
        card.className = 'feat-opts-mm-card' + (isSelected ? ' selected' : '') + (atMax ? ' disabled' : '');
        card.innerHTML = `
          <div class="feat-opts-mm-header">
            <span class="feat-opts-mm-name">${opt.name}</span>
            <span class="feat-opts-mm-cost">${opt.cost} SP</span>
          </div>
          <div class="feat-opts-mm-text">${this._highlightKeywords(opt.text)}</div>`;
        if (!atMax || isSelected) {
          card.addEventListener('click', () => {
            if (isSelected) chosen.splice(chosen.indexOf(opt.name), 1);
            else if (chosen.length < customConfig.count) chosen.push(opt.name);
            renderMmOptions();
            saveBtn.disabled = chosen.length < customConfig.count;
          });
        }
        mmList.appendChild(card);
      });
    };
    renderMmOptions();

    const actions = document.createElement('div');
    actions.className = 'feat-opts-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'feat-opts-btn cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => overlay.remove());
    const saveBtn = document.createElement('button');
    saveBtn.className = 'feat-opts-btn confirm';
    saveBtn.textContent = 'Save';
    saveBtn.disabled = chosen.length < customConfig.count;
    saveBtn.addEventListener('click', () => {
      const feats = this.lv('feats', []);
      const newObj = { ...(featObj || { name: featName }), customChoices: [...chosen] };
      feats[featIdx] = newObj;
      this.sv('feats', feats);
      this.renderFeats();
      overlay.remove();
    });
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  // ---- POPULATE DATALISTS ----
  // Global datalists (class-list, species-list, bg-list, feat-list, charopt-list, weapon-list)
  // are populated by app.js once data loads. This is a no-op kept for compatibility.
  populateDataLists() {},

  // ---- FEAT LIST FILTER ----
  // Re-populates feat-list datalist filtered by level (boons) and species (racial feats)
  refreshFeatList() {
    const dl = document.getElementById('feat-list');
    if (!dl || !DndData?.feats?.length) return;
    const level = this.getLevel();
    const speciesRaw = this.lv('charSpecies', '') || '';
    const speciesLower = speciesRaw.toLowerCase();
    const ua      = typeof isUAEnabled  === 'function' ? isUAEnabled()  : true;
    const show24f = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
    const show14f = typeof is2014Enabled === 'function' ? is2014Enabled() : false;

    // Check if character already has a Wild Talent feat
    const currentFeats = this.lv('feats', []);
    const hasWildTalent = currentFeats.some(cf => {
      const cfName = this._featName(cf);
      const cfInfo = typeof getFeatInfo === 'function' ? getFeatInfo(cfName) : null;
      return (cfInfo?.category || '') === 'Wild Talent';
    });

    const feats = DndData.feats.filter(f => {
      if (f.source === 'UA2024') { if (!ua || !show24f) return false; }
      else if (typeof is2024Source === 'function' && is2024Source(f.source)) { if (!show24f) return false; }
      else { if (!show14f) return false; }
      // Epic Boons only at level 20+
      if (f.category === 'EB' && level < 20) return false;
      // Wild Talent feats are exclusive — hide all if one is already chosen
      if (f.category === 'WT' && hasWildTalent) return false;
      // Racial prerequisite: if any prerequisite object has a `race` key,
      // only show if character's species name contains one of those race names
      const prereqs = f.prerequisite || [];
      for (const p of prereqs) {
        if (p.race) {
          const matches = p.race.some(r => speciesLower.includes(r.name.toLowerCase()));
          if (!matches) return false;
        }
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));

    dl.innerHTML = '';
    feats.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.name;
      opt.textContent = `${f.name} — ${f._catName || ''} — ${f._src}`;
      dl.appendChild(opt);
    });
  },

  // ---- ADD SPELL BUTTON + MODAL ----
  _initAddSpellButton() {
    const btn = this.$('btn-add-spell');
    if (!btn) return;
    btn.addEventListener('click', () => this._openAddSpellModal());
  },

  _openAddSpellModal() {
    const className = this.lv('charClass', '');
    const pool = className ? getSpellsForClass(className) : DndData.spells;

    // Group spells by level
    const byLevel = {};
    pool.forEach(s => {
      if (!byLevel[s.level]) byLevel[s.level] = [];
      byLevel[s.level].push(s);
    });
    Object.values(byLevel).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));

    const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
    const startLevel = levels[0] || 0;

    document.getElementById('add-spell-modal-backdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'add-spell-modal-backdrop';
    backdrop.className = 'rest-modal-backdrop';
    backdrop.style.display = 'flex';

    const tabsHtml = levels.map(lv =>
      `<button class="add-spell-tab${lv === startLevel ? ' active' : ''}" data-level="${lv}">${lv === 0 ? 'Cantrips' : 'Level ' + lv}</button>`
    ).join('');

    backdrop.innerHTML = `
      <div class="rest-modal add-spell-modal">
        <div class="rest-modal-header">
          <h2 class="rest-modal-title">Add Spell</h2>
          <button class="rest-modal-close" title="Close">✕</button>
        </div>
        <div class="rest-modal-body add-spell-body">
          <div class="add-spell-tabs">${tabsHtml}</div>
          <input type="text" class="add-spell-search" id="add-spell-search" placeholder="Search spells..." autocomplete="off">
          <div class="add-spell-layout">
            <div class="add-spell-list" id="add-spell-list"></div>
            <div class="add-spell-preview" id="add-spell-preview">
              <p class="add-spell-preview-empty">Hover over a spell to see its details</p>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('.rest-modal-close').addEventListener('click', close);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

    const listEl = backdrop.querySelector('#add-spell-list');
    const previewEl = backdrop.querySelector('#add-spell-preview');
    const searchInput = backdrop.querySelector('#add-spell-search');
    let currentLevel = startLevel;

    const alreadyAdded = new Set(this.lv('charSpells', []).map(s => s.name.toLowerCase()));

    const renderLevel = (lv) => {
      const spells = byLevel[lv] || [];
      const q = searchInput.value.toLowerCase().trim();
      const filtered = q ? spells.filter(s => s.name.toLowerCase().includes(q)) : spells;

      listEl.innerHTML = '';
      filtered.forEach(s => {
        const added = alreadyAdded.has(s.name.toLowerCase());
        const btn = document.createElement('button');
        btn.className = 'add-spell-item' + (added ? ' added' : '');
        btn.dataset.spell = s.name;
        btn.innerHTML = `<span class="add-spell-item-name">${s.name}</span>
          <span class="add-spell-item-meta">${s._schoolName || ''}${s._castTime ? ' · ' + s._castTime : ''}</span>
          ${added ? '<span class="add-spell-item-check">✓</span>' : ''}`;

        btn.addEventListener('mouseenter', () => {
          previewEl.innerHTML = this._buildSpellDetailHTML(s);
        });

        btn.addEventListener('click', () => {
          if (added) return;
          this.addSpellToSheet(s);
          alreadyAdded.add(s.name.toLowerCase());
          btn.classList.add('added');
          if (!btn.querySelector('.add-spell-item-check')) {
            const ck = document.createElement('span');
            ck.className = 'add-spell-item-check';
            ck.textContent = '✓';
            btn.appendChild(ck);
          }
        });

        listEl.appendChild(btn);
      });

      if (!filtered.length) {
        listEl.innerHTML = '<p style="color:var(--ink-faint);text-align:center;padding:20px;">No spells found.</p>';
      }
    };

    // Tab switching
    backdrop.querySelectorAll('.add-spell-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        backdrop.querySelectorAll('.add-spell-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentLevel = parseInt(tab.dataset.level);
        renderLevel(currentLevel);
        previewEl.innerHTML = '<p class="add-spell-preview-empty">Hover over a spell to see its details</p>';
      });
    });

    // Search
    searchInput.addEventListener('input', () => renderLevel(currentLevel));

    // Keyboard shortcut
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const origClose = close;
    backdrop._close = () => { origClose(); document.removeEventListener('keydown', onKey); };
    backdrop.querySelector('.rest-modal-close').removeEventListener('click', close);
    backdrop.querySelector('.rest-modal-close').addEventListener('click', backdrop._close);
    backdrop.removeEventListener('click', close);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop._close(); });

    renderLevel(startLevel);
    searchInput.focus();
  },

  // ---- SPELL HELPERS ----
  _isConcentration(spell) {
    return spell.duration && spell.duration[0] && spell.duration[0].concentration;
  },

  _isRitual(spell) {
    return !!(spell.meta && spell.meta.ritual);
  },

  _getActionType(spell) {
    const ct = (spell._castTime || '').toLowerCase();
    if (ct.includes('bonus')) return 'bonus';
    if (ct.includes('reaction')) return 'reaction';
    if (ct.includes('action') || ct === '1 action') return 'action';
    return 'other';
  },

  _actionColorClass(spell) {
    const type = this._getActionType(spell);
    if (type === 'action') return 'spell-action-action';
    if (type === 'bonus') return 'spell-action-bonus';
    if (type === 'reaction') return 'spell-action-reaction';
    return '';
  },

  // Short format helpers — try formatter function first, then derive from precomputed string
  _shortCastTime(spell) {
    if (typeof formatCastTimeShort === 'function' && spell.time) return formatCastTimeShort(spell.time);
    const ct = (spell._castTime || '').toLowerCase();
    if (ct.includes('bonus')) return '●';
    if (ct.includes('reaction')) return '●';
    if (ct.includes('action')) return '●';
    return spell._castTime || '';
  },
  _shortRange(spell) {
    if (typeof formatRangeShort === 'function' && spell.range) return formatRangeShort(spell.range);
    return (spell._rangeStr || '').replace(/\s*feet?\b/gi, ' ft').replace(/\s*miles?\b/gi, ' mi');
  },
  _shortComp(spell) {
    if (typeof formatComponentsShort === 'function' && spell.components) return formatComponentsShort(spell.components);
    return (spell._componentsStr || '').replace(/\s*\(.*\)/, '');
  },
  _shortDur(spell) {
    if (typeof formatDurationShort === 'function' && spell.duration) return formatDurationShort(spell.duration);
    const d = spell._durationStr || '';
    return d.replace(/^Conc\.\,\s*/i, '').replace('Instantaneous', 'Inst.').replace(/\bminutes?\b/gi, 'm').replace(/\bhours?\b/gi, 'h').replace(/\brounds?\b/gi, 'rd');
  },

  _extractDice(spell) {
    // Extract dice expressions from spell entries text
    if (!spell.entries) return [];
    const text = typeof entriesToText === 'function' ? entriesToText(spell.entries) : spell.entries.map(e => typeof e === 'string' ? e : '').join(' ');
    const dicePattern = /(\d+d\d+(?:\s*\+\s*\d+)?)/gi;
    const matches = [...new Set(text.match(dicePattern) || [])];
    return matches.slice(0, 3); // max 3 dice expressions
  },

  // Classes where every known spell is always prepared (no separate preparation step).
  // These classes pick specific spells and all of them are "prepared" at all times.
  _KNOWN_EQUALS_PREPARED: ['bard', 'sorcerer', 'warlock', 'ranger', 'psion'],

  /**
   * Returns true if the current character's class auto-prepares all known spells.
   * For these classes, every spell in charSpells should have prepared: true.
   */
  _isKnownEqualsPrepared(className) {
    const cls = (className || this.lv('charClass', '') || '').toLowerCase().trim();
    return this._KNOWN_EQUALS_PREPARED.includes(cls);
  },

  // 2024 PHB prepared spell tables for fixed-list casters
  _PREPARED_TABLES: {
    bard:     [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
    sorcerer: [0, 2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
    warlock:  [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    psion:    [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  },

  _calcPreparedMax(mods, level) {
    const maxEl = this.$('spellPreparedMax');
    if (!maxEl) return;
    const className = (this.lv('charClass', '') || '').toLowerCase().trim();
    if (!className) return;

    let max = null;

    // Fixed-table casters
    if (this._PREPARED_TABLES[className]) {
      max = this._PREPARED_TABLES[className][Math.min(level, 20)] || 0;
    }
    // Level + ability mod casters
    else if (className === 'wizard') {
      max = Math.max(1, level + (mods.int || 0));
    } else if (className === 'cleric') {
      max = Math.max(1, level + (mods.wis || 0));
    } else if (className === 'druid') {
      max = Math.max(1, level + (mods.wis || 0));
    }
    // Half-casters
    else if (className === 'paladin') {
      max = Math.max(1, Math.floor(level / 2) + (mods.cha || 0));
    } else if (className === 'ranger') {
      max = Math.max(1, Math.floor(level / 2) + (mods.wis || 0));
    }

    if (max !== null) {
      maxEl.value = max;
      this.sv('spellPreparedMax', max);
      this._updatePreparedCount();
    }
  },

  _updatePreparedCount() {
    const el = this.$('spellPreparedCount');
    if (!el) return;
    const spells = this.lv('charSpells', []);
    const count = spells.filter(s => s.prepared && s.level > 0 && !s.alwaysPrepared && !s.featSource && !s.subclass && !s.racial).length;
    el.textContent = count;
    const maxEl = this.$('spellPreparedMax');
    const display = el.closest('.spell-prepared-display');
    if (display && maxEl) {
      const max = parseInt(maxEl.value);
      display.classList.toggle('over-limit', !isNaN(max) && max > 0 && count > max);
    }

    // Grey out unprepared spell cards
    this.qsa('.spell-card').forEach(card => {
      const isPrepared = card.dataset.isPrepared === '1';
      card.classList.toggle('spell-not-prepared', !isPrepared);
    });
  },

  _showPreparedWarning(max, x, y) {
    document.getElementById('prepared-limit-warning')?.remove();
    const warn = document.createElement('div');
    warn.id = 'prepared-limit-warning';
    warn.className = 'prepared-limit-warning';
    warn.textContent = `You can only have ${max} spells prepared. Unprepare a spell first.`;
    document.body.appendChild(warn);
    const rect = warn.getBoundingClientRect();
    let left = x - rect.width / 2;
    let top = y - rect.height - 8;
    if (left < 8) left = 8;
    if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
    if (top < 8) top = y + 24;
    warn.style.left = left + 'px';
    warn.style.top = top + 'px';
    setTimeout(() => warn.remove(), 2500);
  },

  addSpellToSheet(spell) {
    const level = spell.level;
    const spells = this.lv('charSpells', []);
    if (spells.find(s => s.name === spell.name && s.level === level)) return;
    // Cantrips are always prepared; known=prepared classes auto-prepare all spells
    const autoPrepare = level === 0 || this._isKnownEqualsPrepared();
    spells.push({ name: spell.name, level, prepared: autoPrepare });
    this.sv('charSpells', spells);
    this.renderSpellCard(spell, level);
    this._updatePreparedCount();
  },

  renderSpellCard(spell, level) {
    const container = this.$(`spell-cards-${level}`);
    if (!container) return;
    const saved = this.lv('charSpells', []).find(s => s.name.toLowerCase() === spell.name.toLowerCase());
    const isRacial = saved?.racial || !!saved?.featSource;
    const isPrepared = isRacial || saved?.prepared;
    const isConc = this._isConcentration(spell);
    const isRitual = this._isRitual(spell);
    const actionType = this._getActionType(spell);
    const actionClass = this._actionColorClass(spell);

    // Check if this spell is currently being concentrated on
    const concSpell = this.lv('combat_concSpell', '');
    const isConcentrating = this.lv('combat_concentrating', false);
    const isActiveConc = isConc && isConcentrating && concSpell.toLowerCase() === spell.name.toLowerCase();

    const card = document.createElement('div');
    card.className = 'spell-card' + (isRacial ? ' spell-racial' : '') + (isActiveConc ? ' spell-concentrating' : '');
    card.dataset.spellName = spell.name;
    card.dataset.actionType = actionType;
    card.dataset.isConcentration = isConc ? '1' : '';
    card.dataset.isRitual = isRitual ? '1' : '';
    card.dataset.isPrepared = isPrepared ? '1' : '';

    // Build badges
    let badges = '';
    if (isConc) badges += `<span class="spell-badge spell-badge-conc" title="Concentration">C</span>`;
    if (isRitual) badges += `<span class="spell-badge spell-badge-ritual" title="Ritual">R</span>`;
    if (isRacial && !saved?.featSource) {
      badges += `<span class="spell-badge spell-badge-racial" title="Racial spell — always prepared">✦</span>`;
      // Show which ability this racial spell uses
      const racialAb = (this.lv('racialSpellAbility', '') || '').toLowerCase();
      const classAb = (this.lv('spellcastingAbility', '') || '').toLowerCase();
      const abNames = { int: 'INT', wis: 'WIS', cha: 'CHA', str: 'STR', dex: 'DEX', con: 'CON' };
      if (racialAb && classAb && racialAb !== classAb) {
        badges += `<span class="spell-badge spell-badge-racial-ab" title="Casts with ${abNames[racialAb] || racialAb} (species) instead of ${abNames[classAb] || classAb} (class)">${abNames[racialAb] || racialAb}</span>`;
      }
    }
    if (saved?.subclass && saved?.alwaysPrepared) {
      const subclassName = this.lv('charSubclass', '') || 'Subclass';
      badges += `<span class="spell-badge spell-badge-subclass" title="${subclassName} — always prepared">✦</span>`;
    }
    if (saved?.featSource) {
      badges += `<span class="spell-badge spell-badge-feat" title="${saved.featSource} — always prepared">✦</span>`;
      if (saved.featSpellAbility) {
        const featAb = saved.featSpellAbility.toLowerCase();
        const classAb = (this.lv('spellcastingAbility', '') || '').toLowerCase();
        const abNames = { int: 'INT', wis: 'WIS', cha: 'CHA', str: 'STR', dex: 'DEX', con: 'CON' };
        if (featAb && classAb && featAb !== classAb) {
          badges += `<span class="spell-badge spell-badge-racial-ab" title="Casts with ${abNames[featAb] || featAb} (${saved.featSource}) instead of ${abNames[classAb] || classAb} (class)">${abNames[featAb] || featAb}</span>`;
        }
      }
    }

    // Apply subclass spell modifications for display
    const _spellMods = this.lv('spellMods', {}) || {};
    const _sMod = _spellMods[spell.name];
    if (_sMod?.rangeOverride) spell = { ...spell, _rangeStr: _sMod.rangeOverride };

    // Tooltip content
    const tooltipParts = [];
    if (spell._rangeStr) tooltipParts.push(`Range: ${spell._rangeStr}`);
    if (spell._componentsStr) tooltipParts.push(`Components: ${spell._componentsStr}`);
    if (spell._durationStr) tooltipParts.push(`Duration: ${spell._durationStr}`);
    const tooltipText = tooltipParts.join(' | ');

    card.innerHTML = `
      <input type="checkbox" title="Prepared" ${isPrepared ? 'checked' : ''} ${isRacial ? 'disabled' : ''}>
      <span class="spell-card-name spell-card-name-clickable" title="${tooltipText}">${spell.name}<span class="spell-card-school">${spell._schoolName || ''}</span></span>
      <span class="spell-card-badges">${badges}</span>
      <span class="spell-card-meta"><span class="spell-cast-time ${actionClass}" title="${spell._castTime || ''}">${this._shortCastTime(spell)}</span></span>
      <span class="spell-card-range" title="${spell._rangeStr || ''}">${this._shortRange(spell)}</span>
      <span class="spell-card-comp" title="${spell._componentsStr || ''}">${this._shortComp(spell)}</span>
      <span class="spell-card-dur" title="${spell._durationStr || ''}">${this._shortDur(spell)}</span>
      ${isRacial ? '<span></span>' : '<button class="del-btn" title="Remove spell">✕</button>'}`;

    // Concentration click — set this spell as concentration target
    if (isConc && !isRacial) {
      const concBadge = card.querySelector('.spell-badge-conc');
      if (concBadge) {
        concBadge.style.cursor = 'pointer';
        concBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          this._setConcentration(spell.name);
        });
      }
    }

    // Hover to show spell detail tooltip
    const nameEl = card.querySelector('.spell-card-name-clickable');
    nameEl.addEventListener('mouseenter', (e) => {
      this._showSpellHover(spell, e);
    });
    nameEl.addEventListener('mousemove', (e) => {
      this._moveSpellHover(e);
    });
    nameEl.addEventListener('mouseleave', () => {
      this._scheduleSpellHoverHide();
    });


    // Dice buttons
    card.querySelectorAll('.spell-dice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expr = btn.dataset.dice.replace(/\s/g, '');
        const result = Dice.rollExpression(expr);
        Dice.showResult(`${spell.name} (${expr})`, result);
      });
    });

    if (!isRacial) {
      card.querySelector('input[type="checkbox"]').addEventListener('change', function () {
        // Block preparing if at max (cantrips are exempt from the limit)
        if (this.checked && spell.level > 0) {
          const max = parseInt(CharStore.lv('spellPreparedMax', '')) || 0;
          if (max > 0) {
            const current = CharStore.lv('charSpells', []).filter(s => s.prepared && s.level > 0 && !s.alwaysPrepared && !s.featSource && !s.subclass && !s.racial).length;
            if (current >= max) {
              this.checked = false;
              const rect = this.getBoundingClientRect();
              Sheet._showPreparedWarning(max, rect.left + rect.width / 2, rect.top);
              return;
            }
          }
        }
        const spells = CharStore.lv('charSpells', []);
        const s = spells.find(s => s.name === spell.name);
        if (s) s.prepared = this.checked;
        CharStore.sv('charSpells', spells);
        card.dataset.isPrepared = this.checked ? '1' : '';
        if (typeof Sheet !== 'undefined') Sheet._updatePreparedCount();
      });
      card.querySelector('.del-btn').addEventListener('click', () => {
        const spells = this.lv('charSpells', []).filter(s => s.name !== spell.name);
        this.sv('charSpells', spells);
        card.remove();
        this._updatePreparedCount();
      });
    }

    container.appendChild(card);
  },

  restoreSpells() {
    // Clear all existing spell cards to prevent duplicates
    for (let i = 0; i <= 9; i++) {
      const container = this.$(`spell-cards-${i}`);
      if (container) container.innerHTML = '';
    }
    const spells = this.lv('charSpells', []);
    spells.forEach(s => {
      const spell = DndData.spells.find(sp => sp.name.toLowerCase() === s.name.toLowerCase())
        || { name: s.name, level: s.level, _schoolName: s.racial ? 'Racial' : '', _castTime: '' };
      this.renderSpellCard(spell, s.level);
    });
    this._updatePreparedCount();
    this._refreshConcentrationHighlight();
  },

  // ---- CONCENTRATION ADVANTAGE DETECTION ----
  // Checks feats, class features, and character options for sources of advantage
  // on Constitution saving throws to maintain concentration.
  _concSaveMode() {
    // Known feats that grant advantage on concentration saves
    const CONC_ADV_FEATS = ['war caster'];
    const featNames = (this.lv('feats', []) || []).map(f => this._featName(f).toLowerCase());
    if (featNames.some(f => CONC_ADV_FEATS.some(k => f.includes(k)))) return 'advantage';

    // Check character options (supernatural gifts, dark gifts, etc.)
    const charOpts = (this.lv('charOptions', []) || []).map(o => (typeof o === 'string' ? o : o.name || '').toLowerCase());
    if (charOpts.some(o => CONC_ADV_FEATS.some(k => o.includes(k)))) return 'advantage';

    return undefined;
  },

  // ---- CONCENTRATION TRACKER (Spell Tab) ----
  _initSpellConcentration() {
    // Both concentration trackers: spell tab and character tab
    const pairs = [
      { cb: this.$('spell-conc-active'), input: this.$('spell-conc-spell'), drop: this.$('spell-conc-drop'), check: this.$('spell-conc-check'), checkDmg: this.$('spell-conc-check-dmg'), dmgInput: this.$('spell-conc-dmg'), bar: this.$('spell-conc-bar') },
      { cb: this.$('char-conc-active'), input: this.$('char-conc-spell'), drop: this.$('char-conc-drop'), check: this.$('char-conc-check'), checkDmg: this.$('char-conc-check-dmg'), dmgInput: this.$('char-conc-dmg'), bar: this.$('char-conc-bar') },
    ].filter(p => p.cb && p.input);

    // Restore state
    const isConc = this.lv('combat_concentrating', false);
    const concSpell = this.lv('combat_concSpell', '');
    pairs.forEach(p => {
      p.cb.checked = isConc;
      p.input.value = concSpell;
      if (isConc) p.bar?.classList.add('active');
    });

    const syncAll = () => {
      const checked = this.lv('combat_concentrating', false);
      const spell = this.lv('combat_concSpell', '');
      pairs.forEach(p => {
        p.cb.checked = checked;
        p.input.value = spell;
        p.bar?.classList.toggle('active', checked);
      });
      this._refreshConcentrationHighlight();
    };

    pairs.forEach(p => {
      p.cb.addEventListener('change', () => {
        this.sv('combat_concentrating', p.cb.checked);
        if (!p.cb.checked) this.sv('combat_concSpell', '');
        syncAll();
      });

      p.input.addEventListener('input', () => {
        this.sv('combat_concSpell', p.input.value);
        syncAll();
      });

      const doConcRoll = (dc) => {
        const conScore = parseInt(this.$('con')?.value) || 10;
        const conMod = Math.floor((conScore - 10) / 2);
        const profBonus = this.getProfBonus(this.getLevel());
        const isProf = this.lv('saveProf_con', false);
        const totalMod = conMod + (isProf ? profBonus : 0);
        const mode = this._concSaveMode();
        const result = Dice.rollD20(totalMod, mode);
        const passed = result.total >= dc;
        const modeLabel = mode === 'advantage' ? ' — Adv: War Caster' : '';
        const label = `Concentration (Con Save vs DC ${dc}${modeLabel}) — ${passed ? 'Maintained!' : 'Lost!'}`;
        Dice.showResult(label, result);
        if (!passed) {
          this.sv('combat_concentrating', false);
          this.sv('combat_concSpell', '');
          syncAll();
        }
      };

      p.check?.addEventListener('click', () => doConcRoll(10));
      if (p.check) attachInstantTooltip(p.check,
        '<strong>Concentration Save — DC 10</strong><br>' +
        'Use when the damage taken was 20 or less.<br>' +
        'DC is always 10 in this case.');

      p.checkDmg?.addEventListener('click', () => {
        const dmg = parseInt(p.dmgInput?.value) || 0;
        const dc = Math.max(10, Math.floor(dmg / 2));
        doConcRoll(dc);
      });
      if (p.checkDmg) attachInstantTooltip(p.checkDmg,
        '<strong>Concentration Save — Custom DC</strong><br>' +
        'Type the damage taken in the field, then click Roll.<br>' +
        'DC = half the damage taken (minimum 10).<br>' +
        'e.g. 30 damage → DC 15');
      if (p.dmgInput) attachInstantTooltip(p.dmgInput,
        '<strong>Damage taken</strong><br>' +
        'Enter the total damage from the hit.<br>' +
        'DC = half this value (minimum 10).');

      p.drop?.addEventListener('click', () => {
        this.sv('combat_concentrating', false);
        this.sv('combat_concSpell', '');
        syncAll();
      });
    });
  },

  _setConcentration(spellName) {
    this.sv('combat_concentrating', true);
    this.sv('combat_concSpell', spellName);
    // Sync all concentration UIs
    [['spell-conc-active', 'spell-conc-spell', 'spell-conc-bar'],
     ['char-conc-active', 'char-conc-spell', 'char-conc-bar']].forEach(([cbId, inputId, barId]) => {
      const cb = this.$(cbId);
      const input = this.$(inputId);
      const bar = this.$(barId);
      if (cb) cb.checked = true;
      if (input) input.value = spellName;
      if (bar) bar.classList.add('active');
    });
    this._refreshConcentrationHighlight();
  },

  _refreshConcentrationHighlight() {
    const concSpell = this.lv('combat_concSpell', '').toLowerCase();
    const isConc = this.lv('combat_concentrating', false);
    this.qsa('.spell-card').forEach(card => {
      const name = (card.dataset.spellName || '').toLowerCase();
      const isMatch = isConc && concSpell && name === concSpell && card.dataset.isConcentration === '1';
      card.classList.toggle('spell-concentrating', isMatch);
    });
  },

  // ---- SPELL FILTERS ----
  _initSpellFilters() {
    const filterBtns = this.qsa('.spell-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._applySpellFilter(btn.dataset.filter);
      });
    });
  },

  _applySpellFilter(filter) {
    this.qsa('.spell-card').forEach(card => {
      let show = true;
      if (filter === 'prepared') show = card.dataset.isPrepared === '1';
      else if (filter === 'action') show = card.dataset.actionType === 'action';
      else if (filter === 'bonus') show = card.dataset.actionType === 'bonus';
      else if (filter === 'reaction') show = card.dataset.actionType === 'reaction';
      else if (filter === 'concentration') show = card.dataset.isConcentration === '1';
      else if (filter === 'ritual') show = card.dataset.isRitual === '1';
      card.style.display = show ? '' : 'none';
    });

    // Hide empty level sections
    this.qsa('.spell-level-section').forEach(section => {
      const visibleCards = section.querySelectorAll('.spell-card:not([style*="display: none"])');
      section.style.display = (filter === 'all' || visibleCards.length > 0) ? '' : 'none';
    });
  },

  // ---- SPELL ATTACK ROLL ----
  _initSpellAttackRoll() {
    const atkEl = this.$('spellAttackBonus');
    if (!atkEl) return;
    atkEl.style.cursor = 'pointer';
    atkEl.addEventListener('click', () => {
      const mod = parseInt(atkEl.textContent) || 0;
      this._conditionRollD20('Spell Attack', mod, 'attack');
    });
  },

  _buildSpellDetailHTML(spell) {
    const bodyHtml = typeof entriesToHtml === 'function' && spell.entries
      ? entriesToHtml(spell.entries)
      : (spell.entries ? spell.entries.map(e => typeof e === 'string' ? `<p>${e}</p>` : `<p><strong>${e.name}:</strong> ${(e.entries || []).join(' ')}</p>`).join('') : '<p>No description available.</p>');

    // Check for subclass spell modifications (e.g. range overrides)
    const spellMods = this.lv('spellMods', {}) || {};
    const mod = spellMods[spell.name];
    if (mod?.rangeOverride && spell._rangeStr) {
      spell = { ...spell, _rangeStr: mod.rangeOverride + ' (modified by subclass)' };
    }

    const isConc = this._isConcentration(spell);
    const isRitual = this._isRitual(spell);
    const actionClass = this._actionColorClass(spell);
    const diceExprs = this._extractDice(spell);

    let tagsHtml = `<span class="spell-detail-tag">${spell._levelStr || (spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`)}</span>`;
    tagsHtml += `<span class="spell-detail-tag">${spell._schoolName || ''}</span>`;
    if (isConc) tagsHtml += `<span class="spell-detail-tag spell-tag-conc">Concentration</span>`;
    if (isRitual) tagsHtml += `<span class="spell-detail-tag spell-tag-ritual">Ritual</span>`;
    if (spell._src) tagsHtml += `<span class="spell-detail-tag">${spell._src}</span>`;

    let diceSection = '';
    if (diceExprs.length > 0) {
      diceSection = `<div class="spell-detail-dice">${diceExprs.map(d => `<button class="spell-detail-dice-btn" data-dice="${d}">Roll ${d}</button>`).join('')}</div>`;
    }

    let concBtn = '';
    if (isConc && spell.level > 0) {
      concBtn = `<button class="btn btn-sm spell-detail-conc-btn spell-hover-conc-btn">Concentrate on this spell</button>`;
    }

    // Racial spell ability warning
    const saved = this.lv('charSpells', []).find(s => s.name.toLowerCase() === spell.name.toLowerCase());
    let racialAbNote = '';
    if (saved?.racial) {
      const racialAb = (this.lv('racialSpellAbility', '') || '').toLowerCase();
      const classAb = (this.lv('spellcastingAbility', '') || '').toLowerCase();
      const abNames = { int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma', str: 'Strength', dex: 'Dexterity', con: 'Constitution' };
      if (racialAb && classAb && racialAb !== classAb) {
        racialAbNote = `<div style="background:rgba(218,165,32,0.15);border:1px solid var(--gold);border-radius:4px;padding:4px 8px;margin-top:6px;font-size:0.78rem"><strong>Note:</strong> This racial spell uses <strong>${abNames[racialAb] || racialAb}</strong> as its spellcasting ability, not your class ability (${abNames[classAb] || classAb}).</div>`;
      }
    }
    if (saved?.featSource && saved?.featSpellAbility) {
      const featAb = saved.featSpellAbility.toLowerCase();
      const classAb = (this.lv('spellcastingAbility', '') || '').toLowerCase();
      const abNames = { int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma', str: 'Strength', dex: 'Dexterity', con: 'Constitution' };
      if (featAb && classAb && featAb !== classAb) {
        racialAbNote = `<div style="background:rgba(218,165,32,0.15);border:1px solid var(--gold);border-radius:4px;padding:4px 8px;margin-top:6px;font-size:0.78rem"><strong>Note:</strong> This feat spell (${saved.featSource}) uses <strong>${abNames[featAb] || featAb}</strong> as its spellcasting ability, not your class ability (${abNames[classAb] || classAb}).</div>`;
      }
    }

    return `
      <div class="spell-hover-header"><strong>${spell.name}</strong></div>
      <div class="spell-detail-tags">${tagsHtml}</div>
      <div class="spell-detail-stats">
        ${spell._castTime ? `<div><strong>Casting Time:</strong> <span class="${actionClass}">${spell._castTime}</span></div>` : ''}
        ${spell._rangeStr ? `<div><strong>Range:</strong> ${spell._rangeStr}</div>` : ''}
        ${spell._componentsStr ? `<div><strong>Components:</strong> ${spell._componentsStr}</div>` : ''}
        ${spell._durationStr ? `<div><strong>Duration:</strong> ${spell._durationStr}${isConc ? ' <span class="spell-tag-conc" style="font-size:0.75rem;padding:1px 5px;border-radius:3px">Concentration</span>' : ''}</div>` : ''}
      </div>
      ${diceSection}
      <div class="spell-detail-body">${this._highlightSpellText(bodyHtml)}</div>
      ${spell.entriesHigherLevel ? `<div class="spell-detail-body spell-detail-higher"><p><strong>At Higher Levels.</strong> ${this._highlightSpellText(typeof entriesToHtml === 'function' ? entriesToHtml(spell.entriesHigherLevel) : '')}</p></div>` : ''}
      ${racialAbNote}
      ${concBtn}`;
  },

  _showSpellHover(spell, event) {
    this._hideSpellHover();
    const tip = document.createElement('div');
    tip.className = 'spell-hover-tooltip';
    tip.id = 'spell-hover-active';
    tip.innerHTML = this._buildSpellDetailHTML(spell);
    tip._spell = spell;
    document.body.appendChild(tip);

    // Position near the cursor
    const cx = event.clientX;
    const cy = event.clientY;
    requestAnimationFrame(() => {
      const tr = tip.getBoundingClientRect();
      let top = cy + 12;
      let left = cx + 12;
      // Flip above if below viewport
      if (top + tr.height > window.innerHeight - 8) top = cy - tr.height - 8;
      // Flip left if beyond right edge
      if (left + tr.width > window.innerWidth - 8) left = cx - tr.width - 8;
      if (left < 8) left = 8;
      if (top < 8) top = 8;
      tip.style.top = top + 'px';
      tip.style.left = left + 'px';
      tip.classList.add('show');
    });
    tip.style.top = (cy + 12) + 'px';
    tip.style.left = (cx + 12) + 'px';

    // Keep tooltip open while hovering over it
    tip.addEventListener('mouseenter', () => this._cancelSpellHoverHide());
    tip.addEventListener('mouseleave', () => this._scheduleSpellHoverHide());

    // Wire up dice buttons
    this._wireSpellHoverButtons(tip, spell);
  },

  _moveSpellHover(event) {
    const tip = document.getElementById('spell-hover-active');
    if (!tip) return;
    // Don't move if the cursor is hovering over the tooltip itself
    const tr = tip.getBoundingClientRect();
    const mx = event.clientX, my = event.clientY;
    const margin = 20;
    if (mx >= tr.left - margin && mx <= tr.right + margin &&
        my >= tr.top - margin && my <= tr.bottom + margin) return;
    let top = my + 12;
    let left = mx + 12;
    if (top + tr.height > window.innerHeight - 8) top = my - tr.height - 8;
    if (left + tr.width > window.innerWidth - 8) left = mx - tr.width - 8;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  },

  _wireSpellHoverButtons(tip, spell) {
    tip.querySelectorAll('.spell-detail-dice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expr = btn.dataset.dice.replace(/\s/g, '');
        const result = Dice.rollExpression(expr);
        Dice.showResult(`${spell.name} (${expr})`, result);
      });
    });
    const concBtn = tip.querySelector('.spell-hover-conc-btn');
    if (concBtn) {
      concBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._setConcentration(spell.name);
        this._hideSpellHover();
      });
    }
  },

  _hideSpellHover() {
    const tip = document.getElementById('spell-hover-active');
    if (tip) tip.remove();
    this._cancelSpellHoverHide();
  },

  _scheduleSpellHoverHide() {
    this._cancelSpellHoverHide();
    this._spellHoverTimer = setTimeout(() => this._hideSpellHover(), 300);
  },

  _cancelSpellHoverHide() {
    if (this._spellHoverTimer) {
      clearTimeout(this._spellHoverTimer);
      this._spellHoverTimer = null;
    }
  },

  // ---- SPELL SLOTS ----
  buildSpellSlots() {
    const bar = this.$('spell-slots-bar');
    if (!bar) return;
    bar.innerHTML = '';

    // Auto-calculate from class + level
    const className = this.lv('charClass', '');
    const level = this.getLevel();
    if (className && typeof getSpellSlots === 'function') {
      const slots = getSpellSlots(className, level);
      for (let i = 0; i < 9; i++) {
        this.sv(`slotMax_${i + 1}`, slots[i]);
      }
    }

    for (let lvl = 1; lvl <= 9; lvl++) {
      const total = this.lv(`slotMax_${lvl}`, 0);
      const div = document.createElement('div');
      div.className = 'slot-level';
      div.innerHTML = `
        <h4>Lvl ${lvl}</h4>
        <div class="slot-checkboxes" id="slot-cbs-${lvl}"></div>`;
      bar.appendChild(div);
      this.renderSlotCheckboxes(lvl, total);
    }
  },

  renderSlotCheckboxes(level, count) {
    const container = this.$(`slot-cbs-${level}`);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'slot-cb';
      const key = `slotUsed_${level}_${i}`;
      cb.checked = this.lv(key, false);
      cb.addEventListener('change', () => this.sv(key, cb.checked));
      container.appendChild(cb);
    }
  },

  buildSpellLevelSections() {
    const mount = this.$('spell-levels-mount');
    if (!mount) return;
    mount.innerHTML = '';
    for (let lvl = 1; lvl <= 9; lvl++) {
      const section = document.createElement('div');
      section.className = 'spell-level-section';
      section.id = `spell-section-${lvl}`;
      section.innerHTML = `
        <h3 class="spell-level-heading">${['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'][lvl]} Level</h3>
        <div class="spell-cards" id="spell-cards-${lvl}"></div>`;
      mount.appendChild(section);
    }
  },

  // ---- ITEM SEARCH ----
  initItemSearch() {
    const input = this.$('item-search');
    const dropdown = this.$('item-search-results');
    if (!input || !dropdown) return;

    let selectedIdx = -1;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      if (query.length < 2) { dropdown.style.display = 'none'; return; }

      const matches = DndData.allItems.filter(i => i.name.toLowerCase().includes(query)).slice(0, 30);
      dropdown.innerHTML = '';
      selectedIdx = -1;
      if (!matches.length) { dropdown.style.display = 'none'; return; }

      matches.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'ac-item';
        let detail = item._type;
        if (item._dmgStr) detail += ` | ${item._dmgStr}`;
        if (item._valueStr) detail += ` | ${item._valueStr}`;
        if (item.weight) detail += ` | ${item.weight} lb.`;
        if (item._propStr) detail += ` | ${item._propStr}`;
        if (item.rarity && item.rarity !== 'none') detail += ` | ${item.rarity}`;
        div.innerHTML = `
          <span class="ac-item-name">${item.name} <small style="color:var(--ink-faint)">[${item._src || ''}]</small></span>
          <span class="ac-item-detail">${detail}</span>`;
        div.addEventListener('mousedown', e => e.preventDefault());
        div.addEventListener('click', () => {
          this.addItemToInventory(item);
          input.value = '';
          dropdown.style.display = 'none';
        });
        dropdown.appendChild(div);
      });
      dropdown.style.display = 'block';
    });

    input.addEventListener('keydown', e => {
      const items = dropdown.querySelectorAll('.ac-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, items.length - 1); this._updateACSelection(items, selectedIdx); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); this._updateACSelection(items, selectedIdx); }
      else if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); items[selectedIdx]?.click(); }
      else if (e.key === 'Escape') { dropdown.style.display = 'none'; }
    });

    input.addEventListener('blur', () => setTimeout(() => dropdown.style.display = 'none', 200));
  },

  initMagicItemSearch() {
    const input = this.$('magic-item-search');
    const dropdown = this.$('magic-item-search-results');
    if (!input || !dropdown) return;

    let selectedIdx = -1;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      if (query.length < 2) { dropdown.style.display = 'none'; return; }

      const matches = DndData.allItems
        .filter(i => i._isMagic && i.name.toLowerCase().includes(query))
        .slice(0, 30);
      dropdown.innerHTML = '';
      selectedIdx = -1;
      if (!matches.length) { dropdown.style.display = 'none'; return; }

      matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'ac-item';
        let detail = item.rarity && item.rarity !== 'none' ? item.rarity : item._type;
        if (item._reqAttune) detail += ' | Requires Attunement' + (typeof item._reqAttune === 'string' ? ` (${item._reqAttune})` : '');
        div.innerHTML = `
          <span class="ac-item-name">${item.name} <small style="color:var(--ink-faint)">[${item._src || ''}]</small></span>
          <span class="ac-item-detail">${detail}</span>`;
        div.addEventListener('mousedown', e => e.preventDefault());
        div.addEventListener('click', () => {
          this.addItemToInventory(item);
          input.value = '';
          dropdown.style.display = 'none';
        });
        dropdown.appendChild(div);
      });
      dropdown.style.display = 'block';
    });

    input.addEventListener('keydown', e => {
      const items = dropdown.querySelectorAll('.ac-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, items.length - 1); this._updateACSelection(items, selectedIdx); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); this._updateACSelection(items, selectedIdx); }
      else if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); items[selectedIdx]?.click(); }
      else if (e.key === 'Escape') { dropdown.style.display = 'none'; }
    });

    input.addEventListener('blur', () => setTimeout(() => dropdown.style.display = 'none', 200));
  },

  // Returns the max weight a container can hold, or null if unlimited.
  // Checks structured containerCapacity.weight first, then parses the string capacity field.
  _containerMaxWeight(container) {
    if (container.containerCapacity?.weight?.[0] != null) return container.containerCapacity.weight[0];
    if (container.capacityStr) {
      const m = String(container.capacityStr).match(/([\d.]+)\s*lb/i);
      if (m) return parseFloat(m[1]);
    }
    return null;
  },

  // Returns the max item count a container allows for a given item, or null if unlimited.
  // 5etools stores this as containerCapacity.item: [{"arrow|phb": 20}] where the value is the count.
  _containerMaxItemCount(container, itemName) {
    const restrictions = container.containerCapacity?.item;
    if (!restrictions) return null;
    const lower = itemName.toLowerCase().replace(/\s*\(\d+\)\s*$/, '').trim();
    for (const r of restrictions) {
      if (typeof r !== 'object' || r === null) continue;
      for (const [key, val] of Object.entries(r)) {
        if (typeof val !== 'number') continue;
        const base = key.split('|')[0].toLowerCase();
        if (lower === base || lower === base + 's' || lower + 's' === base || lower.startsWith(base) || base.startsWith(lower)) {
          return val;
        }
      }
    }
    return null;
  },

  // Strict fallback for items not found in 5etools data (containerCapacity is the primary check)
  _CONTAINER_NAMES: /^(backpacks?|bags? of holding|chests?|sacks?|haversacks?|portable holes?|heward's handy haversacks?|pouche?s?)$/i,

  // Items that have containerCapacity in the data but are liquid/consumable vessels — NOT gear bags
  _LIQUID_CONTAINERS: {
    'waterskin': 4,
    'flask':     1,
    'vial':      1,
    'jug':       1,
    'pitcher':   1,
    'pot':       1,
    'tankard':   1,
    'bottle':    1,
  },

  _isLiquidContainer(name) {
    return Object.prototype.hasOwnProperty.call(this._LIQUID_CONTAINERS, (name || '').toLowerCase().trim());
  },

  addItemToInventory(item) {
    // Detect spell scroll — prompt user to assign a spell before adding
    const tc = (item.type || '').split('|')[0].toUpperCase();
    if (tc === 'SC' && !item._scrollSpellAssigned) {
      const scrollLevel = this._parseScrollLevel(item.name);
      if (scrollLevel !== null) {
        this._promptScrollSpellPicker(item, scrollLevel);
        return;
      }
    }

    const inv = this.lv('inventory', []);
    // Volume-only containerCapacity (liquid vessels) should NOT become folder containers
    const hasVolumeOnlyCapacity = item.containerCapacity
      && !item.containerCapacity.weight
      && !item.containerCapacity.item
      && item.containerCapacity.volume;
    const isContainer = !!(
      (!hasVolumeOnlyCapacity && item.containerCapacity) ||
      this._CONTAINER_NAMES.test(item.name || '')
    );
    const isLiquid = this._isLiquidContainer(item.name);
    if (!isContainer && !isLiquid) {
      const existing = inv.find(i => i.name === item.name && !i.isContainer && i.scrollSpell === item._scrollSpell);
      if (existing) { existing.qty++; this.sv('inventory', inv); this.renderInventory(); return; }
    }
    const containerKey = isContainer
      ? (Date.now().toString(36) + Math.random().toString(36).slice(2))
      : undefined;
    const maxPints = isLiquid ? this._LIQUID_CONTAINERS[item.name.toLowerCase().trim()] : 0;
    const PINT_LBS = 1;
    const fullWeight = item.weight || 0;
    const emptyWeight = isLiquid ? Math.max(0, fullWeight - maxPints * PINT_LBS) : 0;

    inv.push({
      name: item._scrollSpell ? `Spell Scroll (${item._scrollSpell})` : item.name,
      type: item._type,
      typeCode: (item.type || '').split('|')[0],
      damage: item._dmgStr || '', mastery: (item.mastery || []).map(m => m.split('|')[0]).join(', '),
      properties: item._propStr || '', weight: fullWeight,
      value: item._valueStr || '', ac: item.ac || 0,
      rarity: item.rarity || 'none', category: item._category, qty: 1,
      reqAttune: item._reqAttune || false, attuned: false,
      description: typeof entriesToHtml === 'function' ? entriesToHtml(item.entries) : '',
      isContainer, containerOpen: true, containerId: null,
      itemId: Date.now().toString(36) + Math.random().toString(36).slice(2),
      ...(item._scrollSpell && { scrollSpell: item._scrollSpell }),
      ...(isContainer && { containerKey, containerCapacity: item.containerCapacity || null, capacityStr: item.capacity || null }),
      ...(isLiquid && { pints: maxPints, emptyWeight, liquidKey: Date.now().toString(36) + Math.random().toString(36).slice(2) }),
    });
    this.sv('inventory', inv);
    this.renderInventory();

    // Auto-detect magic item charges and offer to track as a resource
    if (item._isMagic || (item.rarity && item.rarity !== 'none')) {
      if (typeof ClassResources !== 'undefined') {
        const charges = ClassResources.detectItemCharges(item);
        if (charges) {
          const resources = this.lv('resources', []);
          const resName = `${item.name} Charges`;
          if (!resources.some(r => r.name === resName)) {
            if (confirm(`"${item.name}" has ${charges.max} charges (recharges ${charges.refresh === 'dawn' ? 'at dawn' : 'on ' + charges.refresh.toUpperCase()}). Track as a resource?`)) {
              resources.push({
                name: resName,
                max: charges.max,
                used: 0,
                refresh: charges.refresh,
                ...(charges.rechargeRoll && { rechargeRoll: charges.rechargeRoll }),
              });
              this.sv('resources', resources);
              this.renderResources();
            }
          }
        }
      }
    }
  },

  removeFromInventory(itemId) {
    const inv = this.lv('inventory', []).filter(i => i.itemId !== itemId);
    this.sv('inventory', inv);
    this.renderInventory();
  },

  removeContainerFromInventory(containerKey) {
    const inv = this.lv('inventory', []);
    const contained = inv.filter(i => i.containerId === containerKey);

    if (contained.length > 0) {
      // Show confirmation popup
      this._showBagDeletePopup(containerKey, contained.length);
      return;
    }

    const newInv = inv.filter(i => i.containerKey !== containerKey);
    this.sv('inventory', newInv);
    this.renderInventory();
  },

  _showBagDeletePopup(containerKey, itemCount) {
    const existing = document.getElementById('bag-delete-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'bag-delete-popup';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--white);border-radius:var(--radius);padding:20px 24px;max-width:320px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.25);font-family:var(--font-body);';
    modal.innerHTML = `
      <div style="font-weight:700;font-size:1rem;color:var(--ink);margin-bottom:8px;">Delete bag?</div>
      <div style="font-size:0.85rem;color:var(--ink-light);margin-bottom:18px;">This bag contains <strong>${itemCount} item${itemCount !== 1 ? 's' : ''}</strong>. What would you like to do?</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="bag-del-all" style="background:#c0392b;color:#fff;border:none;border-radius:var(--radius);padding:8px 14px;cursor:pointer;font-size:0.85rem;font-family:var(--font-body);font-weight:600;">Delete bag and all items</button>
        <button id="bag-del-only" style="background:var(--parchment-dk);color:var(--ink);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;cursor:pointer;font-size:0.85rem;font-family:var(--font-body);">Delete bag only — move items to inventory</button>
        <button id="bag-del-cancel" style="background:none;color:var(--ink-faint);border:none;border-radius:var(--radius);padding:6px 14px;cursor:pointer;font-size:0.82rem;font-family:var(--font-body);">Cancel</button>
      </div>`;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('bag-del-cancel').addEventListener('click', () => overlay.remove());

    document.getElementById('bag-del-all').addEventListener('click', () => {
      const inv = this.lv('inventory', []).filter(i => i.containerKey !== containerKey && i.containerId !== containerKey);
      this.sv('inventory', inv);
      this.renderInventory();
      overlay.remove();
    });

    document.getElementById('bag-del-only').addEventListener('click', () => {
      const inv = this.lv('inventory', [])
        .filter(i => i.containerKey !== containerKey)
        .map(i => i.containerId === containerKey ? { ...i, containerId: null } : i);
      this.sv('inventory', inv);
      this.renderInventory();
      overlay.remove();
    });
  },

  _saveInvQty(itemId, qty) {
    const inv = this.lv('inventory', []);
    const it = inv.find(i => i.itemId === itemId);
    if (!it) return;
    // If inside a container, validate capacity before saving
    if (it.containerId) {
      const container = inv.find(i => i.containerKey === it.containerId);
      if (container) {
        const maxWeight = this._containerMaxWeight(container);
        if (maxWeight != null) {
          const otherWeight = inv
            .filter(i => i.containerId === container.containerKey && i.itemId !== itemId)
            .reduce((sum, i) => sum + (i.weight || 0) * (i.qty || 1), 0);
          if (otherWeight + (it.weight || 0) * qty > maxWeight) {
            const maxQty = Math.max(1, Math.floor((maxWeight - otherWeight) / (it.weight || 1)));
            this._showInvWarning(`${container.name} can only fit ${maxQty}× ${it.name} (${maxWeight} lb. limit).`);
            it.qty = maxQty;
            this.sv('inventory', inv);
            this.renderInventory();
            return;
          }
        }
        const maxCount = this._containerMaxItemCount(container, it.name);
        if (maxCount != null && qty > maxCount) {
          this._showInvWarning(`${container.name} can only hold ${maxCount} ${this._containerAcceptedLabel(container)}.`);
          it.qty = maxCount;
          this.sv('inventory', inv);
          this.renderInventory();
          return;
        }
      }
    }
    it.qty = qty;
    this.sv('inventory', inv);
    this.renderCarryCapacity();
    this.refreshAttackList();
  },

  _showSplitPopup(item) {
    const existing = document.getElementById('inv-split-popup');
    if (existing) existing.remove();

    const total = item.qty;
    const half  = Math.floor(total / 2);

    const overlay = document.createElement('div');
    overlay.id = 'inv-split-popup';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:16px;';

    overlay.innerHTML = `
      <div style="background:var(--parchment);border:2px solid var(--border);border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,0.35);width:100%;max-width:340px;font-family:var(--font-body);">
        <div style="padding:14px 18px 10px;border-bottom:1px solid var(--border);background:var(--parchment-dk,var(--parchment));border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-family:var(--font-title);font-size:1rem;font-weight:700;color:var(--ink);">Split ${item.name}</span>
          <button id="inv-split-close" style="background:none;border:none;cursor:pointer;font-size:1rem;color:var(--ink-light);padding:2px 6px;border-radius:3px;">✕</button>
        </div>
        <div style="padding:18px 20px 14px;display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;font-size:1.1rem;font-weight:700;color:var(--ink);">
            <span id="inv-split-a" style="min-width:32px;text-align:right;">${half}</span>
            <span style="color:var(--ink-faint);font-size:0.9rem;">⇄</span>
            <span id="inv-split-b" style="min-width:32px;text-align:left;">${total - half}</span>
          </div>
          <input id="inv-split-slider" type="range" min="1" max="${total - 1}" value="${half}"
            style="width:100%;accent-color:var(--gold-dark);cursor:pointer;">
          ${item.weight ? `<div id="inv-split-weight" style="text-align:center;font-size:0.72rem;color:var(--ink-faint);">${(item.weight * half).toFixed(2).replace(/\.?0+$/,'')} lb. &nbsp;⇄&nbsp; ${(item.weight * (total - half)).toFixed(2).replace(/\.?0+$/,'')} lb.</div>` : ''}
        </div>
        <div style="padding:10px 18px 14px;border-top:1px solid var(--border);background:var(--parchment-dk,var(--parchment));border-radius:0 0 6px 6px;display:flex;gap:8px;justify-content:flex-end;">
          <button id="inv-split-cancel" style="background:var(--parchment-dk);border:1px solid var(--border);border-radius:var(--radius);padding:6px 14px;cursor:pointer;font-size:0.82rem;font-family:var(--font-body);color:var(--ink);">Cancel</button>
          <button id="inv-split-confirm" style="background:var(--gold-dark,#7a5c1e);color:#fff;border:none;border-radius:var(--radius);padding:6px 16px;cursor:pointer;font-size:0.85rem;font-family:var(--font-body);font-weight:600;">Split</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const slider  = overlay.querySelector('#inv-split-slider');
    const aEl     = overlay.querySelector('#inv-split-a');
    const bEl     = overlay.querySelector('#inv-split-b');
    const wEl     = overlay.querySelector('#inv-split-weight');

    slider.addEventListener('input', () => {
      const a = parseInt(slider.value);
      const b = total - a;
      aEl.textContent = a;
      bEl.textContent = b;
      if (wEl && item.weight) {
        const fmt = n => parseFloat(n.toFixed(2)).toString();
        wEl.innerHTML = `${fmt(item.weight * a)} lb. &nbsp;⇄&nbsp; ${fmt(item.weight * b)} lb.`;
      }
    });

    const close = () => overlay.remove();
    overlay.querySelector('#inv-split-close').addEventListener('click', close);
    overlay.querySelector('#inv-split-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('#inv-split-confirm').addEventListener('click', () => {
      this._splitInvItem(item, parseInt(slider.value));
      close();
    });
  },

  _splitInvItem(item, splitQty) {
    const inv = this.lv('inventory', []);
    const it  = inv.find(i => i.itemId === item.itemId);
    if (!it || splitQty < 1 || splitQty >= it.qty) return;
    it.qty -= splitQty;
    inv.push({ ...it, qty: splitQty, itemId: Date.now().toString(36) + Math.random().toString(36).slice(2) });
    this.sv('inventory', inv);
    this.renderInventory();
  },

  _mergeInvItem(item) {
    const inv = this.lv('inventory', []);
    const loc = item.containerId ?? null;
    const dupes = inv.filter(i => i.name === item.name && (i.containerId ?? null) === loc && i.itemId !== item.itemId && !i.isContainer);
    if (!dupes.length) { this._showInvWarning(`No other ${item.name} stacks to merge.`); return; }
    const target = inv.find(i => i.itemId === item.itemId);
    target.qty += dupes.reduce((sum, i) => sum + (i.qty || 1), 0);
    const dupeIds = new Set(dupes.map(i => i.itemId));
    this.sv('inventory', inv.filter(i => !dupeIds.has(i.itemId)));
    this.renderInventory();
  },

  // Returns true if the container accepts the named item.
  // Item-type restrictions are only enforced for ammo-specific containers (no weight capacity).
  // General containers (backpack, pouch, chest, etc.) with a weight limit accept anything.
  _containerAcceptsItem(container, itemName) {
    const restrictions = container.containerCapacity?.item;
    if (!restrictions) return true;
    // If the container also has a weight capacity, treat it as general-purpose — accept anything.
    if (container.containerCapacity?.weight?.[0] != null) return true;
    const accepted = restrictions
      .filter(r => typeof r === 'object' && r !== null)
      .flatMap(r => Object.keys(r))
      .map(t => t.split('|')[0].toLowerCase());
    if (!accepted.length) return true;
    const lower = itemName.toLowerCase().replace(/\s*\(\d+\)\s*$/, '').trim();
    return accepted.some(t => lower === t || lower === t + 's' || lower + 's' === t || lower.startsWith(t) || t.startsWith(lower));
  },

  _moveToContainer(itemId, containerKey) {
    const inv = this.lv('inventory', []);
    const item = inv.find(i => i.itemId === itemId) || inv.find(i => i.name === itemId);
    if (!item) { this.renderInventory(); return; }
    if (containerKey) {
      const container = inv.find(i => i.containerKey === containerKey || i.name === containerKey);
      if (container) {
        if (!this._containerAcceptsItem(container, item.name)) {
          this._showInvWarning(`${container.name} can only hold ${this._containerAcceptedLabel(container)}.`);
          return;
        }
        const maxWeight = this._containerMaxWeight(container);
        if (maxWeight != null) {
          const currentWeight = inv
            .filter(i => i.containerId === container.containerKey)
            .reduce((sum, i) => sum + (i.weight || 0) * (i.qty || 1), 0);
          const itemWeight = (item.weight || 0) * (item.qty || 1);
          if (currentWeight + itemWeight > maxWeight) {
            const cur = Number.isInteger(currentWeight) ? currentWeight : currentWeight.toFixed(1);
            this._showInvWarning(`${container.name} is full (${cur} lb./${maxWeight} lb.). Remove items first.`);
            return;
          }
        }
        const maxCount = this._containerMaxItemCount(container, item.name);
        if (maxCount != null) {
          const currentCount = inv
            .filter(i => i.containerId === container.containerKey && this._containerAcceptsItem(container, i.name))
            .reduce((sum, i) => sum + (i.qty || 1), 0);
          if (currentCount + (item.qty || 1) > maxCount) {
            this._showInvWarning(`${container.name} can only hold ${maxCount} ${this._containerAcceptedLabel(container)}.`);
            return;
          }
        }
      }
    }
    item.containerId = containerKey || null;
    this.sv('inventory', inv);
    this.renderInventory();
  },

  _containerAcceptedLabel(container) {
    const restrictions = container.containerCapacity?.item;
    if (!restrictions) return 'items';
    const accepted = restrictions.filter(r => typeof r === 'object' && r !== null).flatMap(r => Object.keys(r));
    if (!accepted.length) return 'items';
    return accepted.map(key => {
      const [name, src] = key.split('|');
      const pretty = name.replace(/\b\w/g, c => c.toUpperCase()) + 's';
      return src ? `${pretty} [${src.toUpperCase()}]` : pretty;
    }).join(', ');
  },

  _showInvWarning(msg) {
    const existing = document.getElementById('inv-drop-warning');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'inv-drop-warning';
    el.className = 'inv-warning-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3000);
  },

  _makeInvCard(item, draggable = false) {
    let detail = '';
    if (item.damage) detail += item.damage;
    if (item.mastery) detail += (detail ? ' | ' : '') + item.mastery;
    if (item.properties) detail += (detail ? ' | ' : '') + item.properties;
    if (item.ac) detail += (detail ? ' | ' : '') + `AC ${item.ac}`;
    if (item.weight) detail += (detail ? ' | ' : '') + `${item.weight} lb.`;
    if (item.value) detail += (detail ? ' | ' : '') + item.value;
    if (item.rarity && item.rarity !== 'none') detail += (detail ? ' | ' : '') + item.rarity;

    const isLiquid = this._isLiquidContainer(item.name);
    const totalWeight = item.weight ? item.weight * (item.qty || 1) : 0;
    const totalWStr = (!isLiquid && totalWeight) ? `${Number.isInteger(totalWeight) ? totalWeight : totalWeight.toFixed(2)} lb.` : '';

    const card = document.createElement('div');
    card.className = 'inv-card';
    if (draggable) { card.draggable = true; card.dataset.item = item.name; }

    if (isLiquid) {
      // Liquid containers: no qty controls, only pint tracker
      card.innerHTML = `
        <button class="inv-del-btn" title="Remove">✕</button>
        <div class="inv-card-info">
          <div class="inv-card-name">${item.name}</div>
          ${detail ? `<div class="inv-card-detail">${detail}</div>` : ''}
        </div>
        <div class="inv-card-qty">
          <div class="inv-pints-row"></div>
        </div>`;

      const maxPints   = this._LIQUID_CONTAINERS[item.name.toLowerCase().trim()];
      const curPints   = item.pints ?? maxPints;
      const PINT_LBS   = 1;
      const emptyWeight = item.emptyWeight ?? Math.max(0, (item.weight || 0) - maxPints * PINT_LBS);

      const pintsRow = card.querySelector('.inv-pints-row');
      pintsRow.innerHTML = `
        <button class="qty-btn inv-pints-minus" tabindex="-1">−</button>
        <span class="inv-pints-val${curPints === 0 ? ' inv-pints-empty' : ''}">
          <span class="inv-pints-cur">${curPints}</span><span class="inv-pints-max">/${maxPints} pt</span>
        </span>
        <button class="qty-btn inv-pints-plus" tabindex="-1">+</button>`;

      const valEl = pintsRow.querySelector('.inv-pints-val');
      const curEl = pintsRow.querySelector('.inv-pints-cur');

      const savePints = (v) => {
        v = Math.max(0, Math.min(maxPints, v));
        curEl.textContent = v;
        valEl.classList.toggle('inv-pints-empty', v === 0);
        const newWeight = emptyWeight + v * PINT_LBS;
        const inv2 = this.lv('inventory', []);
        const it2  = item.liquidKey
          ? inv2.find(i => i.liquidKey === item.liquidKey)
          : inv2.find(i => i.name === item.name);
        if (it2) { it2.pints = v; it2.weight = newWeight; this.sv('inventory', inv2); }
        const detailEl = card.querySelector('.inv-card-detail');
        if (detailEl) detailEl.textContent = detailEl.textContent.replace(/[\d.]+\s*lb\./, `${newWeight} lb.`);
        this.renderInventory();
      };

      pintsRow.querySelector('.inv-pints-minus').addEventListener('click', () => savePints(parseInt(curEl.textContent || 0) - 1));
      pintsRow.querySelector('.inv-pints-plus').addEventListener('click',  () => savePints(parseInt(curEl.textContent || 0) + 1));

      // Delete by liquidKey so each waterskin is independent
      card.querySelector('.inv-del-btn').addEventListener('click', () => {
        if (item.liquidKey) {
          const inv2 = this.lv('inventory', []).filter(i => i.liquidKey !== item.liquidKey);
          this.sv('inventory', inv2); this.renderInventory();
        } else {
          this.removeFromInventory(item.itemId);
        }
      });
    } else {
      // Normal items: qty controls
      card.innerHTML = `
        <button class="inv-del-btn" title="Remove">✕</button>
        <button class="inv-merge-btn" title="Merge stacks">⊕</button>
        ${item.qty > 1 ? '<button class="inv-split-btn" title="Split stack">⇄</button>' : ''}
        <div class="inv-card-info">
          <div class="inv-card-name">${item.name}</div>
          ${detail ? `<div class="inv-card-detail">${detail}</div>` : ''}
        </div>
        <div class="inv-card-qty">
          <div class="qty-wrap">
            <div class="qty-controls">
              <button class="qty-btn qty-minus" tabindex="-1">−</button>
              <input type="number" value="${item.qty}" min="1" max="999" data-item="${item.name}">
              <button class="qty-btn qty-plus" tabindex="-1">+</button>
            </div>
            ${totalWStr ? `<div class="inv-card-total-weight">${totalWStr}</div>` : ''}
          </div>
        </div>`;

      const input = card.querySelector('input');
      const applyQty = (qty) => {
        qty = Math.min(999, Math.max(1, qty));
        input.value = qty;
        const tw = card.querySelector('.inv-card-total-weight');
        if (tw && item.weight) { const t = item.weight * qty; tw.textContent = `${Number.isInteger(t) ? t : t.toFixed(2)} lb.`; }
        this._saveInvQty(item.itemId, qty);
      };
      input.addEventListener('change', e => applyQty(parseInt(e.target.value) || 1));
      card.querySelector('.qty-minus').addEventListener('click', () => applyQty((parseInt(input.value) || 1) - 1));
      card.querySelector('.qty-plus').addEventListener('click',  () => applyQty((parseInt(input.value) || 1) + 1));
      card.querySelector('.inv-del-btn').addEventListener('click', () => this.removeFromInventory(item.itemId));
      card.querySelector('.inv-split-btn')?.addEventListener('click', e => { e.stopPropagation(); this._showSplitPopup(item); });
      card.querySelector('.inv-merge-btn').addEventListener('click', e => { e.stopPropagation(); this._mergeInvItem(item); });
    }

    // Set flag on qty mousedown so the re-render triggered by the click doesn't
    // immediately show the tooltip on the freshly built card's mouseenter.
    // The flag is cleared lazily on the next mousemove over the card body,
    // which also re-shows the tooltip so it comes back as soon as the cursor moves.
    card.querySelector('.qty-controls')?.addEventListener('mousedown', () => { this._invQtyActive = true; });

    const _qtySelectors = '.qty-btn, .qty-controls input, .inv-split-btn, .inv-merge-btn';
    const _showTooltip = (e) => {
      const found = this._findDndItem(item.name);
      const descHtml = (found?.entries && typeof entriesToHtml === 'function')
        ? entriesToHtml(found.entries)
        : (item.description || '');
      if (!descHtml && !found) return;
      const src  = found ? (found._src || '') : '';
      const page = found?.page ? ` p${found.page}` : '';
      const type = item.type || (found ? found._type || '' : '');
      const meta = [src + page, type].filter(Boolean).join(' · ');
      this._showInvTooltip(item.name, meta, descHtml, e);
    };

    // Tooltip: show item description on hover (suppress over qty controls)
    card.addEventListener('mouseenter', e => {
      if (this._invQtyActive || e.target.closest(_qtySelectors)) return;
      _showTooltip(e);
    });
    card.addEventListener('mousemove', e => {
      if (e.target.closest(_qtySelectors)) { this._hideInvTooltip(); return; }
      if (this._invQtyActive) this._invQtyActive = false;
      const tip = document.getElementById('inv-tooltip');
      if (!tip || tip.style.display === 'none') { _showTooltip(e); return; }
      this._positionInvTooltip(e);
    });
    card.addEventListener('mouseleave', () => this._hideInvTooltip());

    return card;
  },

  _findDndItem(name) {
    const items = DndData?.allItems || [];
    const low = name.toLowerCase().trim();
    // 1. Exact match
    let found = items.find(i => i.name.toLowerCase() === low);
    if (found) return found;
    // 2. Plural → singular: "Arrows" → "Arrow"
    if (low.endsWith('s')) {
      found = items.find(i => i.name.toLowerCase() === low.slice(0, -1));
      if (found) return found;
    }
    // 3. Singular → plural: "Arrow" → "Arrows"
    found = items.find(i => i.name.toLowerCase() === low + 's');
    if (found) return found;
    // 4. "10 feet of Name" → "Name (10 feet)" or "Name"
    const feetMatch = low.match(/^(\d+)\s+feet?\s+of\s+(.+)$/);
    if (feetMatch) {
      const [, qty, base] = feetMatch;
      found = items.find(i => i.name.toLowerCase() === `${base} (${qty} feet)`) ||
              items.find(i => i.name.toLowerCase() === `${base} (${qty} ft.)`) ||
              items.find(i => i.name.toLowerCase() === base);
      if (found) return found;
    }
    // 5. Partial: item name starts with stored name or vice versa
    found = items.find(i => i.name.toLowerCase().startsWith(low) || low.startsWith(i.name.toLowerCase()));
    return found || null;
  },

  _showInvTooltip(name, meta, descHtml, e) {
    let tip = document.getElementById('inv-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'inv-tooltip';
      tip.className = 'inv-tooltip';
      document.body.appendChild(tip);
    }
    tip.innerHTML = `
      <div class="inv-tooltip-name">${name}</div>
      ${meta ? `<div class="inv-tooltip-meta">${meta}</div>` : ''}
      ${descHtml ? `<div class="inv-tooltip-body">${descHtml}</div>` : ''}`;
    tip.style.display = 'block';
    this._positionInvTooltip(e);
  },

  _positionInvTooltip(e) {
    const tip = document.getElementById('inv-tooltip');
    if (!tip) return;
    const pad = 12;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + tw > window.innerWidth  - pad) x = e.clientX - tw - pad;
    if (y + th > window.innerHeight - pad) y = e.clientY - th - pad;
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
  },

  _hideInvTooltip() {
    const tip = document.getElementById('inv-tooltip');
    if (tip) tip.style.display = 'none';
  },

  restoreInventory() { this.renderInventory(); },

  renderInventory() {
    // Migrate old saved items: retroactively mark known containers
    const inv = this.lv('inventory', []);
    const allItems = (typeof DndData !== 'undefined' ? DndData.allItems : null) || [];
    let migrated = false;
    // Backfill itemId for items added before this field existed
    inv.forEach(item => { if (!item.itemId) { item.itemId = Date.now().toString(36) + Math.random().toString(36).slice(2); migrated = true; } });
    inv.forEach(item => {
      if (!item.isContainer && !item.containerId) {
        const found = allItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        const hasVolumeOnly = found?.containerCapacity && !found.containerCapacity.weight && !found.containerCapacity.item && found.containerCapacity.volume;
        if (!hasVolumeOnly && (found?.containerCapacity || found?.capacity || this._CONTAINER_NAMES.test(item.name || ''))) {
          item.isContainer = true;
          item.containerOpen = item.containerOpen ?? true;
          item.containerKey = item.containerKey || (Date.now().toString(36) + Math.random().toString(36).slice(2));
          if (found?.containerCapacity) item.containerCapacity = found.containerCapacity;
          if (found?.capacity && !item.capacityStr) item.capacityStr = found.capacity;
          item.category = 'gear'; // normalize containers to gear regardless of rarity classification
          migrated = true;
        }
      }
    });
    // Heal liquid container state — use DndData as ground truth when available,
    // and enforce the invariant: weight = emptyWeight + pints * PINT_LBS
    const PINT_LBS = 1;
    inv.forEach(item => {
      if (!this._isLiquidContainer(item.name)) return;
      const maxPints = this._LIQUID_CONTAINERS[item.name.toLowerCase().trim()];
      item.pints = item.pints ?? maxPints;
      const found = allItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
      if (found?.weight != null) {
        // Data is available — recompute emptyWeight from the known full weight
        const correctEmpty = Math.max(0, found.weight - maxPints * PINT_LBS);
        if (item.emptyWeight !== correctEmpty) { item.emptyWeight = correctEmpty; migrated = true; }
      } else if (item.emptyWeight == null) {
        // No data — fall back to inferring from current stored weight
        item.emptyWeight = Math.max(0, (item.weight || 0) - item.pints * PINT_LBS);
        migrated = true;
      }
      // Enforce: weight must always equal emptyWeight + pints (single source of truth)
      const expected = (item.emptyWeight || 0) + item.pints * PINT_LBS;
      if (item.weight !== expected) { item.weight = expected; migrated = true; }
    });
    if (migrated) this.sv('inventory', inv);

    const weaponEl = this.$('inv-weapons');
    const armorEl  = this.$('inv-armor');
    const gearEl   = this.$('inv-gear');
    if (weaponEl) weaponEl.innerHTML = '';
    if (armorEl)  armorEl.innerHTML = '';
    if (gearEl)   gearEl.innerHTML = '';

    // Weapons & armor — simple column list
    inv.filter(i => i.category === 'weapon').forEach(item => weaponEl?.appendChild(this._makeInvCard(item)));
    inv.filter(i => i.category === 'armor').forEach(item => armorEl?.appendChild(this._makeInvCard(item)));
    // Unknown categories fall to gear (but skip containers — they render as folders below)
    inv.filter(i => !['weapon','armor','gear'].includes(i.category) && !i.isContainer).forEach(item => gearEl?.appendChild(this._makeInvCard(item)));

    if (!gearEl) { this.refreshAttackList(); this.renderMagicItems(); return; }

    // Make the whole gear section an eject zone — dropping anywhere outside a bag moves the item to loose inventory
    gearEl.addEventListener('dragover', e => { e.preventDefault(); });
    gearEl.addEventListener('drop', e => {
      // Only act if not dropped on a container (containers stop propagation)
      const id = e.dataTransfer.getData('text/plain');
      if (id) this._moveToContainer(id, null);
    });

    const containers = inv.filter(i => i.isContainer);
    const loose = inv.filter(i => i.category === 'gear' && !i.isContainer && !i.containerId);

    // ---- Containers ----
    containers.forEach(container => {
      const cKey = container.containerKey || container.name; // fallback for legacy saved data
      const contained = inv.filter(i => i.containerId === cKey);
      const isOpen = container.containerOpen !== false;

      // Weight display
      const currentWeight = contained.reduce((sum, i) => sum + (i.weight || 0) * (i.qty || 1), 0);
      const maxWeight = this._containerMaxWeight(container);
      const weightStr = maxWeight != null
        ? `${Number.isInteger(currentWeight) ? currentWeight : currentWeight.toFixed(1)} lb./${maxWeight} lb.`
        : null;

      const el = document.createElement('div');
      el.className = 'inv-container';

      el.innerHTML = `
        <div class="inv-container-header">
          <span class="inv-container-toggle${isOpen ? ' open' : ''}">▶</span>
          <span class="inv-container-name">${container.name}</span>
          <span class="inv-container-count">${contained.length} item${contained.length !== 1 ? 's' : ''}${weightStr ? ` · ${weightStr}` : ''}</span>
          <button class="inv-container-del del-btn" title="Remove">✕</button>
        </div>
        <div class="inv-container-items${isOpen ? '' : ' hidden'}"></div>`;

      el.querySelector('.inv-container-del').addEventListener('click', () => this.removeContainerFromInventory(cKey));

      const header = el.querySelector('.inv-container-header');
      const itemsEl = el.querySelector('.inv-container-items');
      const toggle  = el.querySelector('.inv-container-toggle');

      // Toggle collapse
      header.addEventListener('click', e => {
        if (e.target.closest('input, button')) return;
        const isNowHidden = itemsEl.classList.toggle('hidden');
        toggle.classList.toggle('open', !isNowHidden);
        const inv2 = this.lv('inventory', []);
        const c = inv2.find(i => i.containerKey === cKey || i.name === container.name);
        if (c) { c.containerOpen = !isNowHidden; this.sv('inventory', inv2); }
      });

      // Drag-drop: the entire container element accepts drops
      const setDragOver = (on) => el.classList.toggle('drag-over-container', on);
      el.addEventListener('dragover',  e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); });
      el.addEventListener('dragleave', e => { if (!el.contains(e.relatedTarget)) setDragOver(false); });
      el.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation(); setDragOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id && id !== container.itemId && id !== container.name) this._moveToContainer(id, cKey);
      });

      // Render contained items
      contained.forEach(item => {
        const card = this._makeInvCard(item, true);
        card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', item.itemId || item.name); card.classList.add('dragging'); this._hideInvTooltip(); });
        card.addEventListener('dragend',   () => card.classList.remove('dragging'));
        itemsEl.appendChild(card);
      });

      // Empty state hint
      if (!contained.length) {
        const hint = document.createElement('div');
        hint.className = 'inv-container-drop-zone';
        hint.textContent = 'Drag gear items here to store inside';
        itemsEl.appendChild(hint);
      }

      gearEl.appendChild(el);
    });

    // ---- Loose gear: 2-column grid ----
    // Always create the grid when containers exist so items can be dragged out of bags
    if (loose.length || containers.length) {
      const grid = document.createElement('div');
      grid.className = 'inv-gear-grid';

      grid.addEventListener('dragover',  e => { e.preventDefault(); e.stopPropagation(); grid.classList.add('drag-over'); });
      grid.addEventListener('dragleave', e => { if (!grid.contains(e.relatedTarget)) grid.classList.remove('drag-over'); });
      grid.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation(); grid.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        if (id) this._moveToContainer(id, null);
      });

      loose.forEach(item => {
        const card = this._makeInvCard(item, true);
        card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', item.itemId || item.name); card.classList.add('dragging'); this._hideInvTooltip(); });
        card.addEventListener('dragend',   () => card.classList.remove('dragging'));
        grid.appendChild(card);
      });

      if (!loose.length) {
        const hint = document.createElement('div');
        hint.className = 'inv-container-drop-zone';
        hint.textContent = 'Drop items here to remove from bag';
        grid.appendChild(hint);
      }
      gearEl.appendChild(grid);
    } else if (!containers.length) {
      // No items at all — show hint
      const hint = document.createElement('div');
      hint.className = 'inv-container-drop-zone';
      hint.style.margin = '4px 0';
      hint.textContent = 'No gear yet. Search items above to add.';
      gearEl.appendChild(hint);
    }


    this.refreshAttackList();
    this.renderMagicItems();
    this.renderCarryCapacity();
    this.renderEquippedGear();
  },

  // ---- WEIGHT TRACKING & CARRYING CAPACITY ----
  initWeightTracking() {
    const _syncBtn = (id, key) => {
      const btn = this.$(id);
      if (!btn) return;
      const on = this.lv(key, false);
      btn.classList.toggle('carry-toggle-on', on);
      btn.addEventListener('click', () => {
        const next = !this.lv(key, false);
        this.sv(key, next);
        btn.classList.toggle('carry-toggle-on', next);
        this.renderCarryCapacity();
      });
    };
    _syncBtn('coin-weight-btn', 'coinWeight');
    _syncBtn('carry-rule-btn', 'encumbrance');

    // Update when coins change
    ['cp','sp','ep','gp','pp'].forEach(id => {
      const el = this.$(id);
      if (el) el.addEventListener('input', () => this.renderCarryCapacity());
    });
  },

  _WEIGHTLESS_CONTAINERS: /^(bags? of holding|portable holes?|heward'?s? handy haversacks?)$/i,

  getTotalWeight() {
    const inv = this.lv('inventory', []);
    const weightlessKeys = new Set(
      inv.filter(i => i.isContainer && this._WEIGHTLESS_CONTAINERS.test(i.name || ''))
        .map(i => i.containerKey)
    );
    let w = inv.reduce((sum, i) => {
      if (i.containerId && weightlessKeys.has(i.containerId)) return sum;
      return sum + (i.weight || 0) * (i.qty || 1);
    }, 0);
    if (this.lv('coinWeight', false)) {
      const coins = ['cp','sp','ep','gp','pp'].reduce((s, id) => s + (parseFloat(this.$(id)?.value) || 0), 0);
      w += coins * 0.02; // 50 coins = 1 lb.
    }
    return Math.round(w * 100) / 100;
  },

  renderCarryCapacity() {
    const el = this.$('carry-capacity-display');
    if (!el) return;
    const useEncumbrance = this.lv('encumbrance', false);
    const str = this.getAbilityScore('str');
    const current = this.getTotalWeight();
    const fmt = n => Number.isInteger(n) ? n : n.toFixed(1);
    const max = str * 15;
    const pct = Math.min(100, (current / max) * 100);

    if (!useEncumbrance) {
      const color = pct >= 100 ? 'var(--red)' : pct >= 75 ? '#c87000' : 'var(--green, #3a7a3a)';
      el.innerHTML = `
        <div class="carry-cap-stats">
          <span class="carry-cap-current" style="color:${color}">${fmt(current)} lb.</span>
          <span class="carry-cap-sep">/</span>
          <span class="carry-cap-max">${max} lb.</span>
          <span class="carry-cap-push">Push/Drag/Lift: ${str * 30} lb.</span>
        </div>
        <div class="carry-cap-bar-wrap">
          <div class="carry-cap-bar" style="width:${pct}%;background:${color}"></div>
        </div>`;
    } else {
      // Encumbrance variant (2014 DMG): thresholds at STR×5, STR×10, STR×15
      const enc = str * 5, heavy = str * 10;
      const status = current > heavy ? 'Heavily Encumbered' : current > enc ? 'Encumbered' : 'Unencumbered';
      const color = current > heavy ? 'var(--red)' : current > enc ? '#c87000' : 'var(--green, #3a7a3a)';
      const encPct = (enc / max) * 100, heavyPct = (heavy / max) * 100;
      el.innerHTML = `
        <div class="carry-cap-stats">
          <span class="carry-cap-current" style="color:${color}">${fmt(current)} lb.</span>
          <span class="carry-cap-sep">/</span>
          <span class="carry-cap-max">${max} lb.</span>
          <span class="carry-cap-status" style="color:${color}">${status}</span>
        </div>
        <div class="carry-cap-bar-wrap carry-enc-bar-wrap">
          <div class="carry-cap-bar" style="width:${pct}%;background:${color}"></div>
          <div class="carry-enc-marker" style="left:${encPct}%" title="Encumbered (${enc} lb.)"></div>
          <div class="carry-enc-marker" style="left:${heavyPct}%" title="Heavily Encumbered (${heavy} lb.)"></div>
        </div>
        <div class="carry-enc-labels">
          <span style="left:${encPct}%">Enc. (${enc} lb.)</span>
          <span style="left:${heavyPct}%">Heavy (${heavy} lb.)</span>
        </div>`;
    }
  },

  renderMagicItems() {
    const container = this.$('magic-items-list');
    if (!container) return;
    const inv = this.lv('inventory', []);
    const magic = inv.filter(i => i.category === 'magic' || (i.rarity && i.rarity !== 'none') || i.reqAttune);
    container.innerHTML = '';

    magic.forEach(item => {
      const card = document.createElement('div');
      card.className = 'feat-card' + (item.attuned ? ' magic-attuned' : '');

      // Look up live data for description (works even for items saved before description was stored)
      const liveData = DndData?.allItems?.find(i => i.name.toLowerCase() === item.name.toLowerCase());
      const description = item.description || (liveData ? entriesToHtml(liveData.entries) : '');
      const reqAttune = item.reqAttune !== undefined ? item.reqAttune : (liveData?.reqAttune || false);

      const rarity = item.rarity && item.rarity !== 'none' ? item.rarity : '';
      const attuneTxt = reqAttune
        ? (typeof reqAttune === 'string' ? `Requires attunement (${reqAttune})` : 'Requires attunement')
        : '';
      const stats = [item.type, item.properties, item.value || '', item.weight ? `${item.weight} lb.` : '']
        .filter(Boolean).join(' · ');
      const bodyContent = [
        stats ? `<p class="magic-item-stats">${stats}</p>` : '',
        attuneTxt ? `<p><em>${attuneTxt}</em></p>` : '',
        description,
      ].filter(Boolean).join('');

      card.innerHTML = `
        <div class="feat-card-header">
          <div class="feat-card-meta">
            <span class="feat-card-name">${item.name}</span>
            ${rarity ? `<span class="feat-card-cat">${rarity}</span>` : ''}
          </div>
          <div class="feat-card-actions">
            ${reqAttune ? `<label class="attune-check-label" title="Attunement can only be changed during a Long Rest. Open a Long Rest to attune or un-attune this item."><span class="attune-cb-display${item.attuned ? ' attuned' : ''}" aria-label="${item.attuned ? 'Attuned' : 'Not attuned'}"></span> <span class="attune-cb-text">${item.attuned ? 'Attuned' : 'Attune'}</span></label>` : ''}
            ${bodyContent ? `<button class="feat-card-toggle" title="Show details">▶</button>` : ''}
            <button class="feat-card-del" title="Remove">✕</button>
          </div>
        </div>
        ${bodyContent ? `<div class="feat-card-body" style="display:none"><div class="feat-card-desc">${bodyContent}</div></div>` : ''}`;

      if (bodyContent) {
        const toggle = card.querySelector('.feat-card-toggle');
        const body = card.querySelector('.feat-card-body');
        toggle.addEventListener('click', () => {
          const open = body.style.display !== 'none';
          body.style.display = open ? 'none' : 'block';
          toggle.textContent = open ? '▶' : '▼';
        });
      }

      if (reqAttune) {
        const attuneLbl = card.querySelector('.attune-check-label');
        if (attuneLbl) {
          attuneLbl.style.cursor = 'not-allowed';
          attuneLbl.addEventListener('click', e => {
            e.preventDefault();
            // Show tooltip nudge
            let tip = attuneLbl.querySelector('.attune-tip');
            if (!tip) {
              tip = document.createElement('div');
              tip.className = 'attune-tip';
              tip.textContent = 'Use Long Rest to attune/un-attune items.';
              attuneLbl.appendChild(tip);
              setTimeout(() => tip.remove(), 2800);
            }
          });
        }
      }

      card.querySelector('.feat-card-del').addEventListener('click', () => this.removeFromInventory(item.name));
      container.appendChild(card);
    });
  },

  refreshAttackList() {
    let dl = document.getElementById('attack-list');
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = 'attack-list';
      document.body.appendChild(dl);
    }
    dl.innerHTML = '';

    // Count how many times each weapon name is used in attack rows
    const usedCounts = {};
    this.qsa('#attacks-body .atk-name').forEach(i => {
      const n = i.value.trim().toLowerCase();
      if (n) usedCounts[n] = (usedCounts[n] || 0) + 1;
    });

    const inv = this.lv('inventory', []);
    const seen = new Set();
    inv.filter(i => i.category === 'weapon').forEach(w => {
      const nameLower = w.name.toLowerCase();
      const used = usedCounts[nameLower] || 0;
      const available = (w.qty || 1) - used;
      if (available <= 0) return; // all qty assigned
      if (seen.has(nameLower)) return;
      seen.add(nameLower);
      const opt = document.createElement('option');
      opt.value = w.name;
      dl.appendChild(opt);
    });
    ['Unarmed Strike', 'Improvised Weapon'].forEach(name => {
      const used = usedCounts[name.toLowerCase()] || 0;
      if (used < 1) {
        const opt = document.createElement('option');
        opt.value = name;
        dl.appendChild(opt);
      }
    });
    const delOpt = document.createElement('option');
    delOpt.value = '✕ Delete this entry';
    dl.appendChild(delOpt);
  },

  // ---- LIMITED RESOURCES ----
  initResources() {
    this.$('btn-add-resource')?.addEventListener('click', () => {
      const name = this.$('res-name')?.value.trim();
      const max = Math.max(1, parseInt(this.$('res-max')?.value) || 1);
      const refresh = this.$('res-refresh')?.value || 'lr'; // refresh type still stored for rest-modal logic
      if (!name) return;
      const resources = this.lv('resources', []);
      resources.push({ name, max, used: 0, refresh });
      this.sv('resources', resources);
      this.$('res-name').value = '';
      this.renderResources();
    });
    this.$('res-name')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.$('btn-add-resource')?.click();
    });
    this.renderResources();
  },

  // Look up a feature description by name from class features, race entries, subclass features
  _getResourceTooltip(resourceName) {
    const lowerName = resourceName.toLowerCase().replace(/\s*\(.*\)$/, '').trim();
    const level = this.getLevel();

    // 1. Check curated resource descriptions (level-aware, with scaling info)
    if (ClassResources?.getResourceDescription) {
      const curated = ClassResources.getResourceDescription(resourceName, level);
      if (curated) {
        const cfg = ClassResources?.FEAT_CUSTOM_CHOICES?.[resourceName]
          || (resourceName.toLowerCase().includes('metamagic') ? { type: 'metamagic' } : null);
        if (cfg?.type === 'metamagic') return this._appendMetamagicChoices(curated, resourceName);
        // Sorcery Points tooltip: also append metamagic choices if Sorcerer
        if (resourceName === 'Sorcery Points' && this.lv('charClass', '') === 'Sorcerer') {
          return this._appendMetamagicChoices(curated, resourceName);
        }
        return curated;
      }
    }

    // 2. Check race entries (base + subrace)
    const speciesName = this.lv('charSpecies', '');
    const subraceName = this.lv('charSubrace', '');
    if (speciesName && typeof getSpeciesInfo === 'function') {
      const info = getSpeciesInfo(speciesName);
      if (info) {
        const allEntries = [...(info.traitsRaw || [])];
        if (subraceName) {
          const sr = info.subraces?.find(s => s.name === subraceName);
          if (sr?.entries) allEntries.push(...sr.entries);
        }
        for (const e of allEntries) {
          if (e && typeof e === 'object' && e.name && e.name.toLowerCase() === lowerName) {
            const text = (e.entries || []).map(x => typeof x === 'string' ? stripTags(x) : '').join(' ').trim();
            if (text) return text;
          }
        }
      }
    }

    // 3. Check class features from loaded data
    const className = this.lv('charClass', '');
    const details = DndData?.classDetails?.[className];
    if (details?.features) {
      for (const feat of details.features) {
        if (feat?.name?.toLowerCase() === lowerName) {
          const text = (feat.entries || []).map(x => typeof x === 'string' ? stripTags(x) : '').join(' ').trim();
          if (text) return text;
        }
      }
    }

    // 4. Check subclass features
    const subclassName = this.lv('charSubclass', '');
    if (details?.subclassFeatures) {
      for (const feat of details.subclassFeatures) {
        if (feat?.name?.toLowerCase() === lowerName) {
          const text = (feat.entries || []).map(x => typeof x === 'string' ? stripTags(x) : '').join(' ').trim();
          if (text) return text;
        }
      }
    }

    // 5. Check notes field from resource definitions
    const allDefs = [
      ...(ClassResources?.CLASS_RESOURCES?.[className] || []),
      ...(ClassResources?.SUBCLASS_RESOURCES?.[`${className}:${subclassName}`] || []),
      ...(ClassResources?.SPECIES_RESOURCES?.[subraceName] || ClassResources?.SPECIES_RESOURCES?.[speciesName] || []),
    ];
    for (const def of allDefs) {
      if (def.name === resourceName && def.notes) return def.notes;
    }

    // 6. Look up the feat that owns this resource and return its description
    if (ClassResources?.FEAT_RESOURCES && typeof getFeatInfo === 'function') {
      for (const [featName, defs] of Object.entries(ClassResources.FEAT_RESOURCES)) {
        // exact match OR prefix match (e.g. "Fey-Touched: Silvery Barbs" → feat "Fey-Touched")
        const owned = defs.some(d => d.name === resourceName)
          || resourceName.toLowerCase().startsWith(featName.toLowerCase() + ':');
        if (owned) {
          const info = getFeatInfo(featName);
          if (info?.description) return stripTags(info.description);
        }
      }
    }

    // 7. Fallback: stored resource notes
    const res = this.lv('resources', []).find(r => r.name === resourceName);
    if (res?.notes) return res.notes;

    return null;
  },

  _appendPsionicDisciplines(baseText) {
    const options = ClassResources?.PSIONIC_DISCIPLINE_OPTIONS || [];
    const chosen = this.lv('charPsionicDisciplines', []);
    if (!chosen.length) return baseText;
    const lines = chosen.map(name => {
      const opt = options.find(o => o.name === name);
      return opt ? `<p style="margin:6px 0 0"><span style="color:var(--red);font-weight:600">${opt.name}</span>: ${opt.text}</p>` : `<p style="margin:6px 0 0">${name}</p>`;
    });
    return baseText + '<p style="margin:8px 0 2px;font-weight:600">Chosen disciplines:</p>' + lines.join('');
  },

  _appendMetamagicChoices(baseText, resourceName) {
    const mmOptions = ClassResources?.METAMAGIC_OPTIONS || [];

    // Class Metamagic (Sorcerer charMetamagic)
    const classChosen = this.lv('charMetamagic', []) || [];

    // Feat Metamagic (Metamagic Adept customChoices)
    const feats = this.lv('feats', []);
    const featChosen = [];
    for (const f of feats) {
      const featName = typeof f === 'string' ? f : f?.name;
      const cfg = ClassResources?.FEAT_CUSTOM_CHOICES?.[featName];
      if (cfg?.type === 'metamagic' && f?.customChoices?.length) {
        featChosen.push(...f.customChoices);
      }
    }

    const allChosen = [...new Set([...classChosen, ...featChosen])];
    if (!allChosen.length) return baseText;

    const lines = allChosen.map(name => {
      const opt = mmOptions.find(o => o.name === name);
      return opt
        ? `<p style="margin:6px 0 0"><span style="color:var(--red,#8B2222);font-weight:700">${opt.name}</span> <span style="color:var(--ink-faint)">(${opt.cost} SP)</span><br><span style="font-size:0.9em">${opt.text}</span></p>`
        : `<p style="margin:6px 0 0">${name}</p>`;
    });
    return baseText + '<p style="margin:8px 0 2px;font-weight:700;border-top:1px solid var(--border);padding-top:6px">Chosen Metamagic:</p>' + lines.join('');
  },

  renderResources() {
    const list = this.$('resources-list');
    if (!list) return;
    list.innerHTML = '';
    const resources = this.lv('resources', []);
    const LABELS = { lr: 'LR', sr: 'SR', dawn: 'DN', manual: 'MR' };
    if (!resources.length) {
      list.innerHTML = '<div style="color:var(--ink-faint);font-size:0.75rem;padding:4px 0 2px">No resources yet — add class features, spells, or items with limited uses.</div>';
      return;
    }
    resources.forEach((res, idx) => {
      const row = document.createElement('div');
      row.className = 'resource-row';
      const pipsHtml = Array.from({ length: Math.min(res.max, 20) }, (_, i) =>
        `<span class="resource-pip${i < res.used ? ' used' : ''}" data-pip="${i}"></span>`
      ).join('');
      const manualRefreshBtn = res.refresh === 'manual'
        ? `<button class="resource-reset resource-manual-refresh" title="Manually refresh this resource">↺</button>`
        : '';
      row.innerHTML = `
        <span class="resource-name">${res.name}</span>
        <div class="resource-pips">${pipsHtml}</div>
        <span class="resource-count">${res.used}/${res.max}</span>
        <span class="resource-refresh-badge ${res.refresh}" title="Refreshes on: ${res.refresh === 'lr' ? 'Long Rest' : res.refresh === 'sr' ? 'Short Rest' : res.refresh === 'dawn' ? 'Dawn' : 'Manual Refresh'}">${LABELS[res.refresh] || res.refresh}</span>
        ${manualRefreshBtn}
        <button class="resource-del" title="Remove">✕</button>`;
      row.querySelectorAll('.resource-pip').forEach((pip, i) => {
        pip.addEventListener('click', () => {
          const r = this.lv('resources', []);
          // Click used pip → reduce to that point; click unused pip → use up to there
          r[idx].used = (r[idx].used > i) ? i : i + 1;
          this.sv('resources', r);
          this.renderResources();
        });
      });
      const manualBtn = row.querySelector('.resource-manual-refresh');
      if (manualBtn) {
        manualBtn.addEventListener('click', () => {
          const r = this.lv('resources', []);
          r[idx].used = 0;
          this.sv('resources', r);
          this.renderResources();
        });
      }
      row.querySelector('.resource-del').addEventListener('click', () => {
        const r = this.lv('resources', []).filter((_, i) => i !== idx);
        this.sv('resources', r);
        this.renderResources();
      });
      // Tooltip on hover over resource name
      const nameEl = row.querySelector('.resource-name');
      if (nameEl) {
        nameEl.style.cursor = 'help';
        nameEl.addEventListener('mouseenter', (e) => {
          const desc = this._getResourceTooltip(res.name);
          if (!desc) return;
          let tip = document.getElementById('resource-tooltip');
          if (!tip) {
            tip = document.createElement('div');
            tip.id = 'resource-tooltip';
            tip.style.cssText = 'position:fixed;z-index:9999;max-width:min(400px,85vw);background:var(--parchment,#FDF1DC);border:1px solid var(--border,#C4A87A);border-radius:8px;padding:10px 14px;font-size:0.8rem;color:var(--ink-light,#3D2B18);line-height:1.5;box-shadow:0 6px 20px rgba(0,0,0,0.35);pointer-events:none';
            document.body.appendChild(tip);
          }
          const _descHtml = desc.includes('<') ? desc : desc.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
          tip.innerHTML = `<div style="font-weight:700;margin-bottom:4px;border-bottom:1px solid var(--border,#C4A87A);padding-bottom:3px">${res.name}</div><div>${this._highlightKeywords(_descHtml)}</div>`;
          tip.style.display = 'block';
          const x = e.clientX + 12, y = e.clientY + 12;
          tip.style.left = x + 'px';
          tip.style.top = y + 'px';
          requestAnimationFrame(() => {
            const tr = tip.getBoundingClientRect();
            if (x + tr.width > window.innerWidth - 8) tip.style.left = (e.clientX - tr.width - 8) + 'px';
            if (y + tr.height > window.innerHeight - 8) tip.style.top = (e.clientY - tr.height - 8) + 'px';
          });
        });
        nameEl.addEventListener('mousemove', (e) => {
          const tip = document.getElementById('resource-tooltip');
          if (tip) { tip.style.left = (e.clientX + 12) + 'px'; tip.style.top = (e.clientY + 12) + 'px'; }
        });
        nameEl.addEventListener('mouseleave', () => {
          const tip = document.getElementById('resource-tooltip');
          if (tip) tip.style.display = 'none';
        });
      }

      list.appendChild(row);
    });
  },

  // Called by rest buttons to refresh resources
  resetResourcesByType(types) {
    const r = this.lv('resources', []);
    r.forEach(res => { if (types.includes(res.refresh)) res.used = 0; });
    this.sv('resources', r);
    this.renderResources();
  },

  // ---- GENERIC NUMBER SPINNERS ----
  initNumberSpinners() {
    this.qsa('.spin-btn').forEach(btn => {
      const input = btn.closest('.spin-wrap, .currency-coin, .hp-sub-field')
                      ?.querySelector('input[type=number]');
      if (!input) return;
      btn.addEventListener('click', () => {
        const delta = btn.classList.contains('spin-minus') ? -1 : 1;
        const min = input.min !== '' ? parseInt(input.min) : -Infinity;
        const max = input.max !== '' ? parseInt(input.max) : Infinity;
        const next = Math.min(max, Math.max(min, (parseInt(input.value) || 0) + delta));
        input.value = next;
        input.dispatchEvent(new Event('change'));
        input.dispatchEvent(new Event('input'));
      });
    });
  },

  // Highlight D&D keywords and dice in tooltip text
  _highlightKeywords(raw) {
    let out = raw.replace(/\b(\d*d\d+(?:\s*[+\-]\s*\d+)?)\b/g, '<span class="cf-tip-dice">$1</span>');
    const keywords = [
      'Advantage', 'Disadvantage', 'Proficiency Bonus',
      'Saving Throw', 'Saving Throws', 'Attack Roll', 'Attack Rolls',
      'Ability Check', 'Ability Checks', 'D20 Test',
      'Short Rest', 'Long Rest',
      'Hit Points', 'Hit Point', 'Hit Point Die', 'Hit Point Dice',
      'Bonus Action', 'Reaction', 'Action',
      'Temporary Hit Points',
      'Resistance', 'Immunity', 'Vulnerable',
      'Bludgeoning', 'Piercing', 'Slashing', 'Fire', 'Cold', 'Lightning',
      'Thunder', 'Acid', 'Poison', 'Necrotic', 'Radiant', 'Force', 'Psychic',
      'Bloodied', 'Construct', 'Undead',
      'Concentration', 'Cantrip',
      'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma',
    ];
    const kwPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    out = out.replace(kwPattern, '<span class="cf-tip-kw">$1</span>');
    return out;
  },

  // ---- SHEET BUTTONS ----
  initSheetButtons() {
    // Clamp speed to 0–999 on manual input
    const speedInput = this.$('speed');
    if (speedInput) {
      speedInput.addEventListener('change', () => {
        const v = parseInt(speedInput.value);
        if (isNaN(v) || v < 0) speedInput.value = 0;
        else if (v > 999) speedInput.value = 999;
        else speedInput.value = v;
        speedInput.dispatchEvent(new Event('input'));
      });
    }

    // Clamp coins to 0+ on manual input; default blank to 0
    ['cp', 'sp', 'ep', 'gp', 'pp'].forEach(id => {
      const el = this.$(id);
      if (!el) return;
      el.addEventListener('change', () => {
        const v = parseInt(el.value);
        el.value = (isNaN(v) || v < 0) ? 0 : v;
        el.dispatchEvent(new Event('input'));
      });
      el.addEventListener('blur', () => {
        if (el.value === '') el.value = 0;
      });
    });

    // Clamp armorClass to 0–99 on manual input
    const acInput = this.$('armorClass');
    if (acInput) {
      acInput.addEventListener('change', () => {
        const v = parseInt(acInput.value);
        if (isNaN(v) || v < 0) acInput.value = 0;
        else if (v > 99) acInput.value = 99;
        else acInput.value = v;
        acInput.dispatchEvent(new Event('input'));
      });
    }

    // Cover buttons
    this._initCoverButtons();

    // HP current +/- buttons (handled separately — full-height buttons)
    const hpInput = this.$('hpCurrent');
    this.qs('.hp-btn-minus')?.addEventListener('click', () => {
      if (!hpInput) return;
      hpInput.value = (parseInt(hpInput.value) || 0) - 1;
      hpInput.dispatchEvent(new Event('change'));
    });
    this.qs('.hp-btn-plus')?.addEventListener('click', () => {
      if (!hpInput) return;
      hpInput.value = (parseInt(hpInput.value) || 0) + 1;
      hpInput.dispatchEvent(new Event('change'));
    });

    this.$('btn-add-attack')?.addEventListener('click', () => this.addAttackRow());
  },

  // ---- DICE ROLLER ----
  _diceMode: 'normal',    // 'normal', 'advantage', 'disadvantage'
  _diceExpression: [],     // Array of { count, sides, mode }

  initDiceRoller() {
    const roller = this.$('dice-roller');
    const toggle = this.$('dice-toggle');
    const panel = this.$('dice-panel');
    const rollBtn = this.$('dice-roll-btn');
    const clearBtn = this.$('dice-clear-btn');
    if (!roller || !toggle || !panel) return;

    // Start with idle pulse
    toggle.classList.add('idle-pulse');

    // Toggle panel open/close
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      roller.classList.toggle('open');
      if (roller.classList.contains('open')) {
        toggle.classList.remove('idle-pulse');
      }
    });

    // Close panel on outside click
    document.addEventListener('click', (e) => {
      if (!roller.contains(e.target)) {
        roller.classList.remove('open');
        if (!toggle.classList.contains('idle-pulse')) {
          toggle.classList.add('idle-pulse');
        }
      }
    });

    // Spinner +/- buttons for mod
    panel.querySelectorAll('.dice-opt-minus, .dice-opt-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = this.$(btn.dataset.target);
        if (!input) return;
        const delta = btn.classList.contains('dice-opt-minus') ? -1 : 1;
        input.value = (parseInt(input.value) || 0) + delta;
        this._renderFormulaBar();
      });
    });

    // Also update formula bar when mod is typed manually
    const modInput = this.$('diceMod');
    if (modInput) {
      modInput.addEventListener('input', () => this._renderFormulaBar());
    }

    // Advantage / disadvantage mode buttons
    panel.querySelectorAll('.dice-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (this._diceMode === mode && mode !== 'normal') {
          this._diceMode = 'normal';
        } else {
          this._diceMode = mode;
        }
        panel.querySelectorAll('.dice-mode-btn').forEach(b => b.classList.remove('active'));
        panel.querySelector(`.dice-mode-btn[data-mode="${this._diceMode}"]`)?.classList.add('active');
      });
    });
    panel.querySelector('.dice-mode-btn[data-mode="normal"]')?.classList.add('active');

    // Dice buttons — add group to expression
    // Dice buttons — each click adds 1 die (merges if same type)
    this.qsa('.dice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sides = parseInt(btn.dataset.sides);
        const mode = (sides === 20) ? this._diceMode : 'normal';

        const existing = this._diceExpression.find(g => g.sides === sides && g.mode === mode);
        if (existing) {
          existing.count += 1;
        } else {
          this._diceExpression.push({ count: 1, sides, mode });
        }
        this._renderFormulaBar();
      });
    });

    // Roll button
    if (rollBtn) {
      rollBtn.addEventListener('click', () => {
        const mod = parseInt(this.$('diceMod')?.value) || 0;
        if (!this._diceExpression.length && !mod) return;

        // If expression is empty but there's a mod, just show the mod
        if (!this._diceExpression.length) {
          const result = { total: mod, modifier: mod, compound: true, groups: [], used: null };
          Dice.showResult(`Modifier`, result);
          this._updateDiceResult(result);
          return;
        }

        const result = Dice.rollCompound(this._diceExpression, mod);

        // Build label from expression
        const label = this._buildExpressionLabel();
        Dice.showResult(label, result);
        this._updateDiceResult(result);
      });
    }

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this._diceExpression = [];
        const modInput = this.$('diceMod');
        if (modInput) modInput.value = 0;
        this._renderFormulaBar();
        const resultEl = this.$('dice-result');
        if (resultEl) {
          resultEl.innerHTML = 'Build an expression, then roll';
          resultEl.classList.remove('has-roll');
        }
      });
    }

    // Initial render
    this._renderFormulaBar();
  },

  _buildExpressionLabel() {
    const parts = this._diceExpression.map(g => {
      let s = `${g.count}d${g.sides}`;
      if (g.mode === 'advantage') s += ' (Adv)';
      else if (g.mode === 'disadvantage') s += ' (Dis)';
      return s;
    });
    const mod = parseInt(this.$('diceMod')?.value) || 0;
    if (mod) parts.push(mod > 0 ? `+${mod}` : `${mod}`);
    return parts.join(' + ');
  },

  _renderFormulaBar() {
    const bar = this.$('dice-formula-bar');
    const chips = this.$('dice-formula-chips');
    const rollBtn = this.$('dice-roll-btn');
    if (!bar || !chips) return;

    chips.innerHTML = '';
    const mod = parseInt(this.$('diceMod')?.value) || 0;
    const hasContent = this._diceExpression.length > 0 || mod !== 0;

    bar.classList.toggle('empty', !hasContent);
    if (rollBtn) rollBtn.disabled = !hasContent;

    this._diceExpression.forEach((g, i) => {
      if (i > 0) {
        const plus = document.createElement('span');
        plus.className = 'dice-chip-plus';
        plus.textContent = '+';
        chips.appendChild(plus);
      }

      const chip = document.createElement('span');
      let label = `${g.count}d${g.sides}`;
      if (g.mode === 'advantage') {
        label += ' Adv';
        chip.className = 'dice-chip chip-adv';
      } else if (g.mode === 'disadvantage') {
        label += ' Dis';
        chip.className = 'dice-chip chip-dis';
      } else {
        chip.className = 'dice-chip';
      }

      const text = document.createTextNode(label);
      chip.appendChild(text);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'dice-chip-remove';
      removeBtn.textContent = '\u00D7';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._diceExpression.splice(i, 1);
        this._renderFormulaBar();
      });
      chip.appendChild(removeBtn);
      chips.appendChild(chip);
    });

    // Show modifier chip if non-zero
    if (mod !== 0) {
      if (this._diceExpression.length > 0) {
        const plus = document.createElement('span');
        plus.className = 'dice-chip-plus';
        plus.textContent = mod > 0 ? '+' : '';
        chips.appendChild(plus);
      }
      const modChip = document.createElement('span');
      modChip.className = 'dice-chip chip-mod';
      modChip.textContent = mod > 0 ? `+${mod}` : `${mod}`;
      chips.appendChild(modChip);
    }
  },

  _updateDiceResult(result) {
    const resultEl = this.$('dice-result');
    const badge = this.$('dice-toggle-result');

    if (resultEl) {
      const breakdown = Dice._buildBreakdown(result);
      resultEl.innerHTML = `<span class="dice-result-detail">${breakdown}</span><span class="dice-result-total">${result.total}</span>`;
      resultEl.classList.add('has-roll');
    }

    if (badge) {
      badge.textContent = result.total;
      badge.className = 'dice-toggle-result visible';
      if (result.used === 20) badge.classList.add('crit');
      else if (result.used === 1) badge.classList.add('fumble');
      badge.style.animation = 'none';
      badge.offsetHeight;
      badge.style.animation = '';
    }
  },

  // ---- EQUIPPED GEAR ----
  // Slot definitions inspired by BG3 / classic MMO slot systems
  // "hands" section has special mutual-exclusion rules, "gear" section is 1:1
  // Two-column layout: left column = left side of body, right column = right side
  // Ordered top-to-bottom per column to mirror a character's body
  EQUIP_LEFT: [
    { key: 'head',      label: 'Head',        icon: '👑' },
    { key: 'cloak',     label: 'Cloak',       icon: '🧣' },
    { key: 'armor',     label: 'Armor',       icon: '🛡️' },
    { key: 'gloves',    label: 'Gloves',      icon: '🧤' },
    { key: 'rightHand', label: 'R. Hand',     icon: '🫱' },
  ],
  EQUIP_RIGHT: [
    { key: 'necklace',  label: 'Neck',        icon: '📿' },
    { key: 'ring1',     label: 'Ring',        icon: '💍' },
    { key: 'ring2',     label: 'Ring',        icon: '💍' },
    { key: 'boots',     label: 'Boots',       icon: '👢' },
    { key: 'leftHand',  label: 'L. Hand',     icon: '🫲' },
  ],
  // Combined for iteration
  get EQUIPMENT_SLOTS() {
    return [...this.EQUIP_LEFT, ...this.EQUIP_RIGHT];
  },

  // Standard conditions sourced from ConditionRules
  get CONDITIONS() { return ConditionRules.CONDITION_LIST; },

  /* ---- COMBAT ECONOMY (Action / Bonus Action / Reaction / Movement) ---- */
  _initDeathSaves() {
    // Restore saved state for heart/skull icons
    document.querySelectorAll('.death-icon').forEach(icon => {
      const key = icon.dataset.save;
      if (!key) return;
      icon.classList.toggle('filled', this.lv(key, false));
      icon.addEventListener('click', () => {
        const next = !this.lv(key, false);
        this.sv(key, next);
        icon.classList.toggle('filled', next);
      });
    });

    // Roll button on the label
    const dsRollBtn = document.getElementById('btn-death-save-roll');
    if (dsRollBtn) {
      dsRollBtn.addEventListener('click', () => this._rollDeathSave());
    }
  },

  _rollDeathSave() {
    const result = Dice.rollD20(0);
    const roll = result.total;
    let label = 'Death Save';
    if (roll === 20) {
      label = 'Death Save — NAT 20! Regain 1 HP';
      this._markNextDeathSave('success');
    } else if (roll === 1) {
      label = 'Death Save — NAT 1! Two Failures';
      this._markNextDeathSave('fail');
      this._markNextDeathSave('fail');
    } else if (roll >= 10) {
      label = 'Death Save — Success';
      this._markNextDeathSave('success');
    } else {
      label = 'Death Save — Failure';
      this._markNextDeathSave('fail');
    }
    Dice.showResult(label, result);
  },

  _markNextDeathSave(type) {
    const prefix = type === 'success' ? 'ds' : 'df';
    for (let i = 0; i < 3; i++) {
      const key = `${prefix}${i}`;
      if (!this.lv(key, false)) {
        this.sv(key, true);
        const icon = document.querySelector(`.death-icon[data-save="${key}"]`);
        if (icon) icon.classList.add('filled');
        return;
      }
    }
  },

  /* ---- HP RECALCULATION ---- */
  _initHpRecalc() {
    const btn = document.getElementById('btn-hp-recalc');
    if (btn) btn.addEventListener('click', () => this._openHpRecalcModal());
  },

  _openHpRecalcModal() {
    const className = this.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;
    const hitDieFaces = classInfo?.hitDieFaces || 8;
    const conMod = this.getModFromScore(this.getAbilityScore('con'));
    const conStr = conMod >= 0 ? `+${conMod}` : `${conMod}`;
    const level = Math.max(1, parseInt(this.lv('charLevel', 1)) || 1);
    const currentMax = parseInt(this.lv('hpMax', 0)) || 0;

    const level1Hp  = Math.max(1, hitDieFaces + conMod);
    const perLevelMax   = Math.max(1, hitDieFaces + conMod);
    const perLevelAvg   = Math.max(1, Math.floor(hitDieFaces / 2 + 0.5) + conMod);
    const perLevelFixed = Math.max(1, Math.floor(hitDieFaces / 2) + 1 + conMod);

    const totalMax   = level1Hp + (level - 1) * perLevelMax;
    const totalAvg   = level1Hp + (level - 1) * perLevelAvg;
    const totalFixed = level1Hp + (level - 1) * perLevelFixed;

    const savedMethod = this.lv('hpMethod', 'avg');

    const existing = document.getElementById('hp-recalc-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'hp-recalc-modal';
    modal.className = 'levelup-backdrop';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="levelup-modal" style="max-width:420px;height:auto">
        <div class="levelup-header">
          <h2 class="levelup-title">Recalculate Hit Points</h2>
          <button class="levelup-close" id="hp-recalc-close">&times;</button>
        </div>
        <div class="levelup-body">
          <p style="margin-bottom:0.5rem;font-size:0.85rem;color:var(--ink-faint)">
            Level ${level} ${className || 'character'} &mdash; d${hitDieFaces} hit die, ${conStr} CON mod
          </p>
          <p style="margin-bottom:0.8rem;font-size:0.8rem;color:var(--ink-faint)">
            Level 1: max die (${level1Hp} HP), Levels 2+: chosen method per level
          </p>
          <div class="lu-hp-method-options">
            <label class="lu-asi-choice${savedMethod === 'max' ? ' selected' : ''}" data-hp-val="${totalMax}">
              <input type="radio" name="hp-recalc-method" value="max" ${savedMethod === 'max' ? 'checked' : ''}>
              <div class="lu-asi-label"><strong>Maximum</strong> &mdash; ${level > 1 ? `${level1Hp} + ${level - 1} &times; ${perLevelMax}` : level1Hp} = <strong>${totalMax}</strong></div>
            </label>
            <label class="lu-asi-choice${savedMethod === 'avg' ? ' selected' : ''}" data-hp-val="${totalAvg}">
              <input type="radio" name="hp-recalc-method" value="avg" ${savedMethod === 'avg' ? 'checked' : ''}>
              <div class="lu-asi-label"><strong>Average</strong> &mdash; ${level > 1 ? `${level1Hp} + ${level - 1} &times; ${perLevelAvg}` : level1Hp} = <strong>${totalAvg}</strong></div>
            </label>
            <label class="lu-asi-choice${savedMethod === 'fixed' ? ' selected' : ''}" data-hp-val="${totalFixed}">
              <input type="radio" name="hp-recalc-method" value="fixed" ${savedMethod === 'fixed' ? 'checked' : ''}>
              <div class="lu-asi-label"><strong>Fixed Average</strong> &mdash; ${level > 1 ? `${level1Hp} + ${level - 1} &times; ${perLevelFixed}` : level1Hp} = <strong>${totalFixed}</strong></div>
            </label>
            <label class="lu-asi-choice${savedMethod === 'manual' ? ' selected' : ''}" data-hp-val="${currentMax}">
              <input type="radio" name="hp-recalc-method" value="manual" ${savedMethod === 'manual' ? 'checked' : ''}>
              <div class="lu-asi-label"><strong>Manual</strong> &mdash;
                <input type="number" id="hp-recalc-manual" min="1" max="999" value="${currentMax}"
                  ${savedMethod !== 'manual' ? 'disabled' : ''}
                  style="width:70px;margin-left:8px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg-input,var(--parchment));color:var(--ink)">
              </div>
            </label>
          </div>
          <div class="lu-hp-gain" style="margin-top:10px">
            Max HP: ${currentMax} &rarr; <strong id="hp-recalc-new">${savedMethod === 'manual' ? currentMax : (savedMethod === 'max' ? totalMax : (savedMethod === 'fixed' ? totalFixed : totalAvg))}</strong>
          </div>
        </div>
        <div class="levelup-footer">
          <button class="btn levelup-btn-cancel" id="hp-recalc-cancel">Cancel</button>
          <button class="btn levelup-btn-confirm" id="hp-recalc-confirm">Apply</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    const newTotalEl = modal.querySelector('#hp-recalc-new');
    const manualInput = modal.querySelector('#hp-recalc-manual');

    const updatePreview = () => {
      const checked = modal.querySelector('input[name="hp-recalc-method"]:checked');
      if (!checked) return;
      if (checked.value === 'manual') {
        newTotalEl.textContent = manualInput.value || currentMax;
      } else {
        newTotalEl.textContent = checked.closest('label').dataset.hpVal;
      }
    };

    modal.querySelectorAll('input[name="hp-recalc-method"]').forEach(radio => {
      radio.addEventListener('change', () => {
        modal.querySelectorAll('.lu-hp-method-options .lu-asi-choice').forEach(el => el.classList.remove('selected'));
        radio.closest('.lu-asi-choice').classList.add('selected');
        manualInput.disabled = radio.value !== 'manual';
        updatePreview();
      });
    });

    manualInput.addEventListener('input', () => {
      const v = Math.max(1, Math.min(999, parseInt(manualInput.value) || 1));
      newTotalEl.textContent = v;
    });

    modal.querySelector('#hp-recalc-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#hp-recalc-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#hp-recalc-confirm').addEventListener('click', () => {
      const checked = modal.querySelector('input[name="hp-recalc-method"]:checked');
      if (!checked) return;
      let newMax;
      if (checked.value === 'manual') {
        newMax = Math.max(1, Math.min(999, parseInt(manualInput.value) || 1));
      } else {
        newMax = parseInt(checked.closest('label').dataset.hpVal) || currentMax;
      }
      const hpMaxEl = document.getElementById('hpMax');
      if (hpMaxEl) hpMaxEl.value = newMax;
      this.sv('hpMax', newMax);
      // Also cap current HP if it exceeds new max
      const curHp = parseInt(this.lv('hpCurrent', 0)) || 0;
      if (curHp > newMax) {
        const hpCurEl = document.getElementById('hpCurrent');
        if (hpCurEl) hpCurEl.value = newMax;
        this.sv('hpCurrent', newMax);
      }
      // Save the chosen method
      if (checked.value !== 'manual') this.sv('hpMethod', checked.value);
      modal.remove();
    });
  },


  /* ---- HIT DICE ---- */
  getHitDice() {
    try { return JSON.parse(this.lv('hitDice', '[]')) || []; }
    catch { return []; }
  },
  saveHitDice(arr) { this.sv('hitDice', JSON.stringify(arr)); },

  // Retroactively apply any missing subclass spell grants for existing characters.
  // Safe to call multiple times — _applySubclassGrants skips spells already in charSpells.
  migrateSubclassGrants() {
    if (typeof LevelUp === 'undefined') return;
    const className  = (this.lv('charClass',    '') || '').trim();
    const subclass   = (this.lv('charSubclass', '') || '').trim();
    const level      = parseInt(this.lv('charLevel', '1')) || 1;
    if (!className || !subclass) return;
    LevelUp._applySubclassGrants(subclass, className, level);
  },

  migrateHitDice() {
    const existing = this.getHitDice();
    if (existing.length) return;
    const oldTotal = this.lv('hitDiceTotal', '');
    if (!oldTotal) return;
    const m = oldTotal.match(/(\d+)d(\d+)/i);
    if (!m) return;
    const total = parseInt(m[1]);
    const faces = parseInt(m[2]);
    const used = parseInt(this.lv('hitDiceUsed', '0')) || 0;
    this.saveHitDice([{ die: faces, total, used }]);
  },

  syncHitDice() {
    const className = this.lv('charClass', '');
    const level = Math.max(1, Math.min(20, parseInt(this.$('charLevel')?.value) || 1));
    if (!className) { this.saveHitDice([]); this.renderHitDice(); return; }
    const info = typeof getClassInfo === 'function' ? getClassInfo(className) : null;
    if (!info || !info.hitDieFaces) return;

    const dice = this.getHitDice();
    const existing = dice.find(hd => hd.die === info.hitDieFaces);
    if (existing) {
      existing.total = level;
      existing.used = Math.min(existing.used, existing.total);
    } else {
      dice.push({ die: info.hitDieFaces, total: level, used: 0 });
    }
    const filtered = dice.filter(hd => hd.die === info.hitDieFaces);
    this.saveHitDice(filtered);
    this.renderHitDice();
  },

  renderHitDice() {
    this._renderDsHitDie();
  },

  _renderDsHitDie() {
    const el = this.$('ds-hd-section');
    if (!el) return;
    const dice = this.getHitDice();
    if (!dice.length) {
      el.innerHTML = '<span class="rest-hd-empty">—</span>';
      return;
    }
    el.innerHTML = dice.map(hd => {
      const rem = hd.total - hd.used;
      const low = rem === 0 ? ' depleted' : rem <= Math.ceil(hd.total / 4) ? ' low' : '';
      return `<div class="rest-hd-row${low}"><span class="rest-hd-rem">${rem}</span><span class="rest-hd-sep">/</span><span class="rest-hd-tot">${hd.total}</span><span class="rest-hd-die">d${hd.die}</span></div>`;
    }).join('');
  },

  _rollHitDie(index) {
    const dice = this.getHitDice();
    const hd = dice[index];
    if (!hd) return;
    if (hd.total - hd.used <= 0) return;
    const conScore = parseInt(this.$('con')?.value) || 10;
    const conMod = Math.floor((conScore - 10) / 2);
    const roll = Dice.roll(hd.die);
    const healing = Math.max(1, roll + conMod);
    const maxHP = parseInt(this.lv('hpMax', 0)) || 0;
    const currentHP = parseInt(this.lv('hpCurrent', 0)) || 0;
    const newHP = Math.min(maxHP, currentHP + healing);
    this.sv('hpCurrent', newHP);
    const hpInput = this.$('hpCurrent');
    if (hpInput) hpInput.value = newHP;
    dice[index].used++;
    this.saveHitDice(dice);
    this.renderHitDice();
    Dice.showResult(`Hit Die (d${hd.die})`, { r1: roll, r2: null, used: roll, total: healing, modifier: conMod });
  },

  _initHitDice() {
    this.migrateHitDice();
    this.syncHitDice();
  },

  /* ---- SCROLL SYSTEM ---- */
  SCROLL_SCRIBE_COST: [15, 25, 50, 100, 250, 500, 1250, 2500, 5000, 12500],
  SCROLL_SCRIBE_TIME: ['1 hour', '1 day', '3 days', '1 week', '2 weeks', '4 weeks', '8 weeks', '16 weeks', '24 weeks', '48 weeks'],

  _initScrollButtons() {
    this.$('btn-learn-scroll')?.addEventListener('click', () => this._openLearnScrollModal());
    this.$('btn-cast-scroll')?.addEventListener('click', () => this._openCastScrollModal());
    this.$('spell-tab-learn-scroll')?.addEventListener('click', () => this._openLearnScrollModal());
    this.$('spell-tab-cast-scroll')?.addEventListener('click', () => this._openCastScrollModal());
    this._updateLearnScrollVisibility();
  },

  _updateLearnScrollVisibility() {
    const isWizard = (this.lv('charClass', '') || '').toLowerCase() === 'wizard';
    ['btn-learn-scroll', 'spell-tab-learn-scroll'].forEach(id => {
      const btn = this.$(id);
      if (btn) btn.style.display = isWizard ? '' : 'none';
    });
  },

  _getScrollsFromInventory() {
    const inv = this.lv('inventory', []);
    const scrolls = [];
    inv.forEach(item => {
      if ((item.typeCode || '').toUpperCase() !== 'SC') return;
      if (!item.scrollSpell) return;
      const spell = DndData.spells.find(s => s.name.toLowerCase() === item.scrollSpell.toLowerCase());
      if (!spell) return;
      scrolls.push({ item, spell, qty: item.qty || 1 });
    });
    return scrolls;
  },

  _parseScrollLevel(name) {
    // "Spell Scroll (Cantrip)" → 0
    if (/cantrip/i.test(name)) return 0;
    // "Spell Scroll (1st Level)" → 1, "Spell Scroll (2nd Level)" → 2, etc.
    const m = name.match(/(\d+)(?:st|nd|rd|th)\s*level/i);
    if (m) return parseInt(m[1]);
    return null;
  },

  _promptScrollSpellPicker(item, scrollLevel) {
    const spells = DndData.spells.filter(s => s.level === scrollLevel).sort((a, b) => a.name.localeCompare(b.name));
    if (!spells.length) {
      alert(`No spells found for level ${scrollLevel}.`);
      return;
    }

    // Build a lookup map for quick access
    const spellMap = {};
    spells.forEach(s => { spellMap[s.name] = s; });

    document.getElementById('scroll-spell-picker-backdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'scroll-spell-picker-backdrop';
    backdrop.className = 'rest-modal-backdrop';
    backdrop.style.display = 'flex';
    backdrop.innerHTML = `
      <div class="rest-modal scroll-modal scroll-picker-modal">
        <div class="rest-modal-header">
          <h2 class="rest-modal-title">Assign Spell to Scroll</h2>
          <button class="rest-modal-close" title="Close">✕</button>
        </div>
        <div class="rest-modal-body scroll-picker-body">
          <p class="rest-modal-desc">This is a <strong>${scrollLevel === 0 ? 'Cantrip' : 'Level ' + scrollLevel}</strong> spell scroll. Choose which spell it contains:</p>
          <input type="text" class="scroll-search" id="scroll-picker-search" placeholder="Search spells..." autocomplete="off">
          <div class="scroll-picker-layout">
            <div class="scroll-picker-list" id="scroll-picker-list">
              ${spells.map(s => {
                const school = s._schoolName || '';
                const castTime = s._castTime || '';
                return `<button class="scroll-picker-item" data-spell="${s.name}">
                  <span class="scroll-picker-name">${s.name}</span>
                  <span class="scroll-picker-meta">${school}${castTime ? ' · ' + castTime : ''}</span>
                </button>`;
              }).join('')}
            </div>
            <div class="scroll-picker-preview" id="scroll-picker-preview">
              <p class="scroll-picker-preview-empty">Hover over a spell to see its details</p>
            </div>
          </div>
        </div>
        <div class="rest-modal-footer">
          <button class="btn" id="scroll-picker-cancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('.rest-modal-close').addEventListener('click', close);
    backdrop.querySelector('#scroll-picker-cancel').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

    // Preview panel
    const preview = backdrop.querySelector('#scroll-picker-preview');

    // Search filter
    const search = backdrop.querySelector('#scroll-picker-search');
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      backdrop.querySelectorAll('.scroll-picker-item').forEach(el => {
        el.style.display = el.dataset.spell.toLowerCase().includes(q) ? '' : 'none';
      });
    });
    search.focus();

    // Hover to show spell details + Spell selection
    backdrop.querySelectorAll('.scroll-picker-item').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        const spell = spellMap[btn.dataset.spell];
        if (spell) {
          preview.innerHTML = this._buildSpellDetailHTML(spell);
        }
      });
    });

    backdrop.querySelectorAll('.scroll-picker-item').forEach(btn => {
      btn.addEventListener('click', () => {
        item._scrollSpell = btn.dataset.spell;
        item._scrollSpellAssigned = true;
        this.addItemToInventory(item);
        close();
      });
    });
  },

  _getScribeDiscount() {
    const subclass = this.lv('charSubclass', '');
    if (subclass.toLowerCase().includes('scribes')) return 0.5;
    return 1;
  },

  _getScribeCost(spellLevel) {
    const baseCost = this.SCROLL_SCRIBE_COST[spellLevel] || 0;
    return Math.floor(baseCost * this._getScribeDiscount());
  },

  _getTotalGold() {
    const cp = parseInt(this.$('cp')?.value) || 0;
    const sp = parseInt(this.$('sp')?.value) || 0;
    const ep = parseInt(this.$('ep')?.value) || 0;
    const gp = parseInt(this.$('gp')?.value) || 0;
    const pp = parseInt(this.$('pp')?.value) || 0;
    return pp * 10 + gp + ep * 0.5 + sp * 0.1 + cp * 0.01;
  },

  _deductGold(amount) {
    let remaining = Math.round(amount * 100);
    const coins = ['pp', 'gp', 'ep', 'sp', 'cp'];
    const values = [1000, 100, 50, 10, 1];
    coins.forEach((coin, i) => {
      const el = this.$(coin);
      let have = parseInt(el?.value) || 0;
      const coinVal = values[i];
      const spend = Math.min(have, Math.floor(remaining / coinVal));
      if (spend > 0) {
        have -= spend;
        remaining -= spend * coinVal;
        if (el) el.value = have;
        this.sv(coin, have);
      }
    });
  },

  _openLearnScrollModal() {
    const charClass = this.lv('charClass', '');
    if (!charClass) { alert('Select a class first.'); return; }
    if (charClass.toLowerCase() !== 'wizard') {
      alert('Only Wizards can learn spells from scrolls.');
      return;
    }

    const scrolls = this._getScrollsFromInventory();
    if (!scrolls.length) {
      this._showScrollPopup('No Scrolls', '<p class="rest-modal-empty">No spell scrolls found in your inventory.</p>');
      return;
    }

    const totalGold = this._getTotalGold();
    const discount = this._getScribeDiscount();
    const discountLabel = discount < 1 ? ` <span class="scroll-discount">(${Math.round((1 - discount) * 100)}% Order of Scribes discount)</span>` : '';
    const knownSpells = this.lv('charSpells', []).map(s => s.name.toLowerCase());

    let html = `<div class="scroll-learn-list">`;
    scrolls.forEach(({ item, spell }) => {
      const already = knownSpells.includes(spell.name.toLowerCase());
      const cost = this._getScribeCost(spell.level);
      const time = this.SCROLL_SCRIBE_TIME[spell.level] || '—';
      const canAfford = totalGold >= cost;
      const disabled = already || !canAfford;
      let reason = '';
      if (already) reason = '<span class="scroll-reason">Already known</span>';
      else if (!canAfford) reason = `<span class="scroll-reason scroll-reason-gold">Not enough gold (need ${cost} gp, have ${Math.floor(totalGold)} gp)</span>`;

      html += `
        <div class="scroll-learn-row${disabled ? ' disabled' : ''}">
          <div class="scroll-learn-info">
            <span class="scroll-learn-name">${spell.name}</span>
            <span class="scroll-learn-level">${spell.level === 0 ? 'Cantrip' : 'Level ' + spell.level}</span>
          </div>
          <div class="scroll-learn-cost">
            <span>${cost} gp</span>
            <span class="scroll-learn-time">${time}</span>
          </div>
          <div class="scroll-learn-action">
            ${reason || `<button class="btn btn-sm scroll-learn-btn" data-spell="${spell.name}" data-cost="${cost}" data-item="${item.itemId}">Learn</button>`}
          </div>
        </div>`;
    });
    html += `</div>`;
    if (discountLabel) html = `<p class="scroll-discount-note">${discountLabel}</p>` + html;

    const modal = this._showScrollPopup('Learn from Scroll', html);
    modal.querySelectorAll('.scroll-learn-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const spellName = btn.dataset.spell;
        const cost = parseInt(btn.dataset.cost);
        const itemId = btn.dataset.item;
        const spell = DndData.spells.find(s => s.name === spellName);
        if (!spell) return;

        this._deductGold(cost);
        this.addSpellToSheet(spell);

        // Remove scroll from inventory
        const inv = this.lv('inventory', []);
        const idx = inv.findIndex(i => i.itemId === itemId);
        if (idx >= 0) {
          if (inv[idx].qty > 1) inv[idx].qty--;
          else inv.splice(idx, 1);
          this.sv('inventory', inv);
          this.renderInventory();
        }

        btn.closest('.scroll-learn-row').classList.add('disabled');
        btn.replaceWith(Object.assign(document.createElement('span'), { className: 'scroll-reason', textContent: 'Learned!' }));
      });
    });
  },

  _openCastScrollModal() {
    const scrolls = this._getScrollsFromInventory();
    if (!scrolls.length) {
      this._showScrollPopup('No Scrolls', '<p class="rest-modal-empty">No spell scrolls found in your inventory.</p>');
      return;
    }

    // Sort by level then name
    scrolls.sort((a, b) => a.spell.level - b.spell.level || a.spell.name.localeCompare(b.spell.name));

    let listHtml = '<div class="scroll-cast-list">';
    scrolls.forEach(({ item, spell }) => {
      const school = spell._schoolName || '';
      const castTime = spell._castTime || '';
      const levelLabel = spell.level === 0 ? 'Cantrip' : `Lvl ${spell.level}`;
      const desc = this._buildSpellDetailHTML(spell);
      listHtml += `
        <div class="scroll-cast-row">
          <div class="scroll-cast-info">
            <span class="scroll-cast-name">${spell.name}</span>
            <span class="scroll-cast-meta">${levelLabel} · ${school}${castTime ? ' · ' + castTime : ''}</span>
            <span class="scroll-cast-qty">&times;${item.qty || 1}</span>
          </div>
          <div class="scroll-cast-actions">
            <button class="btn btn-sm scroll-detail-btn" title="View spell details">Details</button>
            <button class="btn btn-sm scroll-cast-btn" data-spell="${spell.name}" data-item="${item.itemId}">Cast</button>
          </div>
          <div class="scroll-cast-detail" style="display:none">${desc}</div>
        </div>`;
    });
    listHtml += '</div>';

    const modal = this._showScrollPopup('Cast Scroll', listHtml);

    // Detail toggles
    modal.querySelectorAll('.scroll-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const detail = btn.closest('.scroll-cast-row').querySelector('.scroll-cast-detail');
        if (detail) {
          const showing = detail.style.display !== 'none';
          detail.style.display = showing ? 'none' : '';
          btn.textContent = showing ? 'Details' : 'Hide';
        }
      });
    });

    // Concentrate buttons inside spell details
    modal.querySelectorAll('.spell-hover-conc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.scroll-cast-row');
        const castBtn = row?.querySelector('.scroll-cast-btn');
        const spellName = castBtn?.dataset.spell;
        if (spellName) this._setConcentration(spellName);
      });
    });

    // Cast buttons
    modal.querySelectorAll('.scroll-cast-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.item;
        const spellName = btn.dataset.spell;

        // Remove one scroll from inventory
        const inv = this.lv('inventory', []);
        const idx = inv.findIndex(i => i.itemId === itemId);
        if (idx >= 0) {
          if (inv[idx].qty > 1) {
            inv[idx].qty--;
            const qtyEl = btn.closest('.scroll-cast-row').querySelector('.scroll-cast-qty');
            if (qtyEl) qtyEl.textContent = `×${inv[idx].qty}`;
          } else {
            inv.splice(idx, 1);
            btn.closest('.scroll-cast-row').remove();
          }
          this.sv('inventory', inv);
          this.renderInventory();
        }

        // Set concentration if applicable
        const spell = DndData.spells.find(s => s.name === spellName);
        if (spell && this._isConcentration(spell)) {
          this._setConcentration(spellName);
        }

        // Mark as cast visually
        const row = btn.closest('.scroll-cast-row');
        if (row && !row.querySelector('.scroll-cast-row')) {
          btn.disabled = true;
          btn.textContent = 'Cast!';
          setTimeout(() => { if (row.parentNode) row.style.opacity = '0.5'; }, 300);
        }
      });
    });

    // Wire up dice buttons inside detail sections
    modal.querySelectorAll('.spell-detail-dice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expr = btn.dataset.dice.replace(/\s/g, '');
        const result = Dice.rollExpression(expr);
        const row = btn.closest('.scroll-cast-row');
        const spellName = row?.querySelector('.scroll-cast-btn')?.dataset.spell || 'Scroll';
        Dice.showResult(`${spellName} (${expr})`, result);
      });
    });
  },

  _showScrollPopup(title, bodyHtml) {
    // Remove any existing scroll modal
    document.getElementById('scroll-modal-backdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'scroll-modal-backdrop';
    backdrop.className = 'rest-modal-backdrop';
    backdrop.style.display = 'flex';
    backdrop.innerHTML = `
      <div class="rest-modal scroll-modal">
        <div class="rest-modal-header">
          <h2 class="rest-modal-title">${title}</h2>
          <button class="rest-modal-close" title="Close">✕</button>
        </div>
        <div class="rest-modal-body">${bodyHtml}</div>
        <div class="rest-modal-footer">
          <button class="btn" id="scroll-modal-close">Close</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('.rest-modal-close').addEventListener('click', close);
    backdrop.querySelector('#scroll-modal-close').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

    return backdrop;
  },

  /* ---- REST MODAL SYSTEM ---- */
  _initRestButtons() {
    this.$('btn-short-rest-main')?.addEventListener('click', () => this._openRestModal('short'));
    this.$('btn-long-rest-main')?.addEventListener('click', () => this._openRestModal('long'));
    this.$('btn-dawn-rest-main')?.addEventListener('click', () => this._openRestModal('dawn'));
  },

  _openRestModal(type) {
    const backdrop = this.$('rest-modal-backdrop');
    const title = this.$('rest-modal-title');
    const body = this.$('rest-modal-body');
    const confirmBtn = this.$('rest-modal-confirm');
    const cancelBtn = this.$('rest-modal-cancel');
    const closeBtn = this.$('rest-modal-close');
    if (!backdrop || !body) return;

    if (type === 'short') {
      title.textContent = 'Short Rest';
      this._buildShortRestBody(body);
      confirmBtn.textContent = 'Finish Short Rest';
      confirmBtn.onclick = () => { this._doShortRest(body); this._closeRestModal(); };
    } else if (type === 'long') {
      title.textContent = 'Long Rest';
      this._buildLongRestBody(body);
      confirmBtn.textContent = 'Finish Long Rest';
      confirmBtn.onclick = () => { this._doLongRest(body); this._closeRestModal(); };
    } else if (type === 'dawn') {
      title.textContent = 'Dawn';
      this._buildDawnBody(body);
      confirmBtn.textContent = 'Confirm Dawn';
      confirmBtn.onclick = () => { this._doDawn(); this._closeRestModal(); };
    }

    const close = () => this._closeRestModal();
    cancelBtn.onclick = close;
    closeBtn.onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    backdrop.style.display = 'flex';
  },

  _closeRestModal() {
    const backdrop = this.$('rest-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
  },

  _buildShortRestBody(body) {
    const dice = this.getHitDice();
    const conScore = parseInt(this.$('con')?.value) || 10;
    const conMod = Math.floor((conScore - 10) / 2);
    const maxHP = parseInt(this.lv('hpMax', 0)) || 0;
    let currentHP = parseInt(this.lv('hpCurrent', 0)) || 0;

    const resources = this.lv('resources', []) || [];
    const srResources = resources.filter(r => r.refresh === 'sr' && r.used > 0);
    const srUsable = resources.filter(r => r.usableOnShortRest && r.refresh === 'lr' && r.used < r.max);

    const charClass = this.lv('charClass', '');
    const charLevel = parseInt(this.lv('charLevel', 1)) || 1;
    let warlockSlotHtml = '';
    if (charClass === 'Warlock') {
      const slotInfo = [];
      for (let lvl = 1; lvl <= 5; lvl++) {
        const max = this.lv(`slotMax_${lvl}`, 0);
        if (max > 0) {
          let used = 0;
          for (let i = 0; i < max; i++) { if (this.lv(`slotUsed_${lvl}_${i}`, false)) used++; }
          if (used > 0) slotInfo.push(`Level ${lvl}: ${used}/${max} used`);
        }
      }
      if (slotInfo.length) {
        warlockSlotHtml = `
        <div class="rest-modal-section">
          <div class="rest-modal-section-title">Pact Magic — Slots Restored on Short Rest</div>
          <ul class="rest-feature-list">
            ${slotInfo.map(s => `<li><span class="rest-feature-name">${s}</span> <span class="rest-feature-uses">→ will restore</span></li>`).join('')}
          </ul>
        </div>`;
      }
    }

    body.innerHTML = `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Hit Dice</div>
        <div class="sr-hd-status">
          <div class="sr-hd-hp-bar">
            <span class="sr-hd-hp-label">HP</span>
            <span class="sr-hd-hp-val" id="sr-hp-display">${currentHP}</span>
            <span class="sr-hd-hp-sep">/</span>
            <span class="sr-hd-hp-max">${maxHP}</span>
          </div>
          <div class="sr-hd-con">CON ${conMod >= 0 ? '+' : ''}${conMod}</div>
        </div>
        ${dice.length === 0 ? '<p class="rest-modal-empty">No hit dice available — all spent.</p>' : ''}
        <div class="rest-hd-list" id="rest-hd-list"></div>
        <div class="rest-roll-log" id="rest-roll-log"></div>
      </div>
      ${warlockSlotHtml}
      ${(() => {
        if (charClass !== 'Sorcerer' || charLevel < 5) return '';
        const spRes = resources.find(r => r.name === 'Sorcery Points');
        const srRes = resources.find(r => r.name === 'Sorcerous Restoration');
        if (!srRes || srRes.used >= srRes.max) return `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Sorcerous Restoration</div>
        <p class="rest-modal-desc rest-modal-used">Already used — resets on Long Rest.</p>
      </div>`;
        const currentSP = spRes ? (spRes.max - spRes.used) : 0;
        const maxSP = spRes ? spRes.max : 0;
        const canRecover = spRes ? Math.min(4, spRes.used) : 4;
        return `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Sorcerous Restoration <span class="rest-modal-optional-badge">Optional</span></div>
        <p class="rest-modal-desc">You can regain up to <strong>4 Sorcery Points</strong> on this Short Rest. Currently: <strong>${currentSP}/${maxSP} SP</strong> remaining${canRecover > 0 ? ` — would recover <strong>+${canRecover} SP</strong>` : ' — already at max'}.</p>
        <label class="rest-sorcery-opt">
          <input type="checkbox" id="sr-sorcerous-restoration"${canRecover <= 0 ? ' disabled' : ''}>
          Recover ${canRecover} Sorcery Point${canRecover !== 1 ? 's' : ''} (uses Sorcerous Restoration)
        </label>
      </div>`;
      })()}
      ${srResources.length ? `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Features Refreshed on Short Rest</div>
        <ul class="rest-feature-list">
          ${srResources.map(r => `<li><span class="rest-feature-name">${r.name}</span> <span class="rest-feature-uses">(${r.used}/${r.max} uses spent → will reset)</span></li>`).join('')}
        </ul>
      </div>` : ''}
      ${srUsable.length ? `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Once-per-Day Features (Usable During Short Rest)</div>
        <ul class="rest-feature-list">
          ${srUsable.map(r => `<li><span class="rest-feature-name">${r.name}</span> <span class="rest-feature-uses">(available — use before finishing rest)</span></li>`).join('')}
        </ul>
      </div>` : ''}
    `;

    const hdList = body.querySelector('#rest-hd-list');
    const rollLog = body.querySelector('#rest-roll-log');
    const hpDisplay = body.querySelector('#sr-hp-display');
    const liveDice = JSON.parse(JSON.stringify(dice));

    const renderHdButtons = () => {
      hdList.innerHTML = '';
      liveDice.forEach((hd, idx) => {
        const remaining = hd.total - hd.used;
        const wrap = document.createElement('div');
        wrap.className = 'sr-hd-entry';
        wrap.innerHTML = `
          <button class="hd-die-btn rest-hd-btn${remaining <= 0 ? ' disabled' : ''}" ${remaining <= 0 ? 'disabled' : ''}>
            Roll d${hd.die}
          </button>
          <span class="sr-hd-pips">
            ${Array.from({length: hd.total}, (_, i) =>
              `<span class="sr-hd-pip${i < remaining ? ' avail' : ' spent'}"></span>`
            ).join('')}
          </span>
          <span class="sr-hd-count">${remaining}/${hd.total}</span>`;
        wrap.querySelector('button').addEventListener('click', () => {
          if (liveDice[idx].used >= liveDice[idx].total) return;
          const roll = Dice.roll(hd.die);
          const healing = Math.max(1, roll + conMod);
          currentHP = Math.min(maxHP, currentHP + healing);
          liveDice[idx].used++;
          this.sv('hpCurrent', currentHP);
          const hpInput = this.$('hpCurrent');
          if (hpInput) hpInput.value = currentHP;
          this.saveHitDice(liveDice);
          this.renderHitDice();
          if (hpDisplay) hpDisplay.textContent = `${currentHP}`;
          const entry = document.createElement('div');
          entry.className = 'rest-roll-entry';
          entry.innerHTML = `<span class="rest-roll-die">d${hd.die}</span> rolled <strong>${roll}</strong> + ${conMod} CON = <strong class="rest-roll-heal">+${healing} HP</strong>`;
          rollLog.prepend(entry);
          renderHdButtons();
        });
        hdList.appendChild(wrap);
      });
    };
    renderHdButtons();
  },

  _buildLongRestBody(body) {
    this._pendingAttune = null;
    const weaponMastery = this.lv('weaponMastery', []) || [];
    const charClass = this.lv('charClass', '');
    const level = parseInt(this.lv('charLevel', 1)) || 1;
    let masterySlots = 0;
    if (typeof ClassResources !== 'undefined') {
      masterySlots = ClassResources.getMasterySlots(charClass, level);
    } else {
      const classInfo = typeof getClassInfo === 'function' ? getClassInfo(charClass) : null;
      masterySlots = classInfo?.weaponMasteryCount || 0;
    }

    const resources = this.lv('resources', []) || [];
    const lrResources = resources.filter(r => (r.refresh === 'lr' || r.refresh === 'sr') && r.used > 0);

    const maxHP = parseInt(this.lv('hpMax', 0)) || 0;
    const exhaustion = this.lv('combat_exhaustion', 0);

    const masteryHtml = masterySlots > 0 ? `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Weapon Mastery — Swap One Choice</div>
        <p class="rest-modal-desc">You may swap <strong>one</strong> of your ${masterySlots} mastery weapons. Current choices: <strong>${weaponMastery.join(', ') || 'None set'}</strong></p>
        <div class="rest-mastery-swap" id="rest-mastery-swap">
          <label class="rest-label">Swap out:
            <select id="rest-mastery-remove" class="rest-select">
              <option value="">— Keep all current —</option>
              ${weaponMastery.map(w => `<option value="${w}">${w}</option>`).join('')}
            </select>
          </label>
          <label class="rest-label" id="rest-mastery-add-wrap" style="display:none">Replace with:
            <select id="rest-mastery-add" class="rest-select">
              <option value="">— Choose new weapon —</option>
            </select>
          </label>
        </div>
      </div>` : '';

    const inv = this.lv('inventory', []);
    const attunableItems = inv.filter(i => i.reqAttune);
    const attuneCount = attunableItems.filter(i => i.attuned).length;
    const MAX_ATTUNE = 3;
    const attunedNote = attunableItems.length ? `
      <div class="rest-modal-section" id="rest-attune-section">
        <div class="rest-modal-section-title">Attunement <span style="font-size:0.72rem;font-weight:400;color:var(--ink-faint)">(${attuneCount}/${MAX_ATTUNE} slots used)</span></div>
        <p class="rest-modal-desc">Click items to attune or un-attune. Maximum 3 items can be attuned at once.</p>
        <div class="rest-attune-list">
          ${attunableItems.map((it, idx) => `
            <label class="rest-attune-row" data-attune-idx="${idx}">
              <span class="rest-attune-cb${it.attuned ? ' checked' : ''}" data-attune-idx="${idx}"></span>
              <span class="rest-attune-name">${it.name}</span>
              <span class="rest-attune-req">${typeof it.reqAttune === 'string' ? it.reqAttune : ''}</span>
            </label>`).join('')}
        </div>
        <div class="rest-attune-warning" id="rest-attune-warning" style="display:none"></div>
      </div>` : `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Attunement</div>
        <p class="rest-modal-empty">No items in inventory require attunement.</p>
      </div>`;

    const lrResourcesHtml = lrResources.length ? `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Features & Resources Restored</div>
        <ul class="rest-feature-list">
          ${lrResources.map(r => `<li><span class="rest-feature-name">${r.name}</span> <span class="rest-feature-uses">(${r.used}/${r.max} uses spent → will reset)</span></li>`).join('')}
        </ul>
      </div>` : '';

    const isPreparedCaster = typeof ClassResources !== 'undefined' && ClassResources.PREPARED_SPELL_CLASSES.includes(charClass);
    const preparedSpellHtml = isPreparedCaster ? `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Prepared Spells</div>
        <p class="rest-modal-desc">As a <strong>${charClass}</strong>, you may change your prepared spells after completing a Long Rest.</p>
        <button class="btn btn-sm" id="rest-go-spells">Go to Spells Tab</button>
      </div>` : '';

    // Artificer cantrip swap on long rest
    const isArtificer = charClass.toLowerCase() === 'artificer';
    const knownCantrips = isArtificer
      ? (this.lv('charSpells', []) || []).filter(s => s.level === 0 && !s.racial && !s.featSource && !s.subclass && !s.classGranted)
      : [];
    const artificerCantripHtml = isArtificer && knownCantrips.length ? `
      <div class="rest-modal-section" id="rest-artificer-cantrip-section">
        <div class="rest-modal-section-title">Cantrip Swap</div>
        <p class="rest-modal-desc">As an <strong>Artificer</strong>, you may replace one of your cantrips with a different Artificer cantrip.</p>
        <div class="rest-mastery-swap">
          <label class="rest-label">Swap out:
            <select id="rest-cantrip-remove" class="rest-select">
              <option value="">— Keep all current —</option>
              ${knownCantrips.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
            </select>
          </label>
          <label class="rest-label" id="rest-cantrip-add-wrap" style="display:none">Replace with:
            <select id="rest-cantrip-add" class="rest-select">
              <option value="">— Choose new cantrip —</option>
            </select>
          </label>
        </div>
      </div>` : '';

    body.innerHTML = `
      <div class="rest-modal-section rest-summary-section">
        <div class="rest-modal-section-title">Long Rest Summary</div>
        <ul class="rest-summary-list">
          <li>HP restored to maximum <strong>(${maxHP} HP)</strong></li>
          <li>Temporary HP removed</li>
          <li>Half your hit dice restored (minimum 1)</li>
          <li>All spell slots restored</li>
          <li>Death saves reset</li>
          ${exhaustion > 0 ? `<li>Exhaustion reduced from ${exhaustion} to ${exhaustion - 1}</li>` : ''}
        </ul>
      </div>
      ${masteryHtml}
      ${artificerCantripHtml}
      ${lrResourcesHtml}
      ${preparedSpellHtml}
      ${attunedNote}
    `;

    body.querySelector('#rest-go-spells')?.addEventListener('click', () => {
      this._closeRestModal();
      const spellsTab = document.querySelector('[data-tab="spells"]');
      if (spellsTab) spellsTab.click();
    });

    if (masterySlots > 0) {
      const removeSelect = body.querySelector('#rest-mastery-remove');
      const addWrap = body.querySelector('#rest-mastery-add-wrap');
      const addSelect = body.querySelector('#rest-mastery-add');
      if (removeSelect && addSelect && addWrap) {
        const allowRanged = typeof ClassResources !== 'undefined' && ClassResources.allowsRangedMastery(charClass);
        const allWeapons = typeof getWeaponsForMastery === 'function' ? getWeaponsForMastery(allowRanged) : (typeof getMeleeWeaponsForMastery === 'function' ? getMeleeWeaponsForMastery() : []);
        removeSelect.addEventListener('change', () => {
          const swapOut = removeSelect.value;
          if (!swapOut) { addWrap.style.display = 'none'; return; }
          addWrap.style.display = '';
          addSelect.innerHTML = '<option value="">— Choose new weapon —</option>';
          allWeapons.filter(w => !weaponMastery.includes(w.name) || w.name === swapOut).forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.name;
            opt.textContent = `${w.name} (${w.category})`;
            addSelect.appendChild(opt);
          });
        });
      }
    }

    // Bind Artificer cantrip swap selects
    if (isArtificer && knownCantrips.length) {
      const cantripRemove = body.querySelector('#rest-cantrip-remove');
      const cantripAddWrap = body.querySelector('#rest-cantrip-add-wrap');
      const cantripAdd = body.querySelector('#rest-cantrip-add');
      if (cantripRemove && cantripAdd && cantripAddWrap) {
        const allArtificerSpells = typeof getSpellsForClass === 'function' ? getSpellsForClass('Artificer') : [];
        const ua = typeof isUAEnabled === 'function' ? isUAEnabled() : true;
        const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
        const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
        const allCantrips = allArtificerSpells.filter(s => {
          if (s.level !== 0) return false;
          if (s.source === 'UA2024') return ua && show24;
          if (typeof is2024Source === 'function' && is2024Source(s.source)) return show24;
          return show14;
        }).sort((a, b) => a.name.localeCompare(b.name));
        const knownNames = new Set(knownCantrips.map(s => s.name.toLowerCase()));
        cantripRemove.addEventListener('change', () => {
          const swapOut = cantripRemove.value;
          if (!swapOut) { cantripAddWrap.style.display = 'none'; return; }
          cantripAddWrap.style.display = '';
          cantripAdd.innerHTML = '<option value="">— Choose new cantrip —</option>';
          allCantrips.filter(c => !knownNames.has(c.name.toLowerCase()) || c.name === swapOut).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = `${c.name} (${c._schoolName || ''})`;
            cantripAdd.appendChild(opt);
          });
        });
      }
    }

    if (attunableItems.length) {
      const liveAttune = attunableItems.map(it => ({ name: it.name, attuned: !!it.attuned }));
      const updateAttuneDisplay = () => {
        const count = liveAttune.filter(a => a.attuned).length;
        const section = body.querySelector('#rest-attune-section');
        if (!section) return;
        const titleEl = section.querySelector('.rest-modal-section-title');
        if (titleEl) titleEl.innerHTML = `Attunement <span style="font-size:0.72rem;font-weight:400;color:var(--ink-faint)">(${count}/${MAX_ATTUNE} slots used)</span>`;
        liveAttune.forEach((a, idx) => {
          const cb = section.querySelector(`.rest-attune-cb[data-attune-idx="${idx}"]`);
          if (cb) cb.classList.toggle('checked', a.attuned);
        });
      };
      body.querySelectorAll('.rest-attune-row').forEach((row, idx) => {
        row.addEventListener('click', () => {
          const a = liveAttune[idx];
          const warning = body.querySelector('#rest-attune-warning');
          if (!a.attuned && liveAttune.filter(x => x.attuned).length >= MAX_ATTUNE) {
            if (warning) { warning.textContent = 'You can only be attuned to 3 items at once.'; warning.style.display = ''; setTimeout(() => { warning.style.display = 'none'; }, 2500); }
            return;
          }
          a.attuned = !a.attuned;
          updateAttuneDisplay();
        });
      });
      this._pendingAttune = liveAttune;
    } else {
      this._pendingAttune = null;
    }
  },

  _buildDawnBody(body) {
    const resources = this.lv('resources', []) || [];
    const dawnResources = resources.filter(r => r.refresh === 'dawn');

    body.innerHTML = `
      <div class="rest-modal-section">
        <div class="rest-modal-section-title">Dawn</div>
        <p class="rest-modal-desc">The following features and resources recharge at dawn. These are <strong>not</strong> tied to Short or Long Rests — they reset when the sun rises, regardless of when you last rested.</p>
        ${dawnResources.length === 0 ? '<p class="rest-modal-empty">No dawn-refresh features tracked. Add resources with "At Dawn" refresh type.</p>' : `
        <ul class="rest-feature-list">
          ${dawnResources.map(r => {
            const rechargeInfo = r.rechargeRoll ? ` · Recharges: ${r.rechargeRoll}` : '';
            return `<li>
              <span class="rest-feature-name">${r.name}</span>
              <span class="rest-feature-uses">${r.used > 0 ? `(${r.used}/${r.max} uses spent → will reset)` : `(${r.max - r.used}/${r.max} available — already full)`}${rechargeInfo}</span>
              ${r.rechargeRoll ? `<button class="btn btn-sm rest-dawn-roll" data-roll="${r.rechargeRoll}" data-name="${r.name}" style="margin-left:6px;font-size:0.72rem">Roll ${r.rechargeRoll}</button>` : ''}
            </li>`;
          }).join('')}
        </ul>`}
      </div>
    `;

    body.querySelectorAll('.rest-dawn-roll').forEach(btn => {
      btn.addEventListener('click', () => {
        const expr = btn.dataset.roll;
        const result = typeof Dice !== 'undefined' ? Dice.rollDamageString(expr) : null;
        if (result && result.total !== undefined) {
          btn.textContent = `Rolled: ${result.total}`;
          btn.disabled = true;
          Dice.showResult(`${btn.dataset.name} Recharge`, result);
        }
      });
    });
  },

  _doShortRest() {
    this.resetResourcesByType(['sr']);

    // Sorcerer: Sorcerous Restoration (opt-in, once per LR)
    const srCheckbox = document.getElementById('sr-sorcerous-restoration');
    if (srCheckbox && srCheckbox.checked) {
      const resources = this.lv('resources', []);
      const spRes = resources.find(r => r.name === 'Sorcery Points');
      const srFeat = resources.find(r => r.name === 'Sorcerous Restoration');
      if (spRes && srFeat && srFeat.used < srFeat.max) {
        const recover = Math.min(4, spRes.used);
        spRes.used = Math.max(0, spRes.used - recover);
        srFeat.used = srFeat.max;
        this.sv('resources', resources);
        this.renderResources();
      }
    }

    const charClass = this.lv('charClass', '');
    if (charClass === 'Warlock') {
      for (let lvl = 1; lvl <= 9; lvl++) {
        const max = this.lv(`slotMax_${lvl}`, 0);
        for (let i = 0; i < max; i++) {
          this.sv(`slotUsed_${lvl}_${i}`, false);
        }
      }
      this.buildSpellSlots();
    }

    this.renderHitDice();
  },

  _doLongRest(body) {
    const maxHP = parseInt(this.lv('hpMax', 0)) || 0;
    this.sv('hpCurrent', maxHP);
    const hpInput = this.$('hpCurrent');
    if (hpInput) hpInput.value = maxHP;

    this.sv('hpTemp', 0);
    const tempInput = this.$('hpTemp');
    if (tempInput) tempInput.value = 0;

    const dice = this.getHitDice();
    dice.forEach(hd => {
      if (hd.used > 0) {
        const restored = Math.max(1, Math.floor(hd.total / 2));
        hd.used = Math.max(0, hd.used - restored);
      }
    });
    this.saveHitDice(dice);
    this.renderHitDice();

    for (let lvl = 1; lvl <= 9; lvl++) {
      const max = this.lv(`slotMax_${lvl}`, 0);
      for (let i = 0; i < max; i++) {
        this.sv(`slotUsed_${lvl}_${i}`, false);
      }
    }

    for (let i = 0; i < 3; i++) {
      this.sv(`ds${i}`, false);
      this.sv(`df${i}`, false);
      const ds = document.querySelector(`[data-save="ds${i}"]`);
      const df = document.querySelector(`[data-save="df${i}"]`);
      if (ds) ds.classList.remove('filled');
      if (df) df.classList.remove('filled');
    }

    this.resetResourcesByType(['lr', 'sr']);

    const exhaustion = this.lv('combat_exhaustion', 0);
    if (exhaustion > 0) this.sv('combat_exhaustion', exhaustion - 1);

    this.sv('combat_concentrating', false);
    this.sv('combat_concSpell', '');

    if (this._pendingAttune) {
      const inv = this.lv('inventory', []);
      this._pendingAttune.forEach(a => {
        const it = inv.find(i => i.name === a.name);
        if (it) it.attuned = a.attuned;
      });
      this.sv('inventory', inv);
      this._pendingAttune = null;
      this.renderMagicItems();
    }

    if (body) {
      const removeSelect = body.querySelector('#rest-mastery-remove');
      const addSelect = body.querySelector('#rest-mastery-add');
      if (removeSelect?.value && addSelect?.value) {
        const mastery = this.lv('weaponMastery', []) || [];
        const idx = mastery.indexOf(removeSelect.value);
        if (idx >= 0) mastery[idx] = addSelect.value;
        this.sv('weaponMastery', mastery);
      }

      // Artificer cantrip swap
      const cantripRemove = body.querySelector('#rest-cantrip-remove');
      const cantripAdd = body.querySelector('#rest-cantrip-add');
      if (cantripRemove?.value && cantripAdd?.value) {
        const spells = this.lv('charSpells', []) || [];
        const idx = spells.findIndex(s => s.name === cantripRemove.value && s.level === 0);
        if (idx !== -1) spells.splice(idx, 1);
        if (!spells.some(s => s.name === cantripAdd.value && s.level === 0)) {
          spells.push({ name: cantripAdd.value, level: 0, prepared: true });
        }
        this.sv('charSpells', spells);
      }
    }

    this.buildSpellSlots();
    this.restoreSpells();
    this.recalcAll();
  },

  _doDawn() {
    this.resetResourcesByType(['dawn']);
  },

  initEquippedGear() {
    this.renderEquippedGear();
  },

  // ---- Main render ----
  renderEquippedGear() {
    const slotsEl = this.$('equipped-slots');
    if (!slotsEl) return;
    const inv      = this.lv('inventory', []);
    const equipped = this.lv('equippedGear', {});
    const active   = this.lv('equippedGearActive', {});
    const versatileMode = this.lv('versatileMode', {}); // { slotKey: '2h' | '1h' }

    // Resolve items
    const slotItems = {};
    this.EQUIPMENT_SLOTS.forEach(s => {
      slotItems[s.key] = equipped[s.key] ? inv.find(i => i.itemId === equipped[s.key]) : null;
    });

    // ---- Hand-slot blocking rules ----
    const blockedSlots = new Set();
    const rhItem = slotItems.rightHand;
    const lhItem = slotItems.leftHand;
    const rhActive = !!active.rightHand;
    const lhActive = !!active.leftHand;

    // Rule: if right-hand has a two-handed weapon (or versatile in 2h mode) → block left hand
    const rhIs2H = rhItem && (this._isTwoHanded(rhItem) ||
      (this._isVersatile(rhItem) && (versatileMode.rightHand || '1h') === '2h'));
    if (rhIs2H && rhActive) blockedSlots.add('leftHand');

    // Symmetric: if left-hand has a two-handed weapon → block right hand
    const lhIs2H = lhItem && (this._isTwoHanded(lhItem) ||
      (this._isVersatile(lhItem) && (versatileMode.leftHand || '1h') === '2h'));
    if (lhIs2H && lhActive) blockedSlots.add('rightHand');

    slotsEl.innerHTML = '';

    // Proficiency check helpers
    const armorProf = this.lv('classArmorProf', []).map(p => p.toLowerCase());
    const hasArmorProf = (item) => {
      if (!item) return true;
      const tc = (item.typeCode || '').toUpperCase();
      if (tc === 'LA') return armorProf.some(p => p.includes('light'));
      if (tc === 'MA') return armorProf.some(p => p.includes('medium'));
      if (tc === 'HA') return armorProf.some(p => p.includes('heavy'));
      if (tc === 'S' || this._isShieldItem(item)) return armorProf.some(p => p.includes('shield'));
      return true;
    };

    // Helper: build a single slot row
    const buildSlotRow = (slot) => {
      const item     = slotItems[slot.key];
      const isActive = !!active[slot.key];
      const isEmpty  = !item;
      const isBlocked = blockedSlots.has(slot.key);
      const isHand   = slot.key === 'rightHand' || slot.key === 'leftHand';
      const isVersatile = item && this._isVersatile(item) && isHand;
      const vMode = versatileMode[slot.key] || '1h';
      const isProficient = hasArmorProf(item);

      const row = document.createElement('div');
      row.className = 'equip-slot-row' + (isActive ? ' equip-slot-active' : '');

      // Checkbox
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'equip-active-cb' + (isBlocked && !isActive ? ' equip-cb-blocked' : '');
      cb.dataset.slot = slot.key;
      cb.dataset.blocked = isBlocked ? '1' : '0';
      cb.checked = isActive;
      cb.disabled = isEmpty;
      if (isBlocked && !isActive) {
        const blockingItem = slot.key === 'leftHand' ? rhItem : lhItem;
        const blockingHand = slot.key === 'leftHand' ? 'right hand' : 'left hand';
        cb.dataset.tooltip = blockingItem
          ? `Blocked — ${blockingItem.name} equipped in ${blockingHand} requires both hands`
          : 'Blocked — other hand requires both hands';
      }
      row.appendChild(cb);

      // Label
      const label = document.createElement('span');
      label.className = 'equip-slot-label';
      label.textContent = `${slot.icon} ${slot.label}`;
      row.appendChild(label);

      if (item) {
        let detail = '';
        if (item.damage) {
          if (isVersatile && vMode === '2h' && item.damage.includes('versatile')) {
            const m = item.damage.match(/\(([^)]+)\s*versatile\)/);
            detail += m ? m[1] : item.damage;
          } else {
            detail += item.damage.replace(/\s*\([^)]*versatile\)/, '');
          }
        }
        if (item.ac) detail += (detail ? ' · ' : '') + `AC ${item.ac}`;
        if (item.rarity && item.rarity !== 'none') detail += (detail ? ' · ' : '') + item.rarity;

        const info = document.createElement('div');
        info.className = 'equip-slot-item';
        info.innerHTML = `<span class="equip-slot-name">${item.name}</span>${detail ? `<span class="equip-slot-detail">${detail}</span>` : ''}`;
        row.appendChild(info);

        if (item && isActive && !isProficient) {
          const warn = document.createElement('span');
          warn.className = 'equip-noprof-warn';
          const isShield = this._isShieldItem(item);
          warn.textContent = '⚠';
          warn.dataset.tooltip = isShield
            ? 'No shield training — AC bonus not applied'
            : 'No armor training — Disadvantage on Str/Dex checks and cannot cast spells';
          row.appendChild(warn);
        }

        if (isVersatile) {
          const vBtn = document.createElement('button');
          vBtn.className = 'equip-versatile-btn' + (vMode === '2h' ? ' v-two-hand' : '');
          vBtn.title = vMode === '2h' ? 'Using two hands — click for one hand' : 'Using one hand — click for two hands';
          vBtn.textContent = vMode === '2h' ? '2H' : '1H';
          vBtn.dataset.slot = slot.key;
          row.appendChild(vBtn);
        }

        if (isHand && this._isShieldItem(item)) {
          const emblemKey = 'emblem_' + slot.key;
          const emblId    = equipped[emblemKey];
          const emblItem  = emblId ? inv.find(i => i.itemId === emblId) : null;
          const emBtn = document.createElement('button');
          emBtn.className = 'equip-versatile-btn equip-emblem-btn' + (emblItem ? ' v-two-hand' : '');
          emBtn.dataset.slot = emblemKey;
          emBtn.title = emblItem ? `Emblem: ${emblItem.name}` : 'Attach emblem';
          emBtn.textContent = 'EM';
          row.appendChild(emBtn);
        }

        const swapBtn = document.createElement('button');
        swapBtn.className = 'equip-swap-btn';
        swapBtn.dataset.slot = slot.key;
        swapBtn.title = 'Swap item';
        swapBtn.textContent = '⇄';
        row.appendChild(swapBtn);

        const del = document.createElement('button');
        del.className = 'equip-unequip-btn';
        del.dataset.slot = slot.key;
        del.title = 'Remove from slot';
        del.textContent = '✕';
        row.appendChild(del);
      } else {
        const emptyBtn = document.createElement('button');
        emptyBtn.className = 'equip-empty-btn';
        emptyBtn.dataset.slot = slot.key;
        emptyBtn.textContent = '— empty —';
        row.appendChild(emptyBtn);
      }
      return row;
    };

    // Build two-column layout
    const grid = document.createElement('div');
    grid.className = 'equip-grid';

    const colL = document.createElement('div');
    colL.className = 'equip-col';
    this.EQUIP_LEFT.forEach(slot => colL.appendChild(buildSlotRow(slot)));

    const colR = document.createElement('div');
    colR.className = 'equip-col';
    this.EQUIP_RIGHT.forEach(slot => colR.appendChild(buildSlotRow(slot)));

    grid.appendChild(colL);
    grid.appendChild(colR);
    slotsEl.appendChild(grid);

    // ---- Event handlers ----

    // Checkbox — enforce hand rules when activating
    slotsEl.querySelectorAll('.equip-active-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked && cb.dataset.blocked === '1') { cb.checked = false; return; }
        const slotKey = cb.dataset.slot;
        const g = this.lv('equippedGear', {});
        const a = this.lv('equippedGearActive', {});
        if (cb.checked) {
          a[slotKey] = true;
          // Activating a hand slot → deactivate the other hand if conflict
          if (slotKey === 'rightHand' || slotKey === 'leftHand') {
            const item = g[slotKey] ? inv.find(i => i.itemId === g[slotKey]) : null;
            const vm   = this.lv('versatileMode', {});
            const is2H = item && (this._isTwoHanded(item) ||
              (this._isVersatile(item) && (vm[slotKey] || '1h') === '2h'));
            if (is2H) {
              const other = slotKey === 'rightHand' ? 'leftHand' : 'rightHand';
              delete a[other]; // deactivate only, keep the item in slot
            }
          }
        } else {
          delete a[slotKey];
        }
        this.sv('equippedGearActive', a);
        this.renderEquippedGear();
      });
    });

    // Emblem button — opens popup filtered to emblems, with a "Remove" option at top
    slotsEl.querySelectorAll('.equip-emblem-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const emblemKey = btn.dataset.slot;
        document.querySelector('.equip-swap-popup')?.remove();
        const emblems   = this._getEquipOptions(emblemKey, inv);
        const currentId = equipped[emblemKey];

        const popup = document.createElement('div');
        popup.className = 'equip-swap-popup';

        // Remove option (if one is attached)
        if (currentId) {
          const removeRow = document.createElement('div');
          removeRow.className = 'equip-swap-option';
          removeRow.innerHTML = `<span class="equip-swap-opt-name" style="color:var(--red)">✕ Remove emblem</span>`;
          removeRow.addEventListener('click', () => {
            popup.remove();
            const g = this.lv('equippedGear', {});
            delete g[emblemKey];
            this.sv('equippedGear', g);
            this.renderEquippedGear();
          });
          popup.appendChild(removeRow);
        }

        emblems.forEach(opt => {
          const isCurrent = opt.itemId === currentId;
          const optRow = document.createElement('div');
          optRow.className = 'equip-swap-option' + (isCurrent ? ' equip-swap-current' : '');
          optRow.innerHTML = `<span class="equip-swap-opt-name">${isCurrent ? '✓ ' : ''}${opt.name}</span>`;
          if (!isCurrent) {
            optRow.addEventListener('click', () => {
              popup.remove();
              const g = this.lv('equippedGear', {});
              g[emblemKey] = opt.itemId;
              this.sv('equippedGear', g);
              this.renderEquippedGear();
            });
          }
          popup.appendChild(optRow);
        });

        if (!emblems.length && !currentId) {
          popup.innerHTML = `<div class="equip-swap-empty">No emblems in inventory</div>`;
        }

        btn.after(popup);
        if (popup.getBoundingClientRect().bottom > window.innerHeight) popup.style.bottom = '100%';
        const close = (ev) => {
          if (!popup.contains(ev.target) && ev.target !== btn) {
            popup.remove(); document.removeEventListener('click', close, true);
          }
        };
        setTimeout(() => document.addEventListener('click', close, true), 0);
      });
    });

    // Versatile toggle
    slotsEl.querySelectorAll('.equip-versatile-btn:not(.equip-emblem-btn)').forEach(btn => {
      btn.addEventListener('click', () => {
        const vm = this.lv('versatileMode', {});
        const slotKey = btn.dataset.slot;
        vm[slotKey] = vm[slotKey] === '2h' ? '1h' : '2h';
        this.sv('versatileMode', vm);
        // If switching to 2h and other hand is active, deactivate the other hand
        if (vm[slotKey] === '2h') {
          const other = slotKey === 'rightHand' ? 'leftHand' : 'rightHand';
          const a = this.lv('equippedGearActive', {});
          if (a[other]) { delete a[other]; this.sv('equippedGearActive', a); }
        }
        this._syncVersatileToAttacks(slotKey, vm[slotKey]);
        this.renderEquippedGear();
      });
    });

    // Popup opener — shared by swap & empty buttons
    const openEquipPopup = (anchor, slotKey) => {
      document.querySelector('.equip-swap-popup')?.remove();
      const currentId = equipped[slotKey];
      const options = this._getEquipOptions(slotKey, inv);

      const popup = document.createElement('div');
      popup.className = 'equip-swap-popup';

      options.forEach(opt => {
        const isCurrent = opt.itemId === currentId;
        const optRow = document.createElement('div');
        optRow.className = 'equip-swap-option' + (isCurrent ? ' equip-swap-current' : '');
        let detail = '';
        if (opt.damage) detail += opt.damage;
        if (opt.properties) detail += (detail ? ' · ' : '') + opt.properties;
        if (opt.ac) detail += (detail ? ' · ' : '') + `AC ${opt.ac}`;
        optRow.innerHTML = `
          <span class="equip-swap-opt-name">${isCurrent ? '✓ ' : ''}${opt.name}</span>
          ${detail ? `<span class="equip-swap-opt-detail">${detail}</span>` : ''}`;
        if (!isCurrent) {
          optRow.addEventListener('click', () => {
            popup.remove();
            this._equipItemToSlot(slotKey, opt.itemId);
          });
        }
        popup.appendChild(optRow);
      });

      if (!options.length) {
        popup.innerHTML = `<div class="equip-swap-empty">No items available in inventory</div>`;
      }
      anchor.after(popup);
      if (popup.getBoundingClientRect().bottom > window.innerHeight) popup.style.bottom = '100%';

      const close = (ev) => {
        if (!popup.contains(ev.target) && ev.target !== anchor) {
          popup.remove(); document.removeEventListener('click', close, true);
        }
      };
      setTimeout(() => document.addEventListener('click', close, true), 0);
    };

    slotsEl.querySelectorAll('.equip-swap-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openEquipPopup(btn, btn.dataset.slot); });
    });
    slotsEl.querySelectorAll('.equip-empty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openEquipPopup(btn, btn.dataset.slot); });
    });

    // Remove button
    slotsEl.querySelectorAll('.equip-unequip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = this.lv('equippedGear', {});
        const a = this.lv('equippedGearActive', {});
        delete g[btn.dataset.slot]; delete a[btn.dataset.slot];
        this.sv('equippedGear', g); this.sv('equippedGearActive', a);
        this.renderEquippedGear();
      });
    });

    this._updateEquippedACSummary();
    this._renderConditions();
  },

  // Equip an item to a slot — applies two-handed rules
  _equipItemToSlot(slotKey, itemId) {
    const inv = this.lv('inventory', []);
    const g   = this.lv('equippedGear', {});
    const a   = this.lv('equippedGearActive', {});
    const chosenItem = inv.find(i => i.itemId === itemId);

    // Two-handed weapon in either hand → deactivate the other hand (keep item in slot)
    if ((slotKey === 'rightHand' || slotKey === 'leftHand') && chosenItem && this._isTwoHanded(chosenItem)) {
      const other = slotKey === 'rightHand' ? 'leftHand' : 'rightHand';
      delete a[other];
    }

    g[slotKey] = itemId;
    this.sv('equippedGear', g);
    this.sv('equippedGearActive', a);
    this.renderEquippedGear();
  },

  // ---- Slot filtering: what items can go in each slot ----
  _getEquipOptions(slot, inv) {
    // Emblem sub-slots (shield attachment)
    if (slot === 'emblem_rightHand' || slot === 'emblem_leftHand') return inv.filter(i => this._isEmblemItem(i));
    // Hand slots: weapons, shields, and held spellcasting focuses (not amulets — those are worn)
    if (slot === 'rightHand') return inv.filter(i => i.category === 'weapon' || this._isShieldItem(i) || this._isHeldFocus(i));
    if (slot === 'leftHand')  return inv.filter(i => i.category === 'weapon' || this._isShieldItem(i) || this._isHeldFocus(i));
    // Body armor (no shields)
    if (slot === 'armor')  return inv.filter(i => i.category === 'armor' && !this._isShieldItem(i) && !this._isEmblemItem(i) && (i.typeCode || '').toUpperCase() !== 'SCF');
    // Wearable accessory slots — match by type label or wondrous items
    if (slot === 'head')     return inv.filter(i => this._matchesWearSlot(i, 'head'));
    if (slot === 'cloak')    return inv.filter(i => this._matchesWearSlot(i, 'cloak'));
    if (slot === 'boots')    return inv.filter(i => this._matchesWearSlot(i, 'boots'));
    if (slot === 'necklace') return inv.filter(i => this._matchesWearSlot(i, 'necklace'));
    if (slot === 'ring1' || slot === 'ring2') return inv.filter(i => this._matchesWearSlot(i, 'ring'));
    if (slot === 'gloves') return inv.filter(i => this._matchesWearSlot(i, 'gloves'));
    return inv;
  },

  // Check if an inventory item fits a wearable slot
  _matchesWearSlot(item, slot) {
    const name = (item.name || '').toLowerCase();
    const type = (item.type || '').toLowerCase();
    const tc   = (item.typeCode || '').toUpperCase();
    if (slot === 'ring')     return tc === 'RG' || type === 'ring';
    // Neck: amulet (worn holy symbol), necklace-type items only — not held focuses
    if (slot === 'necklace') return /amulet|necklace|pendant|periapt|medallion|brooch/i.test(name) || /amulet|necklace/i.test(type);
    if (slot === 'cloak')    return /cloak|cape|mantle/i.test(name);
    if (slot === 'head')     return /helm|hat\b|crown|circlet|headband|cap\b|hood\b|mask\b|goggles/i.test(name);
    if (slot === 'boots')    return /boot|shoe|slipper|sandal|greaves/i.test(name);
    if (slot === 'gloves')   return /glove|gauntlet|bracers?|vambrace/i.test(name);
    return false;
  },

  // Returns 'disadvantage' if wearing armor without proficiency, otherwise undefined
  _armorDisadvantageMode() {
    const inv      = this.lv('inventory', []);
    const equipped = this.lv('equippedGear', {});
    const active   = this.lv('equippedGearActive', {});
    const armorId  = equipped.armor;
    if (!armorId || !active.armor) return undefined;
    const armor = inv.find(i => i.itemId === armorId);
    if (!armor) return undefined;
    const tc = (armor.typeCode || '').toUpperCase();
    if (tc !== 'LA' && tc !== 'MA' && tc !== 'HA') return undefined;
    const armorProf = this.lv('classArmorProf', []).map(p => p.toLowerCase());
    if (tc === 'LA' && armorProf.some(p => p.includes('light'))) return undefined;
    if (tc === 'MA' && armorProf.some(p => p.includes('medium'))) return undefined;
    if (tc === 'HA' && armorProf.some(p => p.includes('heavy'))) return undefined;
    return 'disadvantage';
  },

  _isShieldItem(item) {
    return /shield/i.test(item.name || '') || /shield/i.test(item.type || '');
  },

  // Spellcasting focuses that must be held in hand (arcane, druidic, reliquary)
  // Amulets worn → Neck slot. Emblems go on shields → emblem sub-slot only.
  _isHeldFocus(item) {
    const tc   = (item.typeCode || '').toUpperCase();
    const name = (item.name || '').toLowerCase();

    // College of Spirits: Playing Cards, Crystal, Orb, Candle, Ink Pen as arcane focus
    if (this.lv('charSubclass', '') === 'College of Spirits') {
      if (/gaming set|playing card|crystal|^orb$|orb\b|candle|ink pen/i.test(item.name || '')) return true;
    }

    if (tc !== 'SCF') return false;
    if (/amulet/i.test(name)) return false;  // worn, goes in Neck
    if (this._isEmblemItem(item)) return false; // on shield, not hand directly
    return true;
  },

  _isEmblemItem(item) {
    return /emblem/i.test(item.name || '');
  },

  _isTwoHanded(item) {
    return /two.?hand/i.test(item.properties || '');
  },

  _isVersatile(item) {
    return /versatile/i.test(item.properties || '') || /versatile/i.test(item.damage || '');
  },

  // When versatile toggle changes, update matching attack table rows
  _syncVersatileToAttacks(slotKey, mode) {
    const equipped = this.lv('equippedGear', {});
    const itemId = equipped[slotKey];
    if (!itemId) return;
    const inv = this.lv('inventory', []);
    const item = inv.find(i => i.itemId === itemId);
    if (!item || !item.damage || !this._isVersatile(item)) return;

    // Extract 1H and 2H dice from damage string like "1d8 slashing (1d10 versatile)"
    const versMatch = item.damage.match(/\(([^)]+)\s*versatile\)/i);
    if (!versMatch) return;
    const twoDice = versMatch[1].trim();                          // e.g. "1d10"
    const oneDice = item.damage.replace(/\s*\([^)]*versatile\)/i, '').match(/(\d+d\d+)/)?.[1]; // e.g. "1d8"
    if (!oneDice) return;

    const newDice = mode === '2h' ? twoDice : oneDice;
    const weaponName = (item.name || '').toLowerCase().trim();

    // Update attack rows in DOM and storage that match this weapon name
    let changed = false;
    this.qsa('#attacks-body tr').forEach(tr => {
      const nameInput = tr.querySelector('.atk-name');
      if (!nameInput || nameInput.value.toLowerCase().trim() !== weaponName) return;
      const diceEdit = tr.querySelector('.atk-dice-edit');
      if (diceEdit) {
        diceEdit.value = newDice;
        if (tr._refreshRow) tr._refreshRow();
      }
      changed = true;
    });
    if (changed) this.saveAttacks();
  },

  _updateEquippedACSummary() {
    const inv      = this.lv('inventory', []);
    const equipped = this.lv('equippedGear', {});
    const active   = this.lv('equippedGearActive', {});

    const armor  = (equipped.armor && active.armor) ? inv.find(i => i.itemId === equipped.armor) : null;
    // Shield can be in either hand
    let shield = null;
    ['rightHand','leftHand'].forEach(h => {
      if (equipped[h] && active[h]) {
        const it = inv.find(i => i.itemId === equipped[h]);
        if (it && this._isShieldItem(it)) shield = it;
      }
    });
    const dexMod = this.getModFromScore(this.getAbilityScore('dex'));
    let ac;
    if (armor) {
      const type = (armor.type || '').toLowerCase();
      const baseAC = armor.ac || 10;
      if (type.includes('heavy')) ac = baseAC;
      else if (type.includes('medium')) ac = baseAC + Math.min(dexMod, 2);
      else ac = baseAC + dexMod;
    } else {
      // Check for Unarmored Defense when no armor is equipped
      const unarmoredDef = this.lv('subclassUnarmoredDefense', null);
      if (unarmoredDef?.abilities?.length && !shield) {
        // Subclass unarmored defense (e.g. College of Dance: 10 + Dex + Cha)
        ac = 10 + unarmoredDef.abilities.reduce((sum, ab) => sum + (this.getModFromScore(this.getAbilityScore(ab)) || 0), 0);
      } else {
        const className = (this.lv('charClass', '')).toLowerCase();
        if (className === 'barbarian') {
          const conMod = this.getModFromScore(this.getAbilityScore('con'));
          ac = 10 + dexMod + conMod;
        } else if (className === 'monk') {
          const wisMod = this.getModFromScore(this.getAbilityScore('wis'));
          ac = 10 + dexMod + wisMod;
        } else {
          ac = 10 + dexMod;
        }
      }
    }
    const shieldProf = this.lv('classArmorProf', []).some(p => p.toLowerCase().includes('shield'));
    if (shield && shieldProf) ac += (shield.ac || 2);

    // Store base AC before cover
    this._baseAC = ac;
    this._applyCoverToAC();
  },

  /* ---- COVER SYSTEM ---- */
  _initCoverButtons() {
    const btns = document.querySelectorAll('.cover-btn');
    const saved = this.lv('coverLevel', '0');
    btns.forEach(btn => {
      if (btn.dataset.cover === saved) btn.classList.add('active');
      btn.addEventListener('click', () => {
        const val = btn.dataset.cover;
        const current = this.lv('coverLevel', '0');
        // Toggle: clicking active cover resets to none
        const newVal = (val === current && val !== '0') ? '0' : val;
        this.sv('coverLevel', newVal);
        btns.forEach(b => b.classList.toggle('active', b.dataset.cover === newVal));
        this.recalcAll();
      });
    });
  },

  _applyCoverToAC() {
    const acInput = this.$('armorClass');
    if (!acInput) return;
    const base = this._baseAC != null ? this._baseAC : (parseInt(this.lv('armorClass', 10)) || 10);
    const cover = this.lv('coverLevel', '0');
    let ac = base;
    if (cover === '2') ac = base + 2;
    else if (cover === '5') ac = base + 5;
    else if (cover === 'total') ac = base; // Total cover: can't be targeted, AC unchanged
    acInput.value = ac;
    this.sv('armorClass', ac);
  },

  _getCoverBonus() {
    const cover = this.lv('coverLevel', '0');
    if (cover === '2') return 2;
    if (cover === '5') return 5;
    return 0;
  },

  /* ---- CONDITION EFFECTS: glow on affected roll buttons ---- */
  applyConditionEffects() {
    // Clear all condition glow classes, tooltips, and event listeners
    this.$('speed-effective')?.remove();
    document.querySelectorAll('.cond-fail-glow, .cond-dis-glow, .cond-pen-glow, .cond-adv-glow').forEach(el => {
      el.classList.remove('cond-fail-glow', 'cond-dis-glow', 'cond-pen-glow', 'cond-adv-glow');
      el.removeAttribute('data-cond-tip');
      el.removeAttribute('title');
      // Remove old hover listeners by replacing with clone
      if (el._condEnter) {
        el.removeEventListener('mouseenter', el._condEnter);
        el.removeEventListener('mouseleave', el._condLeave);
        delete el._condEnter;
        delete el._condLeave;
      }
    });
    this._hideConditionTooltip();

    const active = this.lv('conditions', []);
    const exhaustionLevel = this.lv('combat_exhaustion', 0);
    if (!active.length && exhaustionLevel === 0) return;

    const fx = ConditionRules.getStatEffects(active, exhaustionLevel);

    // Speed glow
    if (fx.speed) {
      const speedEl = this.$('speed');
      if (speedEl) {
        let label;
        if (fx.speed.type === 'zero') label = 'Speed 0: ' + fx.speed.sources.join(', ');
        else if (fx.speed.type === 'halved') label = 'Speed halved: ' + fx.speed.sources.join(', ');
        else label = 'Speed reduced: ' + fx.speed.sources.join(', ');
        this._applyCondGlow(speedEl, 'dis', label);
      }
    }

    // AC glow — enemies have advantage on attacks against you
    if (fx.attacksAgainst) {
      const acEl = this.$('armorClass');
      if (acEl) {
        const label = 'Attacks against you have Adv: ' + fx.attacksAgainst.sources.join(', ');
        this._applyCondGlow(acEl, 'dis', label);
      }
    }

    // Cover glow — total cover = adv glow on AC, cover bonus = adv glow on Dex save
    const coverLvl = this.lv('coverLevel', '0');
    if (coverLvl === 'total') {
      const acEl = this.$('armorClass');
      if (acEl && !acEl.classList.contains('cond-dis-glow') && !acEl.classList.contains('cond-fail-glow')) {
        this._applyCondGlow(acEl, 'adv', 'Total Cover — can\'t be targeted directly');
      }
    }
    if (coverLvl === '2' || coverLvl === '5') {
      const dexSaveEl = this.$('save-dex');
      if (dexSaveEl && !dexSaveEl.classList.contains('cond-fail-glow') && !dexSaveEl.classList.contains('cond-dis-glow')) {
        this._applyCondGlow(dexSaveEl, 'adv', `Cover (+${coverLvl} to Dex saves)`);
      }
    }

    // Attack roll glow
    if (fx.attackRolls) {
      const isFail = fx.attackRolls.type === 'auto-fail';
      const isDis = fx.attackRolls.type === 'disadvantage';
      const label = (isFail ? 'Auto-fail: ' : isDis ? 'Disadv: ' : 'Adv: ') + fx.attackRolls.sources.join(', ');
      const cls = isFail ? 'fail' : isDis ? 'dis' : 'adv';
      this.qsa('.atk-bonus-btn').forEach(btn => this._applyCondGlow(btn, cls, label));
      const spAtkEl = this.$('spellAttackBonus');
      if (spAtkEl) this._applyCondGlow(spAtkEl, cls, label);
    }

    // Save glow
    this.ABILITIES.forEach(ab => {
      if (fx.saves[ab]) {
        const el = this.$(`save-${ab}`);
        if (el) {
          const isAutoFail = fx.saves[ab].type === 'auto-fail';
          const label = (isAutoFail ? 'Auto-fail: ' : 'Disadv: ') + fx.saves[ab].sources.join(', ');
          this._applyCondGlow(el, isAutoFail ? 'fail' : 'dis', label);
        }
      }
    });

    // Ability check glow
    if (fx.abilityChecks) {
      const label = 'Disadv: ' + fx.abilityChecks.sources.join(', ');
      this.qsa('.stat-val-btn').forEach(btn => {
        if (btn.id && btn.id.startsWith('skill-')) this._applyCondGlow(btn, 'dis', label);
      });
      const initEl = this.$('initiative');
      if (initEl) this._applyCondGlow(initEl, 'dis', label);
    }

    // Exhaustion — yellow penalty glow on all d20 test buttons, and apply penalty directly to displayed numbers
    if (exhaustionLevel > 0) {
      const penalty = 2 * exhaustionLevel;
      const label = `Exhaustion ${exhaustionLevel}: −${penalty} (included in modifier)`;
      // Apply penalty glow to initiative, saves, skills, attacks (only if not already glowing)
      const penTargets = [];
      const initEl = this.$('initiative');
      if (initEl && !initEl.classList.contains('cond-fail-glow') && !initEl.classList.contains('cond-dis-glow'))
        penTargets.push(initEl);
      this.ABILITIES.forEach(ab => {
        const el = this.$(`save-${ab}`);
        if (el && !el.classList.contains('cond-fail-glow') && !el.classList.contains('cond-dis-glow'))
          penTargets.push(el);
      });
      this.qsa('.stat-val-btn').forEach(btn => {
        if (btn.id && btn.id.startsWith('skill-') && !btn.classList.contains('cond-fail-glow') && !btn.classList.contains('cond-dis-glow'))
          penTargets.push(btn);
      });
      this.qsa('.atk-bonus-btn').forEach(btn => {
        if (!btn.classList.contains('cond-fail-glow') && !btn.classList.contains('cond-dis-glow'))
          penTargets.push(btn);
      });
      penTargets.forEach(el => this._applyCondGlow(el, 'pen', label));

      // Apply penalty directly to displayed d20 modifier numbers
      const applyPen = el => {
        if (!el) return;
        const base = parseInt(el.textContent) || 0;
        el.textContent = this.fmtMod(base - penalty);
      };
      applyPen(this.$('initiative'));
      this.ABILITIES.forEach(ab => applyPen(this.$(`save-${ab}`)));
      this.qsa('.stat-val-btn').forEach(btn => {
        if (btn.id && (btn.id.startsWith('skill-') || btn.id.startsWith('tool-val-'))) applyPen(btn);
      });
      this.qsa('.atk-bonus-btn').forEach(btn => applyPen(btn));
      applyPen(this.$('spellAttackBonus'));

      // Show effective speed below the speed input
      const speedInput = this.$('speed');
      if (speedInput) {
        const baseSpeed = parseInt(speedInput.value) || 30;
        const effectiveSpeed = Math.max(0, baseSpeed - 5 * exhaustionLevel);
        const effEl = document.createElement('div');
        effEl.id = 'speed-effective';
        effEl.className = 'speed-effective-display';
        effEl.textContent = `→ ${effectiveSpeed} ft`;
        speedInput.closest('.combat-box')?.appendChild(effEl);
      }
    }
  },

  _applyCondGlow(el, type, tipText) {
    // type: 'fail' (red), 'dis' (orange), 'pen' (yellow), 'adv' (green)
    const glowClasses = { fail: 'cond-fail-glow', dis: 'cond-dis-glow', pen: 'cond-pen-glow', adv: 'cond-adv-glow' };
    el.classList.add(glowClasses[type] || 'cond-dis-glow');
    el.dataset.condTip = tipText;
    // Rich tooltip on hover (same style as condition tooltips)
    const enter = (e) => {
      this._hideConditionTooltip();
      const tip = document.createElement('div');
      tip.className = 'condition-tooltip';
      tip.id = 'condition-tooltip-active';
      const kwMap = { fail: 'cond-kw-bad', dis: 'cond-kw-bad', pen: 'cond-kw-mech', adv: 'cond-kw-good' };
      const wordMap = { fail: 'Auto-Fail', dis: 'Disadvantage', pen: 'Penalty', adv: 'Advantage' };
      const kwClass = kwMap[type] || 'cond-kw-bad';
      const modeWord = wordMap[type] || 'Disadvantage';
      tip.innerHTML = `<span class="${kwClass}">${modeWord}</span> — ${tipText}`;
      document.body.appendChild(tip);
      const rect = e.target.getBoundingClientRect();
      let top = rect.bottom + 6;
      let left = rect.left;
      requestAnimationFrame(() => {
        const tr = tip.getBoundingClientRect();
        if (top + tr.height > window.innerHeight - 8) top = rect.top - tr.height - 6;
        if (left + tr.width > window.innerWidth - 8) left = window.innerWidth - tr.width - 8;
        if (left < 8) left = 8;
        tip.style.top = top + 'px';
        tip.style.left = left + 'px';
        tip.classList.add('show');
      });
      tip.style.top = top + 'px';
      tip.style.left = left + 'px';
    };
    const leave = () => this._hideConditionTooltip();
    el._condEnter = enter;
    el._condLeave = leave;
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
  },

  /* ---- CONDITION-AWARE D20 ROLLING ---- */
  _getConditionRollMode(rollType, abilityKey) {
    const active = this.lv('conditions', []);
    const exhaustionLevel = this.lv('combat_exhaustion', 0);

    // Collect extra sources from armor etc.
    const extraDis = [];
    const extraAdv = [];
    if (rollType === 'save' || rollType === 'check') {
      const armorMode = this._armorDisadvantageMode();
      if (armorMode === 'disadvantage' && (abilityKey === 'str' || abilityKey === 'dex'))
        extraDis.push('No armor training');
    }
    if (rollType === 'attack') {
      const armorMode = this._armorDisadvantageMode();
      if (armorMode === 'disadvantage') extraDis.push('No armor training');
    }

    return ConditionRules.resolveRollMode({
      rollType, abilityKey, activeConditions: active,
      exhaustionLevel, extraAdvSources: extraAdv, extraDisSources: extraDis,
    });
  },

  _conditionRollD20(label, modifier, rollType, abilityKey, callback) {
    const { mode, disSources, advSources, penalty } = this._getConditionRollMode(rollType, abilityKey);
    const adjMod = modifier; // penalty already applied to displayed modifier

    // Check if any condition has a rollPrompt (needs DM confirmation)
    const active = this.lv('conditions', []);
    const promptConditions = active
      .filter(c => ConditionRules.CONDITIONS[c]?.rollPrompt)
      .filter(c => {
        // Only show prompt if this condition actually affects this roll type
        const fx = ConditionRules.CONDITIONS[c].effects;
        if (rollType === 'attack' && (fx.attackRolls === 'disadvantage' || fx.attackRolls === 'auto-fail')) return true;
        if (rollType === 'check' && fx.abilityChecks === 'disadvantage') return true;
        if (rollType === 'save') {
          if (abilityKey === 'str' && fx.strSaves) return true;
          if (abilityKey === 'dex' && fx.dexSaves) return true;
        }
        return false;
      });

    if (promptConditions.length > 0 && mode === 'disadvantage') {
      // Show DM confirmation popup
      const promptText = promptConditions.map(c => ConditionRules.CONDITIONS[c].rollPrompt).join('\n\n');
      this._showConditionRollPopup(label, adjMod, promptText, mode, callback);
      return;
    }

    // No prompt needed — roll directly
    const result = Dice.rollD20(adjMod, mode);
    const modeLabel = mode === 'disadvantage' ? ` (Disadv: ${disSources.join(', ')})` :
                      mode === 'advantage' ? ` (Adv: ${advSources.join(', ')})` : '';
    const penaltyLabel = penalty > 0 ? ` [−${penalty} Exhaustion]` : '';
    Dice.showResult(label + modeLabel + penaltyLabel, result);
    if (callback) callback(result);
  },

  _showConditionRollPopup(label, modifier, promptText, _mode, callback) {
    document.querySelector('.condition-roll-popup-backdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'condition-roll-popup-backdrop';

    const popup = document.createElement('div');
    popup.className = 'condition-roll-popup';
    popup.innerHTML = `
      <div class="condition-roll-popup-title">${label}</div>
      <div class="condition-roll-popup-text">${promptText.replace(/\n/g, '<br>')}</div>
      <div class="condition-roll-popup-actions">
        <button class="btn condition-roll-btn-normal">Roll Normally</button>
        <button class="btn btn-primary condition-roll-btn-dis">Roll with Disadvantage</button>
      </div>`;

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('show'));

    const doRoll = (rollMode) => {
      backdrop.classList.remove('show');
      setTimeout(() => backdrop.remove(), 200);
      const result = Dice.rollD20(modifier, rollMode);
      const modeLabel = rollMode === 'disadvantage' ? ' (Disadv)' : '';
      Dice.showResult(label + modeLabel, result);
      if (callback) callback(result);
    };

    popup.querySelector('.condition-roll-btn-normal').addEventListener('click', () => doRoll(undefined));
    popup.querySelector('.condition-roll-btn-dis').addEventListener('click', () => doRoll('disadvantage'));
    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 200); }
    });
  },

  _renderConditions() {
    const el = this.$('conditions-grid');
    if (!el) return;
    const active = this.lv('conditions', []);
    const custom = this.lv('customConditions', []);

    el.innerHTML = '';

    // Standard conditions — 2-column table, always visible, click to toggle
    ConditionRules.CONDITION_LIST.forEach(cName => {
      const rule = ConditionRules.CONDITIONS[cName];
      const isActive = active.includes(cName);
      const cell = document.createElement('div');
      cell.className = 'cond-cell' + (isActive ? ' active' : '');
      cell.textContent = cName;
      cell.dataset.condition = cName;

      // Click to toggle
      cell.addEventListener('click', () => {
        const conds = this.lv('conditions', []);
        const idx = conds.indexOf(cName);
        if (idx >= 0) {
          // Turning off — only remove this one (implied ones stay, must be toggled individually)
          conds.splice(idx, 1);
        } else {
          // Turning on — also activate implied conditions
          conds.push(cName);
          ConditionRules.getImplied(cName).forEach(imp => {
            if (!conds.includes(imp)) conds.push(imp);
          });
        }
        this.sv('conditions', conds);
        this._renderConditions();
        this.applyConditionEffects();
      });

      // Tooltip on hover
      if (rule) {
        cell.addEventListener('mouseenter', (e) => this._showConditionTooltip(cName, rule.description, e));
        cell.addEventListener('mouseleave', () => this._hideConditionTooltip());
      }

      el.appendChild(cell);
    });

    // Custom conditions
    custom.forEach(c => {
      const cell = document.createElement('div');
      cell.className = 'cond-cell cond-custom' + (c.active ? ' active' : '');
      cell.innerHTML = `<span title="${c.name}">${c.name}</span><button class="cond-custom-del" title="Delete">&times;</button>`;
      cell.addEventListener('click', (e) => {
        if (e.target.classList.contains('cond-custom-del')) return;
        const customs = this.lv('customConditions', []);
        const ci = customs.findIndex(x => x.name === c.name);
        if (ci >= 0) { customs[ci].active = !customs[ci].active; this.sv('customConditions', customs); }
        cell.classList.toggle('active');
        this.applyConditionEffects();
      });
      cell.querySelector('.cond-custom-del').addEventListener('click', (e) => {
        e.stopPropagation();
        const customs = this.lv('customConditions', []);
        const ci = customs.findIndex(x => x.name === c.name);
        if (ci >= 0) { customs.splice(ci, 1); this.sv('customConditions', customs); }
        this._renderConditions();
        this.applyConditionEffects();
      });
      el.appendChild(cell);
    });

    // Add custom button (always last)
    const addCell = document.createElement('div');
    addCell.className = 'cond-cell cond-add';
    addCell.textContent = '+ Custom';
    addCell.addEventListener('click', () => {
      addCell.innerHTML = '<input type="text" class="cond-add-input" placeholder="Name..." autofocus>';
      const inp = addCell.querySelector('input');
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && inp.value.trim()) {
          const name = inp.value.trim();
          const customs = this.lv('customConditions', []);
          if (!customs.some(x => x.name === name)) {
            customs.push({ name, active: true });
            this.sv('customConditions', customs);
          }
          this._renderConditions();
          this.applyConditionEffects();
        }
        if (e.key === 'Escape') this._renderConditions();
      });
      inp.addEventListener('blur', () => this._renderConditions());
      inp.focus();
    });
    el.appendChild(addCell);

    // ---- Exhaustion tracker ----
    const exhDiv = document.createElement('div');
    exhDiv.className = 'cond-exhaustion';

    const exhLabel = document.createElement('span');
    exhLabel.className = 'cond-exh-label';
    exhLabel.textContent = 'Exhaustion';
    exhDiv.appendChild(exhLabel);

    const exhPips = document.createElement('div');
    exhPips.className = 'cond-exh-pips';
    const currentLevel = this.lv('combat_exhaustion', 0);

    const EXHAUSTION_EFFECTS = [
      '', // 0 — no effect
      'Level 1: −2 to D20 Tests. Speed reduced by 5 ft.',
      'Level 2: −4 to D20 Tests. Speed reduced by 10 ft.',
      'Level 3: −6 to D20 Tests. Speed reduced by 15 ft.',
      'Level 4: −8 to D20 Tests. Speed reduced by 20 ft.',
      'Level 5: −10 to D20 Tests. Speed reduced by 25 ft.',
      'Level 6: You die.',
    ];

    for (let i = 1; i <= 6; i++) {
      const pip = document.createElement('button');
      pip.className = 'cond-exh-pip' + (i <= currentLevel ? ' active' : '');
      pip.textContent = i;

      pip.addEventListener('click', () => {
        const cur = this.lv('combat_exhaustion', 0);
        const newLevel = cur === i ? i - 1 : i;
        this.sv('combat_exhaustion', newLevel);
        this._renderConditions();
        this.recalcAll();
      });

      // Tooltip on hover for current effect
      pip.addEventListener('mouseenter', (e) => {
        this._showConditionTooltip('Exhaustion', EXHAUSTION_EFFECTS[i], e);
      });
      pip.addEventListener('mouseleave', () => this._hideConditionTooltip());

      exhPips.appendChild(pip);
    }

    exhDiv.appendChild(exhPips);
    el.appendChild(exhDiv);
  },

  _highlightSpellText(html) {
    // Damage types (red)
    html = html.replace(/\b(Fire|Cold|Lightning|Thunder|Acid|Poison|Necrotic|Radiant|Force|Psychic|Bludgeoning|Piercing|Slashing)\b(?:\s+damage)?/g,
      (match) => `<span class="spell-kw-dmg">${match}</span>`);
    // Healing keywords (green)
    html = html.replace(/\b(hit points?|regains?|heals?|healing|temporary hit points)\b/gi,
      '<span class="spell-kw-heal">$1</span>');
    // Conditions (purple)
    html = html.replace(/\b(Blinded|Charmed|Deafened|Frightened|Grappled|Incapacitated|Invisible|Paralyzed|Petrified|Poisoned|Prone|Restrained|Stunned|Unconscious|Exhaustion)\b/g,
      '<span class="spell-kw-cond">$1</span>');
    // Rest keywords (teal)
    html = html.replace(/\b(Short Rest|Long Rest|Dawn)\b/g,
      '<span class="spell-kw-rest">$1</span>');
    // Mechanical terms (gold)
    html = html.replace(/\b(saving throw|attack roll|spell attack|ability check|Advantage|Disadvantage|AC|Armor Class|spell save DC|concentration|ritual|bonus action|action|reaction|opportunity attack|difficult terrain|proficiency bonus|ability modifier|spell slot|cantrip)\b/gi,
      '<span class="spell-kw-mech">$1</span>');
    // Dice expressions (blue)
    html = html.replace(/\b(\d+d\d+(?:\s*\+\s*\d+)?)\b/g,
      '<span class="spell-kw-dice">$1</span>');
    // Distances and durations (blue)
    html = html.replace(/\b(\d+[\s-](?:feet|foot|ft|mile|miles|minutes?|hours?|rounds?))\b/gi,
      '<span class="spell-kw-dice">$1</span>');
    // Schools of magic (orange italic)
    html = html.replace(/\b(Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation)\b/g,
      '<span class="spell-kw-school">$1</span>');
    // Spell names (cyan) — match known spells from loaded data
    if (typeof DndData !== 'undefined' && DndData.spells) {
      if (!this._spellNamePattern) {
        const names = DndData.spells.map(s => s.name).filter(n => n.length > 3).sort((a, b) => b.length - a.length);
        const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        this._spellNamePattern = new RegExp('\\b(' + escaped.join('|') + ')\\b', 'g');
      }
      html = html.replace(this._spellNamePattern, (match) => {
        // Don't double-wrap if already inside a span
        return `<span class="spell-kw-name">${match}</span>`;
      });
    }
    return html;
  },

  _highlightConditionText(text) {
    let html = text.replace(/\n/g, '<br>');
    // Negative keywords (red)
    html = html.replace(/\b(Disadvantage|automatically fails?|can't|cannot|Auto-fail)\b/gi,
      '<span class="cond-kw-bad">$1</span>');
    // Positive keywords (green)
    html = html.replace(/\b(Advantage|Resistance)\b/g,
      '<span class="cond-kw-good">$1</span>');
    // Mechanical keywords (gold)
    html = html.replace(/\b(Speed|Attack rolls?|saving throws?|ability checks?|Actions?|Bonus Actions?|Reactions?|Critical Hit|Incapacitated|Prone|D20 Tests?|Exhaustion level|Long Rest)\b/gi,
      '<span class="cond-kw-mech">$1</span>');
    // Numeric/dice values (cyan)
    html = html.replace(/\b(\d+ feet|\d+ times|factor of ten|within 5 feet)\b/gi,
      '<span class="cond-kw-num">$1</span>');
    return html;
  },

  _showConditionTooltip(name, text, event) {
    this._hideConditionTooltip();
    const tip = document.createElement('div');
    tip.className = 'condition-tooltip';
    tip.id = 'condition-tooltip-active';
    tip.innerHTML = `<strong>${name}</strong><br>${this._highlightConditionText(text)}`;
    document.body.appendChild(tip);

    const rect = event.target.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.left;

    // Viewport clamp
    requestAnimationFrame(() => {
      const tipRect = tip.getBoundingClientRect();
      if (top + tipRect.height > window.innerHeight - 8) top = rect.top - tipRect.height - 6;
      if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
      if (left < 8) left = 8;
      tip.style.top = top + 'px';
      tip.style.left = left + 'px';
      tip.classList.add('show');
    });
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  },

  _hideConditionTooltip() {
    document.getElementById('condition-tooltip-active')?.remove();
  },

  // =============================================
  // HP CONTROLS & RESISTANCES / VULNERABILITIES
  // =============================================

  _GI_BASE: 'https://cdn.jsdelivr.net/gh/game-icons/icons@master/',

  DAMAGE_TYPES: [
    { key: 'slashing',            label: 'Slashing',    gi: 'lorc/quick-slash.svg',          color: '#6b6b6b' },
    { key: 'piercing',            label: 'Piercing',    gi: 'lorc/chained-arrow-heads.svg',  color: '#6b6b6b' },
    { key: 'bludgeoning',         label: 'Bludgeoning', gi: 'lorc/punch.svg',                color: '#6b6b6b' },
    { key: 'fire',                label: 'Fire',        gi: 'lorc/small-fire.svg',           color: '#c0522a',
      gradient: 'linear-gradient(145deg, #ff8c42 0%, #c0522a 55%, #7a1a00 100%)' },
    { key: 'slashing-magical',    label: 'Slashing',    gi: 'lorc/serrated-slash.svg',       color: '#7b5ea7', magical: true,
      gradient: 'linear-gradient(145deg, #b39ddb 0%, #7b5ea7 55%, #4a2c80 100%)' },
    { key: 'piercing-magical',    label: 'Piercing',    gi: 'lorc/fast-arrow.svg',           color: '#7b5ea7', magical: true,
      gradient: 'linear-gradient(145deg, #b39ddb 0%, #7b5ea7 55%, #4a2c80 100%)' },
    { key: 'bludgeoning-magical', label: 'Bludgeoning', gi: 'lorc/punch-blast.svg',          color: '#7b5ea7', magical: true,
      gradient: 'linear-gradient(145deg, #b39ddb 0%, #7b5ea7 55%, #4a2c80 100%)' },
    { key: 'cold',                label: 'Cold',        gi: 'lorc/beveled-star.svg',         color: '#3a88c5',
      gradient: 'linear-gradient(145deg, #c8eaf8 0%, #3a88c5 55%, #1a4f80 100%)' },
    { key: 'acid',                label: 'Acid',        gi: 'lorc/acid-blob.svg',            color: '#3d8b3d',
      gradient: 'linear-gradient(145deg, #8fd68f 0%, #3d8b3d 55%, #1a4f1a 100%)' },
    { key: 'radiant',             label: 'Radiant',     gi: 'lorc/sun.svg',                  color: '#c8960c',
      gradient: 'linear-gradient(145deg, #f5d060 0%, #c8960c 55%, #7a5500 100%)' },
    { key: 'lightning',           label: 'Lightning',   gi: 'lorc/lightning-tree.svg',       color: '#28388d',
      gradient: 'linear-gradient(145deg, #7b9fe8 0%, #28388d 55%, #0d1f5c 100%)' },
    { key: 'force',               label: 'Force',       gi: 'lorc/rolling-energy.svg',       color: '#8b2a2a',
      gradient: 'linear-gradient(145deg, #e06060 0%, #8b2a2a 55%, #4a0000 100%)' },
    { key: 'poison',              label: 'Poison',      gi: 'lorc/poison-bottle.svg',        color: '#7b3fa0',
      gradient: 'linear-gradient(145deg, #c090e0 0%, #7b3fa0 55%, #3e1060 100%)' },
    { key: 'necrotic',            label: 'Necrotic',    gi: 'lorc/dread-skull.svg',          color: '#9faf6c',
      gradient: 'linear-gradient(145deg, #d4e090 0%, #9faf6c 55%, #5a6f30 100%)' },
    { key: 'thunder',             label: 'Thunder',     gi: 'lorc/resonance.svg',            color: '#6a0dad',
      gradient: 'linear-gradient(145deg, #c070e8 0%, #6a0dad 55%, #35006e 100%)' },
    { key: 'psychic',             label: 'Psychic',     gi: 'lorc/brain.svg',                color: '#a04080',
      gradient: 'linear-gradient(145deg, #e090c0 0%, #a04080 55%, #5c1040 100%)' },
  ],

  // Active category in the resistance editor modal
  _resistEditorCat: 'resistances',

  _giCache: {},

  // Fetch all game-icons SVGs, strip the opaque background path, and cache transparent data URLs.
  // Re-renders the damage grid/summary once all are ready.
  async _loadGiIcons() {
    const unique = [...new Set(this.DAMAGE_TYPES.map(dt => dt.gi))];
    await Promise.all(unique.map(async gi => {
      if (this._giCache[gi]) return;
      try {
        const resp = await fetch(this._GI_BASE + gi);
        const text = await resp.text();
        // Remove the solid black background rect so the SVG has a transparent bg
        const transparent = text.replace(/<path d="M0 0h512v512H0z"\/>/g, '');
        this._giCache[gi] = 'data:image/svg+xml,' + encodeURIComponent(transparent);
      } catch {
        this._giCache[gi] = this._GI_BASE + gi; // fallback to original
      }
    }));
    this._buildDamageTypeGrid();
    this._updateResistSummary();
  },

  _giIconHtml(dt, pillSize = false) {
    const cls = pillSize ? 'dmg-gi-icon dmg-gi-pill' : 'dmg-gi-icon';
    const url = this._giCache[dt.gi] || this._GI_BASE + dt.gi;
    // Darken dt.color ~50% for the icon tint so it contrasts against the button
    const hex = dt.color.replace('#', '');
    const r = Math.round(parseInt(hex.slice(0, 2), 16) * 0.5).toString(16).padStart(2, '0');
    const g = Math.round(parseInt(hex.slice(2, 4), 16) * 0.5).toString(16).padStart(2, '0');
    const b = Math.round(parseInt(hex.slice(4, 6), 16) * 0.5).toString(16).padStart(2, '0');
    const darkColor = `#${r}${g}${b}`;
    const spread = pillSize ? '-3px' : '-7px';
    return `<span class="dmg-gi-wrap" style="--gi-glow:${dt.color};--gi-spread:${spread}"><span class="${cls}" aria-label="${dt.label}" style="background-color:${darkColor};-webkit-mask-image:url('${url}');mask-image:url('${url}')"></span></span>`;
  },

  initHpControls() {
    this._loadGiIcons(); // fetch transparent SVG data URLs, then re-renders grid/summary
    this._buildDamageTypeGrid();
    this._updateResistSummary();

    this.$('btn-do-heal')?.addEventListener('click', () => {
      const amt = parseInt(this.$('hp-action-amount')?.value) || 0;
      if (amt <= 0) { this._flashInput(); return; }
      this._applyHeal(amt);
    });

    this.$('btn-do-temp')?.addEventListener('click', () => {
      const amt = parseInt(this.$('hp-action-amount')?.value) || 0;
      if (amt <= 0) { this._flashInput(); return; }
      this._applyTempHP(amt);
    });

    this.$('btn-do-damage')?.addEventListener('click', () => {
      const amt = parseInt(this.$('hp-action-amount')?.value) || 0;
      if (amt <= 0) { this._flashInput(); return; }
      this._openDamageTypeModal(amt);
    });

    // Open resistance editor
    this.$('btn-edit-resistances')?.addEventListener('click', () => this._openResistEditor());

    // Damage modal close
    this.$('dmg-modal-close')?.addEventListener('click', () => this._closeDamageTypeModal());
    this.$('dmg-cancel-btn')?.addEventListener('click', () => this._closeDamageTypeModal());
    this.$('damage-type-modal')?.addEventListener('click', (e) => {
      if (e.target === this.$('damage-type-modal')) this._closeDamageTypeModal();
    });

    // Resistance editor modal
    this.$('resist-editor-close')?.addEventListener('click', () => this._closeResistEditor());
    this.$('resist-editor-done')?.addEventListener('click', () => this._closeResistEditor());
    this.$('resist-editor-modal')?.addEventListener('click', (e) => {
      if (e.target === this.$('resist-editor-modal')) this._closeResistEditor();
    });

    // Category toggle buttons
    this.$('resist-editor-modal')?.querySelectorAll('.resist-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._resistEditorCat = btn.dataset.cat;
        this.$('resist-editor-modal').querySelectorAll('.resist-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._updateResistEditorLabel();
        this._buildResistEditorGrid();
      });
    });

    // Escape key closes whichever modal is open
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (this.$('damage-type-modal')?.style.display !== 'none') this._closeDamageTypeModal();
      if (this.$('resist-editor-modal')?.style.display !== 'none') this._closeResistEditor();
    });
  },

  _flashInput() {
    const el = this.$('hp-action-amount');
    if (!el) return;
    el.style.borderColor = 'var(--red)';
    el.focus();
    setTimeout(() => { el.style.borderColor = ''; }, 800);
  },

  // ---- Resistance Editor ----

  _openResistEditor() {
    const modal = this.$('resist-editor-modal');
    if (!modal) return;
    // Reset to Resistances tab
    this._resistEditorCat = 'resistances';
    modal.querySelectorAll('.resist-cat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === 'resistances');
    });
    this._updateResistEditorLabel();
    this._buildResistEditorGrid();
    modal.style.display = 'flex';
  },

  _closeResistEditor() {
    const modal = this.$('resist-editor-modal');
    if (modal) modal.style.display = 'none';
    this._updateResistSummary();
  },

  _updateResistEditorLabel() {
    const labels = { resistances: 'Resistance', vulnerabilities: 'Vulnerability', immunities: 'Immunity' };
    const el = this.$('resist-editor-cat-label');
    if (el) el.textContent = labels[this._resistEditorCat] || this._resistEditorCat;
  },

  _buildResistEditorGrid() {
    const grid = this.$('resist-editor-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const active = new Set(this.lv(this._resistEditorCat, []));

    this.DAMAGE_TYPES.forEach(dt => {
      const btn = document.createElement('button');
      btn.className = 'dmg-type-btn' + (active.has(dt.key) ? ' selected' : '');
      btn.style.background = dt.gradient || dt.color;
      btn.style.borderColor = dt.color;

      btn.innerHTML = `
        ${this._giIconHtml(dt)}
        <span class="dmg-label">${dt.label}${dt.magical ? '<span class="dmg-magical-tag">✦ Magical</span>' : ''}</span>
      `;
      btn.title = (active.has(dt.key) ? 'Remove' : 'Add') + ` ${dt.label}${dt.magical ? ' (Magical)' : ''}`;

      btn.addEventListener('click', () => {
        const current = new Set(this.lv(this._resistEditorCat, []));
        if (current.has(dt.key)) {
          current.delete(dt.key);
        } else {
          current.add(dt.key);
          // Enforce mutual exclusivity — remove from the other two categories
          const ALL_CATS = ['resistances', 'vulnerabilities', 'immunities'];
          ALL_CATS.filter(c => c !== this._resistEditorCat).forEach(otherCat => {
            const other = new Set(this.lv(otherCat, []));
            if (other.has(dt.key)) {
              other.delete(dt.key);
              this.sv(otherCat, [...other]);
            }
          });
        }
        this.sv(this._resistEditorCat, [...current]);
        btn.classList.toggle('selected', current.has(dt.key));
        this._buildDamageTypeGrid();
      });

      grid.appendChild(btn);
    });
  },

  // Show compact summary pills below the edit button
  _updateResistSummary() {
    const container = this.$('resist-summary');
    if (!container) return;
    container.innerHTML = '';

    const cats = [
      { key: 'resistances',     cls: 'cat-r', label: 'Resistance' },
      { key: 'vulnerabilities', cls: 'cat-v', label: 'Vulnerability' },
      { key: 'immunities',      cls: 'cat-i', label: 'Immunity' },
    ];

    cats.forEach(({ key, cls, label }) => {
      const types = this.lv(key, []);
      types.forEach(typeKey => {
        const dt = this.DAMAGE_TYPES.find(d => d.key === typeKey);
        if (!dt) return;
        const pill = document.createElement('span');
        pill.className = `resist-summary-pill ${cls}`;
        pill.style.background = dt.color;
        pill.title = `${label}: ${dt.label}${dt.magical ? ' (Magical)' : ''}`;
        pill.innerHTML = this._giIconHtml(dt, true);
        container.appendChild(pill);
      });
    });
  },

  // ---- Damage Type Modal ----

  _buildDamageTypeGrid() {
    const grid = this.$('dmg-type-grid');
    if (!grid) return;
    const pendingAmt = parseInt(this.$('dmg-modal-amount')?.textContent) || 0;
    grid.innerHTML = '';

    this.DAMAGE_TYPES.forEach(dt => {
      const btn = document.createElement('button');
      btn.className = 'dmg-type-btn';
      btn.style.background = dt.gradient || dt.color;
      btn.style.borderColor = dt.color;

      btn.dataset.dmgType = dt.key;

      const resultText = pendingAmt > 0 ? this._calcDamageResult(pendingAmt, dt.key) : '';
      btn.innerHTML = `
        ${this._giIconHtml(dt)}
        <span class="dmg-label">${dt.label}${dt.magical ? '<span class="dmg-magical-tag">✦ Magical</span>' : ''}</span>
        ${resultText ? `<span class="dmg-result">${resultText}</span>` : ''}
      `;

      btn.addEventListener('click', () => {
        const amt = parseInt(this.$('dmg-modal-amount')?.textContent) || 0;
        this._applyDamage(amt, dt.key);
        this._closeDamageTypeModal();
      });

      grid.appendChild(btn);
    });
  },

  _calcDamageResult(amount, typeKey) {
    const resistances    = new Set(this.lv('resistances', []));
    const vulnerabilities = new Set(this.lv('vulnerabilities', []));
    const immunities     = new Set(this.lv('immunities', []));

    if (immunities.has(typeKey))      return `→ 0 (immune)`;
    if (resistances.has(typeKey))     return `→ ${Math.floor(amount / 2)} (resist)`;
    if (vulnerabilities.has(typeKey)) return `→ ${amount * 2} (vuln!)`;
    return `→ ${amount}`;
  },

  _openDamageTypeModal(amount) {
    const modal = this.$('damage-type-modal');
    const amtEl = this.$('dmg-modal-amount');
    if (!modal || !amtEl) return;
    amtEl.textContent = amount;
    this._buildDamageTypeGrid();
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.querySelector('.dmg-type-btn')?.focus());
  },

  _closeDamageTypeModal() {
    const modal = this.$('damage-type-modal');
    if (modal) modal.style.display = 'none';
  },

  // ---- Apply HP changes ----

  _applyDamage(rawAmount, typeKey) {
    const resistances    = new Set(this.lv('resistances', []));
    const vulnerabilities = new Set(this.lv('vulnerabilities', []));
    const immunities     = new Set(this.lv('immunities', []));

    let finalAmount = rawAmount;
    let note = '';

    if (immunities.has(typeKey)) {
      finalAmount = 0; note = 'immune';
    } else if (resistances.has(typeKey)) {
      finalAmount = Math.floor(rawAmount / 2); note = 'resistant';
    } else if (vulnerabilities.has(typeKey)) {
      finalAmount = rawAmount * 2; note = 'vulnerable';
    }

    if (finalAmount <= 0) {
      this._showHpToast(`Immune — 0 damage taken!`, 'heal');
      if (this.$('hp-action-amount')) this.$('hp-action-amount').value = '';
      return;
    }

    // Temp HP absorbs damage first
    let tempHP = parseInt(this.lv('hpTemp', 0)) || 0;
    if (tempHP > 0) {
      const absorbed = Math.min(tempHP, finalAmount);
      tempHP -= absorbed;
      finalAmount -= absorbed;
      this.sv('hpTemp', tempHP);
      const tempEl = this.$('hpTemp');
      if (tempEl) tempEl.value = tempHP;
    }

    let curHP = parseInt(this.lv('hpCurrent', 0)) || 0;
    const maxHP = parseInt(this.lv('hpMax', 0)) || 0;
    curHP = Math.max(0, curHP - finalAmount);
    this.sv('hpCurrent', curHP);
    const hpEl = this.$('hpCurrent');
    if (hpEl) {
      hpEl.value = curHP;
      hpEl.dispatchEvent(new Event('change'));
      this._flashHpElement(hpEl, 'damage');
    }

    const dt = this.DAMAGE_TYPES.find(d => d.key === typeKey);
    const label = dt ? `${dt.emoji} ${dt.label}${dt.magical ? ' (Magical)' : ''}` : typeKey;
    const noteStr = note ? ` [${note}]` : '';
    const dmgShown = rawAmount !== finalAmount + (parseInt(this.lv('hpTemp',0)) < tempHP ? (tempHP - parseInt(this.lv('hpTemp',0))) : 0)
      ? `${rawAmount}→${finalAmount}` : `${finalAmount}`;
    this._showHpToast(`${label}${noteStr}: −${dmgShown} damage${curHP === 0 ? ' (down!)' : ''}`, 'damage');
    if (this.$('hp-action-amount')) this.$('hp-action-amount').value = '';
  },

  _applyHeal(amount) {
    const maxHP = parseInt(this.lv('hpMax', 0)) || 0;
    let curHP = parseInt(this.lv('hpCurrent', 0)) || 0;
    const newHP = Math.min(maxHP, curHP + amount);
    this.sv('hpCurrent', newHP);
    const hpEl = this.$('hpCurrent');
    if (hpEl) {
      hpEl.value = newHP;
      hpEl.dispatchEvent(new Event('change'));
      this._flashHpElement(hpEl, 'heal');
    }
    this._showHpToast(`💚 Healed ${newHP - curHP} HP (${newHP}/${maxHP})`, 'heal');
    if (this.$('hp-action-amount')) this.$('hp-action-amount').value = '';
  },

  _applyTempHP(amount) {
    const curTemp = parseInt(this.lv('hpTemp', 0)) || 0;
    const newTemp = Math.max(curTemp, amount); // doesn't stack — take higher
    this.sv('hpTemp', newTemp);
    const tempEl = this.$('hpTemp');
    if (tempEl) {
      tempEl.value = newTemp;
      tempEl.dispatchEvent(new Event('change'));
    }
    const msg = newTemp === amount
      ? `🛡️ Set Temp HP to ${newTemp}`
      : `🛡️ Kept existing Temp HP (${curTemp} > ${amount})`;
    this._showHpToast(msg, 'heal');
    if (this.$('hp-action-amount')) this.$('hp-action-amount').value = '';
  },

  _flashHpElement(el, type) {
    el.classList.remove('hp-flash-damage', 'hp-flash-heal');
    void el.offsetWidth;
    el.classList.add(type === 'damage' ? 'hp-flash-damage' : 'hp-flash-heal');
    el.addEventListener('animationend', () => {
      el.classList.remove('hp-flash-damage', 'hp-flash-heal');
    }, { once: true });
  },

  _showHpToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed; bottom:80px; right:20px; z-index:10000;
      background:${type === 'damage' ? '#7b1a1a' : '#155724'};
      color:#fff; border-radius:8px; padding:10px 16px;
      font-family:var(--font-ui); font-size:0.88rem; font-weight:600;
      box-shadow:0 4px 16px rgba(0,0,0,0.35);
      max-width:280px; word-break:break-word;
      transition: opacity 0.4s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  },

};
