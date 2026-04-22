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
  ABH: "Astarion's BH", EFA: "Eberron", LFL: "Lorwyn/Faerun", FRHoF: "FR Heroes",
  UA2024: "UA 2024",
};

function sourceName(src) {
  return SOURCE_MAP[src] || src;
}

// ---- 5ETOOLS TEXT PARSER ----

function parseEntry(entry) {
  if (typeof entry === 'string') return stripTags(entry);
  if (!entry || typeof entry !== 'object') return '';
  if (Array.isArray(entry)) return entry.map(parseEntry).filter(Boolean).join('\n');
  const addPunct = name => /[.!?:]$/.test(name) ? name : name + '.';
  if (entry.type === 'entries' || entry.type === 'inset' || entry.type === 'insetReadaloud') {
    const parts = [];
    if (entry.name) parts.push(addPunct(entry.name));
    if (entry.entries) parts.push(...entry.entries.map(parseEntry).filter(Boolean));
    return parts.join(' ');
  }
  if (entry.type === 'list') {
    return (entry.items || []).map(i => '• ' + parseEntry(i)).join('\n');
  }
  if (entry.type === 'table') {
    const headers = (entry.colLabels || []).map(h => typeof h === 'string' ? stripTags(h) : '').join(' | ');
    const resolveRollText = roll => {
      if (!roll) return '';
      if (roll.exact != null) return String(roll.exact);
      if (roll.min != null && roll.max != null) return `${roll.min}–${roll.max}`;
      return '';
    };
    const rows = (entry.rows || []).map(row => {
      const cells = (Array.isArray(row) ? row : (row.row || [])).map(c => {
        if (typeof c === 'string') return stripTags(c);
        if (typeof c === 'number') return String(c);
        if (c?.type === 'cell') return c.entry != null ? stripTags(String(c.entry)) : resolveRollText(c.roll);
        return c?.entry ? stripTags(c.entry) : resolveRollText(c?.roll);
      }).join(' | ');
      return cells;
    }).filter(Boolean).join('\n');
    return (entry.caption ? entry.caption + '\n' : '') + (headers ? headers + '\n' : '') + rows;
  }
  if (entry.type === 'cell') return parseEntry(entry.entry);
  if (entry.type === 'item') {
    let txt = entry.name ? addPunct(entry.name) + ' ' : '';
    txt += parseEntry(entry.entry || entry.entries || '');
    return txt;
  }
  if (entry.type === 'abilityDc' || entry.type === 'abilityAttackMod') {
    return entry.name || '';
  }
  return '';
}

function entriesToHtml(entries) {
  if (!entries) return '';
  if (typeof entries === 'string') return `<p>${stripTags(entries)}</p>`;
  if (Array.isArray(entries)) return entries.map(parseEntryHtml).filter(Boolean).join('');
  return parseEntryHtml(entries);
}

const FILLER_PHRASES = /^(you gain the following benefits\.?|you gain the following\.|choose one of the following options?\.?|you have the following benefits\.?)$/i;

