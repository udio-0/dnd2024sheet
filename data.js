/* =============================================
   D&D 2024 CHARACTER SHEET - DATA LAYER
   Fetches & processes ALL official data from 5etools
   ============================================= */

'use strict';

const DATA_BASE = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data';

const SCHOOL_MAP = {
  A: 'Abjuration', C: 'Conjuration', D: 'Divination', E: 'Enchantment',
  V: 'Evocation', I: 'Illusion', N: 'Necromancy', T: 'Transmutation',
};

const DMG_TYPE_MAP = {
  S: 'slashing', P: 'piercing', B: 'bludgeoning', N: 'necrotic',
  R: 'radiant', F: 'fire', C: 'cold', L: 'lightning', T: 'thunder',
  O: 'force', A: 'acid', Y: 'psychic', I: 'poison',
};

const ITEM_TYPE_MAP = {
  S: 'Shield', LA: 'Light Armor', MA: 'Medium Armor', HA: 'Heavy Armor',
  M: 'Melee Weapon', R: 'Ranged Weapon', A: 'Ammunition', AF: 'Ammunition (futuristic)',
  G: 'Adventuring Gear', SCF: 'Spellcasting Focus', AT: "Artisan's Tools",
  T: 'Tools', INS: 'Instrument', GS: 'Gaming Set', OTH: 'Other',
  P: 'Potion', RD: 'Rod', RG: 'Ring', SC: 'Scroll', WD: 'Wand',
  W: 'Wondrous Item', EXP: 'Explosive', FD: 'Food/Drink',
  MNT: 'Mount', TAH: 'Tack and Harness', TG: 'Trade Good', VEH: 'Vehicle',
};

const PROPERTY_MAP = {
  A: 'Ammunition', AF: 'Ammunition (futuristic)', F: 'Finesse', H: 'Heavy',
  L: 'Light', LD: 'Loading', R: 'Reach', S: 'Special', T: 'Thrown',
  '2H': 'Two-Handed', V: 'Versatile',
};

// Human-readable source book names
const SOURCE_MAP = {
  PHB: "PHB '14", XPHB: "PHB '24", DMG: "DMG '14", XDMG: "DMG '24",
  MM: "MM '14", XMM: "MM '25",
  MPMM: "Multiverse", XGE: "Xanathar's", TCE: "Tasha's",
  VGM: "Volo's", MTF: "Mordenkainen's TF", FTD: "Fizban's",
  AAG: "Astral AG", SCC: "Strixhaven", DSotDQ: "Dragonlance",
  GGR: "Ravnica", MOT: "Theros", AI: "Acq. Inc.",
  EGW: "Wildemount", ERLW: "Eberron", SCAG: "Sword Coast",
  IDRotF: "Icewind Dale", BGG: "Bigby's", BMT: "Book of MT",
  CoS: "Strahd", WBtW: "Witchlight", PaBTSO: "Phandelver",
  VRGR: "Ravenloft", LLK: "Kwalish", SACoC: "Candlekeep",
  KftGV: "Keys Golden Vault", TTP: "Turning of Pages",
  ABH: "Ravenloft", EFA: "Eberron", LFL: "Lorwyn/Faerun",
};

function sourceName(src) {
  return SOURCE_MAP[src] || src;
}

// ---- 5ETOOLS TEXT PARSER ----

function parseEntry(entry) {
  if (typeof entry === 'string') return stripTags(entry);
  if (!entry || typeof entry !== 'object') return '';
  if (Array.isArray(entry)) return entry.map(parseEntry).join(' ');
  if (entry.type === 'entries' || entry.type === 'inset' || entry.type === 'insetReadaloud') {
    let out = '';
    if (entry.name) out += `**${entry.name}**: `;
    if (entry.entries) out += entry.entries.map(parseEntry).join(' ');
    return out;
  }
  if (entry.type === 'list') {
    return (entry.items || []).map(i => '• ' + parseEntry(i)).join('\n');
  }
  if (entry.type === 'table') {
    return `[Table: ${entry.caption || 'see source'}]`;
  }
  if (entry.type === 'cell') return parseEntry(entry.entry);
  if (entry.type === 'item') {
    let txt = entry.name ? entry.name + ': ' : '';
    txt += parseEntry(entry.entry || entry.entries || '');
    return txt;
  }
  if (entry.type === 'abilityDc' || entry.type === 'abilityAttackMod') {
    return entry.name || '';
  }
  return '';
}

