/* =============================================
   CLASS, SPECIES & FEAT RESOURCE AUTO-POPULATION
   Defines resource tables for all classes and
   helper functions for wizard + level-up integration
   ============================================= */
'use strict';

window.ClassResources = {

  /* ================================================================
     RESOURCE DESCRIPTIONS — level-aware tooltips for limited resources.
     Each entry: { text, die?, dieAt? }
       text    : base description
       die     : if present, a die that scales with level
       dieAt   : array of { level, die } for scaling
     ================================================================ */
  RESOURCE_DESCRIPTIONS: {
    'Rage': {
      text: 'You can enter a Rage as a Bonus Action. While raging you have advantage on Strength checks and saving throws, gain a bonus to melee damage, and have resistance to Bludgeoning, Piercing, and Slashing damage. Rage lasts for 1 minute.',
      extra: [
        { level: 1, note: 'Rage damage at current level: +2' }, { level: 9, note: 'Rage damage at current level: +3' }, { level: 17, note: 'Rage damage at current level: +4' },
      ],
    },
    'Bardic Inspiration': {
      text: 'You can use a Bonus Action to inspire a creature within 60 feet that can hear you. It gains a Bardic Inspiration die it can add to one ability check, attack roll, or saving throw in the next 10 minutes.',
      extra: [
        { level: 1, note: 'Inspiration die at current level: d6' }, { level: 5, note: 'Inspiration die at current level: d8' },
        { level: 10, note: 'Inspiration die at current level: d10' }, { level: 15, note: 'Inspiration die at current level: d12' },
      ],
    },
    'Channel Divinity': {
      text: 'You can channel divine energy to fuel magical effects. You start with Turn Undead and gain additional options from your subclass.',
    },
    'Wild Shape': {
      text: 'As a Bonus Action, you can magically assume the shape of a beast you have seen before. You can stay in beast shape for a number of hours equal to half your Druid level (rounded down).',
    },
    'Second Wind': {
      text: 'On your turn, you can use a Bonus Action to regain Hit Points equal to 1d10 + your Fighter level.',
    },
    'Action Surge': {
      text: 'On your turn, you can take one additional action. Once used, you must finish a Short or Long Rest before using it again.',
    },
    'Indomitable': {
      text: 'You can reroll a saving throw that you fail. You must use the new roll.',
    },
    'Discipline Points': {
      text: 'You have a pool of Discipline Points (formerly Ki Points) used to fuel various Monk features like Flurry of Blows, Patient Defense, and Step of the Wind.',
    },
    'Lay on Hands': {
      text: 'You have a pool of healing power that replenishes on a Long Rest. As an action, you can touch a creature and restore Hit Points from this pool, or spend 5 points to cure a disease or neutralize a poison.',
    },
    'Sorcery Points': {
      text: 'You have a pool of Sorcery Points used to create spell slots, fuel Metamagic options, and power other Sorcerer features.',
    },
    'Innate Sorcery': {
      text: 'As a Bonus Action, you awaken your innate magic for 1 minute. While active, your spell save DC increases by 1 and you have Advantage on attack rolls of Sorcerer spells.',
    },
    'Superiority Dice': {
      text: 'You have Superiority Dice (d8s, upgrading to d10s at 10th and d12s at 18th level) used to fuel Battle Master Maneuvers. You add the die roll to the maneuver effect.',
      extra: [
        { level: 3, note: 'Superiority die at current level: d8' }, { level: 10, note: 'Superiority die at current level: d10' }, { level: 18, note: 'Superiority die at current level: d12' },
      ],
    },
    'Portent': {
      text: 'After a Long Rest, roll two d20s and record the numbers. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these foretelling rolls.',
    },
    'Arcane Recovery': {
      text: 'During a Short Rest, you can recover expended spell slots with a combined level equal to no more than half your Wizard level (rounded up). None of the slots can be 6th level or higher.',
    },
    'Tides of Chaos': {
      text: 'You can gain Advantage on one attack roll, ability check, or saving throw. Once used, you must finish a Long Rest before using again — unless you trigger a Wild Magic Surge.',
    },
    'Luck Points': {
      text: 'You have Luck Points you can spend to roll an additional d20 on an attack roll, ability check, or saving throw — then choose which d20 to use. You can also spend a point when attacked to roll a d20; if higher than the attack roll, the attack misses.',
    },
    'Breath Weapon': {
      text: 'You can use your Breath Weapon as an action. Each creature in the area must make a saving throw. The damage and area are determined by your Draconic Ancestry.',
    },
    'Relentless Endurance': {
      text: 'When you are reduced to 0 Hit Points but not killed outright, you drop to 1 Hit Point instead.',
    },
    'Starlight Step': {
      text: 'As a Bonus Action, you can magically teleport up to 30 feet to an unoccupied space you can see.',
    },
    'Astral Trance': {
      text: "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours in a trancelike meditation. After each trance, you gain proficiency in one skill and one weapon or tool of your choice until your next Long Rest.",
    },
    'Healing Hands': {
      text: 'As an action, you can touch a creature and restore a number of Hit Points equal to your Proficiency Bonus. Once used, you must finish a Long Rest to use it again.',
    },
    "Stone's Endurance": {
      text: 'When you take damage, you can use your Reaction to roll a d12 + your Constitution modifier and reduce the damage by that amount.',
    },
    'Fiendish Legacy': {
      text: 'You can cast a spell granted by your Fiendish Legacy once without a spell slot. You regain this ability after a Long Rest.',
    },
    'Magic Initiate Spell': {
      text: 'You can cast the 1st-level spell you chose from the Magic Initiate feat once without expending a spell slot. You regain the ability to cast it in this way after a Long Rest.',
    },
    'Fey-Touched: Misty Step': {
      text: 'You can cast Misty Step once without expending a spell slot. You regain the ability after a Long Rest.',
    },
    'Fey-Touched': {
      text: 'You can cast this spell once without expending a spell slot (chosen from Divination or Enchantment when you took the feat). You regain the ability after a Long Rest.',
    },
    'Metamagic Sorcery Points': {
      text: 'You have a pool of Sorcery Points used to fuel Metamagic options. You can spend these points to modify your spells in various ways (e.g. Twinned Spell, Quickened Spell, Subtle Spell).',
    },
    'Phantasmal Creatures (Free Cast)': {
      text: 'Once per Long Rest, you can cast Summon Beast or Summon Fey without expending a spell slot. The spell automatically uses an Illusion version of the creature.',
    },
    'Illusory Self': {
      text: 'When a creature makes an attack roll against you, you can use your Reaction to interpose an illusory duplicate. The attack automatically misses. Once used, you must finish a Short or Long Rest before using it again.',
    },
  },

  /**
   * Get a level-aware description for a resource.
   * Returns a string (plain text) or null if no description is found.
   */
  getResourceDescription(resourceName, level) {
    // Try exact match, then try base name without parenthetical
    let desc = this.RESOURCE_DESCRIPTIONS[resourceName];
    if (!desc) {
      const noParens = resourceName.replace(/\s*\(.*\)$/, '').trim();
      const afterColon = noParens.replace(/^.+?:\s*/, '').trim();
      const beforeColon = noParens.includes(':') ? noParens.split(':')[0].trim() : null;
      desc = this.RESOURCE_DESCRIPTIONS[afterColon]
          || (beforeColon && this.RESOURCE_DESCRIPTIONS[beforeColon])
          || null;
    }
    if (!desc) return null;

    let text = desc.text;
    // Find the highest applicable level note
    if (desc.extra?.length && level) {
      let best = null;
      for (const e of desc.extra) {
        if (level >= e.level) best = e;
      }
      if (best) text += `\n\n${best.note}`;
    }
    return text;
  },

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
      { name: 'Bardic Inspiration', maxAt: 'PB', refresh: 'lr', refreshAt: [{ level: 5, refresh: 'sr' }], startLevel: 1 },
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
    'Wizard:Evoker': [],
    'Wizard:School of Divination': [
      { name: 'Portent', maxAt: [
        { level: 2, max: 2 }, { level: 14, max: 3 },
      ], refresh: 'lr', startLevel: 2 },
    ],
    'Wizard:Diviner': [
      { name: 'Portent', maxAt: [
        { level: 2, max: 2 }, { level: 14, max: 3 },
      ], refresh: 'lr', startLevel: 2 },
    ],
    'Bard:College of Spirits': [
      { name: 'Spirit Guardians (Free Cast)', maxAt: [{ level: 6, max: 1 }], refresh: 'lr', startLevel: 6 },
      { name: 'Modified Spirit Guardians', maxAt: [{ level: 6, max: 1 }], refresh: 'sr', startLevel: 6 },
    ],
    'Paladin:Oath of Devotion': [],
    'Paladin:Oath of the Ancients': [],
    'Wizard:Illusionist': [
      { name: 'Phantasmal Creatures (Free Cast)', maxAt: [{ level: 6, max: 1 }], refresh: 'lr', startLevel: 6 },
      { name: 'Illusory Self', maxAt: [{ level: 10, max: 1 }], refresh: 'sr', startLevel: 10 },
    ],
    'Wizard:School of Illusion': [
      { name: 'Phantasmal Creatures (Free Cast)', maxAt: [{ level: 6, max: 1 }], refresh: 'lr', startLevel: 6 },
      { name: 'Illusory Self', maxAt: [{ level: 10, max: 1 }], refresh: 'sr', startLevel: 10 },
    ],
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
    'Astral Elf': [
      { name: 'Starlight Step', maxAt: 'PB', refresh: 'lr' },
    ],
    'Elf': [
      // Base elf has no tracked resources; subrace resources are added via subrace name match
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
    // Spell Sniper: "Increased Range" applies to all attack roll spells automatically — no pick needed
  },

  /* ================================================================
     FEAT CUSTOM CHOICES — non-spell picks (e.g. Metamagic Adept).
     Each entry: { type, label, count, hint }
     ================================================================ */
  FEAT_CUSTOM_CHOICES: {
    'Metamagic Adept': {
      type: 'metamagic',
      label: 'Choose Metamagic Options',
      count: 2,
      hint: 'Choose 2 Metamagic options. You can use them with your Sorcery Points.',
    },
  },

  /* ================================================================
     METAMAGIC OPTIONS — used by Sorcerer and Metamagic Adept feat.
     Each entry: { name, cost, text }
     ================================================================ */
  METAMAGIC_OPTIONS: [
    { name: 'Careful Spell',    cost: 1, text: 'When you cast a spell that forces others to make a saving throw, you can protect some of those creatures. Choose up to your Spellcasting modifier (minimum 1) — they automatically succeed.' },
    { name: 'Distant Spell',    cost: 1, text: 'When you cast a spell with a range of 5+ feet, double its range. When you cast a touch spell, its range becomes 30 feet.' },
    { name: 'Empowered Spell',  cost: 1, text: 'When you roll damage for a spell, reroll up to your Spellcasting modifier (minimum 1) damage dice. You must use the new rolls. Can be used with other Metamagic.' },
    { name: 'Extended Spell',   cost: 1, text: 'When you cast a spell with a duration of 1 minute or longer, double its duration (max 24 hours).' },
    { name: 'Heightened Spell', cost: 2, text: 'When you cast a spell that forces a creature to make a saving throw, one target has Disadvantage on its first save against the spell.' },
    { name: 'Quickened Spell',  cost: 2, text: 'When you cast a spell with a casting time of 1 action, change its casting time to 1 Bonus Action for this casting.' },
    { name: 'Seeking Spell',    cost: 2, text: 'If you make an attack roll for a spell and miss, reroll the d20 and use the new roll. You can use Seeking Spell even if you already used a different Metamagic this turn.' },
    { name: 'Subtle Spell',     cost: 1, text: 'When you cast a spell, you can do so without any somatic or verbal components.' },
    { name: 'Transmuted Spell', cost: 1, text: 'When you cast a spell that deals a type of damage from the following list, change it to one of the other listed types: Acid, Cold, Fire, Lightning, Poison, Thunder.' },
    { name: 'Twinned Spell',    cost: 1, text: 'When you cast a spell targeting only one creature and not already targeting max creatures, spend SP equal to the spell\'s level (min 1) to target a second creature within range.' },
  ],

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
      // Resolve level-dependent refresh (e.g. Bardic Inspiration: LR at 1-4, SR at 5+)
      let refresh = def.refresh;
      if (def.refreshAt?.length) {
        for (const ra of def.refreshAt) {
          if (level >= ra.level) refresh = ra.refresh;
        }
      }
      resources.push({
        name: def.name,
        max,
        used: 0,
        refresh,
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
  getSpeciesResources(speciesName, level, subraceName) {
    // Try subrace first (e.g. "Astral Elf"), then species name
    let defs = null;
    if (subraceName) {
      defs = this.SPECIES_RESOURCES[subraceName];
      if (!defs) {
        for (const [key, val] of Object.entries(this.SPECIES_RESOURCES)) {
          if (subraceName.toLowerCase().includes(key.toLowerCase()) ||
              key.toLowerCase().includes(subraceName.toLowerCase())) {
            defs = val; break;
          }
        }
      }
    }
    if (!defs) defs = this.SPECIES_RESOURCES[speciesName];
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
  getFeatResources(featNameOrObj, level) {
    const featName = typeof featNameOrObj === 'string' ? featNameOrObj : featNameOrObj?.name || '';
    const featObj = typeof featNameOrObj === 'object' ? featNameOrObj : null;
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
    return defs.map(def => {
      let name = def.name;
      // Replace "Bonus Spell" with actual chosen spell name if available
      if (name.includes('Bonus Spell') && featObj?.chosenSpells?.length) {
        const chosenSpell = featObj.chosenSpells[featObj.chosenSpells.length - 1];
        if (chosenSpell) name = name.replace('Bonus Spell', chosenSpell);
      }
      return { name, max: this._resolveMax(def.maxAt, lvl), used: 0, refresh: def.refresh };
    });
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
    const subraceName = draft.charSubrace || '';

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
      const specRes = this.getSpeciesResources(speciesName, level, subraceName);
      specRes.forEach(r => {
        if (!draft.resources.some(x => x.name === r.name)) draft.resources.push(r);
      });
    }

    // Feat resources (from feats array — supports string or {name} objects)
    (draft.feats || []).forEach(f => {
      const featRes = this.getFeatResources(f);
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
    const subraceName = CharStore.lv('charSubrace', '');
    const resources = CharStore.lv('resources', []) || [];

    // Get what resources SHOULD exist at newLevel
    const targetClassRes = this.getClassResources(className, newLevel);
    const targetSubRes = subclassName ? this.getSubclassResources(className, subclassName, newLevel) : [];
    const targetSpecRes = speciesName ? this.getSpeciesResources(speciesName, newLevel, subraceName) : [];
    const feats = CharStore.lv('feats', []) || [];
    const targetFeatRes = feats.flatMap(f => this.getFeatResources(f, newLevel));
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