function parseEntryHtml(entry) {
  if (typeof entry === 'string') {
    const text = stripTags(entry);
    if (FILLER_PHRASES.test(text.trim())) return '';
    // Split on double newlines into paragraphs; bold sub-feature names like "Name. text"
    if (text.includes('\n\n')) {
      return text.split(/\n\n+/).filter(p => p.trim()).map(p => {
        const bolded = p.replace(/^([A-Z][A-Za-z' ]+(?: [A-Z][A-Za-z' ]+)*\.)(\s)/, '<strong>$1</strong>$2');
        return `<p>${bolded}</p>`;
      }).join('');
    }
    return `<p>${text}</p>`;
  }
  if (!entry || typeof entry !== 'object') return '';
  if (Array.isArray(entry)) return entry.map(parseEntryHtml).filter(Boolean).join('');
  const addPunctHtml = name => /[.!?:]$/.test(name) ? name : name + '.';
  if (entry.type === 'inset') {
    // Inset entries are flavour/lore sidebars with no mechanical impact — skip them
    return '';
  }
  if (entry.type === 'entries') {
    let out = '';
    if (entry.name) out += `<p><strong>${addPunctHtml(entry.name)}</strong></p>`;
    if (entry.entries) out += entry.entries.map(e => parseEntryHtml(e)).filter(Boolean).join('');
    return out;
  }
  if (entry.type === 'list') {
    return '<ul>' + (entry.items || []).map(i => `<li>${typeof i === 'string' ? stripTags(i) : parseEntryHtml(i)}</li>`).join('') + '</ul>';
  }
  if (entry.type === 'table') {
    const caption = entry.caption ? `<caption class="entry-table-caption">${stripTags(entry.caption)}</caption>` : '';
    const headers = (entry.colLabels || []).map(h => `<th>${stripTags(typeof h === 'string' ? h : (h.label || ''))}</th>`).join('');
    const thead = headers ? `<thead><tr>${headers}</tr></thead>` : '';
    const resolveRoll = roll => {
      if (!roll) return '';
      if (roll.exact != null) return String(roll.exact);
      if (roll.min != null && roll.max != null) return `${roll.min}–${roll.max}`;
      return '';
    };
    const renderCell = c => {
      let text = '';
      if (typeof c === 'string') text = c;
      else if (typeof c === 'number') text = String(c);
      else if (c && c.type === 'cell') {
        if (c.entry != null) text = typeof c.entry === 'string' ? c.entry : parseEntry(c.entry);
        else text = resolveRoll(c.roll);
      }
      else if (c && typeof c === 'object') {
        if (c.entry != null) text = typeof c.entry === 'string' ? c.entry : parseEntry(c.entry);
        else if (c.roll) text = resolveRoll(c.roll);
        else text = c.text || '';
      }
      // Extract {@b ...} bold markers before stripTags removes them
      const bolds = [];
      text = text.replace(/\{@b ([^}]+)\}/g, (_, inner) => { const id = `__BOLD${bolds.length}__`; bolds.push(inner); return id; });
      text = stripTags(text);
      bolds.forEach((b, i) => { text = text.replace(`__BOLD${i}__`, `<strong>${b}</strong>`); });
      return text;
    };
    const rows = (entry.rows || []).map(row => {
      const cells = (Array.isArray(row) ? row : (row.row || [])).map(c => `<td>${renderCell(c)}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table class="entry-table">${caption}${thead}<tbody>${rows}</tbody></table>`;
  }
  if (entry.type === 'cell') return parseEntryHtml(entry.entry);
  if (entry.type === 'item') {
    return `<p>${entry.name ? `<strong>${addPunctHtml(entry.name)}</strong> ` : ''}${parseEntryHtml(entry.entry || entry.entries || '')}</p>`;
  }
  return '';
}

const PROPERTY_NAMES = {
  A: 'Ammunition', AF: 'Ammunition (Firearm)', BF: 'Burst Fire', F: 'Finesse',
  H: 'Heavy', L: 'Light', LD: 'Loading', R: 'Reach', RLD: 'Reload',
  S: 'Special', T: 'Thrown', '2H': 'Two-Handed', V: 'Versatile',
  // 2024 additions
  'Nick': 'Nick', 'Graze': 'Graze', 'Push': 'Push', 'Sap': 'Sap', 'Slow': 'Slow', 'Topple': 'Topple', 'Vex': 'Vex',
};

function stripTags(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\{@filter ([^|]+)\|[^}]*\}/g, '$1')   // {@filter display|...} → display text only
    .replace(/\{@scaledice [^}]*\|[^}]*\|([^}|]+)[^}]*\}/g, '$1')
    .replace(/\{@(?:hit|atk) ([^}]+)\}/g, '$1')
    .replace(/\{@dc (\d+)\}/g, 'DC $1')
    .replace(/\{@(?:dice|damage) ([^|}]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@itemProperty ([^|}]+)(?:\|[^|]*)?\|([^}]+)\}/g, '$2')  // {@itemProperty H|XPHB|Heavy} → Heavy
    .replace(/\{@itemProperty ([^|}]+)(?:\|[^}]*)?\}/g, (_, key) => PROPERTY_NAMES[key.trim()] || key.trim())
    .replace(/\{@(?:variantrule|condition|status|skill|sense) ([^|}]+)\|([^|}]*)\|([^}]+)\}/g, '$3')  // 3-segment: use display text
    .replace(/\{@(?:variantrule|condition|status|skill|sense) ([^|}]+)\|[^}]*\}/g, '$1')             // 2-segment: use name
    .replace(/\{@action ([^|]+)\|[^}]*\}/g, '$1')                // {@action Attack|XPHB} → Attack
    .replace(/\{@property ([^|}]+)(?:\|[^}]*)?\}/g, (_, key) => PROPERTY_NAMES[key.trim()] || key.trim())
    .replace(/\{@\w+ ([^|}]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@\w+\}/g, '')
    .replace(/\{[^}]*\}/g, '');  // catch-all: remove any remaining braces
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
  backgroundFluff: [],
  feats: [],
  classes: [],
  classDetails: {},
  classIndex: {},
  charOptions: [],
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
      DndData.items.forEach(item => { processItem(item); item._isMagic = true; });
    }
    // MAGIC VARIANTS (Armor of Resistance, Weapon of Warning, etc.)
    const magicVariantsData = await fetchJson(`${DATA_BASE}/magicvariants.json`);
    if (magicVariantsData) {
      const WEAPON_REQUIRE_KEYS = new Set(['sword','axe','bow','crossbow','spear','hammer','club','dagger','staff','mace','weapon','whip','flail','lance','pike','halberd','glaive','trident','rapier','scimitar','shortsword','longsword','greatsword','handaxe','battleaxe','greataxe','warhammer','maul','morningstar','quarterstaff','javelin','sling','dart']);
      const variants = (magicVariantsData.magicvariant || []).map(v => {
        const item = Object.assign({}, v, v.inherits || {});
        // Infer weapon category from requires before deleting it
        if (!item.weaponCategory && Array.isArray(v.requires)) {
          for (const req of v.requires) {
            if (req.weaponCategory) { item.weaponCategory = req.weaponCategory; break; }
            if (Object.keys(req).some(k => WEAPON_REQUIRE_KEYS.has(k))) { item.weaponCategory = 'martial'; break; }
          }
        }
        delete item.inherits;
        delete item.requires;
        item._isMagic = true;
        processItem(item);
        return item;
      });
      DndData.items = [...DndData.items, ...variants];
    }
    DndData.allItems = [...DndData.baseItems, ...DndData.items];
    // Deduplicate items: when the same name exists in both 2014 and 2024 sources, prefer the 2024 version.
    // Items only in 2014 sources (no 2024 replacement) are kept as-is.
    const _2024_ITEM_SOURCES = new Set(['XPHB', 'XDMG', 'XMM', 'EFA', 'LFL', 'ABH', 'FRHoF']);
    DndData.allItems = deduplicateByName(DndData.allItems, src => _2024_ITEM_SOURCES.has(src));

    // Synthetic currency items: each coin type is a searchable inventory item.
    // 50 coins = 1 lb → 0.02 lb each. `coinKey` drives icon rendering and the
    // "Coin Weight" carrying-capacity toggle.
    const COIN_DEFS = [
      { key: 'cp', name: 'Copper Piece',   value: 1 },
      { key: 'sp', name: 'Silver Piece',   value: 10 },
      { key: 'ep', name: 'Electrum Piece', value: 50 },
      { key: 'gp', name: 'Gold Piece',     value: 100 },
      { key: 'pp', name: 'Platinum Piece', value: 1000 },
    ];
    COIN_DEFS.forEach(c => {
      DndData.allItems.push({
        name: c.name,
        weight: 0.02,
        source: 'XPHB',
        type: 'CUR',
        _type: 'Currency',
        _dmgStr: '',
        _propStr: '',
        _valueStr: '',
        _category: 'gear',
        _src: 'XPHB',
        _coinKey: c.key,
        _iconHtml: `<span class="coin-icon coin-${c.key}" aria-hidden="true"></span>`,
        rarity: 'none',
        entries: [`One ${c.name.toLowerCase()}. Fifty coins weigh one pound.`],
      });
    });

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
      const rawRaces = racesData.race || [];
      // Build a lookup for resolving _copy
      const raceByKey = {};
      rawRaces.forEach(r => { raceByKey[`${r.name}__${r.source}`] = r; });

      DndData.races = rawRaces.map(r => {
        // Resolve _copy: if this race copies another, inherit its entries
        if (r._copy) {
          const src = raceByKey[`${r._copy.name}__${r._copy.source}`];
          if (src) {
            if (!r.size && src.size) r.size = src.size;
            if (!r.speed && src.speed) r.speed = src.speed;
            if (!r.darkvision && src.darkvision) r.darkvision = src.darkvision;
            if (!r.resist && src.resist) r.resist = src.resist;
            if (!r.additionalSpells && src.additionalSpells) r.additionalSpells = src.additionalSpells;
            if (!r.creatureTypes && src.creatureTypes) r.creatureTypes = src.creatureTypes;
            if (!r.entries && src.entries) {
              // Start with a shallow copy of the source entries array
              r.entries = src.entries.slice();
              // Apply _mod operations (5etools patch system)
              const mods = r._copy._mod?.entries;
              if (mods) {
                const modList = Array.isArray(mods) ? mods : [mods];
                modList.forEach(op => {
                  if (op.mode === 'replaceArr' && op.replace) {
                    const idx = r.entries.findIndex(e => typeof e === 'object' && e.name === op.replace);
                    if (idx !== -1) r.entries = r.entries.map((e, i) => i === idx ? op.items : e);
                  } else if (op.mode === 'appendArr') {
                    r.entries = r.entries.concat(Array.isArray(op.items) ? op.items : [op.items]);
                  } else if (op.mode === 'prependArr') {
                    r.entries = (Array.isArray(op.items) ? op.items : [op.items]).concat(r.entries);
                  }
                });
              }
            }
          }
        }
        r._src = sourceName(r.source);
        r._displayName = r.name;

        // Flag races that should not appear in the player-facing species list:
        // 1. Known NPC/monster-only races (no player rules)
        // 2. Older-source entries superseded by any reprint (2014 or 2024)
        //    e.g. VGM Goblin when MPMM exists, or MPMM Changeling when EFA (2024) exists
        const _pc2024srcs = new Set(['XPHB','XDMG','XMM','EFA','LFL','ABH','UA2024']);
        const _npcRaces   = new Set(['Bullywug','Gnoll','Grimlock','Gith','Kuo-Toa','Skeleton','Troglodyte','Zombie']);
        const _isRace2024 = r.edition === 'one' || _pc2024srcs.has(r.source);
        r._skipPlayer = _npcRaces.has(r.name) || (
          !_isRace2024 &&
          Array.isArray(r.reprintedAs) &&
          r.reprintedAs.length > 0
        );

        // Data fixes for known errors in source data
        // EFA Changeling: Changeling Instincts should offer 5 skills but "performance" is missing
        if (r.name === 'Changeling' && r.source === 'EFA') {
          const chooseBlock = r.skillProficiencies?.[0]?.choose;
          if (chooseBlock?.from && !chooseBlock.from.includes('performance')) {
            chooseBlock.from.push('performance');
          }
        }

        return r;
      });
      // Build subrace lookup for _copy resolution
      const rawSubraces = racesData.subrace || [];
      const subraceByKey = {};
      rawSubraces.forEach(r => { subraceByKey[`${r.name}__${r.raceName}__${r.source}`] = r; });
      DndData.subraces = rawSubraces.map(r => {
        // Resolve _copy on subraces
        if (r._copy) {
          const srcKey = Object.keys(subraceByKey).find(k =>
            k.startsWith(`${r._copy.name}__`) && k.endsWith(`__${r._copy.source || r.source}`)
          ) || Object.keys(subraceByKey).find(k => k.startsWith(`${r._copy.name}__`));
          const src = srcKey ? subraceByKey[srcKey] : raceByKey[`${r._copy.name}__${r._copy.source}`];
          if (src) {
            if (!r.entries && src.entries) r.entries = src.entries;
            if (!r.darkvision && src.darkvision) r.darkvision = src.darkvision;
            if (!r.speed && src.speed) r.speed = src.speed;
            if (!r.resist && src.resist) r.resist = src.resist;
            if (!r.additionalSpells && src.additionalSpells) r.additionalSpells = src.additionalSpells;
          }
        }
        r._src = sourceName(r.source);
        r._displayName = r.raceName ? `${r.raceName} (${r.name})` : r.name;
        return r;
      });
    }

    // BACKGROUNDS (ALL)
    progress('Loading backgrounds...');
    const [bgData, bgFluffData] = await Promise.all([
      fetchJson(`${DATA_BASE}/backgrounds.json`),
      fetchJson(`${DATA_BASE}/fluff-backgrounds.json`),
    ]);
    if (bgData) {
      DndData.backgrounds = (bgData.background || []).map(b => {
        b._src = sourceName(b.source);
        return b;
      });
    }
    if (bgFluffData) {
      DndData.backgroundFluff = bgFluffData.backgroundFluff || [];
    }

    // FEATS (ALL)
    progress('Loading feats...');
    const featsData = await fetchJson(`${DATA_BASE}/feats.json`);
    if (featsData) {
      DndData.feats = (featsData.feat || []).map(f => {
        f._src = sourceName(f.source);
        f._catName = { G: 'General', O: 'Origin', FS: 'Fighting Style', EB: 'Epic Boon', OG: 'Origin', WT: 'Wild Talent' }[f.category] || f.category || '';
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

    // CHAR CREATION OPTIONS (Supernatural Gifts, Dark Gifts, Character Secrets, etc.)
    progress('Loading character options...');
    const OPTION_TYPE_NAMES = {
      'SG': 'Supernatural Gift', 'DG': 'Dark Gift',
      'CS': 'Character Secret', 'RF:B': 'Background Feature',
      'OTH': 'Other',
    };

    const charOptsData = await fetchJson(`${DATA_BASE}/charcreationoptions.json`);
    if (charOptsData) {
      const mapped = (charOptsData.charoption || []).map(opt => {
        const types = Array.isArray(opt.optionType) ? opt.optionType : [opt.optionType];
        const typeName = OPTION_TYPE_NAMES[types[0]] || types[0];
        return {
          name: opt.name,
          source: opt.source,
          _src: sourceName(opt.source),
          _typeName: typeName,
          _typeCode: types[0],
          description: entriesToHtml(opt.entries),
        };
      });
      DndData.charOptions.push(...mapped);
    }

    // UA 2024 LOCAL DATA (bundled via js/ua-data.js)
    progress('Loading UA 2024 data...');
    const uaData = window.UA2024_DATA || null;
    if (uaData) {
      // UA Species
      (uaData.race || []).forEach(r => {
        r._src = sourceName(r.source);
        r._displayName = r.name;
        DndData.races.push(r);
      });

      // UA Backgrounds
      (uaData.background || []).forEach(b => {
        b._src = sourceName(b.source);
        DndData.backgrounds.push(b);
      });

      // UA Feats
      (uaData.feat || []).forEach(f => {
        f._src = sourceName(f.source);
        f._catName = { G: 'General', O: 'Origin', FS: 'Fighting Style', EB: 'Epic Boon', OG: 'Origin', WT: 'Wild Talent' }[f.category] || f.category || '';
        DndData.feats.push(f);
      });

      // UA Spells
      (uaData.spell || []).forEach(spell => {
        spell._schoolName = SCHOOL_MAP[spell.school] || spell.school;
        spell._levelStr = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
        spell._castTime = formatCastTime(spell.time);
        spell._rangeStr = formatRange(spell.range);
        spell._durationStr = formatDuration(spell.duration);
        spell._componentsStr = formatComponents(spell.components);
        spell._src = sourceName(spell.source);
        // Only add if not already present by name
        if (!DndData.spells.some(s => s.name.toLowerCase() === spell.name.toLowerCase())) {
          DndData.spells.push(spell);
        }
      });

      // UA Classes (e.g. Psion)
      (uaData.class || []).forEach(cls => {
        cls._src = sourceName(cls.source);
        DndData.classes.push(cls);
        const key = `${cls.name} (${cls._src})`;
        const details = {
          class: cls,
          subclasses: [],
          features: (cls.entries || []).map(e => ({
            name: e.name || '',
            level: e.level || 1,
            entries: e.entries || [],
          })),
          subclassFeatures: [],
        };
        DndData.classDetails[key] = details;
        DndData.classDetails[cls.name] = details;
      });

      // UA Subclasses — merge into existing classDetails
      (uaData.subclass || []).forEach(sc => {
        sc._src = sourceName(sc.source);
        const scEntry = { name: sc.name, source: sc.source, src: sc._src };
        const keysToTry = [
          sc.className,
          `${sc.className} (${sourceName(sc.classSource)})`,
          `${sc.className} (UA 2024)`,
        ];
        // Extract named feature entries from the nested UA subclass structure,
        // stripping level prefixes like "Level 3: " so they can be looked up by clean name.
        const extractedFeatures = [];
        const shortNameForSc = sc.shortName || sc.name;
        const flattenEntries = (arr) => {
          for (const e of (arr || [])) {
            if (e && typeof e === 'object' && e.name && e.entries) {
              const levelMatch = e.name.match(/^Level\s+(\d+):/i) || e.name.match(/^(\d+)\w*\s+Level:/i);
              const featureLevel = levelMatch ? parseInt(levelMatch[1]) : null;
              const cleanName = e.name.replace(/^Level\s+\d+:\s*/i, '').replace(/^\d+\w*\s+Level:\s*/i, '').trim();
              extractedFeatures.push({ name: cleanName, entries: e.entries, level: featureLevel, subclassShortName: shortNameForSc });
              flattenEntries(e.entries);
            }
          }
        };
        flattenEntries(sc.entries);
        keysToTry.forEach(key => {
          if (DndData.classDetails[key]) {
            // Check for exact name+source match (allow same name from different sources, e.g. UA2024 vs VRGR)
            const already = DndData.classDetails[key].subclasses.some(s => s.name === sc.name && s.source === sc.source);
            if (!already) DndData.classDetails[key].subclasses.push(scEntry);
            // Merge extracted features into subclassFeatures. If an existing feature
            // has the same name but empty/placeholder entries (common in official
            // 5etools stubs), replace it with the UA version that has real text.
            const isEmptyEntries = (arr) => !Array.isArray(arr) || arr.every(e =>
              (typeof e === 'string' && !e.trim()) ||
              (e && typeof e === 'object' && Array.isArray(e.entries) && isEmptyEntries(e.entries))
            );
            for (const f of extractedFeatures) {
              const existingIdx = DndData.classDetails[key].subclassFeatures.findIndex(x => x.name === f.name);
              if (existingIdx === -1) {
                DndData.classDetails[key].subclassFeatures.push(f);
              } else if (isEmptyEntries(DndData.classDetails[key].subclassFeatures[existingIdx].entries)) {
                DndData.classDetails[key].subclassFeatures[existingIdx] = f;
              }
            }
          }
        });
      });

      // UA Char Options
      (uaData.charoption || []).forEach(opt => {
        const types = Array.isArray(opt.optionType) ? opt.optionType : [opt.optionType];
        const typeName = OPTION_TYPE_NAMES[types[0]] || types[0];
        DndData.charOptions.push({
          name: opt.name,
          source: opt.source,
          _src: opt._src || sourceName(opt.source),
          _typeName: opt._typeName || typeName,
          _typeCode: opt._typeCode || types[0],
          description: entriesToHtml(opt.entries),
          _grantsAttack: opt._grantsAttack || null,
          _requiresSpecies: opt._requiresSpecies || null,
        });
      });
    }

    DndData.charOptions.sort((a, b) => a.name.localeCompare(b.name));

    progress('Ready!');
    DndData._notifyReady();
  })();

  return DndData.loadingPromise;
}

