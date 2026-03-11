/* =============================================
   CHARACTER SHEET - Main sheet view logic
   Refactored from app.js to use CharStore
   ============================================= */
'use strict';

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
  init(charId) {
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
    this.initWeightTracking();
    this.recalcAll();
    this.syncXPToLevel();
    this.refreshAttackList();
    if (typeof LevelUp !== 'undefined') LevelUp.init();

  },

  onDataReady() {
    this.populateDataLists();
    this.buildAttacks();
    this.initSpellSearch();
    this.initItemSearch();
    this.initMagicItemSearch();
    this.restoreSpells();
    this.restoreInventory();
    this.restoreFeats();
    this.restoreCharOptions();
    this.initPortrait();
    this.applyClassSelection(this.lv('charClass', ''));
    this.applySpeciesSelection(this.lv('charSpecies', ''));
    this.applyBackgroundSelection(this.lv('charBackground', ''));
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
        const result = Dice.rollD20(mod);
        Dice.showResult(`${s.label} Save`, result);
      });
    });
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
        const result = Dice.rollD20(mod);
        Dice.showResult(`${s.label} Check`, result);
      });
    });
  },

  // ---- RECALCULATION ENGINE ----
  recalcAll() {
    const level = this.getLevel();
    const prof = this.getProfBonus(level);
    const mods = {};

    this.ABILITIES.forEach(ab => {
      const score = this.getAbilityScore(ab);
      mods[ab] = this.getModFromScore(score);
      const el = this.$(`${ab}-mod`);
      if (el) el.textContent = this.fmtMod(mods[ab]);
    });

    const profEl = this.$('profBonus');
    if (profEl) profEl.textContent = this.fmtMod(prof);

    const initEl = this.$('initiative');
    if (initEl) initEl.textContent = this.fmtMod(mods.dex);

    // Saves
    const SAVES = this.ABILITIES.map(a => ({ key: a, label: this.ABILITY_NAMES[a] }));
    SAVES.forEach(s => {
      const cb = this.qs(`.save-prof[data-save-ab="${s.key}"]`);
      const total = mods[s.key] + (cb?.checked ? prof : 0);
      const el = this.$(`save-${s.key}`);
      if (el) el.textContent = this.fmtMod(total);
    });

    // Skills
    let percBonus = 0;
    this.SKILLS.forEach(s => {
      const toggle = this.qs(`.skill-state-toggle[data-skill="${s.key}"]`);
      const state = parseInt(toggle?.dataset.state || '0');
      const isProficient = state >= 1;
      const isExpert = state === 2;
      const bonus = isExpert ? prof * 2 : isProficient ? prof : 0;
      const total = mods[s.ability] + bonus;
      const el = this.$(`skill-${s.key}`);
      if (el) el.textContent = this.fmtMod(total);
      if (s.key === 'perception') percBonus = bonus;
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

    this.refreshFeatList();
    this.renderCarryCapacity();
    this.qsa('#attacks-body tr').forEach(tr => tr._refreshRow?.());
    if (typeof Combat !== 'undefined') Combat.syncHitDice();
  },

  // ---- BIND SIMPLE FIELDS ----
  bindSimpleFields() {
    this.qsa('[data-save]').forEach(el => {
      const key = el.dataset.save;
      if (el.type === 'checkbox') el.checked = this.lv(key, false);
      else { const v = this.lv(key, null); if (v !== null) el.value = v; }
      const handler = () => {
        this.sv(key, el.type === 'checkbox' ? el.checked : el.value);
        if (this.ABILITIES.includes(key) || key === 'charLevel' || key === 'spellcastingAbility') this.recalcAll();
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
      <td><input type="text" class="atk-name" placeholder="Weapon name" value="${data.name || ''}" list="attack-list"></td>
      <td class="atk-ability-cell"><select class="atk-ability">${abilityOpts}</select></td>
      <td class="atk-prof-cell"><span class="skill-state-toggle atk-prof-cb" data-state="${data.prof ? '1' : '0'}" title="Add proficiency bonus to attack roll"></span></td>
      <td class="atk-bonus-cell"><button class="atk-bonus-btn" title="Click to roll attack">+0</button></td>
      <td class="atk-dice-cell">
        <button class="atk-dice-btn" title="Click to roll damage · Double-click to edit dice">—</button>
        <input type="text" class="atk-dice-edit" placeholder="1d8" value="${data.damageDice || ''}" style="display:none">
      </td>
      <td><input type="text" class="atk-type" placeholder="Slashing" value="${data.damageType || ''}"></td>
      <td><input type="text" class="atk-mastery" placeholder="—" value="${data.mastery || ''}"></td>
      <td class="atk-ed-cell"><button class="atk-src-btn" title="Toggle edition"></button></td>
      <td class="atk-actions-cell"><button class="atk-del-btn" title="Remove">✕</button></td>`;
    tbody.appendChild(tr);

    const nameInput    = tr.querySelector('.atk-name');
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
    };
    tr._refreshRow = refreshRow;

    // ---- bonus button: click to roll attack ----
    bonusBtn.addEventListener('click', () => {
      const bonusVal = parseInt(bonusBtn.textContent) || 0;
      Dice.showResult(`${nameInput.value || 'Attack'} Attack`, Dice.rollD20(bonusVal));
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
    tr.querySelector('.atk-del-btn').addEventListener('click', () => { tr.remove(); this.saveAttacks(); this.refreshAttackList(); });

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
    input.addEventListener('change', () => {
      this.sv('charClass', input.value);
      this.applyClassSelection(input.value);
    });
  },

  applyClassSelection(className) {
    if (!className || !DndData.loaded) return;
    const info = getClassInfo(className);
    if (!info) return;

    // Sync hit dice from class/level
    Combat.syncHitDice();

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

    // Add class language proficiencies (e.g. Thieves' Cant for Rogue)
    if (typeof getClassFeaturesByLevel === 'function') {
      const features = getClassFeaturesByLevel(className);
      const level1 = features[1] || [];
      const langFeatures = level1.filter(f => /thieves.+cant/i.test(f.name) || /cant/i.test(f.name) && /rogue/i.test(className));
      langFeatures.forEach(f => {
        const profEl = this.$('profLanguages');
        if (profEl && !profEl.value.includes(f.name)) {
          profEl.value = profEl.value ? profEl.value + '\n' + f.name : f.name;
          this.sv('profLanguages', profEl.value);
        }
      });
    }

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

    this.recalcAll();
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
      const summary = [];
      for (let l = 1; l <= level; l++) {
        if (features[l]) {
          features[l].forEach(f => summary.push(`Lv.${l}: ${f.name}`));
        }
      }
      textEl.innerHTML = summary.map(s => `<div>${s}</div>`).join('') || '<div>No features found.</div>';
    }

    const fullEl = this.$('full-class-features');
    const fullSub = this.$('full-class-subtitle');
    if (fullEl) {
      if (fullSub) fullSub.textContent = `(${className})`;
      fullEl.innerHTML = '';
      for (let l = 1; l <= 20; l++) {
        if (!features[l]) continue;
        features[l].forEach(f => {
          const div = document.createElement('div');
          div.className = 'feature-entry';
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
    const hasOne = feats.some(f => styles.some(s => s.name.toLowerCase() === f.toLowerCase()));
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
    const racialSpells = parseRacialSpells(info.additionalSpells, subraceName, subraceEntries);
    const level = this.getLevel();

    // Get existing racial spell names to avoid duplicates
    const existingRacial = new Set(
      (this.lv('charSpells', []) || []).filter(s => s.racial).map(s => s.name)
    );

    const capName = n => n ? n.replace(/\b\w/g, c => c.toUpperCase()) : n;
    const toAdd = [];
    racialSpells.cantrips.forEach(name => {
      if (name && !existingRacial.has(name))
        toAdd.push({ name: capName(name), level: 0, prepared: true, racial: true });
    });
    if (level >= 3) {
      racialSpells.level3.forEach(name => {
        if (name && !existingRacial.has(name))
          toAdd.push({ name: capName(name), level: 1, prepared: true, racial: true });
      });
    }
    if (level >= 5) {
      racialSpells.level5.forEach(name => {
        if (name && !existingRacial.has(name))
          toAdd.push({ name: capName(name), level: 2, prepared: true, racial: true });
      });
    }

    if (!toAdd.length) return;
    const current = this.lv('charSpells', []) || [];
    const updated = [...current, ...toAdd];
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
      let txt = `${info.name} — ${info.src}`;
      txt += `\nSize: ${info.size} | Speed: ${info.speed} ft.`;
      if (flySpeed) txt += ` | Fly: ${flySpeed} ft.`;
      if (swimSpeed) txt += ` | Swim: ${swimSpeed} ft.`;
      if (darkvision) txt += ` | Darkvision: ${darkvision} ft.`;
      if (info.abilityBonus && info.abilityBonus !== 'None (set by background)') txt += `\nAbility Bonus: ${info.abilityBonus}`;
      if (resist.length) txt += `\nResistances: ${resist.join(', ')}`;
      if (subraceInfo) txt += `\nLineage: ${subraceInfo.name}`;
      textEl.textContent = txt;
    }

    const fullEl = this.$('full-species-traits');
    if (fullEl) {
      fullEl.innerHTML = '';

      // Base race entry
      const div = document.createElement('div');
      div.className = 'feature-entry';
      let statsHtml = `<p><strong>Size:</strong> ${info.size} &nbsp;|&nbsp; <strong>Speed:</strong> ${info.speed} ft.`;
      if (flySpeed) statsHtml += ` &nbsp;|&nbsp; <strong>Fly:</strong> ${flySpeed} ft.`;
      if (swimSpeed) statsHtml += ` &nbsp;|&nbsp; <strong>Swim:</strong> ${swimSpeed} ft.`;
      if (darkvision) statsHtml += ` &nbsp;|&nbsp; <strong>Darkvision:</strong> ${darkvision} ft.`;
      if (info.abilityBonus && info.abilityBonus !== 'None (set by background)') {
        statsHtml += `</p><p><strong>Ability Bonus:</strong> ${info.abilityBonus}`;
      }
      if (resist.length) statsHtml += `</p><p><strong>Resistances:</strong> ${resist.join(', ')}`;
      statsHtml += '</p>';
      div.innerHTML = `
        <div class="feature-entry-header">
          <span class="feature-entry-name">${info.name}</span>
          <span class="feature-entry-level">${info.src}</span>
        </div>
        <div class="feature-entry-text">${statsHtml}${info.traitsHtml || ''}</div>`;
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
          <div class="feature-entry-text">${entriesToHtml(subraceInfo.entries)}</div>`;
        fullEl.appendChild(srDiv);
      }
    }
  },

  // ---- BACKGROUND SELECTION ----
  initBackgroundSelect() {
    const input = this.$('charBackground');
    if (!input) return;
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

    // Auto-add origin feat
    if (info.feat) {
      const featName = Object.keys(info.feat)[0]?.split('|')[0];
      if (featName) this.addFeat(featName);
    }

    // Auto-populate Proficiencies & Languages textarea (only when background changes)
    if (isNewBg) {
      const AB = { str:'Strength', dex:'Dexterity', con:'Constitution', int:'Intelligence', wis:'Wisdom', cha:'Charisma' };
      const parts = [];
      const skills = Object.keys(info.skillProf);
      if (skills.length) parts.push(`Skills: ${skills.join(', ')}`);

      const toolKeys = Object.keys(info.toolProf);
      const fixedTools = toolKeys.filter(k => k !== 'choose' && info.toolProf[k] === true);
      const chooseTools = info.toolProf.choose;
      if (fixedTools.length) parts.push(`Tools: ${fixedTools.join(', ')}`);
      if (chooseTools) parts.push(`Tools: choose ${chooseTools.count || 1}`);

      if (typeof parseLanguageProf === 'function') {
        const lang = parseLanguageProf(info.languageProf);
        if (lang.fixed.length) parts.push(`Languages: ${lang.fixed.join(', ')}`);
        if (lang.chooseCount) parts.push(`Languages: +${lang.chooseCount} of your choice`);
      }

      const langEl = this.$('profLanguages');
      if (langEl) {
        langEl.value = parts.join('\n');
        this.sv('profLanguages', langEl.value);
      }
    }

    // Build ability score increase text (2024 rules)
    const AB = { str:'Strength', dex:'Dexterity', con:'Constitution', int:'Intelligence', wis:'Wisdom', cha:'Charisma' };
    let abilityHtml = '';
    const abList = [];
    if (info.ability) {
      for (const [k, v] of Object.entries(info.ability)) {
        if (k === 'choose') {
          (v.from || []).forEach(a => { if (AB[a] && !abList.includes(AB[a])) abList.push(AB[a]); });
        } else if (typeof v === 'number' && AB[k]) {
          if (!abList.includes(AB[k])) abList.push(AB[k]);
        }
      }
    }
    if (abList.length) {
      abilityHtml = `A background lists three of your character's ability scores: <strong>${abList.join(', ')}</strong>. Increase one by 2 and another by 1, or increase all three by 1. None of these increases can raise a score above 20.`;
    } else {
      abilityHtml = `A background lists three of your character's ability scores. Increase one by 2 and another by 1, or increase all three by 1. None of these increases can raise a score above 20.`;
    }

    // Entries filtered to exclude equipment (it's already in inventory)
    const rawBg = DndData.backgrounds.find(b => b.name === name);
    const flavorEntries = (rawBg?.entries || []).filter(e =>
      !(typeof e === 'object' && e.name && /equipment/i.test(e.name))
    );
    const flavorHtml = typeof entriesToHtml === 'function'
      ? entriesToHtml(flavorEntries)
      : (info.description || '').replace(/\n/g, '<br>');

    // Character tab: ability increases + flavor text
    const box = this.$('bg-info-box');
    const textEl = this.$('bg-traits-text');
    if (box && textEl) {
      box.style.display = 'block';
      const titleEl = box.querySelector('.box-title');
      if (titleEl) titleEl.textContent = name;
      let html = '';
      html += `<p class="bg-ability-line">${abilityHtml}</p>`;
      html += flavorHtml;
      textEl.innerHTML = html;
    }

    // Features tab: same filtered content in full
    const fullEl = this.$('full-bg-features');
    const fullBgBox = this.$('full-bg-box');
    if (fullBgBox) {
      const ft = fullBgBox.querySelector('.box-title');
      if (ft) ft.textContent = name;
    }
    if (fullEl) {
      fullEl.innerHTML = `<div class="feature-entry"><div class="feature-entry-text">${flavorHtml}</div></div>`;
    }

    this.recalcAll();
  },

  // ---- CHAR OPTIONS SYSTEM ----
  initCharOptions() {
    const addBtn = this.$('btn-add-charopt');
    const searchInput = this.$('charopt-search');
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
          <div class="feature-entry-text">${info?.description || '(No data found — check the source book)'}</div>`;
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
    if (addBtn && searchInput) {
      addBtn.addEventListener('click', () => {
        const name = searchInput.value.trim();
        if (!name) return;
        this.addFeat(name);
        searchInput.value = '';
      });
    }
  },

  addFeat(name) {
    // Resolve canonical (properly cased) name from the data if possible
    const info = typeof getFeatInfo === 'function' ? getFeatInfo(name) : null;
    const canonical = info?.name || name;
    const feats = this.lv('feats', []);
    // De-duplicate case-insensitively
    if (feats.some(f => f.toLowerCase() === canonical.toLowerCase())) return;
    feats.push(canonical);
    this.sv('feats', feats);
    this.renderFeats();
  },

  addFeatByName(name) { this.addFeat(name); },

  removeFeat(name) {
    const feats = this.lv('feats', []).filter(f => f !== name);
    this.sv('feats', feats);
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
    feats.forEach(name => {
      const info = typeof getFeatInfo === 'function' ? getFeatInfo(name) : null;
      const desc = info?.description || '';
      const card = document.createElement('div');
      card.className = 'feat-card';
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
      card.querySelector('.feat-card-del').addEventListener('click', () => this.removeFeat(name));
      container.appendChild(card);

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

    const feats = DndData.feats.filter(f => {
      if (f.source === 'UA2024') { if (!ua || !show24f) return false; }
      else if (typeof is2024Source === 'function' && is2024Source(f.source)) { if (!show24f) return false; }
      else { if (!show14f) return false; }
      // Epic Boons only at level 20+
      if (f.category === 'EB' && level < 20) return false;
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

  // ---- SPELL SEARCH ----
  initSpellSearch() {
    const input = this.$('spell-search');
    const dropdown = this.$('spell-search-results');
    if (!input || !dropdown) return;

    let selectedIdx = -1;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      if (query.length < 2) { dropdown.style.display = 'none'; return; }

      const className = this.lv('charClass', '');
      let pool = className ? getSpellsForClass(className) : DndData.spells;
      const matches = pool.filter(s => s.name.toLowerCase().includes(query)).slice(0, 30);

      dropdown.innerHTML = '';
      selectedIdx = -1;
      if (!matches.length) { dropdown.style.display = 'none'; return; }

      matches.forEach((spell, idx) => {
        const div = document.createElement('div');
        div.className = 'ac-item';
        div.innerHTML = `
          <span class="ac-item-name">${spell.name} <small style="color:var(--ink-faint)">[${spell._src || ''}]</small></span>
          <span class="ac-item-detail">${spell._levelStr} ${spell._schoolName} | ${spell._castTime} | ${spell._rangeStr} | ${spell._durationStr}</span>`;
        div.addEventListener('click', () => {
          this.addSpellToSheet(spell);
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

  _updateACSelection(items, idx) {
    items.forEach((it, i) => it.classList.toggle('selected', i === idx));
    items[idx]?.scrollIntoView({ block: 'nearest' });
  },

  addSpellToSheet(spell) {
    const level = spell.level;
    const spells = this.lv('charSpells', []);
    if (spells.find(s => s.name === spell.name && s.level === level)) return;
    spells.push({ name: spell.name, level, prepared: false });
    this.sv('charSpells', spells);
    this.renderSpellCard(spell, level);
  },

  renderSpellCard(spell, level) {
    const container = this.$(`spell-cards-${level}`);
    if (!container) return;
    const saved = this.lv('charSpells', []).find(s => s.name.toLowerCase() === spell.name.toLowerCase());
    const isRacial = saved?.racial || false;
    const isPrepared = isRacial || saved?.prepared;
    const card = document.createElement('div');
    card.className = 'spell-card' + (isRacial ? ' spell-racial' : '');
    card.dataset.spellName = spell.name;
    card.innerHTML = `
      <input type="checkbox" title="Prepared" ${isPrepared ? 'checked' : ''} ${isRacial ? 'disabled' : ''}>
      <span class="spell-card-name spell-card-name-clickable">${spell.name}${isRacial ? ' <span class="spell-racial-badge" title="Racial spell — always prepared">✦</span>' : ''}</span>
      <span class="spell-card-meta">${spell._schoolName || ''} | ${spell._castTime || ''}</span>
      ${isRacial ? '' : '<button class="del-btn" title="Remove">✕</button>'}`;

    card.querySelector('.spell-card-name-clickable').addEventListener('click', () => this._showSpellDetail(spell));

    if (!isRacial) {
      card.querySelector('input[type="checkbox"]').addEventListener('change', function () {
        const spells = CharStore.lv('charSpells', []);
        const s = spells.find(s => s.name === spell.name);
        if (s) s.prepared = this.checked;
        CharStore.sv('charSpells', spells);
      });
      card.querySelector('.del-btn').addEventListener('click', () => {
        const spells = this.lv('charSpells', []).filter(s => s.name !== spell.name);
        this.sv('charSpells', spells);
        card.remove();
      });
    }

    container.appendChild(card);
  },

  restoreSpells() {
    const spells = this.lv('charSpells', []);
    spells.forEach(s => {
      const spell = DndData.spells.find(sp => sp.name.toLowerCase() === s.name.toLowerCase())
        || { name: s.name, level: s.level, _schoolName: s.racial ? 'Racial' : '', _castTime: '' };
      this.renderSpellCard(spell, s.level);
    });
  },

  _showSpellDetail(spell) {
    const existing = document.getElementById('spell-detail-modal');
    if (existing) existing.remove();

    const bodyHtml = typeof entriesToHtml === 'function' && spell.entries
      ? entriesToHtml(spell.entries)
      : (spell.entries ? spell.entries.map(e => typeof e === 'string' ? `<p>${e}</p>` : `<p><strong>${e.name}:</strong> ${(e.entries || []).join(' ')}</p>`).join('') : '<p>No description available.</p>');

    const modal = document.createElement('div');
    modal.id = 'spell-detail-modal';
    modal.className = 'levelup-backdrop';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="levelup-modal" style="max-width:540px">
        <div class="levelup-header">
          <h2 class="levelup-title">${spell.name}</h2>
          <button class="levelup-close" id="spell-detail-close">&times;</button>
        </div>
        <div class="levelup-body" style="font-size:0.88rem">
          <div class="spell-detail-tags">
            <span class="spell-detail-tag">${spell._levelStr || (spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`)}</span>
            <span class="spell-detail-tag">${spell._schoolName || ''}</span>
            ${spell._src ? `<span class="spell-detail-tag">${spell._src}</span>` : ''}
          </div>
          <div class="spell-detail-stats">
            ${spell._castTime ? `<div><strong>Casting Time:</strong> ${spell._castTime}</div>` : ''}
            ${spell._rangeStr ? `<div><strong>Range:</strong> ${spell._rangeStr}</div>` : ''}
            ${spell._componentsStr ? `<div><strong>Components:</strong> ${spell._componentsStr}</div>` : ''}
            ${spell._durationStr ? `<div><strong>Duration:</strong> ${spell._durationStr}</div>` : ''}
          </div>
          <div class="spell-detail-body">${bodyHtml}</div>
        </div>
        <div class="levelup-footer">
          <button class="btn levelup-btn-confirm" id="spell-detail-ok">Close</button>
        </div>
      </div>`;

    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#spell-detail-close').addEventListener('click', close);
    modal.querySelector('#spell-detail-ok').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
  },

  // ---- SPELL SLOTS ----
  buildSpellSlots() {
    const bar = this.$('spell-slots-bar');
    if (!bar) return;
    bar.innerHTML = '';
    for (let lvl = 1; lvl <= 9; lvl++) {
      const total = this.lv(`slotMax_${lvl}`, 0);
      const div = document.createElement('div');
      div.className = 'slot-level';
      div.innerHTML = `
        <h4>Level ${lvl}</h4>
        <input type="number" class="slot-total-input" min="0" max="9" value="${total}" data-lvl="${lvl}">
        <div class="slot-checkboxes" id="slot-cbs-${lvl}"></div>`;
      bar.appendChild(div);
      this.renderSlotCheckboxes(lvl, total);
    }
    bar.querySelectorAll('.slot-total-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const lvl = parseInt(inp.dataset.lvl);
        const max = Math.max(0, Math.min(9, parseInt(inp.value) || 0));
        inp.value = max;
        this.sv(`slotMax_${lvl}`, max);
        this.renderSlotCheckboxes(lvl, max);
      });
    });
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

  addItemToInventory(item) {
    const inv = this.lv('inventory', []);
    const isContainer = !!(item.containerCapacity || this._CONTAINER_NAMES.test(item.name || ''));
    if (!isContainer) {
      const existing = inv.find(i => i.name === item.name && !i.isContainer);
      if (existing) { existing.qty++; this.sv('inventory', inv); this.renderInventory(); return; }
    }
    const containerKey = isContainer
      ? (Date.now().toString(36) + Math.random().toString(36).slice(2))
      : undefined;
    inv.push({
      name: item.name, type: item._type,
      damage: item._dmgStr || '', mastery: (item.mastery || []).map(m => m.split('|')[0]).join(', '),
      properties: item._propStr || '', weight: item.weight || 0,
      value: item._valueStr || '', ac: item.ac || 0,
      rarity: item.rarity || 'none', category: item._category, qty: 1,
      reqAttune: item._reqAttune || false, attuned: false,
      description: typeof entriesToHtml === 'function' ? entriesToHtml(item.entries) : '',
      isContainer, containerOpen: true, containerId: null,
      ...(isContainer && { containerKey, containerCapacity: item.containerCapacity || null, capacityStr: item.capacity || null }),
    });
    this.sv('inventory', inv);
    this.renderInventory();
  },

  removeFromInventory(name) {
    const inv = this.lv('inventory', []).filter(i => i.name !== name);
    this.sv('inventory', inv);
    this.renderInventory();
  },

  removeContainerFromInventory(containerKey) {
    const inv = this.lv('inventory', [])
      .filter(i => i.containerKey !== containerKey)
      .map(i => i.containerId === containerKey ? { ...i, containerId: null } : i);
    this.sv('inventory', inv);
    this.renderInventory();
  },

  _saveInvQty(name, qty) {
    const inv = this.lv('inventory', []);
    const it = inv.find(i => i.name === name);
    if (!it) return;
    // If inside a container, validate capacity before saving
    if (it.containerId) {
      const container = inv.find(i => i.containerKey === it.containerId);
      if (container) {
        const maxWeight = this._containerMaxWeight(container);
        if (maxWeight != null) {
          const otherWeight = inv
            .filter(i => i.containerId === container.containerKey && i.name !== name)
            .reduce((sum, i) => sum + (i.weight || 0) * (i.qty || 1), 0);
          if (otherWeight + (it.weight || 0) * qty > maxWeight) {
            const maxQty = Math.max(1, Math.floor((maxWeight - otherWeight) / (it.weight || 1)));
            this._showInvWarning(`${container.name} can only fit ${maxQty}× ${name} (${maxWeight} lb. limit).`);
            it.qty = maxQty;
            this.sv('inventory', inv);
            this.renderInventory();
            return;
          }
        }
        const maxCount = this._containerMaxItemCount(container, name);
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

  _moveToContainer(itemName, containerKey) {
    const inv = this.lv('inventory', []);
    const item = inv.find(i => i.name === itemName);
    if (!item) { this.renderInventory(); return; }
    if (containerKey) {
      const container = inv.find(i => i.containerKey === containerKey || i.name === containerKey);
      if (container) {
        if (!this._containerAcceptsItem(container, itemName)) {
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
        const maxCount = this._containerMaxItemCount(container, itemName);
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

    const totalWeight = item.weight ? item.weight * (item.qty || 1) : 0;
    const totalWStr = totalWeight ? `${Number.isInteger(totalWeight) ? totalWeight : totalWeight.toFixed(2)} lb.` : '';

    const card = document.createElement('div');
    card.className = 'inv-card';
    if (draggable) { card.draggable = true; card.dataset.item = item.name; }
    card.innerHTML = `
      <button class="inv-del-btn" title="Remove">✕</button>
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
    const updateTotalWeight = (qty) => {
      const tw = card.querySelector('.inv-card-total-weight');
      if (!tw || !item.weight) return;
      const t = item.weight * qty;
      tw.textContent = `${Number.isInteger(t) ? t : t.toFixed(2)} lb.`;
    };
    const applyQty = (qty) => {
      qty = Math.max(1, qty);
      input.value = qty;
      updateTotalWeight(qty);
      this._saveInvQty(item.name, qty);
    };
    input.addEventListener('change', e => applyQty(parseInt(e.target.value) || 1));
    card.querySelector('.qty-minus').addEventListener('click', () => applyQty((parseInt(input.value) || 1) - 1));
    card.querySelector('.qty-plus').addEventListener('click',  () => applyQty((parseInt(input.value) || 1) + 1));
    card.querySelector('.inv-del-btn').addEventListener('click', () => this.removeFromInventory(item.name));

    // Tooltip: show item description on hover
    card.addEventListener('mouseenter', e => {
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
    });
    card.addEventListener('mousemove',  e => this._positionInvTooltip(e));
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
    inv.forEach(item => {
      if (!item.isContainer && !item.containerId) {
        const found = allItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (found?.containerCapacity || found?.capacity || this._CONTAINER_NAMES.test(item.name || '')) {
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

      // Drag-drop: the whole itemsEl accepts drops
      const setDragOver = (on) => el.classList.toggle('drag-over-container', on);
      itemsEl.addEventListener('dragover',  e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); });
      itemsEl.addEventListener('dragleave', e => { if (!itemsEl.contains(e.relatedTarget)) setDragOver(false); });
      itemsEl.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation(); setDragOver(false);
        const name = e.dataTransfer.getData('text/plain');
        if (name && name !== container.name) this._moveToContainer(name, cKey);
      });

      // Also accept drops on the header when closed
      header.addEventListener('dragover',  e => { e.preventDefault(); setDragOver(true); });
      header.addEventListener('dragleave', () => setDragOver(false));
      header.addEventListener('drop', e => {
        e.preventDefault(); setDragOver(false);
        const name = e.dataTransfer.getData('text/plain');
        if (name && name !== container.name) this._moveToContainer(name, cKey);
      });

      // Render contained items
      contained.forEach(item => {
        const card = this._makeInvCard(item, true);
        card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', item.name); card.classList.add('dragging'); });
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
    if (loose.length) {
      const grid = document.createElement('div');
      grid.className = 'inv-gear-grid';

      // The grid itself is an eject zone (drop items here to take out of container)
      grid.addEventListener('dragover',  e => { e.preventDefault(); grid.classList.add('drag-over'); });
      grid.addEventListener('dragleave', e => { if (!grid.contains(e.relatedTarget)) grid.classList.remove('drag-over'); });
      grid.addEventListener('drop', e => {
        e.preventDefault(); grid.classList.remove('drag-over');
        const name = e.dataTransfer.getData('text/plain');
        if (name) this._moveToContainer(name, null);
      });

      loose.forEach(item => {
        const card = this._makeInvCard(item, true);
        card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', item.name); card.classList.add('dragging'); });
        card.addEventListener('dragend',   () => card.classList.remove('dragging'));
        grid.appendChild(card);
      });
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
            ${reqAttune ? `<label class="attune-check-label" title="${attuneTxt}"><input type="checkbox" class="attune-cb" ${item.attuned ? 'checked' : ''}> <span>Attuned</span></label>` : ''}
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
        card.querySelector('.attune-cb').addEventListener('change', e => {
          const inv = this.lv('inventory', []);
          const it = inv.find(i => i.name === item.name);
          if (it) it.attuned = e.target.checked;
          this.sv('inventory', inv);
          this.renderMagicItems();
        });
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
  },

  // ---- LIMITED RESOURCES ----
  initResources() {
    this.$('btn-add-resource')?.addEventListener('click', () => {
      const name = this.$('res-name')?.value.trim();
      const max = Math.max(1, parseInt(this.$('res-max')?.value) || 1);
      const refresh = this.$('res-refresh')?.value || 'lr';
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

  renderResources() {
    const list = this.$('resources-list');
    if (!list) return;
    list.innerHTML = '';
    const resources = this.lv('resources', []);
    const LABELS = { lr: 'LR', sr: 'SR', dawn: 'Dawn', manual: '—' };
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
      row.innerHTML = `
        <span class="resource-name">${res.name}</span>
        <div class="resource-pips">${pipsHtml}</div>
        <span class="resource-count">${res.used}/${res.max}</span>
        <span class="resource-refresh-badge ${res.refresh}">${LABELS[res.refresh] || res.refresh}</span>
        <button class="resource-reset" title="Reset uses">↺</button>
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
      row.querySelector('.resource-reset').addEventListener('click', () => {
        const r = this.lv('resources', []);
        r[idx].used = 0;
        this.sv('resources', r);
        this.renderResources();
      });
      row.querySelector('.resource-del').addEventListener('click', () => {
        const r = this.lv('resources', []).filter((_, i) => i !== idx);
        this.sv('resources', r);
        this.renderResources();
      });
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

  // ---- SHEET BUTTONS ----
  initSheetButtons() {
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
    // Hit dice roll buttons are now handled by Combat._bindHitDice()
  },

  // ---- DICE ROLLER ----
  initDiceRoller() {
    const toggle = this.$('dice-toggle');
    const panel = this.$('dice-panel');
    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
    }

    this.qsa('.dice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sides = parseInt(btn.dataset.sides);
        const count = Math.max(1, parseInt(this.$('diceCount')?.value) || 1);
        const mod = parseInt(this.$('diceMod')?.value) || 0;
        const result = Dice.rollExpression(`${count}d${sides}${mod >= 0 ? '+' + mod : mod}`);
        Dice.showResult(`${count}d${sides}${mod ? (mod > 0 ? '+' : '') + mod : ''}`, result);
      });
    });
  },
};
