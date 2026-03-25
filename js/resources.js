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
      text: `You can tap into the wellspring of magic within yourself. This wellspring is represented by Sorcery Points, which allow you to create a variety of magical effects. You gain more Sorcery Points as you reach higher levels, as shown in the Sorcerer Features table. You can't have more Sorcery Points than the number shown for your level. You regain all expended Sorcery Points when you finish a Long Rest.

<b>Converting Spell Slots to Sorcery Points.</b> You can expend a spell slot to gain a number of Sorcery Points equal to the slot's level (no action required).

<b>Creating Spell Slots.</b> As a Bonus Action, you can transform unexpended Sorcery Points into one spell slot. You can create a spell slot no higher than level 5. Any spell slot you create with this feature vanishes when you finish a Long Rest.

<table style="width:100%;border-collapse:collapse;font-size:0.82em;margin-top:2px">
  <thead><tr style="border-bottom:1px solid var(--border)">
    <th style="text-align:left;padding:3px 8px 3px 0;color:var(--ink-faint)">Spell Slot Level</th>
    <th style="text-align:center;padding:3px 8px;color:var(--ink-faint)">Sorcery Point Cost</th>
    <th style="text-align:center;padding:3px 0 3px 8px;color:var(--ink-faint)">Min. Sorcerer Level</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:2px 8px 2px 0">1st</td><td style="text-align:center;padding:2px 8px">2</td><td style="text-align:center;padding:2px 0 2px 8px">2</td></tr>
    <tr><td style="padding:2px 8px 2px 0">2nd</td><td style="text-align:center;padding:2px 8px">3</td><td style="text-align:center;padding:2px 0 2px 8px">3</td></tr>
    <tr><td style="padding:2px 8px 2px 0">3rd</td><td style="text-align:center;padding:2px 8px">5</td><td style="text-align:center;padding:2px 0 2px 8px">5</td></tr>
    <tr><td style="padding:2px 8px 2px 0">4th</td><td style="text-align:center;padding:2px 8px">6</td><td style="text-align:center;padding:2px 0 2px 8px">7</td></tr>
    <tr><td style="padding:2px 8px 2px 0">5th</td><td style="text-align:center;padding:2px 8px">7</td><td style="text-align:center;padding:2px 0 2px 8px">9</td></tr>
  </tbody>
</table>`,
    },
    'Innate Sorcery': {
      text: 'As a Bonus Action, you unleash your innate magic for 1 minute. While active: your Sorcerer spell save DC increases by 1, and you have Advantage on the attack rolls of Sorcerer spells you cast. You have 2 uses and regain all expended uses on a Long Rest.',
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
    'Bend Life Energy': {
      text: 'When a spell you cast restores Hit Points to a creature, you can roll 1d4 and add the number rolled to the total Hit Points restored.',
    },
    'Minor Foreknowledge': {
      text: 'When you take the Search action, you can give yourself Advantage on any ability check made as part of that action.',
    },
    'Emotional Sense': {
      text: 'When you take the Influence action, you can give yourself Advantage on any ability check made as part of that action.',
    },
    'Flexible Flesh': {
      text: 'When you make a Dexterity (Acrobatics or Sleight of Hand) check, you gain a bonus equal to your Intelligence modifier (minimum of +1).',
    },
    'Limited Telepathy': {
      text: 'As a Magic action, choose one creature you can see within 120 feet. You form a telepathic connection to that creature for 1 hour, allowing telepathic communication while within 120 feet of each other. Refreshes on Short or Long Rest.',
    },
    'Cunning Mind': {
      text: 'When you make a Charisma (Deception or Persuasion) check, you gain a bonus equal to your Intelligence modifier (minimum of +1).',
    },
    'Psi Boost': {
      text: 'When you take the Dash action, you can increase your Speed by 10 feet until the start of your next turn.',
    },
    'Healer': {
      text: 'As an Action, you can spend one use of a Healer\'s Kit to tend to a creature and restore 1d6 + 4 Hit Points to it, plus additional HP equal to the creature\'s maximum number of Hit Dice. The creature can\'t regain HP from this feat again until it finishes a Short or Long Rest.',
    },
    'Toughened Flesh': {
      text: 'When you take damage, you can use your Reaction to harden your body. You gain resistance to that damage, and you can\'t benefit from this again until you finish a Short or Long Rest.',
    },
    'Sanguine Feast': {
      text: 'When you reduce a creature to 0 HP, you can feed on its life force as a Bonus Action. You regain HP equal to your Proficiency Bonus and gain Temporary HP equal to your Proficiency Bonus.',
    },
    'Fey-Touched: Misty Step': {
      text: 'You can cast Misty Step once without expending a spell slot. You regain the ability after a Long Rest.',
    },
    'Fey-Touched': {
      text: 'You can cast this spell once without expending a spell slot (chosen from Divination or Enchantment when you took the feat). You regain the ability after a Long Rest.',
    },
    'Shadow-Touched: Invisibility': {
      text: 'You can cast Invisibility once without expending a spell slot. You regain the ability after a Long Rest.',
    },
    'Shadow-Touched': {
      text: 'You can cast this spell once without expending a spell slot (chosen from Illusion or Necromancy when you took the feat). You regain the ability after a Long Rest.',
    },
    'Sorcerous Restoration': {
      text: `<b>5th-Level Sorcerer Feature.</b> When you finish a Short Rest, you can choose to regain up to <b>4 Sorcery Points</b>. Once you use this feature, you can't use it again until you finish a Long Rest.`,
    },
    'Metamagic Sorcery Points': {
      text: `Granted by the <b>Metamagic Adept</b> feat. You gain 2 Sorcery Points usable only for Metamagic options. These are added to any Sorcery Points you already have from the Sorcerer class.

<b>Spend SP to modify a spell when you cast it</b> (one option per spell unless noted). Chosen options appear in your Sorcery Points tooltip.`,
    },
    'Phantasmal Creatures (Free Cast)': {
      text: 'Once per Long Rest, you can cast Summon Beast or Summon Fey without expending a spell slot. The spell automatically uses an Illusion version of the creature.',
    },
    'Illusory Self': {
      text: 'When a creature makes an attack roll against you, you can use your Reaction to interpose an illusory duplicate. The attack automatically misses. Once used, you must finish a Short or Long Rest before using it again.',
    },
    'Psionic Energy Dice': {
      text: 'You harbor a wellspring of psionic energy represented by Psionic Energy Dice. You expend these dice to fuel Telekinetic Propel, Telepathic Connection, Psionic Disciplines, and other Psion features. You regain 1 die on a Short Rest and all dice on a Long Rest.\n\nAt level 5, Psionic Restoration lets you regain all dice via 1-minute meditation (once per Long Rest).\n\nAt level 18, Psionic Reserves restores dice to 4 whenever you roll Initiative.',
      extra: [
        { level: 1,  note: 'Current: 4d6'  },
        { level: 5,  note: 'Current: 6d8'  },
        { level: 9,  note: 'Current: 8d8'  },
        { level: 11, note: 'Current: 8d10' },
        { level: 13, note: 'Current: 10d10' },
        { level: 17, note: 'Current: 12d12' },
      ],
    },
    'Psionic Restoration': {
      text: 'You perform a meditation that focuses the mind for 1 minute. At the end of it, you regain all expended Psionic Energy Dice. Once you use this feature, you can\'t do so again until you finish a Long Rest.',
    },
    'Favored by the Gods': {
      text: 'If you fail a saving throw or miss with an attack roll, you can roll 2d4 and add it to the total, possibly changing the outcome. Once you use this feature, you can\'t use it again until you finish a Short or Long Rest.',
    },
    'Otherworldly Wings': {
      text: 'As a Bonus Action, you manifest a pair of spectral wings from your back, gaining a Fly Speed of 30 feet for 1 minute. You can use this feature a number of times equal to your Charisma modifier (minimum 1), and regain all expended uses on a Long Rest.',
    },
    'Unearthly Recovery': {
      text: 'When you are below half your Hit Point maximum, you can use a Bonus Action to regain Hit Points equal to half your Hit Point maximum. Once you use this feature, you can\'t do so again until you finish a Long Rest.',
    },
    'Strength of the Grave': {
      text: 'When damage reduces you to 0 Hit Points, you can make a Charisma saving throw (DC 5 + the damage taken). On a success, you instead drop to 1 Hit Point. Radiant damage and critical hits automatically fail this save. Once you succeed, you can\'t use this feature again until you finish a Long Rest.',
    },
    'Ancestral Avatar': {
      text: 'As an Action, you fully manifest your magical ancestor for 1 minute. During this time your spell save DC increases by 2, your ancestral spirit damage increases to 2d8, and you are immune to the Frightened condition. Once used, you must finish a Long Rest before using it again.',
    },
    'Total Defilement': {
      text: 'Once per Long Rest, you can cast any spell you know at its highest level without expending a spell slot. Doing so permanently defertilizes all land within 100 feet for 1 year.',
    },
    'Spellfire Mastery': {
      text: 'You can absorb spells of 6th level or lower with Spellfire Absorption. Additionally, once per Long Rest when you reduce a creature to 0 Hit Points with radiant damage, you regain all your Hit Points.',
    },
    'Bladesong': {
      text: 'As a Bonus Action, you invoke an elven magic called the Bladesong (provided you aren\'t wearing medium or heavy armor or using a shield). For 1 minute: your AC increases by your Intelligence modifier (minimum +1), your Speed increases by 10 feet, you have Advantage on Acrobatics checks, and you add your Intelligence modifier to Constitution saving throws to maintain Concentration. You can use this feature a number of times equal to your Proficiency Bonus, and regain all expended uses on a Long Rest.',
    },
    'Form of Dread': {
      text: 'As a Bonus Action, you transform for 1 minute. While transformed: you gain Temporary Hit Points equal to 1d10 + your Warlock level; once per turn when you hit a creature with an attack roll you can force it to make a Wisdom saving throw or become Frightened of you until the end of your next turn; and you are immune to the Frightened condition. You can use this feature a number of times equal to your Proficiency Bonus, and regain all uses on a Long Rest.',
    },
    'Spirit Projection': {
      text: 'As an Action, your spirit leaves your body. Your body is Incapacitated and stays in place. Your spirit can move up to twice your Speed per turn, can pass through creatures (but not objects), and can cast spells as if in its space. When you move within 5 feet of a creature, you can make an attack roll dealing 8d8 + your spellcasting modifier as Necrotic damage. Once used, you must finish a Long Rest before using it again.',
    },
    "Avatar's Touch": {
      text: 'Once per Short Rest, when you deal Sneak Attack damage, you can choose to trigger the effects of all three Dead Three blessings simultaneously (Bane\'s Grasp, Bhaal\'s Mark, and Myrkul\'s Touch).',
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
      { name: 'Bardic Inspiration', maxAt: 'CHA_MIN1', refresh: 'lr', refreshAt: [{ level: 5, refresh: 'sr' }], startLevel: 1 },
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
      { name: 'Innate Sorcery', maxAt: [{ level: 1, max: 2 }], refresh: 'lr', startLevel: 1 },
      { name: 'Sorcerous Restoration', maxAt: [{ level: 5, max: 1 }], refresh: 'lr', startLevel: 5 },
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
    Psion: [
      { name: 'Psionic Energy Dice', maxAt: [
        { level: 1,  max: 4  },
        { level: 5,  max: 6  },
        { level: 9,  max: 8  },
        { level: 13, max: 10 },
        { level: 17, max: 12 },
      ], refresh: 'lr', startLevel: 1,
        notes: 'Short Rest: regain 1 expended die. Level 5: Psionic Restoration lets you regain all dice (1× per Long Rest). Level 18: On Initiative, regain dice until you have 4.' },
      { name: 'Psionic Restoration', maxAt: [{ level: 5, max: 1 }], refresh: 'lr', startLevel: 5 },
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
    'Sorcerer:Divine Soul': [
      { name: 'Favored by the Gods', maxAt: [{ level: 3, max: 1 }], refresh: 'sr', startLevel: 3 },
      { name: 'Otherworldly Wings', maxAt: [{ level: 14, max: 1 }], refresh: 'lr', startLevel: 14,
        notes: 'Uses per Long Rest = your Charisma modifier (minimum 1). Update this max to match your CHA modifier.' },
      { name: 'Unearthly Recovery', maxAt: [{ level: 18, max: 1 }], refresh: 'lr', startLevel: 18 },
    ],
    'Sorcerer:Shadow Magic': [
      { name: 'Strength of the Grave', maxAt: [{ level: 3, max: 1 }], refresh: 'lr', startLevel: 3 },
    ],
    'Sorcerer:Ancestral Sorcery': [
      { name: 'Ancestral Avatar', maxAt: [{ level: 18, max: 1 }], refresh: 'lr', startLevel: 18 },
    ],
    'Sorcerer:Defiled Sorcerer': [
      { name: 'Total Defilement', maxAt: [{ level: 18, max: 1 }], refresh: 'lr', startLevel: 18 },
    ],
    'Sorcerer:Spellfire Sorcerer': [
      { name: 'Spellfire Mastery', maxAt: [{ level: 18, max: 1 }], refresh: 'lr', startLevel: 18 },
    ],
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
      { name: 'Spirit Session (Free Cast)', maxAt: [{ level: 6, max: 1 }], refresh: 'lr', startLevel: 6, notes: 'Spiritual Manifestation. You always have the Spirit Guardians spell prepared. You can cast it once without expending a spell slot, and you regain the ability to do so when you finish a Long Rest.\n\nPower from Beyond. Once per turn, when you cast a Bard spell that either deals damage or restores Hit Points, roll a d6. You gain a bonus to one of the spell\'s damage rolls or the total healing equal to the number rolled.' },
      { name: 'Spirit Session (Modified)', maxAt: [{ level: 6, max: 1 }], refresh: 'sr', startLevel: 6, notes: 'Spiritual Manifestation. Whenever you cast Spirit Guardians, you can modify it so the spirits also guard against worldly threats. When cast in this way, you and your allies within the spell\'s Emanation gain Half Cover. Once you modify the spell this way, you can\'t do so again until you finish a Short or Long Rest.' },
    ],
    'Paladin:Oath of Devotion': [],
    'Paladin:Oath of the Ancients': [],
    'Wizard:Bladesinging': [
      { name: 'Bladesong', maxAt: 'PB', refresh: 'lr', startLevel: 3 },
    ],
    'Warlock:The Undead': [
      { name: 'Form of Dread', maxAt: 'PB', refresh: 'lr', startLevel: 3 },
      { name: 'Spirit Projection', maxAt: [{ level: 14, max: 1 }], refresh: 'lr', startLevel: 14 },
    ],
    'Rogue:Scion of the Three': [
      { name: "Avatar's Touch", maxAt: [{ level: 13, max: 1 }], refresh: 'sr', startLevel: 13 },
    ],
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
  /*
   * Cantrips granted automatically by class features (not chosen by the player).
   * These are excluded from cantrip pick counts and blocked in the level-up picker.
   */
  CLASS_AUTO_CANTRIPS: {
    'Psion': ['Mage Hand'],
  },

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
    'Shadow-Touched': [
      { name: 'Shadow-Touched: Invisibility', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
      { name: 'Shadow-Touched: Bonus Spell', maxAt: [{ level: 1, max: 1 }], refresh: 'lr' },
    ],
    'Metamagic Adept': [
      { name: 'Metamagic Sorcery Points', maxAt: [{ level: 1, max: 2 }], refresh: 'lr' },
    ],
    'Bloodlust': [
      { name: 'Sanguine Feast', maxAt: 'PB', refresh: 'lr' },
    ],
    'Delicious Pain': [
      { name: 'Toughened Flesh', maxAt: [{ level: 1, max: 1 }], refresh: 'sr' },
    ],
    // Wild Talent Feats
    'Biokinesis': [
      { name: 'Bend Life Energy', maxAt: 'PB', refresh: 'lr' },
    ],
    'Clairsentience': [
      { name: 'Minor Foreknowledge', maxAt: 'PB', refresh: 'lr' },
    ],
    'Empath': [
      { name: 'Emotional Sense', maxAt: 'PB', refresh: 'lr' },
    ],
    'Flesh Morpher': [
      { name: 'Flexible Flesh', maxAt: 'PB', refresh: 'lr' },
    ],
    'Mind Whisperer': [
      { name: 'Limited Telepathy', maxAt: [{ level: 1, max: 1 }], refresh: 'sr' },
    ],
    'Psi Trickster': [
      { name: 'Cunning Mind', maxAt: 'PB', refresh: 'lr' },
    ],
    'Psykineticist': [
      { name: 'Psi Boost', maxAt: 'PB', refresh: 'lr' },
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
    // Wild Talent Feats — all spells are auto-granted (no picks), ability chosen via customConfig
    'Atmokinesis': {
      autoSpells: ['Shocking Grasp', 'Fog Cloud'],
      levelSpells: [{ minLevel: 3, spells: ['Gust of Wind'] }],
    },
    'Biokinesis': {
      autoSpells: ['Spare the Dying', 'Healing Word'],
      levelSpells: [{ minLevel: 3, spells: ['Arcane Vigor'] }],
    },
    'Clairsentience': {
      autoSpells: ['Guidance', 'Detect Evil and Good'],
      levelSpells: [{ minLevel: 3, spells: ['See Invisibility'] }],
    },
    'Cryokinesis': {
      autoSpells: ['Ray of Frost', 'Armor of Agathys', 'Ice Knife'],
    },
    'Empath': {
      autoSpells: ['Charm Person'],
      levelSpells: [{ minLevel: 3, spells: ['Calm Emotions'] }],
    },
    'Flesh Morpher': {
      autoSpells: ['Longstrider'],
      levelSpells: [{ minLevel: 3, spells: ['Alter Self'] }],
    },
    'Mind Whisperer': {
      autoSpells: ['Mind Sliver', 'Dissonant Whispers'],
    },
    'Psi Trickster': {
      autoSpells: ['Minor Illusion', 'Disguise Self'],
    },
    'Psykineticist': {
      autoSpells: ['Telekinetic Fling', 'Thunderwave'],
    },
    'Pyrokinesis': {
      autoSpells: ['Produce Flame', 'Burning Hands'],
      levelSpells: [{ minLevel: 3, spells: ['Scorching Ray'] }],
    },
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
    // Wild Talent Feats — spellcasting ability choice (INT / WIS / CHA)
    'Atmokinesis':    { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Shocking Grasp, Fog Cloud, Gust of Wind).' },
    'Biokinesis':     { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Spare the Dying, Healing Word, Arcane Vigor).' },
    'Clairsentience': { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Guidance, Detect Evil and Good, See Invisibility).' },
    'Cryokinesis':    { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Ray of Frost, Armor of Agathys, Ice Knife).' },
    'Empath':         { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Charm Person, Calm Emotions).' },
    'Flesh Morpher':  { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Longstrider, Alter Self).' },
    'Mind Whisperer': { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Mind Sliver, Dissonant Whispers).' },
    'Psi Trickster':  { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Minor Illusion, Disguise Self).' },
    'Psykineticist':  { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Telekinetic Fling, Thunderwave).' },
    'Pyrokinesis':    { type: 'spellAbility', label: 'Psionic Spellcasting Ability', hint: 'Choose the ability score used for your psionic spells (Produce Flame, Burning Hands, Scorching Ray).' },
  },

  /* ================================================================
     METAMAGIC OPTIONS — used by Sorcerer and Metamagic Adept feat.
     Each entry: { name, cost, text }
     ================================================================ */
  /* ================================================================
     PSIONIC DISCIPLINE OPTIONS — used by Psion class (level 2+)
     ================================================================ */
  PSIONIC_DISCIPLINE_OPTIONS: [
    { name: 'Biofeedback',           text: 'When you cast a Psion spell from the Necromancy or Transmutation school, you can expend a number of Psionic Energy Dice up to your Intelligence modifier, roll them, and gain Temporary Hit Points equal to the total rolled plus your Intelligence modifier (minimum 1).' },
    { name: 'Bolstering Precognition', text: 'When you cast a Psion spell from the Abjuration or Divination school, you can expend one Psionic Energy Die. Roll the die and choose a creature you can see within 60 feet (including yourself). Until the end of your next turn, the creature gains a bonus to the next D20 Test it makes equal to the number rolled.' },
    { name: 'Destructive Thoughts',  text: 'When you cast a Psion spell from the Conjuration or Evocation school that forces a creature you can see to make a saving throw, you can expend a number of Psionic Energy Dice up to your Intelligence modifier and roll them. The creature takes Psychic damage equal to the total rolled plus your Intelligence modifier (minimum 1), regardless of the saving throw result.' },
    { name: 'Devilish Tongue',       text: 'When you take the Influence action, you can roll one Psionic Energy Die and add the number rolled to the ability check. If this causes you to succeed on the ability check, the die is expended.' },
    { name: 'Expanded Awareness',    text: 'When you take the Search action, you can roll one Psionic Energy Die and add the number rolled to the ability check. If this causes you to succeed on the ability check, the die is expended.' },
    { name: 'Id Insinuation',        text: 'When you cast a Psion spell from the Enchantment or Illusion school that forces a creature to make a saving throw, you can expend one Psionic Energy Die and roll it. One target of the spell you can see subtracts half the number rolled (round up) from its saving throw against the spell.' },
    { name: 'Inerrant Aim',          text: 'When you make an attack roll against a creature and miss, you can roll one Psionic Energy Die and add the number rolled to the attack roll, potentially turning the miss into a hit. If this causes the attack to hit, the die is expended.' },
    { name: 'Observant Mind',        text: 'When you take the Study action, you can roll one Psionic Energy Die and add the number rolled to the ability check. If this causes you to succeed on the ability check, the die is expended.' },
    { name: 'Psionic Backlash',      text: 'Immediately after a creature you can see hits you with an attack roll, you can take a Reaction to expend one Psionic Energy Die, roll it, and reduce the damage you take equal to two times the number rolled plus your Intelligence modifier (minimum 2). You can also force the attacker to make a Wisdom saving throw; on a failure, the target takes Psychic damage equal to the damage you reduced.' },
    { name: 'Psionic Guards',        text: 'At the start of your turn, you can expend one Psionic Energy Die. Until the start of your next turn, you have Immunity to the Charmed and Frightened conditions and Advantage on Intelligence saving throws. If you are Charmed or Frightened when you use this discipline, the condition ends on you. When you use Psionic Guards, you can also use a different Psionic Discipline this turn.' },
    { name: 'Sharpened Mind',        text: 'At the start of your turn, you can expend one Psionic Energy Die to hone your destructive psionics. Roll the die and record the number. For 1 minute or until Incapacitated: your weapon attacks, Psion spells, and Psion features ignore Resistance to Psychic damage; and once per turn when you deal Psychic damage, you can replace one damage die with the recorded number. When you use Sharpened Mind, you can also use a different Psionic Discipline this turn.' },
  ],

  METAMAGIC_OPTIONS: [
    { name: 'Careful Spell',    cost: 1, text: 'When you cast a spell that forces other creatures to make a saving throw, choose up to your Charisma modifier (minimum 1) of those creatures — they automatically succeed on their save and take no damage if they would normally take half on a success.' },
    { name: 'Distant Spell',    cost: 1, text: 'When you cast a spell with a range of 5+ feet, double its range. When you cast a spell with a range of Touch, its range becomes 30 feet.' },
    { name: 'Empowered Spell',  cost: 1, text: 'When you roll damage for a spell, reroll up to your Charisma modifier (minimum 1) of the damage dice and use the new rolls. You can use Empowered Spell even if you\'ve already used a different Metamagic option during the casting.' },
    { name: 'Extended Spell',   cost: 1, text: 'When you cast a spell with a duration of 1 minute or longer, double its duration (max 24 hours). If the spell requires Concentration, you have Advantage on saves to maintain that Concentration.' },
    { name: 'Heightened Spell', cost: 2, text: 'When you cast a spell that forces a creature to make a saving throw, one target of the spell has Disadvantage on saves against the spell.' },
    { name: 'Quickened Spell',  cost: 2, text: 'When you cast a spell with a casting time of an action, change its casting time to a Bonus Action for this casting. You can\'t modify a spell this way if you\'ve already cast a level 1+ spell on the current turn, nor can you cast a level 1+ spell on this turn after using Quickened Spell.' },
    { name: 'Seeking Spell',    cost: 1, text: 'If you make an attack roll for a spell and miss, reroll the d20 and use the new roll. You can use Seeking Spell even if you\'ve already used a different Metamagic option during the casting.' },
    { name: 'Subtle Spell',     cost: 1, text: 'When you cast a spell, you can do so without any Verbal, Somatic, or Material components, except Material components that are consumed by the spell or that have a cost specified in the spell.' },
    { name: 'Transmuted Spell', cost: 1, text: 'When you cast a spell that deals Acid, Cold, Fire, Lightning, Poison, or Thunder damage, you can change that damage type to any other type from that list.' },
    { name: 'Twinned Spell',    cost: 1, text: 'When you cast a spell, such as Charm Person, that can be cast with a higher-level spell slot to target an additional creature, you can spend 1 Sorcery Point to increase the spell\'s effective level by 1.' },
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
    if (maxAt === 'CHA_MIN1') {
      if (typeof CharStore !== 'undefined') {
        const chaScore = parseInt(CharStore.lv('cha', 10)) || 10;
        return Math.max(1, Math.floor((chaScore - 10) / 2));
      }
      return 1;
    }
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
        // Metamagic Adept grants extra Sorcery Points — for Sorcerers, add to their existing pool
        if (r.name === 'Metamagic Sorcery Points' && className === 'Sorcerer') {
          const sp = draft.resources.find(x => x.name === 'Sorcery Points');
          if (sp) { sp.max += r.max; return; }
        }
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

    // Metamagic Adept grants extra Sorcery Points — for Sorcerers, merge into their pool
    const mergedFeatRes = [];
    for (const r of targetFeatRes) {
      if (r.name === 'Metamagic Sorcery Points' && className === 'Sorcerer') {
        const sp = targetClassRes.find(x => x.name === 'Sorcery Points');
        if (sp) { sp.max += r.max; continue; }
      }
      mergedFeatRes.push(r);
    }

    const allTarget = [...targetClassRes, ...targetSubRes, ...targetSpecRes, ...mergedFeatRes];

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
