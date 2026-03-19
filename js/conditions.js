/* =============================================
   D&D 2024 CONDITIONS — Rules & Mechanical Effects
   ============================================= */
'use strict';

window.ConditionRules = {

  /* ---------- Standard conditions ---------- */
  CONDITIONS: {
    Blinded: {
      description: 'A Blinded creature can\'t see and automatically fails any ability check that requires sight. Attack rolls against the creature have Advantage, and the creature\'s attack rolls have Disadvantage.',
      effects: { attackRolls: 'disadvantage', attacksAgainst: 'advantage' },
      rollPrompt: 'You are affected by the Blinded condition. Confirm with your DM if this roll requires Disadvantage.',
    },
    Charmed: {
      description: 'A Charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has Advantage on any ability check to interact socially with the creature.',
      effects: {},
      rollPrompt: null,
    },
    Deafened: {
      description: 'A Deafened creature can\'t hear and automatically fails any ability check that requires hearing.',
      effects: {},
      rollPrompt: null,
    },
    Frightened: {
      description: 'A Frightened creature has Disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can\'t willingly move closer to the source of its fear.',
      effects: { attackRolls: 'disadvantage', abilityChecks: 'disadvantage' },
      rollPrompt: 'You are affected by the Frightened condition. Confirm with your DM if the source of fear is visible (Disadvantage applies).',
    },
    Grappled: {
      description: 'A Grappled creature\'s Speed becomes 0, and it can\'t benefit from any bonus to its Speed. The condition ends if the grappler is Incapacitated or if the creature is moved outside the grapple\'s range.',
      effects: { speedZero: true },
      rollPrompt: null,
    },
    Incapacitated: {
      description: 'An Incapacitated creature can\'t take Actions, Bonus Actions, or Reactions.',
      effects: {},
      rollPrompt: null,
    },
    Invisible: {
      description: 'An Invisible creature is impossible to see without the aid of magic or a special sense. The creature has Advantage on attack rolls, and attack rolls against it have Disadvantage.',
      effects: { attackRolls: 'advantage' },
      rollPrompt: null,
    },
    Paralyzed: {
      description: 'A Paralyzed creature is Incapacitated and can\'t move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have Advantage. Any attack that hits the creature is a Critical Hit if the attacker is within 5 feet.',
      effects: { attackRolls: 'auto-fail', strSaves: 'auto-fail', dexSaves: 'auto-fail', attacksAgainst: 'advantage' },
      implies: ['Incapacitated'],
      rollPrompt: null,
    },
    Petrified: {
      description: 'A Petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging. The creature is Incapacitated, can\'t move or speak, and is unaware of its surroundings. Attack rolls against it have Advantage. It automatically fails Strength and Dexterity saving throws. It has Resistance to all damage. It is immune to Poison and disease.',
      effects: { strSaves: 'auto-fail', dexSaves: 'auto-fail', attacksAgainst: 'advantage' },
      implies: ['Incapacitated'],
      rollPrompt: null,
    },
    Poisoned: {
      description: 'A Poisoned creature has Disadvantage on attack rolls and ability checks.',
      effects: { attackRolls: 'disadvantage', abilityChecks: 'disadvantage' },
      rollPrompt: null, // always applies, no DM check needed
    },
    Prone: {
      description: 'A Prone creature\'s only movement option is to crawl, unless it stands up. The creature has Disadvantage on attack rolls. An attack roll against the creature has Advantage if the attacker is within 5 feet. Otherwise, the attack roll has Disadvantage.',
      effects: { attackRolls: 'disadvantage', speedHalved: true, attacksAgainst: 'advantage' },
      rollPrompt: null,
    },
    Restrained: {
      description: 'A Restrained creature\'s Speed becomes 0, and it can\'t benefit from any bonus to its Speed. Attack rolls against the creature have Advantage. The creature\'s attack rolls have Disadvantage. The creature has Disadvantage on Dexterity saving throws.',
      effects: { attackRolls: 'disadvantage', dexSaves: 'disadvantage', speedZero: true, attacksAgainst: 'advantage' },
      rollPrompt: null,
    },
    Stunned: {
      description: 'A Stunned creature is Incapacitated, can\'t move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have Advantage.',
      effects: { strSaves: 'auto-fail', dexSaves: 'auto-fail', attacksAgainst: 'advantage' },
      implies: ['Incapacitated'],
      rollPrompt: null,
    },
    Unconscious: {
      description: 'An Unconscious creature is Incapacitated, can\'t move or speak, and is unaware of its surroundings. The creature drops whatever it\'s holding and falls Prone. Attack rolls against the creature have Advantage. Any attack that hits is a Critical Hit if the attacker is within 5 feet. The creature automatically fails Strength and Dexterity saving throws.',
      effects: { attackRolls: 'auto-fail', strSaves: 'auto-fail', dexSaves: 'auto-fail', speedZero: true, attacksAgainst: 'advantage' },
      implies: ['Incapacitated', 'Prone'],
      rollPrompt: null,
    },
  },

  /** Ordered list of standard condition names */
  get CONDITION_LIST() {
    return Object.keys(this.CONDITIONS);
  },

  /** Returns conditions implied by toggling `name` on */
  getImplied(name) {
    const rule = this.CONDITIONS[name];
    return (rule && rule.implies) ? rule.implies : [];
  },

  /* ---------- Condition roll-mode resolver ----------
     rollType: 'attack' | 'save' | 'check' | 'initiative'
     abilityKey: 'str','dex',... (for saves/checks)
     activeConditions: string[]
     exhaustionLevel: number (0-10)
     extraAdvSources: string[]   — advantage from other features
     extraDisSources: string[]   — disadvantage from other features (e.g. armor)
     Returns { mode, sources, penalty }  */
  resolveRollMode({ rollType, abilityKey, activeConditions, exhaustionLevel = 0,
                     extraAdvSources = [], extraDisSources = [] }) {
    const advSources = [...extraAdvSources];
    const disSources = [...extraDisSources];
    let penalty = 0; // flat penalty (exhaustion)

    // Exhaustion penalty
    if (exhaustionLevel > 0) {
      penalty = 2 * exhaustionLevel;
    }

    activeConditions.forEach(cName => {
      const c = this.CONDITIONS[cName];
      if (!c) return;
      const fx = c.effects;

      if (rollType === 'attack') {
        if (fx.attackRolls === 'disadvantage') disSources.push(cName);
        if (fx.attackRolls === 'advantage')    advSources.push(cName);
      }

      if (rollType === 'save') {
        if (abilityKey === 'str' && fx.strSaves === 'auto-fail') disSources.push(cName + ' (auto-fail)');
        if (abilityKey === 'dex' && fx.dexSaves === 'auto-fail') disSources.push(cName + ' (auto-fail)');
        if (abilityKey === 'str' && fx.strSaves === 'disadvantage') disSources.push(cName);
        if (abilityKey === 'dex' && fx.dexSaves === 'disadvantage') disSources.push(cName);
      }

      if (rollType === 'check' || rollType === 'initiative') {
        if (fx.abilityChecks === 'disadvantage') disSources.push(cName);
        if (fx.abilityChecks === 'advantage')    advSources.push(cName);
      }
    });

    // Advantage + Disadvantage cancel each other (2024 rules)
    let mode;
    if (advSources.length > 0 && disSources.length > 0) {
      mode = undefined; // they cancel
    } else if (disSources.length > 0) {
      mode = 'disadvantage';
    } else if (advSources.length > 0) {
      mode = 'advantage';
    }

    return { mode, advSources, disSources, penalty };
  },

  /* ---------- Determine which stats are affected for warning icons ----------
     Returns: { speed, attackRolls, saves: { str, dex, ... }, abilityChecks }
     Each is null or { type: 'disadvantage'|'penalty'|'zero'|'halved', sources: string[] } */
  getStatEffects(activeConditions, exhaustionLevel = 0) {
    const result = {
      speed: null,
      attackRolls: null,
      attacksAgainst: null,
      abilityChecks: null,
      saves: {},
    };

    const speedSources = [];
    const atkAdvSources = [];
    const atkDisSources = [];
    let atkAutoFail = false;
    const attacksAgainstSources = [];
    const checkSources = [];
    const saveSources = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };

    activeConditions.forEach(cName => {
      const c = this.CONDITIONS[cName];
      if (!c) return;
      const fx = c.effects;

      // Speed
      if (fx.speedZero) speedSources.push({ type: 'zero', source: cName });
      if (fx.speedHalved) speedSources.push({ type: 'halved', source: cName });

      // Attacks against you
      if (fx.attacksAgainst === 'advantage') attacksAgainstSources.push(cName);

      // Attack rolls
      if (fx.attackRolls === 'auto-fail') { atkDisSources.push(cName); atkAutoFail = true; }
      else if (fx.attackRolls === 'disadvantage') atkDisSources.push(cName);
      if (fx.attackRolls === 'advantage')
        atkAdvSources.push(cName);

      // Ability checks
      if (fx.abilityChecks === 'disadvantage') checkSources.push(cName);

      // Saves
      if (fx.strSaves) saveSources.str.push({ type: fx.strSaves, source: cName });
      if (fx.dexSaves) saveSources.dex.push({ type: fx.dexSaves, source: cName });
    });

    // Exhaustion
    if (exhaustionLevel > 0) {
      speedSources.push({ type: 'reduce', source: `Exhaustion (−${5 * exhaustionLevel} ft)` });
    }

    // Speed summary
    if (speedSources.length) {
      const hasZero = speedSources.some(s => s.type === 'zero');
      result.speed = {
        type: hasZero ? 'zero' : (speedSources.some(s => s.type === 'halved') ? 'halved' : 'reduce'),
        sources: speedSources.map(s => s.source),
        exhaustionReduction: exhaustionLevel * 5,
      };
    }

    // Attack rolls: adv + dis cancel
    if (atkAdvSources.length && atkDisSources.length) {
      // cancelled — no warning
    } else if (atkDisSources.length) {
      result.attackRolls = { type: atkAutoFail ? 'auto-fail' : 'disadvantage', sources: atkDisSources };
    } else if (atkAdvSources.length) {
      result.attackRolls = { type: 'advantage', sources: atkAdvSources };
    }

    // Attacks against you (enemies have advantage)
    if (attacksAgainstSources.length) {
      result.attacksAgainst = { type: 'advantage', sources: attacksAgainstSources };
    }

    // Ability checks
    if (checkSources.length) {
      result.abilityChecks = { type: 'disadvantage', sources: checkSources };
    }

    // Saves
    Object.keys(saveSources).forEach(ab => {
      if (saveSources[ab].length) {
        const hasAutoFail = saveSources[ab].some(s => s.type === 'auto-fail');
        result.saves[ab] = {
          type: hasAutoFail ? 'auto-fail' : 'disadvantage',
          sources: saveSources[ab].map(s => s.source),
        };
      }
    });

    return result;
  },
};