// ---- DEDUPLICATION ----
// When same spell/item name appears in multiple sources, prefer preferredSource (string or predicate fn), else keep first found
function deduplicateByName(arr, preferredSource) {
  const isPreferred = typeof preferredSource === 'function'
    ? preferredSource
    : (src) => src === preferredSource;
  const byName = {};
  arr.forEach(item => {
    const key = item.name.toLowerCase();
    if (!byName[key]) {
      byName[key] = item;
    } else if (isPreferred(item.source) && !isPreferred(byName[key].source)) {
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
  // reqAttune: true, false, or a string like "by a spellcaster"
  item._reqAttune = item.reqAttune || false;
  // Parse "+N" bonus fields from item data (e.g. Amulet of the Devout)
  const parseBonus = (v) => {
    if (v === undefined || v === null) return 0;
    const m = String(v).match(/-?\d+/);
    return m ? parseInt(m[0]) : 0;
  };
  item._bonusSpellAttack = parseBonus(item.bonusSpellAttack);
  item._bonusSpellSaveDc = parseBonus(item.bonusSpellSaveDc);
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
  // UA classes can define their spell list explicitly via spellListNames
  const details = DndData.classDetails[className];
  if (details?.class?.spellListNames?.length) {
    const names = new Set(details.class.spellListNames.map(n => n.toLowerCase()));
    return DndData.spells.filter(s => names.has(s.name.toLowerCase()));
  }

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
      html: entriesToHtml(f.entries),
    });
  });
  return byLevel;
}

