/* =============================================
   COMBAT TRACKER
   Turn resources, conditions, concentration,
   equipped weapons, short/long rest
   ============================================= */
'use strict';

window.Combat = {
  get CONDITIONS() { return ConditionRules.CONDITION_LIST; },

  sv(key, val) { CharStore.sv(key, val); },
  lv(key, def) { return CharStore.lv(key, def); },
  $(id) { return document.getElementById(id); },

  /* ---- Hit Dice helpers ---- */
  getHitDice() {
    try { return JSON.parse(CharStore.lv('hitDice', '[]')) || []; }
    catch { return []; }
  },
  saveHitDice(arr) { CharStore.sv('hitDice', JSON.stringify(arr)); },

  /** Migrate old "5d10" / "0" format to new array format */
  migrateHitDice() {
    const existing = this.getHitDice();
    if (existing.length) return;
    const oldTotal = CharStore.lv('hitDiceTotal', '');
    if (!oldTotal) return;
    const m = oldTotal.match(/(\d+)d(\d+)/i);
    if (!m) return;
    const total = parseInt(m[1]);
    const faces = parseInt(m[2]);
    const used = parseInt(CharStore.lv('hitDiceUsed', '0')) || 0;
    this.saveHitDice([{ die: faces, total, used }]);
  },

  /** Sync hit dice from current class/level. Call on class or level change. */
  syncHitDice() {
    const className = CharStore.lv('charClass', '');
    const level = Math.max(1, Math.min(20, parseInt(document.getElementById('charLevel')?.value) || 1));
    if (!className) { this.saveHitDice([]); this.renderHitDice(); return; }
    const info = typeof getClassInfo === 'function' ? getClassInfo(className) : null;
    if (!info || !info.hitDieFaces) return;

    const dice = this.getHitDice();
    const existing = dice.find(hd => hd.die === info.hitDieFaces);
    if (existing) {
      existing.total = level;
      existing.used = Math.min(existing.used, existing.total);
    } else {
      // New class die — preserve other types (future multiclass), reset this one
      dice.push({ die: info.hitDieFaces, total: level, used: 0 });
    }
    // Remove any die types that no longer match (single-class: keep only current)
    const filtered = dice.filter(hd => hd.die === info.hitDieFaces);
    this.saveHitDice(filtered);
    this.renderHitDice();
  },

  renderHitDice() {
    const container = this.$('hd-rows');
    if (!container) return;
    container.innerHTML = '';
    const dice = this.getHitDice();
    if (!dice.length) {
      const empty = document.createElement('div');
      empty.className = 'hd-empty';
      empty.style.cssText = 'font-size:0.65rem;color:var(--ink-faint);text-align:center;';
      empty.textContent = 'No hit dice';
      container.appendChild(empty);
      return;
    }
    dice.forEach((hd, i) => {
      const row = document.createElement('div');
      row.className = 'hd-row-entry';

      const remaining = Math.max(0, hd.total - hd.used);

      const dieBtn = document.createElement('button');
      dieBtn.className = 'hd-die-btn';
      dieBtn.textContent = `d${hd.die}`;
      dieBtn.title = `Roll 1d${hd.die} + CON`;
      dieBtn.disabled = remaining <= 0;
      dieBtn.addEventListener('click', () => this._rollHitDie(i));

      const remLabel = document.createElement('span');
      remLabel.className = 'hd-remaining';
      remLabel.textContent = remaining;

      const sep = document.createElement('span');
      sep.className = 'hd-sep'; sep.textContent = '/';

      const totLabel = document.createElement('span');
      totLabel.className = 'hd-tot-label';
      totLabel.textContent = hd.total;

      row.append(dieBtn, remLabel, sep, totLabel);
      container.appendChild(row);
    });

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'hd-reset-btn';
    resetBtn.textContent = 'Reset';
    resetBtn.title = 'Restore all hit dice';
    resetBtn.addEventListener('click', () => {
      dice.forEach(hd => hd.used = 0);
      this.saveHitDice(dice);
      this.renderHitDice();
    });
    container.appendChild(resetBtn);
    this._renderDsHitDie();
  },

  _rollHitDie(index) {
    const dice = this.getHitDice();
    const hd = dice[index];
    if (!hd) return;
    const remaining = hd.total - hd.used;
    if (remaining <= 0) {
      const info = this.$('rest-info');
      if (info) info.textContent = `No d${hd.die} hit dice remaining.`;
      return;
    }
    const conScore = parseInt(document.getElementById('con')?.value) || 10;
    const conMod = Math.floor((conScore - 10) / 2);
    const roll = Dice.roll(hd.die);
    const healing = Math.max(1, roll + conMod);
    const maxHP = parseInt(CharStore.lv('hpMax', 0)) || 0;
    const currentHP = parseInt(CharStore.lv('hpCurrent', 0)) || 0;
    const newHP = Math.min(maxHP, currentHP + healing);
    CharStore.sv('hpCurrent', newHP);
    const hpInput = document.getElementById('hpCurrent');
    if (hpInput) hpInput.value = newHP;

    dice[index].used++;
    this.saveHitDice(dice);
    this.renderHitDice();

    Dice.showResult(`Hit Die (d${hd.die})`, { r1: roll, r2: null, used: roll, total: healing, modifier: conMod });
    const info = this.$('rest-info');
    if (info) info.textContent = `Rolled 1d${hd.die}(${roll}) + ${conMod} CON = ${healing} HP healed. HP: ${currentHP} → ${newHP}.`;
  },

  _bindHitDice() {
    this.migrateHitDice();
    this.syncHitDice();
  },

  /* ---- Death Saves Icon System ---- */
  initDeathSaves() {
    // Render the hit die summary in the top half of the death saves block
    this._renderDsHitDie();

    // Bind click handlers for heart/skull icons
    document.querySelectorAll('.death-icon').forEach(icon => {
      const key = icon.dataset.save;
      if (!key) return;
      // Restore saved state
      const saved = CharStore.lv(key, false);
      icon.classList.toggle('filled', saved);

      icon.addEventListener('click', () => {
        const current = CharStore.lv(key, false);
        const next = !current;
        CharStore.sv(key, next);
        icon.classList.toggle('filled', next);
      });
    });

    // Death save roll button
    const dsRollBtn = document.getElementById('btn-death-save-roll');
    if (dsRollBtn) {
      dsRollBtn.addEventListener('click', () => {
        this._rollDeathSave();
      });
    }
  },

  _rollDeathSave() {
    // D&D 2024: DC 10, roll d20 with no modifier. 10+ = success, <10 = fail, 1 = 2 fails, 20 = regain 1 HP
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
      if (!CharStore.lv(key, false)) {
        CharStore.sv(key, true);
        const icon = document.querySelector(`.death-icon[data-save="${key}"]`);
        if (icon) icon.classList.add('filled');
        return;
      }
    }
  },

  _renderDsHitDie() {
    const el = document.getElementById('ds-hd-section');
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

  init() {
    // Migrate old combat_conditions → unified conditions key
    const oldConds = this.lv('combat_conditions', null);
    if (oldConds && Array.isArray(oldConds) && oldConds.length) {
      const current = this.lv('conditions', []);
      oldConds.forEach(c => { if (!current.includes(c)) current.push(c); });
      this.sv('conditions', current);
      this.sv('combat_conditions', []);
    }
    this.render();
  },

  teardown() {
    const el = this.$('combat-tracker');
    if (el) el.innerHTML = '';
  },

  render() {
    const ct = this.$('combat-tracker');
    if (!ct) return;

    ct.innerHTML = `
      <!-- Turn Resources -->
      <div class="combat-section">
        <h2 class="combat-section-title">Turn Resources</h2>
        <div class="turn-resources">
          <label class="turn-resource">
            <input type="checkbox" id="res-action" ${this.lv('combat_action', false) ? 'checked' : ''}>
            <span class="resource-label">Action</span>
          </label>
          <label class="turn-resource">
            <input type="checkbox" id="res-bonus" ${this.lv('combat_bonus', false) ? 'checked' : ''}>
            <span class="resource-label">Bonus Action</span>
          </label>
          <label class="turn-resource">
            <input type="checkbox" id="res-reaction" ${this.lv('combat_reaction', false) ? 'checked' : ''}>
            <span class="resource-label">Reaction</span>
          </label>
          <label class="turn-resource">
            <input type="checkbox" id="res-movement" ${this.lv('combat_movement', false) ? 'checked' : ''}>
            <span class="resource-label">Movement</span>
          </label>
          <label class="turn-resource">
            <input type="checkbox" id="res-object" ${this.lv('combat_object', false) ? 'checked' : ''}>
            <span class="resource-label">Free Object</span>
          </label>
        </div>
        <button class="btn btn-sm" id="btn-new-turn">New Turn (Reset)</button>
      </div>

      <!-- Equipped Weapons -->
      <div class="combat-section">
        <h2 class="combat-section-title">Equipped Weapons</h2>
        <div class="equipped-slots">
          <div class="equip-slot">
            <span class="equip-slot-label">Main Hand</span>
            <select id="equip-main" class="equip-select">
              <option value="">-- Empty --</option>
            </select>
            <button class="btn btn-sm equip-attack-btn" data-hand="main">Attack 🎲</button>
          </div>
          <div class="equip-slot">
            <span class="equip-slot-label">Off Hand</span>
            <select id="equip-off" class="equip-select">
              <option value="">-- Empty --</option>
            </select>
            <button class="btn btn-sm equip-attack-btn" data-hand="off">Attack 🎲</button>
          </div>
        </div>
      </div>

      <!-- Concentration -->
      <div class="combat-section">
        <h2 class="combat-section-title">Concentration</h2>
        <div class="concentration-bar">
          <label class="conc-toggle">
            <input type="checkbox" id="conc-active" ${this.lv('combat_concentrating', false) ? 'checked' : ''}>
            <span>Concentrating</span>
          </label>
          <input type="text" id="conc-spell" class="conc-spell-input" placeholder="Spell name..." value="${this.lv('combat_concSpell', '')}">
          <button class="btn btn-sm" id="btn-conc-check" title="Roll Constitution save — DC 10 (damage ≤ 20)">DC 10 🎲</button>
          <input type="number" id="conc-dmg" class="conc-dmg-input" min="1" placeholder="dmg" title="Enter damage taken to calculate DC (half damage, min 10)">
          <button class="btn btn-sm" id="btn-conc-check-dmg" title="Roll Constitution save — DC = half damage taken (min 10)">Roll 🎲</button>
        </div>
      </div>

      <!-- Conditions -->
      <div class="combat-section">
        <h2 class="combat-section-title">Conditions</h2>
        <div class="conditions-grid" id="combat-conditions-grid"></div>
        <div class="exhaustion-bar" id="exhaustion-bar">
          <span class="exhaustion-label">Exhaustion Level:</span>
          <div class="exhaustion-pips" id="exhaustion-pips"></div>
        </div>
      </div>

      <!-- Hit Dice (kept in combat tab for reference) -->
      <div class="combat-section">
        <h2 class="combat-section-title">Hit Dice</h2>
        <div id="hd-rows" class="hd-rows"></div>
        <div class="rest-info" id="rest-info"></div>
      </div>
    `;

    this._bindTurnResources();
    this._populateWeapons();
    this._bindConcentration();
    this._buildConditions();
    this._buildExhaustion();
    this._bindHitDice();
    this._bindEquippedAttacks();
    this._bindRestButtons();
  },

  _bindTurnResources() {
    ['action', 'bonus', 'reaction', 'movement', 'object'].forEach(r => {
      const cb = this.$(`res-${r}`);
      if (cb) cb.addEventListener('change', () => this.sv(`combat_${r}`, cb.checked));
    });
    this.$('btn-new-turn')?.addEventListener('click', () => {
      ['action', 'bonus', 'reaction', 'movement', 'object'].forEach(r => {
        this.sv(`combat_${r}`, false);
        const cb = this.$(`res-${r}`);
        if (cb) cb.checked = false;
      });
    });
  },

  _populateWeapons() {
    const weapons = (CharStore.lv('attacks', []) || []).filter(a => a.name);
    const mainSel = this.$('equip-main');
    const offSel = this.$('equip-off');

    weapons.forEach(w => {
      [mainSel, offSel].forEach(sel => {
        if (!sel) return;
        const opt = document.createElement('option');
        opt.value = w.name;
        opt.textContent = w.name;
        sel.appendChild(opt);
      });
    });

    // Add unarmed strike
    [mainSel, offSel].forEach(sel => {
      if (!sel) return;
      const opt = document.createElement('option');
      opt.value = 'Unarmed Strike';
      opt.textContent = 'Unarmed Strike';
      sel.appendChild(opt);
    });

    if (mainSel) { mainSel.value = this.lv('combat_mainHand', ''); mainSel.addEventListener('change', () => this.sv('combat_mainHand', mainSel.value)); }
    if (offSel) { offSel.value = this.lv('combat_offHand', ''); offSel.addEventListener('change', () => this.sv('combat_offHand', offSel.value)); }
  },

  _bindEquippedAttacks() {
    document.querySelectorAll('.equip-attack-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hand = btn.dataset.hand;
        const sel = this.$(hand === 'main' ? 'equip-main' : 'equip-off');
        const weaponName = sel?.value;
        if (!weaponName) { alert('No weapon equipped in this hand.'); return; }

        // Find attack data
        const attacks = CharStore.lv('attacks', []);
        const atk = attacks.find(a => a.name === weaponName);
        const bonus = atk ? parseInt(atk.bonus) || 0 : 0;
        if (typeof Sheet !== 'undefined') {
          Sheet._conditionRollD20(`${weaponName} Attack`, bonus, 'attack');
        } else {
          Dice.showResult(`${weaponName} Attack`, Dice.rollD20(bonus));
        }
      });
    });
  },

  _bindConcentration() {
    const cb = this.$('conc-active');
    const spellInput = this.$('conc-spell');
    if (cb) cb.addEventListener('change', () => this.sv('combat_concentrating', cb.checked));
    if (spellInput) spellInput.addEventListener('input', () => this.sv('combat_concSpell', spellInput.value));

    const doRoll = (dc) => {
      // Constitution saving throw — check for War Caster advantage
      const conScore = parseInt(document.getElementById('con')?.value) || 10;
      const conMod = Math.floor((conScore - 10) / 2);
      const profBonus = Math.floor(((parseInt(document.getElementById('charLevel')?.value) || 1) - 1) / 4) + 2;
      const isProf = CharStore.lv('saveProf_con', false);
      const totalMod = conMod + (isProf ? profBonus : 0);
      if (typeof Sheet !== 'undefined') {
        const wcMode = Sheet._concSaveMode();
        const extraAdv = wcMode === 'advantage' ? ['War Caster'] : [];
        const active = Sheet.lv('conditions', []);
        const exhaustionLevel = Sheet.lv('combat_exhaustion', 0);
        const { mode, penalty } = ConditionRules.resolveRollMode({
          rollType: 'save', abilityKey: 'con', activeConditions: active,
          exhaustionLevel, extraAdvSources: extraAdv, extraDisSources: [],
        });
        const adjMod = totalMod - penalty;
        const result = Dice.rollD20(adjMod, mode);
        let label = `Concentration Check (Con Save vs DC ${dc})`;
        if (mode === 'advantage') label += ' (Adv)';
        if (mode === 'disadvantage') label += ' (Disadv)';
        if (penalty > 0) label += ` [−${penalty} Exhaustion]`;
        Dice.showResult(label, result);
      } else {
        Dice.showResult(`Concentration Check (Con Save vs DC ${dc})`, Dice.rollD20(totalMod));
      }
    };

    const dc10Btn = this.$('btn-conc-check');
    dc10Btn?.addEventListener('click', () => doRoll(10));
    if (dc10Btn && window.attachInstantTooltip) attachInstantTooltip(dc10Btn,
      '<strong>Concentration Save — DC 10</strong><br>' +
      'Use when the damage taken was 20 or less.<br>' +
      'DC is always 10 in this case.');

    const dmgRollBtn = this.$('btn-conc-check-dmg');
    const dmgInput = this.$('conc-dmg');
    dmgRollBtn?.addEventListener('click', () => {
      const dmg = parseInt(dmgInput?.value) || 0;
      const dc = Math.max(10, Math.floor(dmg / 2));
      doRoll(dc);
    });
    if (dmgRollBtn && window.attachInstantTooltip) attachInstantTooltip(dmgRollBtn,
      '<strong>Concentration Save — Custom DC</strong><br>' +
      'Type the damage taken in the field, then click Roll.<br>' +
      'DC = half the damage taken (minimum 10).<br>' +
      'e.g. 30 damage → DC 15');
    if (dmgInput && window.attachInstantTooltip) attachInstantTooltip(dmgInput,
      '<strong>Damage taken</strong><br>' +
      'Enter the total damage from the hit.<br>' +
      'DC = half this value (minimum 10).');
  },

  _buildConditions() {
    const grid = this.$('combat-conditions-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const activeConditions = this.lv('conditions', []);

    this.CONDITIONS.forEach(cond => {
      const rule = ConditionRules.CONDITIONS[cond];
      const label = document.createElement('label');
      label.className = 'condition-tag' + (activeConditions.includes(cond) ? ' active' : '');
      label.innerHTML = `<input type="checkbox" ${activeConditions.includes(cond) ? 'checked' : ''}><span>${cond}</span>`;
      if (rule) label.title = rule.description;
      label.querySelector('input').addEventListener('change', (e) => {
        const conditions = this.lv('conditions', []);
        if (e.target.checked) {
          if (!conditions.includes(cond)) conditions.push(cond);
          label.classList.add('active');
        } else {
          const idx = conditions.indexOf(cond);
          if (idx >= 0) conditions.splice(idx, 1);
          label.classList.remove('active');
        }
        this.sv('conditions', conditions);
        // Sync sheet conditions & effects
        if (typeof Sheet !== 'undefined') {
          Sheet._renderConditions();
          Sheet.applyConditionEffects();
        }
      });
      grid.appendChild(label);
    });
  },

  _buildExhaustion() {
    const container = this.$('exhaustion-pips');
    if (!container) return;
    const level = this.lv('combat_exhaustion', 0);
    for (let i = 1; i <= 6; i++) {
      const pip = document.createElement('button');
      pip.className = 'exhaustion-pip' + (i <= level ? ' active' : '');
      pip.textContent = i;
      pip.addEventListener('click', () => {
        const current = this.lv('combat_exhaustion', 0);
        const newLevel = current === i ? i - 1 : i;
        this.sv('combat_exhaustion', newLevel);
        container.querySelectorAll('.exhaustion-pip').forEach((p, idx) => {
          p.classList.toggle('active', idx < newLevel);
        });
        // Sync sheet condition effects
        if (typeof Sheet !== 'undefined') Sheet.applyConditionEffects();
      });
      container.appendChild(pip);
    }
  },

  /* ================================================================
     REST MODAL SYSTEM
     - Short Rest  : spend hit dice, refresh SR resources, manual items
     - Long Rest   : restore HP/slots/HD, option to swap weapon mastery,
                     refresh LR+SR+dawn resources, attuned items note
     - Dawn        : refresh dawn-only resources (some classes/items)
     ================================================================ */

  _bindRestButtons() {
    // Main sheet rest buttons (in the hd-box replacement)
    document.getElementById('btn-short-rest-main')?.addEventListener('click', () => this._openRestModal('short'));
    document.getElementById('btn-long-rest-main')?.addEventListener('click', () => this._openRestModal('long'));
    document.getElementById('btn-dawn-rest-main')?.addEventListener('click', () => this._openRestModal('dawn'));
    // Combat tab rest buttons (if they still exist)
    document.getElementById('btn-short-rest')?.addEventListener('click', () => this._openRestModal('short'));
    document.getElementById('btn-long-rest')?.addEventListener('click', () => this._openRestModal('long'));
  },

  _openRestModal(type) {
    const backdrop = document.getElementById('rest-modal-backdrop');
    const title = document.getElementById('rest-modal-title');
    const body = document.getElementById('rest-modal-body');
    const confirmBtn = document.getElementById('rest-modal-confirm');
    const cancelBtn = document.getElementById('rest-modal-cancel');
    const closeBtn = document.getElementById('rest-modal-close');
    if (!backdrop || !body) return;

    // Build modal content based on type
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
    const backdrop = document.getElementById('rest-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
  },

  /* ---- SHORT REST body ---- */
  _buildShortRestBody(body) {
    const dice = this.getHitDice();
    const conScore = parseInt(document.getElementById('con')?.value) || 10;
    const conMod = Math.floor((conScore - 10) / 2);
    const maxHP = parseInt(CharStore.lv('hpMax', 0)) || 0;
    let currentHP = parseInt(CharStore.lv('hpCurrent', 0)) || 0;

    // Resources that refresh on short rest
    const resources = CharStore.lv('resources', []) || [];
    const srResources = resources.filter(r => r.refresh === 'sr' && r.used > 0);
    // LR resources usable during short rest (e.g. Wizard Arcane Recovery)
    const srUsable = resources.filter(r => r.usableOnShortRest && r.refresh === 'lr' && r.used < r.max);

    // Warlock spell slot info
    const charClass = CharStore.lv('charClass', '');
    const charLevel = parseInt(CharStore.lv('charLevel', 1)) || 1;
    let warlockSlotHtml = '';
    if (charClass === 'Warlock') {
      const slotInfo = [];
      for (let lvl = 1; lvl <= 5; lvl++) {
        const max = CharStore.lv(`slotMax_${lvl}`, 0);
        if (max > 0) {
          let used = 0;
          for (let i = 0; i < max; i++) { if (CharStore.lv(`slotUsed_${lvl}_${i}`, false)) used++; }
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

    // Build hit dice buttons
    const hdList = body.querySelector('#rest-hd-list');
    const rollLog = body.querySelector('#rest-roll-log');
    const hpDisplay = body.querySelector('#sr-hp-display');
    // Keep a live copy of dice for rolling within the modal
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
          CharStore.sv('hpCurrent', currentHP);
          const hpInput = document.getElementById('hpCurrent');
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

  /* ---- LONG REST body ---- */
  _buildLongRestBody(body) {
    this._pendingAttune = null;
    const weaponMastery = CharStore.lv('weaponMastery', []) || [];
    const charClass = CharStore.lv('charClass', '');
    const level = parseInt(CharStore.lv('charLevel', 1)) || 1;
    // Use ClassResources for mastery slot count (scales with level for all classes)
    let masterySlots = 0;
    if (typeof ClassResources !== 'undefined') {
      masterySlots = ClassResources.getMasterySlots(charClass, level);
    } else {
      const classInfo = typeof getClassInfo === 'function' ? getClassInfo(charClass) : null;
      masterySlots = classInfo?.weaponMasteryCount || 0;
    }

    // Resources that refresh on long rest
    const resources = CharStore.lv('resources', []) || [];
    const lrResources = resources.filter(r => (r.refresh === 'lr' || r.refresh === 'sr') && r.used > 0);

    const maxHP = parseInt(CharStore.lv('hpMax', 0)) || 0;
    const exhaustion = CharStore.lv('combat_exhaustion', 0);

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

    // Attunement section — items requiring attunement
    const inv = CharStore.lv('inventory', []);
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

    // Prepared spells prompt for Wizard/Cleric/Druid/Paladin
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
      ? (CharStore.lv('charSpells', []) || []).filter(s => s.level === 0 && !s.racial && !s.featSource && !s.subclass && !s.classGranted)
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

    // Wire up "Go to Spells Tab" button
    body.querySelector('#rest-go-spells')?.addEventListener('click', () => {
      this._closeRestModal();
      // Switch to spells tab
      const spellsTab = document.querySelector('[data-tab="spells"]');
      if (spellsTab) spellsTab.click();
    });

    // Wire up mastery swap if applicable
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

    // Wire up attunement toggles
    if (attunableItems.length) {
      const MAX_ATTUNE = 3;
      // Live copy of attunement state for this session
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

      // Store pending attunement state for _doLongRest to apply
      this._pendingAttune = liveAttune;
    } else {
      this._pendingAttune = null;
    }
  },

  /* ---- DAWN body ---- */
  _buildDawnBody(body) {
    const resources = CharStore.lv('resources', []) || [];
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

    // Bind dawn recharge roll buttons
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

  /* ---- EXECUTE SHORT REST ---- */
  _doShortRest() {
    // Hit dice were already rolled live in the modal; just reset SR resources
    if (typeof Sheet !== 'undefined') Sheet.resetResourcesByType(['sr']);

    // Sorcerer: Sorcerous Restoration (opt-in, once per LR)
    const srCheckbox = document.getElementById('sr-sorcerous-restoration');
    if (srCheckbox && srCheckbox.checked) {
      const resources = CharStore.lv('resources', []);
      const spRes = resources.find(r => r.name === 'Sorcery Points');
      const srFeat = resources.find(r => r.name === 'Sorcerous Restoration');
      if (spRes && srFeat && srFeat.used < srFeat.max) {
        const recover = Math.min(4, spRes.used);
        spRes.used = Math.max(0, spRes.used - recover);
        srFeat.used = srFeat.max; // mark as used for the day
        CharStore.sv('resources', resources);
        if (typeof Sheet !== 'undefined') Sheet.renderResources();
      }
    }

    // Warlock: restore ALL spell slots on Short Rest
    const charClass = CharStore.lv('charClass', '');
    if (charClass === 'Warlock') {
      for (let lvl = 1; lvl <= 9; lvl++) {
        const max = CharStore.lv(`slotMax_${lvl}`, 0);
        for (let i = 0; i < max; i++) {
          CharStore.sv(`slotUsed_${lvl}_${i}`, false);
        }
      }
      if (typeof Sheet !== 'undefined') Sheet.buildSpellSlots();
    }

    this._resetTurn();
    this.renderHitDice();
    const info = this.$('rest-info');
    if (info) info.textContent = `Short Rest complete.${charClass === 'Warlock' ? ' All spell slots restored.' : ''}`;
  },

  /* ---- EXECUTE LONG REST ---- */
  _doLongRest(body) {
    // Restore HP to max
    const maxHP = parseInt(CharStore.lv('hpMax', 0)) || 0;
    CharStore.sv('hpCurrent', maxHP);
    const hpInput = document.getElementById('hpCurrent');
    if (hpInput) hpInput.value = maxHP;

    // Remove temp HP
    CharStore.sv('hpTemp', 0);
    const tempInput = document.getElementById('hpTemp');
    if (tempInput) tempInput.value = 0;

    // Restore half hit dice per type (minimum 1 each)
    const dice = this.getHitDice();
    dice.forEach(hd => {
      if (hd.used > 0) {
        const restored = Math.max(1, Math.floor(hd.total / 2));
        hd.used = Math.max(0, hd.used - restored);
      }
    });
    this.saveHitDice(dice);
    this.renderHitDice();

    // Restore all spell slots
    for (let lvl = 1; lvl <= 9; lvl++) {
      const max = CharStore.lv(`slotMax_${lvl}`, 0);
      for (let i = 0; i < max; i++) {
        CharStore.sv(`slotUsed_${lvl}_${i}`, false);
      }
    }

    // Reset death saves
    for (let i = 0; i < 3; i++) {
      CharStore.sv(`ds${i}`, false);
      CharStore.sv(`df${i}`, false);
      const ds = document.querySelector(`[data-save="ds${i}"]`);
      const df = document.querySelector(`[data-save="df${i}"]`);
      if (ds) ds.classList.remove('filled');
      if (df) df.classList.remove('filled');
    }

    // Reset long rest + short rest resources
    if (typeof Sheet !== 'undefined') Sheet.resetResourcesByType(['lr', 'sr']);

    // Reduce exhaustion by 1
    const exhaustion = CharStore.lv('combat_exhaustion', 0);
    if (exhaustion > 0) CharStore.sv('combat_exhaustion', exhaustion - 1);

    // Drop concentration
    CharStore.sv('combat_concentrating', false);
    CharStore.sv('combat_concSpell', '');

    // Apply pending attunement changes from long rest modal
    if (this._pendingAttune) {
      const inv = CharStore.lv('inventory', []);
      this._pendingAttune.forEach(a => {
        const it = inv.find(i => i.name === a.name);
        if (it) it.attuned = a.attuned;
      });
      CharStore.sv('inventory', inv);
      this._pendingAttune = null;
      if (typeof Sheet !== 'undefined') Sheet.renderMagicItems();
    }

    // Apply weapon mastery swap if selected
    if (body) {
      const removeSelect = body.querySelector('#rest-mastery-remove');
      const addSelect = body.querySelector('#rest-mastery-add');
      if (removeSelect?.value && addSelect?.value) {
        const mastery = CharStore.lv('weaponMastery', []) || [];
        const idx = mastery.indexOf(removeSelect.value);
        if (idx >= 0) mastery[idx] = addSelect.value;
        CharStore.sv('weaponMastery', mastery);
      }

      // Apply Artificer cantrip swap if selected
      const cantripRemove = body.querySelector('#rest-cantrip-remove');
      const cantripAdd = body.querySelector('#rest-cantrip-add');
      if (cantripRemove?.value && cantripAdd?.value) {
        const spells = CharStore.lv('charSpells', []) || [];
        const idx = spells.findIndex(s => s.name === cantripRemove.value && s.level === 0);
        if (idx !== -1) spells.splice(idx, 1);
        if (!spells.some(s => s.name === cantripAdd.value && s.level === 0)) {
          spells.push({ name: cantripAdd.value, level: 0, prepared: true });
        }
        CharStore.sv('charSpells', spells);
      }
    }

    this._resetTurn();

    const info = this.$('rest-info');
    if (info) info.textContent = `Long Rest complete. HP restored to ${maxHP}. ${exhaustion > 0 ? `Exhaustion: ${exhaustion} → ${exhaustion - 1}.` : ''}`;

    // Re-render
    this.render();
    if (typeof Sheet !== 'undefined') {
      Sheet.buildSpellSlots();
      Sheet.restoreSpells();
    }
  },

  /* ---- EXECUTE DAWN ---- */
  _doDawn() {
    if (typeof Sheet !== 'undefined') Sheet.resetResourcesByType(['dawn']);
    const info = this.$('rest-info');
    if (info) info.textContent = 'Dawn: Dawn-refresh features restored.';
  },

  _resetTurn() {
    ['action', 'bonus', 'reaction', 'movement', 'object'].forEach(r => {
      this.sv(`combat_${r}`, false);
      const cb = this.$(`res-${r}`);
      if (cb) cb.checked = false;
    });
  },
};
