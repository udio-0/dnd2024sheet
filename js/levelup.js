/* =============================================
   LEVEL UP SYSTEM
   Modal-driven level up with features, subclass, ASI/feat, and HP
   ============================================= */
'use strict';

window.LevelUp = {
  ASI_LEVELS: [4, 8, 12, 16, 19],
  EXTRA_ASI_LEVELS: { 'Fighter': [6, 14], 'Rogue': [10] },
  SUBCLASS_LEVELS: {
    'Barbarian': 3, 'Bard': 3, 'Cleric': 3, 'Druid': 3, 'Fighter': 3,
    'Monk': 3, 'Paladin': 3, 'Ranger': 3, 'Rogue': 3, 'Sorcerer': 3,
    'Warlock': 3, 'Wizard': 3, 'Artificer': 3, 'Psion': 3,
  },

  // Per-level choices: subclass, asi
  _pending: {},
  // Shared HP state
  _hp: { choice: 'avg', rolls: [], manualValue: null },

  _newLevel: 1,
  _startLevel: 1,
  _initialized: false,

  open() {
    this._startLevel = Sheet.getLevel();
    this._newLevel = Math.min(20, this._startLevel + 1);
    this._pending = {};
    this._hp = { choice: 'avg', rolls: [], manualValue: null };
    this._buildModal();
    document.getElementById('levelup-backdrop').style.display = 'flex';
  },

  close() {
    // Revert XP if level-up was triggered by XP change and not confirmed
    if (this._xpBeforeLevelUp !== undefined) {
      const xpEl = document.getElementById('charXP');
      if (xpEl) {
        xpEl.value = this._xpBeforeLevelUp;
        Sheet.sv('charXP', this._xpBeforeLevelUp);
      }
      this._xpBeforeLevelUp = undefined;
    }
    document.getElementById('levelup-backdrop').style.display = 'none';
  },

  _isAsiLevel(level, className) {
    if (this.ASI_LEVELS.includes(level)) return true;
    return (this.EXTRA_ASI_LEVELS[className] || []).includes(level);
  },

  _numLevels() {
    return Math.max(0, this._newLevel - this._startLevel);
  },

  _getHpStats() {
    const className = Sheet.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;
    const hitDieFaces = classInfo?.hitDieFaces || 8;
    const conMod = Sheet.getModFromScore(Sheet.getAbilityScore('con'));
    return { hitDieFaces, conMod };
  },

  _calcHpGain() {
    const n = this._numLevels();
    if (n <= 0) return 0;
    const { hitDieFaces, conMod } = this._getHpStats();
    const avgRoll  = hitDieFaces / 2 + 0.5;
    const avgHp    = Math.floor(avgRoll) + conMod;
    const fixedHp  = Math.floor(hitDieFaces / 2) + 1 + conMod;
    const maxHp    = hitDieFaces + conMod;
    switch (this._hp.choice) {
      case 'max':    return n * Math.max(1, maxHp);
      case 'avg':    return n * Math.max(1, avgHp);
      case 'fixed':  return n * Math.max(1, fixedHp);
      case 'roll':   return this._hp.rolls.reduce((s, r) => s + r.gain, 0);
      case 'manual': return this._hp.manualValue ?? Math.max(1, avgHp) * n;
      default:       return 0;
    }
  },

  // ---- Full modal rebuild ----
  _buildModal() {
    const body = document.getElementById('levelup-body');
    body.innerHTML = '';
    const cl = this._startLevel;
    const nl = this._newLevel;
    const className = Sheet.lv('charClass', '');
    const isDown = nl < cl;
    const isSame = nl === cl;

    document.getElementById('levelup-title').textContent = isDown
      ? `Adjust Level — ${className || 'Character'}`
      : `Level Up to ${nl}${className ? ' — ' + className : ''}`;

    // Level picker
    body.insertAdjacentHTML('beforeend', `
      <div class="lu-section lu-level-picker">
        <div class="lu-section-title">Target Level</div>
        <div class="lu-level-row">
          <button class="lu-level-btn" id="lu-lvl-dec" ${nl <= 1 ? 'disabled' : ''}>−</button>
          <div class="lu-level-value" id="lu-level-val">${nl}</div>
          <button class="lu-level-btn" id="lu-lvl-inc" ${nl >= 20 ? 'disabled' : ''}>+</button>
          <div class="lu-level-note" id="lu-level-note">${this._levelNote(cl, nl)}</div>
        </div>
      </div>`);

    body.querySelector('#lu-lvl-dec').addEventListener('click', () => this._decLevel());
    body.querySelector('#lu-lvl-inc').addEventListener('click', () => this._incLevel());

    if (isSame) return;

    if (!isDown) {
      // Feature / subclass / ASI sections per level
      body.insertAdjacentHTML('beforeend', `<div id="lu-levels-container"></div>`);
      for (let lvl = cl + 1; lvl <= nl; lvl++) {
        this._appendLevelSection(lvl);
      }
      // Single shared HP section at the bottom
      body.insertAdjacentHTML('beforeend', `<div id="lu-hp-section-wrapper"></div>`);
      this._renderHpSection();
    } else {
      this._renderLevelDownSection(body);
    }
  },

  _levelNote(cl, nl) {
    if (nl < cl) return `<span style="color:var(--red)">⚠ Reducing from ${cl}</span>`;
    if (nl === cl) return `<span style="color:var(--ink-faint)">Same as current</span>`;
    return `<span style="color:var(--ink-faint)">Current: ${cl}</span>`;
  },

  _updatePickerUI() {
    const cl = this._startLevel, nl = this._newLevel;
    const className = Sheet.lv('charClass', '');
    document.getElementById('lu-level-val').textContent = nl;
    document.getElementById('lu-lvl-dec').disabled = nl <= 1;
    document.getElementById('lu-lvl-inc').disabled = nl >= 20;
    document.getElementById('lu-level-note').innerHTML = this._levelNote(cl, nl);
    document.getElementById('levelup-title').textContent = nl < cl
      ? `Adjust Level — ${className || 'Character'}`
      : `Level Up to ${nl}${className ? ' — ' + className : ''}`;
  },

  _incLevel() {
    if (this._newLevel >= 20) return;
    const cl = this._startLevel;
    this._newLevel++;
    this._updatePickerUI();

    if (this._newLevel > cl) {
      let container = document.getElementById('lu-levels-container');
      if (!container) {
        this._buildModal(); return;
      }
      this._appendLevelSection(this._newLevel);
      this._updateHpSection();
    } else {
      this._buildModal();
    }
  },

  _decLevel() {
    if (this._newLevel <= 1) return;
    const cl = this._startLevel;
    const removingLevel = this._newLevel;

    if (removingLevel > cl) {
      const section = document.getElementById(`lu-level-section-${removingLevel}`);
      if (section) section.remove();
      delete this._pending[removingLevel];
      // Trim any extra rolls
      const needed = this._numLevels() - 1; // numLevels after decrement
      if (this._hp.rolls.length > needed) this._hp.rolls = this._hp.rolls.slice(0, needed);
    }

    this._newLevel--;
    this._updatePickerUI();

    if (this._newLevel <= cl) {
      this._buildModal();
    } else {
      this._updateHpSection();
    }
  },

  // ---- Per-level features / subclass / ASI (no HP) ----
  _appendLevelSection(level) {
    const container = document.getElementById('lu-levels-container');
    if (!container) return;

    const cl = this._startLevel;
    const className = Sheet.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;
    const features = className ? getClassFeaturesByLevel(className) : {};
    const featuresAtLevel = features[level] || [];

    if (!this._pending[level]) this._pending[level] = {};

    const subclassLevel = this.SUBCLASS_LEVELS[className] || 3;
    const existingSubclass = (Sheet.lv('charSubclass', '') || '').trim();
    const needsSubclass = level === subclassLevel && classInfo?.subclasses?.length > 0 && !existingSubclass;
    const needsAsi = this._isAsiLevel(level, className);
    console.log(`[LevelUp] level=${level} className="${className}" subclassLevel=${subclassLevel} subclassCount=${classInfo?.subclasses?.length ?? 'N/A (classInfo null)'} existingSubclass="${existingSubclass}" needsSubclass=${needsSubclass}`);

    let html = `<div class="lu-level-section" id="lu-level-section-${level}">`;
    html += `<div class="lu-level-section-header">Level ${level}</div>`;

    if (featuresAtLevel.length) {
      const featureHtml = featuresAtLevel.map(f => `
        <li>
          <div class="lu-feature-name">${f.name}</div>
          ${f.text ? `<div class="lu-feature-desc">${f.text.slice(0, 240)}${f.text.length > 240 ? '…' : ''}</div>` : ''}
        </li>`).join('');
      html += `
        <div class="lu-section">
          <div class="lu-section-title">New Features at Level ${level}</div>
          <ul class="lu-features-list">${featureHtml}</ul>
        </div>`;
    }

    if (needsSubclass) {
      const ua     = typeof isUAEnabled  === 'function' ? isUAEnabled()  : true;
      const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
      const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
      const subclasses = classInfo.subclasses
        .filter(sc => {
          if (sc.source === 'UA2024') return ua && show24;
          if (typeof is2024Source === 'function' && is2024Source(sc.source)) return show24;
          return show14;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      html += `
        <div class="lu-section" id="lu-subclass-section-${level}">
          <div class="lu-section-title">Choose Your Subclass</div>
          <select id="lu-subclass-select-${level}" class="lu-subclass-select">
            <option value="">— Select a subclass —</option>
            ${subclasses.map(sc => `<option value="${sc.name}">${sc.name}${sc.src ? '  [' + sc.src + ']' : ''}</option>`).join('')}
          </select>
          <div id="lu-subclass-desc-${level}" class="lu-subclass-desc"></div>
        </div>`;
    }

    if (needsAsi) {
      this._pending[level].asi = { type: null };
      const ua      = typeof isUAEnabled  === 'function' ? isUAEnabled()  : true;
      const show24f = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
      const show14f = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
      const featOptions = DndData.feats
        .filter(f => {
          if (f.source === 'UA2024') return ua && show24f;
          if (typeof is2024Source === 'function' && is2024Source(f.source)) return show24f;
          return show14f;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      const featDatalist = featOptions.map(f => `<option value="${f.name} — ${f._src || ''}">`).join('');

      html += `
        <div class="lu-section" id="lu-asi-section-${level}">
          <div class="lu-section-title">Ability Score Improvement</div>
          <div class="lu-asi-options">
            <label class="lu-asi-choice">
              <input type="radio" name="lu-asi-type-${level}" value="2one">
              <div class="lu-asi-label">+2 to one ability score</div>
            </label>
            <label class="lu-asi-choice">
              <input type="radio" name="lu-asi-type-${level}" value="1two">
              <div class="lu-asi-label">+1 to two different ability scores</div>
            </label>
            <label class="lu-asi-choice">
              <input type="radio" name="lu-asi-type-${level}" value="feat">
              <div class="lu-asi-label">Take a Feat</div>
            </label>
          </div>
          <div id="lu-asi-2one-${level}" style="display:none; margin-top:0.6rem;">
            <div class="lu-ability-grid">
              ${Sheet.ABILITIES.map(ab => `
                <div class="lu-ability-row">
                  <label>${ab.toUpperCase()}</label>
                  <input type="number" class="lu-ab-pick2one" data-ab="${ab}"
                    value="${Sheet.getAbilityScore(ab)}" min="1" max="20">
                </div>`).join('')}
            </div>
            <div class="lu-points-left" id="lu-2one-msg-${level}">Select one ability to increase by 2</div>
          </div>
          <div id="lu-asi-1two-${level}" style="display:none; margin-top:0.6rem;">
            <div class="lu-ability-grid">
              ${Sheet.ABILITIES.map(ab => `
                <div class="lu-ability-row">
                  <label>${ab.toUpperCase()}</label>
                  <input type="number" class="lu-ab-pick1two" data-ab="${ab}"
                    value="${Sheet.getAbilityScore(ab)}" min="1" max="20">
                </div>`).join('')}
            </div>
            <div class="lu-points-left" id="lu-1two-msg-${level}">Select two abilities to increase by 1 each (<span id="lu-1two-left-${level}">2</span> remaining)</div>
          </div>
          <div id="lu-asi-feat-${level}" style="display:none; margin-top:0.6rem;">
            <input class="lu-feat-search" id="lu-feat-input-${level}" list="lu-feat-datalist-${level}"
              placeholder="Search feats…" autocomplete="off">
            <datalist id="lu-feat-datalist-${level}">${featDatalist}</datalist>
          </div>
        </div>`;
    }

    html += `</div>`;
    container.insertAdjacentHTML('beforeend', html);

    const sectionEl = document.getElementById(`lu-level-section-${level}`);
    if (needsSubclass) this._bindSubclassForLevel(sectionEl, level);
    if (needsAsi)      this._bindAsiLogicForLevel(sectionEl, level);
  },

  // ---- Single shared HP section ----
  _renderHpSection() {
    const wrapper = document.getElementById('lu-hp-section-wrapper');
    if (!wrapper) return;

    const n = this._numLevels();
    const { hitDieFaces, conMod } = this._getHpStats();
    const avgRoll = hitDieFaces / 2 + 0.5;
    const avgHp   = Math.max(1, Math.floor(avgRoll) + conMod);
    const fixedHp = Math.max(1, Math.floor(hitDieFaces / 2) + 1 + conMod);
    const maxHp   = Math.max(1, hitDieFaces + conMod);
    const conStr  = conMod >= 0 ? `+${conMod}` : `${conMod}`;
    const currentMax = parseInt(Sheet.lv('hpMax', 0)) || 0;
    const manualMax  = n * maxHp;
    const manualDef  = this._hp.manualValue ?? (n * avgHp);

    // Ensure manualValue is set
    if (this._hp.manualValue === null) this._hp.manualValue = n * avgHp;

    wrapper.innerHTML = `
      <div class="lu-section lu-hp-shared-section">
        <div class="lu-section-title">Hit Points</div>
        <div class="lu-hp-method-options">
          <label class="lu-asi-choice${this._hp.choice === 'max'    ? ' selected' : ''}" id="lu-hp-max">
            <input type="radio" name="lu-hp-method" value="max"   ${this._hp.choice === 'max'    ? 'checked' : ''}>
            <div class="lu-asi-label"><strong>Maximum</strong> — ${n} × ${maxHp} = <strong>${n * maxHp}</strong></div>
          </label>
          <label class="lu-asi-choice${this._hp.choice === 'avg'    ? ' selected' : ''}" id="lu-hp-avg">
            <input type="radio" name="lu-hp-method" value="avg"   ${this._hp.choice === 'avg'    ? 'checked' : ''}>
            <div class="lu-asi-label"><strong>Average</strong> — ${n} × ${avgHp} = <strong>${n * avgHp}</strong></div>
          </label>
          <label class="lu-asi-choice${this._hp.choice === 'fixed'  ? ' selected' : ''}" id="lu-hp-fixed">
            <input type="radio" name="lu-hp-method" value="fixed" ${this._hp.choice === 'fixed'  ? 'checked' : ''}>
            <div class="lu-asi-label"><strong>Fixed Average</strong> — ${n} × ${fixedHp} = <strong>${n * fixedHp}</strong></div>
          </label>
          <label class="lu-asi-choice${this._hp.choice === 'roll'   ? ' selected' : ''}" id="lu-hp-roll">
            <input type="radio" name="lu-hp-method" value="roll"  ${this._hp.choice === 'roll'   ? 'checked' : ''}>
            <div class="lu-asi-label"><strong>Roll</strong> — 1d${hitDieFaces}${conStr} per level</div>
          </label>
          <label class="lu-asi-choice${this._hp.choice === 'manual' ? ' selected' : ''}" id="lu-hp-manual">
            <input type="radio" name="lu-hp-method" value="manual"${this._hp.choice === 'manual' ? 'checked' : ''}>
            <div class="lu-asi-label"><strong>Manual</strong> — enter total HP gain
              <input type="number" id="lu-manual-hp-total"
                min="${n}" max="${manualMax}" value="${Math.min(manualMax, Math.max(n, manualDef))}"
                ${this._hp.choice !== 'manual' ? 'disabled' : ''}
                style="width:70px;margin-left:8px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg-input,var(--parchment));color:var(--ink)">
              <span style="font-size:0.78rem;color:var(--ink-faint);margin-left:4px">(${n}–${manualMax})</span>
            </div>
          </label>
        </div>

        <div id="lu-hp-roll-panel" style="display:${this._hp.choice === 'roll' ? 'block' : 'none'};margin-top:0.75rem;">
          <div id="lu-hp-rolls-list" class="lu-hp-rolls-list"></div>
          <div style="margin-top:0.5rem;display:flex;align-items:center;gap:10px;">
            <button type="button" class="btn btn-sm" id="lu-roll-hp-btn">🎲 Roll</button>
            <span id="lu-roll-progress" style="font-size:0.82rem;color:var(--ink-faint)"></span>
            <button type="button" class="btn btn-sm" id="lu-roll-reset-btn" style="margin-left:auto;font-size:0.78rem;opacity:0.7">↺ Reset</button>
          </div>
        </div>

        <div class="lu-hp-gain" style="margin-top:10px">
          Max HP: ${currentMax} → <strong id="lu-hp-new-total">${currentMax + this._calcHpGain()}</strong>
          <span id="lu-hp-gain-detail" style="font-size:0.8rem;color:var(--ink-faint);margin-left:6px">(+${this._calcHpGain()})</span>
        </div>
      </div>`;

    this._bindHpSection(wrapper, hitDieFaces, conMod, currentMax, n, maxHp, manualMax);
    this._refreshHpRollList(wrapper);
    this._refreshHpProgress(wrapper, n);
  },

  _bindHpSection(wrapper, hitDieFaces, conMod, currentMax, n, maxHp, manualMax) {
    wrapper.querySelectorAll('input[name="lu-hp-method"]').forEach(radio => {
      radio.addEventListener('change', () => {
        wrapper.querySelectorAll('.lu-hp-method-options .lu-asi-choice').forEach(el => el.classList.remove('selected'));
        radio.closest('.lu-asi-choice').classList.add('selected');
        this._hp.choice = radio.value;
        const manualInput = wrapper.querySelector('#lu-manual-hp-total');
        if (manualInput) manualInput.disabled = radio.value !== 'manual';
        const rollPanel = wrapper.querySelector('#lu-hp-roll-panel');
        if (rollPanel) rollPanel.style.display = radio.value === 'roll' ? 'block' : 'none';
        this._refreshHpTotal(wrapper, currentMax);
      });
    });

    // Manual input
    wrapper.querySelector('#lu-manual-hp-total')?.addEventListener('input', e => {
      const val = parseInt(e.target.value) || n;
      const clamped = Math.max(n, Math.min(manualMax, val));
      this._hp.manualValue = clamped;
      this._refreshHpTotal(wrapper, currentMax);
    });

    // Roll button
    wrapper.querySelector('#lu-roll-hp-btn')?.addEventListener('click', () => {
      const needed = this._numLevels();
      if (this._hp.rolls.length >= needed) return;
      const roll = Math.floor(Math.random() * hitDieFaces) + 1;
      const gain = Math.max(1, roll + conMod);
      this._hp.rolls.push({ roll, gain, conMod });
      this._refreshHpRollList(wrapper);
      this._refreshHpProgress(wrapper, needed);
      this._refreshHpTotal(wrapper, currentMax);
    });

    // Reset rolls
    wrapper.querySelector('#lu-roll-reset-btn')?.addEventListener('click', () => {
      this._hp.rolls = [];
      this._refreshHpRollList(wrapper);
      this._refreshHpProgress(wrapper, this._numLevels());
      this._refreshHpTotal(wrapper, currentMax);
    });
  },

  _refreshHpRollList(wrapper) {
    const list = wrapper.querySelector('#lu-hp-rolls-list');
    if (!list) return;
    if (this._hp.rolls.length === 0) {
      list.innerHTML = '';
      return;
    }
    const conStr = r => r.conMod === 0 ? '' : (r.conMod > 0 ? ` +${r.conMod}` : ` ${r.conMod}`);
    list.innerHTML = this._hp.rolls.map((r, i) => `
      <div class="lu-roll-entry">
        <span class="lu-roll-num">Level ${this._startLevel + 1 + i}</span>
        <span class="lu-roll-die">d${r.roll + Math.abs(r.conMod) === r.gain ? '' : ''}${r.roll}</span>
        <span class="lu-roll-con">${conStr(r)}</span>
        <span class="lu-roll-eq">=</span>
        <span class="lu-roll-gain">+${r.gain} HP</span>
      </div>`).join('');
  },

  _refreshHpProgress(wrapper, needed) {
    const done = this._hp.rolls.length;
    const btn  = wrapper.querySelector('#lu-roll-hp-btn');
    const prog = wrapper.querySelector('#lu-roll-progress');
    if (btn)  btn.disabled = done >= needed;
    if (btn)  btn.textContent = done >= needed ? '✓ Done' : `🎲 Roll (${done + 1}/${needed})`;
    if (prog) prog.textContent = done >= needed
      ? `All ${needed} roll${needed !== 1 ? 's' : ''} complete`
      : `${needed - done} roll${needed - done !== 1 ? 's' : ''} remaining`;
  },

  _refreshHpTotal(wrapper, currentMax) {
    const gain = this._calcHpGain();
    const newEl = wrapper.querySelector('#lu-hp-new-total');
    const detEl = wrapper.querySelector('#lu-hp-gain-detail');
    if (newEl) newEl.textContent = gain > 0 ? currentMax + gain : '?';
    if (detEl) detEl.textContent = gain > 0 ? `(+${gain})` : '';
  },

  // Called when levels change without a full modal rebuild
  _updateHpSection() {
    const wrapper = document.getElementById('lu-hp-section-wrapper');
    if (!wrapper) return;
    // Re-render the HP section with updated level count
    this._hp.manualValue = null; // reset so it recalculates default
    this._renderHpSection();
  },

  // ---- Level-down section ----
  _renderLevelDownSection(body) {
    const className = Sheet.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;
    const hitDieFaces = classInfo?.hitDieFaces || 8;
    const conMod = Sheet.getModFromScore(Sheet.getAbilityScore('con'));
    const currentMax = parseInt(Sheet.lv('hpMax', 0)) || 0;
    const nl = this._newLevel;

    this._hp = { choice: 'none', rolls: [], manualValue: null };

    body.insertAdjacentHTML('beforeend', `
      <div class="lu-section">
        <div class="lu-section-title">Hit Points</div>
        <div class="lu-hp-method-options">
          <label class="lu-asi-choice selected" id="lu-hp-none">
            <input type="radio" name="lu-hp-method-down" value="none" checked>
            <div class="lu-asi-label">Don't adjust HP (manual)</div>
          </label>
          <label class="lu-asi-choice" id="lu-hp-recalc">
            <input type="radio" name="lu-hp-method-down" value="recalc">
            <div class="lu-asi-label">Recalculate HP for new level (average)</div>
          </label>
        </div>
        <div class="lu-hp-gain" style="margin-top:8px">
          Max HP: ${currentMax}<span id="lu-hp-arrow-down"></span>
        </div>
      </div>`);

    body.querySelectorAll('input[name="lu-hp-method-down"]').forEach(radio => {
      radio.addEventListener('change', () => {
        body.querySelectorAll('.lu-hp-method-options .lu-asi-choice').forEach(el => el.classList.remove('selected'));
        radio.closest('.lu-asi-choice').classList.add('selected');
        this._hp.choice = radio.value;
        const arrowEl = body.querySelector('#lu-hp-arrow-down');
        if (radio.value === 'none') {
          this._hp.manualValue = 0;
          if (arrowEl) arrowEl.innerHTML = '';
        } else if (radio.value === 'recalc') {
          const perLevel = Math.max(1, Math.floor(hitDieFaces / 2) + 1 + conMod);
          const newTotal = nl * perLevel;
          this._hp.manualValue = newTotal - currentMax;
          if (arrowEl) arrowEl.innerHTML = ` → <strong>${newTotal}</strong>`;
        }
      });
    });
  },

  // ---- Subclass / ASI binding ----
  _bindSubclassForLevel(sectionEl, level) {
    const sel = sectionEl.querySelector(`#lu-subclass-select-${level}`);
    const desc = sectionEl.querySelector(`#lu-subclass-desc-${level}`);
    if (!sel) return;

    const className = Sheet.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;

    sel.addEventListener('change', () => {
      if (!this._pending[level]) this._pending[level] = {};
      this._pending[level].subclass = sel.value || null;

      // Show subclass description if available
      if (desc && sel.value && classInfo?.subclasses) {
        const sc = classInfo.subclasses.find(s => s.name === sel.value);
        desc.textContent = sc?.desc ? sc.desc.slice(0, 300) + (sc.desc.length > 300 ? '…' : '') : '';
      } else if (desc) {
        desc.textContent = '';
      }
    });
  },

  _bindAsiLogicForLevel(sectionEl, level) {
    const typeRadios = sectionEl.querySelectorAll(`input[name="lu-asi-type-${level}"]`);
    const panels = {
      '2one': sectionEl.querySelector(`#lu-asi-2one-${level}`),
      '1two': sectionEl.querySelector(`#lu-asi-1two-${level}`),
      'feat': sectionEl.querySelector(`#lu-asi-feat-${level}`),
    };

    typeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        sectionEl.querySelectorAll('.lu-asi-options .lu-asi-choice').forEach(el => el.classList.remove('selected'));
        radio.closest('.lu-asi-choice').classList.add('selected');
        Object.values(panels).forEach(p => p && (p.style.display = 'none'));
        const panel = panels[radio.value];
        if (panel) panel.style.display = 'block';
        if (!this._pending[level]) this._pending[level] = {};
        this._pending[level].asi = { type: radio.value };
      });
    });

    // +2 to one
    const inputs2one = sectionEl.querySelectorAll('.lu-ab-pick2one');
    const base2 = {};
    inputs2one.forEach(inp => { base2[inp.dataset.ab] = Sheet.getAbilityScore(inp.dataset.ab); });
    inputs2one.forEach(inp => {
      inp.addEventListener('input', () => {
        const ab = inp.dataset.ab, base = base2[ab];
        const diff = (parseInt(inp.value) || base) - base;
        if (diff !== 0 && diff !== 2) inp.value = base + 2;
        inputs2one.forEach(o => { if (o !== inp) o.value = base2[o.dataset.ab]; });
        const chosen = diff === 2 ? ab : null;
        this._pending[level].asi = { type: '2one', ab: chosen };
        const msgEl = sectionEl.querySelector(`#lu-2one-msg-${level}`);
        if (msgEl) msgEl.textContent = chosen ? `+2 to ${chosen.toUpperCase()} selected` : 'Select one ability to increase by 2';
      });
    });

    // +1 to two
    const inputs1two = sectionEl.querySelectorAll('.lu-ab-pick1two');
    const base1 = {};
    inputs1two.forEach(inp => { base1[inp.dataset.ab] = Sheet.getAbilityScore(inp.dataset.ab); });
    const chosen1two = new Set();
    inputs1two.forEach(inp => {
      inp.addEventListener('input', () => {
        const ab = inp.dataset.ab, base = base1[ab];
        const val = parseInt(inp.value) || base;
        if (val > base + 1) inp.value = base + 1;
        if (val < base)     inp.value = base;
        const diff = parseInt(inp.value) - base;
        if (diff === 1) chosen1two.add(ab); else chosen1two.delete(ab);
        if (chosen1two.size > 2) { inp.value = base; chosen1two.delete(ab); }
        const leftEl = sectionEl.querySelector(`#lu-1two-left-${level}`);
        if (leftEl) leftEl.textContent = 2 - chosen1two.size;
        this._pending[level].asi = { type: '1two', abs: [...chosen1two] };
      });
    });

    // Feat
    sectionEl.querySelector(`#lu-feat-input-${level}`)?.addEventListener('input', e => {
      const val = e.target.value;
      const name = val.includes(' — ') ? val.split(' — ')[0].trim() : val.trim();
      this._pending[level].asi = { type: 'feat', feat: name };
    });
  },

  // ---- Confirm ----
  confirm() {
    const newLevel = this._newLevel;
    const currentLevel = this._startLevel;
    const className = Sheet.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;
    const isLevelDown = newLevel < currentLevel;

    if (newLevel === currentLevel) { this.close(); return; }

    if (isLevelDown) {
      if (this._hp.choice !== 'none' && this._hp.manualValue) {
        const currentMax = parseInt(Sheet.lv('hpMax', 0)) || 0;
        const newMax = Math.max(1, currentMax + this._hp.manualValue);
        const hpMaxEl = document.getElementById('hpMax');
        if (hpMaxEl) hpMaxEl.value = newMax;
        Sheet.sv('hpMax', newMax);
      }
    } else {
      // Validate per-level choices
      for (let lvl = currentLevel + 1; lvl <= newLevel; lvl++) {
        const p = this._pending[lvl] || {};
        const subclassLevel = this.SUBCLASS_LEVELS[className] || 3;
        const needsSubclass = lvl === subclassLevel && classInfo?.subclasses?.length > 0 && !Sheet.lv('charSubclass', '');
        if (needsSubclass && !p.subclass) { alert(`Please choose a subclass for level ${lvl}.`); return; }
        if (this._isAsiLevel(lvl, className)) {
          if (!p.asi?.type) { alert(`Please make an ASI choice for level ${lvl}.`); return; }
          if (p.asi.type === '2one' && !p.asi.ab) { alert(`Please select which ability to increase by 2 at level ${lvl}.`); return; }
          if (p.asi.type === '1two' && (!p.asi.abs || p.asi.abs.length < 2)) { alert(`Please select two abilities at level ${lvl}.`); return; }
          if (p.asi.type === 'feat' && !p.asi.feat) { alert(`Please select a feat for level ${lvl}.`); return; }
        }
      }

      // Validate HP
      if (this._hp.choice === 'roll' && this._hp.rolls.length < this._numLevels()) {
        alert(`Please roll HP for all ${this._numLevels()} level${this._numLevels() !== 1 ? 's' : ''} before confirming.`); return;
      }

      // Apply per-level choices
      for (let lvl = currentLevel + 1; lvl <= newLevel; lvl++) {
        const p = this._pending[lvl] || {};

        if (p.subclass) {
          const subInput = document.getElementById('charSubclass');
          if (subInput) subInput.value = p.subclass;
          Sheet.sv('charSubclass', p.subclass);
        }

        if (this._isAsiLevel(lvl, className) && p.asi?.type) {
          if (p.asi.type === '2one' && p.asi.ab) {
            const cur = Sheet.getAbilityScore(p.asi.ab);
            const el = document.getElementById(p.asi.ab);
            if (el) el.value = Math.min(20, cur + 2);
            Sheet.sv(p.asi.ab, Math.min(20, cur + 2));
          } else if (p.asi.type === '1two' && p.asi.abs) {
            p.asi.abs.forEach(ab => {
              const cur = Sheet.getAbilityScore(ab);
              const el = document.getElementById(ab);
              if (el) el.value = Math.min(20, cur + 1);
              Sheet.sv(ab, Math.min(20, cur + 1));
            });
          } else if (p.asi.type === 'feat' && p.asi.feat) {
            if (typeof Sheet.addFeatByName === 'function') Sheet.addFeatByName(p.asi.feat);
          }
        }
      }

      // Apply HP (single total gain)
      const hpGain = this._calcHpGain();
      if (hpGain > 0) {
        const currentMax = parseInt(Sheet.lv('hpMax', 0)) || 0;
        const newMax = Math.max(1, currentMax + hpGain);
        const hpMaxEl = document.getElementById('hpMax');
        if (hpMaxEl) hpMaxEl.value = newMax;
        Sheet.sv('hpMax', newMax);
      }
    }

    // Apply level
    const levelEl = document.getElementById('charLevel');
    if (levelEl) levelEl.value = newLevel;
    Sheet.sv('charLevel', newLevel);
    const display = document.getElementById('charLevel-display');
    if (display) display.textContent = newLevel;

    // Auto-populate XP to match the new level
    const xpEl = document.getElementById('charXP');
    if (xpEl && Sheet.XP_THRESHOLDS) {
      const minXP = Sheet.XP_THRESHOLDS[newLevel - 1] || 0;
      const currentXP = parseInt(xpEl.value) || 0;
      if (currentXP < minXP) {
        xpEl.value = minXP;
        Sheet.sv('charXP', minXP);
      }
    }

    Combat.syncHitDice();

    const btn = document.getElementById('btn-level-up');
    if (btn) btn.disabled = newLevel >= 20;

    // Racial spells
    if (!isLevelDown) {
      for (let lvl = currentLevel + 1; lvl <= newLevel; lvl++) {
        if (lvl === 3 || lvl === 5) {
          const speciesName = Sheet.lv('charSpecies', '');
          const subraceName = Sheet.lv('charSubrace', '');
          if (speciesName) {
            const speciesInfo = getSpeciesInfo(speciesName);
            if (speciesInfo?.additionalSpells?.length) {
              const racialSpells = parseRacialSpells(speciesInfo.additionalSpells, subraceName);
              const existing = new Set((Sheet.lv('charSpells', []) || []).filter(s => s.racial).map(s => s.name));
              const toAdd = [];
              if (lvl === 3) racialSpells.level3.forEach(n => { if (n && !existing.has(n)) toAdd.push({ name: n, level: 1, prepared: true, racial: true }); });
              if (lvl === 5) racialSpells.level5.forEach(n => { if (n && !existing.has(n)) toAdd.push({ name: n, level: 2, prepared: true, racial: true }); });
              if (toAdd.length) Sheet.sv('charSpells', [...(Sheet.lv('charSpells', []) || []), ...toAdd]);
            }
          }
        }
      }
    }

    Sheet.recalcAll();
    if (className) Sheet.displayClassFeatures(className);
    this._xpBeforeLevelUp = undefined;
    this.close();
  },

  init() {
    if (this._initialized) {
      const stored = parseInt(CharStore.lv('charLevel', 1)) || 1;
      const display = document.getElementById('charLevel-display');
      if (display) display.textContent = stored;
      const btn = document.getElementById('btn-level-up');
      if (btn) btn.disabled = stored >= 20;
      return;
    }
    this._initialized = true;

    document.getElementById('btn-level-up')?.addEventListener('click', () => this.open());
    document.getElementById('levelup-close')?.addEventListener('click', () => this.close());
    document.getElementById('levelup-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('levelup-confirm')?.addEventListener('click', () => this.confirm());
    document.getElementById('levelup-backdrop')?.addEventListener('click', e => {
      if (e.target === document.getElementById('levelup-backdrop')) this.close();
    });

    const stored = parseInt(CharStore.lv('charLevel', 1)) || 1;
    const display = document.getElementById('charLevel-display');
    if (display) display.textContent = stored;
    const btn = document.getElementById('btn-level-up');
    if (stored >= 20 && btn) btn.disabled = true;
  },
};
