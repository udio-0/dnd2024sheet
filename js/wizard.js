/* =============================================
   CHARACTER CREATION WIZARD
   ============================================= */
'use strict';

// Canonical skill definitions — used for key normalization throughout the wizard
const _SKILL_DEFS = [
  {key:'acrobatics',    l:'acrobatics'},    {key:'animalHandling', l:'animal handling'},
  {key:'arcana',        l:'arcana'},        {key:'athletics',      l:'athletics'},
  {key:'deception',     l:'deception'},     {key:'history',        l:'history'},
  {key:'insight',       l:'insight'},       {key:'intimidation',   l:'intimidation'},
  {key:'investigation', l:'investigation'}, {key:'medicine',       l:'medicine'},
  {key:'nature',        l:'nature'},        {key:'perception',     l:'perception'},
  {key:'performance',   l:'performance'},   {key:'persuasion',     l:'persuasion'},
  {key:'religion',      l:'religion'},      {key:'sleightOfHand',  l:'sleight of hand'},
  {key:'stealth',       l:'stealth'},       {key:'survival',       l:'survival'},
];
// Convert any skill key format (spaces/camelCase) to the canonical camelCase key the sheet uses
function _normalizeSkillKey(sk) {
  if (!sk) return sk;
  const lower = sk.toLowerCase().replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return _SKILL_DEFS.find(s => s.l === lower || s.key === sk)?.key || sk;
}
// Return a properly capitalised display label for a normalised skill key
function _skillLabel(key) {
  const l = _SKILL_DEFS.find(s => s.key === key)?.l || key;
  return l.replace(/\b\w/g, c => c.toUpperCase());
}

// Parse a background's ability array (from getBackgroundInfo) → unique list of ability keys in the pool
// Handles: { choose: { weighted: { from, weights } } }, { choose: { from, count } }, { str:1, dex:1 }
function _parseBgAbilityPool(abilityArr) {
  const pool = [];
  for (const entry of (abilityArr || [])) {
    if (!entry) continue;
    const w = entry.choose?.weighted;
    const c = entry.choose;
    if (w?.from) {
      w.from.forEach(a => { if (!pool.includes(a)) pool.push(a); });
    } else if (c?.from) {
      c.from.forEach(a => { if (!pool.includes(a)) pool.push(a); });
    } else {
      for (const [k, v] of Object.entries(entry)) {
        if (typeof v === 'number' && !pool.includes(k)) pool.push(k);
      }
    }
  }
  return pool;
}

// Parse background ability array → { pool, modes, fixedBonus, isFixed }
// modes: array of 'two_one' | 'all_three' | 'two_plus_one'
function _parseBgAbility(abilityArr) {
  const pool = [], fixedBonus = {}, modes = [];
  let isFixed = false;
  for (const entry of (abilityArr || [])) {
    if (!entry) continue;
    const w = entry.choose?.weighted;
    const c = entry.choose;
    if (w?.from) {
      w.from.forEach(a => { if (!pool.includes(a)) pool.push(a); });
      const wts = w.weights || [];
      if (wts.length === 2 && wts.includes(2) && wts.includes(1) && !modes.includes('two_one')) modes.push('two_one');
      else if (wts.length === 3 && wts.every(x => x === 1) && !modes.includes('all_three')) modes.push('all_three');
      else if (wts.length === 2 && wts.every(x => x === 1) && !modes.includes('two_plus_one')) modes.push('two_plus_one');
    } else if (c?.from) {
      c.from.forEach(a => { if (!pool.includes(a)) pool.push(a); });
      const n = c.count || 0;
      if (n === 3) { if (!modes.includes('two_one')) modes.push('two_one'); if (!modes.includes('all_three')) modes.push('all_three'); }
      else if (n === 2 && !modes.includes('two_plus_one')) modes.push('two_plus_one');
    } else {
      isFixed = true;
      for (const [k, v] of Object.entries(entry)) {
        if (typeof v === 'number') { fixedBonus[k] = v; if (!pool.includes(k)) pool.push(k); }
      }
    }
  }
  return { pool, modes, fixedBonus, isFixed };
}

