'use strict';

// ---- MULTICLASSING SYSTEM ----
// D&D 2024 PHB multiclassing ability score prerequisites, data management,
// and the class-picker modal (opened from the "+" tab in the level-up modal).

const Multiclass = {

  // D&D 2024 PHB multiclassing prerequisites.
  // Each entry is an array of requirement objects evaluated with AND logic.
  // A { ab, min, or } object = "ab >= min OR or >= min" (Fighter rule).
  REQUIREMENTS: {
    'Barbarian': [{ ab: 'str', min: 13 }],
    'Bard':      [{ ab: 'cha', min: 13 }],
    'Cleric':    [{ ab: 'wis', min: 13 }],
    'Druid':     [{ ab: 'wis', min: 13 }],
    'Fighter':   [{ ab: 'str', min: 13, or: 'dex' }], // STR 13 OR DEX 13
    'Monk':      [{ ab: 'dex', min: 13 }, { ab: 'wis', min: 13 }],
    'Paladin':   [{ ab: 'str', min: 13 }, { ab: 'cha', min: 13 }],
    'Ranger':    [{ ab: 'dex', min: 13 }, { ab: 'wis', min: 13 }],
    'Rogue':     [{ ab: 'dex', min: 13 }],
    'Sorcerer':  [{ ab: 'cha', min: 13 }],
    'Warlock':   [{ ab: 'cha', min: 13 }],
    'Wizard':    [{ ab: 'int', min: 13 }],
    'Artificer': [{ ab: 'int', min: 13 }],
  },

  AB_NAMES: {
    str: 'Strength', dex: 'Dexterity', con: 'Constitution',
    int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
  },

  // Returns true if the current character meets the prerequisites for the given class.
  meetsRequirements(className) {
    const reqs = this.REQUIREMENTS[className];
    if (!reqs) return true;
    return reqs.every(req => {
      const score = Sheet.getAbilityScore(req.ab);
      if (req.or) return score >= req.min || Sheet.getAbilityScore(req.or) >= req.min;
      return score >= req.min;
    });
  },

  // Returns a human-readable description of the prerequisites.
  getRequirementText(className) {
    const reqs = this.REQUIREMENTS[className];
    if (!reqs || !reqs.length) return 'None';
    return reqs.map(req => {
      if (req.or) return `${this.AB_NAMES[req.ab]} ${req.min} or ${this.AB_NAMES[req.or]} ${req.min}`;
      return `${this.AB_NAMES[req.ab]} ${req.min}`;
    }).join(' & ');
  },

  // ---- Data Accessors ----

  getMulticlasses() {
    return CharStore.lv('multiclasses', []) || [];
  },

  // Total character level = primary class level + all multiclass levels (capped at 20).
  getTotalLevel() {
    const primary = Sheet.getLevel();
    const multi   = this.getMulticlasses().reduce((s, m) => s + (parseInt(m.level) || 1), 0);
    return Math.min(20, primary + multi);
  },

  // ---- Mutations ----

  // Adds a new multiclass. Returns { ok: true } or { ok: false, reason }.
  addMulticlass(className) {
    if (!this.meetsRequirements(className)) {
      return { ok: false, reason: `You do not meet the ability score requirements for ${className} (${this.getRequirementText(className)}).` };
    }
    const classes = this.getMulticlasses();
    if (classes.some(m => m.className === className)) {
      return { ok: false, reason: `${className} is already one of your multiclass choices.` };
    }
    if (Sheet.lv('charClass', '') === className) {
      return { ok: false, reason: `${className} is already your primary class.` };
    }
    const effectiveTotal = this._pendingTotalLevel ?? this.getTotalLevel();
    if (effectiveTotal >= 20) {
      return { ok: false, reason: 'Your character is already at the maximum level of 20.' };
    }
    classes.push({ className, level: 1 });
    CharStore.sv('multiclasses', classes);
    if (typeof Sheet !== 'undefined') Sheet.recalcAll();

    // If the level-up modal is open, notify it to switch to the new class tab.
    if (typeof LevelUp !== 'undefined' && typeof this._pendingTabCallback === 'function') {
      const cb = this._pendingTabCallback;
      this._pendingTabCallback = null;
      this._closePicker();
      cb(className);
    } else {
      this._closePicker();
    }
    return { ok: true };
  },

  // Remove a multiclass entirely.
  removeMulticlass(className) {
    const classes = this.getMulticlasses().filter(m => m.className !== className);
    CharStore.sv('multiclasses', classes);
    if (typeof Sheet !== 'undefined') Sheet.recalcAll();
  },

  // Directly set a multiclass's level (used by the level-up confirm flow).
  // Does NOT enforce the level cap — the caller is responsible for that.
  _applyLevelDirect(className, newLevel) {
    const classes = this.getMulticlasses();
    const mc = classes.find(m => m.className === className);
    if (!mc) return;
    mc.level = Math.max(1, parseInt(newLevel) || 1);
    CharStore.sv('multiclasses', classes);
    if (typeof Sheet !== 'undefined') Sheet.recalcAll();
  },

  // ---- Main-sheet multiclass section ----

  // Re-render the class summary and the popover's multiclass list.
  // Kept as renderSection() for backwards compatibility with existing callers.
  renderSection() {
    if (typeof ClassSummary !== 'undefined') {
      ClassSummary.renderMulticlassList();
      ClassSummary.update();
    }
  },

  // ---- Picker Modal ----

  // Optional callback set by LevelUp when it opens the picker from the "+" tab.
  _pendingTabCallback: null,
  // Pending total level passed by LevelUp so cap checks reflect unsaved level increases.
  _pendingTotalLevel: null,

  init() {
    const closeBtn = document.getElementById('mc-picker-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this._closePicker());

    const backdrop = document.getElementById('mc-picker-backdrop');
    if (backdrop) backdrop.addEventListener('click', e => {
      if (e.target === backdrop) this._closePicker();
    });

    this.renderSection();
  },

  _openPicker() {
    this._buildPickerContent();
    const backdrop = document.getElementById('mc-picker-backdrop');
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.style.display = 'flex';
    }
  },

  _closePicker() {
    const backdrop = document.getElementById('mc-picker-backdrop');
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.style.display = '';
    }
    this._pendingTotalLevel = null;
  },

  _buildPickerContent() {
    const list = document.getElementById('mc-picker-list');
    if (!list) return;

    const primaryClass  = Sheet.lv('charClass', '');
    const existingMulti = this.getMulticlasses().map(m => m.className);
    const atCap         = (this._pendingTotalLevel ?? this.getTotalLevel()) >= 20;

    list.innerHTML = '';

    Object.keys(this.REQUIREMENTS).sort().forEach(className => {
      const met         = this.meetsRequirements(className);
      const isPrimary   = className === primaryClass;
      const isDuplicate = existingMulti.includes(className);
      const blocked     = isPrimary || isDuplicate || atCap || !met;

      const reqs = this.REQUIREMENTS[className] || [];
      const reqDetails = reqs.map(req => {
        if (req.or) {
          const aScore = Sheet.getAbilityScore(req.ab);
          const bScore = Sheet.getAbilityScore(req.or);
          const orMet  = aScore >= req.min || bScore >= req.min;
          return `<span class="mc-req-detail${orMet ? ' req-ok' : ' req-fail'}">` +
            `${this.AB_NAMES[req.ab]} ${req.min} <em>(${aScore})</em> ` +
            `or ${this.AB_NAMES[req.or]} ${req.min} <em>(${bScore})</em>` +
            `</span>`;
        }
        const score  = Sheet.getAbilityScore(req.ab);
        const reqMet = score >= req.min;
        return `<span class="mc-req-detail${reqMet ? ' req-ok' : ' req-fail'}">` +
          `${this.AB_NAMES[req.ab]} ${req.min} <em>(${score})</em>` +
          `</span>`;
      }).join('');

      let statusClass, statusIcon, statusLabel;
      if (isPrimary) {
        statusClass = 'mc-status-info';  statusIcon = '★'; statusLabel = 'Primary class';
      } else if (isDuplicate) {
        statusClass = 'mc-status-info';  statusIcon = '✓'; statusLabel = 'Already added';
      } else if (atCap) {
        statusClass = 'mc-status-warn';  statusIcon = '⚠'; statusLabel = 'Level cap reached (20)';
      } else if (met) {
        statusClass = 'mc-status-ok';    statusIcon = '✓'; statusLabel = 'Requirements met — click to add';
      } else {
        statusClass = 'mc-status-fail';  statusIcon = '✗'; statusLabel = 'Requirements not met';
      }

      const card = document.createElement('div');
      card.className = 'mc-class-card' + (blocked ? ' mc-card-blocked' : '');
      card.innerHTML = `
        <div class="mc-card-name">${className}</div>
        <div class="mc-card-reqs">${reqDetails || '<span class="mc-req-detail req-ok">No requirements</span>'}</div>
        <div class="mc-card-status ${statusClass}">${statusIcon} ${statusLabel}</div>
      `;

      if (!blocked) {
        card.addEventListener('click', () => {
          const result = this.addMulticlass(className);
          if (!result.ok) alert(result.reason);
        });
      }

      list.appendChild(card);
    });
  },
};
