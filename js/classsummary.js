'use strict';

// ---- CLASS SUMMARY ----
// Consolidated header field showing the character's class(es) at a glance.
// Click to open a read-only popover listing primary class + multiclass entries.
// All edits (class/subclass selection, adding/removing multiclass, level changes)
// are handled through the Level-Up modal — this view is display-only.

const ClassSummary = {

  init() {
    const btn = document.getElementById('class-summary-btn');
    const pop = document.getElementById('class-popover');
    if (!btn || !pop) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover();
    });

    pop.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', (e) => {
      if (pop.hidden) return;
      if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        this.closePopover();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !pop.hidden) this.closePopover();
    });

    // Close the popover before the level-up modal opens so it doesn't linger underneath.
    const lvBtn = document.getElementById('btn-level-up');
    if (lvBtn) lvBtn.addEventListener('click', () => this.closePopover());

    this.update();
  },

  togglePopover() {
    const pop = document.getElementById('class-popover');
    if (!pop) return;
    if (pop.hidden) this.openPopover();
    else this.closePopover();
  },

  openPopover() {
    const pop = document.getElementById('class-popover');
    if (pop) pop.hidden = false;
  },

  closePopover() {
    const pop = document.getElementById('class-popover');
    if (pop) pop.hidden = true;
  },

  // Rebuild the summary button text, tooltip, and popover chips from current state.
  update() {
    const textEl = document.getElementById('class-summary-text');
    const btn = document.getElementById('class-summary-btn');
    if (!textEl || !btn) return;

    const primaryClass = (typeof CharStore !== 'undefined') ? (CharStore.lv('charClass', '') || '') : '';
    const primarySubclass = (typeof CharStore !== 'undefined') ? (CharStore.lv('charSubclass', '') || '') : '';
    const primaryLevel = parseInt(
      (typeof CharStore !== 'undefined') ? CharStore.lv('charLevel', 1) : 1
    ) || 1;
    const mc = (typeof Multiclass !== 'undefined') ? Multiclass.getMulticlasses() : [];

    // Primary chip row
    this._setChip('class-chip-name', primaryClass);
    this._setChip('class-chip-sub', primarySubclass);
    const lvChip = document.getElementById('class-chip-level');
    if (lvChip) lvChip.textContent = `Lv ${primaryLevel}`;

    // Summary button
    if (!primaryClass) {
      textEl.textContent = 'Class — click to view';
      textEl.classList.add('is-empty');
      btn.title = '';
    } else {
      textEl.classList.remove('is-empty');
      if (mc.length === 0) {
        textEl.textContent = primarySubclass
          ? `${primaryClass} ${primaryLevel} (${primarySubclass})`
          : `${primaryClass} ${primaryLevel}`;
      } else {
        const parts = [`${primaryClass} ${primaryLevel}`];
        mc.forEach(m => parts.push(`${m.className} ${m.level}`));
        textEl.textContent = parts.join(' / ');
      }

      const tipParts = [
        primarySubclass
          ? `${primaryClass} ${primaryLevel} — ${primarySubclass}`
          : `${primaryClass} ${primaryLevel}`
      ];
      mc.forEach(m => {
        const sc = (typeof CharStore !== 'undefined') ? (CharStore.lv(`mcSubclass_${m.className}`, '') || '') : '';
        tipParts.push(sc ? `${m.className} ${m.level} — ${sc}` : `${m.className} ${m.level}`);
      });
      btn.title = tipParts.join('\n');
    }
  },

  _setChip(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (value) {
      el.textContent = value;
      el.classList.remove('is-empty');
    } else {
      el.textContent = '—';
      el.classList.add('is-empty');
    }
  },

  // Render the multiclass rows inside the popover.
  // Called by Multiclass.renderSection() after it updates the underlying data.
  renderMulticlassList() {
    const container = document.getElementById('class-popover-mc');
    if (!container) return;

    const mc = (typeof Multiclass !== 'undefined') ? Multiclass.getMulticlasses() : [];
    container.innerHTML = '';

    mc.forEach(entry => {
      const sub = (typeof CharStore !== 'undefined') ? (CharStore.lv(`mcSubclass_${entry.className}`, '') || '') : '';

      const row = document.createElement('div');
      row.className = 'class-popover-row';

      const nameChip = document.createElement('div');
      nameChip.className = 'class-chip';
      nameChip.textContent = entry.className;

      const subChip = document.createElement('div');
      subChip.className = 'class-chip';
      if (sub) {
        subChip.textContent = sub;
      } else {
        subChip.textContent = '—';
        subChip.classList.add('is-empty');
      }

      const lvChip = document.createElement('div');
      lvChip.className = 'class-chip class-chip-level';
      lvChip.textContent = `Lv ${entry.level}`;

      row.append(nameChip, subChip, lvChip);
      container.appendChild(row);
    });
  },
};