window.Wizard = {
  steps: ['species', 'background', 'class', 'abilities', 'equipment', 'spells', 'options', 'review'],
  stepLabels: ['Species', 'Background', 'Class', 'Abilities', 'Equipment', 'Spells', 'Options', 'Review'],
  currentStep: 0,
  draft: {},

  start() {
    this.draft = { charLevel: 1, feats: [], charSpells: [], inventory: [], attacks: [], charOptions: [] };
    this.currentStep = 0;
    this.renderStep();
  },

  renderStep() {
    this._renderProgress();
    this._renderNav();
    const body = document.getElementById('wizard-body');
    if (!body) return;
    body.innerHTML = '';
    const banner = document.getElementById('wiz-validation-banner');
    if (banner) banner.style.display = 'none';
    const stepName = this.steps[this.currentStep];
    const renderer = this['_step_' + stepName];
    if (renderer) renderer.call(this, body);
  },

  next() {
    const err = this._validateStep();
    if (err) {
      this._showValidationError(err);
      return;
    }
    const warn = this._warnStep();
    if (warn && !this._warnBypassed) {
      this._showValidationWarning(warn);
      return;
    }
    this._warnBypassed = false;
    this._doNext();
  },

  _doNext() {
    this._warnBypassed = false;
    if (this.currentStep < this.steps.length - 1) {
      if (this.steps[this.currentStep + 1] === 'spells' && !this._isSpellcaster()) {
        this.currentStep += 2;
      } else {
        this.currentStep++;
      }
      this.renderStep();
      document.getElementById('wizard-body')?.scrollTo(0, 0);
    }
  },

  _validateStep() {
    const d = this.draft;
    const step = this.steps[this.currentStep];
    if (step === 'species' && !d.charSpecies) return 'Please select a species before continuing.';
    if (step === 'species' && d._speciesInfo?.subraces?.length && !d.charSubrace) return 'Please choose a lineage before continuing.';
    if (step === 'species' && d.charSpecies) {
      const subraceObj = d.charSubrace ? d._speciesInfo?.subraces?.find(sr => sr.name === d.charSubrace) : null;
      const addSpells = subraceObj?.additionalSpells?.length
        ? subraceObj.additionalSpells : (d._speciesInfo?.additionalSpells || []);
      const racialSpells = typeof parseRacialSpells === 'function'
        ? parseRacialSpells(addSpells, d.charSubrace || '') : null;
      if (racialSpells?.abilityChoices?.length && !d._racialSpellAbility) return 'Please choose a spellcasting ability for your racial spells.';
    }
    if (step === 'background' && !d.charBackground) return 'Please select a background before continuing.';
    if (step === 'background' && d._bgInfo?.name === 'Custom Background' && !d._customBgEquipSource) return 'Please select a background to use as your equipment source.';
    if (step === 'background' && d._bgInfo?.startingEquipment?.length && !d._bgEquipChoice) return 'Please choose a starting equipment option (A or B) before continuing.';
    if (step === 'background') {
      const chosenLangs = (d._bgLanguages || []).filter(l => l !== 'Common');
      if (chosenLangs.length < 2) return `Please choose 2 languages (${chosenLangs.length}/2 chosen).`;
    }
    if (step === 'class') {
      if (!d.charClass) return 'Please select a class before continuing.';
      const info = d._classInfo;
      if (info?.skillChoices) {
        const needed = info.skillChoices.count || 2;
        const chosen = (d._classSkillChoices || []).length;
        if (chosen < needed) return `Please choose ${needed} skill proficienc${needed === 1 ? 'y' : 'ies'} (${chosen}/${needed} selected).`;
      }
      if (info?.expertiseCount) {
        const chosen = (d._expertiseChoices || []).length;
        if (chosen < info.expertiseCount) return `Please choose ${info.expertiseCount} expertise skills (${chosen}/${info.expertiseCount} selected).`;
      }
      if (info?.fightingStyleLevel && info.fightingStyleLevel <= 1 && !d._fightingStyle) {
        const styles = typeof getFightingStyles === 'function' ? getFightingStyles() : [];
        if (styles.length) return 'Please choose a Fighting Style for your class.';
      }
    }
    if (step === 'equipment') {
      const spent = (d.inventory || []).reduce((sum, it) => sum + (it._valueCp || 0) / 100, 0);
      const available = d.gp || 0;
      if (spent > available) return `Not enough gold — you've spent ${spent.toFixed(2).replace(/\.00$/, '')} gp but only have ${available} gp available.`;
    }
    return null;
  },

  _warnStep() {
    const d = this.draft;
    const step = this.steps[this.currentStep];
    if (step === 'spells' && d.charClass) {
      const _ci = getClassInfo(d.charClass);
      const _nonRacial = (d.charSpells || []).filter(s => !s.racial);
      const _cantripsSel = _nonRacial.filter(s => s.level === 0).length;
      const _prepSel = _nonRacial.filter(s => s.level === 1).length;
      const _maxC = _ci?.cantripCount ?? null;
      let _maxP = _ci?.spellsKnownAtL1 ?? null;
      if (_maxP === null && _ci?.preparedSpellsFormula) _maxP = Math.max(1, 1 + Math.floor(((d.int || 10) - 10) / 2));
      if (_maxC !== null && _cantripsSel < _maxC) return `Choose ${_maxC} cantrip${_maxC !== 1 ? 's' : ''} (${_cantripsSel}/${_maxC} selected).`;
      if (_maxP !== null && _prepSel < _maxP) return `Choose ${_maxP} 1st-level spell${_maxP !== 1 ? 's' : ''} (${_prepSel}/${_maxP} selected).`;
    }
    if (step === 'abilities') {
      const ABS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
      const method = d._abilityMethod || 'standard';
      if (method === 'roll') {
        const assigned = ABS.filter(ab => d._rollAssign?.[ab] != null).length;
        if (assigned < 6) return `You have only assigned ${assigned}/6 rolled stats.`;
      } else if (method === 'standard') {
        const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
        const assigned = ABS.filter(ab => d[ab] && STANDARD_ARRAY.includes(d[ab])).length;
        if (assigned < 6) return `You have only assigned ${assigned}/6 standard array values.`;
      } else if (method === 'pointbuy') {
        const COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
        const spent = ABS.reduce((sum, ab) => sum + (COSTS[d[ab]] || 0), 0);
        const remaining = 27 - spent;
        if (remaining > 0) return `You have ${remaining} unspent point buy point${remaining !== 1 ? 's' : ''}.`;
      }
      // Background ASI allocation
      if (d.charBackground && d._bgAsi) {
        const t = d._bgAsi.type;
        if (t === 'two_one' && (!d._bgAsi.twoAb || !d._bgAsi.oneAb))
          return 'Please assign both your background +2 and +1 ability score bonuses.';
        if (t === 'two_plus_one' && (!d._bgAsi.twoAb || !d._bgAsi.oneAb))
          return 'Please choose two abilities to receive +1 each from your background.';
        if (t === 'all_three' && (d._bgAsi.threeAbs || []).length < 3)
          return 'Please choose three abilities to receive +1 each from your background.';
      }
    }
    return null;
  },

  _showValidationWarning(msg) {
    this._warnBypassed = false;
    let banner = document.getElementById('wiz-validation-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'wiz-validation-banner';
      banner.style.cssText = 'background:var(--danger,#b71c1c);color:#fff;padding:8px 16px;border-radius:6px;margin:8px 0;font-size:0.88rem;font-weight:600;text-align:center;';
      const nav = document.getElementById('wizard-nav');
      if (nav) nav.insertAdjacentElement('beforebegin', banner);
    }
    let countdown = 3;
    banner.style.background = '#c0720a';
    banner.style.display = 'block';
    const nextBtn = document.getElementById('wiz-next');
    if (nextBtn) nextBtn.disabled = true;
    const tick = () => {
      if (countdown > 0) {
        banner.textContent = `⚠ ${msg} Press Next again in ${countdown}s to continue anyway.`;
        countdown--;
        setTimeout(tick, 1000);
      } else {
        banner.textContent = `⚠ ${msg} Press Next to continue anyway.`;
        this._warnBypassed = true;
        if (nextBtn) nextBtn.disabled = false;
      }
    };
    tick();
  },

  _showValidationError(msg) {
    let banner = document.getElementById('wiz-validation-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'wiz-validation-banner';
      banner.style.cssText = 'background:var(--danger,#b71c1c);color:#fff;padding:8px 16px;border-radius:6px;margin:8px 0;font-size:0.88rem;font-weight:600;text-align:center;';
      const nav = document.getElementById('wizard-nav');
      if (nav) nav.insertAdjacentElement('beforebegin', banner);
    }
    banner.textContent = msg;
    banner.style.display = 'block';
    setTimeout(() => { if (banner) banner.style.display = 'none'; }, 4000);
  },

  back() {
    if (this.currentStep > 0) {
      this.currentStep--;
      if (this.steps[this.currentStep] === 'spells' && !this._isSpellcaster()) {
        this.currentStep--;
      }
      this.renderStep();
    }
  },

  finish() {
    const d = this.draft;
    d._meta = { wizardComplete: true };
    d.charName = d.charName || 'New Character';

    // Save languages
    if (d._bgLanguages?.length) d.languages = d._bgLanguages;

    // Populate chronicle fields from selected suggested characteristics
    if (d._bgCharacteristics && d._bgInfo?.suggestedCharacteristics) {
      const sc = d._bgInfo.suggestedCharacteristics;
      const pick = (items, indices) => indices.map(i => items[i]).filter(Boolean).join('\n');
      if (d._bgCharacteristics.traits.length) d.personalityTraits = pick(sc.traits, d._bgCharacteristics.traits);
      if (d._bgCharacteristics.ideals.length)  d.ideals  = pick(sc.ideals,  d._bgCharacteristics.ideals);
      if (d._bgCharacteristics.bonds.length)   d.bonds   = pick(sc.bonds,   d._bgCharacteristics.bonds);
      if (d._bgCharacteristics.flaws.length)   d.flaws   = pick(sc.flaws,   d._bgCharacteristics.flaws);
    }

    // Apply background ability score increases
    if (d._bgAsi) {
      const clamp = (ab, n) => Math.min(20, (d[ab] || 10) + n);
      const t = d._bgAsi.type;
      if (t === 'fixed' && d._bgInfo?.ability) {
        const { fixedBonus: fb } = _parseBgAbility(d._bgInfo.ability);
        for (const [k, v] of Object.entries(fb)) d[k] = clamp(k, v);
      } else if (t === 'two_one') {
        const two = d._bgAsi.twoAb, one = d._bgAsi.oneAb;
        if (two) d[two] = clamp(two, 2);
        if (one && one !== two) d[one] = clamp(one, 1);
      } else if (t === 'two_plus_one') {
        // +1 to two chosen abilities
        const a = d._bgAsi.twoAb, b = d._bgAsi.oneAb;
        if (a) d[a] = clamp(a, 1);
        if (b && b !== a) d[b] = clamp(b, 1);
      } else if (t === 'all_three') {
        // +1 to each of the three chosen abilities
        (d._bgAsi.threeAbs || []).forEach(ab => { d[ab] = clamp(ab, 1); });
      }
    }

    // Set hit dice
    const classInfo = getClassInfo(d.charClass);
    if (classInfo) {
      d.hitDice = JSON.stringify([{ die: classInfo.hitDieFaces, total: 1, used: 0 }]);
      d.hpMax = d.hpMax || (classInfo.hitDieFaces + (Math.floor(((d.con || 10) - 10) / 2)));
      d.hpCurrent = d.hpMax;

      // Set saving throws
      classInfo.savingThrows.forEach(ab => { d['saveProf_' + ab] = true; });
    }

    // Helper: convert a raw equipment item entry to { name, qty }
    const capFirst = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const parseItemName = s => capFirst(stripTags(s.replace(/\|[^,)|]+/g, '').trim()));
    const EQUIP_TYPE_NAMES = { weaponMartial: 'Any martial weapon', weaponSimple: 'Any simple weapon', toolArtisan: 'Any artisan tool', setGaming: 'Any gaming set', instrumentMusical: 'Any musical instrument' };

    // Expand a single raw item entry into one or more { name, qty, category } objects
    // Packs get expanded into their contents
    const expandItem = (it, getPackContents) => {
      if (!it) return [];
      if (it.value != null) return []; // gold only, skip
      let baseName, qty;
      if (typeof it === 'string') {
        baseName = parseItemName(it);
        // Handle items like "Arrows (20)" → name "Arrows", qty 20
        const qtyMatch = baseName.match(/^(.*?)\s*\((\d+)\)\s*$/);
        if (qtyMatch) { baseName = capFirst(qtyMatch[1].trim()); qty = parseInt(qtyMatch[2]); } else qty = 1;
      } else if (it.equipmentType) {
        baseName = EQUIP_TYPE_NAMES[it.equipmentType] || capFirst(it.equipmentType);
        qty = it.quantity || 1;
      } else if (it.special) {
        baseName = capFirst(it.special);
        qty = it.quantity || 1;
      } else if (it.item || it.displayName) {
        // Prefer canonical name from DndData when we have an item reference
        const canonicalParsed = it.item ? parseItemName(it.item) : null;
        const dndMatch = canonicalParsed
          ? (DndData.allItems || []).find(i => i.name.toLowerCase() === canonicalParsed.toLowerCase())
          : null;
        const rawName = dndMatch
          ? dndMatch.name
          : (canonicalParsed || (it.displayName
              ? it.displayName.replace(/\s+\d+(\.\d+)?\s*(cp|sp|ep|gp|pp)$/i, '').trim()
              : ''));
        baseName = capFirst(rawName);
        qty = it.quantity || 1;
        // Handle names like "Arrows (20)" → name "Arrows", qty 20
        const qtyMatch = baseName.match(/^(.*?)\s*\((\d+)\)\s*$/);
        if (qtyMatch) { baseName = capFirst(qtyMatch[1].trim()); qty = parseInt(qtyMatch[2]) * (it.quantity || 1); }
      } else {
        return [];
      }
      // Resolve baseName to canonical DndData name (handles "10 feet of string" → "String (10 feet)", etc.)
      const _allDnd = DndData.allItems || [];
      const _low = baseName.toLowerCase();
      const _resolved = _allDnd.find(i => i.name.toLowerCase() === _low) || (() => {
        const m = _low.match(/^(\d+)\s+feet?\s+of\s+(.+)$/);
        if (m) {
          return _allDnd.find(i => i.name.toLowerCase() === `${m[2]} (${m[1]} feet)`)
              || _allDnd.find(i => i.name.toLowerCase() === `${m[2]} (${m[1]} ft.)`)
              || _allDnd.find(i => i.name.toLowerCase() === m[2]);
        }
        return null;
      })();
      if (_resolved) baseName = _resolved.name;

      // Check if this is a pack — look it up in DndData
      const lowerName = baseName.toLowerCase();
      if (lowerName.includes("pack") && typeof getPackContents === 'function') {
        const contents = getPackContents(lowerName);
        if (contents?.length) return contents;
      }
      return [{ name: baseName, qty, category: 'adventuring gear' }];
    };

    const getPackContents = (packName) => {
      const allItems = DndData.allItems || DndData.items || [];
      const pack = allItems.find(i => i.name.toLowerCase() === packName && i.packContents?.length);
      if (!pack) return null;
      return pack.packContents.flatMap(c => expandItem(c, null));
    };

    const _CONTAINER_NAMES = /^(backpacks?|bags? of holding|chests?|sacks?|haversacks?|portable holes?|heward's handy haversacks?|pouche?s?)$/i;
    const _singularize = n => n
      .replace(/ches$/i, 'ch').replace(/ies$/i, 'y').replace(/([^aeiou])s$/i, '$1')
      .replace(/^./, c => c.toUpperCase());

    const toInvEntry = ({ name, qty }) => {
      const allItems = DndData.allItems || [];
      const found = allItems.find(i => i.name.toLowerCase() === name.toLowerCase())
               || allItems.find(i => i.name.toLowerCase() === _singularize(name).toLowerCase());
      const isContainer = !!(found?.containerCapacity || found?.capacity || _CONTAINER_NAMES.test(name || ''));
      // When splitting plural-named containers into individual entries, use the singular form
      const entryName = (isContainer && (qty || 1) > 1) ? _singularize(name) : name;
      const makeOne = () => ({
        name: entryName,
        qty: isContainer ? 1 : (qty || 1),
        type: found?._type || '',
        damage: found?._dmgStr || '',
        mastery: (found?.mastery || []).join(', '),
        properties: found?._propStr || '',
        weight: found?.weight || 0,
        value: found?._valueStr || '',
        _valueCp: found?.value || 0,
        ac: found?.ac || 0,
        rarity: found?.rarity || 'none',
        category: isContainer ? 'gear' : (found?._category || 'gear'),
        isContainer, containerOpen: true, containerId: null,
        ...(isContainer && {
          containerKey: Date.now().toString(36) + Math.random().toString(36).slice(2),
          containerCapacity: found?.containerCapacity || null,
          capacityStr: found?.capacity || null,
        }),
      });
      // Containers don't stack — expand qty into separate entries
      if (isContainer && (qty || 1) > 1) {
        return Array.from({ length: qty }, () => makeOne());
      }
      return makeOne();
    };

    // Merge background starting equipment into inventory
    if (d._bgInfo?.startingEquipment?.length && d._bgEquipChoice) {
      const bgRow = d._bgInfo.startingEquipment[0];
      const bgItems = bgRow[d._bgEquipChoice] || [];
      const bgInventory = bgItems.flatMap(it => expandItem(it, getPackContents)).flatMap(item => [].concat(toInvEntry(item)));
      d.inventory = [...(d.inventory || []), ...bgInventory];
    }

    // Merge class equipment choices into inventory
    if (d._equipChoices) {
      const classItems = Object.values(d._equipChoices)
        .flatMap(arr => (arr || []).flatMap(it => expandItem(it, getPackContents)))
        .flatMap(item => [].concat(toInvEntry(item)));
      d.inventory = [...(d.inventory || []), ...classItems];
    }

    // Merge mandatory class equipment (always-included items, row._)
    if (d._mandatoryEquip?.length) {
      const mandatoryItems = d._mandatoryEquip.flatMap(it => expandItem(it, getPackContents)).flatMap(item => [].concat(toInvEntry(item)));
      d.inventory = [...(d.inventory || []), ...mandatoryItems];
    }

    // Deduplicate inventory: merge non-container entries with the same name; containers are always kept separate
    if (d.inventory?.length) {
      const merged = [];
      for (const item of d.inventory) {
        if (item.isContainer) {
          merged.push({ ...item });
        } else {
          const existing = merged.find(i => i.name.toLowerCase() === item.name.toLowerCase() && !i.isContainer);
          if (existing) existing.qty += item.qty || 1;
          else merged.push({ ...item });
        }
      }
      d.inventory = merged;
    }

    // Apply racial spells from species
    const _subraceObj = d.charSubrace ? d._speciesInfo?.subraces?.find(sr => sr.name === d.charSubrace) : null;
    const _addSpells = _subraceObj?.additionalSpells?.length
      ? _subraceObj.additionalSpells : (d._speciesInfo?.additionalSpells || []);
    if (_addSpells.length) {
      const racialSpells = parseRacialSpells(_addSpells, d.charSubrace || '');
      const racialEntries = [];
      const capName = n => n ? n.replace(/\b\w/g, c => c.toUpperCase()) : n;
      racialSpells.cantrips.forEach(name => { if (name) racialEntries.push({ name: capName(name), level: 0, prepared: true, racial: true }); });
      // At level 1 only cantrips; level 3+ spells are gained later via level-up
      d.charSpells = [...(d.charSpells || []), ...racialEntries];
      if (d._speciesInfo.flySpeed) d.flySpeed = d._speciesInfo.flySpeed;
      // Store chosen spellcasting ability for racial spells
      if (d._racialSpellAbility) d.racialSpellAbility = d._racialSpellAbility;
      else if (racialSpells.ability) d.racialSpellAbility = racialSpells.ability;
    }

    // Add attacks granted by selected character options (e.g. Gift of the Aetherborn → Drain Life)
    (d.charOptions || []).forEach(optName => {
      const optInfo = DndData.charOptions.find(o => o.name === optName);
      if (optInfo?._grantsAttack) {
        const atk = optInfo._grantsAttack;
        if (!d.attacks) d.attacks = [];
        if (!d.attacks.some(a => a.name === atk.name)) d.attacks.push({ ...atk });
      }
    });

    // Apply expertise choices from class step
    (d._expertiseChoices || []).forEach(sk => { d['skillExpert_' + sk] = true; });

    // Apply fighting style as a feat
    if (d._fightingStyle) {
      if (!d.feats) d.feats = [];
      if (!d.feats.some(f => f.toLowerCase() === d._fightingStyle.toLowerCase())) {
        d.feats.push(d._fightingStyle);
      }
    }

    // Init combat state
    d.combat = { actionUsed: false, bonusActionUsed: false, reactionUsed: false, movementUsed: 0, freeInteractionUsed: false, concentratingOn: null, conditions: [], exhaustionLevel: 0, equippedMainHand: null, equippedOffHand: null };

    const id = CharStore.createCharacter(d);
    Router.navigate('#sheet/' + id);
  },

  _isSpellcaster() {
    if (!this.draft.charClass) return false;
    const info = getClassInfo(this.draft.charClass);
    if (!info) return false;
    const cls = DndData.classDetails[this.draft.charClass]?.class;
    return cls?.casterProgression || cls?.spellcastingAbility || false;
  },

  _renderProgress() {
    const bar = document.getElementById('wizard-progress');
    if (!bar) return;
    bar.innerHTML = '';
    this.steps.forEach((s, i) => {
      const step = document.createElement('div');
      const isOptionsLocked = this.steps[i] === 'options' && !(typeof is2014Enabled === 'function' && is2014Enabled());
      step.className = 'wiz-step' + (i === this.currentStep ? ' active' : '') + (i < this.currentStep ? ' done' : '') + (isOptionsLocked ? ' locked' : '');
      if (isOptionsLocked) {
        step.title = 'Enable 2014 content to unlock this step';
      }
      step.innerHTML = `<div class="wiz-step-dot">${i < this.currentStep ? '✓' : i + 1}</div><div class="wiz-step-label">${this.stepLabels[i]}</div>`;
      if (i < this.currentStep && !isOptionsLocked) step.addEventListener('click', () => { this.currentStep = i; this.renderStep(); });
      bar.appendChild(step);
      if (i < this.steps.length - 1) {
        const line = document.createElement('div');
        line.className = 'wiz-step-line' + (i < this.currentStep ? ' done' : '');
        bar.appendChild(line);
      }
    });
  },

  _renderNav() {
    const nav = document.getElementById('wizard-nav');
    if (!nav) return;
    const isFirst = this.currentStep === 0;
    const isLast = this.currentStep === this.steps.length - 1;
    nav.innerHTML = `
      <button class="btn btn-lg ${isFirst ? 'btn-disabled' : ''}" id="wiz-back" ${isFirst ? 'disabled' : ''}>← Back</button>
      <button class="btn btn-primary btn-lg" id="wiz-next">${isLast ? 'Create Character ✓' : 'Next →'}</button>
    `;
    nav.querySelector('#wiz-back')?.addEventListener('click', () => this.back());
    nav.querySelector('#wiz-next')?.addEventListener('click', () => isLast ? this.finish() : this.next());
  },

  // ========== STEP: SPECIES ==========
  _step_species(container) {
    const d = this.draft;
    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Choose Your Species</h2>
        <p class="wiz-desc">Your species determines your physical traits, innate abilities, and how you interact with the world.</p>
        <input type="text" id="wiz-species-search" list="species-list" class="wiz-search" placeholder="Search species..." value="${d.charSpecies || ''}" autocomplete="off">
        <div id="wiz-species-preview" class="wiz-preview"></div>
      </div>
      <div id="wiz-optional-tooltip" style="display:none;position:fixed;z-index:9999;max-width:380px;background:var(--parchment,#FDF1DC);border:1px solid var(--border,#C4A87A);border-radius:8px;padding:12px 16px;font-size:0.78rem;color:var(--ink-light,#3D2B18);line-height:1.6;box-shadow:0 6px 20px rgba(0,0,0,0.4);pointer-events:none"></div>`;
    const input = document.getElementById('wiz-species-search');
    const preview = document.getElementById('wiz-species-preview');
    const renderPreview = (info, subraceInfo) => {
      const subraceName = subraceInfo?.name || d.charSubrace || '';
      // Merge subrace physical stats — subrace values take priority
      const sr = subraceInfo;
      const darkvision = sr?.darkvision || info.darkvision;
      const flySpeed = (typeof sr?.speed === 'object' && sr.speed?.fly) ? sr.speed.fly : info.flySpeed;
      const swimSpeed = (typeof sr?.speed === 'object' && sr.speed?.swim) ? sr.speed.swim : info.swimSpeed;
      const resist = (sr?.resist?.length ? sr.resist : info.resist) || [];
      // Prefer subrace's own additionalSpells, fall back to parent race's
      const additionalSpells = subraceInfo?.additionalSpells?.length
        ? subraceInfo.additionalSpells
        : (info.additionalSpells || []);
      const racialSpells = typeof parseRacialSpells === 'function'
        ? parseRacialSpells(additionalSpells, subraceName, subraceInfo?.entries) : { cantrips: [], level3: [], level5: [], ability: null, abilityChoices: null };
      const hasSpells = racialSpells.cantrips.length || racialSpells.level3.length || racialSpells.level5.length;
      const abilityNames = { int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma', str: 'Strength', dex: 'Dexterity', con: 'Constitution' };
      const abilityPickerHtml = racialSpells.abilityChoices ? `
        <div class="wiz-stat-row" style="margin-top:8px">
          <strong>Spellcasting Ability for Racial Spells:</strong>
          <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
            ${racialSpells.abilityChoices.map(ab => `
              <label class="lu-asi-choice${d._racialSpellAbility === ab ? ' selected' : ''}" style="flex:none;padding:4px 12px;font-size:0.82rem">
                <input type="radio" name="wiz-racial-ab" value="${ab}" ${d._racialSpellAbility === ab ? 'checked' : ''}>
                ${abilityNames[ab] || ab.toUpperCase()}
              </label>`).join('')}
          </div>
        </div>` : (racialSpells.ability ? `<div class="wiz-stat-row" style="margin-top:4px;font-size:0.82rem"><strong>Spellcasting Ability:</strong> ${abilityNames[racialSpells.ability] || racialSpells.ability.toUpperCase()}</div>` : '');
      const capSpell = n => n ? n.replace(/\b\w/g, c => c.toUpperCase()) : n;
      // Hide racial spells until the player has picked a lineage
      const lineageChosen = !info.subraces.length || !!subraceInfo;
      const spellHtml = (hasSpells && lineageChosen) ? `
        <div class="wiz-stat-row" style="margin-top:6px"><strong>Racial Spells:</strong>
          ${racialSpells.cantrips.length ? `<div style="font-size:0.82rem">Cantrip: ${racialSpells.cantrips.map(capSpell).join(', ')}</div>` : ''}
          ${racialSpells.level3.length ? `<div style="font-size:0.82rem">Level 3: ${racialSpells.level3.map(capSpell).join(', ')}</div>` : ''}
          ${racialSpells.level5.length ? `<div style="font-size:0.82rem">Level 5: ${racialSpells.level5.map(capSpell).join(', ')}</div>` : ''}
        </div>
        ${abilityPickerHtml}` : '';
      preview.innerHTML = `
        <div class="wiz-preview-card">
          <h3>${info.name} <span class="wiz-source">${info.src}</span></h3>
          <div class="wiz-stat-row"><strong>Size:</strong> ${info.size}</div>
          <div class="wiz-stat-row"><strong>Speed:</strong> ${info.speed} ft.${flySpeed ? ` | <strong>Fly:</strong> ${flySpeed} ft.` : ''}${swimSpeed ? ` | <strong>Swim:</strong> ${swimSpeed} ft.` : ''}</div>
          ${darkvision ? `<div class="wiz-stat-row"><strong>Darkvision:</strong> ${darkvision} ft.</div>` : ''}
          ${resist.length ? `<div class="wiz-stat-row"><strong>Resistances:</strong> ${resist.map(r => typeof r === 'string' ? r.charAt(0).toUpperCase() + r.slice(1) : (r?.choose?.from ? r.choose.from.map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(', ') + ' (choose one)' : '')).filter(Boolean).join(', ')}</div>` : ''}
          ${spellHtml}
          <div class="wiz-traits">${info.traitsHtml || ''}</div>
        </div>`;
      // Bind racial spellcasting ability picker
      preview.querySelectorAll('input[name="wiz-racial-ab"]').forEach(radio => {
        radio.addEventListener('change', () => {
          d._racialSpellAbility = radio.value;
          preview.querySelectorAll('label.lu-asi-choice').forEach(lbl => lbl.classList.remove('selected'));
          radio.closest('label.lu-asi-choice').classList.add('selected');
        });
      });
    };

    const showPreview = (name, subraceOverride) => {
      const info = getSpeciesInfo(name);
      if (!info) {
        preview.innerHTML = '<div class="wiz-hint">Select a species to see details</div>';
        d.charSpecies = null; d._speciesInfo = null; d.charSubrace = null;
        return;
      }
      d.charSpecies = name;
      d._speciesInfo = info;

      // Resolve subrace from override or saved draft
      const subraceInfo = subraceOverride
        ? info.subraces.find(sr => sr.name === subraceOverride)
        : (d.charSubrace ? info.subraces.find(sr => sr.name === d.charSubrace) : null);

      renderPreview(info, subraceInfo);

      // If this species has lineage choices, append a persistent picker below the preview.
      // Cards show only the name; clicking one updates the stats above in place.
      if (info.subraces.length > 0) {
        const pickerEl = document.createElement('div');
        pickerEl.className = 'wiz-lineage-picker';
        pickerEl.innerHTML = `<div class="wiz-lineage-title">Choose a Lineage</div>` +
          info.subraces.map(sr => {
            // Only show a subtitle for resist-only subraces (e.g. Dragonborn ancestries)
            // where there is no description text above to reference.
            // Elf lineages etc. show only the name — the full text is already in the traits above.
            const resistStr = (sr.resist || [])
              .filter(r => typeof r === 'string')
              .map(r => r.charAt(0).toUpperCase() + r.slice(1))
              .join(', ');
            const subtitle = resistStr && !sr.entries?.length
              ? `<div class="wiz-lineage-subtitle">Resistance: ${resistStr}</div>` : '';
            return `
            <div class="wiz-lineage-card${d.charSubrace === sr.name ? ' selected' : ''}" data-lineage="${sr.name.replace(/"/g,'&quot;')}">
              <div class="wiz-lineage-name">${sr.name}</div>
              ${subtitle}
            </div>`;
          }).join('');
        preview.appendChild(pickerEl);
        pickerEl.querySelectorAll('.wiz-lineage-card').forEach(card => {
          card.addEventListener('click', () => {
            d.charSubrace = card.dataset.lineage;
            showPreview(d.charSpecies);
          });
        });
      }
    };

    // Wire optional-feature badge tooltips (delegated so it works after every renderPreview)
    const _tooltip = document.getElementById('wiz-optional-tooltip');
    if (_tooltip) {
      preview.addEventListener('mouseenter', e => {
        const badge = e.target.closest('[data-wiz-tooltip]');
        if (!badge) return;
        const parts = badge.dataset.wizTooltip.split('||').filter(Boolean);
        const badgeLabel = badge.textContent.replace(/^Optional:\s*/,'').trim();
        _tooltip.innerHTML = `<div style="font-weight:700;font-size:0.85rem;margin-bottom:6px;color:var(--ink,#1A1208);border-bottom:1px solid var(--border,#C4A87A);padding-bottom:4px">${badgeLabel}</div>`
          + parts.map(p => `<p style="margin:0 0 6px">${p}</p>`).join('');
        _tooltip.style.display = 'block';
      }, true);
      preview.addEventListener('mousemove', e => {
        const badge = e.target.closest('[data-wiz-tooltip]');
        if (!badge) { _tooltip.style.display = 'none'; return; }
        const x = e.clientX + 14, y = e.clientY + 14;
        const tw = _tooltip.offsetWidth, th = _tooltip.offsetHeight;
        _tooltip.style.left = (x + tw > window.innerWidth ? e.clientX - tw - 8 : x) + 'px';
        _tooltip.style.top  = (y + th > window.innerHeight ? e.clientY - th - 8 : y) + 'px';
      }, true);
      preview.addEventListener('mouseleave', () => { _tooltip.style.display = 'none'; }, true);
    }

    input.addEventListener('change', () => { d.charSubrace = null; showPreview(input.value); });
    if (d.charSpecies) showPreview(d.charSpecies, d.charSubrace);
    else showPreview('');
  },

  // ========== STEP: BACKGROUND ==========
  _step_background(container) {
    const d = this.draft;
    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Choose Your Background</h2>
        <p class="wiz-desc">Your background defines where you came from and what skills you've picked up along the way. In 2024 rules, backgrounds also grant your ability score increases and an origin feat.</p>
        <input type="text" id="wiz-bg-search" list="bg-list" class="wiz-search" placeholder="Search background..." value="${d.charBackground || ''}" autocomplete="off">
        <div id="wiz-bg-preview" class="wiz-preview"></div>
        <div id="wiz-bg-equip" class="wiz-bg-equip"></div>
        <div id="wiz-bg-lang" class="wiz-bg-equip"></div>
        <div id="wiz-bg-characteristics"></div>
      </div>`;
    const input = document.getElementById('wiz-bg-search');
    const preview = document.getElementById('wiz-bg-preview');
    const equipDiv = document.getElementById('wiz-bg-equip');
    const langDiv = document.getElementById('wiz-bg-lang');
    const charDiv = document.getElementById('wiz-bg-characteristics');

    const stripPrice = s => s.replace(/\s+\d+(\.\d+)?\s*(cp|sp|ep|gp|pp)$/i, '').trim();
    const priceToGp = s => { const m = s?.match(/(\d+(?:\.\d+)?)\s*(cp|sp|ep|gp|pp)$/i); if (!m) return 0; const n = parseFloat(m[1]); return ({cp:0.01,sp:0.1,ep:0.5,gp:1,pp:10}[m[2].toLowerCase()] || 1) * n; };
    const cleanItem = it => {
      if (!it) return '';
      if (typeof it === 'string') return stripTags(it.replace(/\|[^,)|]+/g, '').trim());
      if (it.value != null) return (it.value / 100) + ' GP';
      if (it.displayName) return (it.quantity ? `${it.quantity}× ` : '') + stripPrice(it.displayName);
      if (it.equipmentType) {
        const typeNames = { weaponMartial: 'any martial weapon', weaponSimple: 'any simple weapon', toolArtisan: 'any artisan tool' };
        return (it.quantity ? `${it.quantity}× ` : '') + (typeNames[it.equipmentType] || it.equipmentType);
      }
      if (it.item) return (it.quantity ? `${it.quantity}× ` : '') + stripTags(it.item.replace(/\|[^,)|]+/g, '').trim());
      if (it.special) return it.special;
      return '';
    };
    const formatItemList = arr => {
      const parts = [];
      arr.forEach(it => {
        const name = cleanItem(it);
        if (name) parts.push(name);
        // If a displayName had an embedded price, emit it as a separate gold entry
        if (it?.displayName) {
          const gp = priceToGp(it.displayName);
          if (gp > 0) parts.push(gp + ' GP');
        }
      });
      const result = parts.filter(Boolean).join(', ');
      return result.charAt(0).toUpperCase() + result.slice(1);
    };
    const choiceGold = arr => arr.reduce((sum, it) => {
      if (!it) return sum;
      if (it.value != null) return sum + it.value / 100;
      if (it.displayName) return sum + priceToGp(it.displayName);
      return sum;
    }, 0);

    const renderEquipPicker = (info) => {
      const equip = info.startingEquipment;
      if (!equip?.length) { equipDiv.innerHTML = ''; return; }
      const row = equip[0];
      const keys = Object.keys(row);
      if (!keys.length) { equipDiv.innerHTML = ''; return; }

      // Single option — auto-select silently, show as plain text
      if (keys.length === 1) {
        const onlyKey = keys[0];
        if (d._bgEquipChoice !== onlyKey) {
          const prevGold = choiceGold(row[d._bgEquipChoice] || []);
          d.gp = Math.max(0, (d.gp || 0) - prevGold + choiceGold(row[onlyKey]));
          d._bgEquipChoice = onlyKey;
          d._bgEquipGoldApplied = true;
        }
        const items = formatItemList(row[onlyKey]);
        equipDiv.innerHTML = `<div class="lu-section" style="margin-top:12px">
          <div class="lu-section-title">${info.name} Starting Equipment</div>
          <div class="lu-asi-options" style="flex-direction:column;gap:6px">
            <label class="lu-asi-choice selected" style="font-size:0.82rem;padding:6px 12px;pointer-events:none">
              <input type="radio" checked style="pointer-events:none">
              <span>${items}</span>
            </label>
          </div>
        </div>`;
        return;
      }

      const saved = d._bgEquipChoice || '';
      let html = `<div class="lu-section" style="margin-top:12px">`;
      html += `<div class="lu-section-title">${info.name} Starting Equipment</div>`;
      html += `<div class="lu-asi-options" style="flex-direction:column;gap:6px" id="bg-equip-choices">`;
      keys.forEach(k => {
        const items = formatItemList(row[k]);
        html += `<label class="lu-asi-choice${saved === k ? ' selected' : ''}" style="font-size:0.82rem;padding:6px 12px">
          <input type="radio" name="bg-equip" value="${k}" ${saved === k ? 'checked' : ''}>
          <span>${items}</span>
        </label>`;
      });
      html += `</div></div>`;
      equipDiv.innerHTML = html;

      // Apply gold for the already-selected choice on initial render
      if (saved && !d._bgEquipGoldApplied) {
        d.gp = (d.gp || 0) + choiceGold(row[saved] || []);
        d._bgEquipGoldApplied = true;
      }

      equipDiv.querySelectorAll('input[name="bg-equip"]').forEach(radio => {
        radio.addEventListener('change', () => {
          equipDiv.querySelectorAll('.lu-asi-choice').forEach(el => el.classList.remove('selected'));
          radio.closest('.lu-asi-choice').classList.add('selected');
          const prevGold = choiceGold(row[d._bgEquipChoice] || []);
          d._bgEquipChoice = radio.value;
          const newGold = choiceGold(row[radio.value] || []);
          d.gp = Math.max(0, (d.gp || 0) - prevGold + newGold);
          d._bgEquipGoldApplied = true;
        });
      });
    };

    const renderLangPicker = () => {
      // All characters know Common + 2 languages of choice
      const fixed = ['Common'];
      const chooseCount = 2;
      if (!d._bgLanguages) d._bgLanguages = [...fixed];
      if (!d._bgLanguages.includes('Common')) d._bgLanguages.unshift('Common');

      const chosen = d._bgLanguages.filter(l => !fixed.includes(l));
      let html = `<div class="lu-section" style="margin-top:12px"><div class="lu-section-title">Languages</div>`;
      html += `<div style="font-size:0.85rem;margin-bottom:6px">All characters know <strong>Common</strong>. Choose 2 additional languages (${chosen.length}/${chooseCount} chosen):</div>`;
      html += `<div style="display:flex;flex-wrap:wrap;gap:6px">`;
      STANDARD_LANGUAGES.filter(l => l !== 'Common').forEach(lang => {
        const isChosen = chosen.includes(lang);
        const disabled = !isChosen && chosen.length >= chooseCount;
        html += `<label class="lu-asi-choice${isChosen ? ' selected' : ''}${disabled ? ' disabled' : ''}" style="flex:none;padding:4px 10px;font-size:0.82rem;${disabled ? 'opacity:0.4;cursor:not-allowed' : ''}">
          <input type="checkbox" name="bg-lang" value="${lang}" ${isChosen ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
          ${lang}
        </label>`;
      });
      html += `</div></div>`;
      langDiv.innerHTML = html;

      langDiv.querySelectorAll('input[name="bg-lang"]').forEach(cb => {
        cb.addEventListener('change', () => {
          if (cb.checked) {
            const currentChosen = d._bgLanguages.filter(l => !fixed.includes(l));
            if (currentChosen.length < chooseCount) d._bgLanguages.push(cb.value);
            else cb.checked = false;
          } else {
            d._bgLanguages = d._bgLanguages.filter(l => l !== cb.value);
          }
          renderLangPicker();
        });
      });
    };

    const renderCustomBgEquipPicker = () => {
      const allow2024 = !!d._customBgAllow2024;
      const allBgs = (DndData.backgrounds || [])
        .filter(b => b.name !== 'Custom Background' && b.startingEquipment?.length);
      const sourceBgs = allBgs
        .filter(b => allow2024 ? true : b.source !== 'XPHB')
        .sort((a, b) => a.name.localeCompare(b.name));

      // If current source is a 2024 bg but toggle is now off, clear it
      if (!allow2024 && d._customBgEquipSource) {
        const srcBg = allBgs.find(b => b.name === d._customBgEquipSource);
        if (srcBg?.source === 'XPHB') {
          if (d._bgEquipChoice && d._bgInfo?.startingEquipment?.length) {
            const prevGold = choiceGold(d._bgInfo.startingEquipment[0][d._bgEquipChoice] || []);
            d.gp = Math.max(0, (d.gp || 0) - prevGold);
          }
          d._customBgEquipSource = '';
          d._bgEquipChoice = null;
          d._bgEquipGoldApplied = false;
        }
      }

      const current = d._customBgEquipSource || '';
      equipDiv.innerHTML = `<div class="lu-section" style="margin-top:12px">
        <div class="lu-section-title">Equipment Package Source</div>
        <div class="custom-bg-equip-row">
          <select id="custom-bg-equip-source" class="wiz-search" style="margin-bottom:0;flex:1">
            <option value="">— Select a background —</option>
            ${sourceBgs.map(b => { const src = b.source || b._src || '?'; const ed = src === 'XPHB' ? '2024' : '2014'; return `<option value="${b.name}"${b.name === current ? ' selected' : ''}>${b.name} [${src} · ${ed}]</option>`; }).join('')}
          </select>
          <button type="button" id="custom-bg-2024-toggle" class="custom-bg-toggle${allow2024 ? ' active' : ''}" title="Allow 2024 backgrounds">
            2024
          </button>
        </div>
        <div class="custom-bg-warning">
          Custom Background is a 2014 rules option. 2024 backgrounds have different equipment packages.
          ${allow2024 ? '<strong>Confirm with your DM before using 2024 equipment packages with a Custom Background.</strong>' : 'Enable the 2024 toggle to unlock 2024 background equipment options.'}
        </div>
        <div id="custom-bg-equip-options"></div>
      </div>`;

      const optionsDiv = equipDiv.querySelector('#custom-bg-equip-options');
      if (current) {
        const srcInfo = getBackgroundInfo(current);
        if (srcInfo?.startingEquipment?.length) {
          const row = srcInfo.startingEquipment[0];
          const keys = Object.keys(row);
          const saved = d._bgEquipChoice || '';
          let html = `<div style="margin-top:8px"><div class="lu-asi-options" style="flex-direction:column;gap:6px">`;
          keys.forEach(k => {
            const items = formatItemList(row[k]);
            html += `<label class="lu-asi-choice${saved === k ? ' selected' : ''}" style="font-size:0.82rem;padding:6px 12px">
              <input type="radio" name="bg-equip" value="${k}" ${saved === k ? 'checked' : ''}>
              <span><strong>(${k.toUpperCase()})</strong> ${items}</span>
            </label>`;
          });
          html += `</div></div>`;
          optionsDiv.innerHTML = html;
          if (saved && !d._bgEquipGoldApplied) {
            d.gp = (d.gp || 0) + choiceGold(row[saved] || []);
            d._bgEquipGoldApplied = true;
          }
          optionsDiv.querySelectorAll('input[name="bg-equip"]').forEach(radio => {
            radio.addEventListener('change', () => {
              optionsDiv.querySelectorAll('.lu-asi-choice').forEach(el => el.classList.remove('selected'));
              radio.closest('.lu-asi-choice').classList.add('selected');
              const prevGold = choiceGold(row[d._bgEquipChoice] || []);
              d._bgEquipChoice = radio.value;
              const newGold = choiceGold(row[radio.value] || []);
              d.gp = Math.max(0, (d.gp || 0) - prevGold + newGold);
              d._bgEquipGoldApplied = true;
              d._bgInfo = Object.assign({}, d._bgInfo, { startingEquipment: srcInfo.startingEquipment });
            });
          });
          d._bgInfo = Object.assign({}, d._bgInfo, { startingEquipment: srcInfo.startingEquipment });
        }
      }

      equipDiv.querySelector('#custom-bg-equip-source').addEventListener('change', e => {
        const srcName = e.target.value;
        if (d._bgEquipChoice && d._bgInfo?.startingEquipment?.length) {
          const prevGold = choiceGold(d._bgInfo.startingEquipment[0][d._bgEquipChoice] || []);
          d.gp = Math.max(0, (d.gp || 0) - prevGold);
        }
        d._bgEquipChoice = null;
        d._bgEquipGoldApplied = false;
        d._customBgEquipSource = srcName;
        renderCustomBgEquipPicker();
      });

      equipDiv.querySelector('#custom-bg-2024-toggle').addEventListener('click', () => {
        d._customBgAllow2024 = !d._customBgAllow2024;
        renderCustomBgEquipPicker();
      });
    };

    const showPreview = (name) => {
      const info = getBackgroundInfo(name);
      if (!info) {
        preview.innerHTML = '<div class="wiz-hint">Select a background to see details</div>';
        equipDiv.innerHTML = '';
        return;
      }
      // Reset background equipment gold if background changed
      if (d.charBackground !== name) {
        const prevInfo = d._bgInfo;
        if (prevInfo?.startingEquipment?.length && d._bgEquipChoice) {
          const prevRow = prevInfo.startingEquipment[0];
          const prevGold = choiceGold(prevRow[d._bgEquipChoice] || []);
          d.gp = Math.max(0, (d.gp || 0) - prevGold);
        }
        d._bgEquipChoice = null;
        d._bgEquipGoldApplied = false;
      }
      d.charBackground = name;
      d._bgInfo = info;
      const skills = Object.keys(info.skillProf).join(', ') || 'None';
      const tools = Object.keys(info.toolProf).join(', ') || 'None';
      const feat = info.feat ? Object.keys(info.feat)[0]?.split('|')[0] || '' : 'None';
      Object.keys(info.skillProf).forEach(sk => {
        const key = _normalizeSkillKey(sk);
        if (key) d['skillProf_' + key] = true;
      });
      // Collect the 3 ability names for the info note
      const AB_MAP_BG = { str:'Strength', dex:'Dexterity', con:'Constitution', int:'Intelligence', wis:'Wisdom', cha:'Charisma' };
      const abList = [];
      const _bgAbPool = _parseBgAbilityPool(info.ability);
      _bgAbPool.forEach(a => { if (AB_MAP_BG[a] && !abList.includes(AB_MAP_BG[a])) abList.push(AB_MAP_BG[a]); });
      const abNote = abList.length
        ? `Ability score increases: <strong>${abList.join(', ')}</strong> — allocate in Step 4.`
        : `Grants ability score increases — allocate in Step 4.`;

      const isCustomBg = info.name === 'Custom Background';
      const traitsHtml = isCustomBg
        ? `<p>Choose any two skill proficiencies, any two tool proficiencies or languages, and any origin feat. Your ability scores are set by your background choices (allocate in Step 4).</p>
           <p>For equipment, select any standard background below to use its starting equipment package.</p>`
        : (info.descriptionHtml || (info.description || '').replace(/\n/g, '<br>'));

      preview.innerHTML = `
        <div class="wiz-preview-card">
          <h3>${info.name} <span class="wiz-source">${info.src}</span></h3>
          <div class="wiz-stat-row"><strong>Skill Proficiencies:</strong> ${skills}</div>
          <div class="wiz-stat-row"><strong>Tool Proficiencies:</strong> ${tools}</div>
          <div class="wiz-stat-row"><strong>Origin Feat:</strong> ${feat}</div>
          <div class="wiz-stat-row"><strong>Languages:</strong> Common + 2 of your choice</div>
          <div class="wiz-stat-row" style="color:var(--ink-faint);font-size:0.8rem">${abNote}</div>
          <div class="wiz-traits">${traitsHtml}</div>
        </div>`;

      if (isCustomBg) {
        renderCustomBgEquipPicker();
      } else {
        renderEquipPicker(info);
      }
      renderLangPicker();
      renderCharacteristicsPicker(info);
    };

    const renderCharacteristicsPicker = (info) => {
      const sc = info?.suggestedCharacteristics;
      const hasAny = sc && (sc.traits.length || sc.ideals.length || sc.bonds.length || sc.flaws.length);
      if (!hasAny) { charDiv.innerHTML = ''; return; }

      if (!d._bgCharacteristics || d._bgCharacteristics._bg !== info.name) {
        d._bgCharacteristics = { _bg: info.name, traits: [], ideals: [], bonds: [], flaws: [] };
      }

      const sections = [
        { key: 'traits', label: 'Personality Traits', items: sc.traits },
        { key: 'ideals', label: 'Ideals',             items: sc.ideals },
        { key: 'bonds',  label: 'Bonds',              items: sc.bonds  },
        { key: 'flaws',  label: 'Flaws',              items: sc.flaws  },
      ].filter(s => s.items.length);

      charDiv.innerHTML = `<div class="lu-section" style="margin-top:16px">
        <div class="lu-section-title">Suggested Characteristics <span style="font-size:0.75rem;font-weight:400;color:var(--ink-faint)">(optional — populates the Chronicle page)</span></div>
        ${sections.map(sec => `
          <div style="margin-top:10px">
            <div style="font-size:0.82rem;font-weight:600;margin-bottom:4px;color:var(--ink-light)">${sec.label}</div>
            <div class="wiz-char-list" data-key="${sec.key}">
              ${sec.items.map((text, i) => {
                const sel = d._bgCharacteristics[sec.key].includes(i);
                return `<label class="lu-asi-choice${sel ? ' selected' : ''}" style="font-size:0.8rem;padding:5px 10px;align-items:flex-start">
                  <input type="checkbox" data-key="${sec.key}" data-idx="${i}" ${sel ? 'checked' : ''} style="margin-top:2px;flex-shrink:0">
                  <span>${text}</span>
                </label>`;
              }).join('')}
            </div>
          </div>`).join('')}
      </div>`;

      charDiv.querySelectorAll('input[type="checkbox"][data-key]').forEach(cb => {
        cb.addEventListener('change', () => {
          const key = cb.dataset.key, idx = parseInt(cb.dataset.idx);
          const arr = d._bgCharacteristics[key];
          if (cb.checked) { if (!arr.includes(idx)) arr.push(idx); }
          else { const i = arr.indexOf(idx); if (i >= 0) arr.splice(i, 1); }
          cb.closest('label').classList.toggle('selected', cb.checked);
        });
      });
    };

    renderLangPicker();
    input.addEventListener('change', () => showPreview(input.value));
    if (d.charBackground) showPreview(d.charBackground);
    else showPreview('');
  },

  // ========== STEP: CLASS ==========
  _step_class(container) {
    const d = this.draft;
    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Choose Your Class</h2>
        <p class="wiz-desc">Your class is your primary adventuring role — how you fight, what you can do, and how you grow.</p>
        <input type="text" id="wiz-class-search" list="class-list" class="wiz-search" placeholder="Search class..." value="${d.charClass || ''}" autocomplete="off">
        <div id="wiz-class-preview" class="wiz-preview"></div>
        <div id="wiz-skill-choices" class="wiz-choices"></div>
      </div>`;
    const input = document.getElementById('wiz-class-search');
    const preview = document.getElementById('wiz-class-preview');
    const skillDiv = document.getElementById('wiz-skill-choices');

    const showPreview = (name) => {
      const info = getClassInfo(name);
      if (!info) { preview.innerHTML = '<div class="wiz-hint">Select a class to see details</div>'; skillDiv.innerHTML = ''; return; }
      d.charClass = name;
      d._classInfo = info;
      d.speed = d._speciesInfo?.speed || 30;

      const saves = info.savingThrows.map(s => s.toUpperCase()).join(', ');
      const armor = (info.armorProf || []).map(stripTags).join(', ') || 'None';
      const weapons = (info.weaponProf || []).map(stripTags).join(', ') || 'None';
      preview.innerHTML = `
        <div class="wiz-preview-card">
          <h3>${info.name} <span class="wiz-source">${info.src}</span></h3>
          <div class="wiz-stat-row"><strong>Hit Die:</strong> ${info.hitDie}</div>
          <div class="wiz-stat-row"><strong>Saving Throws:</strong> ${saves}</div>
          <div class="wiz-stat-row"><strong>Armor:</strong> ${armor}</div>
          <div class="wiz-stat-row"><strong>Weapons:</strong> ${weapons}</div>
          ${info.subclasses.length ? `<div class="wiz-stat-row"><strong>Subclasses:</strong> ${[...new Map(info.subclasses.filter(s => { const _ua=typeof isUAEnabled==='function'?isUAEnabled():true; const _s24=typeof is2024Enabled==='function'?is2024Enabled():true; const _s14=typeof is2014Enabled==='function'?is2014Enabled():false; if(s.source==='UA2024') return _ua&&_s24; if(typeof is2024Source==='function'&&is2024Source(s.source)) return _s24; return _s14; }).map(s => [s.name, s])).values()].map(s => s.name).join(', ')}</div>` : ''}
        </div>`;

      // Skill choices (rendered below the preview card)
      renderSkillChoices(info, d);
    };

    const renderSkillChoices = (info, d) => {
      skillDiv.innerHTML = '';

      // ---- Skill proficiencies ----
      if (info.skillChoices) {
        const from = info.skillChoices.from || [];
        const count = info.skillChoices.count || 2;
        d._classSkillChoices = d._classSkillChoices || [];

        const heading = document.createElement('h4');
        heading.className = 'wiz-subtitle';
        heading.textContent = `Choose ${count} Skill Proficiencies`;
        skillDiv.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'wiz-checkbox-grid';
        const updateSkillStates = () => {
          const atLimit = d._classSkillChoices.length >= count;
          grid.querySelectorAll('.wiz-checkbox-label').forEach(lbl => {
            const inp = lbl.querySelector('input');
            const isChecked = inp.checked;
            const shouldDisable = atLimit && !isChecked;
            inp.disabled = shouldDisable;
            lbl.classList.toggle('disabled', shouldDisable);
          });
        };

        from.forEach(sk => {
          const normSk = _normalizeSkillKey(sk);
          const labelText = _skillLabel(normSk);
          const checked = d._classSkillChoices.includes(normSk);
          const div = document.createElement('label');
          div.className = 'wiz-checkbox-label' + (checked ? ' selected' : '');
          div.innerHTML = `<input type="checkbox" value="${normSk}" ${checked ? 'checked' : ''}> ${labelText}`;
          div.querySelector('input').addEventListener('change', function () {
            if (this.checked) {
              if (d._classSkillChoices.length >= count) { this.checked = false; return; }
              d._classSkillChoices.push(normSk);
            } else {
              d._classSkillChoices = d._classSkillChoices.filter(s => s !== normSk);
            }
            d['skillProf_' + normSk] = this.checked;
            div.classList.toggle('selected', this.checked);
            updateSkillStates();
            renderExpertise();
          });
          grid.appendChild(div);
        });
        updateSkillStates();
        skillDiv.appendChild(grid);
      }

      // ---- Expertise (Rogue, Bard, etc.) ----
      const renderExpertise = () => {
        const existing = skillDiv.querySelector('.wiz-expertise-section');
        if (existing) existing.remove();
        if (!info.expertiseCount) return;

        d._expertiseChoices = d._expertiseChoices || [];

        // Gather all currently proficient skills (background + class picks), normalised to camelCase
        const profSkills = new Set([
          ...Object.keys(d._bgInfo?.skillProf || {}).map(_normalizeSkillKey),
          ...(d._classSkillChoices || []),
        ]);
        if (profSkills.size === 0) return;

        const count = info.expertiseCount;
        const section = document.createElement('div');
        section.className = 'wiz-expertise-section';

        const heading = document.createElement('h4');
        heading.className = 'wiz-subtitle';
        heading.textContent = `Choose ${count} Skills for Expertise`;
        section.appendChild(heading);

        const note = document.createElement('p');
        note.className = 'wiz-desc';
        note.textContent = 'Expertise doubles your proficiency bonus for these skills.';
        section.appendChild(note);

        const grid = document.createElement('div');
        grid.className = 'wiz-checkbox-grid';

        [...profSkills].sort().forEach(sk => {
          const labelText = _skillLabel(sk);
          const checked = d._expertiseChoices.includes(sk);
          const disabled = !checked && d._expertiseChoices.length >= count;
          const div = document.createElement('label');
          div.className = 'wiz-checkbox-label' + (checked ? ' selected' : '') + (disabled ? ' disabled' : '');
          div.style.opacity = disabled ? '0.45' : '';
          div.innerHTML = `<input type="checkbox" value="${sk}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}> ${labelText.charAt(0).toUpperCase() + labelText.slice(1)}`;
          div.querySelector('input').addEventListener('change', function () {
            if (this.checked) {
              if (d._expertiseChoices.length >= count) { this.checked = false; return; }
              d._expertiseChoices.push(sk);
            } else {
              d._expertiseChoices = d._expertiseChoices.filter(s => s !== sk);
            }
            div.classList.toggle('selected', this.checked);
            renderExpertise();
          });
          grid.appendChild(div);
        });

        section.appendChild(grid);
        skillDiv.appendChild(section);
      };

      renderExpertise();

      // ---- Fighting Style (Fighter, Ranger, Paladin, etc.) ----
      if (info.fightingStyleLevel && info.fightingStyleLevel <= 1) {
        const styles = typeof getFightingStyles === 'function' ? getFightingStyles() : [];
        if (styles.length) {
          const fsSection = document.createElement('div');
          fsSection.className = 'wiz-fighting-style-section';

          const heading = document.createElement('h4');
          heading.className = 'wiz-subtitle';
          heading.textContent = 'Choose a Fighting Style';
          fsSection.appendChild(heading);

          const note = document.createElement('p');
          note.className = 'wiz-desc';
          note.textContent = 'Select one Fighting Style feat granted by your class.';
          fsSection.appendChild(note);

          const grid = document.createElement('div');
          grid.className = 'wiz-checkbox-grid';

          styles.forEach(f => {
            const checked = d._fightingStyle === f.name;
            const div = document.createElement('label');
            div.className = 'wiz-checkbox-label' + (checked ? ' selected' : '');
            div.innerHTML = `<input type="radio" name="wiz-fighting-style" value="${f.name}" ${checked ? 'checked' : ''}> ${f.name} <span class="wiz-source">${f._src}</span>`;
            div.querySelector('input').addEventListener('change', function () {
              d._fightingStyle = this.value;
              grid.querySelectorAll('.wiz-checkbox-label').forEach(l => l.classList.remove('selected'));
              div.classList.add('selected');
              // Show description
              const descEl = fsSection.querySelector('.wiz-fs-desc');
              const info = typeof getFeatInfo === 'function' ? getFeatInfo(this.value) : null;
              if (descEl && info) descEl.innerHTML = `<strong>${info.name}</strong>: ${info.description}`;
              else if (descEl) descEl.innerHTML = '';
            });
            grid.appendChild(div);
          });
          fsSection.appendChild(grid);

          const descEl = document.createElement('div');
          descEl.className = 'wiz-fs-desc wiz-preview-card';
          descEl.style.marginTop = '8px';
          if (d._fightingStyle) {
            const fsInfo = typeof getFeatInfo === 'function' ? getFeatInfo(d._fightingStyle) : null;
            if (fsInfo) descEl.innerHTML = `<strong>${fsInfo.name}</strong>: ${fsInfo.description}`;
          }
          fsSection.appendChild(descEl);

          skillDiv.appendChild(fsSection);
        }
      }
    };
    input.addEventListener('change', () => showPreview(input.value));
    if (d.charClass) showPreview(d.charClass);
    else showPreview('');
  },

  // ========== DICE THROW ANIMATION ==========
  _playDiceAnimation(btn, rolls, onDone) {
    const TRANSITION = 1500; // ms — must match CSS transition-duration on .d6

    // Dot face layouts for the 3D cube
    const DOT_LAYOUTS = [
      ['d6-one-1'],
      ['d6-two-1','d6-two-2'],
      ['d6-three-1','d6-three-2','d6-three-3'],
      ['d6-four-1','d6-four-2','d6-four-3','d6-four-4'],
      ['d6-five-1','d6-five-2','d6-five-3','d6-five-4','d6-five-5'],
      ['d6-six-1','d6-six-2','d6-six-3','d6-six-4','d6-six-5','d6-six-6'],
    ];
    const makeDie = (id, valId) => {
      const faces = DOT_LAYOUTS.map(dots =>
        `<div class="d6-side">${dots.map(c => `<div class="d6-dot ${c}"></div>`).join('')}</div>`
      ).join('');
      return `<div class="d6-wrap">
        <div id="${id}" class="d6">${faces}</div>
        <div class="d6-val" id="${valId}"></div>
      </div>`;
    };

    // ── Build overlay ──────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'droll-overlay';

    const stage = document.createElement('div');
    stage.className = 'droll-stage';

    const title = document.createElement('div');
    title.className = 'droll-title';
    title.textContent = 'Roll Your Fate';

    const grid = document.createElement('div');
    grid.className = 'droll-grid';   // 2-column, 3-row

    const bottomBar = document.createElement('div');
    bottomBar.className = 'droll-bottom-bar';

    const rollAllBtn = document.createElement('button');
    rollAllBtn.type = 'button';
    rollAllBtn.className = 'btn wiz-roll-all-btn droll-roll-all-btn';
    rollAllBtn.innerHTML = '&#127922; Roll All';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn droll-confirm-btn';
    confirmBtn.innerHTML = '&#10003; Confirm Results';
    confirmBtn.style.display = 'none';

    bottomBar.append(rollAllBtn, confirmBtn);
    stage.append(title, grid, bottomBar);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('droll-overlay--in'));

    // ── Build 6 groups ─────────────────────────────────────────
    const rolledGroups = new Set();
    const groupRollBtns = [];

    rolls.forEach((roll, i) => {
      const group = document.createElement('div');
      group.className = 'droll-group';

      const diceRow = document.createElement('div');
      diceRow.className = 'droll-dice-row';
      roll.rolls.forEach((_, j) => { diceRow.innerHTML += makeDie(`d6-${i}-${j}`, `d6-val-${i}-${j}`); });

      const groupBtn = document.createElement('button');
      groupBtn.type = 'button';
      groupBtn.className = 'droll-group-roll-btn';
      groupBtn.innerHTML = '&#127922; Roll';
      groupBtn.addEventListener('click', e => { e.stopPropagation(); rollGroup(i); });
      groupRollBtns.push(groupBtn);

      const totalEl = document.createElement('div');
      totalEl.className = 'droll-group-total';
      totalEl.id = `droll-total-${i}`;

      const actionSlot = document.createElement('div');
      actionSlot.className = 'droll-action-slot';
      actionSlot.append(groupBtn, totalEl);

      group.append(diceRow, actionSlot);
      grid.appendChild(group);
    });

    // ── Roll logic ─────────────────────────────────────────────
    const rollGroup = i => {
      if (rolledGroups.has(i)) return;
      rolledGroups.add(i);

      const roll = rolls[i];
      const groupBtn = groupRollBtns[i];
      if (groupBtn) { groupBtn.disabled = true; groupBtn.textContent = '…'; }

      // Identify dropped dice using kept list (more reliable with duplicates)
      const keptCopy = [...roll.kept];
      const droppedFlags = roll.rolls.map(v => {
        const idx = keptCopy.indexOf(v);
        if (idx !== -1) { keptCopy.splice(idx, 1); return false; } // it's kept
        return true; // not found in kept → dropped
      });

      // Spin each die to its value with a tiny per-die stagger
      roll.rolls.forEach((val, j) => {
        setTimeout(() => {
          const dieEl = document.getElementById(`d6-${i}-${j}`);
          if (!dieEl) return;
          const wrapEl = dieEl.parentElement;
          if (droppedFlags[j]) wrapEl.classList.add('d6-wrap--dropped');
          const FACE_MAP = {1:1, 2:6, 3:4, 4:5, 5:2, 6:3};
          dieEl.classList.add(`d6-show-${FACE_MAP[val] || val}`);
          // Reveal numeric label after die settles
          setTimeout(() => {
            const valEl = document.getElementById(`d6-val-${i}-${j}`);
            if (valEl) { valEl.textContent = val; valEl.classList.add('d6-val--in'); }
          }, TRANSITION - 100);
        }, j * 120);
      });

      // After all dice settle: reveal total, hide roll btn, maybe show confirm
      const settleMs = TRANSITION + (roll.rolls.length - 1) * 120 + 150;
      setTimeout(() => {
        const totalEl = document.getElementById(`droll-total-${i}`);
        if (totalEl) {
          totalEl.textContent = roll.total;
          totalEl.classList.add('droll-group-total--in');
        }
        if (groupBtn) groupBtn.style.visibility = 'hidden';

        if (rolledGroups.size === rolls.length) {
          // All groups done — swap Roll All for Confirm
          rollAllBtn.classList.add('droll-btn-fadeout');
          setTimeout(() => {
            rollAllBtn.style.display = 'none';
            confirmBtn.style.display = '';
            requestAnimationFrame(() => confirmBtn.classList.add('droll-confirm--in'));
          }, 350);
        }
      }, settleMs);
    };

    const rollAll = () => {
      rolls.forEach((_, i) => {
        if (!rolledGroups.has(i)) setTimeout(() => rollGroup(i), i * 120);
      });
    };

    rollAllBtn.addEventListener('click', e => { e.stopPropagation(); rollAll(); });
    confirmBtn.addEventListener('click', e => {
      e.stopPropagation();
      overlay.classList.add('droll-overlay--out');
      setTimeout(() => { overlay.remove(); onDone(); }, 400);
    });
  },

  // ========== STEP: ABILITIES ==========
  _step_abilities(container) {
    const d = this.draft;
    const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
    const ABS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const AB_SHORT = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
    const method = d._abilityMethod || 'standard';
    const COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
    const modStr = s => { const m = Math.floor(((s || 10) - 10) / 2); return (m >= 0 ? '+' : '') + m; };

    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Set Ability Scores</h2>
        <div class="wiz-method-tabs">
          <button class="wiz-method-btn ${method === 'standard' ? 'active' : ''}" data-method="standard">Standard Array</button>
          <button class="wiz-method-btn ${method === 'pointbuy' ? 'active' : ''}" data-method="pointbuy">Point Buy</button>
          <button class="wiz-method-btn ${method === 'roll' ? 'active' : ''}" data-method="roll">Roll 4d6</button>
          <button class="wiz-method-btn ${method === 'manual' ? 'active' : ''}" data-method="manual">Manual</button>
        </div>
        <div id="wiz-ab-info" class="wiz-ab-info-bar"></div>
        <div class="wiz-ab-boxes" id="wiz-ab-boxes"></div>
        <div id="wiz-ab-extra"></div>
      </div>`;

    container.querySelectorAll('.wiz-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newMethod = btn.dataset.method;
        if (newMethod === d._abilityMethod) return;
        d._abilityMethod = newMethod;
        // Reset scores: manual defaults to 10, point buy sets to 8 on render, others blank
        ABS.forEach(ab => { d[ab] = newMethod === 'manual' ? 10 : null; });
        d._rolls = [];
        d._rollAssign = {};
        this._step_abilities(container);
      });
    });

    const infoEl = container.querySelector('#wiz-ab-info');
    const boxesEl = container.querySelector('#wiz-ab-boxes');
    const extraEl = container.querySelector('#wiz-ab-extra');

    const modStrOrBlank = s => s == null ? '—' : modStr(s);

    // Build 6 ability boxes; innerFn(ab, score) returns the HTML for the control inside the box
    const renderBoxes = (innerFn) => {
      boxesEl.innerHTML = ABS.map(ab => {
        const score = d[ab] ?? null;
        return `<div class="wiz-ab-box" data-ab="${ab}">
          <div class="wiz-ab-box-name">${AB_SHORT[ab]}</div>
          ${innerFn(ab, score)}
          <div class="wiz-ab-box-mod">${modStrOrBlank(score)}</div>
        </div>`;
      }).join('');
    };

    const refreshMod = (ab) => {
      const box = boxesEl.querySelector(`.wiz-ab-box[data-ab="${ab}"]`);
      if (box) box.querySelector('.wiz-ab-box-mod').textContent = modStrOrBlank(d[ab]);
    };

    // ---- Standard Array ----
    if (method === 'standard') {
      const render = () => {
        const used = new Set(ABS.map(ab => d[ab]).filter(v => v && STANDARD_ARRAY.includes(v)));
        infoEl.innerHTML = `<div class="wiz-std-remaining">${
          STANDARD_ARRAY.map(v => `<span class="${used.has(v) ? 'used' : 'avail'}">${v}</span>`).join('')
        }</div>`;
        renderBoxes((ab) => {
          const myVal = STANDARD_ARRAY.includes(d[ab]) ? d[ab] : null;
          const opts = ['<option value="">—</option>',
            ...STANDARD_ARRAY.filter(v => !used.has(v) || v === myVal)
              .map(v => `<option value="${v}" ${v === myVal ? 'selected' : ''}>${v}</option>`)
          ].join('');
          return `<select class="wiz-ab-select" data-ab="${ab}">${opts}</select>`;
        });
        boxesEl.querySelectorAll('.wiz-ab-select').forEach(sel => {
          sel.addEventListener('change', () => { d[sel.dataset.ab] = parseInt(sel.value) || null; render(); });
        });
      };
      render();

    // ---- Point Buy ----
    } else if (method === 'pointbuy') {
      ABS.forEach(ab => { if (d[ab] == null || d[ab] < 8 || d[ab] > 15) d[ab] = 8; });
      const pts = () => 27 - ABS.reduce((s, ab) => s + (COSTS[d[ab]] || 0), 0);
      const render = () => {
        const p = pts();
        infoEl.innerHTML = `<div class="wiz-points-remaining">Points remaining: <strong>${p}</strong> / 27</div>`;
        renderBoxes((ab, score) => {
          const cost = COSTS[score] || 0;
          const canUp = score < 15 && p - (COSTS[score + 1] - cost) >= 0;
          const canDown = score > 8;
          return `<div class="wiz-ab-pb-row">
            <button class="wiz-pb-btn" data-ab="${ab}" data-dir="-1"${canDown ? '' : ' disabled'}>−</button>
            <div class="wiz-ab-pb-score">${score}</div>
            <button class="wiz-pb-btn" data-ab="${ab}" data-dir="1"${canUp ? '' : ' disabled'}>+</button>
          </div>
          <div class="wiz-ab-box-cost">${cost} pts</div>`;
        });
        boxesEl.querySelectorAll('.wiz-pb-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const ab = btn.dataset.ab, dir = parseInt(btn.dataset.dir), nv = d[ab] + dir;
            if (nv < 8 || nv > 15 || pts() - (COSTS[nv] - COSTS[d[ab]]) < 0) return;
            d[ab] = nv; render();
          });
        });
      };
      render();

    // ---- Roll 4d6 ----
    } else if (method === 'roll') {
      d._rolls = d._rolls || [];
      const showState = () => {
        if (d._rolls.length === 6) {
          const totals = d._rolls.map(r => r.total);
          if (!d._rollAssign) d._rollAssign = {};
          const diceHtml = d._rolls.map(r => {
            const dice = r.rolls.map((die, j) => {
              const drop = r.dropped.includes(die) && j === r.rolls.indexOf(die);
              return `<span class="roll-die ${drop ? 'dropped' : 'kept'}">${die}</span>`;
            }).join('');
            return `<div class="wiz-roll-row"><span class="wiz-roll-dice">${dice}</span><span class="wiz-roll-total">= ${r.total}</span></div>`;
          }).join('');
          infoEl.innerHTML = `<button class="btn wiz-roll-all-btn" id="wiz-roll-all">&#127922; Re-Roll</button>`;
          extraEl.innerHTML = `<div class="wiz-roll-results" style="margin-top:12px">${diceHtml}</div>`;
          const renderAssign = () => {
            const usedIdx = new Set(Object.values(d._rollAssign));
            renderBoxes((ab) => {
              const myIdx = d._rollAssign[ab] ?? null;
              const opts = ['<option value="">—</option>',
                ...totals.map((v, idx) => usedIdx.has(idx) && idx !== myIdx ? '' : `<option value="${idx}" ${idx === myIdx ? 'selected' : ''}>${v}</option>`)
              ].join('');
              return `<select class="wiz-ab-select" data-ab="${ab}">${opts}</select>`;
            });
            boxesEl.querySelectorAll('.wiz-ab-select').forEach(sel => {
              sel.addEventListener('change', () => {
                const ab = sel.dataset.ab;
                if (sel.value !== '') { const idx = parseInt(sel.value); d._rollAssign[ab] = idx; d[ab] = totals[idx]; }
                else { delete d._rollAssign[ab]; d[ab] = null; }
                renderAssign();
              });
            });
          };
          renderAssign();
        } else {
          infoEl.innerHTML = `<button class="btn wiz-roll-all-btn pulse" id="wiz-roll-all">&#127922; Roll Your Fate</button>`;
          extraEl.innerHTML = '';
          renderBoxes(() => `<div class="wiz-ab-pb-score">—</div>`);
        }
        infoEl.querySelector('#wiz-roll-all')?.addEventListener('click', (e) => {
          d._rolls = []; d._rollAssign = {};
          for (let i = 0; i < 6; i++) d._rolls.push(Dice.roll4d6DropLowest());
          this._playDiceAnimation(e.currentTarget, d._rolls, () => showState());
        });
      };
      showState();

    // ---- Manual ----
    } else {
      ABS.forEach(ab => { if (d[ab] == null) d[ab] = 10; });
      infoEl.innerHTML = `<p class="wiz-desc">Enter any score from 1–30 directly.</p>`;
      renderBoxes((ab, score) => `<input type="number" class="wiz-ab-input" data-ab="${ab}" value="${score ?? 10}" placeholder="10" min="1" max="30">`);
      boxesEl.querySelectorAll('.wiz-ab-input').forEach(inp => {
        inp.addEventListener('input', () => {
          d[inp.dataset.ab] = inp.value !== '' ? (parseInt(inp.value) || null) : null;
          refreshMod(inp.dataset.ab);
        });
      });
    }

    // ---- Background ASI Picker ----
    if (d.charBackground) {
      const AB_MAP   = { str:'Strength', dex:'Dexterity', con:'Constitution', int:'Intelligence', wis:'Wisdom', cha:'Charisma' };
      const AB_SHORT = { str:'STR', dex:'DEX', con:'CON', int:'INT', wis:'WIS', cha:'CHA' };
      const ALL_ABS  = ['str','dex','con','int','wis','cha'];

      const bgInfo = d._bgInfo || (typeof getBackgroundInfo === 'function' ? getBackgroundInfo(d.charBackground) : null);

      const { pool, modes, fixedBonus, isFixed } = _parseBgAbility(bgInfo?.ability);
      const isCustomBg = bgInfo?.name === 'Custom Background';
      // Pool: abilities the player can choose from. Default to all 6 if no data
      const abOptions = pool.length ? pool : [...ALL_ABS];
      // When no mode data, infer defaults: Custom Background = 2 pts (+1/+1), others = 3 pts (+2/+1)
      const effectiveModes = modes.length ? modes
        : isCustomBg ? ['two_plus_one']
        : ['two_one', 'all_three'];
      const canTwoOne    = !isFixed && effectiveModes.includes('two_one');
      const canAllThree  = !isFixed && effectiveModes.includes('all_three');
      const canTwoPlusOne= !isFixed && effectiveModes.includes('two_plus_one');

      // Init/reset _bgAsi when background changes
      if (!d._bgAsi || d._bgAsi._bg !== d.charBackground) {
        if (isFixed) {
          d._bgAsi = { _bg: d.charBackground, type: 'fixed' };
        } else if (canTwoPlusOne && !canTwoOne) {
          d._bgAsi = { _bg: d.charBackground, type: 'two_plus_one', twoAb: null, oneAb: null };
        } else {
          // Auto-select all three if the only mode is all_three and pool has exactly 3
          const defaultType = 'two_one';
          const autoThree = (canAllThree && !canTwoOne && abOptions.length === 3) ? [...abOptions] : [];
          const initType = (canAllThree && !canTwoOne) ? 'all_three' : defaultType;
          d._bgAsi = { _bg: d.charBackground, type: initType, twoAb: null, oneAb: null, threeAbs: autoThree };
        }
      } else if (d._bgAsi.type === 'all_three' && abOptions.length === 3 && !(d._bgAsi.threeAbs?.length)) {
        // Already in all_three mode but nothing selected yet — auto-fill
        d._bgAsi.threeAbs = [...abOptions];
      }

      const asiSection = document.createElement('div');
      asiSection.className = 'bg-asi-section';
      container.querySelector('.wiz-section').appendChild(asiSection);

      const renderAsi = () => {
        const mode = d._bgAsi.type;

        // Build cards HTML
        const cardsHtml = abOptions.map(a => {
          let bonus = 0, cls = '';
          if (isFixed) {
            bonus = fixedBonus[a] || 0; cls = bonus === 2 ? 'two' : bonus === 1 ? 'one' : '';
          } else if (mode === 'two_one') {
            if (d._bgAsi.twoAb === a) { bonus = 2; cls = 'two'; }
            else if (d._bgAsi.oneAb === a) { bonus = 1; cls = 'one'; }
          } else if (mode === 'two_plus_one') {
            // totalPoints=2: +1 to two chosen abilities
            if (d._bgAsi.twoAb === a || d._bgAsi.oneAb === a) { bonus = 1; cls = 'one'; }
          } else if (mode === 'all_three') {
            if ((d._bgAsi.threeAbs || []).includes(a)) { bonus = 1; cls = 'one'; }
          }
          return `<div class="bg-asi-card ${cls}" data-ab="${a}">
            <div class="bg-asi-card-short">${AB_SHORT[a]}</div>
            <div class="bg-asi-card-name">${AB_MAP[a]}</div>
            <div class="bg-asi-card-bonus">${bonus > 0 ? '+' + bonus : '—'}</div>
          </div>`;
        }).join('');

        const modeBarHtml = (!isFixed && canTwoOne && canAllThree) ? `
          <div class="bg-asi-mode-bar">
            <button class="bg-asi-mode-btn${mode === 'two_one' ? ' active' : ''}" data-mode="two_one">
              <span class="bg-asi-mode-label">+2 / +1</span>
              <span class="bg-asi-mode-sub">One ability +2, another +1</span>
            </button>
            <button class="bg-asi-mode-btn${mode === 'all_three' ? ' active' : ''}" data-mode="all_three">
              <span class="bg-asi-mode-label">+1 / +1 / +1</span>
              <span class="bg-asi-mode-sub">Three abilities +1 each</span>
            </button>
          </div>` : '';

        const hintHtml = isFixed
          ? `<p class="bg-asi-hint">These ability score bonuses are fixed for this background.</p>`
          : mode === 'two_one'
            ? `<p class="bg-asi-hint">Click an ability for <strong>+2</strong>, then another for <strong>+1</strong>. Click again to clear.</p>`
          : mode === 'two_plus_one'
            ? `<p class="bg-asi-hint">Click two abilities to each gain <strong>+1</strong>. Click again to clear.</p>`
          : `<p class="bg-asi-hint">Click three abilities to each gain <strong>+1</strong>. Click again to deselect.</p>`;

        asiSection.innerHTML = `
          <div class="lu-section-title" style="margin-top:20px">Background Ability Score Increases</div>
          <p class="bg-asi-desc">
            <strong>${d.charBackground}</strong> — choose which abilities to increase.
          </p>
          ${modeBarHtml}
          <div class="bg-asi-cards">${cardsHtml}</div>
          ${hintHtml}
        `;

        // Mode toggle buttons
        asiSection.querySelectorAll('.bg-asi-mode-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            d._bgAsi.type = btn.dataset.mode;
            d._bgAsi.twoAb = null; d._bgAsi.oneAb = null;
            // Auto-select all three if pool has exactly 3 options
            d._bgAsi.threeAbs = (btn.dataset.mode === 'all_three' && abOptions.length === 3) ? [...abOptions] : [];
            renderAsi();
          });
        });

        // Card clicks
        if (!isFixed) {
          asiSection.querySelectorAll('.bg-asi-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
              const ab = card.dataset.ab;
              if (mode === 'two_one') {
                if (d._bgAsi.twoAb === ab)      { d._bgAsi.twoAb = null; }
                else if (d._bgAsi.oneAb === ab) { d._bgAsi.oneAb = null; }
                else if (!d._bgAsi.twoAb)       { d._bgAsi.twoAb = ab; }
                else if (!d._bgAsi.oneAb)       { d._bgAsi.oneAb = ab; }
                else { if (d._bgAsi.oneAb === ab) d._bgAsi.oneAb = null; d._bgAsi.twoAb = ab; }
              } else if (mode === 'two_plus_one') {
                // +1 to exactly 2 abilities (twoAb/oneAb reused as first/second)
                if (d._bgAsi.twoAb === ab)      { d._bgAsi.twoAb = null; }
                else if (d._bgAsi.oneAb === ab) { d._bgAsi.oneAb = null; }
                else if (!d._bgAsi.twoAb)       { d._bgAsi.twoAb = ab; }
                else if (!d._bgAsi.oneAb)       { d._bgAsi.oneAb = ab; }
                // else both full — do nothing (must deselect first)
              } else if (mode === 'all_three') {
                const arr = d._bgAsi.threeAbs || [];
                const idx = arr.indexOf(ab);
                if (idx >= 0) arr.splice(idx, 1);
                else if (arr.length < 3) arr.push(ab);
                d._bgAsi.threeAbs = arr;
              }
              renderAsi();
            });
          });
        }
      };

      renderAsi();
    }
  },

  // ========== STEP: EQUIPMENT ==========
  _step_equipment(container) {
    const d = this.draft;
    const classInfo = d.charClass ? getClassInfo(d.charClass) : null;
    const equip = classInfo?.startingEquipment;

    const cleanItem = it => {
      if (!it) return '';
      if (typeof it === 'string') return stripTags(it.replace(/\|[^,)|]+/g, '').trim());
      if (it.value != null) {
        // value is in copper pieces; convert to GP
        const gp = it.value / 100;
        return gp + ' GP';
      }
      if (it.equipmentType) {
        const typeNames = { weaponMartial: 'any martial weapon', weaponSimple: 'any simple weapon', armorLight: 'any light armor', armorMedium: 'any medium armor' };
        const label = typeNames[it.equipmentType] || it.equipmentType.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
        return (it.quantity ? `${it.quantity}× ` : '') + label;
      }
      if (it.item) return (it.quantity ? `${it.quantity}× ` : '') + stripTags(it.item.replace(/\|[^,)|]+/g, '').trim());
      if (it.special) return it.special;
      return '';
    };

    // Returns the total GP embedded in a choice's item list (from {value} objects or displayName prices)
    const priceToGp = s => { const m = s?.match(/(\d+(?:\.\d+)?)\s*(cp|sp|ep|gp|pp)$/i); if (!m) return 0; const n = parseFloat(m[1]); return ({cp:0.01,sp:0.1,ep:0.5,gp:1,pp:10}[m[2].toLowerCase()] || 1) * n; };
    const choiceGold = arr => arr.reduce((sum, it) => {
      if (!it) return sum;
      if (it.value != null) return sum + it.value / 100;
      if (it.displayName) return sum + priceToGp(it.displayName);
      return sum;
    }, 0);

    const formatItemList = arr => arr.map(it => cleanItem(it)).filter(Boolean).join(', ');

    // Build class choices HTML
    let choicesHtml = '';
    if (equip?.defaultData?.length) {
      choicesHtml = '<div class="lu-section" id="wiz-class-equip">';
      choicesHtml += `<div class="lu-section-title">${d.charClass} Starting Equipment</div>`;

      // If the source has a human-readable entries description, show it as context
      if (equip.entries?.length) {
        const desc = equip.entries.map(e => typeof e === 'string' ? stripTags(e) : '').filter(Boolean).join(' ');
        if (desc) choicesHtml += `<p style="font-size:0.82rem;color:var(--ink-faint);margin:4px 0 10px;font-style:italic">${desc}</p>`;
      }

      equip.defaultData.forEach((row, i) => {
        const keys = Object.keys(row).filter(k => k !== '_');
        if (row._) {
          choicesHtml += `<p style="font-size:0.85rem;color:var(--ink-faint);margin:4px 0"><em>Always included:</em> ${formatItemList(row._)}</p>`;
          return;
        }
        if (!keys.length) return;
        const saved = d[`_equipChoice_${i}`] || '';
        // Only show "Choice N:" header if there's no entries description or multiple choices
        if (!equip.entries?.length || equip.defaultData.filter(r => !r._).length > 1) {
          choicesHtml += `<p style="font-size:0.85rem;font-weight:600;margin:8px 0 4px">Choice ${i + 1}:</p>`;
        }
        choicesHtml += `<div class="lu-asi-options" style="flex-direction:column;gap:6px" id="equip-choice-${i}">`;
        keys.forEach(k => {
          const items = formatItemList(row[k]);
          choicesHtml += `<label class="lu-asi-choice${saved === k ? ' selected' : ''}" style="font-size:0.82rem;padding:6px 12px">
            <input type="radio" name="equip-${i}" value="${k}" ${saved === k ? 'checked' : ''}>
            <span><strong>(${k.toUpperCase()})</strong> ${items}</span>
          </label>`;
        });
        choicesHtml += '</div>';
      });
      if (equip.goldAlternative) {
        const goldText = stripTags(equip.goldAlternative);
        choicesHtml += `<p style="font-size:0.78rem;color:var(--ink-faint);margin-top:8px">Or start with ${goldText} instead of equipment.</p>`;
      }
      choicesHtml += '</div><hr style="border:none;border-top:1px solid var(--border);margin:12px 0">';
    }

    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Starting Equipment</h2>
        <p class="wiz-desc">Choose your class equipment and add any additional items. You can always adjust your inventory later.</p>
        ${choicesHtml}
        <div class="wiz-equip-search">
          <input type="text" id="wiz-item-search" class="wiz-search" placeholder="Search items to add..." autocomplete="off">
          <div id="wiz-item-results" class="autocomplete-dropdown" style="display:none"></div>
        </div>
        <div id="wiz-equip-list" class="wiz-equip-list"></div>
        <div class="wiz-currency-row">
          <h4>Starting Gold</h4>
          <div class="wiz-currency-input"><label>GP</label><input type="number" id="wiz-gp" value="${d.gp || 0}" min="0"></div>
        </div>
        <div id="wiz-gp-summary" class="wiz-gp-summary"></div>
      </div>`;

    // Collect mandatory (row._) items into draft
    if (equip?.defaultData?.length) {
      d._mandatoryEquip = equip.defaultData.filter(row => row._).flatMap(row => row._);
    }

    // Bind choice radios
    if (equip?.defaultData?.length) {
      equip.defaultData.forEach((row, i) => {
        const keys = Object.keys(row).filter(k => k !== '_');
        if (!keys.length) return;
        container.querySelectorAll(`input[name="equip-${i}"]`).forEach(radio => {
          radio.addEventListener('change', () => {
            container.querySelectorAll(`#equip-choice-${i} .lu-asi-choice`).forEach(el => el.classList.remove('selected'));
            radio.closest('.lu-asi-choice').classList.add('selected');
            d[`_equipChoice_${i}`] = radio.value;
            if (!d._equipChoices) d._equipChoices = {};
            d._equipChoices[i] = row[radio.value];
            // Apply embedded gold: subtract previously applied gold for this choice slot, then add new
            if (!d._equipGold) d._equipGold = {};
            const prevGold = d._equipGold[i] || 0;
            const newGold = choiceGold(row[radio.value] || []);
            d.gp = Math.max(0, (d.gp || 0) - prevGold + newGold);
            d._equipGold[i] = newGold;
            const gpInput = document.getElementById('wiz-gp');
            if (gpInput) gpInput.value = d.gp;
            updateGpSummary();
          });
        });
      });
    }

    const spentGp = () => (d.inventory || []).reduce((sum, it) => sum + (it._valueCp || 0) / 100, 0);

    const updateGpSummary = () => {
      const spent = spentGp();
      const available = d.gp || 0;
      const remaining = available - spent;
      const el = document.getElementById('wiz-gp-summary');
      if (!el) return;
      el.innerHTML = `Spent: <strong>${spent.toFixed(2).replace(/\.00$/, '')} gp</strong> &nbsp;|&nbsp; Available: <strong>${available} gp</strong> &nbsp;|&nbsp; Remaining: <strong style="color:${remaining < 0 ? '#c0392b' : 'var(--gold)'}">${remaining.toFixed(2).replace(/\.00$/, '')} gp</strong>`;
    };

    const renderList = () => {
      const list = document.getElementById('wiz-equip-list');
      list.innerHTML = (d.inventory || []).map((it, i) => `
        <div class="wiz-equip-item">
          <span class="wiz-equip-name">${it.name}${it.damage ? ' <span class="wiz-equip-dmg">(' + it.damage + ')</span>' : ''}</span>
          <span class="wiz-equip-price">${it.value || ''}</span>
          <button class="del-btn" data-idx="${i}">✕</button>
        </div>`).join('') || '<div class="wiz-hint">No items added yet</div>';
      list.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          d.inventory.splice(parseInt(btn.dataset.idx), 1);
          renderList();
          updateGpSummary();
        });
      });
      updateGpSummary();
    };
    renderList();

    document.getElementById('wiz-gp')?.addEventListener('input', function () { d.gp = parseFloat(this.value) || 0; updateGpSummary(); });

    // Item search — only show items with a known value
    const input = document.getElementById('wiz-item-search');
    const dropdown = document.getElementById('wiz-item-results');
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (q.length < 2) { dropdown.style.display = 'none'; return; }
      const matches = DndData.allItems.filter(i => i.value && i.name.toLowerCase().includes(q)).slice(0, 20);
      dropdown.innerHTML = '';
      if (!matches.length) { dropdown.style.display = 'none'; return; }
      matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'ac-item';
        div.innerHTML = `<span class="ac-item-name">${item.name} <small>[${item._src}]</small></span><span class="ac-item-detail">${item._type}${item._dmgStr ? ' | ' + item._dmgStr : ''} | ${item._valueStr}</span>`;
        div.addEventListener('click', () => {
          d.inventory.push({ name: item.name, type: item._type, damage: item._dmgStr || '', mastery: (item.mastery || []).join(', '), properties: item._propStr || '', weight: item.weight || 0, value: item._valueStr || '', _valueCp: item.value || 0, ac: item.ac || 0, rarity: item.rarity || 'none', category: item._category, qty: 1 });
          renderList();
          input.value = '';
          dropdown.style.display = 'none';
        });
        dropdown.appendChild(div);
      });
      dropdown.style.display = 'block';
    });
    input.addEventListener('blur', () => setTimeout(() => dropdown.style.display = 'none', 200));
  },

  // ========== STEP: SPELLS ==========
  _step_spells(container) {
    const d = this.draft;
    const className = d.charClass || '';
    const ua     = typeof isUAEnabled  === 'function' ? isUAEnabled()  : true;
    const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
    const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
    const allSpells = className ? getSpellsForClass(className) : DndData.spells;
    const spells = allSpells.filter(s => {
      if (s.source === 'UA2024') return ua && show24;
      if (typeof is2024Source === 'function' && is2024Source(s.source)) return show24;
      return show14;
    });
    const cantrips = spells.filter(s => s.level === 0);
    const level1 = spells.filter(s => s.level === 1);
    d.charSpells = d.charSpells || [];

    // Determine limits from class data
    const classInfo = className ? getClassInfo(className) : null;
    const maxCantrips = classInfo?.cantripCount ?? null;
    // Prepared spell count: for known-casters it's a fixed number; for prepared casters it's level+mod
    // At level 1 with average INT 16 (+3): level(1) + mod(3) = 4. Parse formula or use spellsKnownAtL1.
    let maxPrepared = classInfo?.spellsKnownAtL1 ?? null;
    if (maxPrepared === null && classInfo?.preparedSpellsFormula) {
      // Formula is "<$level$> + <$int_mod$>" — evaluate at level 1 with draft INT
      const intMod = Math.floor(((d.int || 10) - 10) / 2);
      maxPrepared = 1 + intMod; // level 1 + int mod
    }
    // Never allow 0 or negative prepared spells
    if (maxPrepared !== null) maxPrepared = Math.max(1, maxPrepared);

    const countSelected = (level) => d.charSpells.filter(s => s.level === level && !s.racial).length;

    const renderCounter = (level) => {
      const id = level === 0 ? 'wiz-cantrip-counter' : 'wiz-spell1-counter';
      const max = level === 0 ? maxCantrips : maxPrepared;
      const count = countSelected(level);
      const el = document.getElementById(id);
      if (!el) return;
      if (max !== null) {
        el.textContent = `${count} / ${max} selected`;
        el.style.color = count > max ? 'var(--danger, #c00)' : count === max ? 'var(--success, #2a7)' : 'var(--ink-faint)';
      } else {
        el.textContent = `${count} selected`;
        el.style.color = 'var(--ink-faint)';
      }
    };

    const cantripLabel = maxCantrips !== null ? `Cantrips <small style="font-weight:normal;color:var(--ink-faint)">(choose ${maxCantrips})</small>` : 'Cantrips';
    const prepLabel = maxPrepared !== null ? `1st-Level Spells <small style="font-weight:normal;color:var(--ink-faint)">(choose ${maxPrepared})</small>` : '1st-Level Spells';

    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Choose Spells</h2>
        <p class="wiz-desc">Select cantrips and 1st-level spells for your ${className || 'class'}.</p>
        <div class="wiz-spell-group">
          <h3>${cantripLabel} <span id="wiz-cantrip-counter" style="font-size:0.82rem;margin-left:8px"></span></h3>
          <input type="text" id="wiz-cantrip-filter" class="wiz-search wiz-search-sm" placeholder="Filter cantrips..." autocomplete="off">
          <div id="wiz-cantrip-list" class="wiz-spell-list"></div>
        </div>
        <div class="wiz-spell-group">
          <h3>${prepLabel} <span id="wiz-spell1-counter" style="font-size:0.82rem;margin-left:8px"></span></h3>
          <input type="text" id="wiz-spell1-filter" class="wiz-search wiz-search-sm" placeholder="Filter spells..." autocomplete="off">
          <div id="wiz-spell1-list" class="wiz-spell-list"></div>
        </div>
      </div>`;

    const renderSpellList = (spellsToRender, containerId, level) => {
      const el = document.getElementById(containerId);
      if (!el) return;
      const max = level === 0 ? maxCantrips : maxPrepared;
      el.innerHTML = '';
      spellsToRender.forEach(spell => {
        const isSelected = d.charSpells.some(s => s.name === spell.name);
        const atMax = max !== null && countSelected(level) >= max && !isSelected;
        const div = document.createElement('label');
        div.className = 'wiz-spell-item' + (isSelected ? ' selected' : '') + (atMax ? ' disabled' : '');
        if (atMax) div.style.opacity = '0.45';
        div.innerHTML = `
          <input type="checkbox" ${isSelected ? 'checked' : ''} ${atMax ? 'disabled' : ''}>
          <span class="wiz-spell-name">${spell.name}</span>
          <span class="wiz-spell-meta">${spell._schoolName} | ${spell._castTime} | ${spell._rangeStr}</span>`;
        div.querySelector('input').addEventListener('change', function () {
          if (this.checked) {
            if (max !== null && countSelected(level) >= max) { this.checked = false; return; }
            d.charSpells.push({ name: spell.name, level, prepared: true });
          } else {
            d.charSpells = d.charSpells.filter(s => s.name !== spell.name);
          }
          div.classList.toggle('selected', this.checked);
          renderCounter(level);
          // Re-render to update disabled states on other items
          const q = (level === 0
            ? document.getElementById('wiz-cantrip-filter')
            : document.getElementById('wiz-spell1-filter'))?.value.toLowerCase() || '';
          const filtered = (level === 0 ? cantrips : level1).filter(s => !q || s.name.toLowerCase().includes(q));
          renderSpellList(filtered, containerId, level);
        });
        el.appendChild(div);
      });
      renderCounter(level);
    };

    renderSpellList(cantrips, 'wiz-cantrip-list', 0);
    renderSpellList(level1, 'wiz-spell1-list', 1);

    // Filters
    document.getElementById('wiz-cantrip-filter')?.addEventListener('input', function () {
      const q = this.value.toLowerCase();
      renderSpellList(cantrips.filter(s => s.name.toLowerCase().includes(q)), 'wiz-cantrip-list', 0);
    });
    document.getElementById('wiz-spell1-filter')?.addEventListener('input', function () {
      const q = this.value.toLowerCase();
      renderSpellList(level1.filter(s => s.name.toLowerCase().includes(q)), 'wiz-spell1-list', 1);
    });
  },

  // ========== STEP: OPTIONS ==========
  _step_options(container) {
    const d = this.draft;
    if (!d.charOptions) d.charOptions = [];

    const show14 = typeof is2014Enabled === 'function' && is2014Enabled();
    if (!show14) {
      container.innerHTML = `
        <div class="wiz-section">
          <h2 class="wiz-title">Other Character Options</h2>
          <div class="wiz-locked-notice">
            <p>These options are only available with 2014 edition content.</p>
            <p>Enable 2014 content using the <strong>'14</strong> button in the top-right corner to unlock this step.</p>
          </div>
        </div>`;
      return;
    }

    const TYPE_LABELS = {
      'SG': 'Supernatural Gifts', 'DG': 'Dark Gifts',
      'CS': 'Character Secrets', 'RF:B': 'Background Features', '': 'All'
    };
    const typeFilter = { current: '' };

    const renderList = () => {
      const list = document.getElementById('wiz-opts-list');
      const preview = document.getElementById('wiz-opts-preview');
      if (!list) return;
      list.innerHTML = '';
      const query = (document.getElementById('wiz-opts-search')?.value || '').toLowerCase();
      const ua     = typeof isUAEnabled  === 'function' ? isUAEnabled()  : true;
      const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
      const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
      const filtered = DndData.charOptions.filter(o => {
        if (o.source === 'UA2024') { if (!ua || !show24) return false; }
        else if (typeof is2024Source === 'function' && is2024Source(o.source)) { if (!show24) return false; }
        else { if (!show14) return false; }
        if (o._requiresSpecies && o._requiresSpecies.toLowerCase() !== (d.charSpecies || '').toLowerCase()) return false;
        if (typeFilter.current && o._typeCode !== typeFilter.current) return false;
        if (query.length > 1 && !o.name.toLowerCase().includes(query)) return false;
        return true;
      }).slice(0, 40);

      filtered.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'wiz-opts-item' + (d.charOptions.includes(opt.name) ? ' selected' : '');
        item.innerHTML = `
          <div class="wiz-opts-name">${opt.name}</div>
          <div class="wiz-opts-meta">${opt._typeName} — ${opt._src}</div>`;
        item.addEventListener('click', () => {
          const idx = d.charOptions.indexOf(opt.name);
          if (idx >= 0) {
            d.charOptions.splice(idx, 1);
            item.classList.remove('selected');
          } else {
            d.charOptions.push(opt.name);
            item.classList.add('selected');
          }
          if (preview) {
            preview.innerHTML = `<div class="wiz-preview-card">
              <h3>${opt.name} <span class="wiz-source">${opt._src}</span></h3>
              <div class="wiz-stat-row"><strong>${opt._typeName}</strong></div>
              <div class="wiz-traits">${(opt.description || '').replace(/\n/g, '<br>')}</div>
            </div>`;
          }
        });
        item.addEventListener('mouseenter', () => {
          if (preview) {
            preview.innerHTML = `<div class="wiz-preview-card">
              <h3>${opt.name} <span class="wiz-source">${opt._src}</span></h3>
              <div class="wiz-stat-row"><strong>${opt._typeName}</strong></div>
              <div class="wiz-traits">${(opt.description || '').replace(/\n/g, '<br>')}</div>
            </div>`;
          }
        });
        list.appendChild(item);
      });
      if (!filtered.length) {
        list.innerHTML = '<div class="wiz-hint">No options found. Try a different filter or search.</div>';
      }
    };

    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Other Character Options</h2>
        <p class="wiz-desc">Add supernatural gifts, dark gifts, character secrets, or other special options from any source book. These are optional — skip if not needed.</p>
        <div class="wiz-opts-filters">
          ${Object.entries(TYPE_LABELS).map(([code, label]) =>
            `<button class="charopt-filter-btn wiz-opts-filter-btn${code === '' ? ' active' : ''}" data-type="${code}">${label}</button>`
          ).join('')}
        </div>
        <input type="text" id="wiz-opts-search" class="wiz-search" placeholder="Search options..." autocomplete="off">
        <div class="wiz-opts-layout">
          <div id="wiz-opts-list" class="wiz-opts-list"></div>
          <div id="wiz-opts-preview" class="wiz-opts-preview"><div class="wiz-hint">Hover or click an option to see details</div></div>
        </div>
        <div class="wiz-opts-chosen" id="wiz-opts-chosen"></div>
      </div>`;

    // Render chosen
    const updateChosen = () => {
      const chosen = document.getElementById('wiz-opts-chosen');
      if (!chosen) return;
      if (!d.charOptions.length) { chosen.innerHTML = ''; return; }
      chosen.innerHTML = `<div class="wiz-opts-chosen-label">Selected:</div>` +
        d.charOptions.map(name => `<span class="wiz-opts-tag">${name} <button class="wiz-opts-tag-del" data-name="${name}">✕</button></span>`).join('');
      chosen.querySelectorAll('.wiz-opts-tag-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const n = btn.dataset.name;
          const i = d.charOptions.indexOf(n);
          if (i >= 0) d.charOptions.splice(i, 1);
          updateChosen();
          renderList();
        });
      });
    };

    // Type filter
    container.querySelectorAll('.wiz-opts-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.wiz-opts-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        typeFilter.current = btn.dataset.type;
        renderList();
      });
    });

    document.getElementById('wiz-opts-search')?.addEventListener('input', renderList);

    // Proxy renderList to also updateChosen
    const origRender = renderList;
    const renderWithChosen = () => { origRender(); updateChosen(); };
    container.querySelectorAll('.wiz-opts-filter-btn').forEach(btn => {
      btn.addEventListener('click', updateChosen);
    });
    document.getElementById('wiz-opts-search')?.addEventListener('input', updateChosen);

    renderList();
    updateChosen();
  },

  // ========== STEP: REVIEW ==========
  _step_review(container) {
    const d = this.draft;
    const mod = (score) => { const m = Math.floor(((score || 10) - 10) / 2); return (m >= 0 ? '+' : '') + m; };
    const ABS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const AB_NAMES = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Review Your Character</h2>
        <div class="wiz-review-name">
          <label>Character Name</label>
          <input type="text" id="wiz-char-name" class="wiz-search" placeholder="Enter character name" value="${d.charName || ''}">
        </div>
        <div class="wiz-review-grid">
          <div class="wiz-review-card">
            <h4>Identity</h4>
            <div>Species: <strong>${d.charSpecies || '—'}</strong></div>
            <div>Background: <strong>${d.charBackground || '—'}</strong></div>
            <div>Class: <strong>${d.charClass || '—'}</strong></div>
            <div>Level: <strong>${d.charLevel || 1}</strong></div>
            ${d._bgLanguages?.length ? `<div>Languages: <strong>${d._bgLanguages.join(', ')}</strong></div>` : ''}
          </div>
          <div class="wiz-review-card">
            <h4>Ability Scores</h4>
            ${ABS.map(ab => `<div>${AB_NAMES[ab]}: <strong>${d[ab] || 10}</strong> (${mod(d[ab])})</div>`).join('')}
          </div>
          <div class="wiz-review-card">
            ${(() => {
              const capFirst = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
              const ETYPE = { weaponMartial: 'Any martial weapon', weaponSimple: 'Any simple weapon', toolArtisan: 'Any artisan tool', setGaming: 'Any gaming set', instrumentMusical: 'Any musical instrument' };
              const cleanIt = it => {
                if (!it) return '';
                if (it.value != null) return '';
                let name, qty;
                if (typeof it === 'string') { name = capFirst(stripTags(it.replace(/\|[^,)|]+/g, '').trim())); qty = 1; }
                else if (it.equipmentType) { name = ETYPE[it.equipmentType] || capFirst(it.equipmentType); qty = it.quantity || 1; }
                else if (it.special) { name = capFirst(it.special); qty = it.quantity || 1; }
                else if (it.displayName || it.item) {
                  const rawName = it.displayName
                    ? it.displayName.replace(/\s+\d+(\.\d+)?\s*(cp|sp|ep|gp|pp)$/i, '').trim()
                    : stripTags(it.item.replace(/\|[^,)|]+/g, '').trim());
                  name = capFirst(rawName); qty = it.quantity || 1;
                } else return '';
                return qty > 1 ? `${name} ×${qty}` : name;
              };
              // Pack expansion for review
              const expandPackReview = (it) => {
                const n = cleanIt(it);
                if (!n) return [];
                if (n.toLowerCase().includes('pack')) {
                  const allItems = DndData.allItems || DndData.items || [];
                  const pack = allItems.find(i => i.name.toLowerCase() === n.toLowerCase() && i.packContents?.length);
                  if (pack) return pack.packContents.map(cleanIt).filter(Boolean);
                }
                return [n];
              };
              // Background items
              let bgSection = '';
              if (d._bgInfo?.startingEquipment?.length && d._bgEquipChoice) {
                const raw = (d._bgInfo.startingEquipment[0][d._bgEquipChoice] || []).flatMap(expandPackReview).filter(Boolean);
                if (raw.length) bgSection = `<div style="font-size:0.78rem;color:var(--ink-faint);margin-top:4px">Background:</div>${raw.map(n => `<div>• ${n}</div>`).join('')}`;
              }
              // Class equipment choices
              let classSection = '';
              if (d._equipChoices && Object.keys(d._equipChoices).length) {
                const classItems = Object.values(d._equipChoices).flatMap(arr => (arr || []).flatMap(expandPackReview).filter(Boolean));
                if (classItems.length) classSection = `<div style="font-size:0.78rem;color:var(--ink-faint);margin-top:4px">Class equipment:</div>${classItems.map(n => `<div>• ${n}</div>`).join('')}`;
              }
              // Purchased items
              const purchased = (d.inventory || []).map(i => `<div>• ${i.name}</div>`).join('');
              const purchasedSection = purchased ? `<div style="font-size:0.78rem;color:var(--ink-faint);margin-top:4px">Purchased:</div>${purchased}` : '';
              const hasAny = bgSection || classSection || purchased;
              return `<h4>Equipment</h4>${hasAny ? bgSection + classSection + purchasedSection : '<div>None</div>'}${d.gp ? `<div style="margin-top:4px">Gold: <strong>${d.gp} gp</strong></div>` : ''}`;
            })()}
          </div>
          <div class="wiz-review-card">
            ${(() => {
              const chosenSpells = (d.charSpells || []).map(s => `<div>• ${s.name}</div>`).join('');
              let racialHtml = '';
              let racialAbility = null;
              const _revSubrace = d.charSubrace ? d._speciesInfo?.subraces?.find(sr => sr.name === d.charSubrace) : null;
              const _revSpells = _revSubrace?.additionalSpells?.length
                ? _revSubrace.additionalSpells : (d._speciesInfo?.additionalSpells || []);
              if (_revSpells.length) {
                const rs = parseRacialSpells(_revSpells, d.charSubrace || '');
                racialAbility = d._racialSpellAbility || rs.ability;
                const cap = n => n ? n.replace(/\b\w/g, c => c.toUpperCase()) : n;
                const all = [
                  ...rs.cantrips.map(n => `<div>• ${cap(n)} <span style="color:var(--gold);font-size:0.75rem">(racial cantrip)</span></div>`),
                  ...rs.level3.map(n => `<div>• ${cap(n)} <span style="color:var(--gold);font-size:0.75rem">(racial, at level 3)</span></div>`),
                  ...rs.level5.map(n => `<div>• ${cap(n)} <span style="color:var(--gold);font-size:0.75rem">(racial, at level 5)</span></div>`),
                ];
                if (all.length) racialHtml = all.join('');
              }
              const abilityNames = { int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma', str: 'Strength', dex: 'Dexterity', con: 'Constitution' };
              const racialAbHtml = (racialHtml && racialAbility)
                ? `<div style="font-size:0.8rem;color:var(--ink-faint);margin-bottom:4px">Racial spellcasting ability: <strong>${abilityNames[racialAbility] || racialAbility.toUpperCase()}</strong></div>` : '';
              return `<h4>Spells</h4>${racialAbHtml}${racialHtml}${chosenSpells || (!racialHtml ? '<div>None</div>' : '')}`;
            })()}
          </div>
          <div class="wiz-review-card">
            <h4>Other Options (${(d.charOptions || []).length})</h4>
            ${(d.charOptions || []).map(o => `<div>• ${o}</div>`).join('') || '<div>None</div>'}
          </div>
        </div>
      </div>`;

    document.getElementById('wiz-char-name')?.addEventListener('input', function () { d.charName = this.value; });
  },
};