// Parse tool proficiency choices from a class's startingProficiencies.tools array.
// Returns an array of choice groups, e.g.:
//   [{ type: 'artisan', count: 1, label: "Artisan's Tools" }]
//   [{ type: 'instrument', count: 3, label: 'Musical Instrument' }]
//   [{ type: 'artisanOrInstrument', count: 1, label: "Artisan's Tools or Musical Instrument" }]
// Returns null if no player choices are required (fixed tools).
function _parseClassToolProfChoices(toolsArr) {
  if (!toolsArr?.length) return null;
  const groups = [];

  for (const entry of toolsArr) {
    // Handle plain-text string format: e.g. "Choose one type of {@item Artisan's Tools|XPHB} or {@item Musical Instrument|XPHB}"
    if (typeof entry === 'string') {
      const text = entry;
      // Extract count word
      const countMatch = text.match(/choose\s+(one|two|three|four|\d+)/i);
      const WORD_TO_N = { one: 1, two: 2, three: 3, four: 4 };
      const n = countMatch ? (WORD_TO_N[countMatch[1].toLowerCase()] || parseInt(countMatch[1]) || 1) : 1;

      const hasArtisan = /artisan/i.test(text);
      const hasInstrument = /musical instrument/i.test(text);

      if (hasArtisan && hasInstrument) {
        groups.push({ type: 'artisanOrInstrument', count: n, label: "Artisan's Tools or Musical Instrument" });
      } else if (hasArtisan) {
        groups.push({ type: 'artisan', count: n, label: "Artisan's Tools" });
      } else if (hasInstrument) {
        groups.push({ type: 'instrument', count: n, label: 'Musical Instrument' });
      }
      continue;
    }

    if (typeof entry !== 'object') continue;

    for (const [rawKey, val] of Object.entries(entry)) {
      const key = rawKey.split('|')[0];
      const count = typeof val === 'number' ? val : (val?.count || 1);

      if (key === 'anyArtisansTool') {
        groups.push({ type: 'artisan', count, label: "Artisan's Tools" });
      } else if (key === 'anyMusicalInstrument') {
        groups.push({ type: 'instrument', count, label: 'Musical Instrument' });
      } else if (key === 'anyTool') {
        groups.push({ type: 'artisanOrInstrument', count, label: "Artisan's Tools or Musical Instrument" });
      } else if (key === 'choose' && typeof val === 'object') {
        const n = val.count || 1;
        const from = val.from || val.fromType || [];
        const hasArtisan = from.some(f => /artisan/i.test(String(f)));
        const hasInstrument = from.some(f => /musical|instrument|INS/i.test(String(f)));
        if (hasArtisan && hasInstrument) {
          groups.push({ type: 'artisanOrInstrument', count: n, label: "Artisan's Tools or Musical Instrument" });
        } else if (hasArtisan) {
          groups.push({ type: 'artisan', count: n, label: "Artisan's Tools" });
        } else if (hasInstrument) {
          groups.push({ type: 'instrument', count: n, label: 'Musical Instrument' });
        } else if (from.length) {
          groups.push({ type: 'list', count: n, from: from.map(f => String(f).split('|')[0]), label: 'Tool' });
        }
      }
    }
  }

  return groups.length ? groups : null;
}

const ALL_SKILL_KEYS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

function _parseSkillChoices(skillsArr) {
  if (!skillsArr?.length) return null;
  const entry = skillsArr[0];
  // Standard format: { choose: { from: [...], count: N } }
  if (entry.choose) {
    const choose = entry.choose;
    // Handle "any" skill choice: from may be absent or contain "any"
    if (!choose.from || (choose.from.length === 1 && choose.from[0] === 'any') || choose.from.length === 0) {
      return { from: ALL_SKILL_KEYS, count: choose.count || 2 };
    }
    return choose;
  }
  // Alternative format: { any: N } — choose any N skills
  if (entry.any) {
    return { from: ALL_SKILL_KEYS, count: typeof entry.any === 'number' ? entry.any : 2 };
  }
  return null;
}

