'use strict';
window.UA2024_DATA = {
  "_meta": {
    "sources": [
      {
        "json": "UA2024",
        "abbreviation": "UA2024",
        "full": "Unearthed Arcana 2024",
        "url": "https://www.dndbeyond.com/sources/ua",
        "authors": ["Wizards of the Coast"],
        "convertedBy": ["homebrew"],
        "color": "b30000",
        "dateReleased": "2024-01-01"
      }
    ]
  },
  "race": [
    {
      "name": "Ardling",
      "source": "UA2024",
      "page": 1,
      "size": ["M", "S"],
      "speed": { "walk": 30 },
      "ability": [{ "choose": { "from": ["str", "dex", "con", "int", "wis", "cha"], "count": 2 } }],
      "languageProficiencies": [{ "common": true, "celestial": true }],
      "entries": [
        {
          "type": "entries",
          "name": "Angelic Flight",
          "entries": ["You have vestigial wings. As a bonus action, you can use them to fly up to 10 feet without provoking opportunity attacks. You must land at the end of the movement or fall. Once you use this trait, you can't do so again until you finish a Short or Long Rest."]
        },
        {
          "type": "entries",
          "name": "Celestial Legacy",
          "entries": ["You have access to celestial magic. Choose one of the following legacy options: Exalted (sacred flame cantrip), Heavenly (light cantrip), or Idyllic (guidance cantrip). The chosen cantrip is always prepared for you."]
        },
        {
          "type": "entries",
          "name": "Divine Origin",
          "entries": ["You are descended from a celestial being. Your creature type is both Humanoid and Celestial."]
        },
        {
          "type": "entries",
          "name": "Keen Senses",
          "entries": ["You have proficiency in the Perception skill."]
        }
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Dragonborn (Chromatic)",
      "source": "UA2024",
      "page": 1,
      "size": ["M"],
      "speed": { "walk": 30 },
      "ability": [{ "str": 2, "cha": 1 }],
      "darkvision": 60,
      "languageProficiencies": [{ "common": true, "draconic": true }],
      "entries": [
        {
          "type": "entries",
          "name": "Chromatic Ancestry",
          "entries": ["You have a chromatic dragon ancestor. Choose a type: Black (acid), Blue (lightning), Green (poison), Red (fire), or White (cold). This determines your Breath Weapon damage type and Damage Resistance."]
        },
        {
          "type": "entries",
          "name": "Breath Weapon",
          "entries": ["When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in a 30-foot line or 15-foot cone (your choice). Each creature in that area must make a Dexterity saving throw (DC = 8 + your Constitution modifier + your proficiency bonus). On a failed save, the creature takes 1d10 damage of your ancestry type. On a successful save, it takes half as much damage. This damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10). You can use your Breath Weapon a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a Long Rest."]
        },
        {
          "type": "entries",
          "name": "Damage Resistance",
          "entries": ["You have resistance to the damage type associated with your Chromatic Ancestry."]
        },
        {
          "type": "entries",
          "name": "Darkvision",
          "entries": ["You can see in dim light within 60 feet of you as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray."]
        }
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Dragonborn (Metallic)",
      "source": "UA2024",
      "page": 1,
      "size": ["M"],
      "speed": { "walk": 30 },
      "ability": [{ "str": 2, "cha": 1 }],
      "darkvision": 60,
      "languageProficiencies": [{ "common": true, "draconic": true }],
      "entries": [
        {
          "type": "entries",
          "name": "Metallic Ancestry",
          "entries": ["You have a metallic dragon ancestor. Choose a type: Brass (fire), Bronze (lightning), Copper (acid), Gold (fire), or Silver (cold). This determines your Breath Weapon damage type and Damage Resistance."]
        },
        {
          "type": "entries",
          "name": "Breath Weapon",
          "entries": ["When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy. The breath weapon is a 30-foot line or 15-foot cone. Each creature in that area must make a Dexterity saving throw (DC = 8 + your Constitution modifier + your proficiency bonus). On a failed save, the creature takes 1d10 damage; half on a success. The damage increases by 1d10 at 5th, 11th, and 17th level."]
        },
        {
          "type": "entries",
          "name": "Damage Resistance",
          "entries": ["You have resistance to the damage type associated with your Metallic Ancestry."]
        },
        {
          "type": "entries",
          "name": "Healing Hands",
          "entries": ["As an action, you can touch a creature and cause it to regain a number of hit points equal to your proficiency bonus. Once you use this trait, you can't use it again until you finish a Long Rest."]
        }
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Dragonborn (Gem)",
      "source": "UA2024",
      "page": 1,
      "size": ["M"],
      "speed": { "walk": 30, "fly": 0 },
      "ability": [{ "int": 1, "cha": 2 }],
      "darkvision": 60,
      "languageProficiencies": [{ "common": true, "draconic": true }],
      "entries": [
        {
          "type": "entries",
          "name": "Gem Ancestry",
          "entries": ["You have a gem dragon ancestor. Choose a type: Amethyst (force), Crystal (radiant), Emerald (psychic), Sapphire (thunder), or Topaz (necrotic)."]
        },
        {
          "type": "entries",
          "name": "Breath Weapon",
          "entries": ["You can use your action to exhale destructive energy in a 15-foot cone. Each creature in that area must make a Constitution saving throw (DC = 8 + your Constitution modifier + your proficiency bonus). On a failed save, a creature takes 1d10 damage of your ancestry type; half on a success."]
        },
        {
          "type": "entries",
          "name": "Psionic Mind",
          "entries": ["You can send telepathic messages to any creature you can see within 30 feet of you. You don't need to share a language with the creature for it to understand your telepathic messages, but the creature must be able to understand at least one language to comprehend them."]
        },
        {
          "type": "entries",
          "name": "Gem Flight",
          "entries": ["Starting at 5th level, you can use a bonus action to manifest spectral wings on your body. These wings last for 1 minute. For the duration, you gain a fly speed equal to your walking speed. Once you use this trait, you can't do so again until you finish a Long Rest."]
        }
      ],
      "_src": "UA 2024"
    }
  ],
  "background": [
    {
      "name": "Gladiator",
      "source": "UA2024",
      "page": 1,
      "skillProficiencies": [{ "athletics": true, "performance": true }],
      "toolProficiencies": [{ "anyArtisansTool": 1 }],
      "languageProficiencies": [{ "anyStandard": 1 }],
      "entries": [
        {
          "type": "entries",
          "name": "Feature: By Popular Demand",
          "entries": ["You can always find a place to perform in any place that features entertainment, whether it's a tavern or a noble's court. At such a place, you receive free lodging and food of a modest or comfortable standard (depending on the quality of the establishment), as long as you perform each night. In addition, your performance makes you something of a local figure. When strangers recognize you in a town where you have performed, they typically take a liking to you."]
        }
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Merchant",
      "source": "UA2024",
      "page": 1,
      "skillProficiencies": [{ "insight": true, "persuasion": true }],
      "toolProficiencies": [{ "navigator's tools": true }],
      "languageProficiencies": [{ "anyStandard": 1 }],
      "entries": [
        {
          "type": "entries",
          "name": "Feature: Supply Chain",
          "entries": ["You've built contacts among merchants, caravans, and guilds across the realm. When looking to buy or sell goods, you can usually find a buyer or seller within 1d4 days, and can negotiate prices that are 10-20% better than standard market rates for non-magical goods."]
        }
      ],
      "_src": "UA 2024"
    }
  ],
  "feat": [
    {
      "name": "Dragonmark of Detection",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Detection. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Detect Magic and Detect Poison and Disease spells. You can cast each once per Long Rest without a spell slot. Wisdom is your spellcasting ability for these spells.",
          "Whenever you make a Wisdom (Insight) or Wisdom (Perception) check, you can roll a d4 and add the number rolled to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Finding",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Finding. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Faerie Fire and Locate Object spells. You can cast each once per Long Rest without a spell slot. Wisdom is your spellcasting ability.",
          "Whenever you make a Wisdom (Perception) or Wisdom (Survival) check, you can roll a d4 and add the number rolled to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Handling",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Handling. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Animal Friendship and Speak with Animals spells. You can cast each once per Long Rest without a spell slot. Wisdom is your spellcasting ability.",
          "Whenever you make a Wisdom (Animal Handling) or Intelligence (Nature) check, you can roll a d4 and add the number rolled to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Healing",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Healing. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Cure Wounds and Healing Word spells. You can cast each once per Long Rest without a spell slot. Wisdom is your spellcasting ability.",
          "When you use a Healer's Kit to stabilize a dying creature, that creature also regains 1 hit point."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Hospitality",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Hospitality. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Prestidigitation cantrip and the Unseen Servant spell. You can cast Unseen Servant once per Long Rest without a spell slot. Charisma is your spellcasting ability.",
          "Whenever you make a Charisma (Persuasion) check or ability check with brewer's supplies or cook's utensils, roll a d4 and add it to the roll."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Making",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Making. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Magic Stone cantrip and the Mending and Magic Mouth spells. You can cast Magic Mouth once per Long Rest without a spell slot. Intelligence is your spellcasting ability.",
          "Whenever you make an ability check with artisan's tools, roll a d4 and add the number rolled to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Passage",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Passage. You gain the following benefits:",
        { "type": "list", "items": [
          "Your walking speed increases by 5 feet.",
          "You learn the Expeditious Retreat and Misty Step spells. You can cast each once per Long Rest without a spell slot. Intelligence is your spellcasting ability.",
          "Whenever you make a Dexterity (Acrobatics) check or ability check to operate a vehicle, roll a d4 and add the number rolled to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Scribing",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Scribing. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Comprehend Languages and Illusory Script spells. You can cast each once per Long Rest without a spell slot. Intelligence is your spellcasting ability.",
          "Whenever you make an ability check with calligrapher's supplies or a forgery kit, roll a d4 and add the number rolled to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Sentinel",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Sentinel. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Compelled Duel and Shield of Faith spells. You can cast each once per Long Rest without a spell slot. Wisdom is your spellcasting ability.",
          "Whenever you make a Wisdom (Insight) or Wisdom (Perception) check, you can roll a d4 and add the number rolled to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Shadow",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Shadow. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Disguise Self and Invisibility spells. You can cast each once per Long Rest without a spell slot. Charisma is your spellcasting ability.",
          "Whenever you make a Dexterity (Performance) or Dexterity (Stealth) check, roll a d4 and add the number to the roll."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Storm",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Storm. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Fog Cloud and Gust of Wind spells. You can cast each once per Long Rest without a spell slot. Charisma is your spellcasting ability.",
          "Whenever you make a Dexterity (Acrobatics) check or ability check to operate a water or air vehicle, roll a d4 and add the number to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dragonmark of Warding",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You manifest the Mark of Warding. You gain the following benefits:",
        { "type": "list", "items": [
          "You learn the Alarm and Arcane Lock spells. You can cast each once per Long Rest without a spell slot. Intelligence is your spellcasting ability.",
          "Whenever you make a History or Investigation check involving locks, traps, or warding, or make an ability check with thieves' tools, roll a d4 and add the number to the check."
        ]}
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Arcane Initiate",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You've studied the basics of arcane magic. You gain the following benefits:",
        {
          "type": "list",
          "items": [
            "You learn two cantrips of your choice from the Wizard spell list.",
            "You learn one 1st-level spell from the Wizard spell list. You can cast this spell once without expending a spell slot, and you must finish a Long Rest before you can cast it this way again. Your spellcasting ability for this spell is Intelligence."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Alert",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "Always on the lookout for danger, you gain the following benefits:",
        {
          "type": "list",
          "items": [
            "You gain a +5 bonus to initiative.",
            "You can't be surprised while you are conscious.",
            "Other creatures don't gain advantage on attack rolls against you as a result of being hidden from you."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Crafter",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "You are adept at crafting things and can create items more efficiently. You gain the following benefits:",
        {
          "type": "list",
          "items": [
            "You gain proficiency with three different sets of Artisan's Tools of your choice.",
            "When you craft an item using a set of Artisan's Tools with which you have proficiency, the total time you spend crafting is halved.",
            "If you craft a simple or martial weapon, you can add a +1 bonus to attack rolls made with it. This bonus stacks with any magical bonus the weapon possesses."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Lucky",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "You have inexplicable luck that seems to kick in at just the right moment. You have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20. You can choose to spend one of your luck points after you roll the die, but before the outcome is determined. You choose which of the d20s is used for the attack roll, ability check, or saving throw. You can also spend one luck point when an attack roll is made against you. Roll a d20, and then choose whether the attack uses the attacker's roll or yours. If more than one creature spends a luck point to influence the outcome of a roll, the points cancel each other out; no additional dice are rolled. You regain your expended luck points when you finish a Long Rest."
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Magic Initiate",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "Choose a class: Bard, Cleric, Druid, Sorcerer, Warlock, or Wizard. You learn two cantrips of your choice from that class's spell list. In addition, choose one 1st-level spell from that same list. You learn that spell and can cast it at its lowest level. Once you cast it, you must finish a Long Rest before you can cast it that way again. Your spellcasting ability for these spells depends on the class you chose."
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Musician",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "You are a practiced musician, granting you the following benefits:",
        {
          "type": "list",
          "items": [
            "You gain proficiency with three musical instruments of your choice.",
            "You can use a musical instrument as a spellcasting focus.",
            "You can play a rousing tune as a bonus action. Any creature of your choice within 60 feet that can hear you gains inspiration."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Savage Attacker",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "You've trained to deal particularly damaging strikes. Once per turn when you hit a target with a weapon attack, you can roll the weapon's damage dice twice and use either total."
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Skilled",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "You have exceptional aptitude. Choose three skills or tools. You gain proficiency with each of your choices."
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Tavern Brawler",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "Accustomed to rough-and-tumble fighting using whatever weapons happen to be at hand, you gain the following benefits:",
        {
          "type": "list",
          "items": [
            "Your unarmed strikes use a d4 for damage.",
            "When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a bonus action to attempt to grapple the target.",
            "You can use your unarmed strike in place of the attack portion of a shove."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Tough",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "Your hit point maximum increases by an amount equal to twice your character level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points."
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "War Caster",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "prerequisite": [{ "spellcasting": true }],
      "entries": [
        "You have practiced casting spells in the midst of combat, learning techniques that grant you the following benefits:",
        {
          "type": "list",
          "items": [
            "You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage.",
            "You can perform the somatic components of spells even when you have weapons or a shield in one or both hands.",
            "When a hostile creature's movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack. The spell must have a casting time of 1 action and must target only that creature."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Inspiring Leader",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "prerequisite": [{ "ability": [{ "wis": 13 }] }],
      "entries": [
        "You can spend 10 minutes inspiring your companions, shoring up their resolve to fight. When you do so, choose up to six friendly creatures (which can include yourself) within 30 feet of you who can see or hear you and who can understand you. Each creature can gain temporary hit points equal to your level + your Charisma modifier. A creature can't gain temporary hit points from this feat again until it has finished a short or long rest."
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Athlete",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You have undergone extensive physical training to gain the following benefits:",
        {
          "type": "list",
          "items": [
            "Increase your Strength or Dexterity score by 1, to a maximum of 20.",
            "When you are prone, standing up uses only 5 feet of your movement.",
            "Climbing doesn't halve your speed.",
            "You can make a running long jump or a running high jump after moving only 5 feet on foot, rather than 10 feet."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Healer",
      "source": "UA2024",
      "page": 1,
      "category": "O",
      "entries": [
        "You are an able physician, allowing you to mend wounds quickly and get your allies back in the fight. You gain the following benefits:",
        {
          "type": "list",
          "items": [
            "When you use a Healer's Kit to stabilize a dying creature, that creature also regains 1 hit point.",
            "As an action, you can spend one use of a Healer's Kit to tend to a creature and restore 1d6 + 4 hit points to it, plus additional hit points equal to the creature's maximum number of Hit Dice. The creature can't regain hit points from this feat again until it finishes a short or long rest."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "Origin"
    },
    {
      "name": "Sharpshooter",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "prerequisite": [{ "proficiency": ["Martial Weapons"] }],
      "entries": [
        "You have mastered ranged weapons and can make shots that others find difficult. You gain the following benefits:",
        {
          "type": "list",
          "items": [
            "Attacking at long range doesn't impose disadvantage on your ranged weapon attack rolls.",
            "Your ranged weapon attacks ignore half cover and three-quarters cover.",
            "Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack's damage."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Great Weapon Master",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "prerequisite": [{ "proficiency": ["Martial Weapons"] }],
      "entries": [
        "You've learned to put the weight of a weapon to your advantage, letting its momentum empower your strikes. You gain the following benefits:",
        {
          "type": "list",
          "items": [
            "On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action.",
            "Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack's damage."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Polearm Master",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "prerequisite": [{ "proficiency": ["Martial Weapons"] }],
      "entries": [
        "You can keep your enemies at bay with reach weapons. You gain the following benefits:",
        {
          "type": "list",
          "items": [
            "When you take the Attack action and attack with only a glaive, halberd, quarterstaff, or spear, you can use a bonus action to make a melee attack with the opposite end of the weapon. The weapon's damage die for this attack is a d4, and the attack deals bludgeoning damage.",
            "While you are wielding a glaive, halberd, pike, quarterstaff, or spear, other creatures provoke an opportunity attack from you when they enter the reach you have with that weapon."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Sentinel",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You have mastered techniques to take advantage of every drop in any enemy's guard, gaining the following benefits:",
        {
          "type": "list",
          "items": [
            "When you hit a creature with an opportunity attack, the creature's speed becomes 0 for the rest of the turn.",
            "Creatures within 5 feet of you provoke opportunity attacks from you even if they take the Disengage action before leaving your reach.",
            "When a creature within 5 feet of you makes an attack against a target other than you (and that target doesn't have this feat), you can use your reaction to make a melee weapon attack against the attacking creature."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Dual Wielder",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You master fighting with two weapons, gaining the following benefits:",
        {
          "type": "list",
          "items": [
            "You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand.",
            "You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren't light.",
            "You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Shield Master",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "prerequisite": [{ "proficiency": ["Shields"] }],
      "entries": [
        "You use shields not just for protection but also for offense. You gain the following benefits while you are wielding a shield:",
        {
          "type": "list",
          "items": [
            "If you take the Attack action on your turn, you can use a bonus action to try to shove a creature within 5 feet of you with your shield.",
            "If you aren't incapacitated, you can add your shield's AC bonus to any Dexterity saving throw you make against a spell or other harmful effect that targets only you.",
            "If you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you can use your reaction to take no damage if you succeed on the saving throw, interposing your shield between yourself and the source of the effect."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Speedy",
      "source": "UA2024",
      "page": 1,
      "category": "G",
      "entries": [
        "You are exceptionally speedy and agile. You gain the following benefits:",
        {
          "type": "list",
          "items": [
            "Increase your Dexterity score by 1, to a maximum of 20.",
            "Your walking speed increases by 10 feet.",
            "When you use the Dash action, difficult terrain doesn't cost you extra movement on that turn.",
            "When you make a melee attack against a creature, you don't provoke opportunity attacks from that creature for the rest of the turn, whether or not you hit."
          ]
        }
      ],
      "_src": "UA 2024",
      "_catName": "General"
    },
    {
      "name": "Epic Boon of Combat Prowess",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "When you miss with a melee weapon attack, you can move up to half your speed toward the target and make another melee weapon attack. If that attack misses, the boon has no further effect until you finish a Long Rest."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Dimensional Travel",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "As a bonus action, you can cast the Misty Step spell, without expending a spell slot. You can use this feature a number of times equal to your Intelligence, Wisdom, or Charisma modifier (choose when you select this feat, minimum once), and you regain all expended uses when you finish a Long Rest."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Energy Resistance",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "You gain resistance to two of the following damage types of your choice: Acid, Cold, Fire, Lightning, Necrotic, Poison, Psychic, Radiant, or Thunder. Whenever you finish a Long Rest, you can change your choices."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Fate",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "When another creature you can see within 60 feet of you makes a d20 Test, you can roll a d10 and apply the result as a bonus or penalty to the roll (your choice). You can use this feature a number of times equal to your Wisdom modifier (minimum once), and you regain all expended uses when you finish a Long Rest."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Fortitude",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "Your Hit Point maximum increases by 40. In addition, whenever you regain Hit Points, you regain additional Hit Points equal to your Constitution modifier (minimum 1). You can't regain Hit Points from this benefit again until the start of your next turn."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Irresistible Offense",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "Your attacks with weapons and Unarmed Strikes ignore Resistance. In addition, when you roll a 20 on an attack roll, the attack deals an extra 2d6 damage of the same type."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Quick Casting",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19, "spellcasting": true }],
      "entries": [
        "Choose one of your spells of 1st through 3rd level that has a casting time of 1 action. That spell's casting time is now 1 bonus action for you."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Recovery",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "You can use a Bonus Action to regain a number of Hit Points equal to half your Hit Point maximum. Once you use this feature, you can't do so again until you finish a Long Rest. In addition, you succeed on death saving throws automatically."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Skill Proficiency",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "You gain proficiency in all skills."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Speed",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "Your Speed increases by 30 feet. In addition, whenever you use the Dash action, you don't provoke Opportunity Attacks for the rest of the turn."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Spell Recall",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19, "spellcasting": true }],
      "entries": [
        "You can cast any spell you have prepared without expending a spell slot. Once you cast a spell in this way, you can't do so again until you finish a Long Rest."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Epic Boon of Truesight",
      "source": "UA2024",
      "page": 1,
      "category": "EB",
      "prerequisite": [{ "level": 19 }],
      "entries": [
        "You have Truesight with a range of 60 feet."
      ],
      "_src": "UA 2024",
      "_catName": "Epic Boon"
    },
    {
      "name": "Atmokinesis",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Lightning Jolt", "entries": ["Once per turn when you cast a spell or hit with an attack roll and deal Bludgeoning, Piercing, Slashing, or Psychic damage, you can change the damage type to Lightning damage."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You know the Shocking Grasp cantrip. You also always have the Fog Cloud spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have of the appropriate level. When you cast these spells, they require no Verbal or Material components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for them (choose when you select this feat). When you reach character level 3, you also always have the Gust of Wind spell prepared and can cast it the same way."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Biokinesis",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Bend Life Energy", "entries": ["When a spell you cast restores Hit Points to a creature, you can roll 1d4 and add the number rolled to the total Hit Points restored. You can use this benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You know the Spare the Dying cantrip. You also always have the Healing Word spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have of the appropriate level. When you cast these spells, they require no Verbal or Material components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for them (choose when you select this feat). When you reach character level 3, you also always have the Arcane Vigor spell prepared and can cast it the same way."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Clairsentience",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Minor Foreknowledge", "entries": ["When you take the Search action, you can give yourself Advantage on any ability check made as part of that action. You can use this benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You know the Guidance cantrip. You also always have the Detect Evil and Good spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have of the appropriate level. When you cast these spells, they require no Verbal or Material components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you select this feat). When you reach character level 3, you also always have the See Invisibility spell prepared and can cast it the same way."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Cryokinesis",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Ice Manipulation", "entries": ["Once per turn when you cast a spell or hit with an attack roll and deal Bludgeoning, Piercing, Slashing, or Psychic damage, you can change the damage type to Cold damage."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You know the Ray of Frost cantrip. You also always have the Armor of Agathys and Ice Knife spells prepared. You can cast each spell once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast these spells using any spell slots you have. When you cast these spells, they require no Verbal or Material components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for them (choose when you select this feat)."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Empath",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Emotional Sense", "entries": ["When you take the Influence action, you can give yourself Advantage on any ability check made as part of that action. You can use this benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You always have the Charm Person spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have of the appropriate level. When you cast the spell, it requires no Verbal components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for this spell (choose when you select this feat). When you reach character level 3, you also always have the Calm Emotions spell prepared and can cast it the same way."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Flesh Morpher",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Flexible Flesh", "entries": ["When you make a Dexterity (Acrobatics or Sleight of Hand) check, you gain a bonus equal to your Intelligence modifier (minimum of +1). You can use this benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You always have the Longstrider spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have of the appropriate level. When you cast the spell, it requires no Verbal components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for this spell (choose when you select this feat). When you reach character level 3, you also always have the Alter Self spell prepared and can cast it the same way."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Mind Whisperer",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Limited Telepathy", "entries": ["As a Magic action, choose one creature you can see within 120 feet of yourself. You form a telepathic connection to that creature. For 1 hour, you and the chosen creature can communicate telepathically with each other while within 120 feet of each other. To understand each other, you each must mentally use a language the other knows. Once you use this benefit, you can't do so again until you finish a Short or Long Rest."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You know the Mind Sliver cantrip. You also always have the Dissonant Whispers spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have. When you cast these spells, they require no Verbal or Material components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for them (choose when you select this feat)."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Psi Trickster",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Cunning Mind", "entries": ["When you make a Charisma (Deception or Persuasion) check, you gain a bonus equal to your Intelligence modifier (minimum bonus of +1). You can use this benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You know the Minor Illusion cantrip. You also always have the Disguise Self spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have. When you cast these spells, they require no Verbal or Material components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for them (choose when you select this feat)."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Psykineticist",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Psi Boost", "entries": ["When you take the Dash action, you can increase your Speed by 10 feet until the start of your next turn. You can do this a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You know the Telekinetic Fling cantrip. You also always have the Thunderwave spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have. When you cast these spells, they require no Verbal components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for them (choose when you select this feat)."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    },
    {
      "name": "Pyrokinesis",
      "source": "UA2024",
      "page": 1,
      "category": "WT",
      "prerequisite": [{ "wildTalent": true }],
      "entries": [
        "Wild Talent Feat (Prerequisite: Can't Have Another Wild Talent Feat)",
        "You gain the following benefits:",
        { "type": "entries", "name": "Firestarter", "entries": ["Once per turn when you cast a spell or hit with an attack roll and deal Bludgeoning, Piercing, Slashing, or Psychic damage, you can change the damage type to Fire damage."] },
        { "type": "entries", "name": "Psionic Talent", "entries": ["You know the Produce Flame cantrip. You also always have the Burning Hands spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast it using any spell slots you have of the appropriate level. When you cast these spells, they require no Verbal or Material components, and Intelligence, Wisdom, or Charisma is your spellcasting ability for them (choose when you select this feat). When you reach character level 3, you also always have the Scorching Ray spell prepared and can cast it the same way."] }
      ],
      "_src": "UA 2024",
      "_catName": "Wild Talent"
    }
  ],
  "spell": [
    {
      "name": "Blade of Disaster",
      "source": "UA2024",
      "page": 1,
      "level": 9,
      "school": "C",
      "time": [{ "number": 1, "unit": "bonus" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
      "components": { "v": true, "s": true },
      "duration": [{ "type": "timed", "duration": { "type": "minute", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You create a blade-shaped planar rift about 3 feet long in an unoccupied space you can see within range. The blade lasts for the duration. When you create the blade, you can make up to two melee spell attacks with it against creatures within 5 feet of it. On a hit, the target takes 4d12 force damage. This attack scores a critical hit if the number on the d20 is 18 or higher. On a critical hit, the blade deals an extra 8d12 force damage (for a total of 12d12 force damage).",
        "As a Bonus Action on your turn, you can move the blade up to 30 feet to an unoccupied space you can see and then make up to two melee spell attacks with it again."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Tasha's Caustic Brew",
      "source": "UA2024",
      "page": 1,
      "level": 1,
      "school": "T",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "line", "distance": { "type": "feet", "amount": 30 } },
      "components": { "v": true, "s": true, "m": "a bit of rotten food" },
      "duration": [{ "type": "timed", "duration": { "type": "minute", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Artificer", "source": "TCE" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "A stream of acid emanates from you in a line 30 feet long and 5 feet wide in a direction you choose. Each creature in the line must succeed on a Dexterity saving throw or be covered in acid for the spell's duration or until a creature uses its action to scrape or wash the acid off itself or another creature. A creature covered in the acid takes 2d4 acid damage at the start of each of its turns.",
        "At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 2d4 for each slot level above 1st."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Booming Blade",
      "source": "UA2024",
      "page": 1,
      "level": 0,
      "school": "V",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 5 } },
      "components": { "s": true, "m": "a melee weapon worth at least 1 sp" },
      "duration": [{ "type": "timed", "duration": { "type": "round", "amount": 1 } }],
      "classes": { "fromClassList": [{ "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You brandish the weapon used in the spell's casting and make a melee attack with it against one creature within 5 feet of you. On a hit, the target suffers the weapon attack's normal effects and then becomes sheathed in booming energy until the start of your next turn. If the target willingly moves 5 feet or more before then, the target takes 1d8 thunder damage, and the spell ends.",
        "This spell's damage increases when you reach certain levels. At 5th level, the melee attack deals an extra 1d8 thunder damage to the target on a hit, and the damage the target takes for moving increases to 2d8. Both damage rolls increase by 1d8 at 11th level (2d8 and 3d8) and again at 17th level (3d8 and 4d8)."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Green-Flame Blade",
      "source": "UA2024",
      "page": 1,
      "level": 0,
      "school": "V",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 5 } },
      "components": { "s": true, "m": "a melee weapon worth at least 1 sp" },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You brandish the weapon used in the spell's casting and make a melee attack with it against one creature within 5 feet of you. On a hit, the target suffers the weapon attack's normal effects, and you can cause green fire to leap from the target to a different creature of your choice that you can see within 5 feet of it. The second creature takes fire damage equal to your spellcasting ability modifier.",
        "This spell's damage increases when you reach certain levels. At 5th level, the melee attack deals an extra 1d8 fire damage to the target on a hit, and the fire damage to the second creature increases to 1d8 + your spellcasting ability modifier. Both damage rolls increase by 1d8 at 11th level (2d8 and 2d8) and again at 17th level (3d8 and 3d8)."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Lightning Lure",
      "source": "UA2024",
      "page": 1,
      "level": 0,
      "school": "V",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 15 } },
      "components": { "v": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Artificer", "source": "TCE" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You create a lash of lightning energy that strikes at one creature of your choice that you can see within range. The target must succeed on a Strength saving throw or be pulled up to 10 feet in a straight line toward you and then take 1d8 lightning damage if it is within 5 feet of you.",
        "This spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8)."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Mind Sliver",
      "source": "UA2024",
      "page": 1,
      "level": 0,
      "school": "E",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
      "components": { "v": true },
      "duration": [{ "type": "timed", "duration": { "type": "round", "amount": 1 } }],
      "classes": { "fromClassList": [{ "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You drive a disorienting spike of psychic energy into the mind of one creature you can see within range. The target must succeed on an Intelligence saving throw or take 1d6 psychic damage and subtract 1d4 from the next saving throw it makes before the end of your next turn.",
        "This spell's damage increases by 1d6 when you reach certain levels: 5th level (2d6), 11th level (3d6), and 17th level (4d6)."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Sword Burst",
      "source": "UA2024",
      "page": 1,
      "level": 0,
      "school": "C",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 5 } },
      "components": { "v": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Artificer", "source": "TCE" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You create a momentary circle of spectral blades that sweep around you. All other creatures within 5 feet of you must succeed on a Dexterity saving throw or take 1d6 force damage.",
        "This spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6)."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Raulothim's Psychic Lance",
      "source": "UA2024",
      "page": 1,
      "level": 4,
      "school": "E",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 120 } },
      "components": { "v": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Bard", "source": "XPHB" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You unleash a shimmering lance of psychic power from your forehead at a creature that you can see within range. Alternatively, you can utter a creature's name. If the named target is within range, it becomes the spell's target even if you can't see it. If the named target isn't within range, the lance dissipates without effect.",
        "The target must make an Intelligence saving throw. On a failed save, the target takes 7d6 psychic damage and is incapacitated until the end of your next turn. On a successful save, the creature takes half as much damage and isn't incapacitated.",
        "At Higher Levels. When you cast this spell using a spell slot of 5th level or higher, the damage increases by 1d6 for each slot level above 4th."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Intellect Fortress",
      "source": "UA2024",
      "page": 1,
      "level": 3,
      "school": "A",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 30 } },
      "components": { "v": true },
      "duration": [{ "type": "timed", "duration": { "type": "hour", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Artificer", "source": "TCE" }, { "name": "Bard", "source": "XPHB" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "For the duration, you or one willing creature you can see within range has resistance to psychic damage, as well as advantage on Intelligence, Wisdom, and Charisma saving throws.",
        "At Higher Levels. When you cast this spell using a spell slot of 4th level or higher, you can target one additional creature for each slot level above 3rd. The creatures must be within 30 feet of each other when you target them."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Summon Shadowspawn",
      "source": "UA2024",
      "page": 1,
      "level": 3,
      "school": "C",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 90 } },
      "components": { "v": true, "s": true, "m": "tears inside a gem worth at least 300 gp" },
      "duration": [{ "type": "timed", "duration": { "type": "hour", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You call forth a shadowy spirit. It manifests in an unoccupied space that you can see within range. This corporeal form uses the Shadow Spirit stat block. When you cast the spell, choose an emotion: Fury, Despair, or Fear. The creature resembles a misshapen biped marked by the chosen emotion, which determines certain traits in its stat block. The creature disappears when it drops to 0 hit points or when the spell ends.",
        "The creature is an ally to you and your companions. In combat, the creature shares your initiative count, but it takes its turn immediately after yours. It obeys your verbal commands (no action required by you). If you don't issue any, it takes the Dodge action and uses its move to avoid danger.",
        "At Higher Levels. When you cast this spell using a spell slot of 4th level or higher, use the higher level wherever the spell's level appears in the stat block."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Telekinetic Fling",
      "source": "UA2024",
      "page": 11,
      "level": 0,
      "school": "V",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
      "components": { "v": true, "m": "an arrow, bolt, bullet, or needle worth at least 1 CP" },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }] },
      "entries": [
        "You brandish the ammunition used to cast this spell and fire it at a creature within range using psionic energy. Make a ranged spell attack against the target. On a hit, the target takes 1d10 Force damage, and the ammunition is destroyed.",
        "Cantrip Upgrade. The damage increases by 1d10 when you reach levels 5 (2d10), 11 (3d10), and 17 (4d10)."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Tasha's Mind Whip",
      "source": "UA2024",
      "page": 11,
      "level": 2,
      "school": "E",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 90 } },
      "components": { "v": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You psychically lash out at one creature you can see within range. The target must make an Intelligence saving throw. On a failed save, the target takes 3d6 Psychic damage, and it can't make Opportunity Attacks until the end of its next turn. Moreover, on its next turn, it can take either an action or a Bonus Action, not both. On a successful save, the target takes half as much damage only.",
        "Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 2."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Telekinetic Crush",
      "source": "UA2024",
      "page": 11,
      "level": 3,
      "school": "T",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 120 } },
      "components": { "v": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }] },
      "entries": [
        "You create a field of crushing telekinetic force in a 30-foot Cube within range. Each creature in the area makes a Strength saving throw. On a failed save, a target takes 5d6 Force damage and has the Prone condition. On a successful save, a target takes half as much damage only.",
        "Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 3."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Intellect Fortress",
      "source": "UA2024",
      "page": 10,
      "level": 3,
      "school": "A",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 30 } },
      "components": { "v": true },
      "duration": [{ "type": "timed", "duration": { "type": "hour", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Artificer", "source": "TCE" }, { "name": "Bard", "source": "XPHB" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "For the duration, one willing creature you can see within range has Resistance to Psychic damage, as well as Advantage on Intelligence, Wisdom, and Charisma saving throws.",
        "Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 3."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Raulothim's Psychic Lance",
      "source": "UA2024",
      "page": 10,
      "level": 4,
      "school": "E",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 120 } },
      "components": { "v": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Bard", "source": "XPHB" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You unleash a shimmering lance of psychic power at a creature you can see within range. Alternatively, you can utter a creature's name; if the named target is within range, it becomes the target even if you can't see it (pseudonyms or nicknames don't work).",
        "The target must make an Intelligence saving throw. On a failed save, the target takes 7d6 Psychic damage and has the Incapacitated condition until the start of your next turn. On a successful save, the target takes half as much damage only.",
        "Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 4."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Summon Astral Entity",
      "source": "UA2024",
      "page": 10,
      "level": 3,
      "school": "C",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 90 } },
      "components": { "v": true, "s": true, "m": "a gem or crystal worth 300+ GP" },
      "duration": [{ "type": "timed", "duration": { "type": "hour", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You call forth the spirit of a psionic entity that manifests in an unoccupied space within range. Choose Crystal Entity, Ectoplasmic Entity, or Ghostly Entity. The creature is an ally that acts on your Initiative immediately after you, following your verbal commands.",
        "Crystal Entity: AC 11 + spell level + 2; Crystal Strike (melee, 1d10+3+spell level Piercing); Reaction—Shard Swarm: halve incoming melee damage and teleport 30 ft.",
        "Ectoplasmic Entity: AC 11 + spell level; Incorporeal Passage; Ectoplasmic Splash (ranged 30 ft, 1d6+3+spell level Psychic; hit or miss reduces targets' Speed by 5 ft).",
        "Ghostly Entity: AC 11 + spell level; Incorporeal Passage; Fly 30 ft; Ephemeral Ray (ranged 120 ft, 1d8+3+spell level Psychic).",
        "HP: 40 + 10 per spell level above 3. Multiattack: attacks equal to half spell level (rounded down).",
        "Using a Higher-Level Spell Slot. Use the slot's level in the stat block."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Enemies Abound",
      "source": "UA2024",
      "page": 12,
      "level": 3,
      "school": "E",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 120 } },
      "components": { "v": true, "s": true },
      "duration": [{ "type": "timed", "duration": { "type": "minute", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You reach into the mind of one creature you can see within range and force it to believe it is surrounded by enemies. The target must succeed on an Intelligence saving throw or lose the ability to distinguish friend from foe for the duration. Each time the target takes damage, it can repeat the saving throw, ending the effect on a success.",
        "While affected, the target chooses its targets randomly from among all creatures it can see, including its allies. It can't maintain Concentration on spells. If no valid target is visible, the creature is Incapacitated."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Mental Prison",
      "source": "UA2024",
      "page": 12,
      "level": 6,
      "school": "I",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
      "components": { "s": true },
      "duration": [{ "type": "timed", "duration": { "type": "minute", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You attempt to bind a creature within an illusory cell that only it perceives. One creature you can see within range must succeed on an Intelligence saving throw or become trapped. On a failed save, the target is surrounded by an illusory wall or barrier it cannot see past or move through.",
        "While imprisoned: the target is Restrained; if it tries to move or reach beyond the barrier, it takes 5d10 Psychic damage; any teleportation or planar travel out of the prison also deals 5d10 Psychic damage.",
        "At the end of each of its turns, the target repeats the saving throw, ending the effect on a success."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Abi-Dalzim's Horrid Wilting",
      "source": "UA2024",
      "page": 12,
      "level": 8,
      "school": "N",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 150 } },
      "components": { "v": true, "s": true, "m": "a bit of sponge" },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Wizard", "source": "XPHB" }] },
      "entries": [
        "You draw the moisture from every creature in a 30-foot Cube centered on a point you choose within range. Each creature in that area must make a Constitution saving throw. Constructs and undead aren't affected. Plants and water elementals have Disadvantage on the saving throw.",
        "On a failed save, a creature takes 12d8 Necrotic damage. On a successful save, a creature takes half as much damage."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Life Siphon",
      "source": "UA2024",
      "page": 12,
      "level": 1,
      "school": "V",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
      "components": { "v": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }] },
      "entries": [
        "You drain the life force of a creature you can see within range. The target must make a Constitution saving throw. On a failed save, the target takes 2d6 Necrotic damage, and you regain Hit Points equal to half the damage dealt. On a successful save, the target takes half as much damage, and you don't regain Hit Points.",
        "Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 1."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Ego Whip",
      "source": "UA2024",
      "page": 12,
      "level": 2,
      "school": "E",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 30 } },
      "components": { "v": true },
      "duration": [{ "type": "timed", "duration": { "type": "round", "amount": 1 } }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }] },
      "entries": [
        "You assail the mind of one creature you can see within range, filling it with self-doubt. The target must succeed on an Intelligence saving throw. On a failed save, the target takes 3d8 Psychic damage and has the Frightened condition until the start of your next turn. While Frightened by this spell, the target can't benefit from any bonus to its attack rolls. On a successful save, the target takes half as much damage only.",
        "Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 2."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Ectoplasmic Trail",
      "source": "UA2024",
      "page": 12,
      "level": 2,
      "school": "N",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
      "components": { "v": true, "s": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }] },
      "entries": [
        "You create a trail of ectoplasmic slime connecting two points within range that you can see. The trail is 5 feet wide and up to 30 feet long. The trail is Difficult Terrain for all creatures except you. The first time a creature other than you enters the trail on a turn or starts its turn there, it must succeed on a Dexterity saving throw or have the Restrained condition until the start of its next turn.",
        "Using a Higher-Level Spell Slot. The length of the trail increases by 10 feet for each spell slot level above 2."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Bleeding Darkness",
      "source": "UA2024",
      "page": 12,
      "level": 3,
      "school": "V",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
      "components": { "v": true, "m": "a vial of blood" },
      "duration": [{ "type": "timed", "duration": { "type": "minute", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }] },
      "entries": [
        "You create a sphere of bleeding psionic darkness at a point you can see within range. The sphere is 20 feet in radius and heavily obscures the area. Any creature that starts its turn inside the sphere or enters it for the first time on a turn must make a Constitution saving throw, taking 3d8 Necrotic damage on a failed save or half as much on a success.",
        "Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 3."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Life Inversion Field",
      "source": "UA2024",
      "page": 12,
      "level": 4,
      "school": "A",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
      "components": { "v": true, "s": true },
      "duration": [{ "type": "timed", "duration": { "type": "minute", "amount": 1 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }] },
      "entries": [
        "You create a 20-foot-radius sphere of inverting life energy centered on a point within range. Each creature that starts its turn inside the sphere must make a Constitution saving throw. On a failed save, the target takes 4d8 Necrotic damage and you regain Hit Points equal to half the damage dealt. On a successful save, the target takes half as much damage and you don't regain Hit Points.",
        "Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 4."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Psionic Blast",
      "source": "UA2024",
      "page": 12,
      "level": 6,
      "school": "V",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "special" },
      "components": { "v": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }] },
      "entries": [
        "You unleash a devastating cone of psionic force. Each creature in a 60-foot Cone originating from you must make an Intelligence saving throw. On a failed save, a creature takes 10d6 Psychic damage and has the Stunned condition until the start of your next turn. On a successful save, a creature takes half as much damage only.",
        "Using a Higher-Level Spell Slot. The damage increases by 2d6 for each spell slot level above 6."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Thought Form",
      "source": "UA2024",
      "page": 12,
      "level": 6,
      "school": "T",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "self" },
      "components": { "v": true, "s": true, "m": "a crystal or gem worth at least 100 GP" },
      "duration": [{ "type": "timed", "duration": { "type": "minute", "amount": 10 }, "concentration": true }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }] },
      "entries": [
        "You transform your body into pure psionic thought energy. For the duration: you gain a Fly Speed of 60 feet and can hover; you are immune to the Prone condition and to nonmagical Bludgeoning, Piercing, and Slashing damage; you can move through other creatures and objects as if they were Difficult Terrain (you take 5 Force damage if you end your turn inside a solid object); and you can't speak or cast spells with Verbal components.",
        "Using a Higher-Level Spell Slot. The duration increases to 1 hour for a level 7 slot or higher."
      ],
      "_src": "UA 2024"
    },
    {
      "name": "Psychic Scream",
      "source": "UA2024",
      "page": 10,
      "level": 9,
      "school": "E",
      "time": [{ "number": 1, "unit": "action" }],
      "range": { "type": "point", "distance": { "type": "feet", "amount": 90 } },
      "components": { "s": true },
      "duration": [{ "type": "instant" }],
      "classes": { "fromClassList": [{ "name": "Psion", "source": "UA2024" }, { "name": "Bard", "source": "XPHB" }, { "name": "Sorcerer", "source": "XPHB" }, { "name": "Warlock", "source": "XPHB" }] },
      "entries": [
        "You blast the intellect of up to ten creatures of your choice that you can see within range (creatures with Intelligence 2 or lower are unaffected). Each target makes an Intelligence saving throw. On a failed save, the target takes 14d6 Psychic damage and has the Stunned condition. On a success, half damage only. If a target is reduced to 0 HP, its head explodes (if it has one). At the end of each of the Stunned target's turns, it repeats the save, ending the condition on a success."
      ],
      "_src": "UA 2024"
    }
  ],
  "class": [
    {
      "name": "Psion",
      "source": "UA2024",
      "page": 1,
      "hd": { "number": 1, "faces": 6 },
      "proficiency": ["int", "wis"],
      "spellcastingAbility": "int",
      "casterProgression": "full",
      "cantripProgression": [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      "preparedSpellsProgression": [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
      "startingProficiencies": {
        "armor": [],
        "weapons": ["simple"],
        "skills": [{ "choose": { "from": ["arcana", "insight", "intimidation", "investigation", "medicine", "perception", "persuasion"], "count": 2 } }]
      },
      "startingEquipment": {
        "defaultData": [
          {
            "a": [
              { "item": "Spear|PHB" },
              { "item": "Dagger|PHB", "quantity": 2 },
              { "item": "Light Crossbow|PHB" },
              { "item": "Bolt|PHB", "quantity": 20 },
              { "special": "Crossbow Bolt Case" },
              { "item": "Dungeoneer's Pack|PHB" },
              { "value": 600 }
            ],
            "b": [{ "value": 5000 }]
          }
        ]
      },
      "subclassTitle": "Psionic Subclass",
      "_src": "UA 2024",
      "spellListNames": [
        "Blade Ward","Dancing Lights","Friends","Light","Mage Hand","Mending","Message","Mind Sliver","Minor Illusion","Prestidigitation","Telekinetic Fling","True Strike",
        "Animal Friendship","Charm Person","Command","Comprehend Languages","Detect Magic","Dissonant Whispers","Feather Fall","Identify","Jump","Life Siphon","Longstrider","Mage Armor","Sanctuary","Shield","Silent Image","Sleep","Speak with Animals","Tasha's Hideous Laughter","Tenser's Floating Disk","Thunderwave",
        "Animal Messenger","Blindness/Deafness","Calm Emotions","Crown of Madness","Detect Thoughts","Ectoplasmic Trail","Ego Whip","Enhance Ability","Enlarge/Reduce","Enthrall","Heat Metal","Hold Person","Invisibility","Knock","Levitate","Locate Animals or Plants","Locate Object","Magic Mouth","Mind Spike","Mirror Image","Phantasmal Force","See Invisibility","Shatter","Silence","Suggestion","Tasha's Mind Whip","Zone of Truth",
        "Bestow Curse","Bleeding Darkness","Clairvoyance","Dispel Magic","Enemies Abound","Fear","Fly","Hypnotic Pattern","Intellect Fortress","Major Image","Nondetection","Sending","Summon Astral Entity","Telekinetic Crush","Tongues",
        "Arcane Eye","Banishment","Charm Monster","Compulsion","Confusion","Dimension Door","Freedom of Movement","Greater Invisibility","Hallucinatory Terrain","Life Inversion Field","Locate Creature","Phantasmal Killer","Polymorph","Raulothim's Psychic Lance","Summon Aberration",
        "Animate Objects","Awaken","Contact Other Plane","Dominate Person","Dream","Geas","Hold Monster","Legend Lore","Mislead","Modify Memory","Rary's Telepathic Bond","Scrying","Seeming","Synaptic Static","Telekinesis","Teleportation Circle",
        "Blade Barrier","Disintegrate","Eyebite","Find the Path","Mass Suggestion","Mental Prison","Move Earth","Otto's Irresistible Dance","Programmed Illusion","Psionic Blast","Thought Form","True Seeing",
        "Etherealness","Forcecage","Mirage Arcane","Plane Shift","Power Word Fortify","Project Image","Reverse Gravity","Teleport",
        "Abi-Dalzim's Horrid Wilting","Antimagic Field","Antipathy/Sympathy","Befuddlement","Dominate Monster","Glibness","Maze","Mind Blank","Power Word Stun","Telepathy",
        "Astral Projection","Foresight","Power Word Heal","Power Word Kill","Psychic Scream","Shapechange","Time Stop","Weird"
      ],
      "entries": [
        { "level": 1, "type": "entries", "name": "Spellcasting", "entries": [
          "You have learned how to channel magical energy using the power of your mind. Intelligence is your spellcasting ability for your Psion spells.",
          "Cantrips. You know two Psion cantrips of your choice. Whenever you gain a Psion level, you can replace one cantrip from this feature with another Psion cantrip. You gain additional cantrips at Psion levels 4 and 10.",
          "Spell Slots. The Psion Features table shows how many spell slots you have. You regain all expended spell slots when you finish a Long Rest.",
          "Prepared Spells. Choose four level 1 Psion spells to start. The number increases as you gain Psion levels (see the Prepared Spells column). Whenever that number increases, choose additional Psion spells. Whenever you gain a Psion level, you can replace one spell on your list with another eligible Psion spell.",
          "Psionic Spellcasting. When you cast a Psion spell, it doesn't require a Verbal or Material component, except Material components that are consumed by the spell or have a cost specified in the spell."
        ]},
        { "level": 1, "type": "entries", "name": "Psionic Power", "entries": [
          "You harbor a wellspring of psionic energy within yourself, represented by your Psionic Energy Dice. Your Psion level determines the die size and number of Psionic Energy Dice you have (see the Energy Dice column of the Psion Features table): 4d6 at levels 1–4, 6d8 at levels 5–8, 8d8 at levels 9–10, 8d10 at levels 11–12, 10d10 at levels 13–16, 12d12 at levels 17–20.",
          "You regain one expended Psionic Energy Die when you finish a Short Rest, and you regain all of them when you finish a Long Rest.",
          "Telekinetic Propel (Bonus Action): Choose one Large or smaller creature other than you that you can see within 30 feet. The target must succeed on a Strength saving throw or be moved 5 feet straight toward or away from you. Alternatively, roll one Psionic Energy Die — the distance is 5 times the number rolled. The die is expended only if the target fails the save.",
          "Telepathic Connection (Bonus Action): You have telepathy with a range of 30 feet. You can roll one Psionic Energy Die. For the next hour, your telepathy range increases by 10 times the number rolled. The first time you use this after each Long Rest, you don't expend the die. All other times, the die is expended."
        ]},
        { "level": 1, "type": "entries", "name": "Subtle Telekinesis", "entries": ["You know the Mage Hand cantrip. You can cast it without Somatic components, and you can make the spectral hand Invisible when you cast it."] },
        { "level": 2, "type": "entries", "name": "Psionic Discipline", "entries": [
          "You learn further psionic techniques fueled by your Psionic Energy Dice. You gain two disciplines of your choice (such as Expanded Awareness and Id Insinuation). You can use only one Discipline each turn and only once per turn, unless otherwise noted.",
          "Whenever you gain a Psion level, you can replace one of your Psionic Discipline options with one you don't know. You gain one additional option at Psion levels 5, 10, 13, and 17 (6 total)."
        ]},
        { "level": 3, "type": "entries", "name": "Psion Subclass", "entries": ["You gain a Psion subclass of your choice: Metamorph, Psykinetic, or Telepath. You gain subclass features at Psion levels 3, 6, 10, and 14."] },
        { "level": 4, "type": "entries", "name": "Ability Score Improvement", "entries": ["You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Psion levels 8, 12, and 16."] },
        { "level": 5, "type": "entries", "name": "Psionic Restoration", "entries": ["You can perform a meditation that focuses the mind for 1 minute. At the end of it, you regain all expended Psionic Energy Dice. Once you use this feature, you can't do so again until you finish a Long Rest."] },
        { "level": 7, "type": "entries", "name": "Psionic Surge", "entries": ["You can push your psionic powers using your life force. After you roll one or more Psionic Energy Dice, you can expend one of your Hit Point Dice and treat any roll of 1, 2, or 3 on those Psionic Energy Dice as a 4."] },
        { "level": 18, "type": "entries", "name": "Psionic Reserves", "entries": ["When you roll Initiative, you regain expended Psionic Energy Dice until you have four, if you have fewer than that."] },
        { "level": 19, "type": "entries", "name": "Epic Boon", "entries": ["You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Energy Resistance is recommended."] },
        { "level": 20, "type": "entries", "name": "Enkindled Life Force", "entries": ["Once per turn, when you roll one or more Psionic Energy Dice for a Psion feature or Psionic Discipline, you can expend one or two of your Hit Point Dice. For each Hit Point Die expended, roll an additional Psionic Energy Die and add the number rolled to the total. This roll does not expend the Psionic Energy Die."] }
      ]
    }
  ],
  "subclass": [
    {
      "name": "Metamorph",
      "shortName": "Metamorph",
      "source": "UA2024",
      "className": "Psion",
      "classSource": "UA2024",
      "page": 7,
      "entries": [{ "type": "entries", "name": "Metamorph", "entries": [
        "Your mastery of psionic powers turns inward, molding your own flesh as the perfect vessel of psionic power.",
        { "type": "entries", "name": "Level 3: Metamorph Spells", "entries": ["Always prepared — Level 3: Alter Self, Cure Wounds, Inflict Wounds, Lesser Restoration. Level 5: Aura of Vitality, Haste. Level 7: Polymorph, Stoneskin. Level 9: Contagion, Mass Cure Wounds."] },
        { "type": "entries", "name": "Level 3: Mutable Form", "entries": ["Bonus Action: Expend one Psionic Energy Die to psionically stretch your limbs for 1 minute. Roll the die and gain Temporary Hit Points equal to the number rolled plus your Intelligence modifier (minimum 1). While active: your Reach increases by 5 feet; your Speed increases by 5 feet; when you cast a Touch spell with a casting time of an action, the range becomes 10 feet."] },
        { "type": "entries", "name": "Level 3: Organic Weapons", "entries": ["Magic action: Reform your free hand into one of the following. You can use your Intelligence modifier for attack and damage rolls.\nBone Blade: Simple Melee, Finesse, 1d8 Piercing. Advantage on attack rolls if an ally within 5 ft of the target isn't Incapacitated.\nFlesh Maul: Simple Melee, 1d10 Bludgeoning. Target has Disadvantage on the next Strength or Constitution saving throw it makes before the start of its next turn.\nViscera Launcher: Simple Ranged, 30/90 ft, 1d6 Acid. Once per turn on a hit, deal an extra 1d6 Acid damage."] },
        { "type": "entries", "name": "Level 6: Extra Attack", "entries": ["You can attack twice instead of once whenever you take the Attack action. You can cast one Psion cantrip with a casting time of an action in place of one of those attacks."] },
        { "type": "entries", "name": "Level 6: Flesh Warper", "entries": ["When you use Mutable Form, you can expend an additional Psionic Energy Die to gain these benefits while the feature is active:\nOrganic Defense: You gain a +2 bonus to AC.\nEmpowered Healing: When you cast a spell with a spell slot that restores Hit Points to one or more creatures, you can expend one Psionic Energy Die, roll it, and add the number rolled to the Hit Points regained."] },
        { "type": "entries", "name": "Level 10: Improved Mutable Form", "entries": ["When you use Mutable Form, the duration increases to 10 minutes and you choose one benefit:\nStony Epidermis: Advantage on Constitution saving throws to maintain Concentration, and Resistance to one damage type of your choice (Acid, Bludgeoning, Cold, Fire, Lightning, Piercing, Poison, Slashing, or Thunder).\nSuperior Stride: While unarmored, you can Dash as a Bonus Action, and you gain a Climb Speed and Swim Speed equal to your Speed.\nUnnatural Flexibility: +1 bonus to AC, you can move through spaces as narrow as 1 inch, and you can spend 5 feet of movement to escape nonmagical restraints or end the Grappled condition."] },
        { "type": "entries", "name": "Level 14: Life-Bending Weapons", "entries": ["When you hit a target with an Organic Weapon, roll one Psionic Energy Die — the target takes extra Necrotic damage equal to the roll. This roll doesn't expend the die.\nAlternatively, when you hit with an Organic Weapon, you can expend one Psionic Energy Die and roll it. The target takes extra Necrotic damage equal to the roll, and each creature of your choice in a 30-foot Emanation from you regains Hit Points equal to the roll plus your Intelligence modifier. Once you use this alternative, you can't do so again until the start of your next turn."] }
      ]}]
    },
    {
      "name": "Psi Warper",
      "shortName": "Psi Warper",
      "source": "UA2024",
      "className": "Psion",
      "classSource": "UA2024",
      "page": 8,
      "entries": [{ "type": "entries", "name": "Psi Warper", "entries": [
        "Psi Warpers tune their psionic powers to manipulating the space between objects, teleporting across the battlefield and creating vacuums.",
        { "type": "entries", "name": "Level 3: Psi Warper Spells", "entries": ["Always prepared — Level 3: Expeditious Retreat, Feather Fall, Misty Step, Shatter. Level 5: Blink, Haste. Level 7: Banishment, Dimension Door. Level 9: Steel Wind Strike, Teleportation Circle."] },
        { "type": "entries", "name": "Level 3: Teleportation", "entries": ["You can cast Misty Step without expending a spell slot, and you must finish a Long Rest before you can cast it this way again. You can also restore your use of it by expending one Psionic Energy Die (no action required)."] },
        { "type": "entries", "name": "Level 3: Warp Propel", "entries": ["When a target fails its saving throw against your Telekinetic Propel, instead of pushing it, you can teleport the target to an unoccupied space you can see within 30 feet of you that is horizontal to you."] },
        { "type": "entries", "name": "Level 6: Warp Space", "entries": ["When you cast Shatter, you can expend one Psionic Energy Die to modify the spell so that the radius of the spell's Sphere becomes 20 feet. In addition, creatures that fail the saving throw against the spell are pulled straight toward the center of the Sphere, ending in an unoccupied space as close to the center as possible."] },
        { "type": "entries", "name": "Level 6: Teleporter Combat", "entries": ["Immediately after you cast Misty Step, you can cast one of your Psion cantrips that has a casting time of an action as part of the Bonus Action."] },
        { "type": "entries", "name": "Level 10: Duplicitous Target", "entries": ["Reaction: When a creature you can see makes an attack roll against you, you can expend one Psionic Energy Die and choose a willing creature you can see within 30 feet of yourself that doesn't have the Incapacitated condition. You and the willing creature teleport, swapping places. The creature then becomes the target of the attack roll."] },
        { "type": "entries", "name": "Level 14: Mass Teleportation", "entries": ["Magic Action: Expend four Psionic Energy Dice and choose Huge or smaller creatures within 30 feet of yourself, up to a number equal to your Intelligence modifier (minimum 1). Each chosen creature is teleported to an unoccupied space you can see within 150 feet of you. An unwilling creature that succeeds on a Wisdom saving throw against your spell save DC is unaffected."] }
      ]}]
    },
    {
      "name": "Psykinetic",
      "shortName": "Psykinetic",
      "source": "UA2024",
      "className": "Psion",
      "classSource": "UA2024",
      "page": 8,
      "entries": [{ "type": "entries", "name": "Psykinetic", "entries": [
        "A Psykinetic bends telekinetic energies into sturdy barriers and strikes with the force of a battering ram.",
        { "type": "entries", "name": "Level 3: Psykinetic Spells", "entries": ["Always prepared — Level 3: Cloud of Daggers, Levitate, Shield, Thunderwave. Level 5: Slow, Telekinetic Crush. Level 7: Otiluke's Resilient Sphere, Stone Shape. Level 9: Telekinesis, Wall of Force."] },
        { "type": "entries", "name": "Level 3: Stronger Telekinesis", "entries": ["When you cast Mage Hand, its range increases by 30 feet and the hand can carry up to 20 pounds."] },
        { "type": "entries", "name": "Level 3: Telekinetic Techniques", "entries": ["When you use Telekinetic Propel, you can roll 1d4 and use the number rolled instead of expending a Psionic Energy Die.\nIn addition, when a target fails the saving throw against your Telekinetic Propel, you can impose one of the following effects:\nBoost: The target's Speed increases by 10 feet until the start of your next turn.\nDisorient: The target can't make Opportunity Attacks until the start of its next turn.\nTelekinetic Bolt: The target takes Force damage equal to the number rolled on the Psionic Energy Die."] },
        { "type": "entries", "name": "Level 6: Destructive Trance", "entries": ["At the start of your turn, you can expend one Psionic Energy Die to enter a destructive state. For the next 10 minutes, you gain a Fly Speed of 20 feet and can hover, and when you cast a Psion spell that expends a spell slot, you can roll your Psionic Energy Die and add the number rolled to one damage roll of that spell. This roll doesn't expend the Psionic Energy Die."] },
        { "type": "entries", "name": "Level 6: Rebounding Field", "entries": ["When you cast Shield in response to being hit by an attack roll and cause the triggering attack to miss, you can expend one Psionic Energy Die to launch the force back at the attacker. The attacker makes a Dexterity saving throw. Roll one Psionic Energy Die.\nOn a failed save: the attacker takes Force damage equal to the roll + your Intelligence modifier.\nOn a successful save: the attacker takes half as much damage only.\nWhether the target fails or succeeds, you gain Temporary Hit Points equal to the amount of damage dealt."] },
        { "type": "entries", "name": "Level 10: Enhanced Telekinetic Crush", "entries": ["When you cast Telekinetic Crush, you can expend one Psionic Energy Die to modify the spell so that whether a creature fails or succeeds on the saving throw, its Speed is halved until the start of your next turn. You also roll the expended die and add the number rolled to one damage roll of the spell."] },
        { "type": "entries", "name": "Level 14: Heightened Telekinesis", "entries": ["You can cast Telekinesis without expending a spell slot by instead expending four Psionic Energy Dice. When you do, you can modify the spell so that it doesn't require Concentration — if you do, the spell's duration becomes 1 minute and you can target Gargantuan creatures and objects."] }
      ]}]
    },
    {
      "name": "Telepath",
      "shortName": "Telepath",
      "source": "UA2024",
      "className": "Psion",
      "classSource": "UA2024",
      "page": 9,
      "entries": [{ "type": "entries", "name": "Telepath", "entries": [
        "Telepaths are masters of mind magic, bolstering mental defenses of allies or probing the thoughts of others undetected.",
        { "type": "entries", "name": "Level 3: Telepath Spells", "entries": ["Always prepared — Level 3: Bane, Command, Detect Thoughts, Mind Spike. Level 5: Counterspell, Slow. Level 7: Compulsion, Confusion. Level 9: Modify Memory, Yolande's Regal Presence."] },
        { "type": "entries", "name": "Level 3: Mind Infiltrator", "entries": ["When you cast Detect Thoughts, you can expend one Psionic Energy Die to modify the spell so that it doesn't require spell components or Concentration. In addition, when you use the Read Thoughts effect of the spell, the target doesn't know you're probing its mind if it fails the Wisdom saving throw."] },
        { "type": "entries", "name": "Level 3: Telepathic Distraction", "entries": ["When a creature you can see within range of your telepathy hits with an attack roll, you can take a Reaction to roll one Psionic Energy Die and subtract the number rolled from the attack roll, potentially causing the attack to miss. The die is expended only if the target misses the attack."] },
        { "type": "entries", "name": "Level 6: Bulwark Mind", "entries": ["At the start of your turn, you can expend one Psionic Energy Die to enter a fortified state for 10 minutes. While in this state: you have Resistance to Psychic damage; and whenever you make an Intelligence, Wisdom, or Charisma saving throw, you add a roll of your Psionic Energy Die to the save (this roll doesn't expend the die). You can't use this benefit while Incapacitated."] },
        { "type": "entries", "name": "Level 6: Potent Thoughts", "entries": ["You have telepathy with a range of 60 feet. In addition, you add your Intelligence modifier to the damage you deal with any Psion cantrip."] },
        { "type": "entries", "name": "Level 10: Telepathic Bolstering", "entries": ["When you or a creature you can see within range of your telepathy fails an ability check or misses with an attack roll, you can take a Reaction to expend one Psionic Energy Die. Roll the die and add the number rolled to the d20, potentially turning a failed check into a success or a miss into a hit. The die is expended only if the check succeeds or the attack hits."] },
        { "type": "entries", "name": "Level 14: Scramble Minds", "entries": ["You can cast Confusion without expending a spell slot by instead expending four Psionic Energy Dice. When you do, you can modify the spell so that its Sphere becomes 30 feet in radius, and you can choose one creature you can see in the area to automatically succeed on their saving throw against the spell.\nIn addition, when a creature under the effect of the spell starts its turn, you choose their behavior from the table for that turn instead of the creature rolling to determine its behavior."] }
      ]}]
    },
    {
      "name": "Path of the World Tree",
      "shortName": "World Tree",
      "source": "UA2024",
      "className": "Barbarian",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Path of the World Tree",
          "entries": [
            "Barbarians who follow the Path of the World Tree believe that their rage connects them to the cosmic tree Yggdrasil, the axis around which the multiverse turns. These barbarians use that connection to travel between worlds, to access the wisdom of the ancients, and to draw on the power of the tree itself.",
            {
              "type": "entries",
              "name": "3rd Level: Vitality of the Tree",
              "entries": ["Your Rage now carries the vitality of the World Tree. While in a Rage, at the start of each of your turns, you gain Temporary Hit Points equal to your Rage Damage bonus."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Branches of the Tree",
              "entries": ["While in a Rage, you can use a Bonus Action to teleport up to 60 feet to an unoccupied space you can see. When you do, each creature of your choice that you can see within 5 feet of your destination space takes Force damage equal to twice your Rage Damage bonus."]
            },
            {
              "type": "entries",
              "name": "6th Level: Battering Roots",
              "entries": ["During your Rage, your reach is 10 feet greater than normal, and when you hit a creature with a melee weapon attack using that extra reach, you can move that creature up to 15 feet toward or away from you in a straight line."]
            },
            {
              "type": "entries",
              "name": "10th Level: Travel along the Tree",
              "entries": ["You can cast the Tree Stride spell, without expending a spell slot. Once you cast the spell this way, you can't do so again until you finish a Long Rest."]
            },
            {
              "type": "entries",
              "name": "14th Level: Roots of the World Tree",
              "entries": ["While in a Rage, you can use your action to cause spectral roots to erupt from the ground around you. Each creature in a 20-foot radius must make a Strength saving throw (DC = 8 + your proficiency bonus + your Strength modifier). On a failed save, a creature is Restrained until your Rage ends."]
            }
          ]
        }
      ]
    },
    {
      "name": "College of Dance",
      "shortName": "Dance",
      "source": "UA2024",
      "className": "Bard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "College of Dance",
          "entries": [
            "Bards of the College of Dance know that the words of a song are mere vehicles for the power of movement. They practice a style of performance that is entirely dependent on motion.",
            {
              "type": "entries",
              "name": "3rd Level: Dazzling Footwork",
              "entries": ["While you aren't wearing armor or wielding a Shield, you gain the following benefits: Unarmored Defense — your AC equals 10 + your Dexterity modifier + your Charisma modifier. Agile Strikes — when you expend a use of your Bardic Inspiration as part of an action, you can make one Unarmed Strike as a Bonus Action."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Inspiring Movement",
              "entries": ["When an enemy you can see ends its turn within 5 feet of an ally of yours who is within 60 feet of you, you can use your Reaction and expend one use of Bardic Inspiration to move that ally up to half their Speed. This movement doesn't provoke Opportunity Attacks."]
            },
            {
              "type": "entries",
              "name": "6th Level: Tandem Footwork",
              "entries": ["When you roll Initiative, you can expend one use of your Bardic Inspiration. When you do, roll the Bardic Inspiration die, and give a number of allies equal to the number rolled a d6 Bardic Inspiration die."]
            },
            {
              "type": "entries",
              "name": "14th Level: Leading Evasion",
              "entries": ["When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw. In addition, you can use your Reaction to grant this benefit to one creature you can see within 5 feet of you, having them also take no damage on a successful save."]
            }
          ]
        }
      ]
    },
    {
      "name": "Circle of the Sea",
      "shortName": "Sea",
      "source": "UA2024",
      "className": "Druid",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Circle of the Sea",
          "entries": [
            "Druids of the Circle of the Sea draw power from the vast depths of the ocean. They command the winds and waves, conjuring storms, and calling down the devastating power of the sea.",
            {
              "type": "entries",
              "name": "3rd Level: Wrath of the Sea",
              "entries": ["As a Bonus Action, you can expend a use of Wild Shape to manifest a 5-foot aura of stormy ocean water that lasts for 10 minutes. While the aura is active, you gain Temporary Hit Points equal to your Wisdom modifier at the start of each of your turns. When a creature enters the aura for the first time on a turn or starts its turn there, you can force it to make a Constitution saving throw against your spell save DC. On a failed save, the creature takes Cold damage and Thunder damage each equal to your Wisdom modifier and is pushed 15 feet away from you."]
            },
            {
              "type": "entries",
              "name": "6th Level: Aquatic Affinity",
              "entries": ["You gain a Swim speed equal to your Speed. You can breathe both air and water. While submerged in water, you gain Darkvision with a range of 60 feet."]
            },
            {
              "type": "entries",
              "name": "10th Level: Stormborn",
              "entries": ["Your Wrath of the Sea aura now extends to 10 feet. You also gain Resistance to Cold and Lightning damage."]
            },
            {
              "type": "entries",
              "name": "14th Level: Oceanic Gift",
              "entries": ["As a Bonus Action, you can teleport to a body of water you can see within 60 feet, or you can cast Control Water at its lowest level without expending a spell slot."]
            }
          ]
        }
      ]
    },
    {
      "name": "Battle Master",
      "shortName": "Battle Master",
      "source": "UA2024",
      "className": "Fighter",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Battle Master",
          "entries": [
            "Those who emulate the archetypal Battle Master employ martial techniques passed down through generations. A Battle Master might be a seasoned gladiator or an aspiring knight yearning for expedient mastery of combative technique.",
            {
              "type": "entries",
              "name": "3rd Level: Combat Superiority",
              "entries": ["You learn maneuvers that are fueled by special dice called Superiority Dice. You start with four Superiority Dice (d8s), and gain more as you advance. You regain all expended Superiority Dice when you finish a Short or Long Rest."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Student of War",
              "entries": ["You gain proficiency with one type of Artisan's Tools of your choice. You also gain proficiency with History if you don't already have it."]
            },
            {
              "type": "entries",
              "name": "7th Level: Know Your Enemy",
              "entries": ["As a Bonus Action, you can discern one of the following: Strength score, Dexterity score, Constitution score, Armor Class, current Hit Points, total levels, or Fighter levels of a creature you can observe for 1 minute."]
            },
            {
              "type": "entries",
              "name": "10th Level: Improved Combat Superiority",
              "entries": ["Your Superiority Dice turn into d10s."]
            },
            {
              "type": "entries",
              "name": "15th Level: Relentless",
              "entries": ["When you roll Initiative and have no Superiority Dice remaining, you regain 1 Superiority Die."]
            },
            {
              "type": "entries",
              "name": "18th Level: Ultimate Combat Superiority",
              "entries": ["Your Superiority Dice turn into d12s."]
            }
          ]
        }
      ]
    },
    {
      "name": "Way of the Mercy",
      "shortName": "Mercy",
      "source": "UA2024",
      "className": "Monk",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Way of Mercy",
          "entries": [
            "Monks of the Way of Mercy learn to manipulate the life force of others to bring aid to those in need. They are wandering physicians to the poor and hurt. However, to those beyond their help, they bring swift mercy.",
            {
              "type": "entries",
              "name": "3rd Level: Implements of Mercy",
              "entries": ["You gain proficiency in the Insight and Medicine skills, and you gain proficiency with the Herbalism Kit. You also gain a special mask which marks you as a monk of mercy. You can craft a new one during a Long Rest."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Hand of Healing",
              "entries": ["Your touch can mend wounds. As an action, you can spend 1 Discipline Point to touch a creature and restore a number of Hit Points equal to a roll of your Martial Arts die + your Wisdom modifier."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Hand of Harm",
              "entries": ["When you hit a creature with an Unarmed Strike, you can spend 1 Discipline Point to deal extra Necrotic damage equal to one roll of your Martial Arts die + your Wisdom modifier. You can use this feature only once per turn."]
            },
            {
              "type": "entries",
              "name": "6th Level: Physician's Touch",
              "entries": ["Your Hand of Healing now also ends one disease or condition afflicting the target: Blinded, Deafened, Paralyzed, Poisoned, or Stunned. Your Hand of Harm now also subjects the target to the Poisoned condition until the end of your next turn."]
            },
            {
              "type": "entries",
              "name": "11th Level: Flurry of Healing and Harm",
              "entries": ["When you use Flurry of Blows, you can replace each Unarmed Strike with a use of Hand of Healing, without spending Discipline Points for each use. You can still use Hand of Harm on each of those strikes."]
            },
            {
              "type": "entries",
              "name": "17th Level: Hand of Ultimate Mercy",
              "entries": ["Your mastery of life energy opens the door to the ultimate mercy. As an action, you can touch the corpse of a creature that died within the past 24 hours and expend 5 Discipline Points. The creature then returns to life, regaining a number of Hit Points equal to 4d10 + your Wisdom modifier. Once you use this feature, you can't use it again until you finish a Long Rest."]
            }
          ]
        }
      ]
    },
    {
      "name": "Oath of the Open Sea",
      "shortName": "Open Sea",
      "source": "UA2024",
      "className": "Paladin",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Oath of the Open Sea",
          "entries": [
            "The Oath of the Open Sea calls to seafaring warriors, swashbucklers, and adventurers who feel most at home on the water. Paladins who swear this oath are called to free others from oppression, never to yield to fear or greed, and to seek the horizon beyond every horizon.",
            {
              "type": "entries",
              "name": "Tenets",
              "entries": ["No Greater Life. Live well and spend your days in freedom. Freedom of Movement. Never be shackled by chains, bars, or water. Freedom of Choice. Chart your own course. Don't dominate or oppress others."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Oath Spells",
              "entries": ["Create or Destroy Water, Expeditious Retreat (3rd), Gust of Wind, Misty Step (5th), Tidal Wave, Freedom of Movement (9th), Control Water, Freedom of Movement (13th), Commune with Nature, Freedom of Movement (17th)"]
            },
            {
              "type": "entries",
              "name": "3rd Level: Marine Layer",
              "entries": ["As an action, you can cast Fog Cloud without expending a spell slot. You can use this feature a number of times equal to your Charisma modifier (minimum once), and you regain all expended uses when you finish a Long Rest."]
            },
            {
              "type": "entries",
              "name": "7th Level: Aura of Liberation",
              "entries": ["You and allies within 10 feet of you (20 feet at level 18) are immune to the Grappled and Restrained conditions, and can breathe underwater."]
            },
            {
              "type": "entries",
              "name": "15th Level: Stormy Waters",
              "entries": ["When a creature enters your reach or moves while within your reach, you can use your Reaction to make one melee weapon attack against it. You can use this Reaction no more than once per turn."]
            },
            {
              "type": "entries",
              "name": "20th Level: Mythic Swashbuckler",
              "entries": ["As an action, you channel your oath to enter a powerful swashbuckling state for 1 minute. While in this state, you gain these benefits: You have advantage on Athletics checks, your walking speed increases by 10 feet, and you gain a Swim speed equal to your walking speed. You have advantage on attacks against creatures that are Grappled or Restrained, and all your attacks score a critical hit on a roll of 19–20."]
            }
          ]
        }
      ]
    },
    {
      "name": "Swarmkeeper",
      "shortName": "Swarmkeeper",
      "source": "UA2024",
      "className": "Ranger",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Swarmkeeper",
          "entries": [
            "Feeling a deep connection to the natural world, some rangers bond with a swarm of nature spirits that takes the form of a swarm of animals—insects, birds, or tiny beasts. As the ranger grows in power, the swarm grows as well, further accumulating creatures that the ranger can send swarming at enemies.",
            {
              "type": "entries",
              "name": "3rd Level: Gathered Swarm",
              "entries": ["You magically attract a swarm of nature spirits that take the form of Tiny animals of your choice. The swarm travels with you and acts on your turn. Once per turn, you can cause the swarm to assist you in one of these ways: Writhing Tide (move 5 feet away or toward), Swarm Strike (deal extra 1d6 piercing/bludgeoning/slashing to a creature you hit), or Dispersing Swarm (teleport a creature you hit up to 15 feet in a direction you choose)."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Swarmkeeper Magic",
              "entries": ["Mage Hand (cantrip), Faerie Fire (3rd), Web (5th), Gaseous Form (9th), Giant Insect (13th), Insect Plague (17th)"]
            },
            {
              "type": "entries",
              "name": "7th Level: Writhing Tide",
              "entries": ["You can cast Fly on yourself, without expending a spell slot, using your swarm to carry you. Once you use this feature, you can't do so again until you finish a Long Rest."]
            },
            {
              "type": "entries",
              "name": "11th Level: Mighty Swarm",
              "entries": ["Your Gathered Swarm now deals 1d8 damage and can also Restrain a creature hit (save ends)."]
            },
            {
              "type": "entries",
              "name": "15th Level: Swarming Dispersal",
              "entries": ["When you take damage, you can use your Reaction to scatter your swarm, teleporting yourself up to 30 feet to an unoccupied space you can see and becoming invisible until the end of your current turn. Once you use this feature, you can't do so again until you finish a Short or Long Rest."]
            }
          ]
        }
      ]
    },
    {
      "name": "Soulknife",
      "shortName": "Soulknife",
      "source": "UA2024",
      "className": "Rogue",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Soulknife",
          "entries": [
            "Most assassins strike with physical weapons, and many burglars and spies use thieves' tools when the need arises. In contrast, a Soulknife strikes and infiltrates with the mind, cutting through barriers both physical and psychic.",
            {
              "type": "entries",
              "name": "3rd Level: Psionic Power",
              "entries": ["You harbor a wellspring of psionic energy within yourself. This energy is represented by your Psionic Energy Dice, which are each a d6. You have a number of these dice equal to twice your proficiency bonus, and they fuel various psionic powers you have (detailed below). You can recover one die when you use Cunning Action. You recover all expended dice on a Long Rest."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Psychic Blades",
              "entries": ["You can manifest your psionic power as shimmering blades. Whenever you take the Attack action, you can manifest a Psychic Blade in your free hand and use it in the attack. It deals 1d6 Psychic damage on a hit plus your Dexterity modifier. On a hit, you can expend one Psionic Energy die and add it to the damage roll. The blade vanishes after the attack."]
            },
            {
              "type": "entries",
              "name": "9th Level: Soul Blades",
              "entries": ["Your Psychic Blades are now more potent. Homing Strikes: when you miss with a Psychic Blade, you can expend one Psionic Energy die to reroll the attack. Psychic Teleportation: as a Bonus Action, you project a Psychic Blade from your hand without attacking, expend one Psionic Energy die, and teleport a number of feet equal to 10 × the die result."]
            },
            {
              "type": "entries",
              "name": "13th Level: Psychic Veil",
              "entries": ["You can cast Invisibility on yourself without expending a spell slot or material components. Once you do, you can't use this feature again until you finish a Long Rest, unless you expend a Psionic Energy die to use it again."]
            },
            {
              "type": "entries",
              "name": "17th Level: Rend Mind",
              "entries": ["When you use your Psychic Blades to deal Sneak Attack damage to a creature, you can force that target to make a Wisdom saving throw (DC = 8 + your proficiency bonus + your Dexterity modifier). On a failed save, the target is Stunned until the end of your next turn. Once you use this feature, you can't do so again until you finish a Long Rest, unless you expend three Psionic Energy dice to use it again."]
            }
          ]
        }
      ]
    },
    {
      "name": "Divine Soul",
      "shortName": "Divine Soul",
      "source": "UA2024",
      "className": "Sorcerer",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Divine Soul",
          "entries": [
            "Sometimes the spark of magic that fuels a sorcerer comes directly from a divine source that glimmers within the soul. Having such a blessed soul is a sign that your innate magic might come from a distant but powerful familial connection to a divine being.",
            {
              "type": "entries",
              "name": "3rd Level: Divine Magic",
              "entries": ["You can choose spells from the Cleric spell list in addition to the Sorcerer spell list. You must still abide by the Sorcerer restrictions on spell selection. You also learn the cure wounds spell, which doesn't count against your number of spells known."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Favored by the Gods",
              "entries": ["If you fail a saving throw or miss with an attack roll, you can roll 2d4 and add it to the total, possibly changing the outcome. Once you use this feature, you can't use it again until you finish a Short or Long Rest."]
            },
            {
              "type": "entries",
              "name": "6th Level: Empowered Healing",
              "entries": ["Once per turn, when you or an ally within 5 feet of you rolls dice to determine the number of Hit Points a spell restores, you can spend 1 Sorcery Point to reroll any number of those dice once, provided you aren't Incapacitated. You can use the rerolled results or the original results."]
            },
            {
              "type": "entries",
              "name": "14th Level: Otherworldly Wings",
              "entries": ["You can use a Bonus Action to manifest a pair of spectral wings from your back. While the wings are present, you have a Fly speed of 30 feet. The wings last until you're Incapacitated, you die, or you dismiss them as a Bonus Action. You can manifest the wings a number of times equal to your Charisma modifier, and you regain all expended uses on a Long Rest."]
            },
            {
              "type": "entries",
              "name": "18th Level: Unearthly Recovery",
              "entries": ["When you are below half your Hit Point maximum, you can use a Bonus Action to regain a number of Hit Points equal to half your Hit Point maximum. Once you use this feature, you can't do so again until you finish a Long Rest."]
            }
          ]
        }
      ]
    },
    {
      "name": "The Undead",
      "shortName": "Undead",
      "source": "UA2024",
      "className": "Warlock",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "The Undead",
          "entries": [
            "You've made a pact with a deathless being, a mighty undead—a vampire, a lich, or some lesser yet still terrible creature. Your patron once mortal, used the darkest of arts to escape death's clutches, committing unspeakable acts to become undying and hoard power against the day it could cast off the material world.",
            {
              "type": "entries",
              "name": "3rd Level: Expanded Spell List",
              "entries": ["False Life, Ray of Sickness (1st), Blindness/Deafness, Silence (2nd), Feign Death, Speak with Dead (3rd), Aura of Life, Death Ward (4th), Antilife Shell, Cloudkill (5th)"]
            },
            {
              "type": "entries",
              "name": "3rd Level: Form of Dread",
              "entries": ["As a Bonus Action, you transform for 1 minute. While in this form, you gain Temporary Hit Points equal to 1d10 + your Warlock level. Once per turn, when you hit a creature with an attack roll, you can force it to make a Wisdom saving throw; on a failure, the target is Frightened of you until the end of your next turn. You are also immune to the Frightened condition. You can use this feature a number of times equal to your proficiency bonus, and regain all uses on a Long Rest."]
            },
            {
              "type": "entries",
              "name": "6th Level: Grave Touched",
              "entries": ["You no longer need to eat, drink, or breathe. Once per turn when you hit a creature with an attack roll and deal damage, you can replace the damage type with Necrotic. If the attack already dealt Necrotic damage, add 1d10 extra Necrotic damage."]
            },
            {
              "type": "entries",
              "name": "10th Level: Necrotic Husk",
              "entries": ["You have resistance to Necrotic damage. If you are transformed using Form of Dread, you instead become immune to Necrotic damage. When a creature within 30 feet of you is reduced to 0 Hit Points, you can use your Reaction to regain Hit Points equal to 1d10 + your proficiency bonus."]
            },
            {
              "type": "entries",
              "name": "14th Level: Spirit Projection",
              "entries": ["Your spirit can leave your body. As an action, you can project your spirit from your body. The body is Incapacitated and stays in place. Your spirit can move up to twice your Speed. Your spirit can pass through creatures but not objects. While projecting, you can cast spells as though you were in your spirit's space. When you move to a space within 5 feet of a creature, you can make one attack roll against it and deal Necrotic damage on a hit equal to 8d8 + your spellcasting ability modifier. Once you use this feature, you can't use it again until you finish a Long Rest."]
            }
          ]
        }
      ]
    },
    {
      "name": "Bladesinging",
      "shortName": "Bladesinging",
      "source": "UA2024",
      "className": "Wizard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Bladesinging",
          "entries": [
            "Bladesingers master a tradition of magic that blends swordsmanship with a distinct elven magical style. In combat, a bladesinger uses a series of intricate, elegant maneuvers that fend off harm and allow the bladesinger to channel magic into devastating attacks and a cunning defense.",
            {
              "type": "entries",
              "name": "3rd Level: Training in War and Song",
              "entries": ["You gain proficiency with light armor and with one type of one-handed melee weapon of your choice. You also gain proficiency in the Performance skill if you don't already have it."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Bladesong",
              "entries": ["You can invoke an elven magic called the Bladesong, provided that you aren't wearing medium or heavy armor or using a shield. It graces you with supernatural speed, agility, and focus. You can use a Bonus Action to start the Bladesong, which lasts for 1 minute. It ends early if you end it (no action required), if you don medium/heavy armor or a shield, or if you are Incapacitated. While your Bladesong is active: you gain a bonus to your AC equal to your Intelligence modifier (minimum +1), your Speed increases by 10 feet, you have advantage on Acrobatics checks, you gain a bonus to any Constitution saving throw you make to maintain concentration on a spell equal to your Intelligence modifier (minimum +1). You can use this feature a number of times equal to your proficiency bonus, and regain all uses on a Long Rest."]
            },
            {
              "type": "entries",
              "name": "6th Level: Extra Attack",
              "entries": ["You can attack twice, instead of once, whenever you take the Attack action on your turn. Moreover, you can cast one of your cantrips in place of one of those attacks."]
            },
            {
              "type": "entries",
              "name": "10th Level: Song of Defense",
              "entries": ["You can direct your magic to absorb damage. When you take damage, you can use your Reaction to expend one spell slot and reduce that damage to you by an amount equal to five times the slot's level."]
            },
            {
              "type": "entries",
              "name": "14th Level: Song of Victory",
              "entries": ["You can add your Intelligence modifier (minimum +1) to the damage of your melee weapon attacks while your Bladesong is active."]
            }
          ]
        }
      ]
    },
    {
      "name": "College of the Moon",
      "shortName": "Moon",
      "source": "UA2024",
      "className": "Bard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "College of the Moon", "entries": [
        "Bards of the College of the Moon attune themselves to lunar cycles, drawing power from moonlight to inspire allies and debilitate foes.",
        { "type": "entries", "name": "3rd Level: Moonlight Step", "entries": ["When you use Bardic Inspiration, you can teleport up to 30 feet to an unoccupied space you can see as part of the same Bonus Action."] },
        { "type": "entries", "name": "3rd Level: Lunar Lore", "entries": ["You learn the Dancing Lights and Minor Illusion cantrips. You always have the Faerie Fire and Moonbeam spells prepared."] },
        { "type": "entries", "name": "6th Level: Full Moon's Grace", "entries": ["When you grant a creature Bardic Inspiration, it also gains Temporary Hit Points equal to your Charisma modifier + your Bard level."] },
        { "type": "entries", "name": "14th Level: Eclipse Form", "entries": ["As an action, you enter a lunar eclipse state for 1 minute. While active: you shed dim light in 30 feet, creatures that start their turn within 10 feet must make a Wisdom save or be Frightened of you until the end of their turn, and your Bardic Inspiration dice are maximized. Once used, requires a Long Rest."] }
      ]}]
    },
    {
      "name": "Knowledge Domain",
      "shortName": "Knowledge",
      "source": "UA2024",
      "className": "Cleric",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Knowledge Domain", "entries": [
        "The gods of knowledge value learning and understanding above all.",
        { "type": "entries", "name": "3rd Level: Blessings of Knowledge", "entries": ["You learn two languages and gain proficiency in two of: Arcana, History, Nature, Religion. Your proficiency bonus is doubled for these skills."] },
        { "type": "entries", "name": "3rd Level: Unfettered Mind", "entries": ["You can communicate telepathically with any creature you can see within 60 feet. You don't need to share a language. You can also cast Detect Thoughts without expending a spell slot a number of times equal to your Wisdom modifier per Long Rest."] },
        { "type": "entries", "name": "6th Level: Channel Divinity: Read Thoughts", "entries": ["You can use Channel Divinity to read the surface thoughts of a creature you can see within 60 feet. The creature makes a Wisdom save; on failure, you know its surface thoughts for 1 minute and can cast Suggestion on it without a spell slot."] },
        { "type": "entries", "name": "17th Level: Visions of the Past", "entries": ["You can spend 1 minute meditating on an object or location to gain visions of its history. The DM presents information about significant events within the past 24 hours (object) or week (location)."] }
      ]}]
    },
    {
      "name": "Arcana Domain",
      "shortName": "Arcana",
      "source": "UA2024",
      "className": "Cleric",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Arcana Domain", "entries": [
        "Magic is an energy that suffuses the multiverse and that fuels both destruction and creation.",
        { "type": "entries", "name": "3rd Level: Arcane Initiate", "entries": ["When you choose this domain, you gain proficiency in Arcana and learn two Wizard cantrips."] },
        { "type": "entries", "name": "3rd Level: Channel Divinity: Arcane Abjuration", "entries": ["You present your holy symbol, and one celestial, elemental, fey, or fiend within 30 feet that can see or hear you must succeed on a Wisdom save or be turned for 1 minute. If the creature's CR is at or below a threshold based on your level, it is banished for 1 minute instead."] },
        { "type": "entries", "name": "6th Level: Spell Breaker", "entries": ["When you restore HP to an ally with a spell of 1st level or higher, you can also end one spell of your choice on that creature. The level of the spell you end must be equal to or lower than the level of the healing spell."] },
        { "type": "entries", "name": "17th Level: Arcane Mastery", "entries": ["You can prepare one spell from the Wizard list of each of these levels: 6th, 7th, 8th, and 9th. These count as Cleric spells for you."] }
      ]}]
    },
    {
      "name": "Grave Domain",
      "shortName": "Grave",
      "source": "UA2024",
      "className": "Cleric",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Grave Domain", "entries": [
        "Gods of the grave watch over the line between life and death.",
        { "type": "entries", "name": "3rd Level: Circle of Mortality", "entries": ["When you cast a healing spell that would restore HP to a creature at 0 HP, you can maximize the healing dice instead of rolling. You also learn the Spare the Dying cantrip, which counts as a Cleric cantrip for you and has a range of 30 feet."] },
        { "type": "entries", "name": "3rd Level: Eyes of the Grave", "entries": ["As an action, you can open your awareness to magically detect undead within 60 feet. Until the end of your next turn, you know the location of any undead not behind total cover. You can use this a number of times equal to your Wisdom modifier per Long Rest."] },
        { "type": "entries", "name": "3rd Level: Channel Divinity: Path to the Grave", "entries": ["As a Bonus Action, you present your Holy Symbol and expend a use of your Channel Divinity to curse one creature you can see within 30 feet of yourself until the start of your next turn. While cursed, the creature has Disadvantage on attack rolls and saving throws.", "When you or an ally you can see hits the cursed target with an attack roll, you can end the curse early (no action required) to make the attack deal extra Necrotic or Radiant damage (your choice) equal to 1d8 plus your Cleric level."] },
        { "type": "entries", "name": "6th Level: Sentinel at Death's Door", "entries": ["As a Reaction when a creature you can see within 30 feet would suffer a Critical Hit, you can turn that hit into a normal hit. You can use this a number of times equal to your Wisdom modifier per Long Rest."] },
        { "type": "entries", "name": "17th Level: Keeper of Souls", "entries": ["When a creature dies within 60 feet of you, you can capture its ebbing life force. You gain HP or grant HP to one creature within 60 feet equal to the dead creature's number of Hit Dice. This can be used once per turn."] }
      ]}]
    },
    {
      "name": "Pestilence Domain",
      "shortName": "Pestilence",
      "source": "UA2024",
      "className": "Cleric",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Pestilence Domain", "entries": [
        "Clerics of the Pestilence Domain harness supernatural plague and decay to erode their enemies' vitality. Though common folk often regard pestilence as a force of rampant destruction, Clerics of this domain wield it with surgical precision. The Pestilence Domain is associated with gods of poison, disease, famine, and rot.",
        { "type": "entries", "name": "Level 3: Blight Weaver", "entries": ["You gain the following benefits.\n\nInoculated Soul. You have Resistance to Necrotic and Poison damage, and you can't be infected by magical contagions.\n\nRot and Fester. Damage from your Cleric spells and Cleric features ignores Resistance to Necrotic and Poison damage. Additionally, when you cast a Cleric spell or use a Cleric feature that deals either Necrotic or Poison damage, you can change that damage to the other type."] },
        { "type": "entries", "name": "Level 3: Pestilence Domain Spells", "entries": ["Your connection to this divine domain ensures you always have certain spells ready.\n\nCleric Level 3: Detect Poison and Disease, Protection from Poison, Ray of Enfeeblement, Ray of Sickness.\nCleric Level 5: Stinking Cloud, Vampiric Touch.\nCleric Level 7: Blight, Giant Insect.\nCleric Level 9: Contagion, Insect Plague."] },
        { "type": "entries", "name": "Level 3: Plague Blessing", "entries": ["As a Magic action, you can present your Holy Symbol and expend a use of Channel Divinity to manifest a 5-foot Emanation of withering plague that surrounds you or one willing creature you touch for 1 minute. It ends early if you dismiss it (no action required), manifest it again, or have the Incapacitated condition.\n\nEach creature of your choice that starts its turn in the Emanation must succeed on a Constitution saving throw against your spell save DC or gain 1 Exhaustion level. This feature can't increase a creature's Exhaustion level higher than a level equal to your Wisdom modifier (minimum of 1 Exhaustion level).\n\nThe plague spread by this feature manifests with a specific symptom. Choose from the Plague Symptoms table or determine it randomly.\n\nPlague Symptoms (1d6):\n1 — Is drained of all color, appearing in monochromatic grays.\n2 — Sheds metallic, rust-hued flakes and creaks while moving.\n3 — Secretes foul-smelling mucus.\n4 — Is surrounded by a cloud of buzzing insects.\n5 — Sprouts fungi or other foliage from its flesh.\n6 — Is covered in glowing pustules."] },
        { "type": "entries", "name": "Level 6: Virulent Burst", "entries": ["When an enemy within 60 feet of you is reduced to 0 Hit Points, you can take a Reaction to cause plague to burst from that creature, spreading pestilence in a 10-foot Emanation originating from the enemy; if the enemy had at least 1 Exhaustion level, the size of the Emanation increases to 20 feet.\n\nEach creature of your choice in the Emanation makes a Constitution saving throw against your spell save DC. On a failed save, a target suffers one of the following effects:\n\nPutrid Shock. The target has the Incapacitated condition until the end of its next turn. While Incapacitated, the target's Speed is 0.\n\nToxic Infection. The target takes 3d6 Necrotic or Poison damage (your choice).\n\nYou can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest."] },
        { "type": "entries", "name": "Level 17: Vermin Form", "entries": ["As a Bonus Action, you can shape-shift into a Medium swarm of Tiny pests, such as cockroaches, maggots, or rats. While you're in this form, you retain your general shape, personality, memories, and the ability to speak; any equipment you're wearing or carrying doesn't transform with you, but you can continue using that equipment while in this form. Your game statistics remain the same, apart from the following changes:\n\nCondition Immunities. You have Immunity to the Grappled, Paralyzed, Prone, and Restrained conditions.\nDamage Resistances. You have Resistance to Bludgeoning, Piercing, and Slashing damage.\nMovement. You can enter and occupy another creature's space and vice versa. Additionally, you have a Climb Speed equal to your Speed, and you can climb difficult surfaces — including along ceilings — without needing to make an ability check.\nPlague Bites. Whenever you enter an enemy's space, that creature takes damage equal to your Wisdom modifier; the damage is Necrotic, Piercing, or Poison (your choice). A creature also takes this damage when it enters your space or ends its turn there. A creature takes this damage only once per turn.\n\nYou revert to your true form after 10 minutes, if you choose to end the transformation (no action required), if you have the Incapacitated condition, or if you die.\n\nOnce you use this feature, you can't use it again until you finish a Long Rest unless you expend a level 5+ spell slot (no action required) to restore your use of it."] }
      ]}]
    },
    {
      "name": "Arcane Archer",
      "shortName": "Arcane Archer",
      "source": "UA2024",
      "className": "Fighter",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Arcane Archer", "entries": [
        "An Arcane Archer studies a unique elven method of weaving magic into attacks made with a bow.",
        { "type": "entries", "name": "3rd Level: Arcane Archer Lore", "entries": ["You gain proficiency in Arcana or Nature (your choice), and you learn the Prestidigitation or Druidcraft cantrip (your choice)."] },
        { "type": "entries", "name": "3rd Level: Arcane Shot", "entries": ["You learn to unleash special magical effects with some of your shots. You have two Arcane Shot options and gain more as you level. You can use an Arcane Shot once per turn when you fire an arrow from a shortbow or longbow. You have two uses of this feature, regaining all uses on a Short or Long Rest. Options include: Banishing Arrow, Beguiling Arrow, Bursting Arrow, Enfeebling Arrow, Grasping Arrow, Piercing Arrow, Seeking Arrow, Shadow Arrow."] },
        { "type": "entries", "name": "7th Level: Magic Arrow", "entries": ["You gain the ability to infuse arrows with magic. Whenever you fire a nonmagical arrow, you can make it magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage."] },
        { "type": "entries", "name": "7th Level: Curving Shot", "entries": ["When you make an attack roll with a magic arrow and miss, you can use a Bonus Action to reroll the attack roll against a different target within 60 feet of the original target."] },
        { "type": "entries", "name": "15th Level: Ever-Ready Shot", "entries": ["Your magical archery is ready at almost all times. If you roll initiative and have no Arcane Shot uses remaining, you regain one use."] }
      ]}]
    },
    {
      "name": "Cavalier",
      "shortName": "Cavalier",
      "source": "UA2024",
      "className": "Fighter",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Cavalier", "entries": [
        "The archetypal Cavalier excels at mounted combat.",
        { "type": "entries", "name": "3rd Level: Bonus Proficiency", "entries": ["You gain proficiency in one of the following skills: Animal Handling, History, Insight, Performance, or Persuasion."] },
        { "type": "entries", "name": "3rd Level: Born to the Saddle", "entries": ["You have advantage on saving throws made to avoid falling off your mount. If you fall off your mount and descend no more than 10 feet, you can land on your feet if you're not incapacitated. Mounting or dismounting a creature costs you only 5 feet of movement."] },
        { "type": "entries", "name": "3rd Level: Unwavering Mark", "entries": ["When you hit a creature with a melee weapon attack, you can mark the creature until the end of your next turn. While a creature is marked, it has disadvantage on attacks against targets other than you. On your turn, if a marked creature deals damage to anyone other than you, you can use a Bonus Action to make one melee weapon attack against it with advantage. You have unlimited uses of this feature."] },
        { "type": "entries", "name": "7th Level: Warding Maneuver", "entries": ["If you or a creature within 5 feet is hit by an attack, you can use your Reaction to roll 1d8 and add it to the target's AC for that attack. You can use this a number of times equal to your Constitution modifier (minimum 1) per Long Rest."] },
        { "type": "entries", "name": "10th Level: Hold the Line", "entries": ["You become a master of locking down your enemies. Creatures provoke an opportunity attack from you when they move 5 feet or more while within your reach. When you hit a creature with an opportunity attack, its speed is reduced to 0 for the rest of the turn."] },
        { "type": "entries", "name": "15th Level: Ferocious Charger", "entries": ["You can run down your foes, whether you're mounted or not. If you move at least 10 feet in a straight line toward a creature before hitting it with a melee weapon attack, you can attempt to knock it Prone (Strength save vs. your maneuver DC). You can use this feature with a flexible number of hits."] },
        { "type": "entries", "name": "18th Level: Vigilant Defender", "entries": ["You respond to danger with extraordinary vigilance. You can take a number of opportunity attacks per round equal to your Reaction count, without using your Reaction for the second and further attacks."] }
      ]}]
    },
    {
      "name": "Gladiator",
      "shortName": "Gladiator",
      "source": "UA2024",
      "className": "Fighter",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Gladiator", "entries": [
        "Gladiators are arena warriors who use crowd energy and dazzling combat techniques inspired by the Dark Sun setting.",
        { "type": "entries", "name": "3rd Level: Crowd Pleaser", "entries": ["When you reduce a creature to 0 HP or score a Critical Hit while a creature that is not your ally is observing, you gain Inspiration if you don't already have it. Additionally, you gain proficiency in Performance."] },
        { "type": "entries", "name": "3rd Level: Dirty Tricks", "entries": ["When you make a weapon attack, you can use a Bonus Action to attempt one of: Blind (Constitution save or Blinded until end of next turn), Trip (Strength save or Prone), or Disarm (Strength or Dexterity save or drop one item). DC equals your maneuver DC."] },
        { "type": "entries", "name": "7th Level: Parrying Defense", "entries": ["When wielding a melee weapon in one hand and nothing in your other hand, you gain +2 AC."] },
        { "type": "entries", "name": "10th Level: Improved Dirty Tricks", "entries": ["Your Dirty Tricks save DC increases by 2, and you can now use Dirty Tricks as part of the Attack action instead of as a Bonus Action."] },
        { "type": "entries", "name": "15th Level: Spectacular Attack", "entries": ["Once per turn when you hit with a weapon attack, you can spend your Inspiration to deal an extra 4d6 damage and the target must succeed on a Strength save or be knocked Prone. Observing creatures must make a Wisdom save or be Frightened of you until the end of their next turn."] }
      ]}]
    },
    {
      "name": "Purple Dragon Knight",
      "shortName": "Purple Dragon Knight",
      "source": "UA2024",
      "className": "Fighter",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Purple Dragon Knight", "entries": [
        "Purple Dragon Knights are warriors who serve the kingdom of Cormyr, bonded to amethyst dragons.",
        { "type": "entries", "name": "3rd Level: Rallying Cry", "entries": ["When you use your Second Wind, you can choose up to three allies within 60 feet. Each chosen ally regains hit points equal to your fighter level."] },
        { "type": "entries", "name": "3rd Level: Dragon Bond", "entries": ["You psionically bond with an amethyst dragon hatchling companion. The dragon uses the stat block provided, acts on your initiative, and grows in power as you gain levels."] },
        { "type": "entries", "name": "7th Level: Royal Envoy", "entries": ["You gain proficiency in Persuasion, or double proficiency if already proficient. You also gain proficiency in one additional language and one additional skill from the Fighter list."] },
        { "type": "entries", "name": "10th Level: Inspiring Surge", "entries": ["When you use Action Surge, you can choose one ally within 60 feet. That ally can make one weapon attack as a Reaction."] },
        { "type": "entries", "name": "15th Level: Bulwark", "entries": ["When you use Indomitable to reroll a saving throw, you can extend that benefit to an ally within 60 feet that failed the same save."] }
      ]}]
    },
    {
      "name": "Tattooed Warrior",
      "shortName": "Tattooed Warrior",
      "source": "UA2024",
      "className": "Monk",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Tattooed Warrior", "entries": [
        "Tattooed Warriors inscribe living magic into their bodies in the form of tattoos, granting supernatural abilities inspired by powerful creatures.",
        { "type": "entries", "name": "3rd Level: Living Tattoos", "entries": ["You have three magical tattoos inscribed on your body. Choose three from the Beast Tattoo list. Each tattoo grants a passive benefit and an active power. You can change your tattoos by spending 8 hours in meditation during a Long Rest."] },
        { "type": "entries", "name": "3rd Level: Beast Tattoo Options", "entries": ["Beholder Tattoo: advantage on Perception checks (passive); as a Bonus Action, one creature within 30 feet must save or be Frightened until end of your next turn. Displacer Beast Tattoo: +2 AC (passive); as a Reaction when hit, impose disadvantage on the triggering attack roll. Owlbear Tattoo: advantage on Survival checks (passive); Unarmed Strikes deal 1d8 damage. Spider Tattoo: Spider Climb speed equal to your Speed (passive); you can cast Web once per Short Rest. Dragon Tattoo: Choose a damage type; resistance to it (passive); as a Bonus Action, deal 2d6 of that damage type to all creatures within 5 feet."] },
        { "type": "entries", "name": "6th Level: Empowered Tattoos", "entries": ["Your tattoo active powers improve. You gain one additional tattoo and can use each active power a number of times equal to your proficiency bonus per Long Rest."] },
        { "type": "entries", "name": "11th Level: Tattoo Mastery", "entries": ["You gain two additional tattoos. Your passive benefits become more powerful (DM's discretion per tattoo type)."] },
        { "type": "entries", "name": "17th Level: Living Legend", "entries": ["As an action, all your tattoos activate simultaneously for 1 minute. During this time, their active effects are always on and their passive benefits are doubled. Once used, requires a Long Rest."] }
      ]}]
    },
    {
      "name": "Warrior of Intoxication",
      "shortName": "Intoxication",
      "source": "UA2024",
      "className": "Monk",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Warrior of Intoxication", "entries": [
        "Formerly the Way of the Drunken Master, these monks use magical brew-based mechanics to achieve unpredictable and powerful combat styles.",
        { "type": "entries", "name": "3rd Level: Bonus Proficiencies", "entries": ["You gain proficiency in the Performance skill if you don't already have it. Your martial arts technique mixes combat training with the unpredictability of a drunkard's movement."] },
        { "type": "entries", "name": "3rd Level: Tipsy Sway", "entries": ["You gain the following benefits: Leap to Your Feet — when you're knocked Prone, you can stand up using only 5 feet of movement. Redirect Attack — when a creature misses you with a melee attack roll, you can spend 1 Discipline Point to cause that attack to hit one creature of your choice, other than the attacker, that you can see within 5 feet of you."] },
        { "type": "entries", "name": "3rd Level: Brewer's Blessing", "entries": ["You can create a magical brew as a Bonus Action. Creatures that drink it (including yourself) gain Temporary Hit Points equal to your Wisdom modifier and advantage on the next saving throw they make before the end of their next turn."] },
        { "type": "entries", "name": "6th Level: Drunkard's Luck", "entries": ["You always seem to get a lucky bounce at the right moment. When you make an ability check, attack roll, or saving throw and have disadvantage on the roll, you can spend 2 Discipline Points to cancel the disadvantage for that roll."] },
        { "type": "entries", "name": "11th Level: Intoxicated Frenzy", "entries": ["When you use Flurry of Blows, you can make up to three additional Unarmed Strikes with it (up to a total of five strikes), provided that each strike targets a different creature."] },
        { "type": "entries", "name": "17th Level: Master of the Brew", "entries": ["Your Brewer's Blessing brew now grants immunity to the Frightened and Poisoned conditions, and advantage on all saving throws, for 1 hour. Creatures can benefit from this brew once per Long Rest."] }
      ]}]
    },
    {
      "name": "Oath of the Noble Genies",
      "shortName": "Noble Genies",
      "source": "UA2024",
      "className": "Paladin",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Oath of the Noble Genies", "entries": [
        "Paladins of this oath serve as champions of the noble genie lords, wielding elemental power and ancient pacts.",
        { "type": "entries", "name": "Tenets", "entries": ["Wisdom of the Ages: Seek knowledge and counsel from those older and wiser. Elemental Harmony: Respect all forms of the elements. Bound by Pact: Honor your word and your agreements absolutely."] },
        { "type": "entries", "name": "3rd Level: Oath Spells", "entries": ["Thunderwave, Detect Evil and Good (3rd), Gust of Wind, Misty Step (5th), Fly, Tongues (9th), Elemental Bane, Fire Shield (13th), Conjure Elemental, Planar Binding (17th)"] },
        { "type": "entries", "name": "3rd Level: Genie's Wrath", "entries": ["Once on each of your turns when you hit with an attack roll, you can deal extra damage of a type based on your chosen genie kind: Dao (bludgeoning), Djinni (thunder), Efreeti (fire), Marid (cold). The damage equals your Charisma modifier (minimum 1)."] },
        { "type": "entries", "name": "7th Level: Aura of the Genie", "entries": ["You and allies within 10 feet gain resistance to one damage type associated with your genie kind (your choice when you gain this feature). At 18th level, the aura extends to 30 feet."] },
        { "type": "entries", "name": "15th Level: Genie's Vessel", "entries": ["You can cast Plane Shift (self only, to the Elemental Planes) without a spell slot once per Long Rest."] },
        { "type": "entries", "name": "20th Level: Wish of the Genie Lord", "entries": ["As an action, you can cast Wish once per Long Rest. The wish must align with your genie kind's elemental theme."] }
      ]}]
    },
    {
      "name": "Oathbreaker",
      "shortName": "Oathbreaker",
      "source": "UA2024",
      "className": "Paladin",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Oathbreaker", "entries": [
        "An Oathbreaker is a paladin who has broken their sacred oaths to pursue dark ambitions.",
        { "type": "entries", "name": "3rd Level: Oathbreaker Spells", "entries": ["Hellish Rebuke, Inflict Wounds (3rd), Crown of Madness, Darkness (5th), Animate Dead, Bestow Curse (9th), Blight, Confusion (13th), Contagion, Dominate Person (17th)"] },
        { "type": "entries", "name": "3rd Level: Channel Divinity: Control Undead", "entries": ["As an action, you target one undead creature within 30 feet. It must make a Wisdom saving throw. On a failed save, the creature must obey your commands for the next 24 hours, or until you use this Channel Divinity again."] },
        { "type": "entries", "name": "3rd Level: Channel Divinity: Dreadful Aspect", "entries": ["As an action, you channel the darkest emotions. Each creature of your choice within 30 feet must make a Wisdom saving throw or be Frightened of you for 1 minute. If a creature Frightened this way ends its turn more than 30 feet from you, it can repeat the save."] },
        { "type": "entries", "name": "7th Level: Aura of Hate", "entries": ["You and Fiends and Undead within 10 feet of you gain a bonus to melee weapon damage rolls equal to your Charisma modifier (min +1). At 18th level, the aura extends to 30 feet."] },
        { "type": "entries", "name": "15th Level: Supernatural Resistance", "entries": ["You gain resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons."] },
        { "type": "entries", "name": "20th Level: Dread Lord", "entries": ["As an action, you create an aura of gloom in a 30-foot radius for 1 minute. The aura reduces any bright light in it to dim light. Frightened enemies in the aura take 4d10 psychic damage at the start of their turns. Additionally, you and creatures you choose gain the benefits of the Invisible condition while in the aura. This requires a Long Rest to use again."] }
      ]}]
    },
    {
      "name": "Winter Walker",
      "shortName": "Winter Walker",
      "source": "UA2024",
      "className": "Ranger",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Winter Walker", "entries": [
        "Winter Walkers channel the power of frost and ice, transforming into an avatar of winter.",
        { "type": "entries", "name": "3rd Level: Winter Walker Magic", "entries": ["Armor of Agathys, Ice Knife (3rd), Hold Person, Snowball Swarm (5th), Sleet Storm, Slow (9th), Ice Storm, Otiluke's Resilient Sphere (13th), Cone of Cold, Hold Monster (17th)"] },
        { "type": "entries", "name": "3rd Level: Arctic Hide", "entries": ["You gain resistance to cold damage. When you are in snow or ice terrain, your speed is not reduced by difficult terrain."] },
        { "type": "entries", "name": "7th Level: Frozen Step", "entries": ["Once per turn when you hit with a weapon attack, you can slow the target's speed by 10 feet until the end of its next turn. You can also cast Misty Step once per Short Rest without expending a spell slot, but only into areas of snow or ice."] },
        { "type": "entries", "name": "11th Level: Ice Form", "entries": ["As a Bonus Action, you partially transform into an icy form for 1 minute: you gain resistance to piercing and slashing damage, immune to cold, and each creature that hits you with a melee attack takes 1d6 cold damage. Once used, requires a Short or Long Rest."] },
        { "type": "entries", "name": "15th Level: Blizzard Call", "entries": ["You can cast Blizzard of Fur (Ice Storm variant) centered on yourself without expending a spell slot once per Long Rest, dealing extra cold damage equal to your Wisdom modifier."] }
      ]}]
    },
    {
      "name": "Hollow Warden",
      "shortName": "Hollow Warden",
      "source": "UA2024",
      "className": "Ranger",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Hollow Warden", "entries": [
        "Hollow Wardens channel an ancient wild horror, transforming their body with mutated traits.",
        { "type": "entries", "name": "3rd Level: Aberrant Mutation", "entries": ["You gain a mutated trait. Choose one: Tendrils (reach 10 ft on melee attacks), Darkvision 60 ft (or +60 ft if you already have it), Chitinous Hide (+2 AC when not wearing armor), or Bioluminescence (emit dim light 10 ft, advantage on Intimidation)."] },
        { "type": "entries", "name": "3rd Level: Horror's Grasp", "entries": ["When you hit a creature with a weapon attack, you can spend a Ranger spell slot to deal extra psychic damage equal to 1d6 per spell level and the target must succeed on a Wisdom save or be Frightened of you until the end of its next turn."] },
        { "type": "entries", "name": "7th Level: Additional Mutation", "entries": ["You gain a second mutated trait from the list."] },
        { "type": "entries", "name": "11th Level: Horror Form", "entries": ["As a Bonus Action, you embrace the full horror within for 1 minute. All your mutations are enhanced: Tendrils reach 15 ft and grapple on hit; Darkvision becomes Truesight 30 ft; Chitinous Hide grants +4 AC; Bioluminescence causes Frightened on a failed Wisdom save within 30 ft. Once used, requires a Long Rest."] },
        { "type": "entries", "name": "15th Level: Apex Mutation", "entries": ["You gain a third mutated trait and your mutations are always in their enhanced state while in Horror Form."] }
      ]}]
    },
    {
      "name": "Phantom",
      "shortName": "Phantom",
      "source": "UA2024",
      "className": "Rogue",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Phantom", "entries": [
        "Many rogues walk a fine line between life and death, and some walk so close that they start to see that line blur.",
        { "type": "entries", "name": "3rd Level: Whispers of the Dead", "entries": ["Echoes of those who have died cling to you. Whenever you finish a Short or Long Rest, you can choose one skill or tool proficiency. Until you choose a different one with this feature, you gain proficiency with the chosen skill or tool."] },
        { "type": "entries", "name": "3rd Level: Wails from the Grave", "entries": ["When you deal Sneak Attack damage to a creature, you can put some of the spectral power into one of your soul trinkets (see below). That expends the trinket. When a trinket is expended, you can choose a creature other than the target within 30 feet; it takes half the Sneak Attack damage (necrotic). You start with one soul trinket and can have a max equal to your proficiency bonus."] },
        { "type": "entries", "name": "9th Level: Tokens of the Departed", "entries": ["When a creature you can see dies within 30 feet, you can use your Reaction to create a soul trinket. Also, you can cast Speak with Dead without a spell slot by expending a soul trinket."] },
        { "type": "entries", "name": "13th Level: Ghost Walk", "entries": ["You can assume a spectral form as a Bonus Action. While spectral: you have a Fly speed of 10, you can move through creatures and objects (taking 1d10 force damage if you end inside), you are resistant to all damage, and you have advantage on Stealth checks. Lasts 10 minutes. Uses equal to proficiency bonus per Long Rest."] },
        { "type": "entries", "name": "17th Level: Death's Friend", "entries": ["You gain one additional use of Wails from the Grave per turn. Also, when you have no soul trinkets, you gain one soul trinket each dawn."] }
      ]}]
    },
    {
      "name": "Scion of the Three",
      "shortName": "Scion of Three",
      "source": "UA2024",
      "className": "Rogue",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Scion of the Three", "entries": [
        "These rogues draw power from the Dead Three—Bane, Bhaal, and Myrkul—gods of tyranny, murder, and death.",
        { "type": "entries", "name": "3rd Level: Dark Blessing", "entries": ["Choose one of the Dead Three as your patron: Bane (Tyrant), Bhaal (Slayer), or Myrkul (Undead Lord). You gain specific features based on your choice."] },
        { "type": "entries", "name": "3rd Level: Bane's Grasp (Tyrant)", "entries": ["When you deal Sneak Attack, the target has disadvantage on its next saving throw before the end of your next turn."] },
        { "type": "entries", "name": "3rd Level: Bhaal's Mark (Slayer)", "entries": ["When you deal Sneak Attack, you mark the target until the end of your next turn. If the target dies while marked, you regain HP equal to your proficiency bonus + your Dexterity modifier."] },
        { "type": "entries", "name": "3rd Level: Myrkul's Touch (Undead Lord)", "entries": ["When you deal Sneak Attack, the target must succeed on a Constitution save or be Poisoned until the end of its next turn."] },
        { "type": "entries", "name": "9th Level: Blessing Intensified", "entries": ["Your patron's blessing grows. Bane: the saving throw disadvantage lasts until the end of the target's next turn. Bhaal: HP regained increases to twice your proficiency bonus + Dex modifier. Myrkul: the Poisoned condition also inflicts 2d6 necrotic damage per turn."] },
        { "type": "entries", "name": "13th Level: Avatar's Touch", "entries": ["Once per Short Rest, when you deal Sneak Attack, you can choose to trigger the effects of all three Dead Three blessings simultaneously."] },
        { "type": "entries", "name": "17th Level: Chosen of the Three", "entries": ["You gain resistance to necrotic damage and immunity to the Frightened condition. Your Sneak Attack dice count is increased by 2d6 when you trigger Avatar's Touch."] }
      ]}]
    },
    {
      "name": "Shadow Magic",
      "shortName": "Shadow Magic",
      "source": "UA2024",
      "className": "Sorcerer",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Shadow Magic", "entries": [
        "You are a creature of shadow, for your innate magic comes from the Shadowfell itself.",
        { "type": "entries", "name": "3rd Level: Eyes of the Dark", "entries": ["From 1st level, you have Darkvision with a range of 120 feet. When you reach 3rd level in this class, you learn the Darkness spell, which doesn't count against your number of sorcerer spells known. In addition, you can cast it by spending 2 Sorcery Points, without using a spell slot."] },
        { "type": "entries", "name": "3rd Level: Strength of the Grave", "entries": ["When damage reduces you to 0 HP, you can make a Charisma saving throw (DC 5 + the damage taken). On a success, you instead drop to 1 HP. Radiant damage and critical hits automatically fail. Once you succeed, you can't use this feature again until you finish a Long Rest."] },
        { "type": "entries", "name": "6th Level: Hound of Ill Omen", "entries": ["As a Bonus Action, you can spend 3 Sorcery Points to summon a hound of ill omen to target one creature. The hound has the statistics of a Dire Wolf with these changes: it is Medium, it can't be charmed or frightened, and it has immunity to cold and necrotic damage. The hound appears in an unoccupied space within 30 feet of the target. The target has disadvantage on saving throws against your spells while the hound is within 5 feet of it."] },
        { "type": "entries", "name": "14th Level: Shadow Walk", "entries": ["When you are in an area of dim light or darkness, you can use a Bonus Action to teleport up to 120 feet to an unoccupied space you can see that is also in dim light or darkness."] },
        { "type": "entries", "name": "18th Level: Umbral Form", "entries": ["As a Bonus Action, you can spend 6 Sorcery Points to transform yourself into a shadowy form for 1 minute. In this form, you have resistance to all damage except force and radiant damage, and you can move through other creatures and objects as if they were difficult terrain (taking 1d10 force damage if you end your turn inside one)."] }
      ]}]
    },
    {
      "name": "Ancestral Sorcery",
      "shortName": "Ancestral Sorcery",
      "source": "UA2024",
      "className": "Sorcerer",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Ancestral Sorcery", "entries": [
        "Your magic is fueled by a powerful magical ancestor whose spirit guides and empowers you.",
        { "type": "entries", "name": "3rd Level: Ancestral Spirit", "entries": ["A spectral haze of your ancestor manifests around you. When you cast a Sorcerer spell, you can have the ancestor strike a creature within 60 feet that you can see, dealing psychic damage equal to your Charisma modifier (minimum 1)."] },
        { "type": "entries", "name": "3rd Level: Inherited Magic", "entries": ["Choose one spell from your ancestor's tradition. This spell is always prepared for you and doesn't count against your spells known."] },
        { "type": "entries", "name": "6th Level: Spirit Guidance", "entries": ["When you make an ability check, your ancestor can guide you. Spend 1 Sorcery Point to add your Charisma modifier to the roll (minimum +1)."] },
        { "type": "entries", "name": "14th Level: Ancestor's Wrath", "entries": ["When a creature within 30 feet hits you, your ancestor can lash back as a Reaction. The attacker takes psychic damage equal to 2d8 + your Charisma modifier and must succeed on a Wisdom save or be Frightened of you until the end of its next turn."] },
        { "type": "entries", "name": "18th Level: Ancestral Avatar", "entries": ["As an action, you fully manifest your ancestor for 1 minute. During this time: your spell save DC increases by 2, the ancestral spirit damage increases to 2d8, and you are immune to the Frightened condition. Once used, requires a Long Rest."] }
      ]}]
    },
    {
      "name": "Defiled Sorcerer",
      "shortName": "Defiled",
      "source": "UA2024",
      "className": "Sorcerer",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Defiled Sorcerer", "entries": [
        "Inspired by Dark Sun's Defilers, these sorcerers drain life from the land to empower their magic.",
        { "type": "entries", "name": "3rd Level: Defiling Surge", "entries": ["When you cast a spell, you can choose to defile the ground in a 10-foot radius around you. Plants and nonmagical vegetation wither and die. Each creature of your choice in the area must succeed on a Constitution save or take necrotic damage equal to your Charisma modifier. You gain Sorcery Points equal to the number of creatures that failed their save."] },
        { "type": "entries", "name": "6th Level: Corrupted Form", "entries": ["You gain resistance to necrotic damage. When you spend Sorcery Points, you can optionally cause your Defiling Surge to affect a 20-foot radius."] },
        { "type": "entries", "name": "14th Level: Lifebleed", "entries": ["Your spells deal extra necrotic damage equal to your proficiency bonus when you spend Sorcery Points to augment them."] },
        { "type": "entries", "name": "18th Level: Total Defilement", "entries": ["Once per Long Rest, you can cast any spell you know at its highest level without expending a spell slot. Doing so defertilizes all land within 100 feet for 1 year."] }
      ]}]
    },
    {
      "name": "Spellfire Sorcerer",
      "shortName": "Spellfire",
      "source": "UA2024",
      "className": "Sorcerer",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Spellfire Sorcerer", "entries": [
        "Spellfire Sorcerers channel spellfire—a rare radiant energy that absorbs and redirects magic.",
        { "type": "entries", "name": "3rd Level: Spellfire Burst", "entries": [
          { "type": "entries", "name": "Bolstering Flames", "entries": ["When you are targeted by a spell, you can use your Reaction to absorb the spell. The spell has no effect on you, and you gain Sorcery Points equal to the spell's level."] },
          { "type": "entries", "name": "Radiant Fire", "entries": ["You can spend 1 Sorcery Point as a Bonus Action to release a burst of spellfire. Each creature within 10 feet takes radiant damage equal to 1d6 per Sorcery Point spent."] }
        ]},
        { "type": "entries", "name": "6th Level: Spellfire Healing", "entries": ["As a Bonus Action, you can spend Sorcery Points to heal yourself or a creature you touch. Restore 1d8 HP per Sorcery Point spent."] },
        { "type": "entries", "name": "14th Level: Blazing Spellfire", "entries": ["Your Radiant Burst now affects a 30-foot radius and you can choose which creatures are affected."] },
        { "type": "entries", "name": "18th Level: Spellfire Mastery", "entries": ["You can absorb any spell of 6th level or lower with Spellfire Absorption. You regain full HP once per Long Rest when you reduce a creature to 0 HP with radiant damage."] }
      ]}]
    },
    {
      "name": "College of Spirits",
      "shortName": "Spirits",
      "source": "UA2024",
      "className": "Bard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "College of Spirits", "entries": [
        "Using occult trappings, Bards of the College of Spirits conjure legendary and long-dead spirits to change the world once more. But such entities are capricious, and what a Bard summons isn't always entirely under their control.",
        { "type": "entries", "name": "3rd Level: Channeler", "entries": ["You learn how to contact spirits beyond the grave, letting their power and knowledge flow through you. You gain the following benefits:\n\nGuiding Whispers. You know the Guidance cantrip. When you cast it, its range is 60 feet.\n\nSpiritual Focus. You employ tools that aid you in channeling spirits. You gain a Gaming Set (Playing Cards) and have proficiency with it. Additionally, you can use the cards or one of the following items as a Spellcasting Focus for your Bard spells: Arcane Focus (Crystal or Orb), Candle or Ink Pen."] },
        { "type": "entries", "name": "3rd Level: Spirits From Beyond", "entries": [
          "While holding a Spellcasting Focus, you can take a Bonus Action to expend one use of your Bardic Inspiration and call forth the powers of a spirit.",
          "Roll your Bardic Inspiration die and consult the Spirits from Beyond table to determine the spirit you channel. Then choose one creature you can see within 30 feet of yourself as the spirit's target.",
          "The spirit's effect occurs immediately. If the spirit's effect requires a saving throw, the DC equals your Bard spell save DC.",
          { "type": "table", "caption": "Spirits From Beyond", "colLabels": ["Bardic Insp. Die", "Spirit"], "rows": [
            ["1", "{@b Beloved.} The target regains Hit Points equal to one roll of your Bardic Inspiration die plus your Charisma modifier."],
            ["2", "{@b Sharpshooter.} The target takes Force damage equal to one roll of your Bardic Inspiration die plus your Charisma modifier."],
            ["3", "{@b Avenger.} Until the end of your next turn, any creature that hits the target with a melee attack roll takes Force damage equal to a roll of your Bardic Inspiration die."],
            ["4", "{@b Renegade.} The target can immediately take a Reaction to teleport up to 30 feet to an unoccupied space it can see."],
            ["5", "{@b Fortune Teller.} The target has Advantage on D20 Tests until the start of your next turn."],
            ["6", "{@b Wayfarer.} The target gains Temporary Hit Points equal to a roll of your Bardic Inspiration die plus your Bard level. While it has these Temporary Hit Points, the target's Speed increases by 10 feet."],
            ["7", "{@b Trickster.} The target makes a Wisdom saving throw. On a failed save, the target takes Psychic damage equal to two rolls of your Bardic Inspiration die and has the Charmed condition until the start of your next turn. On a successful save, the target takes half as much damage only."],
            ["8", "{@b Shade.} The target gains the Invisible condition until the end of its next turn or until the target makes an attack roll, deals damage, or casts a spell. When the invisibility ends, each creature in a 5-foot Emanation originating from the target must succeed on a Constitution saving throw or take Necrotic damage equal to two rolls of your Bardic Inspiration die."],
            ["9", "{@b Arsonist.} The target makes a Dexterity saving throw, taking Fire damage equal to four rolls of your Bardic Inspiration die on a failed save or half as much on a successful one."],
            ["10", "{@b Coward.} The target and each creature of your choice in a 30-foot Emanation originating from the target must succeed on a Wisdom saving throw or have the Frightened condition until the start of your next turn. While Frightened, a creature's Speed is halved, and it can take either an action or a Bonus Action, not both."],
            ["11", "{@b Brute.} Each creature of your choice in a 30-foot Emanation originating from the target makes a Strength saving throw. On a failed save, a creature takes Thunder damage equal to three rolls of your Bardic Inspiration die and has the Prone condition. On a successful save, a creature takes half as much damage only."],
            ["12", "{@b Controlled Channeling.} You determine the spirit's effect by choosing one of the other rows in this table."]
          ]}
        ] },
        { "type": "entries", "name": "6th Level: Empowered Channeling", "entries": ["Your ability to channel spirits improves. You gain the following benefits:\n\nPower from Beyond. Once per turn, when you cast a Bard spell that either deals damage or restores Hit Points, roll a d6. You gain a bonus to one of the spell's damage rolls or the total healing equal to the number rolled.\n\nSpiritual Manifestation. You always have the Spirit Guardians spell prepared. You can cast it once without expending a spell slot, and you regain the ability to do so when you finish a Long Rest. Whenever you cast Spirit Guardians, you can modify it so the spirits also guard against worldly threats. When cast in this way, you and your allies within the spell's Emanation gain Half Cover. Once you modify the spell this way, you can't do so again until you finish a Short or Long Rest."] },
        { "type": "entries", "name": "14th Level: Mystical Connection", "entries": ["You gain mastery over the spirits you call forth. Whenever you roll on the Spirits from Beyond table, you can roll the Bardic Inspiration die twice and choose which of the two effects to bestow."] }
      ]}]
    },
    {
      "name": "Hexblade",
      "shortName": "Hexblade",
      "source": "UA2024",
      "className": "Warlock",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Hexblade", "entries": [
        "You have made your pact with a mysterious entity from the Shadowfell — a force that manifests in sentient magic weapons.",
        { "type": "entries", "name": "3rd Level: Hexblade's Curse", "entries": ["As a Bonus Action, choose one creature you can see within 30 feet. It is cursed for 1 minute. You gain a bonus to damage rolls against it equal to your proficiency bonus, attack rolls against it score a critical hit on a roll of 19-20, and if the target dies while cursed you regain HP equal to your Warlock level + your Charisma modifier. Uses equal to your proficiency bonus per Long Rest."] },
        { "type": "entries", "name": "3rd Level: Hex Warrior", "entries": ["You gain proficiency with medium armor, shields, and martial weapons. When you finish a Long Rest, choose one weapon you are holding; attacks with it use your Charisma modifier instead of Strength or Dexterity for attack and damage rolls."] },
        { "type": "entries", "name": "6th Level: Accursed Specter", "entries": ["When you slay a humanoid, you can cause its specter to rise and serve you for 24 hours or until you use this feature again."] },
        { "type": "entries", "name": "10th Level: Armor of Hexes", "entries": ["When the target of your Hexblade's Curse hits you with an attack roll, roll a d6. On a 4 or higher, the attack instead misses you."] },
        { "type": "entries", "name": "14th Level: Master of Hexes", "entries": ["When the creature cursed by your Hexblade's Curse dies, you can immediately apply the curse to a new creature within 30 feet without expending a use."] }
      ]}]
    },
    {
      "name": "Sorcerer-King Patron",
      "shortName": "Sorcerer-King",
      "source": "UA2024",
      "className": "Warlock",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Sorcerer-King Patron", "entries": [
        "You serve one of the undying Sorcerer-Kings of Athas, dying gods who bestow defiling power on their champions.",
        { "type": "entries", "name": "3rd Level: King's Mandate", "entries": ["You can cast Command without expending a spell slot a number of times equal to your Charisma modifier per Long Rest."] },
        { "type": "entries", "name": "3rd Level: Defiling Touch", "entries": ["When you hit with a spell attack or force a failed save, you can choose to defile the target. It takes extra necrotic damage equal to your proficiency bonus and its speed is halved until the end of its next turn."] },
        { "type": "entries", "name": "6th Level: Undying Servitor", "entries": ["As an action, you can raise a dead humanoid within 10 feet as an undead servant (use Zombie stat block) that serves you until destroyed. You can have one servitor at a time."] },
        { "type": "entries", "name": "10th Level: King's Wrath", "entries": ["Once per Short Rest, when you deal damage with a Warlock spell, you can maximize all damage dice."] },
        { "type": "entries", "name": "14th Level: Avatar of the King", "entries": ["You can cast Power Word Kill once per Long Rest without expending a spell slot."] }
      ]}]
    },
    {
      "name": "Conjurer",
      "shortName": "Conjurer",
      "source": "UA2024",
      "className": "Wizard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Conjurer", "entries": [
        "As a Conjurer, you favor spells that produce objects and creatures out of thin air.",
        { "type": "entries", "name": "3rd Level: Benign Transposition", "entries": ["As a Bonus Action, you can teleport up to 30 feet to an unoccupied space you can see. Alternatively, choose a friendly creature within 30 feet; you and that creature swap places. Once you use this feature, you can't use it again until you finish a Long Rest, unless you expend a spell slot to use it again."] },
        { "type": "entries", "name": "6th Level: Focused Conjuration", "entries": ["While concentrating on a conjuration spell, your concentration cannot be broken as a result of taking damage."] },
        { "type": "entries", "name": "10th Level: Durable Summons", "entries": ["Any creature you summon or create with a conjuration spell has 30 Temporary Hit Points."] },
        { "type": "entries", "name": "14th Level: Fortified Casting", "entries": ["Starting at 14th level, you can concentrate on two conjuration spells at the same time. If you cast a third concentration spell, choose which of the three you end concentration on."] }
      ]}]
    },
    {
      "name": "Enchanter",
      "shortName": "Enchanter",
      "source": "UA2024",
      "className": "Wizard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Enchanter", "entries": [
        "As a member of the School of Enchantment, you have honed your ability to magically entrance and beguile other people and monsters.",
        { "type": "entries", "name": "3rd Level: Hypnotic Gaze", "entries": ["As an action, choose one creature within 5 feet. It must succeed on a Wisdom saving throw or be charmed by you until the end of your next turn. While charmed, it is also Incapacitated and has a speed of 0. Each subsequent turn, you can use your action to maintain this effect, extending it until the end of your next turn. The effect ends if you move more than 5 feet away from the creature, if the creature takes damage, or if it succeeds on a saving throw at the end of one of your turns."] },
        { "type": "entries", "name": "6th Level: Instinctive Charm", "entries": ["When a creature you can see within 30 feet makes an attack roll against you, you can use your Reaction to divert the attack to another creature within the attacker's reach. The attacker must make a Wisdom saving throw; on a failure, the attack hits another creature of your choice. Uses equal to your Intelligence modifier per Long Rest."] },
        { "type": "entries", "name": "10th Level: Split Enchantment", "entries": ["When you cast an enchantment spell that targets only one creature, you can have it target two creatures."] },
        { "type": "entries", "name": "14th Level: Alter Memories", "entries": ["You can make creatures forget the time you enchanted them. When an enchantment spell you cast ends, you can use your action to try to suppress the target's memory of being charmed by you. The creature must make an Intelligence saving throw; on failure, it remembers nothing about being charmed."] }
      ]}]
    },
    {
      "name": "Necromancer",
      "shortName": "Necromancer",
      "source": "UA2024",
      "className": "Wizard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Necromancer", "entries": [
        "The School of Necromancy explores the cosmic forces of life, death, and undeath.",
        { "type": "entries", "name": "3rd Level: Grim Harvest", "entries": ["When you kill a creature with a spell, you regain HP equal to twice the spell's level (or three times if it's a necromancy spell). This doesn't apply to undead or constructs."] },
        { "type": "entries", "name": "6th Level: Undead Thralls", "entries": ["When you cast Animate Dead, you can target one additional corpse or pile of bones. The undead you create via Animate Dead gain two benefits: their max HP increases by your Wizard level, and they add your proficiency bonus to weapon damage rolls."] },
        { "type": "entries", "name": "10th Level: Inured to Undeath", "entries": ["You have resistance to necrotic damage and your HP maximum cannot be reduced by undead."] },
        { "type": "entries", "name": "14th Level: Command Undead", "entries": ["As an action, choose one undead within 60 feet. It must succeed on a Charisma saving throw or fall under your control for 24 hours. Undead with Intelligence 8 or higher have advantage. If it fails, it obeys your commands. Once per Long Rest."] }
      ]}]
    },
    {
      "name": "Transmuter",
      "shortName": "Transmuter",
      "source": "UA2024",
      "className": "Wizard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Transmuter", "entries": [
        "You focus your study on magic that modifies energy and matter.",
        { "type": "entries", "name": "3rd Level: Minor Alchemy", "entries": ["You can temporarily alter the physical properties of one nonmagical object, changing it from one substance to another of similar consistency (metal to wood, wood to bone, etc.). Once per Long Rest and lasts 1 hour."] },
        { "type": "entries", "name": "6th Level: Transmuter's Stone", "entries": ["You can spend 8 hours creating a transmuter's stone that stores transmutation magic. A creature holding the stone gains one of: Darkvision 60 ft, +10 ft speed, proficiency in Constitution saves, or resistance to acid/cold/fire/lightning/thunder (choose). You can have one stone at a time; recreating it destroys the old one."] },
        { "type": "entries", "name": "10th Level: Shapechanger", "entries": ["You add Polymorph to your spellbook and can cast it without expending a spell slot. You can also cast it targeting yourself only without material components. Once per Short Rest."] },
        { "type": "entries", "name": "14th Level: Master Transmuter", "entries": ["As an action, you consume your Transmuter's Stone to produce one of these effects: Major Transformation, Panacea (remove curses/diseases/poisons + restore max HP), Restore Life (as Raise Dead without material component), Restore Youth (make a willing creature younger by up to 3d10 years, max once per creature per year)."] }
      ]}]
    },
    {
      "name": "Circle of Preservation",
      "shortName": "Preservation",
      "source": "UA2024",
      "className": "Druid",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Circle of Preservation", "entries": [
        "Inspired by Dark Sun's Preservers, these druids protect nature from exploitation, wielding powerful magic without corruption.",
        { "type": "entries", "name": "3rd Level: Preserver's Magic", "entries": ["When you cast a druid spell, you can choose to channel preserver magic. Instead of draining the environment, the ground within 10 feet of you briefly blooms: creatures of your choice regain HP equal to your Wisdom modifier."] },
        { "type": "entries", "name": "3rd Level: Living Shield", "entries": ["As a Reaction when a creature within 30 feet of you takes damage, you can interpose nature's power. Reduce the damage by 1d10 + your Wisdom modifier. Uses equal to proficiency bonus per Long Rest."] },
        { "type": "entries", "name": "6th Level: Nature's Renewal", "entries": ["Once per Short Rest, when you use Wild Shape, you can also cast a Druid cantrip as a Bonus Action on the same turn."] },
        { "type": "entries", "name": "10th Level: Verdant Recovery", "entries": ["At the start of each of your turns in Wild Shape, you regain HP equal to your Wisdom modifier if you have fewer than half your HP remaining."] },
        { "type": "entries", "name": "14th Level: Apex Preserver", "entries": ["Once per Long Rest, when you cast a spell that would reduce a creature to 0 HP, you can instead reduce it to 1 HP and have it become friendly to you for 1 hour."] }
      ]}]
    },
    {
      "name": "Path of the Spiritual Guardian",
      "shortName": "Spiritual Guardian",
      "source": "UA2024",
      "className": "Barbarian",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Path of the Spiritual Guardian", "entries": [
        "These barbarians channel nature and animal spirits through their rage, gaining powers that reflect their bond with these entities.",
        { "type": "entries", "name": "3rd Level: Spirit Seeker", "entries": ["You can cast Beast Sense and Speak with Animals as rituals."] },
        { "type": "entries", "name": "3rd Level: Spiritual Totem", "entries": ["Choose a spirit type (Bear, Eagle, Elk, Tiger, or Wolf). While raging, you gain the spirit's benefit: Bear (resistance to all damage except psychic), Eagle (Dash as Bonus Action), Elk (others' difficult terrain doesn't cost extra movement), Tiger (add 10 ft to long jumps and high jumps), Wolf (while adjacent, allies have advantage on melee attacks vs. enemies adjacent to you)."] },
        { "type": "entries", "name": "3rd Level: Vengeful Spirits", "entries": ["When you score a Critical Hit while raging, spectral spirits lash out at all enemies within 5 feet of you, dealing 1d6 force damage each."] },
        { "type": "entries", "name": "6th Level: Aspect of the Spirit", "entries": ["Your spirit totem grants a passive benefit outside of rage. Bear: +2 to Strength checks and saves. Eagle: you can see up to 1 mile clearly and aren't surprised. Elk: +15 ft walking speed. Tiger: proficiency in two skills from Stealth, Athletics, Acrobatics, Survival, Perception. Wolf: advantage on tracking checks and Stealth while stationary."] },
        { "type": "entries", "name": "14th Level: Walk the Spirit Paths", "entries": ["You can merge with your totem spirit. Once per Long Rest as a Magic action, you cast Commune with Nature without a spell slot. Additionally, you can cast each of the spells associated with your spirit totem once per Long Rest without a spell slot."] }
      ]}]
    },
    {
      "name": "Path of the Storm Herald",
      "shortName": "Storm Herald",
      "source": "UA2024",
      "className": "Barbarian",
      "classSource": "XPHB",
      "page": 1,
      "entries": [{ "type": "entries", "name": "Path of the Storm Herald", "entries": [
        "Barbarians of this path channel elemental storm energy through their rage.",
        { "type": "entries", "name": "3rd Level: Storm Aura", "entries": ["While raging, you emanate a storm aura in a 10-foot radius. Choose a storm environment (Desert, Sea, Tundra): Desert: each creature of your choice takes fire damage equal to your Rage Damage bonus. Sea: one creature of your choice takes lightning damage equal to your Rage Damage bonus. Tundra: each creature of your choice gains Temporary HP equal to your Rage Damage bonus."] },
        { "type": "entries", "name": "6th Level: Storm Soul", "entries": ["You gain a permanent elemental benefit based on your storm environment. Desert: resistance to fire damage and you don't suffer exhaustion from heat. Sea: resistance to lightning damage and can breathe underwater, gain Swim speed equal to walk speed. Tundra: resistance to cold damage and water/ice around you can't cause difficult terrain."] },
        { "type": "entries", "name": "10th Level: Shielding Storm", "entries": ["You learn to use your storm aura to protect others. Each creature of your choice in your aura gains the resistance benefit from Storm Soul."] },
        { "type": "entries", "name": "14th Level: Raging Storm", "entries": ["The power of your storm aura grows mightier when you rage. Desert: when a creature hits you with a melee attack, that creature takes fire damage equal to your Rage Damage bonus (Dex save halves). Sea: when you hit a creature with a melee attack, you can push it up to 10 feet away (Strength save negates). Tundra: when a creature in your aura takes damage, you can use your Reaction to reduce its speed to 0 until the end of its next turn."] }
      ]}]
    },
    {
      "name": "Order of Scribes",
      "shortName": "Scribes",
      "source": "UA2024",
      "className": "Wizard",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Order of Scribes",
          "entries": [
            "Magic of the spellbook flows through the Order of Scribes. Studying magic for wizards of this subclass is a voyage of understanding—the runes, signs, and markings that go into spells themselves.",
            {
              "type": "entries",
              "name": "3rd Level: Wizardly Quill",
              "entries": ["As a Bonus Action, you can magically create a Tiny quill in your free hand. The quill doesn't require ink. When you write with it, it produces ink in a color of your choice on the writing surface. The quill exists indefinitely. You can have only one quill at a time."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Awakened Spellbook",
              "entries": ["Using specially prepared inks and ancient incantations passed down by your wizardly order, you have awakened an arcane sentience within your spellbook. While you are holding the book, it grants you these benefits: You can use the book as a spellcasting focus for your wizard spells. When you cast a wizard spell with a spell slot, you can temporarily replace its damage type with the damage type of another spell in your spellbook that has the same casting time (no action required). Once per Long Rest when you cast a wizard spell that has a duration of 1 minute or longer, you can increase the spell's duration by a number of hours equal to your Intelligence modifier."]
            },
            {
              "type": "entries",
              "name": "6th Level: Manifest Mind",
              "entries": ["You can conjure your book's mind to assist spellcasting. As a Bonus Action, you can cause the mind to manifest as a Tiny spectral object, hovering in an unoccupied space of your choice within 60 feet of you. The mind exists for 10 minutes. While manifested, you can cast any spell from your spellbook as though you were in the mind's space. Once you use this feature, you can't do so again until you finish a Long Rest, unless you expend a spell slot of any level to use it again."]
            },
            {
              "type": "entries",
              "name": "10th Level: Master Scrivener",
              "entries": ["Once per Long Rest when you finish a Long Rest, you can magically create one scroll by touching your Wizardly Quill to a blank piece of paper or parchment and causing one spell from your Awakened Spellbook to be copied onto the scroll. The chosen spell must be of 1st or 2nd level and have a casting time of 1 action. The scroll can be used only by you, and it vanishes when you use it or when you finish your next Long Rest."]
            },
            {
              "type": "entries",
              "name": "14th Level: One with the Word",
              "entries": ["Your connection to your Awakened Spellbook has become so profound that your soul has become entwined with it. While the book is on your person, you have advantage on your death saving throws, because the book fights to keep you alive. Moreover, if the book is destroyed, you can reverse that destruction by spending 1 hour rewriting the book using your Wizardly Quill. At the end of the hour, the book reappears in your hands with all its previous contents intact."]
            }
          ]
        }
      ]
    },
    {
      "name": "Alchemist",
      "shortName": "Alchemist",
      "source": "UA2024",
      "className": "Artificer",
      "classSource": "TCE",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Alchemist",
          "entries": [
            "An Alchemist is an expert at combining reagents to produce mystical effects.",
            {
              "type": "entries",
              "name": "3rd Level: Alchemist Spells",
              "entries": ["Healing Word, Ray of Sickness (3rd), Flaming Sphere, Melf's Acid Arrow (5th), Gaseous Form, Mass Healing Word (9th), Blight, Death Ward (13th), Cloudkill, Raise Dead (17th)"]
            },
            {
              "type": "entries",
              "name": "3rd Level: Experimental Elixir",
              "entries": ["Whenever you finish a Long Rest, you can magically produce a number of experimental elixirs equal to your Intelligence modifier (minimum 1). Roll on the Experimental Elixir table for each one. As a Bonus Action, a creature can drink the elixir or administer it to an incapacitated creature within 5 feet. A creature can benefit from only one elixir at a time. You can create additional elixirs by expending a spell slot of 1st level or higher for each one."]
            },
            {
              "type": "entries",
              "name": "5th Level: Alchemical Savant",
              "entries": ["When you cast a spell using your alchemist's supplies as the spellcasting focus, you gain a bonus to one roll of the spell: healing spells gain a bonus equal to your Intelligence modifier; spells that deal acid, fire, necrotic, or poison damage gain a bonus to one damage roll equal to your Intelligence modifier."]
            },
            {
              "type": "entries",
              "name": "9th Level: Restorative Reagents",
              "entries": ["You can incorporate restorative reagents into your experimental elixirs. Whenever a creature drinks one of your experimental elixirs, it also gains 2d6 + your Intelligence modifier Temporary Hit Points. You can cast Lesser Restoration without expending a spell slot a number of times equal to your Intelligence modifier, regaining all uses on a Long Rest."]
            },
            {
              "type": "entries",
              "name": "15th Level: Chemical Mastery",
              "entries": ["You have resistance to acid damage and poison damage, and you are immune to the Poisoned condition. You can cast Greater Restoration and Heal without expending a spell slot, once each per Long Rest, using your alchemist's supplies as the focus."]
            }
          ]
        }
      ]
    },
    {
      "name": "Armorer",
      "shortName": "Armorer",
      "source": "UA2024",
      "className": "Artificer",
      "classSource": "TCE",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Armorer",
          "entries": [
            "An Artificer who specializes as an Armorer modifies armor to function almost like a second skin.",
            {
              "type": "entries",
              "name": "3rd Level: Tools of the Trade",
              "entries": ["You gain proficiency with heavy armor and Smith's Tools. If you already have Smith's Tools proficiency, you gain proficiency with one other type of Artisan's Tools."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Arcane Armor",
              "entries": ["Your metallurgical pursuits have led to you making armor a conduit for your magic. As an action, you can turn a suit of armor you are wearing into Arcane Armor, provided you have Smith's Tools in hand. The armor continues to be Arcane Armor until you don another suit or you die. Arcane Armor: the armor can't be removed against your will, you can use it as a spellcasting focus, it replaces missing limbs, and you can don/doff it as an action."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Armor Model",
              "entries": ["Choose one of the following armor models: Guardian or Infiltrator. You can change the model on a Long Rest. Guardian: Thunder Gauntlets (1d8 thunder, target has disadvantage on attacks against others), Defensive Field (bonus action: gain temp HP equal to your level). Infiltrator: Lightning Launcher (1d6 lightning at 90 ft range, bonus 1d6 once per turn), Powered Steps (+5 ft speed), Dampening Field (advantage on Stealth)."]
            },
            {
              "type": "entries",
              "name": "5th Level: Extra Attack",
              "entries": ["You can attack twice whenever you take the Attack action."]
            },
            {
              "type": "entries",
              "name": "9th Level: Armor Modifications",
              "entries": ["You can infuse your Arcane Armor with more infusions than usual. The armor counts as multiple items for the purpose of infusions: chest, boots, helmet, and gauntlets. Each infused item counts against your infusion limit."]
            },
            {
              "type": "entries",
              "name": "15th Level: Perfected Armor",
              "entries": ["Guardian: When a Huge or smaller creature you can see ends its turn within 30 feet of you, you can use your Reaction to magically force it toward you (Strength save or be pulled 30 feet and knocked Prone). Infiltrator: When you hit a creature with your Lightning Launcher, you can deal an extra 1d6 lightning damage to a different target within 30 feet that you can see."]
            }
          ]
        }
      ]
    },
    {
      "name": "Battle Smith",
      "shortName": "Battle Smith",
      "source": "UA2024",
      "className": "Artificer",
      "classSource": "TCE",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Battle Smith",
          "entries": [
            "Armies need protection, and a Battle Smith's loyal metal companion helps provide it.",
            {
              "type": "entries",
              "name": "3rd Level: Battle Ready",
              "entries": ["Your combat training and your experiments with magic have paid off in two ways. You gain proficiency with martial weapons. When you attack with a magic weapon, you can use Intelligence instead of Strength or Dexterity for attack and damage rolls."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Steel Defender",
              "entries": ["Your tinkering has borne you a faithful companion, a steel defender. It acts on your initiative, has AC 15, HP equal to 5 × your Artificer level, and uses your spell save DC. It can take the Dodge action, and when you use the Attack action, it can use its Reaction to make one attack. If it's destroyed, you can rebuild it during a Long Rest."]
            },
            {
              "type": "entries",
              "name": "5th Level: Extra Attack",
              "entries": ["You can attack twice whenever you take the Attack action. One attack can be replaced by the Steel Defender's Deflect attack."]
            },
            {
              "type": "entries",
              "name": "9th Level: Arcane Jolt",
              "entries": ["When either you or your Steel Defender hits a target with a magic weapon attack, you can channel magical energy: deal an extra 2d6 force damage to the target, or restore 2d6 HP to a creature within 30 feet. You can use this a number of times equal to your Intelligence modifier (minimum once) per Long Rest."]
            },
            {
              "type": "entries",
              "name": "15th Level: Improved Defender",
              "entries": ["Your Steel Defender and your Arcane Jolt become more powerful. The Arcane Jolt effect increases to 4d6. The Steel Defender gains a +2 to AC and its Deflect attack deals 1d4 + your Intelligence modifier force damage."]
            }
          ]
        }
      ]
    },
    {
      "name": "Artificer Cartographer",
      "shortName": "Cartographer",
      "source": "UA2024",
      "className": "Artificer",
      "classSource": "TCE",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Artificer Cartographer",
          "entries": [
            "Cartographers craft living maps that channel magic through the bonds between party members, enabling battlefield teleportation and tactical coordination.",
            {
              "type": "entries",
              "name": "3rd Level: Cartographer Spells",
              "entries": ["Longstrider, Speak with Animals (3rd), Misty Step, Pass Without Trace (5th), Clairvoyance, Wind Wall (9th), Arcane Eye, Freedom of Movement (13th), Commune with Nature, Teleportation Circle (17th)"]
            },
            {
              "type": "entries",
              "name": "3rd Level: Living Map",
              "entries": ["You craft a magical map that bonds up to six willing creatures who touch it during a Short or Long Rest. Bonded creatures can sense each other's general direction and distance. You can teleport to an unoccupied space within 5 feet of a bonded creature (or vice versa) as a Bonus Action, expending a spell slot of 1st level or higher."]
            },
            {
              "type": "entries",
              "name": "5th Level: Cartographic Survey",
              "entries": ["As an action, you mentally survey an area of up to 1 mile, learning the location of creatures, objects, or places you name. You can use this feature a number of times equal to your Intelligence modifier per Long Rest."]
            },
            {
              "type": "entries",
              "name": "9th Level: Linked Transport",
              "entries": ["When you use Living Map to teleport, you can bring up to 5 willing bonded creatures with you if they are within 5 feet."]
            },
            {
              "type": "entries",
              "name": "15th Level: Master Cartographer",
              "entries": ["Your Living Map now covers up to a 10-mile radius. All bonded creatures can use the teleportation feature once per Short Rest without expending a spell slot."]
            }
          ]
        }
      ]
    },
    {
      "name": "Reanimator",
      "shortName": "Reanimator",
      "source": "UA2024",
      "className": "Artificer",
      "classSource": "TCE",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Reanimator",
          "entries": [
            "Reanimators channel necrotic energy to create and command undead constructs, merging artifice with dark magic.",
            {
              "type": "entries",
              "name": "3rd Level: Reanimator Spells",
              "entries": ["Inflict Wounds, Ray of Sickness (3rd), Blindness/Deafness, Gentle Repose (5th), Animate Dead, Speak with Dead (9th), Blight, Shadow of Moil (13th), Antilife Shell, Raise Dead (17th)"]
            },
            {
              "type": "entries",
              "name": "3rd Level: Animated Companion",
              "entries": ["You can cast Animate Dead without expending a spell slot. The undead you create this way is your Animated Companion. It obeys your commands, uses your spell save DC for its saving throws, and gains additional HP equal to your Artificer level. You can only have one Animated Companion at a time. If it's destroyed, you can create a new one during a Long Rest."]
            },
            {
              "type": "entries",
              "name": "5th Level: Necrotic Infusion",
              "entries": ["When your Animated Companion hits with an attack, it can deal an extra 1d8 necrotic damage. You can apply an infusion to your Animated Companion as if it were an item."]
            },
            {
              "type": "entries",
              "name": "9th Level: Enhanced Undead",
              "entries": ["Your Animated Companion gains resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks. Its necrotic damage bonus increases to 2d8."]
            },
            {
              "type": "entries",
              "name": "15th Level: Undead Army",
              "entries": ["You can have up to three Animated Companions at once. Once per Long Rest, when your Animated Companion is destroyed, you can use your Reaction to immediately reanimate it with half its maximum HP."]
            }
          ]
        }
      ]
    },
    {
      "name": "Artillerist",
      "shortName": "Artillerist",
      "source": "UA2024",
      "className": "Artificer",
      "classSource": "TCE",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Artillerist",
          "entries": [
            "An Artillerist specializes in using magical infusions to hurl explosive destruction and defend allies with magical shields. They are often found at the forefront of battle, covering allies with cannon fire while protecting them from enemy attacks.",
            {
              "type": "entries",
              "name": "3rd Level: Tool Proficiency",
              "entries": ["You gain proficiency with Woodcarver's Tools. If you already have this proficiency, you gain proficiency with one other type of Artisan's Tools of your choice."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Artillerist Spells",
              "entries": ["Shield, Thunderwave (3rd), Scorching Ray, Shatter (5th), Fireball, Wind Wall (9th), Ice Storm, Wall of Fire (13th), Cone of Cold, Wall of Force (17th)"]
            },
            {
              "type": "entries",
              "name": "3rd Level: Eldritch Cannon",
              "entries": ["You've learned how to create a magical cannon. Using Woodcarver's Tools or Smith's Tools, you can take an action to magically create a Small or Tiny Eldritch Cannon in an unoccupied space on a horizontal surface within 5 feet of you. A cannon can be Flamethrower, Force Ballista, or Protector. It acts on your initiative, has AC 18, HP equal to 5 × your Artificer level, and immunity to Poison damage and Psychic damage."]
            },
            {
              "type": "entries",
              "name": "9th Level: Explosive Cannon",
              "entries": ["Every Eldritch Cannon you create is more destructive: the cannon's damage rolls all increase by 1d8. You can also cause the cannon to detonate when you end your turn if it is within 60 feet of you; each creature within 20 feet of it must succeed on a Dexterity saving throw against your spell save DC or take 3d8 Force damage."]
            },
            {
              "type": "entries",
              "name": "15th Level: Fortified Position",
              "entries": ["You're a master at forming well-defended emplacements using Eldritch Cannon. You and your allies have Half Cover while within 10 feet of a cannon you create with Eldritch Cannon, as a result of a shimmering field of magical protection that the cannon emits. You can also now have two cannons at the same time."]
            }
          ]
        }
      ]
    },
    {
      "name": "Magic Stealer",
      "shortName": "Magic Stealer",
      "source": "UA2024",
      "className": "Rogue",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Magic Stealer",
          "entries": [
            "While ordinary thieves are cutting purses and burgling homes, a Magic Stealer is after a much more valuable prize: magic. The Magic Stealer preys on spellcasters, repurposing their magic and eluding divination spells to take magical power at the point of a knife.",
            {
              "type": "entries",
              "name": "3rd Level: Empower Sneak Attack",
              "entries": ["Immediately after a creature you can see within 30 feet of you casts a level 1+ spell, you can take a Reaction to absorb magical energy from the spell. When you do so, until the end of your next turn, the next time you hit with your Sneak Attack you deal extra Force damage. To determine the extra damage, roll a number of d6s equal to the spell's level, and add them together.", "You can take this Reaction a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses when you finish a Long Rest."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Drain Magic",
              "entries": ["You can drain power from ongoing spells to recharge your allies' magic. As a Magic Action, you can touch a willing creature and end one ongoing level 1 or level 2 spell on it; the creature immediately recovers one expended spell slot of level 2 or lower (the target's choice).", "Once you use this feature, you can't do so again until you finish a Short or Long Rest."]
            },
            {
              "type": "entries",
              "name": "9th Level: Magical Sabotage",
              "entries": ["You gain the following Cunning Strike options.", "Spell Susceptibility (Cost: 2d6). The target has Disadvantage on the next saving throw it makes against a spell until the start of your next turn.", "Disrupt Spell (Cost: 3d6). The target's magical acuity is disrupted until the start of your next turn. Whenever the target casts a spell during that time, it must succeed on an Intelligence saving throw or the spell dissipates with no effect, and the action, Bonus Action, or Reaction used to cast it is wasted. If that spell was cast with a spell slot, the slot isn't expended.", "Steal Resistance (Cost: 2d6). Choose one kind of damage. If the target has Resistance to that kind of damage, until the start of your next turn, the target loses that Resistance and you gain Resistance to that damage type."]
            },
            {
              "type": "entries",
              "name": "13th Level: Occult Shroud",
              "entries": ["Whenever you finish a Long Rest, you can cast the Nondetection spell, using Intelligence as your spellcasting ability. When you do so, you can target only yourself, and the duration increases to 24 hours."]
            },
            {
              "type": "entries",
              "name": "13th Level: Improved Drain Magic",
              "entries": ["You can now use Drain Magic as a Bonus Action. In addition, when you use Drain Magic, you can end one ongoing level 1, level 2, or level 3 spell on the target, and the target recovers one expended spell slot of level 3 or lower (the target's choice)."]
            },
            {
              "type": "entries",
              "name": "17th Level: Eldritch Implosion",
              "entries": ["When you use Empower Sneak Attack, you can force the target to make a Constitution saving throw (DC 8 plus your Dexterity modifier and Proficiency Bonus). On a failed save, the spell dissipates with no effect, and the target has the Stunned condition until the start of its next turn."]
            }
          ]
        }
      ]
    },
    {
      "name": "Warrior of the Mystic Arts",
      "shortName": "Mystic Arts",
      "source": "UA2024",
      "className": "Monk",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Warrior of the Mystic Arts",
          "entries": [
            "The Warrior of the Mystic Arts (UA 2026 Mystic Subclasses) blends Sorcerer magic with traditional Monk martial combat, using full spell slots and prepared spells from the Sorcerer spell list.",
            {
              "type": "entries",
              "name": "3rd Level: Spellcasting",
              "entries": ["You gain the ability to cast spells using the Sorcerer spell list. Intelligence is your spellcasting ability. You prepare spells from the Sorcerer spell list equal to your Wisdom modifier. You gain spell slots as shown in the Monk Spellcasting table."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Martial Sorcery",
              "entries": ["When you use your Flurry of Blows, you can replace one of the Unarmed Strikes with casting a cantrip you know that has a casting time of an Action."]
            },
            {
              "type": "entries",
              "name": "6th Level: Disciplined Caster",
              "entries": ["Maintaining spells doesn't hamper your martial form. You can maintain concentration on a spell while also using Flurry of Blows or Stunning Strike."]
            },
            {
              "type": "entries",
              "name": "11th Level: Empowered Strikes",
              "entries": ["When you hit with an Unarmed Strike while concentrating on a spell, you can expend 1 Discipline Point to deal extra Force damage equal to your Wisdom modifier."]
            },
            {
              "type": "entries",
              "name": "17th Level: Mystic Perfection",
              "entries": ["Once per Long Rest when you cast a spell, you can treat any dice rolled for that spell as their maximum value."]
            }
          ]
        }
      ]
    },
    {
      "name": "Oath of the Spellguard",
      "shortName": "Spellguard",
      "source": "UA2024",
      "className": "Paladin",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Oath of the Spellguard",
          "entries": [
            "The Oath of the Spellguard (UA 2026 Mystic Subclasses) is a defensive, anti-mage Paladin. Guardian Bond lets you buff an ally's AC, while Spellguard Strike lets you punish spellcasting enemies mid-cast.",
            {
              "type": "entries",
              "name": "3rd Level: Oath Spells",
              "entries": ["Counterspell, Detect Magic, Dispel Magic, Magic Circle, Globe of Invulnerability"]
            },
            {
              "type": "entries",
              "name": "3rd Level: Guardian Bond",
              "entries": ["As a Bonus Action, you can magically bond with a willing ally you can see within 60 feet. While bonded, that ally gains +2 to AC. The bond lasts until you form a new bond or you are incapacitated. You can only bond with one creature at a time."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Spellguard Strike",
              "entries": ["When a creature you can see within 30 feet casts a spell, you can use your Reaction to make one melee weapon attack against that creature. If the attack hits, the creature must succeed on a Constitution saving throw (DC 8 + your Proficiency Bonus + your Charisma modifier) or its spell fails and is wasted."]
            },
            {
              "type": "entries",
              "name": "7th Level: Aura of Warding",
              "entries": ["You and friendly creatures within 10 feet of you have advantage on saving throws against spells. At 18th level, the aura range increases to 30 feet."]
            },
            {
              "type": "entries",
              "name": "15th Level: Spell Reflection",
              "entries": ["When you succeed on a saving throw against a spell that targets only you, you can reflect it back at its caster. The caster must succeed on a saving throw using the spell's normal DC or suffer its effects."]
            },
            {
              "type": "entries",
              "name": "20th Level: Spellguard Paragon",
              "entries": ["For 1 minute (usable once per Long Rest), you emit an aura of magical suppression. Spells of 5th level or lower cast by hostile creatures within 30 feet of you automatically fail."]
            }
          ]
        }
      ]
    },
    {
      "name": "Vestige Patron",
      "shortName": "Vestige",
      "source": "UA2024",
      "className": "Warlock",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Vestige Patron",
          "entries": [
            "The Vestige Patron (UA 2026 Mystic Subclasses) derives power from a forgotten, dying god. The subclass centers around a Vestige Companion — a customizable Celestial, Fiend, or Undead entity that acts as both familiar and combat asset.",
            {
              "type": "entries",
              "name": "1st Level: Vestige Companion",
              "entries": ["You receive a Vestige Companion, a spectral manifestation of your dying patron. Choose its form: Celestial, Fiend, or Undead. The companion can fly, assist in combat (adding your Proficiency Bonus to one attack roll per turn), and scout areas. It reforms after a Short Rest if destroyed."]
            },
            {
              "type": "entries",
              "name": "1st Level: Patron Spells",
              "entries": ["Your Vestige grants you spells based on its form. Celestial: Cure Wounds, Guiding Bolt, Lesser Restoration, Daylight. Fiend: Burning Hands, Command, Fireball, Wall of Fire. Undead: Inflict Wounds, Ray of Enfeeblement, Animate Dead, Blight."]
            },
            {
              "type": "entries",
              "name": "6th Level: Dying God's Gift",
              "entries": ["When your Vestige Companion is adjacent to a creature you hit with an attack, you can expend one Warlock spell slot to deal an extra 2d8 damage of a type based on your companion's form (Celestial: Radiant, Fiend: Fire, Undead: Necrotic)."]
            },
            {
              "type": "entries",
              "name": "10th Level: Fading Divinity",
              "entries": ["Your Vestige Companion can use an action to cast a spell from your Warlock spell list with a spell slot level you choose. It uses your spell save DC and spell attack bonus."]
            },
            {
              "type": "entries",
              "name": "14th Level: Last Rites",
              "entries": ["Once per Long Rest, when you or your Vestige Companion drop to 0 Hit Points, the other can spend its action to restore the downed creature to half its maximum Hit Points."]
            }
          ]
        }
      ]
    },
    {
      "name": "Banneret",
      "shortName": "Banneret",
      "source": "UA2024",
      "className": "Fighter",
      "classSource": "XPHB",
      "page": 1,
      "entries": [
        {
          "type": "entries",
          "name": "Banneret",
          "entries": [
            "The Banneret (also called Purple Dragon Knight in prior editions) is a support Fighter from the Forgotten Realms Player's Guide UA. This subclass is about being a leader who inspires allies and fights alongside others.",
            {
              "type": "entries",
              "name": "3rd Level: Rallying Cry",
              "entries": ["When you use your Second Wind, up to three creatures of your choice within 60 feet that can see or hear you each regain Hit Points equal to your Fighter level."]
            },
            {
              "type": "entries",
              "name": "3rd Level: Royal Envoy",
              "entries": ["You gain proficiency in Persuasion. If you are already proficient in Persuasion, you gain proficiency in one of the following skills of your choice: Animal Handling, Insight, Intimidation, or Performance. Your proficiency bonus is doubled for any check you make with the chosen skill."]
            },
            {
              "type": "entries",
              "name": "7th Level: Inspiring Surge",
              "entries": ["When you use your Action Surge, you can choose one creature within 60 feet that can see or hear you. That creature can use its Reaction to make one melee or ranged weapon attack. Starting at 18th level, you can choose two creatures."]
            },
            {
              "type": "entries",
              "name": "10th Level: Bulwark",
              "entries": ["When you use your Indomitable feature to reroll a saving throw, you can extend that reroll to all friendly creatures within 60 feet that failed the same saving throw."]
            }
          ]
        }
      ]
    }
  ],
  "charoption": [
    {
      "name": "Gift of the Aetherborn",
      "source": "PSK",
      "page": 17,
      "optionType": ["DG"],
      "_src": "Kaladesh",
      "_typeName": "Dark Gift",
      "_typeCode": "DG",
      "_requiresSpecies": "Aetherborn",
      "_grantsAttack": {
        "name": "Drain Life",
        "ability": "str",
        "prof": true,
        "damageDice": "1d6",
        "damageType": "Necrotic",
        "mastery": "",
        "_src": "PSK"
      },
      "entries": [
        "An unknown aetherborn discovered a process of transformation that prolonged their existence by giving them the ability to feed on the life essence of other beings. An aetherborn with this gift gains the Drain Life ability.",
        {
          "type": "entries",
          "name": "Drain Life",
          "entries": ["You can drain the life essence of creatures you touch. As an action, make an unarmed strike against a creature within reach. On a hit, the target takes 1d6 Necrotic damage, and you regain Hit Points equal to the damage dealt. If you go 7 days without dealing this damage, your Hit Point maximum is reduced by 1d6 per week until you use Drain Life and finish a Long Rest."]
        }
      ]
    },
    {
      "name": "Aberrant Dragonmark",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "You have manifested an aberrant dragonmark. Unlike a true dragonmark, aberrant marks often manifest unpredictably and dangerously.",
        {
          "type": "entries",
          "name": "Aberrant Spells",
          "entries": ["You learn a cantrip and a 1st-level spell from the Sorcerer spell list. You can cast the 1st-level spell once without expending a spell slot, and you must finish a Long Rest before you can cast it this way again. Constitution is your spellcasting ability for these spells."]
        },
        {
          "type": "entries",
          "name": "Unpredictable Mark",
          "entries": ["When you cast the 1st-level spell with this trait, you can roll on the Wild Magic Surge table and apply the effect."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Detection",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Detection is associated with House Medani and grants insight and the ability to uncover hidden truths.",
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Detect Magic, Detect Poison and Disease, See Invisibility, Clairvoyance, Arcane Eye."]
        },
        {
          "type": "entries",
          "name": "Deductive Intuition",
          "entries": ["Whenever you make a Wisdom (Insight) or Wisdom (Perception) check, you can roll a d4 and add the number rolled to the ability check."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Finding",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Finding is associated with House Tharashk and grants tracking and detection abilities.",
        {
          "type": "entries",
          "name": "Hunter's Intuition",
          "entries": ["Whenever you make a Wisdom (Perception) or Wisdom (Survival) check, you can roll a d4 and add the number rolled to the ability check."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Faerie Fire, Longstrider, Locate Animals or Plants, Locate Object, Clairvoyance."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Handling",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Handling grants affinity with animals and the natural world, and is associated with House Vadalis.",
        {
          "type": "entries",
          "name": "Wild Intuition",
          "entries": ["When you make a Wisdom (Animal Handling) or Intelligence (Nature) check, you can roll a d4 and add it to the roll."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Animal Friendship, Speak with Animals, Beast Sense, Calm Emotions, Dominate Beast."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Healing",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Healing is associated with House Jorasco and provides powerful healing abilities.",
        {
          "type": "entries",
          "name": "Healing Touch",
          "entries": ["When you use a healer's kit to stabilize a dying creature, that creature also regains 1 hit point. As an action, you can touch a creature and expend a use of a Healer's Kit to restore a number of hit points equal to 1d6 + your Wisdom modifier."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Cure Wounds, Healing Word, Lesser Restoration, Mass Healing Word, Greater Restoration."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Hospitality",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Hospitality is associated with House Ghallanda and grants the ability to create comfort and safety.",
        {
          "type": "entries",
          "name": "Ever Hospitable",
          "entries": ["Whenever you roll a Charisma (Persuasion) check or make an ability check involving brewer's supplies or cook's utensils, roll a d4 and add it to the roll."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Prestidigitation, Purify Food and Drink, Unseen Servant, Rope Trick, Mordenkainen's Magnificent Mansion."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Making",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Making is associated with House Cannith and grants the gift of creation.",
        {
          "type": "entries",
          "name": "Artisan's Intuition",
          "entries": ["Whenever you make an ability check with artisan's tools, roll a d4 and add the number rolled to the check."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Magic Stone, Mending, Magic Mouth, Fabricate, Creation."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Passage",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Passage is associated with House Orien and grants supernatural speed and travel abilities.",
        {
          "type": "entries",
          "name": "Courier's Speed",
          "entries": ["Your base walking speed increases by 5 feet."]
        },
        {
          "type": "entries",
          "name": "Intuitive Motion",
          "entries": ["Whenever you make a Dexterity (Acrobatics) check or any ability check to operate or maintain a land vehicle, you can roll a d4 and add it to the roll."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Expeditious Retreat, Jump, Misty Step, Thunder Step, Teleportation Circle."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Scribing",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Scribing is associated with House Sivis and grants mastery over language and communication.",
        {
          "type": "entries",
          "name": "Gifted Scribe",
          "entries": ["Whenever you make an ability check with calligrapher's supplies or forgery kit, roll a d4 and add the number rolled to the check."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Comprehend Languages, Illusory Script, Animal Messenger, Sending, Tongues."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Sentinel",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Sentinel is associated with House Deneith and grants protective abilities.",
        {
          "type": "entries",
          "name": "Sentinel's Intuition",
          "entries": ["Whenever you make a Wisdom (Insight) or Wisdom (Perception) check, you can roll a d4 and add the number rolled to the ability check."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Compelled Duel, Shield of Faith, Warding Bond, Guardian of Faith, Wall of Force."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Shadow",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Shadow is associated with House Phiarlan and House Thuranni and grants powers of illusion and shadow.",
        {
          "type": "entries",
          "name": "Cunning Intuition",
          "entries": ["Whenever you make a Dexterity (Performance) or Dexterity (Stealth) check, roll a d4 and add it to the roll."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Disguise Self, Invisibility, Nondetection, Greater Invisibility, Mislead."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Storm",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Storm is associated with House Lyrandar and grants control over weather and wind.",
        {
          "type": "entries",
          "name": "Windwright's Intuition",
          "entries": ["Whenever you make a Dexterity (Acrobatics) check or any ability check to operate or maintain a water or air vehicle, roll a d4 and add the number rolled to the check."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Fog Cloud, Gust of Wind, Lightning Bolt, Sleet Storm, Control Weather."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    },
    {
      "name": "Mark of Warding",
      "source": "UA2024",
      "page": 1,
      "optionType": ["SG"],
      "entries": [
        "The Mark of Warding is associated with House Kundarak and grants abilities to protect and secure.",
        {
          "type": "entries",
          "name": "Master of Locks",
          "entries": ["Whenever you make a History, Investigation, or Thieves' Tools check involving locks, vaults, or warding, roll a d4 and add it to the roll."]
        },
        {
          "type": "entries",
          "name": "Spells of the Mark",
          "entries": ["You always have the following spells prepared: Alarm, Magic Aura, Arcane Lock, Glyph of Warding, Mordenkainen's Private Sanctum."]
        }
      ],
      "_src": "UA 2024",
      "_typeName": "Supernatural Gift",
      "_typeCode": "SG"
    }
  ]
}
;
