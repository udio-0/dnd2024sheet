/* =============================================
   MULTI-CHARACTER STORAGE
   ============================================= */
'use strict';

window.CharStore = {
  INDEX_KEY: 'dnd_characters_index',
  CHAR_PREFIX: 'dnd_char_',
  OLD_KEY: 'dnd2024_char_v2',

  activeId: null,
  activeData: {},

  // ---- UNDO / REDO ----
  _undoStack: [],
  _redoStack: [],
  _MAX_UNDO: 50,
  _skipSnapshot: false,
  _pendingSnapshot: null,
  _snapshotTimer: null,

  _snapshot() {
    if (this._skipSnapshot || !this.activeId) return;
    // Capture current state before this change if we haven't already
    if (!this._pendingSnapshot) {
      this._pendingSnapshot = JSON.stringify(this.activeData);
    }
    // Debounce: commit the snapshot after 800ms of no changes
    clearTimeout(this._snapshotTimer);
    this._snapshotTimer = setTimeout(() => {
      if (this._pendingSnapshot) {
        this._undoStack.push(this._pendingSnapshot);
        if (this._undoStack.length > this._MAX_UNDO) this._undoStack.shift();
        this._redoStack = [];
        this._pendingSnapshot = null;
        this._updateUndoButtons();
      }
    }, 800);
  },

  undo() {
    if (!this._undoStack.length || !this.activeId) return;
    this._redoStack.push(JSON.stringify(this.activeData));
    const prev = JSON.parse(this._undoStack.pop());
    this._skipSnapshot = true;
    this.activeData = prev;
    this.saveCharacter(this.activeId, this.activeData);
    this._skipSnapshot = false;
    this._updateUndoButtons();
    this._refreshSheet();
  },

  redo() {
    if (!this._redoStack.length || !this.activeId) return;
    this._undoStack.push(JSON.stringify(this.activeData));
    const next = JSON.parse(this._redoStack.pop());
    this._skipSnapshot = true;
    this.activeData = next;
    this.saveCharacter(this.activeId, this.activeData);
    this._skipSnapshot = false;
    this._updateUndoButtons();
    this._refreshSheet();
  },

  _updateUndoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = !this._undoStack.length;
    if (redoBtn) redoBtn.disabled = !this._redoStack.length;
  },

  _refreshSheet() {
    // Re-render the entire sheet with the restored data
    if (typeof Sheet !== 'undefined' && this.activeId) {
      // Restore all data-save fields
      document.querySelectorAll('[data-save]').forEach(el => {
        const key = el.dataset.save;
        const val = this.activeData[key];
        if (el.type === 'checkbox') el.checked = !!val;
        else if (val !== undefined && val !== null) el.value = val;
        else el.value = '';
      });
      // Update level display
      const display = document.getElementById('charLevel-display');
      if (display) display.textContent = this.activeData.charLevel || 1;
      // Recalculate everything
      Sheet.recalcAll();
      Sheet.renderFeats();
      Sheet.restoreSpells();
      Sheet.restoreInventory();
      if (typeof Sheet.restoreCharOptions === 'function') Sheet.restoreCharOptions();
      const className = this.activeData.charClass;
      if (className) Sheet.displayClassFeatures(className);
      const titleEl = document.getElementById('topbar-title');
      if (titleEl) titleEl.textContent = this.activeData.charName || 'Character Sheet';
    }
  },

  initUndo() {
    document.getElementById('btn-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.redo());
  },

  // ---- INDEX ----
  getIndex() {
    try {
      return JSON.parse(localStorage.getItem(this.INDEX_KEY)) || { version: 2, characters: [], lastOpenedId: null };
    } catch { return { version: 2, characters: [], lastOpenedId: null }; }
  },

  saveIndex(index) {
    localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
  },

  generateId() {
    return 'char_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  },

  // ---- CRUD ----
  listCharacters() {
    return this.getIndex().characters;
  },

  createCharacter(data) {
    const id = this.generateId();
    const now = new Date().toISOString();
    data._meta = { id, version: 2, wizardComplete: data._meta?.wizardComplete || false, createdAt: now, updatedAt: now };
    const index = this.getIndex();
    index.characters.push({
      id,
      name: data.charName || 'New Character',
      class: data.charClass || '',
      species: data.charSpecies || '',
      level: parseInt(data.charLevel) || 1,
      createdAt: now,
      updatedAt: now,
    });
    this.saveIndex(index);
    localStorage.setItem(this.CHAR_PREFIX + id, JSON.stringify(data));
    return id;
  },

  loadCharacter(id) {
    try {
      return JSON.parse(localStorage.getItem(this.CHAR_PREFIX + id)) || {};
    } catch { return {}; }
  },

  saveCharacter(id, data) {
    if (!id) return;
    const now = new Date().toISOString();
    if (data._meta) data._meta.updatedAt = now;
    localStorage.setItem(this.CHAR_PREFIX + id, JSON.stringify(data));

    // Update index summary
    const index = this.getIndex();
    const entry = index.characters.find(c => c.id === id);
    if (entry) {
      entry.name = data.charName || entry.name;
      entry.class = data.charClass || entry.class;
      entry.species = data.charSpecies || entry.species;
      entry.level = parseInt(data.charLevel) || entry.level;
      entry.updatedAt = now;
      this.saveIndex(index);
    }

    // Mark as dirty for file sync
    if (typeof FileSync !== 'undefined') FileSync.markDirty(id);
  },

  deleteCharacter(id) {
    const index = this.getIndex();
    index.characters = index.characters.filter(c => c.id !== id);
    if (index.lastOpenedId === id) index.lastOpenedId = null;
    this.saveIndex(index);
    localStorage.removeItem(this.CHAR_PREFIX + id);
  },

  // ---- ACTIVE CHARACTER ----
  openCharacter(id) {
    this.activeId = id;
    this.activeData = this.loadCharacter(id);
    this._undoStack = [];
    this._redoStack = [];
    this._updateUndoButtons();
    const index = this.getIndex();
    index.lastOpenedId = id;
    this.saveIndex(index);
  },

  sv(key, val) {
    this._snapshot();
    this.activeData[key] = val;
    this.saveCharacter(this.activeId, this.activeData);
  },

  lv(key, def) {
    return this.activeData[key] !== undefined ? this.activeData[key] : def;
  },

  closeCharacter() {
    if (this.activeId) this.saveCharacter(this.activeId, this.activeData);
    this.activeId = null;
    this.activeData = {};
  },

  // ---- EXPORT / IMPORT ----
  exportCharacter(id) {
    const data = this.loadCharacter(id);
    const index = this.getIndex();
    const summary = index.characters.find(c => c.id === id);
    return JSON.stringify({ ...data, _exportName: summary?.name || 'character' }, null, 2);
  },

  importCharacter(jsonString) {
    const data = JSON.parse(jsonString);
    delete data._meta; // Will be recreated
    const exportName = data._exportName;
    delete data._exportName;
    if (!data.charName && exportName) data.charName = exportName;
    return this.createCharacter(data);
  },

  // ---- MIGRATION ----
  migrateV1() {
    const old = localStorage.getItem(this.OLD_KEY);
    if (!old) return false;
    try {
      const data = JSON.parse(old);
      if (!data || typeof data !== 'object') return false;
      data.charName = data.charName || 'Migrated Character';
      data._meta = { wizardComplete: true };
      const id = this.createCharacter(data);
      localStorage.removeItem(this.OLD_KEY);
      return id;
    } catch { return false; }
  },
};
