/* =============================================
   COMBAT TRACKER
   Turn resources, conditions, concentration,
   equipped weapons, short/long rest
   ============================================= */
'use strict';

window.Combat = {
  CONDITIONS: [
    'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
    'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
    'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
    'Exhaustion',
  ],

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

  init() {
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
          <button class="btn btn-sm" id="btn-conc-check">Con Save 🎲</button>
        </div>
      </div>

      <!-- Conditions -->
      <div class="combat-section">
        <h2 class="combat-section-title">Conditions</h2>
        <div class="conditions-grid" id="conditions-grid"></div>
        <div class="exhaustion-bar" id="exhaustion-bar">
          <span class="exhaustion-label">Exhaustion Level:</span>
          <div class="exhaustion-pips" id="exhaustion-pips"></div>
        </div>
      </div>

      <!-- Rest -->
      <div class="combat-section">
        <h2 class="combat-section-title">Rest</h2>
        <div class="rest-buttons">
          <button class="btn" id="btn-short-rest">Short Rest</button>
          <button class="btn btn-primary" id="btn-long-rest">Long Rest</button>
        </div>
        <div class="rest-info" id="rest-info"></div>
      </div>
    `;

    this._bindTurnResources();
    this._populateWeapons();
    this._bindConcentration();
    this._buildConditions();
    this._buildExhaustion();
    this._bindRest();
    this._bindHitDice();
    this._bindEquippedAttacks();
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
        const result = Dice.rollD20(bonus);
        Dice.showResult(`${weaponName} Attack`, result);
      });
    });
  },

  _bindConcentration() {
    const cb = this.$('conc-active');
    const spellInput = this.$('conc-spell');
    if (cb) cb.addEventListener('change', () => this.sv('combat_concentrating', cb.checked));
    if (spellInput) spellInput.addEventListener('input', () => this.sv('combat_concSpell', spellInput.value));

    this.$('btn-conc-check')?.addEventListener('click', () => {
      // Constitution saving throw
      const conScore = parseInt(document.getElementById('con')?.value) || 10;
      const conMod = Math.floor((conScore - 10) / 2);
      const profBonus = Math.floor(((parseInt(document.getElementById('charLevel')?.value) || 1) - 1) / 4) + 2;
      const isProf = CharStore.lv('saveProf_con', false);
      const totalMod = conMod + (isProf ? profBonus : 0);
      const result = Dice.rollD20(totalMod);
      Dice.showResult('Concentration Check (Con Save)', result);
    });
  },

  _buildConditions() {
    const grid = this.$('conditions-grid');
    if (!grid) return;
    const activeConditions = this.lv('combat_conditions', []);

    this.CONDITIONS.filter(c => c !== 'Exhaustion').forEach(cond => {
      const label = document.createElement('label');
      label.className = 'condition-tag' + (activeConditions.includes(cond) ? ' active' : '');
      label.innerHTML = `<input type="checkbox" ${activeConditions.includes(cond) ? 'checked' : ''}><span>${cond}</span>`;
      label.querySelector('input').addEventListener('change', (e) => {
        const conditions = this.lv('combat_conditions', []);
        if (e.target.checked) {
          if (!conditions.includes(cond)) conditions.push(cond);
          label.classList.add('active');
        } else {
          const idx = conditions.indexOf(cond);
          if (idx >= 0) conditions.splice(idx, 1);
          label.classList.remove('active');
        }
        this.sv('combat_conditions', conditions);
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
      });
      container.appendChild(pip);
    }
  },

  _bindRest() {
    this.$('btn-short-rest')?.addEventListener('click', () => this._shortRest());
    this.$('btn-long-rest')?.addEventListener('click', () => this._longRest());
  },

  _shortRest() {
    const info = this.$('rest-info');
    const dice = this.getHitDice();
    // Find first die type with remaining dice (largest first)
    const sorted = dice.map((hd, i) => ({ ...hd, idx: i })).sort((a, b) => b.die - a.die);
    const available = sorted.find(hd => (hd.total - hd.used) > 0);

    if (!dice.length) {
      if (info) info.textContent = 'Add hit dice first using the + Add button.';
      return;
    }
    if (!available) {
      if (info) info.textContent = 'No hit dice remaining to spend.';
      return;
    }

    // Roll the largest available hit die + CON mod
    const conScore = parseInt(document.getElementById('con')?.value) || 10;
    const conMod = Math.floor((conScore - 10) / 2);
    const roll = Dice.roll(available.die);
    const healing = Math.max(1, roll + conMod);

    const maxHP = parseInt(CharStore.lv('hpMax', 0)) || 0;
    const currentHP = parseInt(CharStore.lv('hpCurrent', 0)) || 0;
    const newHP = Math.min(maxHP, currentHP + healing);
    CharStore.sv('hpCurrent', newHP);
    const hpInput = document.getElementById('hpCurrent');
    if (hpInput) hpInput.value = newHP;

    dice[available.idx].used++;
    this.saveHitDice(dice);
    this.renderHitDice();

    const rem = dice.reduce((s, h) => s + h.total - h.used, 0);
    const tot = dice.reduce((s, h) => s + h.total, 0);
    if (info) info.textContent = `Short Rest: Rolled 1d${available.die}(${roll}) + ${conMod} CON = ${healing} HP healed. HP: ${currentHP} → ${newHP}. Hit dice remaining: ${rem}/${tot}`;

    // Reset short rest resources
    if (typeof Sheet !== 'undefined') Sheet.resetResourcesByType(['sr']);
    this._resetTurn();
  },

  _longRest() {
    if (!confirm('Take a long rest? This will restore HP, spell slots, and hit dice.')) return;
    const info = this.$('rest-info');

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
      if (ds) ds.checked = false;
      if (df) df.checked = false;
    }

    // Reset long rest + dawn resources
    if (typeof Sheet !== 'undefined') Sheet.resetResourcesByType(['lr', 'sr', 'dawn']);

    // Reduce exhaustion by 1
    const exhaustion = CharStore.lv('combat_exhaustion', 0);
    if (exhaustion > 0) CharStore.sv('combat_exhaustion', exhaustion - 1);

    // Drop concentration
    CharStore.sv('combat_concentrating', false);
    CharStore.sv('combat_concSpell', '');

    this._resetTurn();

    if (info) info.textContent = `Long Rest complete. HP restored to ${maxHP}. Spell slots restored. ${exhaustion > 0 ? `Exhaustion reduced to ${exhaustion - 1}.` : ''}`;

    // Re-render to reflect changes
    this.render();
    // Re-render spell slots on sheet if visible
    if (typeof Sheet !== 'undefined') Sheet.buildSpellSlots();
  },

  _resetTurn() {
    ['action', 'bonus', 'reaction', 'movement', 'object'].forEach(r => {
      this.sv(`combat_${r}`, false);
      const cb = this.$(`res-${r}`);
      if (cb) cb.checked = false;
    });
  },
};