function stripTags(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\{@\w+ ([^|}]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@hit ([^}]+)\}/g, '$1')
    .replace(/\{@dc (\d+)\}/g, 'DC $1')
    .replace(/\{@dice ([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@damage ([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@scaledice [^}]*\|[^}]*\|([^}]+)\}/g, '$1')
    .replace(/\{@\w+ ([^}]+)\}/g, '$1');
}

function entriesToText(entries) {
  if (!entries) return '';
  if (typeof entries === 'string') return stripTags(entries);
  if (Array.isArray(entries)) return entries.map(parseEntry).join('\n');
  return parseEntry(entries);
}

function cpToGold(cp) {
  if (!cp) return '0 gp';
  if (cp >= 100) return (cp / 100) + ' gp';
  if (cp >= 10) return (cp / 10) + ' sp';
  return cp + ' cp';
}

// ---- DATA STORE ----

const DndData = {
  baseItems: [],
  items: [],
  allItems: [],
  spells: [],
  spellSources: {},
  races: [],
  subraces: [],
  backgrounds: [],
  feats: [],
  classes: [],
  classDetails: {},
  classIndex: {},
  loaded: false,
  loadingPromise: null,
  listeners: [],

  onReady(fn) {
    if (this.loaded) fn();
    else this.listeners.push(fn);
  },

  _notifyReady() {
    this.loaded = true;
    this.listeners.forEach(fn => fn());
    this.listeners = [];
  },
};

// ---- FETCH HELPERS ----

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`Failed to fetch ${url}:`, e);
    return null;
  }
}

// ---- LOAD ALL DATA (ALL SOURCES) ----

