/* =============================================
   DICE ENGINE
   ============================================= */
'use strict';

window.Dice = {
  // Session roll log
  _rollLog: [],

  // Roll a single die
  roll(sides) {
    return Math.floor(Math.random() * sides) + 1;
  },

  // Roll multiple dice: "2d6", "1d20", etc.
  rollDice(count, sides) {
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(this.roll(sides));
    return rolls;
  },

  // Parse and roll a dice expression: "2d6+3", "1d20-1", "4d6kh3" (keep highest 3)
  rollExpression(expr) {
    expr = expr.trim().toLowerCase();
    const parts = expr.match(/^(\d+)d(\d+)(kh(\d+)|kl(\d+))?\s*([+-]\s*\d+)?$/);
    if (!parts) return { rolls: [], total: 0, expr, kept: [], dropped: [] };

    const count = parseInt(parts[1]);
    const sides = parseInt(parts[2]);
    const keepHighest = parts[4] ? parseInt(parts[4]) : null;
    const keepLowest = parts[5] ? parseInt(parts[5]) : null;
    const modifier = parts[6] ? parseInt(parts[6].replace(/\s/g, '')) : 0;

    let rolls = this.rollDice(count, sides);
    let kept = [...rolls];
    let dropped = [];

    if (keepHighest && keepHighest < count) {
      const sorted = [...rolls].map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      const keepIndices = new Set(sorted.slice(0, keepHighest).map(x => x.i));
      kept = [];
      dropped = [];
      rolls.forEach((r, i) => {
        if (keepIndices.has(i)) kept.push(r);
        else dropped.push(r);
      });
    } else if (keepLowest && keepLowest < count) {
      const sorted = [...rolls].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
      const keepIndices = new Set(sorted.slice(0, keepLowest).map(x => x.i));
      kept = [];
      dropped = [];
      rolls.forEach((r, i) => {
        if (keepIndices.has(i)) kept.push(r);
        else dropped.push(r);
      });
    }

    const sum = kept.reduce((a, b) => a + b, 0);
    return { rolls, kept, dropped, modifier, total: sum + modifier, expr };
  },

  // Roll with advantage (2d20, take higher)
  rollAdvantage(modifier) {
    const r1 = this.roll(20);
    const r2 = this.roll(20);
    const used = Math.max(r1, r2);
    return { r1, r2, used, total: used + modifier, advantage: true, modifier };
  },

  // Roll with disadvantage (2d20, take lower)
  rollDisadvantage(modifier) {
    const r1 = this.roll(20);
    const r2 = this.roll(20);
    const used = Math.min(r1, r2);
    return { r1, r2, used, total: used + modifier, disadvantage: true, modifier };
  },

  // Roll d20 with modifier, respecting advantage mode
  rollD20(modifier, mode) {
    if (mode === 'advantage') return this.rollAdvantage(modifier);
    if (mode === 'disadvantage') return this.rollDisadvantage(modifier);
    const r = this.roll(20);
    return { r1: r, r2: null, used: r, total: r + modifier, modifier };
  },

  // 4d6 drop lowest (for ability score rolling)
  roll4d6DropLowest() {
    const result = this.rollExpression('4d6kh3');
    return { rolls: result.rolls, kept: result.kept, dropped: result.dropped, total: result.total };
  },

  // Parse a damage string like "1d8+3" or "2d6+5" and roll it
  rollDamageString(dmgStr) {
    // Handle multiple dice groups: "1d8+2d6+3"
    const cleaned = dmgStr.replace(/\s/g, '').toLowerCase();
    // Simple case: single dice expression
    const result = this.rollExpression(cleaned);
    return result;
  },

  // Roll a compound expression: array of dice groups + flat modifier
  // Each group: { count, sides, mode: 'normal'|'advantage'|'disadvantage' }
  rollCompound(groups, flatMod = 0) {
    const groupResults = groups.map(g => {
      if (g.sides === 20 && g.count === 1 && g.mode === 'advantage') {
        return { ...this.rollAdvantage(0), groupLabel: 'd20 (Adv)' };
      }
      if (g.sides === 20 && g.count === 1 && g.mode === 'disadvantage') {
        return { ...this.rollDisadvantage(0), groupLabel: 'd20 (Dis)' };
      }
      const result = this.rollExpression(`${g.count}d${g.sides}+0`);
      return { ...result, groupLabel: `${g.count}d${g.sides}` };
    });

    const subtotal = groupResults.reduce((sum, r) => sum + r.total, 0);
    const grandTotal = subtotal + flatMod;

    // Detect nat20/nat1 from the first d20 group (if any)
    const d20Group = groupResults.find(r => r.used !== undefined);
    const used = d20Group ? d20Group.used : null;

    return {
      groups: groupResults,
      modifier: flatMod,
      total: grandTotal,
      used,
      compound: true,
    };
  },

  // Format modifier as signed string
  _fmtMod(mod) {
    if (mod === undefined || mod === null) return ' + 0';
    if (mod === 0) return ' + 0';
    return mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`;
  },

  // Build the breakdown line: "rolled + mod = total"
  _buildBreakdown(result) {
    // Compound multi-group rolls
    if (result.compound) {
      const parts = result.groups.map(g => {
        if (g.advantage || g.disadvantage) {
          const tag = g.advantage ? 'Adv' : 'Dis';
          const r1c = g.used === g.r1 ? 'roll-kept' : 'roll-dropped';
          const r2c = g.used === g.r2 ? 'roll-kept' : 'roll-dropped';
          return `<span class="${r1c}">${g.r1}</span>,<span class="${r2c}">${g.r2}</span> (${tag})→${g.used}`;
        }
        if (g.kept && g.kept.length) return g.kept.join('+');
        return `${g.total}`;
      });
      const modVal = result.modifier || 0;
      const modStr = modVal ? (modVal > 0 ? ` + ${modVal}` : ` - ${Math.abs(modVal)}`) : '';
      return parts.join(' + ') + modStr + ` = <strong>${result.total}</strong>`;
    }

    const mod = result.modifier || 0;
    // Advantage / disadvantage d20 rolls
    if (result.advantage || result.disadvantage) {
      const tag = result.advantage ? 'Adv' : 'Dis';
      const r1Class = result.used === result.r1 ? 'roll-kept' : 'roll-dropped';
      const r2Class = result.used === result.r2 ? 'roll-kept' : 'roll-dropped';
      const modStr = this._fmtMod(mod);
      return `<span class="${r1Class}">${result.r1}</span>, <span class="${r2Class}">${result.r2}</span> (${tag}) → <span class="roll-kept">${result.used}</span>${modStr} = <strong>${result.total}</strong>`;
    }
    // Normal d20 roll
    if (result.used !== undefined && result.r1 !== undefined) {
      const modStr = this._fmtMod(mod);
      return `<span class="roll-kept">${result.used}</span>${modStr} = <strong>${result.total}</strong>`;
    }
    // Expression roll (damage, etc.)
    if (result.kept && result.kept.length) {
      const diceStr = result.kept.join(' + ');
      const modStr = this._fmtMod(mod);
      return `${diceStr}${modStr} = <strong>${result.total}</strong>`;
    }
    return `<strong>${result.total}</strong>`;
  },

  // Add to roll log and update panel
  _logRoll(label, result) {
    const entry = {
      label,
      total: result.total,
      breakdown: this._buildBreakdown(result),
      nat20: result.used === 20,
      nat1: result.used === 1,
    };
    this._rollLog.push(entry);
    this._renderLogPanel();
  },

  _renderLogPanel() {
    const list = document.getElementById('roll-log-list');
    if (!list) return;
    if (!this._rollLog.length) {
      list.innerHTML = '<div class="roll-log-empty">No rolls yet this session.</div>';
      return;
    }
    list.innerHTML = '';
    // Most recent first
    [...this._rollLog].reverse().forEach(e => {
      const row = document.createElement('div');
      row.className = 'roll-log-row' + (e.nat20 ? ' crit' : '') + (e.nat1 ? ' fumble' : '');
      row.innerHTML = `<span class="roll-log-row-label">${e.label}</span><span class="roll-log-row-breakdown">${e.breakdown}</span>`;
      list.appendChild(row);
    });
  },

  initLogPanel() {
    const btn = document.getElementById('btn-roll-log');
    const panel = document.getElementById('roll-log-panel');
    const clearBtn = document.getElementById('roll-log-clear');
    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
      // Close theme panel if open
      document.getElementById('theme-panel')?.classList.remove('open');
    });

    clearBtn?.addEventListener('click', () => {
      this._rollLog = [];
      this._renderLogPanel();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('open');
      }
    });
  },

  // Show a roll result toast
  showResult(label, result, element) {
    // Remove any existing toast
    document.querySelectorAll('.roll-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'roll-toast';

    const nat20 = result.used === 20;
    const nat1  = result.used === 1;
    const totalClass = nat20 ? 'crit-success' : nat1 ? 'crit-fail' : '';
    const breakdown = this._buildBreakdown(result);

    toast.innerHTML = `
      <div class="roll-toast-label">${label}</div>
      <div class="roll-toast-breakdown">${breakdown}</div>
      <div class="roll-toast-total ${totalClass}">${result.total}</div>
      ${nat20 ? '<div class="roll-toast-crit">CRITICAL!</div>' : ''}
      ${nat1  ? '<div class="roll-toast-crit fail">FUMBLE!</div>' : ''}
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);

    // Log this roll
    this._logRoll(label, result);
  },
};
