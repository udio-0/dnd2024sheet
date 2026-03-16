/* =============================================
   FILE SYNC - File System Access API integration
   Lets users save/load characters to a local folder
   Falls back to manual download/upload if unsupported
   ============================================= */
'use strict';

window.FileSync = {
  _dirHandle: null,      // FileSystemDirectoryHandle
  _supported: false,
  _dirty: new Set(),     // character IDs with unsaved changes
  _notesDirty: false,    // true if notes have unsaved changes
  NOTES_FILENAME: '_campaign_notes.json',

  // ---- INIT ----
  async init() {
    this._supported = typeof window.showDirectoryPicker === 'function';
    this._updateSaveButton();
    this._bindBeforeUnload();
    await this._restoreHandle();
  },

  isSupported()  { return this._supported; },
  hasFolder()    { return !!this._dirHandle; },
  isDirty(id)    { return id ? this._dirty.has(id) : this._dirty.size > 0; },
  markDirty(id)  { if (id) this._dirty.add(id); this._updateSaveButton(); },
  markClean(id)  { this._dirty.delete(id); this._updateSaveButton(); },
  markAllClean() { this._dirty.clear(); this._notesDirty = false; this._updateSaveButton(); },
  markNotesDirty()  { this._notesDirty = true; this._updateSaveButton(); },
  markNotesClean()  { this._notesDirty = false; this._updateSaveButton(); },

  // ---- DIRECTORY PICKER ----
  async pickFolder() {
    if (!this._supported) return false;
    try {
      this._dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      // Persist handle for next session
      this._persistHandle();
      return true;
    } catch (err) {
      // User cancelled or permission denied
      if (err.name !== 'AbortError') console.warn('Folder picker error:', err);
      return false;
    }
  },

  // ---- PERSIST / RESTORE DIRECTORY HANDLE (IndexedDB) ----
  async _persistHandle() {
    if (!this._dirHandle) return;
    try {
      const db = await this._openIDB();
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(this._dirHandle, 'charFolder');
      await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    } catch (e) { /* ignore */ }
  },

  async _restoreHandle() {
    if (!this._supported) return;
    try {
      const db = await this._openIDB();
      const tx = db.transaction('handles', 'readonly');
      const req = tx.objectStore('handles').get('charFolder');
      const handle = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = rej; });
      if (handle) {
        // Verify permission
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
          this._dirHandle = handle;
        }
        // If 'prompt', we'll request permission when user interacts
        else if (perm === 'prompt') {
          this._dirHandle = handle;
        }
      }
    } catch (e) { /* ignore - will show folder picker */ }
  },

  _openIDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('dnd_filesync', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('handles');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  // ---- REQUEST PERMISSION (needed after restore) ----
  async ensurePermission() {
    if (!this._dirHandle) return false;
    try {
      const perm = await this._dirHandle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') return true;
      const req = await this._dirHandle.requestPermission({ mode: 'readwrite' });
      return req === 'granted';
    } catch { return false; }
  },

  // ---- LOAD ALL CHARACTERS FROM FOLDER ----
  async loadFromFolder() {
    if (!this._dirHandle) return [];
    if (!(await this.ensurePermission())) return [];

    const characters = [];
    try {
      for await (const entry of this._dirHandle.values()) {
        if (entry.kind !== 'file' || !entry.name.endsWith('.json') || entry.name === this.NOTES_FILENAME) continue;
        try {
          const file = await entry.getFileHandle ? entry : await this._dirHandle.getFileHandle(entry.name);
          const fileObj = await (file.getFile ? file.getFile() : file);
          const text = await fileObj.text();
          const data = JSON.parse(text);
          // Validate it's a character file (has charName or _meta)
          if (data && (data.charName || data._meta)) {
            data._fileName = entry.name; // track original filename
            characters.push(data);
          }
        } catch (e) { /* skip invalid files */ }
      }
    } catch (e) {
      console.warn('Error reading folder:', e);
    }
    return characters;
  },

  // ---- SAVE CHARACTER TO FOLDER ----
  async saveCharacterToFile(id) {
    const data = CharStore.loadCharacter(id);
    if (!data || !Object.keys(data).length) return false;

    // If we have a folder handle, write directly
    if (this._dirHandle && await this.ensurePermission()) {
      const name = this._safeFileName(data.charName || 'character', id);
      try {
        const fileHandle = await this._dirHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        const exportData = { ...data, _exportName: data.charName || 'character' };
        await writable.write(JSON.stringify(exportData, null, 2));
        await writable.close();
        this.markClean(id);

        // Clean up old filename if character was renamed
        if (data._fileName && data._fileName !== name) {
          try { await this._dirHandle.removeEntry(data._fileName); } catch (e) { /* ignore */ }
        }
        // Store the filename for next save
        data._fileName = name;
        CharStore.activeData._fileName = name;

        return true;
      } catch (e) {
        console.warn('File save error:', e);
      }
    }

    // Fallback: download as file
    this._downloadCharacter(id, data);
    this.markClean(id);
    return true;
  },

  // ---- SAVE ALL DIRTY ----
  async saveAllDirty() {
    const ids = [...this._dirty];
    for (const id of ids) {
      await this.saveCharacterToFile(id);
    }
    if (this._notesDirty) await this.saveNotesToFile();
  },

  // ---- SAVE NOTES TO FOLDER ----
  async saveNotesToFile() {
    if (!this._dirHandle || !(await this.ensurePermission())) {
      // Fallback: download
      if (typeof NotesManager !== 'undefined') {
        NotesManager.exportNotes();
      }
      this._notesDirty = false;
      return;
    }
    try {
      const store = typeof NotesManager !== 'undefined' ? NotesManager._loadStore() : null;
      if (!store) return;
      const fileHandle = await this._dirHandle.getFileHandle(this.NOTES_FILENAME, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify({ _format: 'dnd2024-notes-v1', ...store }, null, 2));
      await writable.close();
      this._notesDirty = false;
      this._updateSaveButton();
    } catch (e) {
      console.warn('Notes file save error:', e);
    }
  },

  // ---- LOAD NOTES FROM FOLDER ----
  async loadNotesFromFile() {
    if (!this._dirHandle || !(await this.ensurePermission())) return false;
    try {
      const fileHandle = await this._dirHandle.getFileHandle(this.NOTES_FILENAME);
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data = JSON.parse(text);
      if (data._format !== 'dnd2024-notes-v1') return false;
      // Merge into NotesManager store
      const store = { folders: data.folders || [], notes: data.notes || [], lastOpen: data.lastOpen || null, _migrated: true };
      localStorage.setItem('dnd_campaign_notes_v1', JSON.stringify(store));
      return true;
    } catch (e) {
      // File doesn't exist yet — that's fine
      return false;
    }
  },

  // ---- DELETE CHARACTER FILE ----
  async deleteCharacterFile(id) {
    if (!this._dirHandle) return;
    const data = CharStore.loadCharacter(id);
    if (!data) return;
    const name = data._fileName || this._safeFileName(data.charName || 'character', id);
    try {
      if (await this.ensurePermission()) {
        await this._dirHandle.removeEntry(name);
      }
    } catch (e) { /* file might not exist */ }
    this._dirty.delete(id);
  },

  // ---- FALLBACK: DOWNLOAD ----
  _downloadCharacter(id, data) {
    const json = JSON.stringify({ ...data, _exportName: data.charName || 'character' }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.charName || 'character').replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // ---- FILE NAME HELPERS ----
  _safeFileName(name, id) {
    const safe = name.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_').slice(0, 60);
    // Use a short ID suffix to avoid collisions between "Gandalf" and "Gandalf"
    const suffix = id ? '_' + id.slice(-6) : '';
    return (safe || 'character') + suffix + '.json';
  },

  // ---- SAVE BUTTON STATE ----
  _updateSaveButton() {
    const btn = document.getElementById('btn-save-char');
    if (!btn) return;
    const dirty = this._dirty.size > 0 || this._notesDirty;
    btn.classList.toggle('has-changes', dirty);
    btn.title = dirty ? 'Unsaved changes — click to save' : 'Save to folder';
  },

  // ---- BEFORE UNLOAD ----
  _bindBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      // Force-flush any pending notes save
      if (typeof NotesManager !== 'undefined' && NotesManager._saveTimer) {
        clearTimeout(NotesManager._saveTimer);
        NotesManager._saveTimer = null;
        NotesManager._saveActiveContent();
      }
      // Warn if there are unsaved changes (characters or notes)
      if (this._dirty.size > 0 || this._notesDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Click "Save" before leaving.';
        return e.returnValue;
      }
    });
  },

  // ---- IMPORT CHARACTERS + NOTES FROM FOLDER ----
  async syncFromFolder() {
    // Load notes file first
    await this.loadNotesFromFile();

    const characters = await this.loadFromFolder();
    if (!characters.length) return 0;

    let imported = 0;
    const existingIds = new Set(CharStore.listCharacters().map(c => c.id));

    characters.forEach(data => {
      // Check if already loaded (by _meta.id or by matching name+class)
      const metaId = data._meta?.id;
      if (metaId && existingIds.has(metaId)) {
        // Update existing character with file data (file is source of truth)
        CharStore.saveCharacter(metaId, data);
        return;
      }

      // Check by name match
      const existing = CharStore.listCharacters().find(
        c => c.name.toLowerCase() === (data.charName || '').toLowerCase()
      );
      if (existing) {
        CharStore.saveCharacter(existing.id, data);
        return;
      }

      // New character from folder
      delete data._meta; // will be recreated
      const exportName = data._exportName;
      delete data._exportName;
      if (!data.charName && exportName) data.charName = exportName;
      CharStore.createCharacter(data);
      imported++;
    });

    return imported;
  },
};