async function loadAllData(progressCallback) {
  if (DndData.loadingPromise) return DndData.loadingPromise;

  DndData.loadingPromise = (async () => {
    const progress = progressCallback || (() => {});

    // BASE ITEMS
    progress('Loading base items...');
    const baseItemsData = await fetchJson(`${DATA_BASE}/items-base.json`);
    if (baseItemsData) {
      DndData.baseItems = (baseItemsData.baseitem || []);
      DndData.baseItems.forEach(processItem);
    }

    // MAGIC ITEMS
    progress('Loading items...');
    const itemsData = await fetchJson(`${DATA_BASE}/items.json`);
    if (itemsData) {
      DndData.items = (itemsData.item || []);
      DndData.items.forEach(processItem);
    }
    DndData.allItems = [...DndData.baseItems, ...DndData.items];

    // SPELLS - Load spell index, then ALL spell files
    progress('Loading spell index...');
    const spellIndex = await fetchJson(`${DATA_BASE}/spells/index.json`);
    if (spellIndex) {
      const spellFiles = Object.values(spellIndex).filter(f => f.endsWith('.json') && f !== 'sources.json');
      const totalFiles = spellFiles.length;
      let loadedFiles = 0;

      // Load in batches of 5 to avoid overwhelming
      for (let i = 0; i < spellFiles.length; i += 5) {
        const batch = spellFiles.slice(i, i + 5);
        progress(`Loading spells (${Math.min(i + 5, totalFiles)}/${totalFiles})...`);
        const results = await Promise.all(
          batch.map(f => fetchJson(`${DATA_BASE}/spells/${f}`))
        );
        results.forEach(data => {
          if (data && data.spell) {
            data.spell.forEach(spell => {
              spell._schoolName = SCHOOL_MAP[spell.school] || spell.school;
              spell._levelStr = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
              spell._castTime = formatCastTime(spell.time);
              spell._rangeStr = formatRange(spell.range);
              spell._durationStr = formatDuration(spell.duration);
              spell._componentsStr = formatComponents(spell.components);
              spell._src = sourceName(spell.source);
            });
            DndData.spells.push(...data.spell);
          }
        });
      }
    } else {
      // Fallback: just load XPHB spells
      progress('Loading spells (fallback)...');
      const spellsData = await fetchJson(`${DATA_BASE}/spells/spells-xphb.json`);
      if (spellsData) {
        DndData.spells = (spellsData.spell || []);
        DndData.spells.forEach(spell => {
          spell._schoolName = SCHOOL_MAP[spell.school] || spell.school;
          spell._levelStr = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
          spell._castTime = formatCastTime(spell.time);
          spell._rangeStr = formatRange(spell.range);
          spell._durationStr = formatDuration(spell.duration);
          spell._componentsStr = formatComponents(spell.components);
          spell._src = sourceName(spell.source);
        });
      }
    }

    // Deduplicate spells: prefer XPHB version, then newest source
    DndData.spells = deduplicateByName(DndData.spells, 'XPHB');

    // SPELL CLASS LISTS
    progress('Loading spell class lists...');
    const sourcesData = await fetchJson(`${DATA_BASE}/spells/sources.json`);
    if (sourcesData) {
      DndData.spellSources = sourcesData;
    }

    // RACES / SPECIES (ALL)
    progress('Loading species...');
    const racesData = await fetchJson(`${DATA_BASE}/races.json`);
    if (racesData) {
      DndData.races = (racesData.race || []).map(r => {
        r._src = sourceName(r.source);
        r._displayName = r.name;
        return r;
      });
      DndData.subraces = (racesData.subrace || []).map(r => {
        r._src = sourceName(r.source);
        r._displayName = r.raceName ? `${r.raceName} (${r.name})` : r.name;
        return r;
      });
    }

    // BACKGROUNDS (ALL)
    progress('Loading backgrounds...');
    const bgData = await fetchJson(`${DATA_BASE}/backgrounds.json`);
    if (bgData) {
      DndData.backgrounds = (bgData.background || []).map(b => {
        b._src = sourceName(b.source);
        return b;
      });
    }

    // FEATS (ALL)
    progress('Loading feats...');
    const featsData = await fetchJson(`${DATA_BASE}/feats.json`);
    if (featsData) {
      DndData.feats = (featsData.feat || []).map(f => {
        f._src = sourceName(f.source);
        f._catName = { G: 'General', O: 'Origin', FS: 'Fighting Style', EB: 'Epic Boon', OG: 'Origin' }[f.category] || f.category || '';
        return f;
      });
    }

    // CLASS INDEX + ALL CLASSES
    progress('Loading class index...');
    const classIdx = await fetchJson(`${DATA_BASE}/class/index.json`);
    if (classIdx) {
      DndData.classIndex = classIdx;
    }

    progress('Loading classes...');
    const classFiles = [...new Set(Object.values(DndData.classIndex || {}))];

    // Load class files in batches of 4
    for (let i = 0; i < classFiles.length; i += 4) {
      const batch = classFiles.slice(i, i + 4);
      progress(`Loading classes (${Math.min(i + 4, classFiles.length)}/${classFiles.length})...`);
      const results = await Promise.all(batch.map(f => fetchJson(`${DATA_BASE}/class/${f}`)));
      results.forEach(data => {
        if (!data) return;
        const allClasses = (data.class || []);
        allClasses.forEach(cls => {
          cls._src = sourceName(cls.source);
          DndData.classes.push(cls);
          const key = `${cls.name} (${cls._src})`;
          DndData.classDetails[key] = {
            class: cls,
            subclasses: (data.subclass || []).filter(sc => sc.className === cls.name && sc.classSource === cls.source),
            features: (data.classFeature || []).filter(f => f.className === cls.name && f.classSource === cls.source),
            subclassFeatures: (data.subclassFeature || []).filter(f => f.className === cls.name && f.classSource === cls.source),
          };
          // Also store without source for simple lookup
          if (!DndData.classDetails[cls.name] || cls.source === 'XPHB') {
            DndData.classDetails[cls.name] = DndData.classDetails[key];
          }
        });
      });
    }

    progress('Ready!');
    DndData._notifyReady();
  })();

  return DndData.loadingPromise;
}

