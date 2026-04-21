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
// Subclass features that grant skill proficiencies — used to warn during character creation
// so the player doesn't waste a class skill pick on a skill they'll get later.
const _SUBCLASS_SKILL_WARNINGS = {
  'Fighter': [
    { skill: 'athletics', subclass: 'Champion', feature: 'Remarkable Athlete', level: 3 },
  ],
};

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

// Highlight D&D keywords in spell tooltip HTML
function _highlightSpellKeywords(html) {
  // Skip content inside HTML tags to avoid breaking attributes
  const _hlOutsideTags = (text, fn) => text.replace(/([^<]*)(<[^>]*>)?/g, (_, outside, tag) => fn(outside || '') + (tag || ''));

  // Damage types
  const dmgTypes = 'acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder';
  html = _hlOutsideTags(html, t => t.replace(new RegExp(`\\b(${dmgTypes})( damage)\\b`, 'gi'), '<span class="wiz-kw-dmg">$1$2</span>'));
  html = _hlOutsideTags(html, t => t.replace(new RegExp(`\\b(${dmgTypes})\\b(?!<\\/span>| damage)`, 'gi'), '<span class="wiz-kw-dmg">$1</span>'));
  // Conditions
  const conditions = 'blinded|charmed|deafened|frightened|grappled|incapacitated|invisible|paralyzed|petrified|poisoned|prone|restrained|stunned|unconscious|exhaustion';
  html = _hlOutsideTags(html, t => t.replace(new RegExp(`\\b(${conditions})( condition)?\\b`, 'gi'), '<span class="wiz-kw-cond">$1$2</span>'));
  // Dice rolls (e.g. 1d6, 2d8, 8d6, 1d20)
  html = _hlOutsideTags(html, t => t.replace(/\b(\d+d\d+(?:\s*\+\s*\d+)?)\b/g, '<span class="wiz-kw-dice">$1</span>'));
  // Saving throws (e.g. "Dexterity saving throw", "DC 15")
  html = _hlOutsideTags(html, t => t.replace(/\b(DC\s*\d+)\b/g, '<span class="wiz-kw-dc">$1</span>'));
  html = _hlOutsideTags(html, t => t.replace(/\b((?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+saving\s+throw)s?\b/gi, '<span class="wiz-kw-save">$1</span>'));
  // Spell attack / attack roll
  html = _hlOutsideTags(html, t => t.replace(/\b((?:ranged|melee)\s+(?:spell\s+)?attack(?:\s+roll)?)\b/gi, '<span class="wiz-kw-atk">$1</span>'));
  // Action economy
  html = _hlOutsideTags(html, t => t.replace(/\b(Bonus Action|Reaction|Action)\b/g, '<span class="wiz-kw-action">$1</span>'));
  // Healing / hit points
  html = _hlOutsideTags(html, t => t.replace(/\b(Hit Points?|Temporary Hit Points?|regains?\s+(?:hit points|HP))\b/gi, '<span class="wiz-kw-heal">$1</span>'));
  // Rest types
  html = _hlOutsideTags(html, t => t.replace(/\b(Short Rest|Long Rest)\b/g, '<span class="wiz-kw-rest">$1</span>'));
  // Advantage / Disadvantage
  html = _hlOutsideTags(html, t => t.replace(/\b(Advantage|Disadvantage)\b/g, '<span class="wiz-kw-advdis">$1</span>'));
  // Speed / movement
  html = _hlOutsideTags(html, t => t.replace(/\b(\d+[\s-]?(?:foot|feet|ft\.?)(?:\s+(?:Emanation|radius|cone|line|sphere|cube|square))?)\b/gi, '<span class="wiz-kw-range">$1</span>'));
  // Proficiency bonus
  html = _hlOutsideTags(html, t => t.replace(/\b(proficiency bonus)\b/gi, '<span class="wiz-kw-prof">$1</span>'));
  return html;
}

// Highlight Psionic-specific keywords — call before _highlightSpellKeywords
function _highlightPsionicKeywords(html) {
  const _hl = (text, fn) => text.replace(/([^<]*)(<[^>]*>)?/g, (_, outside, tag) => fn(outside || '') + (tag || ''));
  html = _hl(html, t => t.replace(/\b(Psionic Energy Di(?:e|ce)|Psionic Energy)\b/g, '<span class="wiz-kw-dc">$1</span>'));
  html = _hl(html, t => t.replace(/\b(D20 Test)\b/g, '<span class="wiz-kw-save">$1</span>'));
  html = _hl(html, t => t.replace(/\b(Immunity|Resistance)\b/g, '<span class="wiz-kw-heal">$1</span>'));
  html = _hl(html, t => t.replace(/\b(Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation)\b/g, '<span class="wiz-kw-prof">$1</span>'));
  html = _hl(html, t => t.replace(/\b(Intelligence|Wisdom|Charisma|Strength|Dexterity|Constitution)( modifier)?\b/g, '<span class="wiz-kw-atk">$1$2</span>'));
  return html;
}

function _positionSpellTooltip(tip, e) {
  const pad = 12;
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = e.clientX + pad, y = e.clientY + pad;
  const rect = tip.getBoundingClientRect();
  if (x + rect.width > vw - pad) x = e.clientX - rect.width - pad;
  if (y + rect.height > vh - pad) y = e.clientY - rect.height - pad;
  if (x < pad) x = pad;
  if (y < pad) y = pad;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}

window.Wizard = {
  steps: ['species', 'background', 'class', 'abilities', 'equipment', 'spells', 'options', 'review'],
  stepLabels: ['Species', 'Background', 'Class', 'Abilities', 'Equipment', 'Spells', 'Options', 'Review'],
  currentStep: 0,
  draft: {},

  start() {
    this.draft = { charLevel: 1, feats: [], charSpells: [], inventory: [], attacks: [], charOptions: [] };
    this.currentStep = 0;
    this.maxVisitedStep = 0;
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
      if (this.currentStep > (this.maxVisitedStep || 0)) this.maxVisitedStep = this.currentStep;
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
        ? parseRacialSpells(addSpells, d.charSubrace || '', null, d._racialCantripChoice) : null;
      if (racialSpells?.abilityChoices?.length && !d._racialSpellAbility) return 'Please choose a spellcasting ability for your racial spells.';
      if (racialSpells?.cantripChoices?.length && d._racialCantripChoice == null) return 'Please choose a racial cantrip.';
      if ((d._speciesInfo?.sizes?.length || 0) > 1 && !d._speciesSizeChoice) return 'Please choose a size for your species.';
      const _needSkillChoices = (d._speciesInfo?.skillProficiencies || []).find(sp => sp.choose);
      if (_needSkillChoices) {
        const _count = _needSkillChoices.choose.count || 1;
        if ((d._speciesSkillChoices || []).length < _count) return `Please choose ${_count} skill proficiency${_count > 1 ? 'ies' : 'y'} for your species.`;
      }
    }
    if (step === 'background' && !d.charBackground) return 'Please select a background before continuing.';
    if (step === 'background' && d._bgInfo?.name === 'Custom Background' && !d._customBgEquipSource) return 'Please select a background to use as your equipment source.';
    if (step === 'background' && d._bgInfo?.startingEquipment?.length && !d._bgEquipChoice) return 'Please choose a starting equipment option (A or B) before continuing.';
    if (step === 'background' && d._bgInfo?.toolProf && Object.keys(d._bgInfo.toolProf).some(k => /anyMusicalInstrument/i.test(k)) && !d._bgInstrumentChoice) return 'Please choose a musical instrument proficiency for your background.';
    if (step === 'background' && d._bgInfo?.toolProf && Object.keys(d._bgInfo.toolProf).some(k => /anyGamingSet/i.test(k) || k.toLowerCase() === 'gaming set') && !d._bgGamingSetChoice) return 'Please choose a gaming set proficiency for your background.';
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
      if (d.charClass === 'Cleric' && !d._divineOrder) {
        return 'Please choose a Divine Order for your Cleric.';
      }
      if (info?.weaponMasteryCount > 0) {
        const chosen = (d._weaponMasteryChoices || []).length;
        if (chosen < info.weaponMasteryCount) return `Please choose ${info.weaponMasteryCount} weapons for Weapon Mastery (${chosen}/${info.weaponMasteryCount} selected).`;
      }
      if (info?.toolProfChoices?.length) {
        const totalNeeded = info.toolProfChoices.reduce((s, g) => s + g.count, 0);
        const chosen = (d._classToolChoices || []).filter(Boolean).length;
        if (chosen < totalNeeded) {
          const hasUnpickedCategory = info.toolProfChoices.some(g => g.type === 'artisanOrInstrument')
            && (d._classToolCategories || []).filter(Boolean).length < totalNeeded;
          if (hasUnpickedCategory) return `Please choose between Artisan's Tools or Musical Instrument.`;
          return `Please choose ${totalNeeded} tool proficienc${totalNeeded === 1 ? 'y' : 'ies'} (${chosen}/${totalNeeded} selected).`;
        }
      }
      if (d.charClass === 'Psion' && parseInt(d.charLevel || 1) >= 2) {
        const level = parseInt(d.charLevel || 1);
        const count = level >= 17 ? 6 : level >= 13 ? 5 : level >= 10 ? 4 : level >= 5 ? 3 : 2;
        const chosen = (d._psionicDisciplines || []).length;
        if (chosen < count) return `Please choose ${count} Psionic Disciplines (${chosen}/${count} selected).`;
      }
      if (d.charClass === 'Cleric') {
        if (!d._divineOrder) return 'Please choose a Divine Order for your Cleric.';
        if (d._divineOrder === 'Thaumaturge' && !d._divineOrderCantrip) return 'Please choose a cantrip for your Thaumaturge Divine Order.';
      }
    }
    if (step === 'equipment') {
      const classInfo = d.charClass ? getClassInfo(d.charClass) : null;
      const equip = classInfo?.startingEquipment;
      if (equip?.defaultData?.length) {
        for (let i = 0; i < equip.defaultData.length; i++) {
          const row = equip.defaultData[i];
          const keys = Object.keys(row).filter(k => k !== '_');
          if (row._ || !keys.length) continue;
          if (!d[`_equipChoice_${i}`]) return 'Please choose a starting equipment option (A or B) before continuing.';
        }
      }
      // Validate instrument choice if the selected equipment option includes one
      if (equip?.defaultData?.length) {
        for (let i = 0; i < equip.defaultData.length; i++) {
          const row = equip.defaultData[i];
          if (row._) continue;
          const chosenKey = d[`_equipChoice_${i}`];
          if (chosenKey && Array.isArray(row[chosenKey]) && row[chosenKey].some(it => it?.equipmentType === 'instrumentMusical') && !d._equipInstrumentChoice) {
            return 'Please choose a musical instrument for your starting equipment.';
          }
        }
      }
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
      let _maxC = _ci?.cantripCount ?? null;
      if (d._divineOrder === 'Thaumaturge' && _maxC !== null) _maxC += 1;
      // Spellbook casters: use spellbook count (6); otherwise known or prepared count
      let _maxP;
      if (_ci?.spellbookSpellsAtL1 != null) {
        _maxP = _ci.spellbookSpellsAtL1;
      } else {
        _maxP = _ci?.spellsKnownAtL1 ?? null;
        if (_maxP === null && _ci?.preparedSpellsProgression?.length) {
          _maxP = _ci.preparedSpellsProgression[0];
        }
        if (_maxP === null && _ci?.preparedSpellsFormula) {
          const _spAb = _ci.spellcastingAbility || 'int';
          _maxP = Math.max(1, 1 + Math.floor(((d[_spAb] || 10) - 10) / 2));
        }
      }
      if (_maxC !== null && _cantripsSel < _maxC) return `Choose ${_maxC} cantrip${_maxC !== 1 ? 's' : ''} (${_cantripsSel}/${_maxC} selected).`;
      const _spellLabel = _ci?.spellbookSpellsAtL1 != null ? 'spellbook spell' : '1st-level spell';
      if (_maxP !== null && _prepSel < _maxP) return `Choose ${_maxP} ${_spellLabel}${_maxP !== 1 ? 's' : ''} (${_prepSel}/${_maxP} selected).`;
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
    d.charName = d.charName?.trim() || 'New Character';

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

    // Faceless: apply fake persona background traits (appended to any true-self traits chosen above)
    if (d._bgInfo?.name === 'Faceless' && d._facelessPersonaBg) {
      d.facelessPersonaBg = d._facelessPersonaBg;
      const pc = d._facelessPersonaCharacteristics;
      if (pc?._bg === d._facelessPersonaBg) {
        const personaInfo = getBackgroundInfo(d._facelessPersonaBg);
        if (personaInfo?.suggestedCharacteristics) {
          const psc = personaInfo.suggestedCharacteristics;
          const pick = (items, indices) => indices.map(i => items[i]).filter(Boolean).join('\n');
          const appendOrSet = (field, text) => { if (!text) return; d[field] = d[field] ? d[field] + '\n' + text : text; };
          if (pc.traits.length) appendOrSet('personalityTraits', pick(psc.traits, pc.traits));
          if (pc.ideals.length) appendOrSet('ideals', pick(psc.ideals, pc.ideals));
          if (pc.bonds.length)  appendOrSet('bonds',  pick(psc.bonds,  pc.bonds));
          if (pc.flaws.length)  appendOrSet('flaws',  pick(psc.flaws,  pc.flaws));
        }
      }
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
        // Resolve tool/instrument placeholders to the specific chosen tool
        const toolChoices = d._classToolChoices?.filter(Boolean) || [];
        if ((it.equipmentType === 'toolArtisan' || it.equipmentType === 'instrumentMusical') && toolChoices.length) {
          baseName = toolChoices[0];
        } else {
          baseName = EQUIP_TYPE_NAMES[it.equipmentType] || capFirst(it.equipmentType);
        }
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

    // Liquid vessel names — must match Sheet._LIQUID_CONTAINERS
    const _LIQUID_NAMES = new Set(['waterskin','flask','vial','jug','pitcher','pot','tankard','bottle']);
    const _LIQUID_PINTS = { waterskin:4, flask:1, vial:1, jug:1, pitcher:1, pot:1, tankard:1, bottle:1 };
    const _isLiquid = n => _LIQUID_NAMES.has((n || '').toLowerCase().trim());

    const toInvEntry = ({ name, qty }) => {
      const allItems = DndData.allItems || [];
      const found = allItems.find(i => i.name.toLowerCase() === name.toLowerCase())
               || allItems.find(i => i.name.toLowerCase() === _singularize(name).toLowerCase());
      // Volume-only containerCapacity (liquid vessels) should NOT become folder containers — matches sheet.js logic
      const hasVolumeOnlyCapacity = found?.containerCapacity
        && !found.containerCapacity.weight
        && !found.containerCapacity.item
        && found.containerCapacity.volume;
      const isLiquid = _isLiquid(name);
      const isContainer = !isLiquid && !!(
        (!hasVolumeOnlyCapacity && (found?.containerCapacity || found?.capacity)) ||
        _CONTAINER_NAMES.test(name || '')
      );
      // When splitting plural-named containers into individual entries, use the singular form
      const entryName = (isContainer && (qty || 1) > 1) ? _singularize(name) : name;
      const fullWeight = found?.weight || 0;
      const maxPints = isLiquid ? (_LIQUID_PINTS[(name || '').toLowerCase().trim()] || 0) : 0;
      const PINT_LBS = 1;
      const emptyWeight = isLiquid ? Math.max(0, fullWeight - maxPints * PINT_LBS) : 0;
      const makeOne = () => ({
        name: entryName,
        qty: isContainer ? 1 : (qty || 1),
        type: found?._type || '',
        damage: found?._dmgStr || '',
        mastery: (found?.mastery || []).map(m => m.split('|')[0]).join(', '),
        properties: found?._propStr || '',
        weight: fullWeight,
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
        ...(isLiquid && {
          pints: maxPints,
          emptyWeight,
          liquidKey: Date.now().toString(36) + Math.random().toString(36).slice(2),
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
        if (item.isContainer || item.liquidKey) {
          merged.push({ ...item });
        } else {
          const existing = merged.find(i => i.name.toLowerCase() === item.name.toLowerCase() && !i.isContainer && !i.liquidKey);
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
      const racialSpells = parseRacialSpells(_addSpells, d.charSubrace || '', null, d._racialCantripChoice);
      const racialEntries = [];
      const capName = n => n ? n.replace(/\b\w/g, c => c.toUpperCase()) : n;
      racialSpells.cantrips.forEach(name => { if (name) racialEntries.push({ name: capName(name), level: 0, prepared: true, racial: true }); });
      // At level 1 only cantrips; level 3+ spells are gained later via level-up
      d.charSpells = [...(d.charSpells || []), ...racialEntries];
      if (d._speciesInfo.flySpeed) d.flySpeed = d._speciesInfo.flySpeed;
      // Store chosen spellcasting ability for racial spells
      if (d._racialSpellAbility) d.racialSpellAbility = d._racialSpellAbility;
      else if (racialSpells.ability) d.racialSpellAbility = racialSpells.ability;
      // Store chosen cantrip index (e.g. Astral Elf)
      if (d._racialCantripChoice != null) d.racialCantripChoice = d._racialCantripChoice;
    }

    // Apply species size choice
    if (d._speciesSizeChoice) d.charSize = d._speciesSizeChoice;

    // Apply species skill proficiencies (fixed ones like Astral Elf → Perception, and chosen ones like Changeling)
    const _specSkills = d._speciesInfo?.skillProficiencies || [];
    _specSkills.forEach(sp => {
      Object.keys(sp).forEach(sk => {
        if (sp[sk] === true) {
          const key = _normalizeSkillKey(sk);
          if (key) d['skillProf_' + key] = true;
        }
      });
    });
    // Apply chosen skill proficiencies (e.g. Changeling Instincts)
    (d._speciesSkillChoices || []).forEach(sk => {
      const key = _normalizeSkillKey(sk);
      if (key) d['skillProf_' + key] = true;
    });

    // Add attacks granted by selected character options (e.g. Gift of the Aetherborn → Drain Life)
    (d.charOptions || []).forEach(optName => {
      const optInfo = DndData.charOptions.find(o => o.name === optName);
      if (optInfo?._grantsAttack) {
        const atk = optInfo._grantsAttack;
        if (!d.attacks) d.attacks = [];
        if (!d.attacks.some(a => a.name === atk.name)) d.attacks.push({ ...atk });
      }
    });

    // Apply tool proficiency choices from class step
    if (d._classToolChoices?.length) {
      const existing = new Set((d.toolProficiencies || []).map(t => t.toLowerCase()));
      const toAdd = d._classToolChoices.filter(Boolean).filter(t => !existing.has(t.toLowerCase()));
      if (toAdd.length) d.toolProficiencies = [...(d.toolProficiencies || []), ...toAdd];
      // Add the chosen tool/instrument to inventory with full item data if available
      d._classToolChoices.filter(Boolean).forEach(toolName => {
        const found = (DndData.allItems || []).find(i => i.name.toLowerCase() === toolName.toLowerCase());
        const invEntry = found ? toInvEntry({ name: found.name, qty: 1 }) : {
          name: toolName, qty: 1, type: '', damage: '', mastery: '', properties: '',
          weight: 0, value: '', _valueCp: 0, ac: 0, rarity: 'none', category: 'gear',
          isContainer: false, containerOpen: false, containerId: null,
        };
        d.inventory = [...(d.inventory || []), invEntry];
      });
    }
    // Apply fixed class tool proficiencies (e.g. Rogue's Thieves' Tools)
    {
      const classInfo = d.charClass ? getClassInfo(d.charClass) : null;
      const fixedProfs = classInfo?.fixedToolProf || [];
      if (fixedProfs.length) {
        const existing = new Set((d.toolProficiencies || []).map(t => t.toLowerCase()));
        fixedProfs.forEach(toolName => {
          if (!existing.has(toolName.toLowerCase())) {
            d.toolProficiencies = [...(d.toolProficiencies || []), toolName];
            existing.add(toolName.toLowerCase());
          }
        });
        // Add fixed tool items to inventory if they're physical items in equipment
        // (they often appear in the class starting equipment by name, so no need to double-add here)
      }
    }

    // Apply fixed tool proficiencies from background and mark background as already applied
    // so the sheet's applyBackgroundSelection doesn't overwrite toolProficiencies on first load
    if (d._bgInfo) {
      const existingTools = new Set((d.toolProficiencies || []).map(t => t.toLowerCase()));
      if (d._bgInfo.toolProf) {
        for (const [key, val] of Object.entries(d._bgInfo.toolProf)) {
          // Handle instrument choice (anyMusicalInstrument)
          if (/anyMusicalInstrument/i.test(key) && d._bgInstrumentChoice) {
            if (!existingTools.has(d._bgInstrumentChoice.toLowerCase())) {
              d.toolProficiencies = [...(d.toolProficiencies || []), d._bgInstrumentChoice];
              existingTools.add(d._bgInstrumentChoice.toLowerCase());
            }
          // Handle gaming set choice (anyGamingSet or "gaming set")
          } else if ((/anyGamingSet/i.test(key) || key.toLowerCase() === 'gaming set') && d._bgGamingSetChoice) {
            if (!existingTools.has(d._bgGamingSetChoice.toLowerCase())) {
              d.toolProficiencies = [...(d.toolProficiencies || []), d._bgGamingSetChoice];
              existingTools.add(d._bgGamingSetChoice.toLowerCase());
            }
          // Handle fixed tool proficiencies (skip generic "gaming set" — handled above)
          } else if (val === true && key.toLowerCase() !== 'gaming set') {
            const name = key.split('|')[0];
            if (!existingTools.has(name.toLowerCase())) {
              d.toolProficiencies = [...(d.toolProficiencies || []), name];
              existingTools.add(name.toLowerCase());
            }
          }
        }
      }
      // Mark the background as applied so the sheet won't overwrite toolProficiencies on init
      d._appliedBg = d.charBackground;
    }

    // Apply expertise choices from class step
    (d._expertiseChoices || []).forEach(sk => { d['skillExpert_' + sk] = true; });

    // Apply weapon mastery choices
    if (d._weaponMasteryChoices?.length) {
      d.weaponMastery = [...d._weaponMasteryChoices];
    }

    // Apply psionic discipline choices
    if (d._psionicDisciplines?.length) {
      d.charPsionicDisciplines = [...d._psionicDisciplines];
    }

    // Apply background origin feat
    if (d._bgInfo?.feat) {
      const bgFeatName = d._bgInfo.featName;
      if (bgFeatName) {
        if (!d.feats) d.feats = [];
        if (!d.feats.some(f => (typeof f === 'string' ? f : f.name).toLowerCase() === bgFeatName.toLowerCase())) {
          // If spell choices were made, store as object
          if (d._bgFeatChosenSpells?.length || d._bgFeatSpellClass) {
            const featObj = { name: bgFeatName };
            if (d._bgFeatChosenSpells?.length) featObj.chosenSpells = [...d._bgFeatChosenSpells];
            if (d._bgFeatSpellClass) featObj.spellClass = d._bgFeatSpellClass;
            d.feats.push(featObj);
          } else {
            d.feats.push(bgFeatName);
          }
        }
      }
    }

    // Apply Divine Order (Cleric)
    if (d.charClass === 'Cleric' && d._divineOrder) {
      d.charDivineOrder = d._divineOrder;
      if (d._divineOrder === 'Thaumaturge' && d._divineOrderCantrip) {
        if (!d.charSpells) d.charSpells = [];
        if (!d.charSpells.some(s => s.name === d._divineOrderCantrip)) {
          d.charSpells.push({ name: d._divineOrderCantrip, level: 0, prepared: true, divineOrderSource: true });
        }
      }
    }

    // Apply fighting style as a feat
    if (d._fightingStyle) {
      if (!d.feats) d.feats = [];
      if (!d.feats.some(f => (typeof f === 'string' ? f : f.name).toLowerCase() === d._fightingStyle.toLowerCase())) {
        d.feats.push(d._fightingStyle);
      }
    }

    // Store Divine Order choice (Cleric level 1)
    // Protector's bonus profs (Martial weapons + Heavy armor) are applied by sheet.js on class init.
    // Thaumaturge's extra cantrip is already in d.charSpells from the spell selection step.
    if (d._divineOrder) {
      d.divineOrder = d._divineOrder;
    }

    // Auto-populate class, species, and feat resources
    if (typeof ClassResources !== 'undefined') {
      ClassResources.addStartingResources(d);
    }

    // Auto-set spell slots based on class at level 1
    if (d.charClass && typeof getSpellSlots === 'function') {
      const slots = getSpellSlots(d.charClass, 1);
      for (let i = 0; i < 9; i++) {
        d[`slotMax_${i + 1}`] = slots[i];
      }
    }

    // Set spellcasting ability from class
    if (classInfo?.spellcastingAbility) {
      d.spellcastingAbility = classInfo.spellcastingAbility;
    }

    // Deduct gold spent on purchased equipment
    const spentCp = (d.inventory || []).reduce((sum, it) => sum + (it._valueCp || 0) * (it.qty || 1), 0);
    d.gp = Math.max(0, (d.gp || 0) - spentCp / 100);

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
      const maxVisited = this.maxVisitedStep || 0;
      const isVisited = i <= maxVisited && i > this.currentStep;
      if (isVisited) step.className += ' visited';
      step.innerHTML = `<div class="wiz-step-dot">${i < this.currentStep ? '✓' : i + 1}</div><div class="wiz-step-label">${this.stepLabels[i]}</div>`;
      if (i !== this.currentStep && i <= maxVisited && !isOptionsLocked) {
        step.style.cursor = 'pointer';
        step.addEventListener('click', () => { this.currentStep = i; this.renderStep(); });
      }
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
    nav.querySelector('#wiz-next')?.addEventListener('click', () => {
      if (isLast) {
        if (!this.draft.charName?.trim()) {
          this._showValidationError('Please enter a character name before finishing.');
          const nameInput = document.getElementById('wiz-char-name');
          if (nameInput) { nameInput.focus(); nameInput.style.outline = '2px solid var(--danger, #c00)'; }
          return;
        }
        this.finish();
      } else {
        this.next();
      }
    });
  },

  // ========== STEP: SPECIES ==========
  _step_species(container) {
    const d = this.draft;
    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Choose Your Species</h2>
        <p class="wiz-desc">Your species determines your physical traits, innate abilities, and how you interact with the world.</p>
        <input type="text" id="wiz-species-search" class="wiz-search" placeholder="Search species..." value="${d.charSpecies || ''}" autocomplete="off">
        <div id="wiz-species-preview" class="wiz-preview"></div>
      </div>
      <div id="wiz-optional-tooltip" style="display:none;position:fixed;z-index:9999;width:500px;max-width:min(500px,90vw);background:var(--parchment,#FDF1DC);border:1px solid var(--border,#C4A87A);border-radius:8px;padding:12px 16px;font-size:0.82rem;color:var(--ink-light,#3D2B18);line-height:1.55;box-shadow:0 6px 20px rgba(0,0,0,0.4);pointer-events:none"></div>`;
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
        ? parseRacialSpells(additionalSpells, subraceName, subraceInfo?.entries, d._racialCantripChoice) : { cantrips: [], level3: [], level5: [], ability: null, abilityChoices: null, cantripChoices: null };
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
      // Cantrip choice picker (e.g. Astral Elf: choose one of Dancing Lights / Light / Sacred Flame)
      const cantripChoiceHtml = racialSpells.cantripChoices ? `
        <div style="margin-top:6px">
          <strong>Choose a Cantrip:</strong>
          <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
            ${racialSpells.cantripChoices.map((name, i) => `
              <label class="lu-asi-choice${d._racialCantripChoice === i ? ' selected' : ''}" style="flex:none;padding:4px 12px;font-size:0.82rem">
                <input type="radio" name="wiz-racial-cantrip" value="${i}" ${d._racialCantripChoice === i ? 'checked' : ''}>
                ${capSpell(name)}
              </label>`).join('')}
          </div>
        </div>` : '';
      const spellHtml = ((hasSpells || racialSpells.cantripChoices || racialSpells.abilityChoices) && lineageChosen) ? `
        <div class="wiz-stat-row" style="margin-top:6px"><strong>Racial Spells:</strong>
          ${cantripChoiceHtml}
          ${!racialSpells.cantripChoices && racialSpells.cantrips.length ? `<div style="font-size:0.82rem">Cantrip: ${racialSpells.cantrips.map(capSpell).join(', ')}</div>` : ''}
          ${racialSpells.level3.length ? `<div style="font-size:0.82rem">Level 3: ${racialSpells.level3.map(capSpell).join(', ')}</div>` : ''}
          ${racialSpells.level5.length ? `<div style="font-size:0.82rem">Level 5: ${racialSpells.level5.map(capSpell).join(', ')}</div>` : ''}
        </div>
        ${abilityPickerHtml}` : '';
      // Size picker (when species can be Small or Medium)
      const hasSizeChoice = (info.sizes?.length || 0) > 1;
      const sizePickerHtml = hasSizeChoice ? `
        <div class="wiz-stat-row" style="margin-top:4px">
          <strong>Size:</strong> <em>Choose one:</em>
          <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
            ${info.sizes.map(s => `
              <label class="lu-asi-choice${d._speciesSizeChoice === s ? ' selected' : ''}" style="flex:none;padding:4px 12px;font-size:0.82rem">
                <input type="radio" name="wiz-species-size" value="${s}" ${d._speciesSizeChoice === s ? 'checked' : ''}> ${s}
              </label>`).join('')}
          </div>
        </div>` : '';

      // Skill proficiency picker (e.g. Changeling Instincts — choose 2 from a list)
      const _skillChooseEntry = (info.skillProficiencies || []).find(sp => sp.choose);
      const SKILL_NAMES = { acrobatics:'Acrobatics', animalHandling:'Animal Handling', arcana:'Arcana', athletics:'Athletics', deception:'Deception', history:'History', insight:'Insight', intimidation:'Intimidation', investigation:'Investigation', medicine:'Medicine', nature:'Nature', perception:'Perception', performance:'Performance', persuasion:'Persuasion', religion:'Religion', sleightOfHand:'Sleight of Hand', stealth:'Stealth', survival:'Survival' };
      const skillPickerHtml = _skillChooseEntry ? (() => {
        const count = _skillChooseEntry.choose.count || 1;
        const from = _skillChooseEntry.choose.from || [];
        const chosen = d._speciesSkillChoices || [];
        return `
        <div class="wiz-stat-row" style="margin-top:6px">
          <strong>Skill Proficiencies:</strong> Choose ${count}
          <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
            ${from.map(sk => {
              const label = SKILL_NAMES[sk] || sk.charAt(0).toUpperCase() + sk.slice(1);
              const sel = chosen.includes(sk);
              return `<label class="lu-asi-choice${sel ? ' selected' : ''}" style="flex:none;padding:4px 12px;font-size:0.82rem">
                <input type="checkbox" name="wiz-species-skill" value="${sk}" ${sel ? 'checked' : ''}> ${label}
              </label>`;
            }).join('')}
          </div>
          <div style="font-size:0.78rem;color:var(--ink-faint);margin-top:4px">${chosen.length}/${count} chosen</div>
        </div>`;
      })() : '';

      preview.innerHTML = `
        <div class="wiz-preview-card">
          <h3>${info.name} <span class="wiz-source">${info.src}</span></h3>
          <div class="wiz-stat-row"><strong>Size:</strong> ${info.size}</div>
          <div class="wiz-stat-row"><strong>Speed:</strong> ${info.speed} ft.${flySpeed ? ` | <strong>Fly:</strong> ${flySpeed} ft.` : ''}${swimSpeed ? ` | <strong>Swim:</strong> ${swimSpeed} ft.` : ''}</div>
          ${darkvision ? `<div class="wiz-stat-row"><strong>Darkvision:</strong> ${darkvision} ft.</div>` : ''}
          ${resist.length ? `<div class="wiz-stat-row"><strong>Resistances:</strong> ${resist.map(r => typeof r === 'string' ? r.charAt(0).toUpperCase() + r.slice(1) : (r?.choose?.from ? r.choose.from.map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(', ') + ' (choose one)' : '')).filter(Boolean).join(', ')}</div>` : ''}
          ${sizePickerHtml}
          ${skillPickerHtml}
          ${spellHtml}
          <div class="wiz-traits">${info.traitsHtml || ''}</div>
        </div>`;
      // Bind racial spellcasting ability picker
      preview.querySelectorAll('input[name="wiz-racial-ab"]').forEach(radio => {
        radio.addEventListener('change', () => {
          d._racialSpellAbility = radio.value;
          preview.querySelectorAll('input[name="wiz-racial-ab"]').forEach(r => r.closest('label.lu-asi-choice').classList.remove('selected'));
          radio.closest('label.lu-asi-choice').classList.add('selected');
        });
      });
      // Bind racial cantrip choice picker (e.g. Astral Elf)
      preview.querySelectorAll('input[name="wiz-racial-cantrip"]').forEach(radio => {
        radio.addEventListener('change', () => {
          d._racialCantripChoice = parseInt(radio.value);
          preview.querySelectorAll('input[name="wiz-racial-cantrip"]').forEach(r => r.closest('label.lu-asi-choice').classList.remove('selected'));
          radio.closest('label.lu-asi-choice').classList.add('selected');
        });
      });
      // Bind size choice picker
      preview.querySelectorAll('input[name="wiz-species-size"]').forEach(radio => {
        radio.addEventListener('change', () => {
          d._speciesSizeChoice = radio.value;
          preview.querySelectorAll('input[name="wiz-species-size"]').forEach(r => r.closest('label.lu-asi-choice').classList.remove('selected'));
          radio.closest('label.lu-asi-choice').classList.add('selected');
        });
      });
      // Bind species skill proficiency pickers
      if (_skillChooseEntry) {
        const count = _skillChooseEntry.choose.count || 1;
        preview.querySelectorAll('input[name="wiz-species-skill"]').forEach(cb => {
          cb.addEventListener('change', () => {
            const chosen = Array.from(preview.querySelectorAll('input[name="wiz-species-skill"]:checked')).map(c => c.value);
            if (cb.checked && chosen.length > count) { cb.checked = false; return; }
            d._speciesSkillChoices = Array.from(preview.querySelectorAll('input[name="wiz-species-skill"]:checked')).map(c => c.value);
            preview.querySelectorAll('input[name="wiz-species-skill"]').forEach(c => {
              c.closest('label.lu-asi-choice').classList.toggle('selected', c.checked);
            });
            const countEl = preview.querySelector('input[name="wiz-species-skill"]')?.closest('.wiz-stat-row')?.querySelector('div[style*="ink-faint"]');
            if (countEl) countEl.textContent = `${d._speciesSkillChoices.length}/${count} chosen`;
          });
        });
      }
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

    if (window.setupAutocomplete) setupAutocomplete(input, 'species-list');
    input.addEventListener('change', () => { d.charSubrace = null; d._racialCantripChoice = undefined; d._racialSpellAbility = undefined; showPreview(input.value); });
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
        <input type="text" id="wiz-bg-search" class="wiz-search" placeholder="Search background..." value="${d.charBackground || ''}" autocomplete="off">
        <div id="wiz-bg-preview" class="wiz-preview"></div>
        <div id="wiz-bg-instrument-picker"></div>
        <div id="wiz-bg-gamingset-picker"></div>
        <div id="wiz-bg-equip" class="wiz-bg-equip"></div>
        <div id="wiz-bg-lang" class="wiz-bg-equip"></div>
        <div id="wiz-bg-characteristics"></div>
        <div id="wiz-bg-faceless-persona"></div>
        <div id="wiz-bg-feat-spells"></div>
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
      if (it.displayName) {
        let name = stripPrice(it.displayName);
        // Resolve gaming set placeholder to the chosen gaming set
        if (/gaming set.*chosen|same as chosen/i.test(name) && d._bgGamingSetChoice) name = d._bgGamingSetChoice;
        return (it.quantity ? `${it.quantity}× ` : '') + name;
      }
      if (it.equipmentType) {
        const typeNames = { weaponMartial: 'any martial weapon', weaponSimple: 'any simple weapon', toolArtisan: 'any artisan tool', instrumentMusical: 'Musical Instrument (same as above)', setGaming: 'Gaming Set (same as above)' };
        // Resolve instrument placeholder to the chosen background instrument
        if (it.equipmentType === 'instrumentMusical' && d._bgInstrumentChoice) {
          return (it.quantity ? `${it.quantity}× ` : '') + d._bgInstrumentChoice;
        }
        // Resolve gaming set placeholder to the chosen background gaming set
        if (it.equipmentType === 'setGaming' && d._bgGamingSetChoice) {
          return (it.quantity ? `${it.quantity}× ` : '') + d._bgGamingSetChoice;
        }
        return (it.quantity ? `${it.quantity}× ` : '') + (typeNames[it.equipmentType] || it.equipmentType.replace(/([A-Z])/g, ' $1').trim().toLowerCase());
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
      // Reset background equipment gold and feat spell choices if background changed
      if (d.charBackground !== name) {
        const prevInfo = d._bgInfo;
        if (prevInfo?.startingEquipment?.length && d._bgEquipChoice) {
          const prevRow = prevInfo.startingEquipment[0];
          const prevGold = choiceGold(prevRow[d._bgEquipChoice] || []);
          d.gp = Math.max(0, (d.gp || 0) - prevGold);
        }
        d._bgEquipChoice = null;
        d._bgEquipGoldApplied = false;
        d._bgFeatChosenSpells = [];
        d._bgFeatSpellClass = '';
      }
      d.charBackground = name;
      d._bgInfo = info;
      const skills = Object.keys(info.skillProf).join(', ') || 'None';
      // Check if background grants an instrument or gaming set choice
      const bgNeedsInstrument = Object.keys(info.toolProf).some(k => /anyMusicalInstrument/i.test(k));
      const bgNeedsGamingSet = Object.keys(info.toolProf).some(k => /anyGamingSet/i.test(k) || k.toLowerCase() === 'gaming set');
      const toolDisplayNames = Object.keys(info.toolProf).map(k => {
        if (/anyMusicalInstrument/i.test(k)) return d._bgInstrumentChoice || 'Musical Instrument (choose below)';
        if (/anyGamingSet/i.test(k) || k.toLowerCase() === 'gaming set') return d._bgGamingSetChoice || 'Gaming Set (choose below)';
        return k;
      });
      const tools = toolDisplayNames.join(', ') || 'None';
      const feat = info.featName
        ? (info.featClassHint ? `${info.featName} (${info.featClassHint})` : info.featName)
        : 'None';
      Object.keys(info.skillProf).forEach(sk => {
        const key = _normalizeSkillKey(sk);
        if (key) d['skillProf_' + key] = true;
      });

      // Check for skill overlaps with species (fixed + chosen)
      const _speciesFixedSkills = new Set();
      (d._speciesInfo?.skillProficiencies || []).forEach(sp => {
        Object.keys(sp).forEach(sk => { if (sp[sk] === true) _speciesFixedSkills.add(_normalizeSkillKey(sk)); });
      });
      (d._speciesSkillChoices || []).forEach(sk => _speciesFixedSkills.add(_normalizeSkillKey(sk)));
      const _bgSkillKeys = Object.keys(info.skillProf).map(sk => _normalizeSkillKey(sk)).filter(Boolean);
      const _overlappingSkills = _bgSkillKeys.filter(sk => _speciesFixedSkills.has(sk)).map(_skillLabel);

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

      const overlapWarningHtml = _overlappingSkills.length ? `
        <div style="background:rgba(200,120,0,0.12);border:1px solid #c07820;border-radius:6px;padding:8px 12px;margin-top:10px;font-size:0.82rem;color:#7a4a00">
          <strong>⚠ Duplicate Proficiency:</strong> Your species already grants proficiency in <strong>${_overlappingSkills.join(', ')}</strong>. You will not gain any extra benefit from this background granting the same skill${_overlappingSkills.length > 1 ? 's' : ''} again.
        </div>` : '';

      preview.innerHTML = `
        <div class="wiz-preview-card">
          <h3>${info.name} <span class="wiz-source">${info.src}</span></h3>
          <div class="wiz-stat-row"><strong>Skill Proficiencies:</strong> ${skills}</div>
          <div class="wiz-stat-row"><strong>Tool Proficiencies:</strong> ${tools}</div>
          <div class="wiz-stat-row"><strong>Origin Feat:</strong> ${feat}</div>
          <div class="wiz-stat-row"><strong>Languages:</strong> Common + 2 of your choice</div>
          <div class="wiz-stat-row" style="color:var(--ink-faint);font-size:0.8rem">${abNote}</div>
          <div class="wiz-traits">${traitsHtml}</div>
          ${overlapWarningHtml}
        </div>`;

      // Instrument proficiency picker for backgrounds that grant a musical instrument choice
      const instrPickerDiv = document.getElementById('wiz-bg-instrument-picker');
      if (bgNeedsInstrument && instrPickerDiv) {
        const BG_INSTRUMENTS = ['Bagpipes', 'Bandore', 'Cittern', 'Drum', 'Dulcimer', 'Flute', 'Horn', 'Lute', 'Lyre', 'Pan Flute', 'Shawm', 'Viol', 'Yarting'];
        instrPickerDiv.innerHTML = `
          <div class="lu-section" style="margin-top:12px">
            <div class="lu-section-title">Musical Instrument Proficiency</div>
            <select class="wiz-select" id="wiz-bg-instrument">
              <option value="">— Choose an instrument —</option>
              ${BG_INSTRUMENTS.map(n => `<option value="${n}" ${d._bgInstrumentChoice === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>`;
        instrPickerDiv.querySelector('select').addEventListener('change', function () {
          d._bgInstrumentChoice = this.value || null;
          // Update the tool proficiency display in the preview card
          const toolsRow = preview.querySelector('.wiz-stat-row:nth-child(2)');
          if (toolsRow) {
            const updatedNames = Object.keys(info.toolProf).map(k =>
              /anyMusicalInstrument/i.test(k) ? (d._bgInstrumentChoice || 'Musical Instrument (choose below)') : k
            );
            toolsRow.innerHTML = `<strong>Tool Proficiencies:</strong> ${updatedNames.join(', ')}`;
          }
          // Re-render equipment to update instrument name in equipment text
          if (!isCustomBg) renderEquipPicker(info);
        });
      } else if (instrPickerDiv) {
        instrPickerDiv.innerHTML = '';
      }

      // Gaming set proficiency picker for backgrounds that grant a gaming set choice (e.g. Carouser)
      const gamingPickerDiv = document.getElementById('wiz-bg-gamingset-picker');
      if (bgNeedsGamingSet && gamingPickerDiv) {
        const BG_GAMING_SETS = ["Dice Set", "Dragonchess Set", "Playing Card Set", "Three-Dragon Ante Set"];
        gamingPickerDiv.innerHTML = `
          <div class="lu-section" style="margin-top:12px">
            <div class="lu-section-title">Gaming Set Proficiency</div>
            <select class="wiz-select" id="wiz-bg-gamingset">
              <option value="">— Choose a gaming set —</option>
              ${BG_GAMING_SETS.map(n => `<option value="${n}" ${d._bgGamingSetChoice === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>`;
        gamingPickerDiv.querySelector('select').addEventListener('change', function () {
          d._bgGamingSetChoice = this.value || null;
          // Update the tool proficiency display in the preview card
          const toolsRow = preview.querySelector('.wiz-stat-row:nth-child(2)');
          if (toolsRow) {
            const updatedNames = Object.keys(info.toolProf).map(k =>
              (/anyGamingSet/i.test(k) || k.toLowerCase() === 'gaming set') ? (d._bgGamingSetChoice || 'Gaming Set (choose below)') : k
            );
            toolsRow.innerHTML = `<strong>Tool Proficiencies:</strong> ${updatedNames.join(', ')}`;
          }
          // Re-render equipment to update gaming set name in equipment text
          if (!isCustomBg) renderEquipPicker(info);
        });
      } else if (gamingPickerDiv) {
        gamingPickerDiv.innerHTML = '';
      }

      if (isCustomBg) {
        renderCustomBgEquipPicker();
      } else {
        renderEquipPicker(info);
      }
      renderLangPicker();
      renderCharacteristicsPicker(info);
      renderFacelessPersonaPicker(info);
      renderBgFeatSpellPicker(info);
    };

    const renderBgFeatSpellPicker = (info) => {
      const featSpellDiv = document.getElementById('wiz-bg-feat-spells');
      if (!featSpellDiv) return;
      const featName = info?.featName || null;
      const spellConfig = featName && typeof ClassResources !== 'undefined'
        ? ClassResources.FEAT_SPELL_CHOICES?.[featName] : null;
      if (!spellConfig?.picks?.length) { featSpellDiv.innerHTML = ''; return; }

      if (!d._bgFeatChosenSpells) d._bgFeatChosenSpells = [];
      if (info.featClassHint && !d._bgFeatSpellClass) d._bgFeatSpellClass = info.featClassHint;
      if (!d._bgFeatSpellClass) d._bgFeatSpellClass = '';

      const chosenSpells = d._bgFeatChosenSpells;
      const classFixed = !!info.featClassHint;

      // Subclass overlap map built from the character's class (not the feat's class)
      const _bgFeatOverlapMap = (typeof LevelUp !== 'undefined' && typeof LevelUp._getSubclassOverlapMap === 'function')
        ? LevelUp._getSubclassOverlapMap(d.charClass || '') : new Map();

      const buildPicker = (selClass) => {
        d._bgFeatSpellClass = selClass;
        featSpellDiv.innerHTML = '';

        const section = document.createElement('div');
        section.className = 'wiz-spell-group';
        section.style.marginTop = '16px';

        // Section heading
        const heading = document.createElement('h3');
        const classHint = info.featClassHint ? ` (${info.featClassHint})` : '';
        heading.innerHTML = `${featName}${classHint} — Choose Spells`;
        section.appendChild(heading);

        // Class picker (only if not fixed by background)
        if (spellConfig.requireClassPick && !classFixed) {
          const classRow = document.createElement('div');
          classRow.style.cssText = 'margin-bottom:12px';
          classRow.innerHTML = `<label style="font-size:0.82rem;font-weight:600;margin-right:8px">Class:</label>`;
          const sel = document.createElement('select');
          sel.className = 'wiz-select';
          sel.style.cssText = 'width:auto;display:inline-block';
          sel.innerHTML = `<option value="">— Choose class —</option>` +
            spellConfig.classOptions.map(c =>
              `<option value="${c}" ${c === selClass ? 'selected' : ''}>${c}</option>`
            ).join('');
          sel.addEventListener('change', () => {
            d._bgFeatChosenSpells = [];
            buildPicker(sel.value);
          });
          classRow.appendChild(sel);
          section.appendChild(classRow);
        }

        // Auto-spells
        if (spellConfig.autoSpells?.length) {
          const autoDiv = document.createElement('div');
          autoDiv.style.cssText = 'font-size:0.82rem;margin-bottom:10px;color:var(--ink-light)';
          autoDiv.innerHTML = `<strong>Always prepared:</strong> ` +
            spellConfig.autoSpells.map(s => `<span class="feat-spell-tag feat-spell-auto">${s}</span>`).join(' ');
          section.appendChild(autoDiv);
        }

        // Append to DOM now so getElementById works inside renderList
        featSpellDiv.appendChild(section);

        // One spell-list group per pick definition
        spellConfig.picks.forEach((pickDef, pickIdx) => {
          if (spellConfig.requireClassPick && !selClass) return; // waiting for class selection

          const pool = ClassResources.getFeatSpellPool(pickDef, selClass);
          const countSelected = () => pool.filter(s => chosenSpells.includes(s.name)).length;
          const filterId = `wiz-bg-feat-filter-${pickIdx}`;
          const listId  = `wiz-bg-feat-list-${pickIdx}`;
          const cntId   = `wiz-bg-feat-counter-${pickIdx}`;

          const groupLabel = pickDef.label || `Choose ${pickDef.count} spell(s)`;
          const groupHead = document.createElement('h3');
          groupHead.innerHTML = `${groupLabel} <span id="${cntId}" style="font-size:0.82rem;margin-left:8px"></span>`;
          section.appendChild(groupHead);

          const filterInput = document.createElement('input');
          filterInput.type = 'text';
          filterInput.id = filterId;
          filterInput.className = 'wiz-search wiz-search-sm';
          filterInput.placeholder = `Filter ${groupLabel.toLowerCase()}...`;
          filterInput.autocomplete = 'off';
          section.appendChild(filterInput);

          const listEl = document.createElement('div');
          listEl.id = listId;
          listEl.className = 'wiz-spell-list';
          section.appendChild(listEl);

          const renderCounter = () => {
            const cnt = document.getElementById(cntId);
            if (!cnt) return;
            const n = countSelected();
            cnt.textContent = `${n} / ${pickDef.count} selected`;
            cnt.style.color = n > pickDef.count ? 'var(--danger,#c00)' : n === pickDef.count ? 'var(--success,#2a7)' : 'var(--ink-faint)';
          };

          const renderList = (filter) => {
            const q = (filter || '').toLowerCase();
            const visible = pool.filter(s => !q || s.name.toLowerCase().includes(q));
            const el = document.getElementById(listId);
            if (!el) return;
            el.innerHTML = '';
            // Header row
            const header = document.createElement('div');
            header.className = 'wiz-spell-row wiz-spell-header';
            header.innerHTML = `
              <span class="wiz-spell-col-check"></span>
              <span class="wiz-spell-col-name">Name</span>
              <span class="wiz-spell-col-school">School</span>
              <span class="wiz-spell-col-cast">Casting Time</span>
              <span class="wiz-spell-col-range">Range</span>
              <span class="wiz-spell-col-comp">Components</span>
              <span class="wiz-spell-col-dur">Duration</span>`;
            el.appendChild(header);

            visible.forEach(spell => {
              const isSelected = chosenSpells.includes(spell.name);
              const atMax = countSelected() >= pickDef.count && !isSelected;
              const row = document.createElement('label');
              row.className = 'wiz-spell-row' + (isSelected ? ' selected' : '') + (atMax ? ' disabled' : '');
              if (atMax) row.style.opacity = '0.45';
              const _warnBadge = (typeof LevelUp !== 'undefined' && typeof LevelUp._subclassWarnBadge === 'function')
                ? LevelUp._subclassWarnBadge(_bgFeatOverlapMap, spell.name, '') : '';
              row.innerHTML = `
                <span class="wiz-spell-col-check"><input type="checkbox" ${isSelected ? 'checked' : ''} ${atMax ? 'disabled' : ''}></span>
                <span class="wiz-spell-col-name"><span class="wiz-spell-col-name-text">${spell.name}</span>${spell.meta?.ritual ? '<span class="spell-badge spell-badge-ritual" title="Ritual">R</span>' : ''}${_warnBadge}</span>
                <span class="wiz-spell-col-school">${spell._schoolName || ''}</span>
                <span class="wiz-spell-col-cast">${spell._castTime || ''}</span>
                <span class="wiz-spell-col-range">${spell._rangeStr || ''}</span>
                <span class="wiz-spell-col-comp">${spell._componentsStr || ''}</span>
                <span class="wiz-spell-col-dur">${spell._durationStr || ''}</span>`;

              // Tooltip
              row.addEventListener('mouseenter', (e) => {
                let tip = document.getElementById('wiz-spell-tooltip');
                if (!tip) { tip = document.createElement('div'); tip.id = 'wiz-spell-tooltip'; tip.className = 'wiz-spell-tooltip'; document.body.appendChild(tip); }
                const desc = entriesToHtml(spell.entries || []);
                const higher = spell.entriesHigherLevel ? `<p class="wiz-tip-higher"><strong>At Higher Levels.</strong> ${entriesToHtml(spell.entriesHigherLevel)}</p>` : '';
                tip.innerHTML = `<div class="wiz-tip-header"><span class="wiz-tip-name">${spell.name}</span><span class="wiz-tip-level">${spell._levelStr} ${spell._schoolName ? '— ' + spell._schoolName : ''}</span></div>
                  <div class="wiz-tip-meta">${spell._castTime || ''} | ${spell._rangeStr || ''} | ${spell._componentsStr || ''} | ${spell._durationStr || ''}</div>
                  <div class="wiz-tip-body">${typeof _highlightSpellKeywords === 'function' ? _highlightSpellKeywords(desc + higher) : desc + higher}</div>`;
                tip.style.display = 'block';
                _positionSpellTooltip(tip, e);
              });
              row.addEventListener('mousemove', (e) => { const tip = document.getElementById('wiz-spell-tooltip'); if (tip) _positionSpellTooltip(tip, e); });
              row.addEventListener('mouseleave', () => { const tip = document.getElementById('wiz-spell-tooltip'); if (tip) tip.style.display = 'none'; });

              row.querySelector('input').addEventListener('change', function () {
                if (this.checked) {
                  if (countSelected() >= pickDef.count) { this.checked = false; return; }
                  chosenSpells.push(spell.name);
                } else {
                  const i = chosenSpells.indexOf(spell.name);
                  if (i >= 0) chosenSpells.splice(i, 1);
                }
                row.classList.toggle('selected', this.checked);
                renderCounter();
                renderList(document.getElementById(filterId)?.value);
              });
              if (typeof _attachSubclassWarnTooltip === 'function') _attachSubclassWarnTooltip(row);
              el.appendChild(row);
            });
            renderCounter();
          };

          filterInput.addEventListener('input', function () { renderList(this.value); });
          renderList('');
        });

        // If class pick is required but not yet selected, show a prompt
        if (spellConfig.requireClassPick && !selClass && !classFixed) {
          const prompt = document.createElement('p');
          prompt.style.cssText = 'color:var(--ink-faint);font-size:0.85rem;margin-top:8px';
          prompt.textContent = 'Select a class above to see available spells.';
          section.appendChild(prompt);
        }
      };

      buildPicker(d._bgFeatSpellClass);
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

    const renderFacelessPersonaPicker = (info) => {
      const personaDiv = document.getElementById('wiz-bg-faceless-persona');
      if (!personaDiv) return;
      if (info?.name !== 'Faceless') { personaDiv.innerHTML = ''; return; }

      if (!d._facelessPersonaBg) d._facelessPersonaBg = '';
      if (!d._facelessPersonaCharacteristics || typeof d._facelessPersonaCharacteristics !== 'object') {
        d._facelessPersonaCharacteristics = { _bg: '', traits: [], ideals: [], bonds: [], flaws: [] };
      }

      const renderPersonaTraits = (personaBgName) => {
        const traitsDiv = document.getElementById('wiz-faceless-persona-traits');
        if (!traitsDiv) return;
        if (!personaBgName) { traitsDiv.innerHTML = ''; return; }
        const personaInfo = getBackgroundInfo(personaBgName);
        if (!personaInfo) { traitsDiv.innerHTML = ''; return; }
        const sc = personaInfo.suggestedCharacteristics;
        const hasAny = sc && (sc.traits.length || sc.ideals.length || sc.bonds.length || sc.flaws.length);
        if (!hasAny) {
          traitsDiv.innerHTML = '<p style="color:var(--ink-faint);font-size:0.82rem;margin-top:8px">No suggested characteristics found for this background.</p>';
          return;
        }
        if (d._facelessPersonaCharacteristics._bg !== personaBgName) {
          d._facelessPersonaCharacteristics = { _bg: personaBgName, traits: [], ideals: [], bonds: [], flaws: [] };
        }
        const sections = [
          { key: 'traits', label: 'Personality Traits', items: sc.traits },
          { key: 'ideals', label: 'Ideals',             items: sc.ideals },
          { key: 'bonds',  label: 'Bonds',              items: sc.bonds  },
          { key: 'flaws',  label: 'Flaws',              items: sc.flaws  },
        ].filter(s => s.items.length);
        traitsDiv.innerHTML = sections.map(sec => `
          <div style="margin-top:10px">
            <div style="font-size:0.82rem;font-weight:600;margin-bottom:4px;color:var(--ink-light)">${sec.label}</div>
            <div class="wiz-char-list" data-pkey="${sec.key}">
              ${sec.items.map((text, i) => {
                const sel = d._facelessPersonaCharacteristics[sec.key].includes(i);
                return `<label class="lu-asi-choice${sel ? ' selected' : ''}" style="font-size:0.8rem;padding:5px 10px;align-items:flex-start">
                  <input type="checkbox" data-pkey="${sec.key}" data-idx="${i}" ${sel ? 'checked' : ''} style="margin-top:2px;flex-shrink:0">
                  <span>${text}</span>
                </label>`;
              }).join('')}
            </div>
          </div>`).join('');
        traitsDiv.querySelectorAll('input[type="checkbox"][data-pkey]').forEach(cb => {
          cb.addEventListener('change', () => {
            const key = cb.dataset.pkey, idx = parseInt(cb.dataset.idx);
            const arr = d._facelessPersonaCharacteristics[key];
            if (cb.checked) { if (!arr.includes(idx)) arr.push(idx); }
            else { const i = arr.indexOf(idx); if (i >= 0) arr.splice(i, 1); }
            cb.closest('label').classList.toggle('selected', cb.checked);
          });
        });
      };

      personaDiv.innerHTML = `
        <div class="lu-section" style="margin-top:16px;border-top:2px dashed var(--border);padding-top:16px">
          <div class="lu-section-title">Fake Persona Background <span style="font-size:0.75rem;font-weight:400;color:var(--ink-faint)">(Faceless feature — optional)</span></div>
          <p style="font-size:0.82rem;color:var(--ink-light);margin:6px 0 10px">As a Faceless character you operate under a disguised persona. Choose a second background to use its suggested characteristics for your fake identity.</p>
          <input type="text" id="wiz-faceless-persona-bg" class="wiz-search" placeholder="Search background for fake persona..." value="${d._facelessPersonaBg || ''}" autocomplete="off">
          <div id="wiz-faceless-persona-traits"></div>
        </div>`;

      const personaInput = personaDiv.querySelector('#wiz-faceless-persona-bg');
      if (window.setupAutocomplete) setupAutocomplete(personaInput, 'bg-list');
      personaInput.addEventListener('change', () => {
        d._facelessPersonaBg = personaInput.value.trim();
        if (!d._facelessPersonaBg) {
          d._facelessPersonaCharacteristics = { _bg: '', traits: [], ideals: [], bonds: [], flaws: [] };
        }
        renderPersonaTraits(d._facelessPersonaBg);
      });
      if (d._facelessPersonaBg) renderPersonaTraits(d._facelessPersonaBg);
    };

    renderLangPicker();
    if (window.setupAutocomplete) setupAutocomplete(input, 'bg-list');
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
        <input type="text" id="wiz-class-search" class="wiz-search" placeholder="Search class..." value="${d.charClass || ''}" autocomplete="off">
        <div id="wiz-class-preview" class="wiz-preview"></div>
        <div id="wiz-skill-choices" class="wiz-choices"></div>
      </div>`;
    const input = document.getElementById('wiz-class-search');
    const preview = document.getElementById('wiz-class-preview');
    const skillDiv = document.getElementById('wiz-skill-choices');

    const showPreview = (className) => {
      const info = getClassInfo(className);
      if (!info) { preview.innerHTML = '<div class="wiz-hint">Select a class to see details</div>'; skillDiv.innerHTML = ''; return; }
      // Reset class-specific choices when class changes
      if (d.charClass !== className) {
        d._classSkillChoices = [];
        d._expertiseChoices = [];
        d._fightingStyle = null;
        d._weaponMasteryChoices = [];
        d._classToolChoices = [];
        d._classToolCategories = [];
        d._psionicDisciplines = [];
        d._divineOrder = null;
        d._divineOrderCantrip = null;
      }
      d.charClass = className;
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

        // Skills already granted by the chosen background or species
        const bgSkills = new Set(Object.keys(d._bgInfo?.skillProf || {}).map(_normalizeSkillKey));
        const speciesSkills = new Set();
        (d._speciesInfo?.skillProficiencies || []).forEach(sp => {
          Object.keys(sp).forEach(sk => { if (sp[sk] === true) { const k = _normalizeSkillKey(sk); if (k) speciesSkills.add(k); } });
        });
        (d._speciesSkillChoices || []).forEach(sk => { const k = _normalizeSkillKey(sk); if (k) speciesSkills.add(k); });
        const grantedSkills = new Set([...bgSkills, ...speciesSkills]);

        // Remove any class picks that duplicate background/species skills
        d._classSkillChoices = d._classSkillChoices.filter(s => !grantedSkills.has(s));

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
            if (lbl.classList.contains('bg-granted')) return; // always locked
            const isChecked = inp.checked;
            const shouldDisable = atLimit && !isChecked;
            inp.disabled = shouldDisable;
            lbl.classList.toggle('disabled', shouldDisable);
          });
        };

        const _scSkillWarnings = _SUBCLASS_SKILL_WARNINGS[d.charClass] || [];

        from.forEach(sk => {
          const normSk = _normalizeSkillKey(sk);
          const labelText = _skillLabel(normSk);
          const fromBg = bgSkills.has(normSk);
          const fromSpecies = speciesSkills.has(normSk);
          const isGranted = fromBg || fromSpecies;
          const checked = d._classSkillChoices.includes(normSk);
          const div = document.createElement('label');
          const grantTag = fromBg ? 'background' : 'species';
          const scWarn = _scSkillWarnings.find(w => w.skill === normSk);
          const scWarnBadge = scWarn ? ` <span class="wiz-bg-tag wiz-sc-warn-tag" title="${scWarn.subclass} grants this via ${scWarn.feature} at level ${scWarn.level}">⚠ ${scWarn.subclass}</span>` : '';
          div.className = 'wiz-checkbox-label' + (isGranted ? ' bg-granted disabled' : (checked ? ' selected' : ''));
          div.title = isGranted ? `Already granted by your ${grantTag}` : '';
          div.innerHTML = `<input type="checkbox" value="${normSk}" ${isGranted ? 'disabled' : (checked ? 'checked' : '')}> ${labelText}${isGranted ? ` <span class="wiz-bg-tag">${grantTag}</span>` : ''}${scWarnBadge}`;
          if (!isGranted) {
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
          }
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

        // Gather all currently proficient skills (background + class + species picks), normalised to camelCase
        const _spSkills = [];
        (d._speciesInfo?.skillProficiencies || []).forEach(sp => {
          Object.keys(sp).forEach(sk => { if (sp[sk] === true) { const k = _normalizeSkillKey(sk); if (k) _spSkills.push(k); } });
        });
        const profSkills = new Set([
          ...Object.keys(d._bgInfo?.skillProf || {}).map(_normalizeSkillKey),
          ...(d._classSkillChoices || []),
          ..._spSkills,
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

      // ---- Weapon Mastery (Barbarian, Fighter, Paladin, Ranger, Rogue in 2024) ----
      if (info.weaponMasteryCount > 0) {
        const weapons = typeof getMasteryWeaponsForClass === 'function' ? getMasteryWeaponsForClass(d.charClass) : (typeof getMeleeWeaponsForMastery === 'function' ? getMeleeWeaponsForMastery() : []);
        if (weapons.length) {
          d._weaponMasteryChoices = d._weaponMasteryChoices || [];
          const count = info.weaponMasteryCount;

          const wmSection = document.createElement('div');
          wmSection.className = 'wiz-weapon-mastery-section';

          const heading = document.createElement('h4');
          heading.className = 'wiz-subtitle';
          heading.textContent = `Choose ${count} Weapon${count !== 1 ? 's' : ''} for Weapon Mastery`;
          wmSection.appendChild(heading);

          const note = document.createElement('p');
          note.className = 'wiz-desc';
          note.textContent = 'You know the Mastery property of these weapons. You may swap one choice after each Long Rest.';
          wmSection.appendChild(note);

          const countBadge = document.createElement('div');
          countBadge.className = 'wiz-mastery-count';
          countBadge.textContent = `${d._weaponMasteryChoices.length}/${count} selected`;
          wmSection.appendChild(countBadge);

          const renderWmGrid = () => {
            countBadge.textContent = `${d._weaponMasteryChoices.length}/${count} selected`;
            const atLimit = d._weaponMasteryChoices.length >= count;
            wmSection.querySelectorAll('.wiz-mastery-label').forEach(lbl => {
              const inp = lbl.querySelector('input');
              const isChecked = inp.checked;
              inp.disabled = atLimit && !isChecked;
              lbl.classList.toggle('disabled', atLimit && !isChecked);
            });
          };

          // Group by category
          const byCategory = {};
          weapons.forEach(w => {
            if (!byCategory[w.category]) byCategory[w.category] = [];
            byCategory[w.category].push(w);
          });

          Object.entries(byCategory).forEach(([cat, weps]) => {
            const catLabel = document.createElement('div');
            catLabel.className = 'wiz-mastery-category';
            catLabel.textContent = cat;
            wmSection.appendChild(catLabel);

            const grid = document.createElement('div');
            grid.className = 'wiz-checkbox-grid wiz-mastery-grid';
            weps.forEach(w => {
              const checked = d._weaponMasteryChoices.includes(w.name);
              const lbl = document.createElement('label');
              lbl.className = 'wiz-checkbox-label wiz-mastery-label' + (checked ? ' selected' : '');
              lbl.innerHTML = `<input type="checkbox" value="${w.name}" ${checked ? 'checked' : ''}> ${w.name}`;
              lbl.querySelector('input').addEventListener('change', function () {
                if (this.checked) {
                  if (d._weaponMasteryChoices.length >= count) { this.checked = false; return; }
                  d._weaponMasteryChoices.push(w.name);
                  lbl.classList.add('selected');
                } else {
                  d._weaponMasteryChoices = d._weaponMasteryChoices.filter(n => n !== w.name);
                  lbl.classList.remove('selected');
                }
                renderWmGrid();
              });
              grid.appendChild(lbl);
            });
            wmSection.appendChild(grid);
          });

          skillDiv.appendChild(wmSection);
        }
      }

      // ---- Tool Proficiency Choices (Monk, Bard, etc.) ----
      if (info.toolProfChoices?.length) {
        d._classToolChoices = d._classToolChoices || [];
        d._classToolCategories = d._classToolCategories || [];

        const ARTISAN_TOOLS = ["Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies", "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools"];
        const ALL_INSTRUMENTS = ['Bagpipes', 'Bandore', 'Cittern', 'Drum', 'Dulcimer', 'Flute', 'Horn', 'Lute', 'Lyre', 'Pan Flute', 'Shawm', 'Viol', 'Yarting'];
        // Exclude instrument already granted by the background
        const bgInstrument = d._bgInstrumentChoice || null;
        const INSTRUMENTS = bgInstrument ? ALL_INSTRUMENTS.filter(n => n !== bgInstrument) : ALL_INSTRUMENTS;

        const toolSection = document.createElement('div');
        toolSection.className = 'wiz-tool-prof-section';

        // Build flat list of picks
        const allPicks = [];
        let pickIdx = 0;
        info.toolProfChoices.forEach(group => {
          for (let i = 0; i < group.count; i++) {
            allPicks.push({ idx: pickIdx++, type: group.type });
          }
        });

        const totalPicks = allPicks.length;
        const heading = document.createElement('h4');
        heading.className = 'wiz-subtitle';
        heading.textContent = totalPicks === 1 ? 'Choose a Tool Proficiency' : `Choose ${totalPicks} Tool Proficiencies`;
        toolSection.appendChild(heading);
        if (bgInstrument) {
          const bgNote = document.createElement('div');
          bgNote.style.cssText = 'font-size:0.82rem;color:var(--ink-faint);margin-bottom:8px';
          bgNote.textContent = `Already proficient with ${bgInstrument} from your background.`;
          toolSection.appendChild(bgNote);
        }

        allPicks.forEach(pick => {
          const pickWrap = document.createElement('div');
          pickWrap.style.cssText = 'margin-bottom:12px';

          if (totalPicks > 1) {
            const lbl = document.createElement('div');
            lbl.style.cssText = 'font-size:0.82rem;color:var(--ink-faint);margin-bottom:6px';
            lbl.textContent = `Pick ${pick.idx + 1}`;
            pickWrap.appendChild(lbl);
          }

          const savedCategory = d._classToolCategories[pick.idx];

          // For artisanOrInstrument: show two toggle buttons
          if (pick.type === 'artisanOrInstrument') {
            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';

            const btnArtisan = document.createElement('button');
            btnArtisan.className = 'bg-asi-card' + (savedCategory === 'artisan' ? ' two' : '');
            btnArtisan.textContent = "Artisan's Tools";

            const btnInstrument = document.createElement('button');
            btnInstrument.className = 'bg-asi-card' + (savedCategory === 'instrument' ? ' two' : '');
            btnInstrument.textContent = 'Musical Instrument';

            btnRow.appendChild(btnArtisan);
            btnRow.appendChild(btnInstrument);
            pickWrap.appendChild(btnRow);

            const dropWrap = document.createElement('div');
            const renderDrop = (category) => {
              const allItems = category === 'artisan' ? ARTISAN_TOOLS : INSTRUMENTS;
              // Filter out items already chosen in other pick slots (prevent duplicates)
              const otherChosen = d._classToolChoices.filter((v, i) => i !== pick.idx && v && d._classToolCategories[i] === category);
              const items = allItems.filter(n => !otherChosen.includes(n));
              const cur = d._classToolChoices[pick.idx];
              dropWrap.innerHTML = `<select class="wiz-select">
                <option value="">— Choose a ${category === 'artisan' ? "tool" : "instrument"} —</option>
                ${items.map(n => `<option value="${n}" ${cur === n ? 'selected' : ''}>${n}</option>`).join('')}
              </select>`;
              dropWrap.querySelector('select').addEventListener('change', function () {
                d._classToolChoices[pick.idx] = this.value || null;
                // Re-render all other dropdowns to update available options
                toolSection.querySelectorAll('.wiz-tool-drop-wrap').forEach((w, i) => {
                  if (i !== pick.idx && w._renderDrop && d._classToolCategories[i]) w._renderDrop(d._classToolCategories[i]);
                });
              });
            };
            dropWrap.className = 'wiz-tool-drop-wrap';
            dropWrap._renderDrop = renderDrop;

            if (savedCategory) renderDrop(savedCategory);
            pickWrap.appendChild(dropWrap);

            btnArtisan.addEventListener('click', () => {
              d._classToolCategories[pick.idx] = 'artisan';
              d._classToolChoices[pick.idx] = null;
              btnArtisan.classList.add('two');
              btnInstrument.classList.remove('two');
              renderDrop('artisan');
            });
            btnInstrument.addEventListener('click', () => {
              d._classToolCategories[pick.idx] = 'instrument';
              d._classToolChoices[pick.idx] = null;
              btnInstrument.classList.add('two');
              btnArtisan.classList.remove('two');
              renderDrop('instrument');
            });

          } else {
            // Single category — just a dropdown
            const allItems = pick.type === 'artisan' ? ARTISAN_TOOLS
                        : pick.type === 'list'    ? (pick.from || [])
                        :                          INSTRUMENTS;
            const label = pick.type === 'artisan' ? 'tool'
                        : pick.type === 'list'    ? 'tool'
                        :                          'instrument';
            const singleDropWrap = document.createElement('div');
            singleDropWrap.className = 'wiz-tool-drop-wrap';
            const renderSingleDrop = () => {
              const otherChosen = d._classToolChoices.filter((v, i) => i !== pick.idx && v && d._classToolCategories[i] === pick.type);
              const items = allItems.filter(n => !otherChosen.includes(n));
              const cur = d._classToolChoices[pick.idx];
              singleDropWrap.innerHTML = `<select class="wiz-select">
                <option value="">— Choose a ${label} —</option>
                ${items.map(n => `<option value="${n}" ${cur === n ? 'selected' : ''}>${n}</option>`).join('')}
              </select>`;
              singleDropWrap.querySelector('select').addEventListener('change', function () {
                d._classToolChoices[pick.idx] = this.value || null;
                d._classToolCategories[pick.idx] = pick.type;
                toolSection.querySelectorAll('.wiz-tool-drop-wrap').forEach((w, i) => {
                  if (i !== pick.idx && w._renderDrop && d._classToolCategories[i]) w._renderDrop(d._classToolCategories[i]);
                  else if (i !== pick.idx && w._renderSingleDrop) w._renderSingleDrop();
                });
              });
            };
            singleDropWrap._renderSingleDrop = renderSingleDrop;
            renderSingleDrop();
            pickWrap.appendChild(singleDropWrap);
          }

          toolSection.appendChild(pickWrap);
        });

        skillDiv.appendChild(toolSection);
      }

      // ---- Psionic Disciplines (Psion level 2+) ----
      if (d.charClass === 'Psion' && parseInt(d.charLevel || 1) >= 2) {
        const level = parseInt(d.charLevel || 1);
        const count = level >= 17 ? 6 : level >= 13 ? 5 : level >= 10 ? 4 : level >= 5 ? 3 : 2;
        d._psionicDisciplines = d._psionicDisciplines || [];
        const options = typeof ClassResources !== 'undefined' ? ClassResources.PSIONIC_DISCIPLINE_OPTIONS || [] : [];
        if (options.length) {
          const pdSection = document.createElement('div');
          pdSection.className = 'wiz-fighting-style-section';

          const heading = document.createElement('h4');
          heading.className = 'wiz-subtitle';
          heading.textContent = `Choose ${count} Psionic Disciplines`;
          pdSection.appendChild(heading);

          const note = document.createElement('p');
          note.className = 'wiz-desc';
          note.textContent = 'You can use only one Discipline per turn.';
          pdSection.appendChild(note);

          const countBadge = document.createElement('div');
          countBadge.className = 'wiz-count-badge';
          countBadge.textContent = `${Math.min(d._psionicDisciplines.length, count)}/${count} selected`;
          pdSection.appendChild(countBadge);

          const grid = document.createElement('div');
          grid.className = 'wiz-checkbox-grid';
          const descEl = document.createElement('div');
          descEl.className = 'wiz-fs-desc wiz-preview-card';
          descEl.style.marginTop = '8px';

          const updateStates = () => {
            const atLimit = d._psionicDisciplines.length >= count;
            countBadge.textContent = `${d._psionicDisciplines.length}/${count} selected`;
            grid.querySelectorAll('.wiz-checkbox-label').forEach(lbl => {
              const inp = lbl.querySelector('input');
              if (!inp) return;
              if (!inp.checked && atLimit) lbl.classList.add('disabled');
              else lbl.classList.remove('disabled');
            });
          };

          options.forEach(opt => {
            const checked = d._psionicDisciplines.includes(opt.name);
            const lbl = document.createElement('label');
            lbl.className = 'wiz-checkbox-label' + (checked ? ' selected' : '');
            lbl.innerHTML = `<input type="checkbox" value="${opt.name}" ${checked ? 'checked' : ''}> ${opt.name}`;
            lbl.querySelector('input').addEventListener('change', function () {
              if (this.checked) {
                if (d._psionicDisciplines.length >= count) { this.checked = false; return; }
                d._psionicDisciplines.push(opt.name);
                lbl.classList.add('selected');
              } else {
                d._psionicDisciplines = d._psionicDisciplines.filter(n => n !== opt.name);
                lbl.classList.remove('selected');
              }
              descEl.innerHTML = `<strong>${opt.name}</strong>: ${opt.text}`;
              updateStates();
            });
            const _showDisciplineTip = (e) => {
              let tip = document.getElementById('wiz-discipline-tooltip');
              if (!tip) {
                tip = document.createElement('div');
                tip.id = 'wiz-discipline-tooltip';
                tip.className = 'wiz-spell-tooltip';
                tip.style.maxWidth = '340px';
                document.body.appendChild(tip);
              }
              const highlighted = typeof _highlightSpellKeywords === 'function'
                ? _highlightSpellKeywords(_highlightPsionicKeywords(opt.text))
                : opt.text;
              tip.innerHTML = `<div class="wiz-tip-header"><span class="wiz-tip-name">${opt.name}</span><span class="wiz-tip-level">Psionic Discipline</span></div><div class="wiz-tip-body">${highlighted}</div>`;
              tip.style.display = 'block';
              if (typeof _positionSpellTooltip === 'function') _positionSpellTooltip(tip, e);
            };
            lbl.addEventListener('mouseenter', _showDisciplineTip);
            lbl.addEventListener('mousemove', e => {
              const tip = document.getElementById('wiz-discipline-tooltip');
              if (tip && typeof _positionSpellTooltip === 'function') _positionSpellTooltip(tip, e);
            });
            lbl.addEventListener('mouseleave', () => {
              const tip = document.getElementById('wiz-discipline-tooltip');
              if (tip) tip.style.display = 'none';
            });
            grid.appendChild(lbl);
          });

          if (d._psionicDisciplines.length) {
            const last = options.find(o => o.name === d._psionicDisciplines[d._psionicDisciplines.length - 1]);
            if (last) descEl.innerHTML = `<strong>${last.name}</strong>: ${last.text}`;
          }

          pdSection.appendChild(grid);
          pdSection.appendChild(descEl);
          updateStates();
          skillDiv.appendChild(pdSection);
        }
      }

      // ---- Divine Order (Cleric level 1) ----
      if (d.charClass === 'Cleric') {
        d._divineOrder = d._divineOrder || null;
        d._divineOrderCantrip = d._divineOrderCantrip || null;

        const DIVINE_ORDERS = [
          { name: 'Protector', desc: 'Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor.' },
          { name: 'Thaumaturge', desc: 'You know one extra cantrip from the Cleric spell list. In addition, your mystical connection to the divine gives you a bonus to your Intelligence (Arcana or Religion) checks equal to your Wisdom modifier (minimum of +1).' },
        ];

        const doSection = document.createElement('div');
        doSection.className = 'wiz-fighting-style-section';

        const doHeading = document.createElement('h4');
        doHeading.className = 'wiz-subtitle';
        doHeading.textContent = 'Divine Order';
        doSection.appendChild(doHeading);

        const doNote = document.createElement('p');
        doNote.className = 'wiz-desc';
        doNote.textContent = 'You have dedicated yourself to one of the following sacred roles of your choice.';
        doSection.appendChild(doNote);

        // Card container — appended to doSection before building cards so cantrip picker can also append
        const doCards = document.createElement('div');
        doCards.className = 'wiz-order-cards';
        doSection.appendChild(doCards);

        const doCantripSection = document.createElement('div');
        doCantripSection.style.marginTop = '12px';
        doSection.appendChild(doCantripSection);

        const renderDivineOrderCantripPicker = () => {
          doCantripSection.innerHTML = '';
          if (d._divineOrder !== 'Thaumaturge') return;

          const ua = typeof isUAEnabled === 'function' ? isUAEnabled() : true;
          const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
          const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;

          // Build set of cantrips already granted from other sources so we can exclude them
          const alreadyGrantedCantrips = new Set();

          // Racial / species cantrips
          if (d._speciesInfo && typeof parseRacialSpells === 'function') {
            const _srObj = d.charSubrace ? d._speciesInfo.subraces?.find(sr => sr.name === d.charSubrace) : null;
            const _racialAddSpells = _srObj?.additionalSpells?.length
              ? _srObj.additionalSpells : (d._speciesInfo.additionalSpells || []);
            if (_racialAddSpells.length) {
              const _rp = parseRacialSpells(_racialAddSpells, d.charSubrace || '', null, d._racialCantripChoice);
              (_rp.cantrips || []).filter(Boolean).forEach(n => alreadyGrantedCantrips.add(n.toLowerCase()));
            }
            // Fallback: chosen cantrip stored directly
            if (d._racialCantripChoice) alreadyGrantedCantrips.add(d._racialCantripChoice.toLowerCase());
          }

          // Background feat cantrips (auto-granted + user-chosen)
          const _bgFeatName = d._bgInfo?.featName;
          if (_bgFeatName && typeof ClassResources !== 'undefined') {
            const _fsc = ClassResources.FEAT_SPELL_CHOICES?.[_bgFeatName];
            if (_fsc) {
              (_fsc.autoSpells || []).forEach(n => {
                const sp = DndData?.spells?.find(s => s.name.toLowerCase() === n.toLowerCase());
                if (!sp || sp.level === 0) alreadyGrantedCantrips.add(n.toLowerCase());
              });
              (d._bgFeatChosenSpells || []).forEach(n => {
                const sp = DndData?.spells?.find(s => s.name.toLowerCase() === n.toLowerCase());
                if (!sp || sp.level === 0) alreadyGrantedCantrips.add(n.toLowerCase());
              });
            }
          }

          // Class auto-granted cantrips
          (ClassResources?.CLASS_AUTO_CANTRIPS?.['Cleric'] || []).forEach(n => alreadyGrantedCantrips.add(n.toLowerCase()));

          const allClericCantrips = (typeof getSpellsForClass === 'function' ? getSpellsForClass('Cleric') : DndData.spells)
            .filter(s => {
              if (s.level !== 0) return false;
              if (s.source === 'UA2024') return ua && show24;
              if (typeof is2024Source === 'function' && is2024Source(s.source)) return show24;
              return show14;
            });
          const clericCantrips = allClericCantrips.filter(s => !alreadyGrantedCantrips.has(s.name.toLowerCase()));

          // If the previously chosen cantrip was excluded (e.g. a racial cantrip), clear it
          if (d._divineOrderCantrip && alreadyGrantedCantrips.has(d._divineOrderCantrip.toLowerCase())) {
            d._divineOrderCantrip = null;
          }

          const cntId = 'wiz-do-cantrip-counter';
          const listId = 'wiz-do-cantrip-list';
          const filterId = 'wiz-do-cantrip-filter';

          const doCanLabel = document.createElement('h4');
          doCanLabel.className = 'wiz-subtitle';
          doCanLabel.innerHTML = `Thaumaturge Cantrip <span id="${cntId}" style="font-size:0.82rem;margin-left:8px"></span>`;
          doCantripSection.appendChild(doCanLabel);

          const doCanNote = document.createElement('p');
          doCanNote.className = 'wiz-desc';
          doCanNote.textContent = 'Choose one extra cantrip from the Cleric spell list.';
          doCantripSection.appendChild(doCanNote);

          const doCanFilter = document.createElement('input');
          doCanFilter.type = 'text';
          doCanFilter.id = filterId;
          doCanFilter.className = 'wiz-search wiz-search-sm';
          doCanFilter.placeholder = 'Filter cantrips...';
          doCanFilter.autocomplete = 'off';
          doCantripSection.appendChild(doCanFilter);

          const doCanList = document.createElement('div');
          doCanList.id = listId;
          doCanList.className = 'wiz-spell-list';
          doCantripSection.appendChild(doCanList);

          const renderDoCounter = () => {
            const cnt = document.getElementById(cntId);
            if (!cnt) return;
            const n = d._divineOrderCantrip ? 1 : 0;
            cnt.textContent = `${n} / 1 selected`;
            cnt.style.color = n === 1 ? 'var(--success,#2a7)' : 'var(--ink-faint)';
          };

          const renderDoList = (filter) => {
            const q = (filter || '').toLowerCase();
            const visible = clericCantrips.filter(s => !q || s.name.toLowerCase().includes(q));
            const el = document.getElementById(listId);
            if (!el) return;
            el.innerHTML = '';
            const hdr = document.createElement('div');
            hdr.className = 'wiz-spell-row wiz-spell-header';
            hdr.innerHTML = `
              <span class="wiz-spell-col-check"></span>
              <span class="wiz-spell-col-name">Name</span>
              <span class="wiz-spell-col-school">School</span>
              <span class="wiz-spell-col-cast">Casting Time</span>
              <span class="wiz-spell-col-range">Range</span>
              <span class="wiz-spell-col-comp">Components</span>
              <span class="wiz-spell-col-dur">Duration</span>`;
            el.appendChild(hdr);
            visible.forEach(spell => {
              const isSel = d._divineOrderCantrip === spell.name;
              const atMax = !isSel && !!d._divineOrderCantrip;
              const row = document.createElement('label');
              row.className = 'wiz-spell-row' + (isSel ? ' selected' : '') + (atMax ? ' disabled' : '');
              if (atMax) row.style.opacity = '0.45';
              row.innerHTML = `
                <span class="wiz-spell-col-check"><input type="checkbox" ${isSel ? 'checked' : ''} ${atMax ? 'disabled' : ''}></span>
                <span class="wiz-spell-col-name"><span class="wiz-spell-col-name-text">${spell.name}</span>${spell.meta?.ritual ? '<span class="spell-badge spell-badge-ritual" title="Ritual">R</span>' : ''}</span>
                <span class="wiz-spell-col-school">${spell._schoolName || ''}</span>
                <span class="wiz-spell-col-cast">${spell._castTime || ''}</span>
                <span class="wiz-spell-col-range">${spell._rangeStr || ''}</span>
                <span class="wiz-spell-col-comp">${spell._componentsStr || ''}</span>
                <span class="wiz-spell-col-dur">${spell._durationStr || ''}</span>`;
              row.addEventListener('mouseenter', (e) => {
                let tip = document.getElementById('wiz-spell-tooltip');
                if (!tip) { tip = document.createElement('div'); tip.id = 'wiz-spell-tooltip'; tip.className = 'wiz-spell-tooltip'; document.body.appendChild(tip); }
                const desc = entriesToHtml(spell.entries || []);
                const higher = spell.entriesHigherLevel ? `<p class="wiz-tip-higher"><strong>At Higher Levels.</strong> ${entriesToHtml(spell.entriesHigherLevel)}</p>` : '';
                tip.innerHTML = `<div class="wiz-tip-header"><span class="wiz-tip-name">${spell.name}</span><span class="wiz-tip-level">${spell._levelStr} ${spell._schoolName ? '— ' + spell._schoolName : ''}</span></div>
                  <div class="wiz-tip-meta">${spell._castTime || ''} | ${spell._rangeStr || ''} | ${spell._componentsStr || ''} | ${spell._durationStr || ''}</div>
                  <div class="wiz-tip-body">${typeof _highlightSpellKeywords === 'function' ? _highlightSpellKeywords(desc + higher) : desc + higher}</div>`;
                tip.style.display = 'block';
                _positionSpellTooltip(tip, e);
              });
              row.addEventListener('mousemove', (e) => { const tip = document.getElementById('wiz-spell-tooltip'); if (tip) _positionSpellTooltip(tip, e); });
              row.addEventListener('mouseleave', () => { const tip = document.getElementById('wiz-spell-tooltip'); if (tip) tip.style.display = 'none'; });
              row.querySelector('input').addEventListener('change', function () {
                if (this.checked) {
                  if (d._divineOrderCantrip) { this.checked = false; return; }
                  d._divineOrderCantrip = spell.name;
                } else {
                  d._divineOrderCantrip = null;
                }
                row.classList.toggle('selected', this.checked);
                renderDoCounter();
                renderDoList(document.getElementById(filterId)?.value);
              });
              el.appendChild(row);
            });
            renderDoCounter();
          };

          doCanFilter.addEventListener('input', function () { renderDoList(this.value); });
          renderDoList('');
        };

        DIVINE_ORDERS.forEach(order => {
          const checked = d._divineOrder === order.name;
          const card = document.createElement('label');
          card.className = 'wiz-order-card' + (checked ? ' selected' : '');
          card.innerHTML = `
            <input type="radio" name="wiz-divine-order" value="${order.name}" ${checked ? 'checked' : ''}>
            <div class="wiz-order-card-body">
              <div class="wiz-order-card-name">${order.name}</div>
              <div class="wiz-order-card-desc">${order.desc}</div>
            </div>`;
          card.querySelector('input').addEventListener('change', function () {
            d._divineOrder = this.value;
            doCards.querySelectorAll('.wiz-order-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            if (order.name !== 'Thaumaturge') d._divineOrderCantrip = null;
            renderDivineOrderCantripPicker();
          });
          doCards.appendChild(card);
        });

        skillDiv.appendChild(doSection);
        renderDivineOrderCantripPicker();
      }
    };
    if (window.setupAutocomplete) setupAutocomplete(input, 'class-list');
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
      renderBoxes((ab, score) => `<div class="wiz-ab-manual-row">
        <button class="wiz-pb-btn wiz-manual-btn" data-ab="${ab}" data-dir="-1"${(score ?? 10) <= 1 ? ' disabled' : ''}>−</button>
        <input type="number" class="wiz-ab-input" data-ab="${ab}" value="${score ?? 10}" placeholder="10" min="1" max="30">
        <button class="wiz-pb-btn wiz-manual-btn" data-ab="${ab}" data-dir="1"${(score ?? 10) >= 30 ? ' disabled' : ''}>+</button>
      </div>`);
      const refreshManualBtns = (ab) => {
        const box = boxesEl.querySelector(`.wiz-ab-box[data-ab="${ab}"]`);
        if (!box) return;
        const minus = box.querySelector('.wiz-manual-btn[data-dir="-1"]');
        const plus = box.querySelector('.wiz-manual-btn[data-dir="1"]');
        if (minus) minus.disabled = (d[ab] ?? 10) <= 1;
        if (plus) plus.disabled = (d[ab] ?? 10) >= 30;
      };
      boxesEl.querySelectorAll('.wiz-ab-input').forEach(inp => {
        inp.addEventListener('input', () => {
          d[inp.dataset.ab] = inp.value !== '' ? (parseInt(inp.value) || null) : null;
          refreshMod(inp.dataset.ab);
          refreshManualBtns(inp.dataset.ab);
        });
      });
      boxesEl.querySelectorAll('.wiz-manual-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const ab = btn.dataset.ab, dir = parseInt(btn.dataset.dir);
          const cur = d[ab] ?? 10;
          const nv = cur + dir;
          if (nv < 1 || nv > 30) return;
          d[ab] = nv;
          const inp = boxesEl.querySelector(`.wiz-ab-input[data-ab="${ab}"]`);
          if (inp) inp.value = nv;
          refreshMod(ab);
          refreshManualBtns(ab);
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
        const typeNames = { weaponMartial: 'any martial weapon', weaponSimple: 'any simple weapon', armorLight: 'any light armor', armorMedium: 'any medium armor', toolArtisan: 'any artisan tool', instrumentMusical: 'any musical instrument', setGaming: 'any gaming set' };
        // Resolve tool/instrument to specific choice if available
        if (it.equipmentType === 'instrumentMusical' && d._equipInstrumentChoice) {
          return (it.quantity ? `${it.quantity}× ` : '') + d._equipInstrumentChoice;
        }
        if (it.equipmentType === 'toolArtisan') {
          const artisanChoice = (d._classToolChoices || []).find((v, i) => v && d._classToolCategories?.[i] === 'artisan');
          if (artisanChoice) return (it.quantity ? `${it.quantity}× ` : '') + artisanChoice;
        }
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

    // Find which equipment choice row/key contains an instrumentMusical item
    let instrChoiceRow = -1;
    let instrChoiceKey = null;
    if (equip?.defaultData?.length) {
      equip.defaultData.forEach((row, i) => {
        if (row._) return;
        for (const [k, arr] of Object.entries(row)) {
          if (Array.isArray(arr) && arr.some(it => it?.equipmentType === 'instrumentMusical')) {
            instrChoiceRow = i;
            instrChoiceKey = k;
            break;
          }
        }
      });
    }
    const equipNeedsInstrument = instrChoiceRow >= 0;
    // Only show the instrument picker if the relevant option is currently selected
    const instrPickerVisible = equipNeedsInstrument && d[`_equipChoice_${instrChoiceRow}`] === instrChoiceKey;
    let instrumentPickerHtml = '';
    if (equipNeedsInstrument) {
      const EQUIP_INSTRUMENTS = ['Bagpipes', 'Bandore', 'Cittern', 'Drum', 'Dulcimer', 'Flute', 'Horn', 'Lute', 'Lyre', 'Pan Flute', 'Shawm', 'Viol', 'Yarting'];
      instrumentPickerHtml = `
        <div class="lu-section" style="margin-bottom:12px;${instrPickerVisible ? '' : 'display:none'}" id="wiz-equip-instrument-section">
          <div class="lu-section-title">Choose Your Musical Instrument</div>
          <select class="wiz-select" id="wiz-equip-instrument">
            <option value="">— Choose an instrument —</option>
            ${EQUIP_INSTRUMENTS.map(n => `<option value="${n}" ${d._equipInstrumentChoice === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>`;
    }

    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Starting Equipment</h2>
        <p class="wiz-desc">Choose your class equipment and add any additional items. You can always adjust your inventory later.</p>
        ${choicesHtml}
        ${instrumentPickerHtml}
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
            // Toggle instrument picker visibility based on whether the selected option contains an instrument
            if (i === instrChoiceRow) {
              const instrSection = document.getElementById('wiz-equip-instrument-section');
              if (instrSection) {
                instrSection.style.display = radio.value === instrChoiceKey ? '' : 'none';
                if (radio.value !== instrChoiceKey) d._equipInstrumentChoice = null;
              }
            }
          });
        });
      });
    }

    // Bind instrument picker for equipment
    const equipInstrSel = document.getElementById('wiz-equip-instrument');
    if (equipInstrSel) {
      equipInstrSel.addEventListener('change', function () {
        d._equipInstrumentChoice = this.value || null;
        // Re-render equipment choices to update labels that reference the instrument
        if (equip?.defaultData?.length) {
          equip.defaultData.forEach((row, i) => {
            const keys = Object.keys(row).filter(k => k !== '_');
            keys.forEach(k => {
              const label = container.querySelector(`#equip-choice-${i} input[value="${k}"]`);
              if (label) {
                const span = label.closest('.lu-asi-choice')?.querySelector('span');
                if (span) span.innerHTML = `<strong>(${k.toUpperCase()})</strong> ${formatItemList(row[k])}`;
              }
            });
          });
        }
      });
    }

    const spentGp = () => (d.inventory || []).reduce((sum, it) => sum + (it._valueCp || 0) / 100 * (it.qty || 1), 0);

    const updateGpSummary = () => {
      const spent = spentGp();
      const available = d.gp || 0;
      const remaining = available - spent;
      const el = document.getElementById('wiz-gp-summary');
      if (!el) return;
      el.innerHTML = `Spent: <strong>${spent.toFixed(2).replace(/\.00$/, '')} gp</strong> &nbsp;|&nbsp; Available: <strong>${available} gp</strong> &nbsp;|&nbsp; Remaining: <strong style="color:${remaining < 0 ? '#c0392b' : 'var(--gold)'}">${remaining.toFixed(2).replace(/\.00$/, '')} gp</strong>`;
    };

    const canAffordOneMore = (idx) => {
      const item = d.inventory[idx];
      const unitCp = item._valueCp || 0;
      const currentSpentCp = (d.inventory || []).reduce((sum, it) => sum + (it._valueCp || 0) * (it.qty || 1), 0);
      const availableCp = (d.gp || 0) * 100;
      return (currentSpentCp + unitCp) <= availableCp;
    };

    const renderList = () => {
      const list = document.getElementById('wiz-equip-list');
      list.innerHTML = (d.inventory || []).map((it, i) => {
        const incDisabled = !canAffordOneMore(i) ? 'disabled' : '';
        return `
        <div class="wiz-equip-item">
          <span class="wiz-equip-name">${it.name}${it.damage ? ' <span class="wiz-equip-dmg">(' + it.damage + ')</span>' : ''}</span>
          <span class="wiz-equip-price">${it.value || ''}</span>
          <div class="wiz-qty-ctrl">
            <button class="qty-btn qty-dec" data-idx="${i}">−</button>
            <input class="wiz-qty-input" type="number" min="1" data-idx="${i}" value="${it.qty || 1}">
            <button class="qty-btn qty-inc" data-idx="${i}" ${incDisabled}>+</button>
          </div>
          <button class="del-btn" data-idx="${i}">✕</button>
        </div>`;
      }).join('') || '<div class="wiz-hint">No items added yet</div>';
      list.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          d.inventory.splice(parseInt(btn.dataset.idx), 1);
          renderList();
          updateGpSummary();
        });
      });
      list.querySelectorAll('.qty-dec').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          if ((d.inventory[idx].qty || 1) > 1) {
            d.inventory[idx].qty = (d.inventory[idx].qty || 1) - 1;
            renderList();
          }
        });
      });
      list.querySelectorAll('.qty-inc').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          d.inventory[idx].qty = (d.inventory[idx].qty || 1) + 1;
          renderList();
        });
      });
      list.querySelectorAll('.wiz-qty-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const idx = parseInt(inp.dataset.idx);
          const val = parseInt(inp.value);
          const item = d.inventory[idx];
          const unitCp = item._valueCp || 0;
          const availableCp = (d.gp || 0) * 100;
          const otherSpentCp = (d.inventory || []).reduce((sum, it, j) => j === idx ? sum : sum + (it._valueCp || 0) * (it.qty || 1), 0);
          const maxQty = unitCp > 0 ? Math.max(1, Math.floor((availableCp - otherSpentCp) / unitCp)) : (isNaN(val) || val < 1 ? 1 : val);
          item.qty = (isNaN(val) || val < 1) ? 1 : Math.min(val, maxQty);
          inp.value = item.qty;
          renderList();
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
          const existing = (d.inventory || []).find(e => e.name === item.name);
          if (existing) {
            existing.qty = (existing.qty || 1) + 1;
          } else {
            d.inventory.push({ name: item.name, type: item._type, damage: item._dmgStr || '', mastery: (item.mastery || []).map(m => m.split('|')[0]).join(', '), properties: item._propStr || '', weight: item.weight || 0, value: item._valueStr || '', _valueCp: item.value || 0, ac: item.ac || 0, rarity: item.rarity || 'none', category: item._category, qty: 1 });
          }
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

    // Detect racial cantrips from species so we can grey them out
    const racialCantripNames = new Set();
    if (d._speciesInfo && typeof parseRacialSpells === 'function') {
      const _srObj = d.charSubrace ? d._speciesInfo.subraces?.find(sr => sr.name === d.charSubrace) : null;
      const _racialAddSpells = _srObj?.additionalSpells?.length
        ? _srObj.additionalSpells : (d._speciesInfo.additionalSpells || []);
      if (_racialAddSpells.length) {
        const _racialParsed = parseRacialSpells(_racialAddSpells, d.charSubrace || '', _srObj?.entries);
        (_racialParsed.cantrips || []).filter(Boolean).forEach(n => racialCantripNames.add(n.toLowerCase()));
      }
      // Fallback: scan species/subrace traits text for "{@spell X}" cantrip references
      // This catches species whose cantrip is described in traits but not in additionalSpells
      if (racialCantripNames.size === 0) {
        const traitsHtml = _srObj?.entries
          ? (Array.isArray(_srObj.entries) ? _srObj.entries : [_srObj.entries]).map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(' ')
          : (d._speciesInfo.traitsHtml || '');
        const cantripMatches = traitsHtml.matchAll(/\{@spell ([^|}]+)[^}]*\}/gi);
        for (const m of cantripMatches) {
          const spellName = m[1].trim().toLowerCase();
          // Only add if it's actually a cantrip in the spell data
          const isCantrip = cantrips.some(c => c.name.toLowerCase() === spellName);
          if (isCantrip) racialCantripNames.add(spellName);
        }
      }
    }

    // Spells already chosen via background feat or Divine Order — grey out in class spell list
    const featGrantedSpellNames = new Set();
    if (d._bgInfo?.featName && typeof ClassResources !== 'undefined') {
      const _fsc = ClassResources.FEAT_SPELL_CHOICES?.[d._bgInfo.featName];
      if (_fsc) {
        (_fsc.autoSpells || []).forEach(n => featGrantedSpellNames.add(n.toLowerCase()));
        (d._bgFeatChosenSpells || []).forEach(n => featGrantedSpellNames.add(n.toLowerCase()));
      }
    }
    // Thaumaturge extra cantrip
    if (d._divineOrderCantrip) featGrantedSpellNames.add(d._divineOrderCantrip.toLowerCase());

    // Class-auto-granted cantrips (excluded from cantrip picks)
    const classAutoCantrips = (ClassResources?.CLASS_AUTO_CANTRIPS?.[className] || []);
    const classGrantedCantripNames = new Set(classAutoCantrips.map(n => n.toLowerCase()));
    // Ensure class-granted cantrips are in d.charSpells so levelup and spell list know about them
    classAutoCantrips.forEach(name => {
      if (!d.charSpells.some(s => s.name === name && s.level === 0)) {
        d.charSpells.push({ name, level: 0, prepared: true, classGranted: true });
      }
    });

    // Determine limits from class data
    const classInfo = className ? getClassInfo(className) : null;
    let maxCantrips = classInfo?.cantripCount ?? null;
    // Thaumaturge (Cleric Divine Order) grants one extra cantrip
    if (d._divineOrder === 'Thaumaturge' && maxCantrips !== null) maxCantrips += 1;
    const isSpellbook = classInfo?.spellbookSpellsAtL1 != null;

    // Spell limit at level 1:
    // - Spellbook casters (Wizard): pick 6 spells for the spellbook
    // - Known casters (Bard, Sorcerer, Warlock, Ranger): fixed spellsKnown count
    // - Prepared casters (Cleric, Druid, Paladin): level + ability mod
    let maxSpells;
    if (isSpellbook) {
      maxSpells = classInfo.spellbookSpellsAtL1; // 6 for Wizard
    } else {
      maxSpells = classInfo?.spellsKnownAtL1 ?? null;
      // Prepared spells progression (2024 Bard, Sorcerer, Ranger, etc.)
      if (maxSpells === null && classInfo?.preparedSpellsProgression?.length) {
        maxSpells = classInfo.preparedSpellsProgression[0]; // level 1 value
      }
      if (maxSpells === null && classInfo?.preparedSpellsFormula) {
        const spellAb = classInfo.spellcastingAbility || 'int';
        const abScore = d[spellAb] || 10;
        const abMod = Math.floor((abScore - 10) / 2);
        maxSpells = 1 + abMod; // level 1 + ability mod
      }
    }
    // Never allow 0 or negative
    if (maxSpells !== null) maxSpells = Math.max(1, maxSpells);
    const maxPrepared = maxSpells; // alias for backward compat in renderCounter

    const countSelected = (level) => d.charSpells.filter(s => s.level === level && !s.racial && !s.classGranted).length;

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
    const spellSectionTitle = isSpellbook ? 'Spellbook' : '1st-Level Spells';
    const spellSectionHint = isSpellbook
      ? `(choose ${maxSpells} for your spellbook)`
      : maxSpells !== null ? `(choose ${maxSpells})` : '';
    const prepLabel = spellSectionHint
      ? `${spellSectionTitle} <small style="font-weight:normal;color:var(--ink-faint)">${spellSectionHint}</small>`
      : spellSectionTitle;
    // Compute final spellcasting ability score including background ASI (applied in finish())
    // so the description matches what the sheet will show after creation.
    const _spAbKey = classInfo?.spellcastingAbility || 'int';
    let _finalAbScore = d[_spAbKey] || 10;
    if (d._bgAsi) {
      const _clampAb = (s, n) => Math.min(20, s + n);
      const _bt = d._bgAsi.type;
      if (_bt === 'fixed' && d._bgInfo?.ability) {
        const { fixedBonus: _fb } = _parseBgAbility(d._bgInfo.ability);
        if (_fb[_spAbKey]) _finalAbScore = _clampAb(_finalAbScore, _fb[_spAbKey]);
      } else if (_bt === 'two_one') {
        if (d._bgAsi.twoAb === _spAbKey) _finalAbScore = _clampAb(_finalAbScore, 2);
        else if (d._bgAsi.oneAb === _spAbKey) _finalAbScore = _clampAb(_finalAbScore, 1);
      } else if (_bt === 'two_plus_one') {
        if (d._bgAsi.twoAb === _spAbKey || d._bgAsi.oneAb === _spAbKey) _finalAbScore = _clampAb(_finalAbScore, 1);
      } else if (_bt === 'all_three') {
        if ((d._bgAsi.threeAbs || []).includes(_spAbKey)) _finalAbScore = _clampAb(_finalAbScore, 1);
      }
    }
    const _preparedDescCount = Math.max(1, 1 + Math.floor((_finalAbScore - 10) / 2));
    const descText = isSpellbook
      ? `Choose ${maxCantrips || 3} cantrips and ${maxSpells} 1st-level spells for your ${className} spellbook. You can prepare up to ${_preparedDescCount} of these spells after a Long Rest (INT modifier + Wizard level).`
      : `Select cantrips and 1st-level spells for your ${className || 'class'}.`;

    container.innerHTML = `
      <div class="wiz-section">
        <h2 class="wiz-title">Choose Spells</h2>
        <p class="wiz-desc">${descText}</p>
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

    // Build subclass overlap map for warning badges (all subclasses of this class)
    const _wizScOverlapMap = (typeof LevelUp !== 'undefined' && typeof LevelUp._getSubclassOverlapMap === 'function')
      ? LevelUp._getSubclassOverlapMap(className) : new Map();

    const renderSpellList = (spellsToRender, containerId, level) => {
      const el = document.getElementById(containerId);
      if (!el) return;
      const max = level === 0 ? maxCantrips : maxPrepared;
      el.innerHTML = '';
      // Table header
      const header = document.createElement('div');
      header.className = 'wiz-spell-row wiz-spell-header';
      header.innerHTML = `
        <span class="wiz-spell-col-check"></span>
        <span class="wiz-spell-col-name">Name</span>
        <span class="wiz-spell-col-school">School</span>
        <span class="wiz-spell-col-cast">Casting Time</span>
        <span class="wiz-spell-col-range">Range</span>
        <span class="wiz-spell-col-comp">Components</span>
        <span class="wiz-spell-col-dur">Duration</span>`;
      el.appendChild(header);
      spellsToRender.forEach(spell => {
        const isClassGranted = level === 0 && classGrantedCantripNames.has(spell.name.toLowerCase());
        const isRacial = level === 0 && (racialCantripNames.has(spell.name.toLowerCase()) || isClassGranted);
        const isFeatGranted = featGrantedSpellNames.has(spell.name.toLowerCase());
        const isSelected = d.charSpells.some(s => s.name === spell.name);
        const atMax = max !== null && countSelected(level) >= max && !isSelected && !isFeatGranted;
        const isDisabled = isRacial || isFeatGranted || atMax;
        const row = document.createElement('label');
        row.className = 'wiz-spell-row' + (isSelected ? ' selected' : '') + (isDisabled ? ' disabled' : '');
        if (isDisabled) row.style.opacity = '0.45';
        const _wizWarnBadge = (typeof LevelUp !== 'undefined' && typeof LevelUp._subclassWarnBadge === 'function' && !isRacial && !isFeatGranted)
          ? LevelUp._subclassWarnBadge(_wizScOverlapMap, spell.name, '') : '';
        const _isDivineOrderCantrip = d._divineOrderCantrip && spell.name.toLowerCase() === d._divineOrderCantrip.toLowerCase();
        const _grantedLabel = isClassGranted ? '<small style="color:var(--ink-faint);white-space:nowrap">(from class)</small>'
          : _isDivineOrderCantrip ? '<small style="color:var(--ink-faint);white-space:nowrap">(from Divine Order)</small>'
          : isFeatGranted ? '<small style="color:var(--ink-faint);white-space:nowrap">(from feat)</small>'
          : isRacial ? '<small style="color:var(--ink-faint);white-space:nowrap">(from species)</small>' : '';
        row.innerHTML = `
          <span class="wiz-spell-col-check"><input type="checkbox" ${(isRacial || isFeatGranted) ? 'checked disabled' : (isSelected ? 'checked' : '')} ${atMax ? 'disabled' : ''}></span>
          <span class="wiz-spell-col-name"><span class="wiz-spell-col-name-text">${spell.name}</span>${spell.meta?.ritual ? '<span class="spell-badge spell-badge-ritual" title="Ritual">R</span>' : ''}${_wizWarnBadge}${_grantedLabel}</span>
          <span class="wiz-spell-col-school">${spell._schoolName || ''}</span>
          <span class="wiz-spell-col-cast">${spell._castTime || ''}</span>
          <span class="wiz-spell-col-range">${spell._rangeStr || ''}</span>
          <span class="wiz-spell-col-comp">${spell._componentsStr || ''}</span>
          <span class="wiz-spell-col-dur">${spell._durationStr || ''}</span>`;
        // Tooltip on hover
        row.addEventListener('mouseenter', (e) => {
          let tip = document.getElementById('wiz-spell-tooltip');
          if (!tip) {
            tip = document.createElement('div');
            tip.id = 'wiz-spell-tooltip';
            tip.className = 'wiz-spell-tooltip';
            document.body.appendChild(tip);
          }
          const desc = entriesToHtml(spell.entries || []);
          const higher = spell.entriesHigherLevel ? `<p class="wiz-tip-higher"><strong>At Higher Levels.</strong> ${entriesToHtml(spell.entriesHigherLevel)}</p>` : '';
          const header = `<div class="wiz-tip-header"><span class="wiz-tip-name">${spell.name}</span><span class="wiz-tip-level">${spell._levelStr} ${spell._schoolName ? '— ' + spell._schoolName : ''}</span></div>`;
          const meta = `<div class="wiz-tip-meta">${spell._castTime || ''} | ${spell._rangeStr || ''} | ${spell._componentsStr || ''} | ${spell._durationStr || ''}</div>`;
          tip.innerHTML = header + meta + '<div class="wiz-tip-body">' + _highlightSpellKeywords(desc + higher) + '</div>';
          tip.style.display = 'block';
          _positionSpellTooltip(tip, e);
        });
        row.addEventListener('mousemove', (e) => {
          const tip = document.getElementById('wiz-spell-tooltip');
          if (tip) _positionSpellTooltip(tip, e);
        });
        row.addEventListener('mouseleave', () => {
          const tip = document.getElementById('wiz-spell-tooltip');
          if (tip) tip.style.display = 'none';
        });
        row.querySelector('input').addEventListener('change', function () {
          if (isRacial || isFeatGranted) { this.checked = true; return; } // cannot toggle auto-granted spells
          if (this.checked) {
            if (max !== null && countSelected(level) >= max) { this.checked = false; return; }
            // Cantrips are always prepared; known=prepared classes auto-prepare all spells
            const autoPrepare = level === 0 || (typeof Sheet !== 'undefined' && Sheet._isKnownEqualsPrepared(className));
            d.charSpells.push({ name: spell.name, level, prepared: autoPrepare });
          } else {
            d.charSpells = d.charSpells.filter(s => s.name !== spell.name);
          }
          row.classList.toggle('selected', this.checked);
          renderCounter(level);
          const q = (level === 0
            ? document.getElementById('wiz-cantrip-filter')
            : document.getElementById('wiz-spell1-filter'))?.value.toLowerCase() || '';
          const filtered = (level === 0 ? cantrips : level1).filter(s => !q || s.name.toLowerCase().includes(q));
          renderSpellList(filtered, containerId, level);
        });
        if (typeof _attachSubclassWarnTooltip === 'function') _attachSubclassWarnTooltip(row);
        el.appendChild(row);
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
        const _speciesBase = (d.charSpecies || '').split(' — ')[0].trim().toLowerCase();
        if (o._requiresSpecies && o._requiresSpecies.toLowerCase() !== _speciesBase) return false;
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
          const wasSelected = idx >= 0;
          if (wasSelected) {
            d.charOptions.splice(idx, 1);
          } else {
            d.charOptions.push(opt.name);
          }
          if (preview) {
            preview.innerHTML = `<div class="wiz-preview-card">
              <h3>${opt.name} <span class="wiz-source">${opt._src}</span></h3>
              <div class="wiz-stat-row"><strong>${opt._typeName}</strong></div>
              <div class="wiz-traits">${(opt.description || '').replace(/\n/g, '<br>')}</div>
            </div>`;
          }
          // Clear search so the full list shows and the item is visible
          const searchEl = document.getElementById('wiz-opts-search');
          if (searchEl && searchEl.value) {
            searchEl.value = '';
          }
          renderList();
          updateChosen();
          // If we just selected, scroll to the item in the refreshed list
          if (!wasSelected) {
            const listEl = document.getElementById('wiz-opts-list');
            const target = listEl?.querySelector('.wiz-opts-item.selected');
            if (target) target.scrollIntoView({ block: 'nearest' });
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
            ${d._divineOrder ? `<div>Divine Order: <strong>${d._divineOrder}</strong></div>` : ''}
            <div>Level: <strong>${d.charLevel || 1}</strong></div>
            ${d._bgLanguages?.length ? `<div>Languages: <strong>${d._bgLanguages.join(', ')}</strong></div>` : ''}
          </div>
          <div class="wiz-review-card">
            <h4>Ability Scores</h4>
            ${(() => {
              // Compute background ASI bonuses for display
              const bgBonus = {};
              ABS.forEach(ab => { bgBonus[ab] = 0; });
              if (d._bgAsi) {
                const t = d._bgAsi.type;
                if (t === 'fixed' && d._bgInfo?.ability) {
                  const { fixedBonus: fb } = _parseBgAbility(d._bgInfo.ability);
                  for (const [k, v] of Object.entries(fb)) { if (bgBonus[k] !== undefined) bgBonus[k] = v; }
                } else if (t === 'two_one') {
                  if (d._bgAsi.twoAb) bgBonus[d._bgAsi.twoAb] = 2;
                  if (d._bgAsi.oneAb && d._bgAsi.oneAb !== d._bgAsi.twoAb) bgBonus[d._bgAsi.oneAb] = 1;
                } else if (t === 'two_plus_one') {
                  if (d._bgAsi.twoAb) bgBonus[d._bgAsi.twoAb] = 1;
                  if (d._bgAsi.oneAb && d._bgAsi.oneAb !== d._bgAsi.twoAb) bgBonus[d._bgAsi.oneAb] = 1;
                } else if (t === 'all_three') {
                  (d._bgAsi.threeAbs || []).forEach(ab => { bgBonus[ab] = 1; });
                }
              }
              return ABS.map(ab => {
                const base = d[ab] || 10;
                const bonus = bgBonus[ab] || 0;
                const total = Math.min(20, base + bonus);
                const bonusStr = bonus > 0 ? ` <span style="color:var(--green);font-size:0.85rem">+${bonus} BG</span>` : '';
                return `<div>${AB_NAMES[ab]}: <strong>${total}</strong> (${mod(total)})${bonusStr}</div>`;
              }).join('');
            })()}
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
          <div class="wiz-review-card">
            ${(() => {
              const bgSkills = new Set(Object.keys(d._bgInfo?.skillProf || {}).map(_normalizeSkillKey));
              const classSkills = new Set((d._classSkillChoices || []).map(_normalizeSkillKey));
              const speciesFixedSkills = new Set();
              (d._speciesInfo?.skillProficiencies || []).forEach(sp => {
                Object.keys(sp).forEach(sk => { if (sp[sk] === true) { const k = _normalizeSkillKey(sk); if (k) speciesFixedSkills.add(k); } });
              });
              (d._speciesSkillChoices || []).forEach(sk => { const k = _normalizeSkillKey(sk); if (k) speciesFixedSkills.add(k); });
              const allSkills = [...new Set([...bgSkills, ...classSkills, ...speciesFixedSkills])].sort();
              const _reviewScWarnings = _SUBCLASS_SKILL_WARNINGS[d.charClass] || [];
              const rows = allSkills.map(sk => {
                const label = _skillLabel(sk);
                const sources = [
                  speciesFixedSkills.has(sk) ? 'species' : null,
                  bgSkills.has(sk) ? 'background' : null,
                  classSkills.has(sk) ? 'class' : null,
                ].filter(Boolean);
                const tag = sources.length ? ` <span class="wiz-review-skill-tag">${sources.join(' &amp; ')}</span>` : '';
                const scWarn = _reviewScWarnings.find(w => w.skill === sk);
                const warnTag = scWarn && classSkills.has(sk) ? ` <span class="wiz-review-skill-tag wiz-sc-warn-tag" title="${scWarn.subclass} grants this via ${scWarn.feature} at level ${scWarn.level}">⚠ ${scWarn.subclass} L${scWarn.level}</span>` : '';
                return `<div>• ${label}${tag}${warnTag}</div>`;
              }).join('');
              return `<h4>Skill Proficiencies (${allSkills.length})</h4>${rows || '<div>None</div>'}`;
            })()}
          </div>
        </div>
      </div>`;

    document.getElementById('wiz-char-name')?.addEventListener('input', function () { d.charName = this.value; });
  },
};
