/* =============================================
   CLASS, SPECIES & FEAT RESOURCE AUTO-POPULATION
   Defines resource tables for all classes and
   helper functions for wizard + level-up integration
   ============================================= */
'use strict';

window.ClassResources = {

  /* ================================================================
     WEAPON MASTERY TABLES — { level, count } per class
     ================================================================ */
  WEAPON_MASTERY_TABLE: {
    Barbarian: [{ level: 1, count: 2 }, { level: 4, count: 3 }, { level: 10, count: 4 }],
    Fighter:   [{ level: 1, count: 3 }, { level: 4, count: 4 }, { level: 10, count: 5 }],
    Paladin:   [{ level: 1, count: 2 }, { level: 4, count: 3 }],
    Ranger:    [{ level: 1, count: 2 }, { level: 4, count: 3 }],
    Rogue:     [{ level: 1, count: 2 }, { level: 5, count: 3 }],
  },

  // Classes that can choose ranged weapons for mastery (not just melee)
  RANGED_MASTERY_CLASSES: ['Fighter', 'Ranger', 'Rogue'],

  /* ================================================================
     RAGE TABLE — Barbarian rage uses and damage by level
     ================================================================ */
  RAGE_TABLE: [
    { level: 1,  uses: 2, damage: 2 },
    { level: 3,  uses: 3, damage: 2 },
    { level: 6,  uses: 4, damage: 2 },
    { level: 9,  uses: 4, damage: 3 },
    { level: 12, uses: 5, damage: 3 },
    { level: 17, uses: 6, damage: 4 },
    { level: 20, uses: 99, damage: 4 }, // Unlimited
  ],

  /* ================================================================
     CLASS RESOURCE DEFINITIONS
     Each class has an array of resource entries. Each entry:
       name       : display name
       maxAt      : array of { level, max } — max uses at each threshold
                    OR a string like 'PB' for proficiency bonus, 'LEVEL' for class level
       refresh    : 'sr' | 'lr' | 'dawn' | 'manual'
       startLevel : level at which this resource is gained (default 1)
       notes      : optional flavor text
     ================================================================ */
  CLASS_RESOURCES: {
    Barbarian: [
      { name: 'Rage', maxAt: [
        { level: 1, max: 2 }, { level: 3, max: 3 }, { level: 6, max: 4 },
        { level: 9, max: 4 }, { level: 12, max: 5 }, { level: 17, max: 6 },
        { level: 20, max: 99 },
      ], refresh: 'lr', startLevel: 1 },
    ],
    Bard: [
      { name: 'Bardic Inspiration', maxAt: 'PB', refresh: 'lr', startLevel: 1 },
    ],
    Cleric: [
      { name: 'Channel Divinity', maxAt: [
        { level: 1, max: 1 }, { level: 6, max: 2 }, { level: 18, max: 3 },
      ], refresh: 'sr', startLevel: 1 },
      { name: 'Divine Intervention', maxAt: [{ level: 17, max: 1 }], refresh: 'lr', startLevel: 17 },
    ],
    Druid: [
      { name: 'Wild Shape', maxAt: 'PB', refresh: 'lr', startLevel: 2 },
    ],
    Fighter: [
      { name: 'Second Wind', maxAt: [{ level: 1, max: 1 }], refresh: 'sr', startLevel: 1 },
      { name: 'Action Surge', maxAt: [
        { level: 2, max: 1 }, { level: 17, max: 2 },
      ], refresh: 'sr', startLevel: 2 },
      { name: 'Indomitable', maxAt: [
        { level: 9, max: 1 }, { level: 13, max: 2 }, { level: 17, max: 3 },
      ], refresh: 'lr', startLevel: 9 },
    ],
    Monk: [
      { name: 'Discipline Points', maxAt: 'LEVEL', refresh: 'sr', startLevel: 2 },
    ],
    Paladin: [
      { name: 'Lay on Hands', maxAt: 'LEVELx5', refresh: 'lr', startLevel: 2 },
      { name: 'Channel Divinity', maxAt: [{ level: 3, max: 2 }], refresh: 'sr', startLevel: 3 },
    ],
    Ranger: [
      // Ranger has no tracked limited-use features at low levels in 2024
      { name: 'Foe Slayer', maxAt: [{ level: 20, max: 1 }], refresh: 'lr', startLevel: 20 },
    ],
    Rogue: [
      { name: 'Stroke of Luck', maxAt: [{ level: 20, max: 1 }], refresh: 'lr', startLevel: 20 },
    ],
    Sorcerer: [
      { name: 'Sorcery Points', maxAt: 'LEVEL', refresh: 'lr', startLevel: 2 },
      { name: 'Innate Sorcery', maxAt: [{ level: 2, max: 1 }], refresh: 'lr', startLevel: 2 },
    ],
    Warlock: [
      // Warlock spell slots refresh on SR — handled specially in combat.js
      // Mystic Arcanum: one use per LR per level 6/7/8/9
      { name: 'Mystic Arcanum (6th)', maxAt: [{ level: 11, max: 1 }], refresh: 'lr', startLevel: 11 },
      { name: 'Mystic Arcanum (7th)', maxAt: [{ level: 13, max: 1 }], refresh: 'lr', startLevel: 13 },
      { name: 'Mystic Arcanum (8th)', maxAt: [{ level: 15, max: 1 }], refresh: 'lr', startLevel: 15 },
      { name: 'Mystic Arcanum (9th)', maxAt: [{ level: 17, max: 1 }], refresh: 'lr', startLevel: 17 },
      { name: 'Eldritch Master', maxAt: [{ level: 20, max: 1 }], refresh: 'lr', startLevel: 20 },
    ],
    Wizard: [
      { name: 'Arcane Recovery', maxAt: [{ level: 2, max: 1 }], refresh: 'lr', startLevel: 2,
        usableOnShortRest: true },
    ],
  },

  /* ================================================================
     SUBCLASS RESOURCE DEFINITIONS
     Key format: "ClassName:SubclassName"
     ================================================================ */
  SUBCLASS_RESOURCES: {
    'Barbarian:Path of the Berserker': [
      { name: 'Intimidating Presence', maxAt: [{ level: 14, max: 1 }], refresh: 'lr', startLevel: 14 },
    ],
    'Fighter:Battle Master': [
      { name: 'Superiority Dice', maxAt: [
        { level: 3, max: 4 }, { level: 7, max: 5 }, { level: 15, max: 6 },
      ], refresh: 'sr', startLevel: 3 },
    ],
    'Sorcerer:Wild Magic': [
      { name: 'Tides of Chaos', maxAt: [{ level: 1, max: 1 }], refresh: 'lr', startLevel: 1 },
    ],
    'Sorcerer:Draconic Bloodline': [],
    'Warlock:The Fiend': [],
    'Warlock:The Archfey': [],
    'Wizard:School of Evocation': [],
    'Wizard:School of Divination': [
      { name: 'Portent', maxAt: [
        { level: 2, max: 2 }, { level: 14, max: 3 },
      ], refresh: 'lr', startLevel: 2 },
    ],
    'Paladin:Oath of Devotion': [],
    'Paladin:Oath of the Ancients': [],
  },

  /* ================================================================
     SPECIES RESOURCE DEFINITIONS
     ================================================================ */
  SPECIES_RESOURCES: {
    'Dragonborn': [
      { name: 'Breath Weapon', maxAt: 'PB', refresh: 'lr' },
    ],
    'Chromatic Dragonborn': [
      { name: 'Breath Weapon', maxAt: 'PB', refresh: 'lr' },
    ],
    'Metallic Dragonborn': [
      { name: 'Breath Weapon', maxAt: 'PB', refresh: 'lr' },
    ],
    'Gem Dragonborn': [
      { name: 'Breath Weapon', maxAt: 'PB', refresh: 'lr' },
      { name: 'Gem Flight', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Tiefling': [
      { name: 'Fiendish Legacy', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Half-Orc': [
      { name: 'Relentless Endurance', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Orc': [
      { name: 'Relentless Endurance', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Aasimar': [
      { name: 'Healing Hands', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Goliath': [
      { name: "Stone's Endurance", maxAt: 'PB', refresh: 'lr' },
    ],
    'Githyanki': [
      { name: 'Astral Knowledge', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Githzerai': [
      { name: 'Psychic Resilience', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
  },

  /* ================================================================
     ORIGIN FEAT RESOURCE DEFINITIONS
     ================================================================ */
  FEAT_RESOURCES: {
    'Lucky': [
      { name: 'Luck Points', maxAt: 'PB', refresh: 'lr' },
    ],
    'Magic Initiate': [
      { name: 'Magic Initiate Spell', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Healer': [
      { name: 'Healer', maxAt: [{ level: 1, max: 1 }], refresh: 'sr' },
    ],
    'Fey-Touched': [
      { name: 'Fey-Touched: Misty Step', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
      { name: 'Fey-Touched: Bonus Spell', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Bloodlust': [
      { name: 'Sanguine Feast', maxAt: 'PB', refresh: 'lr' },
    ],
    'Delicious Pain': [
      { name: 'Toughened Flesh', maxAt: [{ level: 1, max: 1 }], refresh: 'sr' },
    ],
  },

  /* ================================================================
     FEAT SPELL CHOICES — defines what sub-picks each feat requires.
     Used by the spell picker UI in sheet.js and levelup.js.
     ================================================================ */
  FEAT_SPELL_CHOICES: {
    'Magic Initiate': {
      requireClassPick: true,
      classOptions: ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'],
      picks: [
        { label: 'Cantrips', count: 2, level: 0, filter: 'class' },
        { label: 'Level 1 Spell', count: 1, level: 1, filter: 'class' },
      ],
    },
    'Fey-Touched': {
      autoSpells: ['Misty Step'],
      picks: [
        { label: 'Level 1 Divination or Enchantment', count: 1, level: 1, filter: 'school', schools: ['D', 'E'] },
      ],
    },
    'Shadow-Touched': {
      autoSpells: ['Invisibility'],
      picks: [
        { label: 'Level 1 Illusion or Necromancy', count: 1, level: 1, filter: 'school', schools: ['I', 'N'] },
      ],
    },
    'Ritual Caster': {
      picks: [
        { label: 'Level 1 Ritual Spells', count: 2, level: 1, filter: 'classAndRitual', classOptions: ['Cleric', 'Druid', 'Wizard'] },
      ],
    },
    'Spell Sniper': {
      picks: [
        { label: 'Cantrip (attack roll)', count: 1, level: 0, filter: 'classAndAttackRoll', classOptions: ['Cleric', 'Druid', 'Wizard'] },
      ],
    },
  },

  /**
   * Get the filtered spell pool for a feat pick definition.
   */
  getFeatSpellPool(pickDef, chosenClass) {
    if (!DndData?.spells?.length) return [];
    let pool = DndData.spells.filter(s => s.level === pickDef.level);

    if (pickDef.filter === 'class') {
      if (!chosenClass) return [];
      const classSpells = typeof getSpellsForClass === 'function' ? getSpellsForClass(chosenClass) : [];
      const classNames = new Set(classSpells.map(s => s.name.toLowerCase()));
      pool = pool.filter(s => classNames.has(s.name.toLowerCase()));
    } else if (pickDef.filter === 'school') {
      pool = pool.filter(s => pickDef.schools.includes(s.school));
    } else if (pickDef.filter === 'classAndRitual') {
      const allClassSpells = new Set();
      (pickDef.classOptions || []).forEach(cls => {
        (typeof getSpellsForClass === 'function' ? getSpellsForClass(cls) : [])
          .forEach(s => allClassSpells.add(s.name.toLowerCase()));
      });
      pool = pool.filter(s => allClassSpells.has(s.name.toLowerCase()));
      pool = pool.filter(s => s.meta && s.meta.ritual);
    } else if (pickDef.filter === 'classAndAttackRoll') {
      const allClassSpells = new Set();
      (pickDef.classOptions || []).forEach(cls => {
        (typeof getSpellsForClass === 'function' ? getSpellsForClass(cls) : [])
          .forEach(s => allClassSpells.add(s.name.toLowerCase()));
      });
      pool = pool.filter(s => allClassSpells.has(s.name.toLowerCase()));
      pool = pool.filter(s => {
        const text = JSON.stringify(s.entries || []);
        return /{@atk\s/.test(text);
      });
    }

    return pool.sort((a, b) => a.name.localeCompare(b.name));
  },

  /* ================================================================
     PREPARED SPELL CLASSES — classes that change prepared spells on LR
     ================================================================ */
  PREPARED_SPELL_CLASSES: ['Wizard', 'Cleric', 'Druid', 'Paladin'],

  /* ================================================================
     HELPER FUNCTIONS
     ================================================================ */

  /** Get proficiency bonus for a given level */
  _profBonus(level) {
    return Math.floor(((parseInt(level) || 1) - 1) / 4) + 2;
  },

  /** Resolve a maxAt definition to a concrete number for a given level */
  _resolveMax(maxAt, level, className) {
    if (maxAt === 'PB') return this._profBonus(level);
    if (maxAt === 'LEVEL') return Math.max(1, parseInt(level) || 1);
    if (maxAt === 'LEVELx5') return (Math.max(1, parseInt(level) || 1)) * 5;
    if (Array.isArray(maxAt)) {
      let result = 0;
      for (const entry of maxAt) {
        if (level >= entry.level) result = entry.max;
      }
      return result;
    }
    return parseInt(maxAt) || 1;
  },

  /** Get weapon mastery slot count for a class at a given level */
  getMasterySlots(className, level) {
    const table = this.WEAPON_MASTERY_TABLE[className];
    if (!table) return 0;
    let slots = 0;
    for (const entry of table) {
      if (level >= entry.level) slots = entry.count;
    }
    return slots;
  },

  /** Whether this class can choose ranged weapons for mastery */
  allowsRangedMastery(className) {
    return this.RANGED_MASTERY_CLASSES.includes(className);
  },

  /** Get Barbarian rage damage bonus for a given level */
  getRageDamageBonus(level) {
    let damage = 0;
    for (const entry of this.RAGE_TABLE) {
      if (level >= entry.level) damage = entry.damage;
    }
    return damage;
  },

  /**
   * Get all resources a class should have at a given level.
   * Returns [{name, max, used, refresh, notes?}]
   */
  getClassResources(className, level) {
    const defs = this.CLASS_RESOURCES[className] || [];
    const resources = [];
    for (const def of defs) {
      const startLevel = def.startLevel || 1;
      if (level < startLevel) continue;
      const max = this._resolveMax(def.maxAt, level, className);
      if (max <= 0) continue;
      resources.push({
        name: def.name,
        max,
        used: 0,
        refresh: def.refresh,
        ...(def.usableOnShortRest && { usableOnShortRest: true }),
      });
    }
    return resources;
  },

  /**
   * Get subclass resources at a given level.
   */
  getSubclassResources(className, subclassName, level) {
    const key = `${className}:${subclassName}`;
    const defs = this.SUBCLASS_RESOURCES[key] || [];
    const resources = [];
    for (const def of defs) {
      if (level < (def.startLevel || 1)) continue;
      const max = this._resolveMax(def.maxAt, level, className);
      if (max <= 0) continue;
      resources.push({ name: def.name, max, used: 0, refresh: def.refresh });
    }
    return resources;
  },

  /**
   * Get species resources.
   */
  getSpeciesResources(speciesName, level) {
    // Try exact match, then try stripping suffixes
    let defs = this.SPECIES_RESOURCES[speciesName];
    if (!defs) {
      // Try matching partial name (e.g. "Chromatic Dragonborn" from "Dragonborn (Chromatic)")
      for (const [key, val] of Object.entries(this.SPECIES_RESOURCES)) {
        if (speciesName.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(speciesName.toLowerCase())) {
          defs = val;
          break;
        }
      }
    }
    if (!defs) return [];
    const resources = [];
    for (const def of defs) {
      const max = this._resolveMax(def.maxAt, level);
      if (max <= 0) continue;
      resources.push({ name: def.name, max, used: 0, refresh: def.refresh });
    }
    return resources;
  },

  /**
   * Get feat resources.
   */
  getFeatResources(featName, level) {
    const lvl = parseInt(level) || (typeof CharStore !== 'undefined' ? parseInt(CharStore.lv('charLevel', 1)) : 1);
    // Try exact match then partial
    let defs = this.FEAT_RESOURCES[featName];
    if (!defs) {
      for (const [key, val] of Object.entries(this.FEAT_RESOURCES)) {
        if (featName.toLowerCase().includes(key.toLowerCase())) {
          defs = val;
          break;
        }
      }
    }
    if (!defs) return [];
    return defs.map(def => ({
      name: def.name,
      max: this._resolveMax(def.maxAt, lvl),
      used: 0,
      refresh: def.refresh,
    }));
  },

  /**
   * Add starting resources to a wizard draft object.
   * Called from wizard.js finish().
   */
  addStartingResources(draft) {
    if (!draft.resources) draft.resources = [];
    const level = parseInt(draft.charLevel) || 1;
    const className = draft.charClass || '';
    const subclassName = draft.charSubclass || '';
    const speciesName = draft.charSpecies || '';

    // Class resources
    const classRes = this.getClassResources(className, level);
    classRes.forEach(r => {
      if (!draft.resources.some(x => x.name === r.name)) draft.resources.push(r);
    });

    // Subclass resources
    if (subclassName) {
      const subRes = this.getSubclassResources(className, subclassName, level);
      subRes.forEach(r => {
        if (!draft.resources.some(x => x.name === r.name)) draft.resources.push(r);
      });
    }

    // Species resources
    if (speciesName) {
      const specRes = this.getSpeciesResources(speciesName, level);
      specRes.forEach(r => {
        if (!draft.resources.some(x => x.name === r.name)) draft.resources.push(r);
      });
    }

    // Feat resources (from feats array — supports string or {name} objects)
    (draft.feats || []).forEach(f => {
      const fn = typeof f === 'string' ? f : f.name;
      const featRes = this.getFeatResources(fn);
      featRes.forEach(r => {
        if (!draft.resources.some(x => x.name === r.name)) draft.resources.push(r);
      });
    });

    // Barbarian rage damage bonus
    if (className === 'Barbarian') {
      draft.rageDamageBonus = this.getRageDamageBonus(level);
    }
  },

  /**
   * Update resources on level-up.
   * Called from levelup.js confirm().
   * Updates existing resource max values and adds new resources gained at newLevel.
   */
  updateResourcesOnLevelUp(newLevel) {
    const className = CharStore.lv('charClass', '');
    const subclassName = CharStore.lv('charSubclass', '');
    const speciesName = CharStore.lv('charSpecies', '');
    const resources = CharStore.lv('resources', []) || [];

    // Get what resources SHOULD exist at newLevel
    const targetClassRes = this.getClassResources(className, newLevel);
    const targetSubRes = subclassName ? this.getSubclassResources(className, subclassName, newLevel) : [];
    const targetSpecRes = speciesName ? this.getSpeciesResources(speciesName, newLevel) : [];
    const feats = CharStore.lv('feats', []) || [];
    const targetFeatRes = feats.flatMap(f => this.getFeatResources(typeof f === 'string' ? f : f.name, newLevel));
    const allTarget = [...targetClassRes, ...targetSubRes, ...targetSpecRes, ...targetFeatRes];

    // Update existing or add new
    for (const target of allTarget) {
      const existing = resources.find(r => r.name === target.name);
      if (existing) {
        // Update max if it changed
        if (existing.max !== target.max) {
          existing.max = target.max;
          // Don't reset used count — player may have used some already
          existing.used = Math.min(existing.used, existing.max);
        }
        // Update refresh if it changed
        if (target.refresh && existing.refresh !== target.refresh) {
          existing.refresh = target.refresh;
        }
      } else {
        // New resource gained at this level
        resources.push(target);
      }
    }

    CharStore.sv('resources', resources);

    // Barbarian rage damage bonus
    if (className === 'Barbarian') {
      CharStore.sv('rageDamageBonus', this.getRageDamageBonus(newLevel));
    }
  },

  /**
   * Detect magic item charges from item text entries.
   * Returns { max, refresh, rechargeRoll } or null if no charges detected.
   */
  detectItemCharges(item) {
    if (!item) return null;
    // Flatten entries text
    const text = (function flatten(entries) {
      if (!entries) return '';
      return entries.map(e => {
        if (typeof e === 'string') return e;
        if (e.entries) return flatten(e.entries);
        if (e.items) return flatten(e.items);
        return '';
      }).join(' ');
    })(item.entries);

    if (!text) return null;

    // Pattern: "X charges" ... "regains" ... "Y" ... "at dawn"
    const chargeMatch = text.match(/(\d+)\s+charges/i);
    if (chargeMatch) {
      const max = parseInt(chargeMatch[1]);
      const dawnMatch = text.match(/regains?\s+(?:(\d+d\d+(?:\s*[+-]\s*\d+)?)|(\d+))\s+(?:expended\s+)?charges?\s+(?:daily\s+)?at\s+dawn/i);
      if (dawnMatch) {
        return {
          max,
          refresh: 'dawn',
          rechargeRoll: dawnMatch[1] || dawnMatch[2],
        };
      }
      // Check for long rest recharge
      if (/long rest/i.test(text)) {
        return { max, refresh: 'lr' };
      }
      // Default charges to dawn
      return { max, refresh: 'dawn' };
    }

    // "once per long rest" or "once per day"
    if (/once\s+per\s+(long\s+rest|day)/i.test(text)) {
      return { max: 1, refresh: 'lr' };
    }
    if (/once\s+per\s+short\s+rest/i.test(text)) {
      return { max: 1, refresh: 'sr' };
    }

    return null;
  },
};