// ---- DEDUPLICATION ----
// When same spell/item name appears in multiple sources, prefer preferredSource, else keep all
function deduplicateByName(arr, preferredSource) {
  const byName = {};
  arr.forEach(item => {
    const key = item.name.toLowerCase();
    if (!byName[key]) {
      byName[key] = item;
    } else if (item.source === preferredSource && byName[key].source !== preferredSource) {
      byName[key] = item;
    }
    // Keep first found otherwise
  });
  return Object.values(byName);
}

// ---- PROCESS ITEM ----
function processItem(item) {
  item._type = getItemTypeLabel(item);
  item._dmgStr = formatItemDamage(item);
  item._propStr = formatItemProperties(item);
  item._valueStr = item.value ? cpToGold(item.value) : '';
  item._category = categorizeItem(item);
  item._src = sourceName(item.source);
}

// ---- ITEM HELPERS ----

function getItemTypeLabel(item) {
  if (!item.type) {
    if (item.armor) return 'Armor';
    if (item.weaponCategory) return item.weaponCategory === 'martial' ? 'Martial Weapon' : 'Simple Weapon';
    if (item.wondrous) return 'Wondrous Item';
    return 'Item';
  }
  const code = item.type.split('|')[0];
  return ITEM_TYPE_MAP[code] || code;
}

function formatItemDamage(item) {
  if (!item.dmg1) return '';
  const type = DMG_TYPE_MAP[item.dmgType] || item.dmgType || '';
  let str = item.dmg1;
  if (type) str += ' ' + type;
  if (item.dmg2) str += ` (${item.dmg2} versatile)`;
  return str;
}

function formatItemProperties(item) {
  if (!item.property || !item.property.length) return '';
  return item.property.map(p => {
    const code = typeof p === 'string' ? p.split('|')[0] : p;
    return PROPERTY_MAP[code] || code;
  }).join(', ');
}

function categorizeItem(item) {
  if (item.weaponCategory) return 'weapon';
  if (item.armor || item.type?.startsWith?.('LA') || item.type?.startsWith?.('MA') || item.type?.startsWith?.('HA') || item.type?.startsWith?.('S')) return 'armor';
  if (item.wondrous || (item.rarity && item.rarity !== 'none')) return 'magic';
  return 'gear';
}

// ---- SPELL HELPERS ----

function formatCastTime(time) {
  if (!time || !time.length) return '';
  const t = time[0];
  return `${t.number} ${t.unit}`;
}

function formatRange(range) {
  if (!range) return '';
  if (range.type === 'point') {
    if (!range.distance) return 'Self';
    if (range.distance.type === 'self') return 'Self';
    if (range.distance.type === 'touch') return 'Touch';
    return `${range.distance.amount} ${range.distance.type}`;
  }
  if (range.type === 'special') return 'Special';
  return range.distance ? `${range.distance.amount} ${range.distance.type}` : '';
}

function formatDuration(duration) {
  if (!duration || !duration.length) return '';
  const d = duration[0];
  if (d.type === 'instant') return 'Instantaneous';
  if (d.type === 'permanent') return 'Until dispelled';
  if (d.type === 'special') return 'Special';
  if (d.type === 'timed') {
    const conc = d.concentration ? 'Conc., ' : '';
    return `${conc}${d.duration.amount} ${d.duration.type}${d.duration.amount > 1 ? 's' : ''}`;
  }
  return '';
}

function formatComponents(comp) {
  if (!comp) return '';
  const parts = [];
  if (comp.v) parts.push('V');
  if (comp.s) parts.push('S');
  if (comp.m) {
    const mat = typeof comp.m === 'string' ? comp.m : (comp.m.text || 'material');
    parts.push(`M (${mat})`);
  }
  return parts.join(', ');
}

// ---- SPELL CLASS FILTERING ----
// Check ALL source books in spellSources, not just XPHB