function getClassInfo(className) {
  const details = DndData.classDetails[className];
  if (!details) return null;
  const cls = details.class;
  // Detect Expertise granted at level 1 (Rogue, Bard in 2024)
  const expertiseFeature = details.features.find(f => f.level === 1 && f.name === 'Expertise');
  // Detect Fighting Style feature (Fighter, Ranger, Paladin)
  const fightingStyleFeature = details.features.find(f => /fighting style/i.test(f.name));
  const fightingStyleLevel = fightingStyleFeature ? (fightingStyleFeature.level || 1) : 0;
  // Detect Weapon Mastery feature (Barbarian, Fighter, Paladin, Ranger, Rogue in 2024)
  const weaponMasteryFeature = details.features.find(f => /weapon mastery/i.test(f.name) && (f.level || 1) === 1);
  const weaponMasteryCount = weaponMasteryFeature ? (weaponMasteryFeature._masteryCount || 2) : 0;
  // Cantrips known at level 1
  const cantripCount = cls.cantripProgression?.[0] ?? null;
  // Full cantrip progression array (indexed by level-1)
  const cantripProgression = cls.cantripProgression || null;
  // Prepared spells at level 1: fixed number from spellsKnown, or a formula string for prepared casters
  const spellsKnownAtL1 = cls.spellsKnown?.[0] ?? null;
  const spellsKnownProgression = cls.spellsKnown || null;
  const preparedSpellsFormula = cls.preparedSpells || null;
  // Prepared spells progression (indexed by level-1) — some classes have this instead of formula
  const preparedSpellsProgression = cls.preparedSpellsProgression || null;

  // Spellbook caster detection (Wizard): starts with 6 spells, gains 2 per level
  // Check feature name, feature entries text, and class name as fallback
  const isSpellbookCaster = className.toLowerCase() === 'wizard'
    || details.features.some(f => f.level === 1 && (
      /\bspellbook\b/i.test(f.name || '')
      || (f.entries || []).some(e => typeof e === 'string' ? /\bspellbook\b/i.test(e) : /\bspellbook\b/i.test(JSON.stringify(e)))
    ));
  const spellbookSpellsAtL1 = isSpellbookCaster ? 6 : null;
  const spellbookSpellsPerLevel = isSpellbookCaster ? 2 : null;

  // Spell slot progression — standard full/half/third/pact caster tables
  const casterProgression = cls.casterProgression || null;

  const toolProfChoices = _parseClassToolProfChoices(cls.startingProficiencies?.tools);

  // Extract fixed (non-choice) tool proficiencies, e.g. Rogue's Thieves' Tools
  // Uses toolProficiencies (not tools) — tools is display strings, toolProficiencies has the actual data
  const fixedToolProf = [];
  (cls.startingProficiencies?.toolProficiencies || []).forEach(entry => {
    if (typeof entry !== 'object') return;
    Object.entries(entry).forEach(([rawKey, val]) => {
      const key = rawKey.split('|')[0];
      if (key === 'anyArtisansTool' || key === 'anyMusicalInstrument' || key === 'anyTool' || key === 'choose') return;
      if (val === true) fixedToolProf.push(key.replace(/\b\w/g, c => c.toUpperCase()));
    });
  });

  return {
    name: cls.name,
    source: cls.source,
    src: cls._src,
    hitDie: cls.hd ? `d${cls.hd.faces}` : '',
    hitDieFaces: cls.hd?.faces || 8,
    savingThrows: cls.proficiency || [],
    armorProf: cls.startingProficiencies?.armor || [],
    weaponProf: cls.startingProficiencies?.weapons || [],
    skillChoices: _parseSkillChoices(cls.startingProficiencies?.skills),
    toolProfChoices,
    fixedToolProf,
    expertiseCount: expertiseFeature ? 2 : 0,
    fightingStyleLevel,
    weaponMasteryCount,
    subclasses: details.subclasses.map(sc => ({ name: sc.name, source: sc.source, src: sourceName(sc.source) })),
    primaryAbility: cls.primaryAbility || [],
    startingEquipment: cls.startingEquipment || null,
    cantripCount,
    cantripProgression,
    cantripSwapAllowed: cantripProgression != null && ['Sorcerer','Bard','Warlock','Wizard','Psion'].includes(className),
    spellsKnownAtL1,
    spellsKnownProgression,
    preparedSpellsFormula,
    preparedSpellsProgression,
    spellcastingAbility: cls.spellcastingAbility || null,
    spellbookSpellsAtL1,
    spellbookSpellsPerLevel,
    casterProgression,
  };
}

