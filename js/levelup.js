/* =============================================
   LEVEL UP SYSTEM
   Modal-driven level up with features, subclass, ASI/feat, and HP
   ============================================= */
'use strict';

window.LevelUp = {
  ASI_LEVELS: [4, 8, 12, 16, 19],
  EXTRA_ASI_LEVELS: { 'Fighter': [6, 14], 'Rogue': [10] },
  EXPERTISE_LEVELS: { 'Rogue': [6], 'Bard': [10] },
  SUBCLASS_LEVELS: {
    'Barbarian': 3, 'Bard': 3, 'Cleric': 3, 'Druid': 3, 'Fighter': 3,
    'Monk': 3, 'Paladin': 3, 'Ranger': 3, 'Rogue': 3, 'Sorcerer': 3,
    'Warlock': 3, 'Wizard': 3, 'Artificer': 3, 'Psion': 3,
  },

  // Per-level choices: subclass, asi, expertise
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

  // Returns the effective base score for an ability, including pending ASI deltas from all levels < beforeLevel
  _getPendingScore(ab, beforeLevel) {
    let score = Sheet.getAbilityScore(ab);
    for (const [lvl, pending] of Object.entries(this._pending)) {
      if (parseInt(lvl) >= beforeLevel) continue;
      if (pending.asi?.type === 'asi' && pending.asi.deltas) {
        score += pending.asi.deltas[ab] || 0;
      } else if (pending.asi?.type === 'feat' && pending.asi.featAbility === ab) {
        score += 1;
      }
    }
    return score;
  },

  _isAsiLevel(level, className) {
    if (this.ASI_LEVELS.includes(level)) return true;
    return (this.EXTRA_ASI_LEVELS[className] || []).includes(level);
  },

  _isExpertiseLevel(level, className) {
    return (this.EXPERTISE_LEVELS[className] || []).includes(level);
  },

  _numLevels() {
    return Math.max(0, this._newLevel - this._startLevel);
  },

  _getHpStats() {
    const className = Sheet.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;
    const hitDieFaces = classInfo?.hitDieFaces || 8;
    // Account for pending CON increases from ASI/feats in this level-up
    const conScore = this._getPendingScore('con', (this._newLevel || 99) + 1);
    const conMod = Sheet.getModFromScore(conScore);
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

  // Parse allowed abilities from a feat's ability array
  _parseFeatAbilities(abilityArr) {
    const result = new Set();
    (abilityArr || []).forEach(ab => {
      if (ab.choose) {
        (ab.choose.from || []).forEach(a => result.add(a));
      } else {
        Object.keys(ab).forEach(a => { if (a !== 'count') result.add(a); });
      }
    });
    return [...result];
  },

  // Get UA subclass features for a specific level by parsing entry name prefixes
  _getUASubclassFeaturesByLevel(subclassName, className, level) {
    const ORDINALS = {
      1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',7:'7th',8:'8th',
      9:'9th',10:'10th',11:'11th',12:'12th',13:'13th',14:'14th',15:'15th',
      16:'16th',17:'17th',18:'18th',19:'19th',20:'20th',
    };
    const prefix = ORDINALS[level];
    if (!prefix) return [];

    const uaData = window.UA2024_DATA;
    if (!uaData) return [];

    const sc = (uaData.subclass || []).find(
      s => s.name === subclassName && s.className === className
    );
    if (!sc) return [];

    const features = [];
    const parseEntries = (entries) => {
      if (!Array.isArray(entries)) return;
      entries.forEach(e => {
        if (typeof e === 'object' && e.type === 'entries') {
          if (e.name && e.name.startsWith(`${prefix} Level:`)) {
            const featureName = e.name.replace(`${prefix} Level:`, '').trim();
            const text = Array.isArray(e.entries)
              ? e.entries.filter(x => typeof x === 'string').join(' ')
              : '';
            features.push({ name: featureName, text });
          } else if (Array.isArray(e.entries)) {
            parseEntries(e.entries);
          }
        }
      });
    };

    sc.entries.forEach(topEntry => {
      if (Array.isArray(topEntry.entries)) parseEntries(topEntry.entries);
    });

    return features;
  },

  // Get standard subclass features from 5etools data for a specific level
  _getStandardSubclassFeaturesByLevel(subclassName, className, level) {
    const details = DndData.classDetails[className];
    if (!details?.subclassFeatures) {
      console.warn(`[LevelUp] No subclassFeatures found for class "${className}". classDetails keys:`, Object.keys(DndData.classDetails));
      return [];
    }
    // subclassName is the full name (e.g. "Path of the Berserker").
    // subclassFeature entries use shortName (e.g. "Berserker"), so resolve it.
    const scEntry = (details.subclasses || []).find(sc => sc.name === subclassName);
    const shortName = scEntry?.shortName || subclassName;

    let results = details.subclassFeatures
      .filter(f => f.level === level &&
        (f.subclassShortName === shortName || f.subclassShortName === subclassName));

    // Fallback: try case-insensitive match on shortName or full name
    if (!results.length) {
      const lowerShort = shortName.toLowerCase();
      const lowerFull = subclassName.toLowerCase();
      results = details.subclassFeatures
        .filter(f => f.level === level &&
          (f.subclassShortName?.toLowerCase() === lowerShort ||
           f.subclassShortName?.toLowerCase() === lowerFull));
    }

    // Fallback: try to match by extracting shortName from the full name
    // e.g. "Path of the Berserker" → "Berserker", "College of Lore" → "Lore"
    if (!results.length && !scEntry) {
      const extracted = subclassName.replace(/^(Path of the |Path of |College of |Circle of the |Circle of |School of |Order of the |Order of |Way of the |Way of |Oath of the |Oath of |Domain of the |Domain of |Pact of the |The )/, '');
      if (extracted !== subclassName) {
        results = details.subclassFeatures
          .filter(f => f.level === level && f.subclassShortName === extracted);
      }
    }

    // Only warn if this level actually has subclass feature entries for *some* subclass
    // (avoids noisy warnings for levels like 2, 4, 5 that have no subclass features at all)
    if (!results.length && details.subclassFeatures.some(f => f.level === level)) {
      console.warn(`[LevelUp] No subclass features matched for "${subclassName}" (shortName="${shortName}") at level ${level}. unique shortNames:`, [...new Set(details.subclassFeatures.map(f => f.subclassShortName))]);
    }

    return results.map(f => ({ name: f.name, text: typeof entriesToText === 'function' ? entriesToText(f.entries) : '' }));
  },

  // Get all subclass features at a level (tries UA then standard)
  _getSubclassFeaturesAtLevel(subclassName, className, level) {
    if (!subclassName) return [];
    const ua = this._getUASubclassFeaturesByLevel(subclassName, className, level);
    if (ua.length) return ua;
    return this._getStandardSubclassFeaturesByLevel(subclassName, className, level);
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
      // If a subclass was chosen during this session, also update the consolidated desc
      this._refreshSubclassDesc();
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
      this._refreshSubclassDesc();
      this._updateHpSection();
    }
  },

  // ---- Per-level features / subclass / ASI (no HP) ----
  _appendLevelSection(level) {
    const container = document.getElementById('lu-levels-container');
    if (!container) return;

    const className = Sheet.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;
    const features = className ? getClassFeaturesByLevel(className) : {};
    const featuresAtLevel = features[level] || [];

    if (!this._pending[level]) this._pending[level] = {};

    const subclassLevel = this.SUBCLASS_LEVELS[className] || 3;
    const storedSubclass = (Sheet.lv('charSubclass', '') || '').trim();
    // Also check pending subclass choice (user may have picked one during this session)
    const pendingSubclass = this._pending[subclassLevel]?.subclass || '';
    const existingSubclass = pendingSubclass || storedSubclass;
    // Always show subclass picker at the subclass level (even if already chosen)
    const showsSubclass = level === subclassLevel && classInfo?.subclasses?.length > 0;
    const needsAsi = this._isAsiLevel(level, className);
    const needsExpertise = this._isExpertiseLevel(level, className);

    // Subclass features for currently selected subclass at this level
    const subclassFeatures = existingSubclass
      ? this._getSubclassFeaturesAtLevel(existingSubclass, className, level)
      : [];

    let html = `<div class="lu-level-section" id="lu-level-section-${level}">`;
    html += `<div class="lu-level-section-header">Level ${level}</div>`;

    // Class features — hide generic "Subclass Feature" placeholders when we have real data
    // or replace them with a hint when no subclass is chosen yet
    const hasSubclassPlaceholder = featuresAtLevel.some(f => /subclass feature/i.test(f.name));
    let filteredClassFeatures;
    if (subclassFeatures.length) {
      // We have real subclass features — remove generic placeholders
      filteredClassFeatures = featuresAtLevel.filter(f => !/subclass feature/i.test(f.name));
    } else if (hasSubclassPlaceholder && !existingSubclass) {
      // No subclass chosen yet — replace placeholder with a hint
      filteredClassFeatures = featuresAtLevel.map(f => {
        if (/subclass feature/i.test(f.name)) {
          return { name: f.name, text: `Choose a subclass at Level ${subclassLevel} to see details.` };
        }
        return f;
      });
    } else {
      filteredClassFeatures = featuresAtLevel;
    }

    if (filteredClassFeatures.length) {
      const featureHtml = filteredClassFeatures.map(f => `
        <li>
          <div class="lu-feature-name">${f.name}</div>
          ${f.text ? `<div class="lu-feature-desc">${f.text}</div>` : ''}
        </li>`).join('');
      html += `
        <div class="lu-section">
          <ul class="lu-features-list">${featureHtml}</ul>
        </div>`;
    }

    // Subclass features at this level
    if (subclassFeatures.length) {
      const scFeatHtml = subclassFeatures.map(f => `
        <li>
          <div class="lu-feature-name">${f.name}</div>
          ${f.text ? `<div class="lu-feature-desc">${f.text}</div>` : ''}
        </li>`).join('');
      html += `
        <div class="lu-section lu-subclass-features-section" id="lu-sc-feat-section-${level}">
          <div class="lu-section-title">${existingSubclass} Features</div>
          <ul class="lu-features-list">${scFeatHtml}</ul>
        </div>`;
    }

    // Subclass picker (always shown at subclass level)
    if (showsSubclass) {
      const globalUA = typeof isUAEnabled === 'function' ? isUAEnabled() : true;
      html += `
        <div class="lu-section" id="lu-subclass-section-${level}">
          <div class="lu-subclass-title-row">
            <div class="lu-section-title" style="margin:0">Choose Your Subclass${existingSubclass ? ' <span style="font-size:0.8rem;color:var(--ink-faint)">(currently: ' + existingSubclass + ')</span>' : ''}</div>
            <button type="button" class="lu-ua-toggle-btn${globalUA ? ' active' : ''}" id="lu-ua-toggle-${level}"
              title="${globalUA ? 'UA subclasses shown — click to hide' : 'Click to show Unearthed Arcana subclasses'}">
              UA
            </button>
          </div>
          <select id="lu-subclass-select-${level}" class="lu-subclass-select">
            <option value="">— Select a subclass —</option>
          </select>
          <div id="lu-subclass-desc-${level}" class="lu-subclass-desc"></div>
        </div>`;
      // Pre-fill pending with existing subclass so validation doesn't block
      if (existingSubclass) this._pending[level].subclass = existingSubclass;
    }

    // ASI section — 2 options: Ability Score Improvement or Take a Feat
    if (needsAsi) {
      this._pending[level].asi = { type: null };
      const ua      = typeof isUAEnabled  === 'function' ? isUAEnabled()  : true;
      const show24f = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
      const show14f = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
      // Only General feats valid at an ASI — exclude Fighting Styles (FS) and Epic Boons (EB)
      const EXCLUDED_FEAT_CATEGORIES = new Set(['FS', 'EB']);
      const featOptions = DndData.feats
        .filter(f => {
          if (EXCLUDED_FEAT_CATEGORIES.has(f.category)) return false;
          // UA2024 feats require both UA and 2024 toggles on
          if (f.source === 'UA2024') return ua && show24f;
          // Other 2024-edition feats (XPHB etc.)
          if (typeof is2024Source === 'function' && is2024Source(f.source)) return show24f;
          // Everything else is 2014-era (including old UA like UAFeats, UAGrappler…)
          return show14f;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      const featDatalist = featOptions.map(f => `<option value="${f.name} — ${f._src || ''}">`).join('');

      html += `
        <div class="lu-section" id="lu-asi-section-${level}">
          <div class="lu-section-title">Ability Score Improvement</div>
          <div class="lu-asi-options">
            <label class="lu-asi-choice">
              <input type="radio" name="lu-asi-type-${level}" value="asi">
              <div class="lu-asi-label">Ability Score Improvement <span style="color:var(--ink-faint);font-size:0.85rem">(+2 points to spend)</span></div>
            </label>
            <label class="lu-asi-choice">
              <input type="radio" name="lu-asi-type-${level}" value="feat">
              <div class="lu-asi-label">Take a Feat</div>
            </label>
          </div>

          <div id="lu-asi-points-${level}" style="display:none; margin-top:0.75rem;">
            <div class="lu-asi-point-bar">
              <span class="lu-asi-point-label">Points to spend</span>
              <span class="lu-asi-point-pips" id="lu-asi-pts-left-${level}">
                <span class="lu-pip lu-pip--full"></span><span class="lu-pip lu-pip--full"></span>
              </span>
              <span class="lu-asi-point-hint">max +2 to any one ability</span>
            </div>
            <div class="lu-ab-card-grid">
              ${Sheet.ABILITIES.map(ab => `
                <div class="lu-ab-card" id="lu-ab-card-${level}-${ab}">
                  <div class="lu-ab-card-label">${ab.toUpperCase()}</div>
                  <button type="button" class="lu-ab-stepper-btn" data-ab="${ab}" data-dir="1" aria-label="Increase ${ab}">+</button>
                  <span class="lu-ab-stepper-val" id="lu-ab-val-${level}-${ab}">${this._getPendingScore(ab, level)}</span>
                  <button type="button" class="lu-ab-stepper-btn" data-ab="${ab}" data-dir="-1" aria-label="Decrease ${ab}">−</button>
                  <div class="lu-ab-card-delta" id="lu-ab-delta-${level}-${ab}"></div>
                </div>`).join('')}
            </div>
          </div>

          <div id="lu-asi-feat-${level}" style="display:none; margin-top:0.75rem;">
            <input class="lu-feat-search" id="lu-feat-input-${level}" list="lu-feat-datalist-${level}"
              placeholder="Search feats…" autocomplete="off">
            <datalist id="lu-feat-datalist-${level}">${featDatalist}</datalist>
            <div id="lu-feat-desc-${level}" class="lu-feat-desc" style="display:none;"></div>
            <div id="lu-feat-ability-panel-${level}" style="display:none; margin-top:0.85rem;">
              <div class="lu-feat-ability-header">This feat grants <strong>+1</strong> to one ability score:</div>
              <div class="lu-feat-ab-cards" id="lu-feat-ability-grid-${level}"></div>
            </div>
            <div id="lu-feat-spell-panel-${level}" style="display:none; margin-top:0.85rem;"></div>
          </div>
        </div>`;
    }

    // Weapon Mastery slot increase
    const prevMasterySlots = typeof ClassResources !== 'undefined' ? ClassResources.getMasterySlots(className, level - 1) : 0;
    const newMasterySlots = typeof ClassResources !== 'undefined' ? ClassResources.getMasterySlots(className, level) : 0;
    const masteryIncrease = newMasterySlots - prevMasterySlots;
    if (masteryIncrease > 0) {
      const currentMastery = CharStore.lv('weaponMastery', []) || [];
      const allowRanged = typeof ClassResources !== 'undefined' && ClassResources.allowsRangedMastery(className);
      const allWeapons = typeof getWeaponsForMastery === 'function' ? getWeaponsForMastery(allowRanged) : [];
      const available = allWeapons.filter(w => !currentMastery.includes(w.name));
      html += `
        <div class="lu-section" id="lu-mastery-section-${level}">
          <div class="lu-section-title">Weapon Mastery — Choose ${masteryIncrease} New Weapon${masteryIncrease > 1 ? 's' : ''}</div>
          <div style="font-size:0.85rem;color:var(--ink-faint);margin-bottom:0.5rem;">
            Current mastery: ${currentMastery.join(', ') || 'None'}. You gain ${masteryIncrease} additional slot${masteryIncrease > 1 ? 's' : ''}.
          </div>
          ${Array.from({length: masteryIncrease}, (_, i) => `
            <select class="lu-mastery-select rest-select" data-mastery-idx="${i}" style="margin-bottom:4px;width:100%">
              <option value="">— Choose weapon —</option>
              ${available.map(w => `<option value="${w.name}">${w.name} (${w.category})</option>`).join('')}
            </select>
          `).join('')}
        </div>`;
      this._pending[level].masteryChoices = [];
    }

    // Expertise section (e.g. Rogue level 6)
    if (needsExpertise) {
      const proficientSkills = Sheet.SKILLS.filter(s => Sheet.lv(`skillProf_${s.key}`, false));
      const alreadyExpert = Sheet.SKILLS
        .filter(s => Sheet.lv(`skillExpert_${s.key}`, false))
        .map(s => s.key);
      const eligible = proficientSkills.filter(s => !alreadyExpert.includes(s.key));

      html += `
        <div class="lu-section" id="lu-expertise-section-${level}">
          <div class="lu-section-title">Expertise — Choose 2 Skills</div>
          <div style="font-size:0.85rem;color:var(--ink-faint);margin-bottom:0.5rem;">
            Select 2 skills you're proficient in to gain Expertise (double proficiency bonus).
          </div>
          <div class="lu-expertise-grid">
            ${eligible.length ? eligible.map(s => `
              <label class="lu-expertise-choice">
                <input type="checkbox" class="lu-expertise-cb" data-skill="${s.key}" value="${s.key}">
                ${s.label}
              </label>`).join('') : '<span style="color:var(--ink-faint)">No eligible skills found.</span>'}
          </div>
          <div class="lu-points-left" id="lu-expertise-msg-${level}">Select 2 skills (<span id="lu-expertise-left-${level}">2</span> remaining)</div>
        </div>`;
      this._pending[level].expertise = [];
    }

    // Spellbook spell selection (Wizard: gain 2 new spells per level)
    const spellbookPerLevel = classInfo?.spellbookSpellsPerLevel || 0;
    const hasNewSpellbookSlots = spellbookPerLevel > 0 && level > 1;
    if (hasNewSpellbookSlots) {
      const maxSpellLevel = typeof getMaxSpellLevel === 'function' ? getMaxSpellLevel(className, level) : 1;
      const prevMaxSpellLevel = typeof getMaxSpellLevel === 'function' ? getMaxSpellLevel(className, level - 1) : 1;
      this._pending[level].newSpells = [];
      // Build spell level tabs
      const tabsHtml = Array.from({ length: maxSpellLevel }, (_, i) => {
        const sl = i + 1;
        const isNew = sl > prevMaxSpellLevel;
        const isDefault = sl === maxSpellLevel;
        return `<button class="lu-spell-tab${isDefault ? ' active' : ''}" data-splvl="${sl}">${sl === 1 ? '1st' : sl === 2 ? '2nd' : sl === 3 ? '3rd' : sl + 'th'}${isNew ? ' ✦' : ''}</button>`;
      }).join('');
      html += `
        <div class="lu-section" id="lu-spellbook-section-${level}">
          <div class="lu-section-title">Spellbook — Add ${spellbookPerLevel} New Spell${spellbookPerLevel > 1 ? 's' : ''}</div>
          <div style="font-size:0.85rem;color:var(--ink-faint);margin-bottom:0.5rem;">
            Choose ${spellbookPerLevel} ${className} spell${spellbookPerLevel > 1 ? 's' : ''} to add to your spellbook (up to level ${maxSpellLevel}).
          </div>
          <div class="lu-spell-tabs" id="lu-spell-tabs-${level}">${tabsHtml}</div>
          <input type="text" class="lu-spell-search wiz-search wiz-search-sm" id="lu-spell-search-${level}" placeholder="Search spells..." autocomplete="off" style="margin-bottom:6px">
          <div class="lu-spellbook-list" id="lu-spellbook-list-${level}" style="max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);"></div>
          <div class="lu-points-left" id="lu-spell-msg-${level}">Select ${spellbookPerLevel} spell${spellbookPerLevel > 1 ? 's' : ''} (<span id="lu-spell-left-${level}">${spellbookPerLevel}</span> remaining)</div>
        </div>`;
    }

    // Cantrip gain (e.g., Wizard gains a cantrip at levels 4 and 10)
    const cantripProg = classInfo?.cantripProgression;
    const prevCantrips = cantripProg ? (cantripProg[level - 2] ?? 0) : 0;
    const newCantrips = cantripProg ? (cantripProg[level - 1] ?? 0) : 0;
    const cantripGain = newCantrips - prevCantrips;
    if (cantripGain > 0 && level > 1) {
      this._pending[level].newCantrips = [];
      html += `
        <div class="lu-section" id="lu-cantrip-section-${level}">
          <div class="lu-section-title">New Cantrip${cantripGain > 1 ? 's' : ''}</div>
          <div style="font-size:0.85rem;color:var(--ink-faint);margin-bottom:0.5rem;">
            You learn ${cantripGain} new ${className} cantrip${cantripGain > 1 ? 's' : ''}.
          </div>
          <input type="text" class="lu-cantrip-search wiz-search wiz-search-sm" id="lu-cantrip-search-${level}" placeholder="Search cantrips..." autocomplete="off" style="margin-bottom:6px">
          <div class="lu-cantrip-list" id="lu-cantrip-list-${level}" style="max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);"></div>
          <div class="lu-points-left" id="lu-cantrip-msg-${level}">Select ${cantripGain} cantrip${cantripGain > 1 ? 's' : ''} (<span id="lu-cantrip-left-${level}">${cantripGain}</span> remaining)</div>
        </div>`;
    }

    html += `</div>`;
    container.insertAdjacentHTML('beforeend', html);

    const sectionEl = document.getElementById(`lu-level-section-${level}`);
    if (showsSubclass) this._bindSubclassForLevel(sectionEl, level, existingSubclass);
    if (needsAsi)      this._bindAsiLogicForLevel(sectionEl, level);
    if (needsExpertise) this._bindExpertiseForLevel(sectionEl, level);
    // Bind mastery selects
    if (masteryIncrease > 0) {
      sectionEl.querySelectorAll('.lu-mastery-select').forEach(sel => {
        sel.addEventListener('change', () => {
          const choices = [];
          sectionEl.querySelectorAll('.lu-mastery-select').forEach(s => {
            if (s.value) choices.push(s.value);
          });
          this._pending[level].masteryChoices = choices;
        });
      });
    }
    // Bind spellbook spell selection
    if (hasNewSpellbookSlots) {
      this._bindSpellbookForLevel(sectionEl, level, className, classInfo);
    }
    // Bind cantrip gain selection
    if (cantripGain > 0 && level > 1) {
      this._bindCantripGainForLevel(sectionEl, level, className, cantripGain);
    }
  },

  // ---- Spellbook spell selection for level-up ----
  _bindSpellbookForLevel(_sectionEl, level, className, classInfo) {
    const maxSpellLevel = typeof getMaxSpellLevel === 'function' ? getMaxSpellLevel(className, level) : 1;
    const maxPicks = classInfo?.spellbookSpellsPerLevel || 2;
    const allSpells = typeof getSpellsForClass === 'function' ? getSpellsForClass(className) : [];
    const ua = typeof isUAEnabled === 'function' ? isUAEnabled() : true;
    const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
    const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
    const eligible = allSpells.filter(s => {
      if (s.level < 1 || s.level > maxSpellLevel) return false;
      if (s.source === 'UA2024') return ua && show24;
      if (typeof is2024Source === 'function' && is2024Source(s.source)) return show24;
      return show14;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const listEl = document.getElementById(`lu-spellbook-list-${level}`);
    const searchEl = document.getElementById(`lu-spell-search-${level}`);
    const tabsEl = document.getElementById(`lu-spell-tabs-${level}`);
    if (!listEl) return;

    // Default to highest spell level (new unlocked level gets priority)
    let activeTabLevel = maxSpellLevel;

    const currentSpells = new Set((Sheet.lv('charSpells', []) || []).map(s => s.name.toLowerCase()));

    const renderList = (filter) => {
      listEl.innerHTML = '';
      const q = (filter || '').toLowerCase();
      const filtered = eligible.filter(s =>
        s.level === activeTabLevel && (!q || s.name.toLowerCase().includes(q))
      );
      filtered.forEach(spell => {
        const alreadyKnown = currentSpells.has(spell.name.toLowerCase());
        const isSelected = (this._pending[level].newSpells || []).includes(spell.name);
        const atMax = !isSelected && (this._pending[level].newSpells || []).length >= maxPicks;
        const row = document.createElement('label');
        row.className = 'wiz-spell-row' + (isSelected ? ' selected' : '') + (atMax || alreadyKnown ? ' disabled' : '');
        if (atMax || alreadyKnown) row.style.opacity = '0.45';
        row.innerHTML = `
          <span class="wiz-spell-col-check"><input type="checkbox" ${isSelected ? 'checked' : ''} ${atMax || alreadyKnown ? 'disabled' : ''}></span>
          <span class="wiz-spell-col-name">${spell.name}${alreadyKnown ? ' <small>(known)</small>' : ''}</span>
          <span class="wiz-spell-col-school">${spell._schoolName || ''}</span>
          <span class="wiz-spell-col-cast">${spell._castTime || ''}</span>
          <span class="wiz-spell-col-range">${spell._rangeStr || ''}</span>
          <span class="wiz-spell-col-comp">${spell._componentsStr || ''}</span>
          <span class="wiz-spell-col-dur">${spell._durationStr || ''}</span>`;
        const cb = row.querySelector('input');
        cb.addEventListener('change', () => {
          if (!this._pending[level].newSpells) this._pending[level].newSpells = [];
          if (cb.checked) {
            if (this._pending[level].newSpells.length >= maxPicks) { cb.checked = false; return; }
            this._pending[level].newSpells.push(spell.name);
          } else {
            this._pending[level].newSpells = this._pending[level].newSpells.filter(n => n !== spell.name);
          }
          renderList(searchEl?.value || '');
          const leftEl = document.getElementById(`lu-spell-left-${level}`);
          if (leftEl) leftEl.textContent = maxPicks - this._pending[level].newSpells.length;
        });
        listEl.appendChild(row);
      });
    };

    // Bind tab clicks
    if (tabsEl) {
      tabsEl.querySelectorAll('.lu-spell-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          activeTabLevel = parseInt(tab.dataset.splvl);
          tabsEl.querySelectorAll('.lu-spell-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          if (searchEl) searchEl.value = '';
          renderList('');
        });
      });
    }

    renderList('');
    searchEl?.addEventListener('input', () => renderList(searchEl.value));
  },

  // ---- Cantrip gain selection for level-up ----
  _bindCantripGainForLevel(_sectionEl, level, className, maxPicks) {
    const allSpells = typeof getSpellsForClass === 'function' ? getSpellsForClass(className) : [];
    const ua = typeof isUAEnabled === 'function' ? isUAEnabled() : true;
    const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
    const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
    const cantrips = allSpells.filter(s => {
      if (s.level !== 0) return false;
      if (s.source === 'UA2024') return ua && show24;
      if (typeof is2024Source === 'function' && is2024Source(s.source)) return show24;
      return show14;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const listEl = document.getElementById(`lu-cantrip-list-${level}`);
    const searchEl = document.getElementById(`lu-cantrip-search-${level}`);
    if (!listEl) return;

    const currentCantrips = new Set(
      (Sheet.lv('charSpells', []) || []).filter(s => s.level === 0).map(s => s.name.toLowerCase())
    );

    const renderList = (filter) => {
      listEl.innerHTML = '';
      const q = (filter || '').toLowerCase();
      const filtered = cantrips.filter(s => !q || s.name.toLowerCase().includes(q));
      filtered.forEach(spell => {
        const alreadyKnown = currentCantrips.has(spell.name.toLowerCase());
        const isSelected = (this._pending[level].newCantrips || []).includes(spell.name);
        const atMax = !isSelected && (this._pending[level].newCantrips || []).length >= maxPicks;
        const row = document.createElement('label');
        row.className = 'wiz-spell-row' + (isSelected ? ' selected' : '') + (atMax || alreadyKnown ? ' disabled' : '');
        if (atMax || alreadyKnown) row.style.opacity = '0.45';
        row.innerHTML = `
          <span class="wiz-spell-col-check"><input type="checkbox" ${isSelected ? 'checked' : ''} ${atMax || alreadyKnown ? 'disabled' : ''}></span>
          <span class="wiz-spell-col-name">${spell.name}${alreadyKnown ? ' <small>(known)</small>' : ''}</span>
          <span class="wiz-spell-col-school">${spell._schoolName || ''}</span>
          <span class="wiz-spell-col-cast">${spell._castTime || ''}</span>
          <span class="wiz-spell-col-range">${spell._rangeStr || ''}</span>
          <span class="wiz-spell-col-comp">${spell._componentsStr || ''}</span>
          <span class="wiz-spell-col-dur">${spell._durationStr || ''}</span>`;
        const cb = row.querySelector('input');
        cb.addEventListener('change', () => {
          if (!this._pending[level].newCantrips) this._pending[level].newCantrips = [];
          if (cb.checked) {
            if (this._pending[level].newCantrips.length >= maxPicks) { cb.checked = false; return; }
            this._pending[level].newCantrips.push(spell.name);
          } else {
            this._pending[level].newCantrips = this._pending[level].newCantrips.filter(n => n !== spell.name);
          }
          renderList(searchEl?.value || '');
          const leftEl = document.getElementById(`lu-cantrip-left-${level}`);
          if (leftEl) leftEl.textContent = maxPicks - this._pending[level].newCantrips.length;
        });
        listEl.appendChild(row);
      });
    };
    renderList('');
    searchEl?.addEventListener('input', () => renderList(searchEl.value));
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
    const cl = this._startLevel;

    // Level 1 HP = max hit die + CON mod; levels 2+ = floor(die/2) + 1 + CON mod
    const level1Hp  = Math.max(1, hitDieFaces + conMod);
    const perLevel  = Math.max(1, Math.floor(hitDieFaces / 2) + 1 + conMod);
    const recalcTotal = level1Hp + (nl - 1) * perLevel;
    const recalcDelta = recalcTotal - currentMax;

    this._hp = { choice: 'recalc', rolls: [], manualValue: recalcDelta };

    // Build summary of features being lost
    const lostItems = [];
    const subclassLevel = this.SUBCLASS_LEVELS[className] || 3;
    if (nl < subclassLevel && cl >= subclassLevel) {
      const sc = (Sheet.lv('charSubclass', '') || '').trim();
      lostItems.push(`Subclass${sc ? ' (' + sc + ')' : ''}`);
    }
    for (let lvl = nl + 1; lvl <= cl; lvl++) {
      if (this._isAsiLevel(lvl, className)) lostItems.push(`Level ${lvl}: Ability Score Improvement / Feat`);
      if (this._isExpertiseLevel(lvl, className)) lostItems.push(`Level ${lvl}: Expertise`);
      if (typeof ClassResources !== 'undefined') {
        const prev = ClassResources.getMasterySlots(className, lvl - 1);
        const cur  = ClassResources.getMasterySlots(className, lvl);
        if (cur > prev) lostItems.push(`Level ${lvl}: Weapon Mastery (${cur - prev} slot${cur - prev > 1 ? 's' : ''})`);
      }
    }

    const lostHtml = lostItems.length
      ? `<div class="lu-section">
          <div class="lu-section-title" style="color:var(--red)">Features That Will Be Removed</div>
          <ul class="lu-features-list">${lostItems.map(i => `<li><div class="lu-feature-name">${i}</div></li>`).join('')}</ul>
          <div style="font-size:0.8rem;color:var(--ink-faint);margin-top:0.4rem;">Weapon mastery and expertise will be automatically removed. ASI / feat changes must be reverted manually.</div>
        </div>`
      : '';

    body.insertAdjacentHTML('beforeend', lostHtml + `
      <div class="lu-section">
        <div class="lu-section-title">Hit Points</div>
        <div class="lu-hp-method-options">
          <label class="lu-asi-choice" id="lu-hp-none">
            <input type="radio" name="lu-hp-method-down" value="none">
            <div class="lu-asi-label">Don't adjust HP (manual)</div>
          </label>
          <label class="lu-asi-choice selected" id="lu-hp-recalc">
            <input type="radio" name="lu-hp-method-down" value="recalc" checked>
            <div class="lu-asi-label">Recalculate HP for new level</div>
          </label>
        </div>
        <div style="font-size:0.8rem;color:var(--ink-faint);margin-bottom:0.4rem;">
          d${hitDieFaces} hit die, ${conMod >= 0 ? '+' : ''}${conMod} CON mod &mdash;
          Level 1: ${level1Hp} HP, Levels 2+: ${perLevel} HP each
        </div>
        <div class="lu-hp-gain" style="margin-top:8px">
          Max HP: ${currentMax}<span id="lu-hp-arrow-down"> &rarr; <strong>${recalcTotal}</strong></span>
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
          this._hp.manualValue = recalcDelta;
          if (arrowEl) arrowEl.innerHTML = ` &rarr; <strong>${recalcTotal}</strong>`;
        }
      });
    });
  },

  // ---- Refresh the consolidated subclass feature desc when level range changes ----
  _refreshSubclassDesc() {
    const className = Sheet.lv('charClass', '');
    const subclassLevel = this.SUBCLASS_LEVELS[className] || 3;
    const chosenSubclass = this._pending[subclassLevel]?.subclass || (Sheet.lv('charSubclass', '') || '').trim();
    if (!chosenSubclass) return;

    // Inject/refresh per-level subclass feature sections
    for (let lvl = this._startLevel + 1; lvl <= this._newLevel; lvl++) {
      const sec = document.getElementById(`lu-level-section-${lvl}`);
      if (!sec) continue;

      sec.querySelector('.lu-subclass-features-section')?.remove();

      const feats = this._getSubclassFeaturesAtLevel(chosenSubclass, className, lvl);
      if (feats.length) {
        const scFeatHtml = feats.map(f => `
          <li>
            <div class="lu-feature-name">${f.name}</div>
            ${f.text ? `<div class="lu-feature-desc">${f.text}</div>` : ''}
          </li>`).join('');
        const scDiv = document.createElement('div');
        scDiv.className = 'lu-section lu-subclass-features-section';
        scDiv.id = `lu-sc-feat-section-${lvl}`;
        scDiv.innerHTML = `<div class="lu-section-title">${chosenSubclass} Features</div><ul class="lu-features-list">${scFeatHtml}</ul>`;
        const asiSection = sec.querySelector(`#lu-asi-section-${lvl}`);
        const masterySection = sec.querySelector(`#lu-mastery-section-${lvl}`);
        const expertiseSection = sec.querySelector(`#lu-expertise-section-${lvl}`);
        const insertBefore = asiSection || masterySection || expertiseSection || null;
        if (insertBefore) sec.insertBefore(scDiv, insertBefore);
        else sec.appendChild(scDiv);
      }
    }
  },

  // ---- Subclass binding ----
  _bindSubclassForLevel(sectionEl, level, existingSubclass) {
    const sel     = sectionEl.querySelector(`#lu-subclass-select-${level}`);
    const desc    = sectionEl.querySelector(`#lu-subclass-desc-${level}`);
    const uaBtn   = sectionEl.querySelector(`#lu-ua-toggle-${level}`);
    if (!sel) return;

    const className = Sheet.lv('charClass', '');
    const classInfo = className ? getClassInfo(className) : null;

    // Local UA override: starts at the global toggle value
    let localUA = typeof isUAEnabled === 'function' ? isUAEnabled() : true;

    const buildOptions = () => {
      const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
      const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
      const subclasses = (classInfo?.subclasses || [])
        .filter(sc => {
          if (sc.source === 'UA2024') return localUA && show24;
          if (typeof is2024Source === 'function' && is2024Source(sc.source)) return show24;
          return show14;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      const current = sel.value || existingSubclass || '';
      sel.innerHTML = `<option value="">— Select a subclass —</option>` +
        subclasses.map(sc =>
          `<option value="${sc.name}"${sc.name === current ? ' selected' : ''}>${sc.name}${sc.src ? '  [' + sc.src + ']' : ''}</option>`
        ).join('');
    };

    // Initial population
    buildOptions();

    // UA toggle button
    if (uaBtn) {
      uaBtn.addEventListener('click', () => {
        localUA = !localUA;
        uaBtn.classList.toggle('active', localUA);
        uaBtn.title = localUA ? 'UA subclasses shown — click to hide' : 'Click to show Unearthed Arcana subclasses';
        buildOptions();
      });
    }

    sel.addEventListener('change', () => {
      if (!this._pending[level]) this._pending[level] = {};
      this._pending[level].subclass = sel.value || existingSubclass || null;

      // Remove generic "Subclass Feature" placeholders and inject per-level subclass features
      const chosenSubclass = sel.value || existingSubclass || '';

      const injectSubclassFeatures = (sec, secLevel) => {
        // Remove generic placeholder list items
        sec.querySelectorAll('.lu-feature-name').forEach(el => {
          if (/subclass feature/i.test(el.textContent)) el.closest('li')?.remove();
        });
        // Remove old injected subclass feature section (if any)
        sec.querySelector('.lu-subclass-features-section')?.remove();
        // Inject new subclass feature section
        if (chosenSubclass) {
          const feats = this._getSubclassFeaturesAtLevel(chosenSubclass, className, secLevel);
          if (feats.length) {
            const scFeatHtml = feats.map(f => `
              <li>
                <div class="lu-feature-name">${f.name}</div>
                ${f.text ? `<div class="lu-feature-desc">${f.text}</div>` : ''}
              </li>`).join('');
            const scDiv = document.createElement('div');
            scDiv.className = 'lu-section lu-subclass-features-section';
            scDiv.id = `lu-sc-feat-section-${secLevel}`;
            scDiv.innerHTML = `<div class="lu-section-title">${chosenSubclass} Features</div><ul class="lu-features-list">${scFeatHtml}</ul>`;
            const asiSection = sec.querySelector(`#lu-asi-section-${secLevel}`);
            const masterySection = sec.querySelector(`#lu-mastery-section-${secLevel}`);
            const expertiseSection = sec.querySelector(`#lu-expertise-section-${secLevel}`);
            const subclassSection = sec.querySelector(`#lu-subclass-section-${secLevel}`);
            const insertBefore = asiSection || masterySection || expertiseSection || null;
            if (insertBefore) sec.insertBefore(scDiv, insertBefore);
            else if (subclassSection) subclassSection.insertAdjacentElement('afterend', scDiv);
            else sec.appendChild(scDiv);
          }
        }
      };

      document.querySelectorAll('[id^="lu-level-section-"]').forEach(sec => {
        const secLevel = parseInt(sec.id.replace('lu-level-section-', ''));
        injectSubclassFeatures(sec, secLevel);
      });

      // Clear consolidated desc (features are shown per-level above)
      if (desc) desc.innerHTML = '';
    });
  },

  // ---- ASI binding (2 options: ASI with +/- buttons, or Feat) ----
  _bindAsiLogicForLevel(sectionEl, level) {
    const typeRadios = sectionEl.querySelectorAll(`input[name="lu-asi-type-${level}"]`);
    const asiPanel  = sectionEl.querySelector(`#lu-asi-points-${level}`);
    const featPanel = sectionEl.querySelector(`#lu-asi-feat-${level}`);

    // Track deltas per ability
    const deltas = {};
    Sheet.ABILITIES.forEach(ab => { deltas[ab] = 0; });
    let totalSpent = 0;

    typeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        sectionEl.querySelectorAll('.lu-asi-options .lu-asi-choice').forEach(el => el.classList.remove('selected'));
        radio.closest('.lu-asi-choice').classList.add('selected');
        if (asiPanel)  asiPanel.style.display  = radio.value === 'asi'  ? 'block' : 'none';
        if (featPanel) featPanel.style.display = radio.value === 'feat' ? 'block' : 'none';
        if (!this._pending[level]) this._pending[level] = {};
        this._pending[level].asi = { type: radio.value };
        // Reset deltas when switching types
        Sheet.ABILITIES.forEach(ab => { deltas[ab] = 0; });
        totalSpent = 0;
        Sheet.ABILITIES.forEach(ab => {
          const valEl   = sectionEl.querySelector(`#lu-ab-val-${level}-${ab}`);
          const deltaEl = sectionEl.querySelector(`#lu-ab-delta-${level}-${ab}`);
          const cardEl  = sectionEl.querySelector(`#lu-ab-card-${level}-${ab}`);
          if (valEl)   valEl.textContent = this._getPendingScore(ab, level);
          if (deltaEl) { deltaEl.textContent = ''; deltaEl.className = 'lu-ab-card-delta'; }
          if (cardEl)  cardEl.classList.remove('lu-ab-card--raised');
        });
        const pipsEl = sectionEl.querySelector(`#lu-asi-pts-left-${level}`);
        if (pipsEl) pipsEl.innerHTML = '<span class="lu-pip lu-pip--full"></span><span class="lu-pip lu-pip--full"></span>';
      });
    });

    // +/- stepper buttons for ASI
    sectionEl.querySelectorAll('.lu-ab-stepper-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ab  = btn.dataset.ab;
        const dir = parseInt(btn.dataset.dir);
        const newDelta = deltas[ab] + dir;
        const newTotal = totalSpent + dir;
        if (newTotal < 0 || newTotal > 2) return;
        if (newDelta < 0 || newDelta > 2) return;
        if (this._getPendingScore(ab, level) + newDelta > 20) return;
        deltas[ab] = newDelta;
        totalSpent = newTotal;

        const valEl   = sectionEl.querySelector(`#lu-ab-val-${level}-${ab}`);
        const deltaEl = sectionEl.querySelector(`#lu-ab-delta-${level}-${ab}`);
        const cardEl  = sectionEl.querySelector(`#lu-ab-card-${level}-${ab}`);
        if (valEl) {
          const base = this._getPendingScore(ab, level);
          valEl.textContent = base + newDelta;
        }
        if (deltaEl) {
          deltaEl.textContent = newDelta > 0 ? `+${newDelta}` : '';
          deltaEl.className = `lu-ab-card-delta${newDelta > 0 ? ' lu-ab-card-delta--active' : ''}`;
        }
        if (cardEl) cardEl.classList.toggle('lu-ab-card--raised', newDelta > 0);

        // Update pip indicators
        const pipsEl = sectionEl.querySelector(`#lu-asi-pts-left-${level}`);
        if (pipsEl) {
          const left = 2 - totalSpent;
          pipsEl.innerHTML = [0,1].map(i =>
            `<span class="lu-pip${i < left ? ' lu-pip--full' : ' lu-pip--empty'}"></span>`
          ).join('');
        }

        if (!this._pending[level]) this._pending[level] = {};
        this._pending[level].asi = { type: 'asi', deltas: { ...deltas } };
        this._updateHpSection();
      });
    });

    // Feat search input
    const featInput = sectionEl.querySelector(`#lu-feat-input-${level}`);
    if (featInput) {
      featInput.addEventListener('input', e => {
        const val  = e.target.value;
        const parts = val.includes(' — ') ? val.split(' — ') : [val];
        const name = parts[0].trim();
        const src  = parts[1]?.trim() || null;
        if (!this._pending[level]) this._pending[level] = {};
        this._pending[level].asi = { type: 'feat', feat: name, featAbility: null };

        // Check if this feat has an ability bonus and render picker
        const abilityPanel = sectionEl.querySelector(`#lu-feat-ability-panel-${level}`);
        const abilityGrid  = sectionEl.querySelector(`#lu-feat-ability-grid-${level}`);
        if (!abilityPanel || !abilityGrid) return;

        const featInfo = typeof getFeatInfo === 'function' ? getFeatInfo(name, src) : null;

        // Show/update feat description
        const descEl = sectionEl.querySelector(`#lu-feat-desc-${level}`);
        if (descEl) {
          if (featInfo?.description) {
            descEl.innerHTML = `
              <div class="lu-feat-desc-header">
                <span class="lu-feat-desc-name">${featInfo.name}</span>
                ${featInfo.category ? `<span class="lu-feat-desc-cat">${featInfo.category}</span>` : ''}
                ${featInfo.src ? `<span class="lu-feat-desc-src">${featInfo.src}</span>` : ''}
              </div>
              <div class="lu-feat-desc-body">${featInfo.description}</div>`;
            descEl.style.display = 'block';
          } else {
            descEl.style.display = 'none';
            descEl.innerHTML = '';
          }
        }

        const allowed  = featInfo?.ability?.length ? this._parseFeatAbilities(featInfo.ability) : [];

        if (allowed.length) {
          abilityPanel.style.display = 'block';
          abilityGrid.className = 'lu-feat-ab-cards';
          abilityGrid.innerHTML = allowed.map(ab => {
            const score = this._getPendingScore(ab, level);
            const atCap = score >= 20;
            return `
            <div class="lu-feat-ab-card${atCap ? ' lu-feat-ab-card--capped' : ''}" data-ab="${ab}">
              <div class="lu-feat-ab-card-name">${ab.toUpperCase()}</div>
              ${atCap
                ? `<div class="lu-feat-ab-card-score">${score} <span class="lu-feat-ab-arrow" style="color:var(--ink-faint)">—</span> <span style="color:var(--ink-faint);font-size:0.8rem">at max</span></div>
                   <div class="lu-feat-ab-card-tag" style="background:var(--parchment-dk);color:var(--ink-faint)">cap</div>`
                : `<div class="lu-feat-ab-card-score">${score} <span class="lu-feat-ab-arrow">→</span> <span class="lu-feat-ab-new">${score + 1}</span></div>
                   <div class="lu-feat-ab-card-tag">+1</div>`
              }
            </div>`;
          }).join('');

          // Bind feat ability cards — only one can be selected, capped abilities are inert
          const selectableCards = [...abilityGrid.querySelectorAll('.lu-feat-ab-card:not(.lu-feat-ab-card--capped)')];

          // If only one option, auto-select it with no way to deselect
          if (selectableCards.length === 1) {
            selectableCards[0].classList.add('selected');
            this._pending[level].asi.featAbility = selectableCards[0].dataset.ab;
          }

          selectableCards.forEach(card => {
            card.addEventListener('click', () => {
              // Single option: clicking does nothing (already locked in)
              if (selectableCards.length === 1) return;
              const ab = card.dataset.ab;
              const isSelected = this._pending[level]?.asi?.featAbility === ab;
              abilityGrid.querySelectorAll('.lu-feat-ab-card').forEach(c => c.classList.remove('selected'));
              if (!isSelected) {
                card.classList.add('selected');
                this._pending[level].asi.featAbility = ab;
              } else {
                this._pending[level].asi.featAbility = null;
              }
              this._updateHpSection();
            });
          });
        } else {
          abilityPanel.style.display = 'none';
          if (this._pending[level]?.asi) this._pending[level].asi.featAbility = null;
        }

        // Check if this feat has spell choices
        const spellPanel = sectionEl.querySelector(`#lu-feat-spell-panel-${level}`);
        if (spellPanel) {
          const spellConfig = ClassResources?.FEAT_SPELL_CHOICES?.[name];
          if (spellConfig) {
            spellPanel.style.display = 'block';
            spellPanel.innerHTML = '';
            this._pending[level].asi.featSpells = [];
            this._pending[level].asi.featSpellClass = '';

            // Reuse Sheet's spell picker builder via a simpler inline version
            const chosenSpells = [];
            const buildLuPickers = (selectedClass) => {
              spellPanel.innerHTML = '';

              if (spellConfig.requireClassPick) {
                const classRow = document.createElement('div');
                classRow.className = 'feat-spell-class-row';
                classRow.innerHTML = `<label class="feat-spell-label">Spell Class:</label>`;
                const select = document.createElement('select');
                select.className = 'feat-spell-class-select';
                select.innerHTML = `<option value="">Choose class...</option>` +
                  spellConfig.classOptions.map(c =>
                    `<option value="${c}" ${c === selectedClass ? 'selected' : ''}>${c}</option>`
                  ).join('');
                select.addEventListener('change', () => {
                  chosenSpells.length = 0;
                  this._pending[level].asi.featSpellClass = select.value;
                  this._pending[level].asi.featSpells = [];
                  buildLuPickers(select.value);
                });
                classRow.appendChild(select);
                spellPanel.appendChild(classRow);
              }

              if (spellConfig.autoSpells?.length) {
                const autoDiv = document.createElement('div');
                autoDiv.className = 'feat-spell-auto-row';
                autoDiv.innerHTML = `<span class="feat-spell-label">Always prepared:</span> ${
                  spellConfig.autoSpells.map(s => `<span class="feat-spell-tag feat-spell-auto">${s}</span>`).join('')
                }`;
                spellPanel.appendChild(autoDiv);
              }

              spellConfig.picks.forEach((pickDef, pickIdx) => {
                const pool = ClassResources.getFeatSpellPool(pickDef, selectedClass);
                const section = document.createElement('div');
                section.className = 'feat-spell-pick-section';

                const label = document.createElement('div');
                label.className = 'feat-spell-pick-label';
                label.textContent = pickDef.label || `Choose ${pickDef.count} spell(s)`;
                section.appendChild(label);

                const prevCount = spellConfig.picks.slice(0, pickIdx).reduce((s, p) => s + p.count, 0);
                const mySpells = chosenSpells.slice(prevCount, prevCount + pickDef.count);

                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'feat-spell-selected-tags';
                mySpells.forEach((spellName, i) => {
                  const tag = document.createElement('span');
                  tag.className = 'feat-spell-tag';
                  tag.innerHTML = `${spellName} <button class="feat-spell-tag-remove" title="Remove">&times;</button>`;
                  tag.querySelector('.feat-spell-tag-remove').addEventListener('click', () => {
                    chosenSpells.splice(prevCount + i, 1);
                    this._pending[level].asi.featSpells = [...chosenSpells];
                    buildLuPickers(selectedClass);
                  });
                  tagsDiv.appendChild(tag);
                });
                section.appendChild(tagsDiv);

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
                        chosenSpells.splice(prevCount + mySpells.length, 0, spell.name);
                        this._pending[level].asi.featSpells = [...chosenSpells];
                        buildLuPickers(selectedClass);
                      });
                      dropdown.appendChild(item);
                    });
                  };

                  input.addEventListener('input', () => { dropdown.style.display = 'block'; renderDropdown(input.value); });
                  input.addEventListener('focus', () => { dropdown.style.display = 'block'; renderDropdown(input.value); });
                  document.addEventListener('click', (e) => {
                    if (!searchWrap.contains(e.target)) dropdown.style.display = 'none';
                  });

                  searchWrap.appendChild(input);
                  searchWrap.appendChild(dropdown);
                  section.appendChild(searchWrap);
                }

                spellPanel.appendChild(section);
              });
            };

            buildLuPickers('');
          } else {
            spellPanel.style.display = 'none';
            spellPanel.innerHTML = '';
          }
        }
      });
    }
  },

  // ---- Expertise binding ----
  _bindExpertiseForLevel(sectionEl, level) {
    const checkboxes = sectionEl.querySelectorAll('.lu-expertise-cb');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const chosen = [...sectionEl.querySelectorAll('.lu-expertise-cb:checked')].map(c => c.value);
        if (chosen.length > 2) {
          cb.checked = false;
          return;
        }
        if (!this._pending[level]) this._pending[level] = {};
        this._pending[level].expertise = chosen;
        const leftEl = sectionEl.querySelector(`#lu-expertise-left-${level}`);
        if (leftEl) leftEl.textContent = 2 - chosen.length;
        // Disable unchecked boxes when 2 are selected
        checkboxes.forEach(other => {
          if (!other.checked) other.disabled = chosen.length >= 2;
        });
      });
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
      // Clear subclass if dropping below its unlock level
      const subclassLevel = this.SUBCLASS_LEVELS[className] || 3;
      if (newLevel < subclassLevel) {
        const subInput = document.getElementById('charSubclass');
        if (subInput) subInput.value = '';
        Sheet.sv('charSubclass', '');
        if (typeof Sheet.updateSubclassAccess === 'function') Sheet.updateSubclassAccess();
      }
      // Trim weapon mastery slots to match the new level
      if (typeof ClassResources !== 'undefined') {
        const newSlots = ClassResources.getMasterySlots(className, newLevel);
        const mastery = CharStore.lv('weaponMastery', []) || [];
        if (mastery.length > newSlots) {
          CharStore.sv('weaponMastery', mastery.slice(0, newSlots));
        }
      }
      // Remove expertise gained at removed levels
      for (let lvl = newLevel + 1; lvl <= currentLevel; lvl++) {
        if (this._isExpertiseLevel(lvl, className)) {
          Sheet.SKILLS.forEach(s => {
            if (Sheet.lv(`skillExpert_${s.key}`, false)) {
              Sheet.sv(`skillExpert_${s.key}`, false);
              const el = document.getElementById(`skillExpert_${s.key}`);
              if (el) el.checked = false;
            }
          });
        }
      }
    } else {
      // Validate per-level choices
      for (let lvl = currentLevel + 1; lvl <= newLevel; lvl++) {
        const p = this._pending[lvl] || {};
        const subclassLevel = this.SUBCLASS_LEVELS[className] || 3;
        const showsSubclass = lvl === subclassLevel && classInfo?.subclasses?.length > 0;
        const existingSubclass = (Sheet.lv('charSubclass', '') || '').trim();
        if (showsSubclass && !p.subclass && !existingSubclass) {
          alert(`Please choose a subclass at level ${lvl} before confirming.`); return;
        }
        if (this._isAsiLevel(lvl, className)) {
          if (!p.asi?.type) { alert(`Please make an ASI choice for level ${lvl}.`); return; }
          if (p.asi.type === 'asi') {
            const total = Object.values(p.asi.deltas || {}).reduce((s, v) => s + v, 0);
            if (total < 2) { alert(`Please spend all 2 ASI points at level ${lvl}.`); return; }
          }
          if (p.asi.type === 'feat' && !p.asi.feat) { alert(`Please select a feat for level ${lvl}.`); return; }
          if (p.asi.type === 'feat' && p.asi.feat) {
            const fi = typeof getFeatInfo === 'function' ? getFeatInfo(p.asi.feat) : null;
            const abilOptions = fi?.ability?.length ? this._parseFeatAbilities(fi.ability) : [];
            const nonCapped = abilOptions.filter(ab => Sheet.getAbilityScore(ab) < 20);
            if (nonCapped.length > 1 && !p.asi.featAbility) {
              alert(`Please select an ability score bonus for your feat at level ${lvl}.`); return;
            }
          }
        }
        if (this._isExpertiseLevel(lvl, className)) {
          if (!p.expertise || p.expertise.length < 2) {
            alert(`Please select 2 skills for Expertise at level ${lvl}.`); return;
          }
        }
        // Weapon mastery — all slots must be filled
        if (typeof ClassResources !== 'undefined') {
          const prevSlots = ClassResources.getMasterySlots(className, lvl - 1);
          const newSlots  = ClassResources.getMasterySlots(className, lvl);
          const needed    = newSlots - prevSlots;
          if (needed > 0 && (!p.masteryChoices || p.masteryChoices.length < needed)) {
            alert(`Please choose ${needed} weapon mastery slot${needed > 1 ? 's' : ''} at level ${lvl}.`); return;
          }
        }
        // Spellbook spells — must pick the required number
        const _classInfoLu = classInfo || (className ? getClassInfo(className) : null);
        if (_classInfoLu?.spellbookSpellsPerLevel && lvl > 1) {
          const needed = _classInfoLu.spellbookSpellsPerLevel;
          if (!p.newSpells || p.newSpells.length < needed) {
            alert(`Please choose ${needed} new spellbook spell${needed > 1 ? 's' : ''} at level ${lvl}.`); return;
          }
        }
        // Cantrip gain — must pick the required number
        if (_classInfoLu?.cantripProgression && lvl > 1) {
          const prevC = _classInfoLu.cantripProgression[lvl - 2] ?? 0;
          const newC = _classInfoLu.cantripProgression[lvl - 1] ?? 0;
          const gain = newC - prevC;
          if (gain > 0 && (!p.newCantrips || p.newCantrips.length < gain)) {
            alert(`Please choose ${gain} new cantrip${gain > 1 ? 's' : ''} at level ${lvl}.`); return;
          }
        }
      }

      // Validate HP
      if (this._hp.choice === 'roll' && this._hp.rolls.length < this._numLevels()) {
        alert(`Please roll HP for all ${this._numLevels()} level${this._numLevels() !== 1 ? 's' : ''} before confirming.`); return;
      }

      // Apply per-level choices
      for (let lvl = currentLevel + 1; lvl <= newLevel; lvl++) {
        const p = this._pending[lvl] || {};

        // Apply subclass (update even if same, allows changing mind)
        if (p.subclass) {
          const subInput = document.getElementById('charSubclass');
          if (subInput) subInput.value = p.subclass;
          Sheet.sv('charSubclass', p.subclass);
        }

        if (this._isAsiLevel(lvl, className) && p.asi?.type) {
          if (p.asi.type === 'asi' && p.asi.deltas) {
            Object.entries(p.asi.deltas).forEach(([ab, delta]) => {
              if (delta > 0) {
                const cur = Sheet.getAbilityScore(ab);
                const el = document.getElementById(ab);
                if (el) el.value = Math.min(20, cur + delta);
                Sheet.sv(ab, Math.min(20, cur + delta));
              }
            });
          } else if (p.asi.type === 'feat' && p.asi.feat) {
            // Check if this feat has spell choices
            const spellConfig = ClassResources?.FEAT_SPELL_CHOICES?.[p.asi.feat];
            if (spellConfig && p.asi.featSpells?.length) {
              const featObj = {
                name: p.asi.feat,
                chosenSpells: p.asi.featSpells.flat(),
                ...(p.asi.featSpellClass && { spellClass: p.asi.featSpellClass }),
              };
              if (typeof Sheet.addFeat === 'function') Sheet.addFeat(featObj);
            } else {
              if (typeof Sheet.addFeatByName === 'function') Sheet.addFeatByName(p.asi.feat);
            }
            // Apply feat ability bonus if chosen
            if (p.asi.featAbility) {
              const cur = Sheet.getAbilityScore(p.asi.featAbility);
              const el = document.getElementById(p.asi.featAbility);
              if (el) el.value = Math.min(20, cur + 1);
              Sheet.sv(p.asi.featAbility, Math.min(20, cur + 1));
            }
          }
        }

        // Apply weapon mastery choices
        if (p.masteryChoices?.length) {
          const mastery = CharStore.lv('weaponMastery', []) || [];
          p.masteryChoices.forEach(w => {
            if (w && !mastery.includes(w)) mastery.push(w);
          });
          CharStore.sv('weaponMastery', mastery);
        }

        // Apply expertise choices
        if (p.expertise?.length) {
          p.expertise.forEach(sk => {
            Sheet.sv(`skillExpert_${sk}`, true);
            const el = document.getElementById(`skillExpert_${sk}`);
            if (el) el.checked = true;
          });
        }

        // Apply new spellbook spells
        if (p.newSpells?.length) {
          const spells = Sheet.lv('charSpells', []) || [];
          p.newSpells.forEach(name => {
            const spell = DndData.spells.find(s => s.name === name);
            const spellLevel = spell?.level || 1;
            if (!spells.some(s => s.name === name)) {
              spells.push({ name, level: spellLevel, prepared: false });
            }
          });
          Sheet.sv('charSpells', spells);
        }

        // Apply new cantrips
        if (p.newCantrips?.length) {
          const spells = Sheet.lv('charSpells', []) || [];
          p.newCantrips.forEach(name => {
            if (!spells.some(s => s.name === name && s.level === 0)) {
              spells.push({ name, level: 0, prepared: true });
            }
          });
          Sheet.sv('charSpells', spells);
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
    if (typeof Sheet.updateSubclassAccess === 'function') Sheet.updateSubclassAccess();

    // Update class/species resources for new level
    if (typeof ClassResources !== 'undefined') {
      ClassResources.updateResourcesOnLevelUp(newLevel);
    }

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

    // Auto-set spell slots based on class progression
    if (className && typeof getSpellSlots === 'function') {
      const slots = getSpellSlots(className, newLevel);
      for (let i = 0; i < 9; i++) {
        const slotKey = `slotMax_${i + 1}`;
        Sheet.sv(slotKey, slots[i]);
        // Also update the slot input if visible
        const inp = document.querySelector(`.slot-total-input[data-lvl="${i + 1}"]`);
        if (inp) {
          inp.value = slots[i];
          if (typeof renderSlotCheckboxes === 'function') renderSlotCheckboxes(i + 1, slots[i]);
        }
      }
    }

    Sheet.recalcAll();
    if (className) Sheet.displayClassFeatures(className);
    this._xpBeforeLevelUp = undefined;
    // Apply long rest effects on level up
    if (typeof Combat !== 'undefined') Combat._doLongRest(null);
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