function getSpellsForClass(className) {
  const matchingNames = new Set();

  // Iterate over ALL source books in spellSources
  for (const [sourceBook, spellMap] of Object.entries(DndData.spellSources)) {
    for (const [spellName, data] of Object.entries(spellMap)) {
      if (data.class && data.class.some(c => c.name.toLowerCase() === className.toLowerCase())) {
        matchingNames.add(spellName.toLowerCase());
      }
    }
  }

  return DndData.spells.filter(s => matchingNames.has(s.name.toLowerCase()));
}

// ---- CLASS HELPERS ----

function getClassFeaturesByLevel(className) {
  const details = DndData.classDetails[className];
  if (!details) return {};
  const byLevel = {};
  details.features.forEach(f => {
    const lvl = f.level || 1;
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push({
      name: f.name,
      text: entriesToText(f.entries),
    });
  });
  return byLevel;
}

function getClassInfo(className) {
  const details = DndData.classDetails[className];
  if (!details) return null;
  const cls = details.class;
  return {
    name: cls.name,
    source: cls.source,
    src: cls._src,
    hitDie: cls.hd ? `d${cls.hd.faces}` : '',
    hitDieFaces: cls.hd?.faces || 8,
    savingThrows: cls.proficiency || [],
    armorProf: cls.startingProficiencies?.armor || [],
    weaponProf: cls.startingProficiencies?.weapons || [],
    skillChoices: cls.startingProficiencies?.skills?.[0]?.choose || null,
    subclasses: details.subclasses.map(sc => ({ name: sc.name, source: sc.source, src: sourceName(sc.source) })),
    primaryAbility: cls.primaryAbility || [],
  };
}

function getSpeciesInfo(name, source) {
  // Try exact match by name and source first, then by name alone
  let race = null;
  if (source) {
    race = DndData.races.find(r => r.name === name && r.source === source);
  }
  if (!race) {
    race = DndData.races.find(r => r.name === name);
  }
  if (!race) {
    // Check subraces / display names
    race = DndData.races.find(r => r._displayName === name);
  }
  if (!race) return null;
  return {
    name: race.name,
    source: race.source,
    src: race._src,
    size: (race.size || ['M']).map(s => ({ S: 'Small', M: 'Medium', L: 'Large', T: 'Tiny', H: 'Huge', G: 'Gargantuan' }[s] || s)).join(' or '),
    speed: typeof race.speed === 'number' ? race.speed : (race.speed?.walk || 30),
    darkvision: race.darkvision || 0,
    traits: entriesToText(race.entries),
    resist: race.resist || [],
    languageProf: race.languageProficiencies || [],
    abilityBonus: formatAbilityBonus(race),
  };
}

function formatAbilityBonus(race) {
  if (!race.ability || !race.ability.length) {
    if (race.lineage) return 'Lineage (choose your own)';
    return 'None (set by background)';
  }
  const parts = [];
  race.ability.forEach(ab => {
    if (ab.choose) {
      parts.push(`Choose from: ${ab.choose.from?.join(', ') || 'any'}`);
    } else {
      Object.entries(ab).forEach(([key, val]) => {
        if (key !== 'choose' && typeof val === 'number') {
          parts.push(`${key.toUpperCase()} +${val}`);
        }
      });
    }
  });
  return parts.join('; ') || 'None';
}

function getBackgroundInfo(name) {
  const bg = DndData.backgrounds.find(b => b.name === name);
  if (!bg) return null;
  return {
    name: bg.name,
    source: bg.source,
    src: bg._src,
    skillProf: bg.skillProficiencies?.[0] || {},
    toolProf: bg.toolProficiencies?.[0] || {},
    feat: bg.feats?.[0] || null,
    ability: bg.ability?.[0] || null,
    description: entriesToText(bg.entries),
  };
}

function getFeatInfo(name) {
  const feat = DndData.feats.find(f => f.name === name);
  if (!feat) return null;
  return {
    name: feat.name,
    source: feat.source,
    src: feat._src,
    category: feat._catName,
    prerequisite: feat.prerequisite || [],
    description: entriesToText(feat.entries),
    ability: feat.ability || [],
  };
}