// Standard spell slot tables by caster progression type
const SPELL_SLOT_TABLE = {
  full: [
    // lvl:  1st 2nd 3rd 4th 5th 6th 7th 8th 9th
    /* 1 */ [2, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 2 */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 3 */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 4 */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
    /* 5 */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
    /* 6 */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
    /* 7 */ [4, 3, 3, 1, 0, 0, 0, 0, 0],
    /* 8 */ [4, 3, 3, 2, 0, 0, 0, 0, 0],
    /* 9 */ [4, 3, 3, 3, 1, 0, 0, 0, 0],
    /*10 */ [4, 3, 3, 3, 2, 0, 0, 0, 0],
    /*11 */ [4, 3, 3, 3, 2, 1, 0, 0, 0],
    /*12 */ [4, 3, 3, 3, 2, 1, 0, 0, 0],
    /*13 */ [4, 3, 3, 3, 2, 1, 1, 0, 0],
    /*14 */ [4, 3, 3, 3, 2, 1, 1, 0, 0],
    /*15 */ [4, 3, 3, 3, 2, 1, 1, 1, 0],
    /*16 */ [4, 3, 3, 3, 2, 1, 1, 1, 0],
    /*17 */ [4, 3, 3, 3, 2, 1, 1, 1, 1],
    /*18 */ [4, 3, 3, 3, 3, 1, 1, 1, 1],
    /*19 */ [4, 3, 3, 3, 3, 2, 1, 1, 1],
    /*20 */ [4, 3, 3, 3, 3, 2, 2, 1, 1],
  ],
  half: [
    /* 1 */ [0, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 2 */ [2, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 3 */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 4 */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 5 */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 6 */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 7 */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
    /* 8 */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
    /* 9 */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
    /*10 */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
    /*11 */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
    /*12 */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
    /*13 */ [4, 3, 3, 1, 0, 0, 0, 0, 0],
    /*14 */ [4, 3, 3, 1, 0, 0, 0, 0, 0],
    /*15 */ [4, 3, 3, 2, 0, 0, 0, 0, 0],
    /*16 */ [4, 3, 3, 2, 0, 0, 0, 0, 0],
    /*17 */ [4, 3, 3, 3, 1, 0, 0, 0, 0],
    /*18 */ [4, 3, 3, 3, 1, 0, 0, 0, 0],
    /*19 */ [4, 3, 3, 3, 2, 0, 0, 0, 0],
    /*20 */ [4, 3, 3, 3, 2, 0, 0, 0, 0],
  ],
  third: [
    /* 1 */ [0, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 2 */ [0, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 3 */ [2, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 4 */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 5 */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 6 */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 7 */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 8 */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 9 */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
    /*10 */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
    /*11 */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
    /*12 */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
    /*13 */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
    /*14 */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
    /*15 */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
    /*16 */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
    /*17 */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
    /*18 */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
    /*19 */ [4, 3, 3, 1, 0, 0, 0, 0, 0],
    /*20 */ [4, 3, 3, 1, 0, 0, 0, 0, 0],
  ],
  pact: [
    /* 1 */ [1, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 2 */ [2, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 3 */ [0, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 4 */ [0, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 5 */ [0, 0, 2, 0, 0, 0, 0, 0, 0],
    /* 6 */ [0, 0, 2, 0, 0, 0, 0, 0, 0],
    /* 7 */ [0, 0, 0, 2, 0, 0, 0, 0, 0],
    /* 8 */ [0, 0, 0, 2, 0, 0, 0, 0, 0],
    /* 9 */ [0, 0, 0, 0, 2, 0, 0, 0, 0],
    /*10 */ [0, 0, 0, 0, 2, 0, 0, 0, 0],
    /*11 */ [0, 0, 0, 0, 0, 3, 0, 0, 0],
    /*12 */ [0, 0, 0, 0, 0, 3, 0, 0, 0],
    /*13 */ [0, 0, 0, 0, 0, 3, 0, 0, 0],
    /*14 */ [0, 0, 0, 0, 0, 3, 0, 0, 0],
    /*15 */ [0, 0, 0, 0, 0, 3, 0, 0, 0],
    /*16 */ [0, 0, 0, 0, 0, 3, 0, 0, 0],
    /*17 */ [0, 0, 0, 0, 0, 4, 0, 0, 0],
    /*18 */ [0, 0, 0, 0, 0, 4, 0, 0, 0],
    /*19 */ [0, 0, 0, 0, 0, 4, 0, 0, 0],
    /*20 */ [0, 0, 0, 0, 0, 4, 0, 0, 0],
  ],
  // Artificer / 2024 Paladin progression: half-caster that gains slots at level 1
  artificer: [
    /* 1 */ [2, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 2 */ [2, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 3 */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 4 */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
    /* 5 */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 6 */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
    /* 7 */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
    /* 8 */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
    /* 9 */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
    /*10 */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
    /*11 */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
    /*12 */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
    /*13 */ [4, 3, 3, 1, 0, 0, 0, 0, 0],
    /*14 */ [4, 3, 3, 1, 0, 0, 0, 0, 0],
    /*15 */ [4, 3, 3, 2, 0, 0, 0, 0, 0],
    /*16 */ [4, 3, 3, 2, 0, 0, 0, 0, 0],
    /*17 */ [4, 3, 3, 3, 1, 0, 0, 0, 0],
    /*18 */ [4, 3, 3, 3, 1, 0, 0, 0, 0],
    /*19 */ [4, 3, 3, 3, 2, 0, 0, 0, 0],
    /*20 */ [4, 3, 3, 3, 2, 0, 0, 0, 0],
  ],
};

/** Get spell slots for a class at a given level. Returns array of 9 values (1st-9th). */
function getSpellSlots(className, level) {
  const info = getClassInfo(className);
  if (!info) return [0,0,0,0,0,0,0,0,0];
  const prog = info.casterProgression;
  if (!prog) return [0,0,0,0,0,0,0,0,0];
  const table = SPELL_SLOT_TABLE[prog];
  if (!table) return [0,0,0,0,0,0,0,0,0];
  return table[Math.min(level, 20) - 1] || [0,0,0,0,0,0,0,0,0];
}

/** Get the max spell level a class can cast at a given character level. */
function getMaxSpellLevel(className, level) {
  const slots = getSpellSlots(className, level);
  for (let i = 8; i >= 0; i--) {
    if (slots[i] > 0) return i + 1;
  }
  return 0;
}

/** Returns a sorted list of Simple and Martial Melee weapons available for Weapon Mastery selection. */
function getMeleeWeaponsForMastery() {
  return getWeaponsForMastery(false);
}

/** Returns weapons for Mastery. If includeRanged is true, includes ranged weapons too. */
function getWeaponsForMastery(includeRanged) {
  const SIMPLE_MELEE = [
    'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer',
    'Mace', 'Quarterstaff', 'Sickle', 'Spear',
  ];
  const MARTIAL_MELEE = [
    'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd',
    'Lance', 'Longsword', 'Maul', 'Morningstar', 'Pike', 'Rapier',
    'Scimitar', 'Shortsword', 'Trident', 'War Pick', 'Warhammer', 'Whip',
  ];
  const SIMPLE_RANGED = ['Light Crossbow', 'Shortbow', 'Sling', 'Dart'];
  const MARTIAL_RANGED = ['Blowgun', 'Hand Crossbow', 'Heavy Crossbow', 'Longbow', 'Musket', 'Net'];
  const result = [
    ...SIMPLE_MELEE.map(n => ({ name: n, category: 'Simple Melee' })),
    ...MARTIAL_MELEE.map(n => ({ name: n, category: 'Martial Melee' })),
  ];
  if (includeRanged) {
    result.push(
      ...SIMPLE_RANGED.map(n => ({ name: n, category: 'Simple Ranged' })),
      ...MARTIAL_RANGED.map(n => ({ name: n, category: 'Martial Ranged' })),
    );
  }
  return result;
}

/**
 * Returns the weapons available for Weapon Mastery selection for a given class,
 * filtered to only weapons the class has proficiency with.
 */
function getMasteryWeaponsForClass(className) {
  const SIMPLE_MELEE = [
    'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer',
    'Mace', 'Quarterstaff', 'Sickle', 'Spear',
  ];
  const MARTIAL_MELEE = [
    'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd',
    'Lance', 'Longsword', 'Maul', 'Morningstar', 'Pike', 'Rapier',
    'Scimitar', 'Shortsword', 'Trident', 'War Pick', 'Warhammer', 'Whip',
  ];
  const SIMPLE_RANGED = ['Light Crossbow', 'Shortbow', 'Sling', 'Dart'];
  const MARTIAL_RANGED = ['Blowgun', 'Hand Crossbow', 'Heavy Crossbow', 'Longbow', 'Musket', 'Net'];

  // Martial melee weapons with Finesse or Light property (Rogue proficiency)
  const MARTIAL_FINESSE_OR_LIGHT = ['Rapier', 'Scimitar', 'Shortsword', 'Whip'];

  switch (className) {
    case 'Rogue':
      // Simple weapons + Martial weapons with Finesse or Light
      return [
        ...SIMPLE_MELEE.map(n => ({ name: n, category: 'Simple Melee' })),
        ...MARTIAL_FINESSE_OR_LIGHT.map(n => ({ name: n, category: 'Martial Melee' })),
        ...SIMPLE_RANGED.map(n => ({ name: n, category: 'Simple Ranged' })),
      ];
    case 'Barbarian':
      // Simple and Martial weapons
      return [
        ...SIMPLE_MELEE.map(n => ({ name: n, category: 'Simple Melee' })),
        ...MARTIAL_MELEE.map(n => ({ name: n, category: 'Martial Melee' })),
      ];
    case 'Fighter':
    case 'Paladin':
      // Simple and Martial weapons (all)
      return [
        ...SIMPLE_MELEE.map(n => ({ name: n, category: 'Simple Melee' })),
        ...MARTIAL_MELEE.map(n => ({ name: n, category: 'Martial Melee' })),
        ...SIMPLE_RANGED.map(n => ({ name: n, category: 'Simple Ranged' })),
        ...MARTIAL_RANGED.map(n => ({ name: n, category: 'Martial Ranged' })),
      ];
    case 'Ranger':
      // Simple and Martial weapons (all)
      return [
        ...SIMPLE_MELEE.map(n => ({ name: n, category: 'Simple Melee' })),
        ...MARTIAL_MELEE.map(n => ({ name: n, category: 'Martial Melee' })),
        ...SIMPLE_RANGED.map(n => ({ name: n, category: 'Simple Ranged' })),
        ...MARTIAL_RANGED.map(n => ({ name: n, category: 'Martial Ranged' })),
      ];
    default:
      // Fallback: all melee weapons
      return [
        ...SIMPLE_MELEE.map(n => ({ name: n, category: 'Simple Melee' })),
        ...MARTIAL_MELEE.map(n => ({ name: n, category: 'Martial Melee' })),
      ];
  }
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
    // Handle "Name — Source 2014 (RAWCODE)" — raw source code is the definitive lookup key
    const mRaw = name.match(/^(.+?)\s+—\s+.+?\s+\(([^)]+)\)$/);
    if (mRaw) race = DndData.races.find(r => r.name === mRaw[1] && r.source === mRaw[2]);
    if (!race) {
      // Handle "Name — Source 2014" or "Name — Source '24" — strip trailing year before matching _src
      const mYear = name.match(/^(.+?)\s+—\s+(.+?)\s+(?:20\d{2}|'\d{2})$/);
      if (mYear) race = DndData.races.find(r => r.name === mYear[1] && r._src === mYear[2]);
      // Also try plain "Name — Source" without any year
      if (!race) {
        const mPlain = name.match(/^(.+?)\s+—\s+(.+)$/);
        if (mPlain) race = DndData.races.find(r => r.name === mPlain[1] && r._src === mPlain[2]);
      }
    }
  }
  if (!race) {
    // Check subraces / display names
    race = DndData.races.find(r => r._displayName === name);
  }
  if (!race) return null;

  let subraces = DndData.subraces.filter(sr => sr.raceName === race.name && sr.raceSource === race.source);

  // If no subraces but _versions exist, treat versions as lineage choices.
  // Skip versions that are optional-feature variants (name starts with "Variant") —
  // those correspond to inset sidebars (like Gift of the Aetherborn) and aren't real lineages.
  const _realVersions = (race._versions || []).filter(v => {
    if (/^variant\b/i.test(v.name || '')) return false;
    // Skip versions with no stat differences and no meaningful entries — they'd show a blank picker
    const hasStat = v.darkvision || v.speed || v.resist?.length || v.additionalSpells?.length
      || v.ability?.length || v.skillProficiencies?.length;
    const hasMod = v._mod && Object.keys(v._mod).length > 0;
    return hasStat || hasMod;
  });
  // Handle _abstract/_implementations pattern (e.g. XPHB Dragonborn).
  // _versions contains one entry with _abstract (name template using {{var}})
  // and _implementations (the 10 concrete color variants with their resist values).
  if (subraces.length === 0) {
    for (const v of (race._versions || [])) {
      if (!v._abstract || !Array.isArray(v._implementations)) continue;
      const nameTemplate = v._abstract.name || race.name;
      v._implementations.forEach(impl => {
        const vars = impl._variables || {};
        const srName = nameTemplate.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || k);
        subraces.push({
          name: srName,
          source: race.source,
          _src: race._src,
          darkvision: impl.darkvision || 0,
          speed: impl.speed || null,
          resist: Array.isArray(impl.resist) ? impl.resist : [],
          additionalSpells: null,
          entries: [],
        });
      });
    }
  }

  if (subraces.length === 0 && _realVersions.length > 0) {
    subraces = _realVersions.map(v => {
      // Step 1: extract entries from _mod operations
      const mods = Array.isArray(v._mod?.entries)
        ? v._mod.entries
        : (v._mod?.entries ? [v._mod.entries] : []);
      const entries = mods.flatMap(mod => {
        if (mod.mode === 'prependArr' || mod.mode === 'appendArr')
          return Array.isArray(mod.items) ? mod.items : [mod.items];
        if (mod.mode === 'replaceArr' && mod.items) {
          const item = mod.items;
          return item.entries ? (Array.isArray(item.entries) ? item.entries : [item.entries]) : [item];
        }
        return [];
      });

      // Step 2: find the default cantrip from the entries text
      // e.g. "You know the {@spell Thorn Whip|XPHB} cantrip" → "thorn whip"
      const entryText = entries.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(' ');
      const cantripMatch = entryText.match(/\{@spell ([^|}]+)\|/i);
      const defaultCantrip = cantripMatch ? cantripMatch[1].trim().toLowerCase() : null;

      // Step 3: process additionalSpells — replace any {choose} cantrip with the default
      const rawSpells = v.additionalSpells;
      const additionalSpells = (() => {
        if (!rawSpells) return null;
        const arr = Array.isArray(rawSpells) ? rawSpells : [rawSpells];
        if (!defaultCantrip) return arr;
        return arr.map(block => {
          const k1 = block.known?.['1'];
          if (!Array.isArray(k1)) return block;
          const replaced = k1.map(s =>
            (s && typeof s === 'object' && s.choose) ? defaultCantrip : s
          );
          return { ...block, known: { ...block.known, '1': replaced } };
        });
      })();

      // Build a display name: use v.name directly, or derive from _variables
      // e.g. Dragonborn versions have no name but have _variables.color → "Dragonborn (Black)"
      const srName = v.name
        || (v._variables?.color ? `${race.name} (${v._variables.color})` : null);
      if (!srName) return null; // skip versions with no identifiable name

      return {
        name: srName,
        source: race.source,
        _src: race._src,
        darkvision: v.darkvision || 0,
        speed: v.speed || null,
        resist: v.resist || [],
        additionalSpells,
        entries,
      };
    }).filter(Boolean);
  }

  const flySpeed = typeof race.speed === 'object' && race.speed.fly
    ? (race.speed.fly === true ? (typeof race.speed === 'number' ? race.speed : (race.speed?.walk || 30)) : race.speed.fly)
    : 0;
  const swimSpeed = typeof race.speed === 'object' && race.speed.swim
    ? (race.speed.swim === true ? (typeof race.speed === 'number' ? race.speed : (race.speed?.walk || 30)) : race.speed.swim)
    : 0;

  return {
    name: race.name,
    source: race.source,
    src: race._src,
    size: (race.size || ['M']).map(s => ({ S: 'Small', M: 'Medium', L: 'Large', T: 'Tiny', H: 'Huge', G: 'Gargantuan' }[s] || s)).join(' or '),
    sizes: (race.size || ['M']).map(s => ({ S: 'Small', M: 'Medium', L: 'Large', T: 'Tiny', H: 'Huge', G: 'Gargantuan' }[s] || s)),
    speed: typeof race.speed === 'number' ? race.speed : (race.speed?.walk || 30),
    flySpeed,
    swimSpeed,
    darkvision: race.darkvision || 0,
    traits: entriesToText(race.entries),
    traitsHtml: entriesToHtml(race.entries),
    traitsRaw: race.entries || [],
    resist: race.resist || [],
    languageProf: race.languageProficiencies || [],
    skillProficiencies: race.skillProficiencies || [],
    abilityBonus: formatAbilityBonus(race),
    subraces,
    hasLineage: !!race.lineage,
    additionalSpells: race.additionalSpells || [],
  };
}

// Parse racial additionalSpells into a simple { cantrips, level3, level5 } structure.
// subraceName is used to select the right entry when additionalSpells entries have a "name" field.
function parseRacialSpells(additionalSpells, subraceName, subraceEntries, chosenBlockIndex) {
  const cleanSpellName = s => stripTags(s.replace(/#[a-z]$/i, '').replace(/\|[^|]*/g, '').trim());

  const result = { cantrips: [], level3: [], level5: [], ability: null, abilityChoices: null, cantripChoices: null };
  if (!additionalSpells?.length) return result;

  // Detect multi-block cantrip choice: multiple unnamed blocks each with a single known.1 cantrip
  const isMultiChoice = additionalSpells.length > 1 && additionalSpells.every(b => {
    if (b.name) return false;
    const k1 = b.known?.['1'];
    const k1arr = Array.isArray(k1) ? k1 : (k1?._ ? (Array.isArray(k1._) ? k1._ : [k1._]) : null);
    return k1arr && k1arr.length === 1 && typeof k1arr[0] === 'string' && !b.innate;
  });

  if (isMultiChoice) {
    // Extract the cantrip name from each block for the choice UI
    result.cantripChoices = additionalSpells.map(b => {
      const k1 = b.known['1'];
      const spell = Array.isArray(k1) ? k1[0] : k1;
      return cleanSpellName(spell);
    });
  }

  // Find the matching spell block
  let block;
  if (isMultiChoice && chosenBlockIndex != null && additionalSpells[chosenBlockIndex]) {
    block = additionalSpells[chosenBlockIndex];
  } else {
    block = additionalSpells.find(b => !b.name || b.name === subraceName)
      || additionalSpells[0];
  }
  if (!block) return result;

  // Spellcasting ability
  if (block.ability) {
    if (typeof block.ability === 'string') result.ability = block.ability;
    else if (block.ability.choose) {
      const ch = block.ability.choose;
      // Handle both formats: ["int","wis","cha"] or {from: ["int","wis","cha"]}
      result.abilityChoices = Array.isArray(ch) ? ch : (ch.from || []);
    }
  }

  // Cantrips / always-known spells (known.1)
  // known['1'] can be a plain array OR { "_": [...] } (5etools class-independent known format)
  const known1raw = block.known?.['1'];
  const known1 = Array.isArray(known1raw) ? known1raw
    : (known1raw?._ ? (Array.isArray(known1raw._) ? known1raw._ : [known1raw._]) : null);
  if (known1) {
    known1.forEach(s => {
      if (typeof s === 'string') {
        result.cantrips.push(cleanSpellName(s));
      } else if (s && typeof s === 'object' && s.choose) {
        // Free-choice cantrip — find the default from the subrace entries text
        // e.g. "You know the {@spell Thorn Whip|XPHB} cantrip" → "thorn whip"
        const entriesText = (subraceEntries || []).map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(' ');
        const m = entriesText.match(/\{@spell ([^|}]+)\|/i);
        if (m) result.cantrips.push(m[1].trim().toLowerCase());
      }
    });
  }

  // Innate spells by level
  const innate = block.innate || {};
  Object.entries(innate).forEach(([lvl, data]) => {
    // Collect all innate spells regardless of daily key (1, pb, 2, etc.) or at-will
    const spells = [...Object.values(data.daily || {}).flat(), ...(data.will || [])];
    spells.forEach(s => {
      if (typeof s !== 'string') return;
      const name = cleanSpellName(s);
      if (parseInt(lvl) <= 3) result.level3.push(name);
      else result.level5.push(name);
    });
  });

  // Deduplicate spell lists (some species data yields the same cantrip via multiple paths)
  result.cantrips = [...new Set(result.cantrips)];
  result.level3  = [...new Set(result.level3)];
  result.level5  = [...new Set(result.level5)];

  return result;
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

function _extractSuggestedCharacteristics(entries) {
  const result = { traits: [], ideals: [], bonds: [], flaws: [] };
  const findTables = (arr) => {
    for (const e of (arr || [])) {
      if (!e || typeof e !== 'object') continue;
      if (e.type === 'table' && Array.isArray(e.colLabels)) {
        const label = (e.colLabels[1] || e.colLabels[0] || '').toLowerCase();
        const rows = (e.rows || []).map(r => stripTags(String(r[1] || r[0] || ''))).filter(Boolean);
        if (label.includes('personality') || label.includes('trait')) result.traits = rows;
        else if (label.includes('ideal')) result.ideals = rows;
        else if (label.includes('bond')) result.bonds = rows;
        else if (label.includes('flaw')) result.flaws = rows;
      }
      if (e.entries) findTables(e.entries);
    }
  };
  findTables(entries);
  return result;
}

// Parse a 5etools background feat key like "magic initiate; cleric|xphb"
// into { name: "Magic Initiate", classHint: "Cleric" }
function parseBgFeatKey(raw) {
  if (!raw) return { name: '', classHint: null };
  const withoutSource = raw.split('|')[0].trim();
  const parts = withoutSource.split(';').map(s => s.trim());
  const capitalize = s => s.replace(/\b\w/g, c => c.toUpperCase());
  return { name: capitalize(parts[0]), classHint: parts[1] ? capitalize(parts[1]) : null };
}

function getBackgroundInfo(name) {
  // Support "Name — Source" format for disambiguating duplicates
  let bg = DndData.backgrounds.find(b => b.name === name);
  if (!bg) {
    const m = name.match(/^(.+?)\s+—\s+(.+)$/);
    if (m) bg = DndData.backgrounds.find(b => b.name === m[1] && b._src === m[2]);
  }
  if (!bg) return null;
  const featRaw = bg.feats?.[0] || null;
  const featKey = featRaw ? Object.keys(featRaw)[0] : null;
  const featParsed = featKey ? parseBgFeatKey(featKey) : null;
  return {
    name: bg.name,
    source: bg.source,
    src: bg._src,
    skillProf: bg.skillProficiencies?.[0] || {},
    toolProf: bg.toolProficiencies?.[0] || {},
    feat: featRaw,
    featName: featParsed?.name || null,
    featClassHint: featParsed?.classHint || null,
    ability: bg.ability || null,
    description: entriesToText(bg.entries),
    descriptionHtml: entriesToHtml(bg.entries),
    startingEquipment: bg.startingEquipment || null,
    languageProf: bg.languageProficiencies?.[0] || {},
    suggestedCharacteristics: _extractSuggestedCharacteristics(bg.entries),
  };
}

// Parse a languageProficiencies entry into { fixed: string[], chooseCount: number }
function parseLanguageProf(langProf) {
  const LANG_NAMES = {
    common: 'Common', dwarvish: 'Dwarvish', elvish: 'Elvish', giant: 'Giant',
    gnomish: 'Gnomish', goblin: 'Goblin', halfling: 'Halfling', orc: 'Orc',
    abyssal: 'Abyssal', celestial: 'Celestial', draconic: 'Draconic',
    deepSpeech: 'Deep Speech', infernal: 'Infernal', primordial: 'Primordial',
    sylvan: 'Sylvan', undercommon: 'Undercommon', thieves: "Thieves' Cant",
    druidic: 'Druidic', gith: 'Gith', minotaur: 'Minotaur', leonin: 'Leonin',
    loxodon: 'Loxodon', vedalken: 'Vedalken', aarakocra: 'Aarakocra',
  };
  const fixed = [];
  let chooseCount = 0;
  for (const [key, val] of Object.entries(langProf || {})) {
    if (key === 'anyStandard' || key === 'any') { chooseCount += (typeof val === 'number' ? val : 1); continue; }
    if (key === 'choose') { chooseCount += val?.count || 1; continue; }
    if (val === true) fixed.push(LANG_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1));
  }
  return { fixed, chooseCount };
}

const STANDARD_LANGUAGES = [
  'Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc',
  'Abyssal', 'Celestial', 'Draconic', 'Deep Speech', 'Infernal',
  'Primordial (Aquan)', 'Primordial (Auran)', 'Primordial (Ignan)', 'Primordial (Terran)',
  'Sylvan', 'Undercommon',
];

function getFeatInfo(name, src) {
  const lower = (name || '').toLowerCase();
  const matches = DndData.feats.filter(f => f.name.toLowerCase() === lower);
  if (!matches.length) return null;
  // If a source was specified, prefer that exact match
  let feat = src ? (matches.find(f => f._src === src) || matches[0]) : null;
  // Otherwise prefer 2024 sources (XPHB first, then any 2024 source)
  if (!feat) {
    feat = matches.find(f => f.source === 'XPHB')
      || matches.find(f => typeof is2024Source === 'function' && is2024Source(f.source))
      || matches[0];
  }
  if (!feat) return null;
  return {
    name: feat.name,
    source: feat.source,
    src: feat._src,
    category: feat._catName,
    prerequisite: feat.prerequisite || [],
    description: entriesToHtml(feat.entries),
    ability: feat.ability || [],
  };
}

function getFightingStyles() {
  if (!DndData.feats) return [];
  const ua     = typeof isUAEnabled  === 'function' ? isUAEnabled()  : true;
  const show24 = typeof is2024Enabled === 'function' ? is2024Enabled() : true;
  const show14 = typeof is2014Enabled === 'function' ? is2014Enabled() : false;
  return DndData.feats.filter(f => {
    if (f.category !== 'FS') return false;
    if (f.source === 'UA2024') return ua && show24;
    if (typeof is2024Source === 'function' && is2024Source(f.source)) return show24;
    return show14;
  });
}

function getCharOptionInfo(name) {
  const opt = DndData.charOptions.find(o => o.name === name);
  if (!opt) return null;
  return {
    name: opt.name,
    source: opt.source,
    src: opt._src,
    typeName: opt._typeName,
    typeCode: opt._typeCode,
    description: opt.description,
  };
}
