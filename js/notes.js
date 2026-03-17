/* =============================================
   NOTES SYSTEM - Wiki-style campaign journal
   Folders, tags, hyperlinks, search & filter
   ============================================= */
'use strict';

window.NotesManager = {

  // ---- TAG DEFINITIONS ----
  TAG_TYPES: {
    npc:      { label: 'NPC',      icon: '👤', color: '#8e44ad' },
    location: { label: 'Location', icon: '📍', color: '#27ae60' },
    quest:    { label: 'Quest',    icon: '⚔',  color: '#c0392b' },
    item:     { label: 'Item',     icon: '🎒', color: '#d4a017' },
    event:    { label: 'Event',    icon: '📅', color: '#2980b9' },
    lore:     { label: 'Lore',     icon: '📜', color: '#8B4513' },
    faction:  { label: 'Faction',  icon: '🏛',  color: '#7f8c8d' },
    session:  { label: 'Session',  icon: '📖', color: '#e67e22' },
  },

  // Symbol shortcuts: type a symbol to start linking to notes with that tag
  // e.g. @Gandalf → links to an NPC note named "Gandalf"
  SYMBOL_MAP: {
    '@': 'npc',       // @Gandalf        → mention an NPC
    '#': 'location',  // #Neverwinter    → reference a place
    '!': 'quest',     // !Find the Sword → reference a quest
    '$': 'item',      // $Flame Tongue   → reference an item
    '&': 'faction',   // &Harpers        → reference a faction
    '~': 'lore',      // ~Weave          → reference lore
    '^': 'event',     // ^Dragon Attack  → reference an event
    '%': 'session',   // %Session 12     → reference a session
  },

  // Reverse lookup: tag → symbol (built in init)
  TAG_SYMBOL: {},

  // ---- STATE ----
  _activeNoteId: null,
  _activeFolder: null,   // null = all notes, string = folder id
  _filterTag: null,
  _searchQuery: '',
  _editingTitle: false,
  _acActive: false,      // autocomplete active
  _acSymbol: null,       // current trigger symbol
  _acQuery: '',          // current typed query after symbol
  _acStartPos: -1,       // cursor position where symbol was typed
  _acSelected: 0,        // highlighted index in dropdown
  _acResults: [],        // current filtered results
  _dirty: false,         // true if notes changed since last export
  _saveTimer: null,      // reference to debounced save timer
  _navHistory: [],       // note navigation history (array of note IDs)
  _navIndex: -1,         // current position in navigation history
  _navLock: false,       // prevent history push during back/forward

  // ---- STORAGE (independent from character data) ----
  STORAGE_KEY: 'dnd_campaign_notes_v1',

  $(id) { return document.getElementById(id); },

  _loadStore() {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || { folders: [], notes: [], lastOpen: null }; }
    catch { return { folders: [], notes: [], lastOpen: null }; }
  },

  _saveStore(store) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
    // Mark notes dirty for file sync
    if (typeof FileSync !== 'undefined') FileSync.markNotesDirty();
  },

  _uid() { return 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); },

  // ---- DATA ACCESS ----
  getFolders() { return this._loadStore().folders; },
  getNotes()   { return this._loadStore().notes; },

  saveFolders(f) {
    const store = this._loadStore();
    store.folders = f;
    this._saveStore(store);
    this._dirty = true;
  },
  saveNotes(n) {
    const store = this._loadStore();
    store.notes = n;
    this._saveStore(store);
    this._dirty = true;
  },

  _getLastOpen() { return this._loadStore().lastOpen; },
  _setLastOpen(id) {
    const store = this._loadStore();
    store.lastOpen = id;
    this._saveStore(store);
  },

  getNoteById(id) { return this.getNotes().find(n => n.id === id) || null; },
  getFolderById(id) { return this.getFolders().find(f => f.id === id) || null; },

  // ---- INIT ----
  init() {
    // Build reverse lookup: tag → symbol
    Object.entries(this.SYMBOL_MAP).forEach(([sym, tag]) => { this.TAG_SYMBOL[tag] = sym; });
    this._migrateOldNotes();
    this._bindUI();
    this.renderSidebar();
    this._openLastNote();

    // Replace initial history entry so we have a baseline to return to
    history.replaceState({ notesBase: true }, '', '');

    // Listen for browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.noteId) {
        // Navigate to the note from browser history
        this._navLock = true;
        // Sync internal nav index if possible
        const idx = this._navHistory.lastIndexOf(e.state.noteId);
        if (idx >= 0) this._navIndex = idx;
        this.openNote(e.state.noteId);
        this._navLock = false;
      } else if (e.state && e.state.notesBase) {
        // Returned to base — close editor if open on mobile, or just stay
        this.$('notes-tab-root')?.classList.remove('note-open');
      }
    });
  },

  // teardown on character switch
  teardown() {
    this._activeNoteId = null;
    this._activeFolder = null;
    this._filterTag = null;
    this._searchQuery = '';
  },

  // restore after character load
  restore() {
    this._migrateOldNotes();
    this.renderSidebar();
    this._openLastNote();
  },

  // ---- MIGRATE OLD DATA ----
  // Pulls notes from character data (old format) into the independent notes store
  _migrateOldNotes() {
    const store = this._loadStore();
    if (store._migrated) return;

    // Check all characters for embedded notes
    const chars = CharStore.listCharacters();
    const allNotes = [...store.notes];
    const allFolders = [...store.folders];
    const existingTitles = new Set(allNotes.map(n => n.title.toLowerCase()));

    chars.forEach(c => {
      const data = CharStore.loadCharacter(c.id);
      if (!data) return;

      // Migrate structured notes (notes_entries / notes_folders)
      const charNotes = data.notes_entries || [];
      const charFolders = data.notes_folders || [];

      charFolders.forEach(f => {
        if (!allFolders.find(ef => ef.id === f.id)) allFolders.push(f);
      });
      charNotes.forEach(n => {
        if (!existingTitles.has(n.title.toLowerCase())) {
          allNotes.push(n);
          existingTitles.add(n.title.toLowerCase());
        }
      });

      // Migrate old-style textarea notes (campaignNotes, npcNotes, questNotes)
      const now = new Date().toISOString();
      if (data.campaignNotes && !existingTitles.has('campaign notes')) {
        allNotes.push({ id: this._uid(), folderId: null, title: 'Campaign Notes', content: data.campaignNotes, tags: ['lore'], pinned: true, created: now, modified: now });
        existingTitles.add('campaign notes');
      }
      if (data.npcNotes && !existingTitles.has('npc tracker')) {
        allNotes.push({ id: this._uid(), folderId: null, title: 'NPC Tracker', content: data.npcNotes, tags: ['npc'], pinned: false, created: now, modified: now });
        existingTitles.add('npc tracker');
      }
      if (data.questNotes && !existingTitles.has('quest log')) {
        allNotes.push({ id: this._uid(), folderId: null, title: 'Quest Log', content: data.questNotes, tags: ['quest'], pinned: false, created: now, modified: now });
        existingTitles.add('quest log');
      }
    });

    store.notes = allNotes;
    store.folders = allFolders;
    store._migrated = true;
    this._saveStore(store);
  },

  // ---- UI BINDING ----
  _bindUI() {
    // New note button
    this.$('notes-btn-new')?.addEventListener('click', () => this.createNote());
    // New folder button
    this.$('notes-btn-new-folder')?.addEventListener('click', () => this.createFolder());
    // Search input
    const search = this.$('notes-search');
    if (search) {
      search.addEventListener('input', () => {
        this._searchQuery = search.value.trim().toLowerCase();
        this.renderNoteList();
      });
    }
    // Tag filter pills
    this.$('notes-tag-filters')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-tag]');
      if (!btn) return;
      const tag = btn.dataset.tag;
      this._filterTag = this._filterTag === tag ? null : tag;
      this.renderTagFilters();
      this.renderNoteList();
    });
    // Editor content auto-save + autocomplete triggers
    const editor = this.$('notes-editor-content');
    if (editor) {
      editor.addEventListener('input', (e) => {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this._saveActiveContent(), 400);
        this._onEditorInput(editor, e);
      });
      editor.addEventListener('keydown', (e) => this._onEditorKeydown(editor, e));
      // Render preview on blur to show wiki links + symbol links
      editor.addEventListener('blur', () => {
        // Small delay so clicking dropdown items registers before blur hides it
        setTimeout(() => {
          if (!this._acMouseDown) {
            this._acDismiss();
            this._renderPreviewLinks();
            this._showRenderedView();
          }
        }, 150);
      });
      editor.addEventListener('focus', () => {
        this._showRawContent();
        this._hideRenderedView();
      });
    }
    // Title editing
    const titleEl = this.$('notes-editor-title');
    if (titleEl) {
      titleEl.addEventListener('blur', () => this._saveTitle());
      titleEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
      });
    }
    // Tag add button
    this.$('notes-add-tag-btn')?.addEventListener('click', () => this._toggleTagDropdown());
    // Pin button
    this.$('notes-btn-pin')?.addEventListener('click', () => this._togglePin());
    // Delete note button
    this.$('notes-btn-delete')?.addEventListener('click', () => this._deleteActiveNote());
    // Move to folder button
    this.$('notes-btn-move')?.addEventListener('click', () => this._showMoveDropdown());
    // Back to list (mobile)
    this.$('notes-btn-back')?.addEventListener('click', () => {
      this.$('notes-tab-root')?.classList.remove('note-open');
    });
    this.$('notes-nav-prev')?.addEventListener('click', () => this._navBack());
    this.$('notes-nav-next')?.addEventListener('click', () => this._navForward());
    // Help tooltip toggle
    const helpBtn = this.$('notes-help-btn');
    const helpTip = this.$('notes-help-tooltip');
    if (helpBtn && helpTip) {
      helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const show = !helpTip.classList.contains('visible');
        helpTip.classList.toggle('visible', show);
        helpBtn.classList.toggle('active', show);
      });
      document.addEventListener('click', (e) => {
        if (!helpTip.contains(e.target) && e.target !== helpBtn) {
          helpTip.classList.remove('visible');
          helpBtn.classList.remove('active');
        }
      });
    }
    // Export / Import
    this.$('notes-btn-export')?.addEventListener('click', () => this.exportNotes());
    this.$('notes-btn-import')?.addEventListener('click', () => this.$('notes-import-file')?.click());
    this.$('notes-import-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.importNotes(file);
      e.target.value = ''; // reset so same file can be re-imported
    });
  },

  // ---- FOLDER CRUD ----
  createFolder() {
    const name = prompt('Folder name:');
    if (!name || !name.trim()) return;
    const folders = this.getFolders();
    const folder = {
      id: this._uid(),
      name: name.trim(),
      parentId: this._activeFolder,
      color: null,
      order: folders.length,
      collapsed: false,
    };
    folders.push(folder);
    this.saveFolders(folders);
    this.renderSidebar();
  },

  renameFolder(id) {
    const folders = this.getFolders();
    const f = folders.find(x => x.id === id);
    if (!f) return;
    const name = prompt('Rename folder:', f.name);
    if (!name || !name.trim()) return;
    f.name = name.trim();
    this.saveFolders(folders);
    this.renderSidebar();
  },

  deleteFolder(id) {
    if (!confirm('Delete this folder and move its notes to root?')) return;
    let folders = this.getFolders();
    // move notes to root
    const notes = this.getNotes();
    notes.forEach(n => { if (n.folderId === id) n.folderId = null; });
    this.saveNotes(notes);
    // move subfolders to parent
    const target = folders.find(f => f.id === id);
    const parentId = target ? target.parentId : null;
    folders.forEach(f => { if (f.parentId === id) f.parentId = parentId; });
    folders = folders.filter(f => f.id !== id);
    this.saveFolders(folders);
    if (this._activeFolder === id) this._activeFolder = null;
    this.renderSidebar();
  },

  // ---- NOTE CRUD ----
  createNote(folderId) {
    const now = new Date().toISOString();
    const notes = this.getNotes();
    const note = {
      id: this._uid(),
      folderId: folderId !== undefined ? folderId : this._activeFolder,
      title: 'Untitled Note',
      content: '',
      tags: [],
      pinned: false,
      created: now,
      modified: now,
    };
    notes.unshift(note);
    this.saveNotes(notes);
    this.openNote(note.id);
    this.renderSidebar();
    // Focus title for immediate editing
    setTimeout(() => {
      const titleEl = this.$('notes-editor-title');
      if (titleEl) { titleEl.focus(); titleEl.select(); }
    }, 50);
  },

  openNote(id) {
    // Push to navigation history (unless navigating via back/forward)
    if (!this._navLock) {
      // Truncate forward history if we branched
      if (this._navIndex < this._navHistory.length - 1) {
        this._navHistory = this._navHistory.slice(0, this._navIndex + 1);
      }
      // Don't push duplicate
      if (this._navHistory[this._navHistory.length - 1] !== id) {
        this._navHistory.push(id);
      }
      this._navIndex = this._navHistory.length - 1;
      // Push browser history so back/forward buttons navigate notes
      history.pushState({ noteId: id }, '', '');
    }
    this._updateNavButtons();
    this._activeNoteId = id;
    this._setLastOpen(id);
    const note = this.getNoteById(id);
    if (!note) { this._showEmptyEditor(); return; }

    // Show editor
    const root = this.$('notes-tab-root');
    if (root) root.classList.add('note-open');

    const titleEl = this.$('notes-editor-title');
    const contentEl = this.$('notes-editor-content');
    const tagsEl = this.$('notes-editor-tags');
    const metaEl = this.$('notes-editor-meta');
    const pinBtn = this.$('notes-btn-pin');

    if (titleEl) { titleEl.value = note.title; titleEl.disabled = false; }
    if (contentEl) { contentEl.value = note.content; contentEl.disabled = false; }
    if (pinBtn) pinBtn.classList.toggle('active', note.pinned);
    this._renderNoteTags(note);
    this._renderMeta(note);
    this.renderNoteList();

    // Always show rendered view (blur editor if it has focus)
    if (contentEl && document.activeElement === contentEl) contentEl.blur();
    this._hideRenderedView();
    this._renderPreviewLinks();
    this._showRenderedView();
  },

  _showEmptyEditor() {
    const titleEl = this.$('notes-editor-title');
    const contentEl = this.$('notes-editor-content');
    const tagsEl = this.$('notes-editor-tags');
    const metaEl = this.$('notes-editor-meta');
    const previewEl = this.$('notes-link-preview');
    this._hideRenderedView();
    if (titleEl) { titleEl.value = ''; titleEl.disabled = true; }
    if (contentEl) { contentEl.value = 'Select or create a note to begin.'; contentEl.disabled = true; }
    if (tagsEl) tagsEl.innerHTML = '';
    if (metaEl) metaEl.textContent = '';
    if (previewEl) previewEl.innerHTML = '';
    this._activeNoteId = null;
  },

  _saveActiveContent() {
    if (!this._activeNoteId) return;
    const contentEl = this.$('notes-editor-content');
    if (!contentEl) return;
    const notes = this.getNotes();
    const note = notes.find(n => n.id === this._activeNoteId);
    if (!note) return;
    note.content = contentEl.value;
    note.modified = new Date().toISOString();
    this.saveNotes(notes);
  },

  _saveTitle() {
    if (!this._activeNoteId) return;
    const titleEl = this.$('notes-editor-title');
    if (!titleEl) return;
    const notes = this.getNotes();
    const note = notes.find(n => n.id === this._activeNoteId);
    if (!note) return;
    const newTitle = titleEl.value.trim() || 'Untitled Note';
    note.title = newTitle;
    note.modified = new Date().toISOString();
    titleEl.value = newTitle;
    this.saveNotes(notes);
    this.renderNoteList();
  },

  _togglePin() {
    if (!this._activeNoteId) return;
    const notes = this.getNotes();
    const note = notes.find(n => n.id === this._activeNoteId);
    if (!note) return;
    note.pinned = !note.pinned;
    this.saveNotes(notes);
    const pinBtn = this.$('notes-btn-pin');
    if (pinBtn) pinBtn.classList.toggle('active', note.pinned);
    this.renderNoteList();
  },

  _deleteActiveNote() {
    if (!this._activeNoteId) return;
    if (!confirm('Delete this note?')) return;
    let notes = this.getNotes();
    notes = notes.filter(n => n.id !== this._activeNoteId);
    this.saveNotes(notes);
    this._showEmptyEditor();
    this.renderSidebar();
  },

  // ---- TAGS ----
  addTag(noteId, tag) {
    const notes = this.getNotes();
    const note = notes.find(n => n.id === noteId);
    if (!note || note.tags.includes(tag)) return;
    note.tags.push(tag);
    note.modified = new Date().toISOString();
    this.saveNotes(notes);
    if (noteId === this._activeNoteId) this._renderNoteTags(note);
    this.renderNoteList();
  },

  removeTag(noteId, tag) {
    const notes = this.getNotes();
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.tags = note.tags.filter(t => t !== tag);
    note.modified = new Date().toISOString();
    this.saveNotes(notes);
    if (noteId === this._activeNoteId) this._renderNoteTags(note);
    this.renderNoteList();
  },

  _renderNoteTags(note) {
    const container = this.$('notes-editor-tags');
    if (!container) return;
    container.innerHTML = '';
    note.tags.forEach(tag => {
      const def = this.TAG_TYPES[tag];
      if (!def) return;
      const pill = document.createElement('span');
      pill.className = 'notes-tag-pill';
      pill.style.setProperty('--tag-color', def.color);
      pill.innerHTML = `<span class="notes-tag-icon">${def.icon}</span>${def.label}<button class="notes-tag-remove" data-tag="${tag}" title="Remove tag">×</button>`;
      pill.querySelector('.notes-tag-remove').addEventListener('click', () => this.removeTag(note.id, tag));
      container.appendChild(pill);
    });
  },

  _toggleTagDropdown() {
    if (!this._activeNoteId) return;
    let dd = this.$('notes-tag-dropdown');
    if (dd) { dd.remove(); return; }
    const note = this.getNoteById(this._activeNoteId);
    if (!note) return;

    dd = document.createElement('div');
    dd.id = 'notes-tag-dropdown';
    dd.className = 'notes-tag-dropdown';
    Object.entries(this.TAG_TYPES).forEach(([key, def]) => {
      const opt = document.createElement('button');
      opt.className = 'notes-tag-dd-opt' + (note.tags.includes(key) ? ' active' : '');
      opt.innerHTML = `${def.icon} ${def.label}`;
      opt.addEventListener('click', () => {
        // Always re-read the note to get fresh tag state
        const fresh = this.getNoteById(this._activeNoteId);
        if (!fresh) return;
        if (fresh.tags.includes(key)) this.removeTag(this._activeNoteId, key);
        else this.addTag(this._activeNoteId, key);
        opt.classList.toggle('active');
      });
      dd.appendChild(opt);
    });
    this.$('notes-tag-bar')?.appendChild(dd);

    // Close on outside click
    setTimeout(() => {
      const closer = (e) => {
        if (!dd.contains(e.target) && e.target.id !== 'notes-add-tag-btn') {
          dd.remove(); document.removeEventListener('click', closer);
        }
      };
      document.addEventListener('click', closer);
    }, 0);
  },

  // ---- MOVE NOTE ----
  _showMoveDropdown() {
    if (!this._activeNoteId) return;
    let dd = this.$('notes-move-dropdown');
    if (dd) { dd.remove(); return; }
    const folders = this.getFolders();

    dd = document.createElement('div');
    dd.id = 'notes-move-dropdown';
    dd.className = 'notes-tag-dropdown notes-move-dropdown';

    // Root option
    const rootOpt = document.createElement('button');
    rootOpt.className = 'notes-tag-dd-opt';
    rootOpt.textContent = '📁 Root (no folder)';
    rootOpt.addEventListener('click', () => { this._moveNote(this._activeNoteId, null); dd.remove(); });
    dd.appendChild(rootOpt);

    folders.forEach(f => {
      const opt = document.createElement('button');
      opt.className = 'notes-tag-dd-opt';
      opt.textContent = `📁 ${f.name}`;
      opt.addEventListener('click', () => { this._moveNote(this._activeNoteId, f.id); dd.remove(); });
      dd.appendChild(opt);
    });

    this.$('notes-editor-toolbar')?.appendChild(dd);
    setTimeout(() => {
      const closer = (e) => {
        if (!dd.contains(e.target)) { dd.remove(); document.removeEventListener('click', closer); }
      };
      document.addEventListener('click', closer);
    }, 0);
  },

  // ---- NOTE NAVIGATION (back/forward) ----
  _navBack() {
    if (this._navIndex <= 0) return;
    history.back(); // triggers popstate which handles the navigation
  },

  _navForward() {
    if (this._navIndex >= this._navHistory.length - 1) return;
    history.forward(); // triggers popstate which handles the navigation
  },

  _updateNavButtons() {
    const prev = this.$('notes-nav-prev');
    const next = this.$('notes-nav-next');
    if (prev) prev.disabled = this._navIndex <= 0;
    if (next) next.disabled = this._navIndex >= this._navHistory.length - 1;
  },

  _moveNote(noteId, folderId) {
    const notes = this.getNotes();
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.folderId = folderId;
    note.modified = new Date().toISOString();
    this.saveNotes(notes);
    this.renderSidebar();
  },

  _toggleFolderCollapse(folderId) {
    const folders = this.getFolders();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    folder.collapsed = !folder.collapsed;
    this.saveFolders(folders);
    this.renderSidebar();
  },

  // ---- EXPORT / IMPORT ----
  exportNotes() {
    const folders = this.getFolders();
    const notes = this.getNotes();
    const charName = CharStore.activeData.charName || 'Character';

    // Determine what to export: current folder or all
    let exportFolders = folders;
    let exportNotes = notes;
    let scope = 'all';

    if (this._activeFolder) {
      const folderName = this.getFolderById(this._activeFolder)?.name || 'folder';
      const choice = confirm(
        `Export just the "${folderName}" folder?\n\nOK = Export this folder only\nCancel = Export all notes`
      );
      if (choice) {
        scope = this._activeFolder;
        exportNotes = notes.filter(n => n.folderId === this._activeFolder);
        exportFolders = [this.getFolderById(this._activeFolder)].filter(Boolean);
      }
    }

    // Build a clean export — remap folder references so import is self-contained
    const folderIdMap = {};
    const cleanFolders = exportFolders.map(f => {
      const newId = this._uid();
      folderIdMap[f.id] = newId;
      return { ...f, id: newId, parentId: f.parentId ? (folderIdMap[f.parentId] || null) : null };
    });
    const cleanNotes = exportNotes.map(n => ({
      ...n,
      id: this._uid(),
      folderId: n.folderId ? (folderIdMap[n.folderId] || null) : null,
    }));

    const payload = {
      _format: 'dnd2024-notes-v1',
      exportedAt: new Date().toISOString(),
      characterName: charName,
      scope: scope === 'all' ? 'all' : 'folder',
      folderCount: cleanFolders.length,
      noteCount: cleanNotes.length,
      folders: cleanFolders,
      notes: cleanNotes,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = charName.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.href = url;
    a.download = `${safeName}_notes_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this._dirty = false;
  },

  importNotes(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate format
        if (data._format !== 'dnd2024-notes-v1') {
          alert('Invalid file. This does not appear to be a D&D notes export.');
          return;
        }

        const importFolders = data.folders || [];
        const importNotes = data.notes || [];

        if (!importNotes.length && !importFolders.length) {
          alert('This export file is empty — nothing to import.');
          return;
        }

        // Show summary and ask for confirmation
        const info = `Import ${importNotes.length} note(s) and ${importFolders.length} folder(s)` +
          (data.characterName ? ` from "${data.characterName}"` : '') + '?';

        if (!confirm(info)) return;

        // Merge: check for title conflicts
        const existingNotes = this.getNotes();
        const existingFolders = this.getFolders();
        const existingTitles = new Map(existingNotes.map(n => [n.title.toLowerCase(), n]));
        const existingFolderNames = new Map(existingFolders.map(f => [f.name.toLowerCase(), f]));

        // Import folders — skip if same name exists, map IDs
        const folderIdRemap = {};
        const newFolders = [...existingFolders];
        importFolders.forEach(f => {
          const existing = existingFolderNames.get(f.name.toLowerCase());
          if (existing) {
            folderIdRemap[f.id] = existing.id; // point to existing
          } else {
            const newId = this._uid();
            folderIdRemap[f.id] = newId;
            newFolders.push({
              ...f,
              id: newId,
              parentId: f.parentId ? (folderIdRemap[f.parentId] || null) : null,
            });
          }
        });

        // Import notes — handle conflicts
        let imported = 0, skipped = 0, overwritten = 0;
        let askOverwrite = null; // null = not asked yet, true/false = user choice for all

        const newNotes = [...existingNotes];
        importNotes.forEach(n => {
          const existing = existingTitles.get(n.title.toLowerCase());
          if (existing) {
            // Conflict: ask user
            if (askOverwrite === null) {
              const choice = confirm(
                `A note titled "${existing.title}" already exists.\n\n` +
                'OK = Overwrite ALL conflicts with imported versions\n' +
                'Cancel = Skip ALL conflicts (keep existing)'
              );
              askOverwrite = choice;
            }
            if (askOverwrite) {
              // Overwrite: update existing note's content/tags
              existing.content = n.content;
              existing.tags = [...new Set([...existing.tags, ...n.tags])];
              existing.modified = new Date().toISOString();
              overwritten++;
            } else {
              skipped++;
            }
          } else {
            // No conflict — add new
            newNotes.unshift({
              ...n,
              id: this._uid(),
              folderId: n.folderId ? (folderIdRemap[n.folderId] || null) : null,
            });
            imported++;
          }
        });

        this.saveFolders(newFolders);
        this.saveNotes(newNotes);
        this.renderSidebar();

        this._dirty = false; // freshly synced with file

        // Show result
        let msg = `Import complete: ${imported} added`;
        if (overwritten) msg += `, ${overwritten} overwritten`;
        if (skipped) msg += `, ${skipped} skipped`;
        alert(msg + '.');

      } catch (err) {
        alert('Failed to import notes: ' + err.message);
      }
    };
    reader.readAsText(file);
  },

  // ---- INLINE AUTOCOMPLETE (symbol links) ----
  _acMouseDown: false,

  _onEditorInput(editor) {
    const pos = editor.selectionStart;
    const text = editor.value;

    // If autocomplete is active, update the query
    if (this._acActive) {
      const typed = text.slice(this._acStartPos + 1, pos);
      // Dismiss if user backspaced past the symbol or typed a space immediately after
      // (e.g. "# " is a markdown heading, not a location link)
      // Also dismiss if user typed the same symbol again (e.g. ~~ for strikethrough)
      if (pos <= this._acStartPos || (typed.length === 1 && typed === ' ') || (typed.length === 1 && typed === this._acSymbol)) {
        this._acDismiss();
        return;
      }
      this._acQuery = typed;
      this._acSelected = 0;
      this._acUpdateResults();
      this._acRender(editor);
      return;
    }

    // Check if user just typed a trigger symbol
    if (pos > 0) {
      const ch = text[pos - 1];
      if (this.SYMBOL_MAP[ch]) {
        // Only trigger at start of line or after whitespace
        const before = pos >= 2 ? text[pos - 2] : '\n';
        if (before === '\n' || before === ' ' || before === '\t' || pos === 1) {
          this._acActive = true;
          this._acSymbol = ch;
          this._acStartPos = pos - 1;
          this._acQuery = '';
          this._acSelected = 0;
          this._acUpdateResults();
          this._acRender(editor);
        }
      }
    }
  },

  _onEditorKeydown(editor, e) {
    if (!this._acActive) return;
    const dd = this.$('notes-ac-dropdown');
    if (!dd) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._acSelected = Math.min(this._acSelected + 1, this._acResults.length - 1);
      this._acHighlight(dd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._acSelected = Math.max(this._acSelected - 1, 0);
      this._acHighlight(dd);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (this._acResults.length > 0) {
        e.preventDefault();
        this._acAccept(editor, this._acResults[this._acSelected]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._acDismiss();
    }
  },

  _acUpdateResults() {
    const tagType = this.SYMBOL_MAP[this._acSymbol];
    const allNotes = this.getNotes();
    const q = this._acQuery.toLowerCase();

    // Filter: notes that have the matching tag, or ALL notes if query is typed
    // Prioritize notes with the matching tag, then show others
    let tagged = allNotes.filter(n => n.tags.includes(tagType));
    let untagged = allNotes.filter(n => !n.tags.includes(tagType));

    if (q) {
      tagged = tagged.filter(n => n.title.toLowerCase().includes(q));
      untagged = untagged.filter(n => n.title.toLowerCase().includes(q));
    }

    // Combine: tagged first, then untagged (marked as "other")
    this._acResults = [
      ...tagged.slice(0, 8).map(n => ({ note: n, primary: true })),
      ...untagged.slice(0, 4).map(n => ({ note: n, primary: false })),
    ];

    // Add "create new" option if query has text and no exact match
    if (q.length > 0) {
      const exactMatch = allNotes.find(n => n.title.toLowerCase() === q);
      if (!exactMatch) {
        this._acResults.push({ create: true, title: this._acQuery, tagType });
      }
    }
  },

  _acRender(editor) {
    // Remove existing
    let dd = this.$('notes-ac-dropdown');
    if (dd) dd.remove();

    if (!this._acResults.length) return;

    dd = document.createElement('div');
    dd.id = 'notes-ac-dropdown';
    dd.className = 'notes-ac-dropdown';

    // Position near the cursor in the textarea
    const coords = this._getCaretCoords(editor);
    dd.style.left = coords.left + 'px';
    dd.style.top = coords.top + 'px';

    const tagType = this.SYMBOL_MAP[this._acSymbol];
    const tagDef = this.TAG_TYPES[tagType];

    // Header showing what type we're linking
    const header = document.createElement('div');
    header.className = 'notes-ac-header';
    header.innerHTML = `${tagDef.icon} <span>Link ${tagDef.label}</span><kbd>${this._acSymbol}</kbd>`;
    dd.appendChild(header);

    this._acResults.forEach((item, i) => {
      const opt = document.createElement('button');
      opt.className = 'notes-ac-item' + (i === this._acSelected ? ' selected' : '');
      opt.dataset.index = i;

      if (item.create) {
        opt.innerHTML = `<span class="notes-ac-create">+ Create "${this._esc(item.title)}"</span><span class="notes-ac-badge" style="--tag-color:${tagDef.color}">${tagDef.label}</span>`;
      } else {
        const n = item.note;
        const tags = n.tags.map(t => {
          const d = this.TAG_TYPES[t];
          return d ? `<span class="notes-ac-badge" style="--tag-color:${d.color}">${d.icon}</span>` : '';
        }).join('');
        opt.innerHTML = `<span class="notes-ac-title">${this._esc(n.title)}</span>${tags}${!item.primary ? '<span class="notes-ac-other">other</span>' : ''}`;
      }

      // Use mousedown instead of click to fire before blur
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._acMouseDown = true;
        this._acAccept(editor, item);
        setTimeout(() => { this._acMouseDown = false; }, 200);
      });
      dd.appendChild(opt);
    });

    // Append to the editor wrapper
    const editorEl = editor.closest('.notes-editor');
    if (editorEl) {
      editorEl.style.position = 'relative';
      editorEl.appendChild(dd);
    }
  },

  _acHighlight(dd) {
    dd.querySelectorAll('.notes-ac-item').forEach((el, i) => {
      el.classList.toggle('selected', i === this._acSelected);
    });
  },

  _acAccept(editor, item) {
    let insertTitle;
    if (item.create) {
      // Create the new note with the appropriate tag
      const now = new Date().toISOString();
      const notes = this.getNotes();
      const newNote = {
        id: this._uid(), folderId: this._activeFolder,
        title: item.title, content: '', tags: [item.tagType],
        pinned: false, created: now, modified: now,
      };
      notes.unshift(newNote);
      this.saveNotes(notes);
      this.renderSidebar();
      insertTitle = item.title;
    } else {
      insertTitle = item.note.title;
    }

    // Replace the symbol+query with symbol[Title]
    const before = editor.value.slice(0, this._acStartPos);
    const after = editor.value.slice(editor.selectionStart);
    const link = `${this._acSymbol}[${insertTitle}]`;
    editor.value = before + link + after;

    // Position cursor after the inserted link
    const newPos = before.length + link.length;
    editor.selectionStart = editor.selectionEnd = newPos;
    editor.focus();

    // Save content
    this._saveActiveContent();
    this._acDismiss();
  },

  _acDismiss() {
    this._acActive = false;
    this._acSymbol = null;
    this._acQuery = '';
    this._acStartPos = -1;
    this._acResults = [];
    const dd = this.$('notes-ac-dropdown');
    if (dd) dd.remove();
  },

  // Get approximate caret coordinates relative to editor container
  _getCaretCoords(textarea) {
    const editorEl = textarea.closest('.notes-editor');
    if (!editorEl) return { left: 0, top: 0 };

    // Create a mirror div to measure caret position
    const mirror = document.createElement('div');
    const style = getComputedStyle(textarea);
    mirror.style.cssText = `
      position:absolute; visibility:hidden; white-space:pre-wrap; word-wrap:break-word;
      width:${style.width}; font:${style.font}; padding:${style.padding};
      border:${style.border}; line-height:${style.lineHeight}; letter-spacing:${style.letterSpacing};
      overflow:hidden;
    `;
    const textBefore = textarea.value.slice(0, textarea.selectionStart);
    mirror.textContent = textBefore;
    const marker = document.createElement('span');
    marker.textContent = '|';
    mirror.appendChild(marker);
    document.body.appendChild(mirror);

    const taRect = textarea.getBoundingClientRect();
    const edRect = editorEl.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    // Calculate position relative to editor container
    const left = Math.min(
      (markerRect.left - mirrorRect.left) + (taRect.left - edRect.left),
      edRect.width - 260 // keep dropdown in view
    );
    const top = (markerRect.top - mirrorRect.top) + (taRect.top - edRect.top) + 22 - textarea.scrollTop;

    document.body.removeChild(mirror);
    return { left: Math.max(8, left), top: Math.max(40, top) };
  },

  // ---- WIKI LINKS & SYMBOL LINKS (preview bar) ----
  // All link patterns: [[Title]], @[Title], #[Title], ![Title], $[Title], etc.
  _SYMBOL_LINK_RE: /(?:(@|#|!|\$|&|~|\^|%)\[([^\]]+)\]|\[\[([^\]]+)\]\])/g,

  _renderPreviewLinks() {
    const contentEl = this.$('notes-editor-content');
    const previewEl = this.$('notes-link-preview');
    if (!contentEl || !previewEl) return;
    const text = contentEl.value;

    const links = []; // { symbol, title }
    let match;
    const re = new RegExp(this._SYMBOL_LINK_RE.source, 'g');
    while ((match = re.exec(text)) !== null) {
      if (match[3]) {
        // [[wiki link]]
        links.push({ symbol: null, title: match[3] });
      } else {
        // symbol[link]
        links.push({ symbol: match[1], title: match[2] });
      }
    }
    if (!links.length) { previewEl.innerHTML = ''; return; }

    // De-duplicate by title (case-insensitive)
    const seen = new Set();
    const unique = links.filter(l => {
      const key = l.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    previewEl.innerHTML = '<span class="notes-links-label">Links:</span>';
    const allNotes = this.getNotes();

    unique.forEach(link => {
      const target = allNotes.find(n => n.title.toLowerCase() === link.title.toLowerCase());
      const tagType = link.symbol ? this.SYMBOL_MAP[link.symbol] : null;
      const tagDef = tagType ? this.TAG_TYPES[tagType] : null;

      const a = document.createElement('a');
      a.href = '#';
      a.addEventListener('click', e => {
        e.preventDefault();
        if (target) {
          this.openNote(target.id);
        } else {
          // Create new note, auto-tag if symbol link
          const now = new Date().toISOString();
          const notes = this.getNotes();
          const newNote = {
            id: this._uid(), folderId: this._activeFolder,
            title: link.title, content: '',
            tags: tagType ? [tagType] : [],
            pinned: false, created: now, modified: now,
          };
          notes.unshift(newNote);
          this.saveNotes(notes);
          this.openNote(newNote.id);
          this.renderSidebar();
        }
      });

      if (tagDef) {
        // Symbol link — colored by tag type
        a.className = 'notes-wiki-link notes-symbol-link' + (target ? '' : ' broken');
        a.style.setProperty('--tag-color', tagDef.color);
        a.innerHTML = `<span class="notes-link-sym">${link.symbol}</span>${this._esc(link.title)}`;
        a.title = target ? `Open ${tagDef.label}: "${target.title}"` : `Create ${tagDef.label}: "${link.title}"`;
      } else {
        // Generic [[wiki link]]
        a.className = 'notes-wiki-link' + (target ? '' : ' broken');
        a.textContent = link.title;
        a.title = target ? `Open "${target.title}"` : `Create "${link.title}"`;
      }

      previewEl.appendChild(a);
    });
  },

  _showRawContent() {
    // When focused, just show raw text (links are in preview bar)
    const previewEl = this.$('notes-link-preview');
    if (previewEl) previewEl.innerHTML = '';
  },

  // ---- MARKDOWN PARSER ----
  _markdownToHtml(text) {
    const allNotes = this.getNotes();

    // 1. Extract note links into placeholders so markdown doesn't mangle them
    const placeholders = [];
    const linkRe = /(?:(@|#|!|\$|&|~|\^|%)\[([^\]]+)\]|\[\[([^\]]+)\]\])/g;
    let raw = text.replace(linkRe, (m, symbol, symTitle, wikiTitle) => {
      const idx = placeholders.length;
      placeholders.push({ symbol: symbol || null, title: symTitle || wikiTitle });
      return `\x00LINK${idx}\x00`;
    });

    // 2. Escape HTML
    raw = this._esc(raw);

    // 3. Code blocks (``` ... ```) — must come before inline rules
    raw = raw.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="note-codeblock"><code>${code.trim()}</code></pre>`);

    // 4. Inline code (`code`)
    raw = raw.replace(/`([^`\n]+)`/g, '<code class="note-inline-code">$1</code>');

    // 5. Process line-by-line for block elements
    const lines = raw.split('\n');
    let html = '';
    let inList = false, listType = '';
    let inBlockquote = false;

    const flushList = () => { if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; } };
    const flushBq = () => { if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; } };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Skip lines that are part of a code block (already handled)
      if (line.includes('<pre class="note-codeblock">') || line.includes('</pre>')) {
        flushList(); flushBq();
        html += line + '\n';
        continue;
      }

      // Horizontal rule
      if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
        flushList(); flushBq();
        html += '<hr class="note-hr">';
        continue;
      }

      // Headers
      const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        flushList(); flushBq();
        const level = hMatch[1].length;
        html += `<h${level} class="note-h">${this._inlineMarkdown(hMatch[2])}</h${level}>`;
        continue;
      }

      // Blockquote
      if (line.match(/^&gt;\s?/)) {
        flushList();
        const content = line.replace(/^&gt;\s?/, '');
        if (!inBlockquote) { html += '<blockquote class="note-blockquote">'; inBlockquote = true; }
        html += this._inlineMarkdown(content) + '<br>';
        continue;
      } else {
        flushBq();
      }

      // Unordered list
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') { flushList(); html += '<ul class="note-list">'; inList = true; listType = 'ul'; }
        html += `<li>${this._inlineMarkdown(ulMatch[2])}</li>`;
        continue;
      }

      // Ordered list
      const olMatch = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
      if (olMatch) {
        if (!inList || listType !== 'ol') { flushList(); html += '<ol class="note-list">'; inList = true; listType = 'ol'; }
        html += `<li>${this._inlineMarkdown(olMatch[2])}</li>`;
        continue;
      }

      flushList();

      // Checkbox / task list
      const cbMatch = line.match(/^\[( |x|X)\]\s+(.+)$/);
      if (cbMatch) {
        const checked = cbMatch[1] !== ' ';
        html += `<div class="note-task"><span class="note-checkbox ${checked ? 'checked' : ''}">${checked ? '☑' : '☐'}</span> ${this._inlineMarkdown(cbMatch[2])}</div>`;
        continue;
      }

      // Empty line → paragraph break
      if (line.trim() === '') {
        html += '<br>';
        continue;
      }

      // Normal paragraph line
      html += `<div>${this._inlineMarkdown(line)}</div>`;
    }
    flushList(); flushBq();

    // 6. Restore note link placeholders as clickable spans
    html = html.replace(/\x00LINK(\d+)\x00/g, (_, idx) => {
      const p = placeholders[+idx];
      if (!p) return '';
      if (!p.symbol) {
        // [[wiki link]]
        const target = allNotes.find(n => n.title.toLowerCase() === p.title.toLowerCase());
        return `<span class="note-inline-link${target ? '' : ' broken'}" data-note-title="${this._esc(p.title)}">[[${this._esc(p.title)}]]</span>`;
      }
      const tagType = this.SYMBOL_MAP[p.symbol];
      const tagDef = tagType ? this.TAG_TYPES[tagType] : null;
      const target = allNotes.find(n => n.title.toLowerCase() === p.title.toLowerCase());
      const color = tagDef ? tagDef.color : '';
      const escSym = this._esc(p.symbol);
      return `<span class="note-inline-link${target ? '' : ' broken'}" style="--tag-color:${color}" data-note-title="${this._esc(p.title)}" data-symbol="${this._esc(p.symbol)}"><span class="note-link-sym">${escSym}</span>${this._esc(p.title)}</span>`;
    });

    return html;
  },

  _inlineMarkdown(text) {
    return text
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')   // ***bold italic***
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')                 // **bold**
      .replace(/__(.+?)__/g, '<strong>$1</strong>')                      // __bold__
      .replace(/\*(.+?)\*/g, '<em>$1</em>')                             // *italic*
      .replace(/_(.+?)_/g, '<em>$1</em>')                               // _italic_
      .replace(/~~(.+?)~~/g, '<del>$1</del>')                           // ~~strikethrough~~
      .replace(/==(.+?)==/g, '<mark class="note-highlight">$1</mark>'); // ==highlight==
  },

  _showRenderedView() {
    const editor = this.$('notes-editor-content');
    const rendered = this.$('notes-editor-rendered');
    if (!editor || !rendered || !editor.value.trim()) return;

    const html = this._markdownToHtml(editor.value);

    rendered.innerHTML = html;
    rendered.style.display = 'block';
    editor.style.display = 'none';

    // Clicking a link opens the note
    const allNotes = this.getNotes();
    rendered.querySelectorAll('.note-inline-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const title = el.dataset.noteTitle;
        const sym = el.dataset.symbol || null;
        const target = allNotes.find(n => n.title.toLowerCase() === title.toLowerCase());
        if (target) {
          this.openNote(target.id);
        } else {
          const now = new Date().toISOString();
          const notes = this.getNotes();
          const tagType = sym ? this.SYMBOL_MAP[sym] : null;
          const newNote = {
            id: this._uid(), folderId: this._activeFolder,
            title: title, content: '',
            tags: tagType ? [tagType] : [],
            pinned: false, created: now, modified: now,
          };
          notes.unshift(newNote);
          this.saveNotes(notes);
          this.openNote(newNote.id);
          this.renderSidebar();
        }
      });
    });

    // Clicking anywhere else in the rendered view switches back to editing
    rendered.addEventListener('click', (e) => {
      if (e.target.closest('.note-inline-link')) return;
      this._hideRenderedView();
      editor.focus();
    });
  },

  _hideRenderedView() {
    const editor = this.$('notes-editor-content');
    const rendered = this.$('notes-editor-rendered');
    if (editor) editor.style.display = '';
    if (rendered) { rendered.style.display = 'none'; rendered.innerHTML = ''; }
  },

  // ---- META DISPLAY ----
  _renderMeta(note) {
    const el = this.$('notes-editor-meta');
    if (!el) return;
    const created = new Date(note.created).toLocaleDateString();
    const modified = new Date(note.modified).toLocaleDateString();
    const folder = note.folderId ? this.getFolderById(note.folderId) : null;
    el.innerHTML = `<span>Created: ${created}</span><span>Modified: ${modified}</span>` +
      (folder ? `<span>📁 ${this._esc(folder.name)}</span>` : '');
  },

  _openLastNote() {
    const lastId = this._getLastOpen();
    if (lastId && this.getNoteById(lastId)) {
      this.openNote(lastId);
    } else {
      const notes = this.getNotes();
      if (notes.length) this.openNote(notes[0].id);
      else this._showEmptyEditor();
    }
  },

  // ---- RENDER SIDEBAR ----
  renderSidebar() {
    this.renderFolderTree();
    this.renderNoteList();
    this.renderTagFilters();
  },

  renderTagFilters() {
    const container = this.$('notes-tag-filters');
    if (!container) return;
    container.innerHTML = '';
    Object.entries(this.TAG_TYPES).forEach(([key, def]) => {
      const btn = document.createElement('button');
      btn.className = 'notes-filter-pill' + (this._filterTag === key ? ' active' : '');
      btn.dataset.tag = key;
      btn.style.setProperty('--tag-color', def.color);
      btn.innerHTML = `${def.icon} ${def.label}`;
      container.appendChild(btn);
    });
  },

  renderFolderTree() {
    const container = this.$('notes-folder-tree');
    if (!container) return;
    const folders = this.getFolders();
    container.innerHTML = '';

    // "All Notes" root
    const allBtn = document.createElement('button');
    allBtn.className = 'notes-folder-item' + (this._activeFolder === null ? ' active' : '');
    allBtn.innerHTML = `<span class="notes-folder-icon">📋</span><span class="notes-folder-name">All Notes</span><span class="notes-folder-count">${this.getNotes().length}</span>`;
    allBtn.addEventListener('click', () => { this._activeFolder = null; this.renderSidebar(); });
    // Drop target: move note to root (no folder)
    allBtn.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; allBtn.classList.add('drag-over'); });
    allBtn.addEventListener('dragleave', () => allBtn.classList.remove('drag-over'));
    allBtn.addEventListener('drop', (e) => {
      e.preventDefault(); allBtn.classList.remove('drag-over');
      const noteId = e.dataTransfer.getData('text/plain');
      if (noteId) { this._moveNote(noteId, null); }
    });
    container.appendChild(allBtn);

    // Render folders (flat for now, could be recursive for nesting)
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(f => this._renderFolderItem(f, container, 0));
  },

  _renderFolderItem(folder, container, depth) {
    const notes = this.getNotes().filter(n => n.folderId === folder.id);
    const subfolders = this.getFolders().filter(f => f.parentId === folder.id);

    const item = document.createElement('div');
    item.className = 'notes-folder-item-wrap';

    const hasChildren = subfolders.length > 0 || notes.length > 0;

    const btn = document.createElement('button');
    btn.className = 'notes-folder-item' + (this._activeFolder === folder.id ? ' active' : '');
    btn.style.paddingLeft = (12 + depth * 16) + 'px';
    const chevron = hasChildren ? `<span class="notes-folder-chevron ${folder.collapsed ? '' : 'open'}">▶</span>` : '<span class="notes-folder-chevron-spacer"></span>';
    btn.innerHTML = `${chevron}<span class="notes-folder-icon">${folder.collapsed ? '📁' : '📂'}</span><span class="notes-folder-name">${this._esc(folder.name)}</span><span class="notes-folder-count">${notes.length}</span>`;
    // Click chevron to toggle collapse; click name to select folder
    btn.addEventListener('click', (e) => {
      if (e.target.closest('.notes-folder-chevron')) {
        e.stopPropagation();
        this._toggleFolderCollapse(folder.id);
        return;
      }
      this._activeFolder = folder.id;
      this.renderSidebar();
    });

    // Drop target: move note into this folder
    btn.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; btn.classList.add('drag-over'); });
    btn.addEventListener('dragleave', () => btn.classList.remove('drag-over'));
    btn.addEventListener('drop', (e) => {
      e.preventDefault(); btn.classList.remove('drag-over');
      const noteId = e.dataTransfer.getData('text/plain');
      if (noteId) { this._moveNote(noteId, folder.id); }
    });

    // Visible action buttons (rename / delete)
    const actions = document.createElement('span');
    actions.className = 'notes-folder-actions';
    const renameBtn = document.createElement('button');
    renameBtn.className = 'notes-folder-act-btn';
    renameBtn.title = 'Rename folder';
    renameBtn.textContent = '✎';
    renameBtn.addEventListener('click', e => { e.stopPropagation(); this.renameFolder(folder.id); });
    const delBtn = document.createElement('button');
    delBtn.className = 'notes-folder-act-btn notes-folder-act-del';
    delBtn.title = 'Delete folder';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', e => { e.stopPropagation(); this.deleteFolder(folder.id); });
    actions.appendChild(renameBtn);
    actions.appendChild(delBtn);
    btn.appendChild(actions);

    // Context menu (keep as fallback)
    btn.addEventListener('contextmenu', e => {
      e.preventDefault();
      this._showFolderMenu(folder, e);
    });

    item.appendChild(btn);
    container.appendChild(item);

    // Render subfolders
    if (!folder.collapsed) {
      subfolders.forEach(sf => this._renderFolderItem(sf, container, depth + 1));
    }
  },

  _showFolderMenu(folder, e) {
    // Remove existing
    document.querySelectorAll('.notes-ctx-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'notes-ctx-menu';
    menu.style.top = e.clientY + 'px';
    menu.style.left = e.clientX + 'px';
    menu.innerHTML = `
      <button data-action="rename">Rename</button>
      <button data-action="delete">Delete</button>
      <button data-action="add-note">Add Note Here</button>
    `;
    menu.addEventListener('click', ev => {
      const action = ev.target.dataset.action;
      if (action === 'rename') this.renameFolder(folder.id);
      else if (action === 'delete') this.deleteFolder(folder.id);
      else if (action === 'add-note') this.createNote(folder.id);
      menu.remove();
    });
    document.body.appendChild(menu);
    setTimeout(() => {
      const closer = () => { menu.remove(); document.removeEventListener('click', closer); };
      document.addEventListener('click', closer);
    }, 0);
  },

  renderNoteList() {
    const container = this.$('notes-list');
    if (!container) return;
    let notes = this.getNotes();

    // Filter by folder
    if (this._activeFolder !== null) {
      notes = notes.filter(n => n.folderId === this._activeFolder);
    }

    // Filter by tag
    if (this._filterTag) {
      notes = notes.filter(n => n.tags.includes(this._filterTag));
    }

    // Filter by search
    if (this._searchQuery) {
      const q = this._searchQuery;
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => this.TAG_TYPES[t]?.label.toLowerCase().includes(q))
      );
    }

    // Sort: pinned first, then by modified date
    notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.modified) - new Date(a.modified);
    });

    container.innerHTML = '';
    if (!notes.length) {
      container.innerHTML = '<div class="notes-empty">No notes found.</div>';
      return;
    }

    notes.forEach(note => {
      const card = document.createElement('button');
      card.className = 'notes-list-item' + (note.id === this._activeNoteId ? ' active' : '');
      const preview = note.content.slice(0, 80).replace(/\n/g, ' ');
      const tagPills = note.tags.map(t => {
        const def = this.TAG_TYPES[t];
        return def ? `<span class="notes-mini-tag" style="--tag-color:${def.color}">${def.icon}</span>` : '';
      }).join('');

      card.innerHTML = `
        <div class="notes-list-item-head">
          ${note.pinned ? '<span class="notes-pin-icon" title="Pinned">📌</span>' : ''}
          <span class="notes-list-title">${this._esc(note.title)}</span>
          <span class="notes-list-tags">${tagPills}</span>
        </div>
        <div class="notes-list-preview">${this._esc(preview)}</div>
        <div class="notes-list-date">${this._relativeDate(note.modified)}</div>
      `;
      card.addEventListener('click', () => this.openNote(note.id));

      // Drag & drop: make note cards draggable
      card.draggable = true;
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', note.id);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));

      container.appendChild(card);
    });
  },

  // ---- UTILITIES ----
  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  _relativeDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 7) return days + 'd ago';
    return d.toLocaleDateString();
  },
};
