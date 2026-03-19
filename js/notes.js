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
  _selectedNoteIds: new Set(),   // multi-select state
  _selectedFolderIds: new Set(), // folder multi-select state
  _lastClickedId: null,          // anchor for shift-click / shift-arrow range (note or folder id)

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
    if (this._bound) return;
    this._bound = true;
    // New note button
    this.$('notes-btn-new')?.addEventListener('click', () => this.createNote());
    // New folder button
    this.$('notes-btn-new-folder')?.addEventListener('click', () => this.createFolder());
    // Search input
    const search = this.$('notes-search');
    if (search) {
      search.addEventListener('input', () => {
        this._searchQuery = search.value.trim().toLowerCase();
        this.renderFolderTree();
      });
    }
    // Tag filter pills
    this.$('notes-tag-filters')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-tag]');
      if (!btn) return;
      const tag = btn.dataset.tag;
      this._filterTag = this._filterTag === tag ? null : tag;
      this.renderTagFilters();
      this.renderFolderTree();
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

    // Document-level Shift+↑/↓ for sidebar range selection.
    // Must be document-level because after any openNote() call, renderFolderTree() destroys
    // all buttons and focus falls to <body> — a tree-container handler never fires in that state.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      if (!this._lastClickedId) return;
      // Don't intercept when the user is typing
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      // Only fire when the notes folder tree is visible on screen
      const treeEl = this.$('notes-folder-tree');
      if (!treeEl || !treeEl.offsetParent) return;
      e.preventDefault();

      if (e.shiftKey) {
        // Shift+Arrow: extend selection within same level
        const sameLevel = this._getSameLevelElements(this._lastClickedId);
        const idx = sameLevel.findIndex(el => (el.dataset.noteId || el.dataset.folderId) === this._lastClickedId);
        if (idx === -1) return;
        const newIdx = e.key === 'ArrowDown' ? Math.min(idx + 1, sameLevel.length - 1) : Math.max(idx - 1, 0);
        if (newIdx === idx) return;
        if (this._selectedNoteIds.size === 0 && this._selectedFolderIds.size === 0) {
          const anchor = sameLevel[idx];
          if (anchor.dataset.noteId) this._selectedNoteIds.add(anchor.dataset.noteId);
          if (anchor.dataset.folderId) this._selectedFolderIds.add(anchor.dataset.folderId);
        }
        const nextEl = sameLevel[newIdx];
        if (nextEl.dataset.noteId) this._selectedNoteIds.add(nextEl.dataset.noteId);
        if (nextEl.dataset.folderId) this._selectedFolderIds.add(nextEl.dataset.folderId);
        this._lastClickedId = nextEl.dataset.noteId || nextEl.dataset.folderId;
        nextEl.focus();
        this._updateSelectionUI();
      } else {
        // Plain Arrow: move cursor through all visible items in DOM order
        const all = [...document.querySelectorAll('[data-note-id], [data-folder-id]')];
        const idx = all.findIndex(el => (el.dataset.noteId || el.dataset.folderId) === this._lastClickedId);
        const startIdx = idx === -1 ? 0 : idx;
        const newIdx = e.key === 'ArrowDown' ? Math.min(startIdx + 1, all.length - 1) : Math.max(startIdx - 1, 0);
        if (newIdx === startIdx && idx !== -1) return;
        const nextEl = all[newIdx];
        this._selectedNoteIds.clear();
        this._selectedFolderIds.clear();
        this._lastClickedId = nextEl.dataset.noteId || nextEl.dataset.folderId;
        nextEl.focus();
        this._updateSelectionUI();
      }
    });

    // Trash drop zone
    const trash = this.$('notes-trash');
    if (trash) {
      trash.addEventListener('dragover',  (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; trash.classList.add('drag-over'); });
      trash.addEventListener('dragleave', () => trash.classList.remove('drag-over'));
      trash.addEventListener('drop', (e) => {
        e.preventDefault(); trash.classList.remove('drag-over');
        const raw = e.dataTransfer.getData('application/x-dnd-items');
        if (!raw) return;
        const { noteIds = [], folderIds = [] } = JSON.parse(raw);
        if (!noteIds.length && !folderIds.length) return;
        const parts = [];
        if (folderIds.length) parts.push(`<strong>${folderIds.length} folder${folderIds.length !== 1 ? 's' : ''}</strong> and all their notes`);
        if (noteIds.length) parts.push(`<strong>${noteIds.length} note${noteIds.length !== 1 ? 's' : ''}</strong>`);
        this._dialog({
          title: 'Delete Items',
          body: `Permanently delete ${parts.join(' and ')}? This cannot be undone.`,
          okText: 'Delete', danger: true,
        }, () => {
          folderIds.forEach(id => this._deleteRecursive(id));
          this._selectedFolderIds = new Set([...this._selectedFolderIds].filter(id => !folderIds.includes(id)));
          if (noteIds.length) {
            let notes = this.getNotes();
            notes = notes.filter(n => !noteIds.includes(n.id));
            this.saveNotes(notes);
            this._selectedNoteIds = new Set([...this._selectedNoteIds].filter(id => !noteIds.includes(id)));
            if (noteIds.includes(this._activeNoteId)) this._showEmptyEditor();
          }
          this.renderSidebar();
        });
      });
    }

  },

  // ---- FOLDER CRUD ----
  createFolder() {
    this._dialog({ type: 'prompt', title: 'New Folder', body: 'Enter folder name:', okText: 'Create' }, (name) => {
      if (!name || !name.trim()) return;
      const folders = this.getFolders();
      folders.push({ id: this._uid(), name: name.trim(), parentId: this._activeFolder, color: null, order: folders.length, collapsed: false });
      this.saveFolders(folders);
      this.renderSidebar();
    });
  },

  renameFolder(id) {
    const folders = this.getFolders();
    const f = folders.find(x => x.id === id);
    if (!f) return;
    this._dialog({ type: 'prompt', title: 'Rename Folder', body: `Rename "${this._esc(f.name)}" to:`, defaultValue: f.name, okText: 'Rename' }, (name) => {
      if (!name || !name.trim()) return;
      f.name = name.trim();
      this.saveFolders(folders);
      this.renderSidebar();
    });
  },

  _countFolderNotes(folderId) {
    const notes = this.getNotes(), folders = this.getFolders();
    let count = 0;
    const walk = (id) => {
      count += notes.filter(n => n.folderId === id).length;
      folders.filter(f => f.parentId === id).forEach(f => walk(f.id));
    };
    walk(folderId);
    return count;
  },

  deleteFolder(id) {
    let folders = this.getFolders();
    const folder = folders.find(f => f.id === id);
    if (!folder) return;
    const noteCount = this._countFolderNotes(id);
    const body = noteCount > 0
      ? `<span class="nd-warn">This will permanently delete <strong>"${this._esc(folder.name)}"</strong> and <strong>${noteCount} note${noteCount !== 1 ? 's' : ''}</strong> inside it. This cannot be undone.</span>`
      : `Delete folder <strong>"${this._esc(folder.name)}"</strong>?`;
    this._dialog({ title: 'Delete Folder', body, okText: 'Delete', danger: noteCount > 0 }, () => {
      // Collect all folder IDs in the tree
      folders = this.getFolders();
      const toDelete = new Set();
      const collect = (fId) => { toDelete.add(fId); folders.filter(f => f.parentId === fId).forEach(f => collect(f.id)); };
      collect(id);
      // Delete notes inside
      let notes = this.getNotes();
      notes = notes.filter(n => !toDelete.has(n.folderId));
      this.saveNotes(notes);
      // Delete folders
      folders = folders.filter(f => !toDelete.has(f.id));
      this.saveFolders(folders);
      if (toDelete.has(this._activeFolder)) this._activeFolder = null;
      this.renderSidebar();
    });
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
    this.renderFolderTree();

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
    this.renderFolderTree();
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
    this.renderFolderTree();
  },

  _deleteActiveNote() {
    if (!this._activeNoteId) return;
    this._dialog({ title: 'Delete Note', body: 'Delete this note? This cannot be undone.', okText: 'Delete', danger: true }, () => {
      let notes = this.getNotes();
      notes = notes.filter(n => n.id !== this._activeNoteId);
      this.saveNotes(notes);
      this._showEmptyEditor();
      this.renderSidebar();
    });
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
    this.renderFolderTree();
  },

  removeTag(noteId, tag) {
    const notes = this.getNotes();
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.tags = note.tags.filter(t => t !== tag);
    note.modified = new Date().toISOString();
    this.saveNotes(notes);
    if (noteId === this._activeNoteId) this._renderNoteTags(note);
    this.renderFolderTree();
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

  _moveNotes(ids, folderId) {
    const notes = this.getNotes();
    ids.forEach(id => {
      const note = notes.find(n => n.id === id);
      if (note) { note.folderId = folderId; note.modified = new Date().toISOString(); }
    });
    this.saveNotes(notes);
    this.renderSidebar();
  },

  _moveFolder(folderId, newParentId) {
    if (folderId === newParentId) return; // can't drop into itself
    // Prevent dropping into a descendant
    const folders = this.getFolders();
    const isDescendant = (ancestorId, targetId) => {
      let f = folders.find(x => x.id === targetId);
      while (f) {
        if (f.parentId === ancestorId) return true;
        f = folders.find(x => x.id === f.parentId);
      }
      return false;
    };
    if (newParentId && isDescendant(folderId, newParentId)) return;
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    folder.parentId = newParentId;
    this.saveFolders(folders);
    this.renderSidebar();
  },

  // Returns the parent ID of any note or folder (null = root)
  _getItemParent(id) {
    const note = this.getNotes().find(n => n.id === id);
    if (note) return note.folderId ?? null;
    const folder = this.getFolders().find(f => f.id === id);
    return folder ? (folder.parentId ?? null) : null;
  },

  // Returns DOM elements ([data-note-id] or [data-folder-id]) that share the same parent as anchorId
  _getSameLevelElements(anchorId) {
    const parentId = this._getItemParent(anchorId);
    return [...document.querySelectorAll('[data-note-id], [data-folder-id]')]
      .filter(el => this._getItemParent(el.dataset.noteId || el.dataset.folderId) === parentId);
  },

  _deleteRecursive(folderId) {
    this.getFolders().filter(f => f.parentId === folderId).forEach(sf => this._deleteRecursive(sf.id));
    this.saveFolders(this.getFolders().filter(f => f.id !== folderId));
    this.saveNotes(this.getNotes().filter(n => n.folderId !== folderId));
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
      // Use a synchronous-style flag; dialog is async so we wrap the rest of export in the callback
      this._dialog({
        type: 'choice', title: 'Export Scope',
        body: `Export only <strong>"${this._esc(folderName)}"</strong> or all notes?`,
        cancelText: 'Cancel',
        choices: [
          { text: 'This Folder', value: 'folder' },
          { text: 'All Notes',   value: 'all'    },
        ],
      }, (choice) => {
        if (choice === 'folder') {
          exportNotes   = notes.filter(n => n.folderId === this._activeFolder);
          exportFolders = [this.getFolderById(this._activeFolder)].filter(Boolean);
          scope = this._activeFolder;
        }
        this._doExport(exportFolders, exportNotes, scope, charName);
      });
      return; // rest handled in callback
    }

    // No active folder — export all immediately
    this._doExport(exportFolders, exportNotes, scope, charName);
  },

  _doExport(exportFolders, exportNotes, scope, charName) {
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
          this._dialog({ type: 'alert', title: 'Invalid File', body: 'This does not appear to be a D&D notes export.', okText: 'OK' });
          return;
        }

        const importFolders = data.folders || [];
        const importNotes = data.notes || [];

        if (!importNotes.length && !importFolders.length) {
          this._dialog({ type: 'alert', title: 'Empty File', body: 'This export file is empty — nothing to import.', okText: 'OK' });
          return;
        }

        // Show summary and ask for confirmation
        const fromChar = data.characterName ? ` from <strong>${this._esc(data.characterName)}</strong>` : '';
        const info = `Import <strong>${importNotes.length}</strong> note(s) and <strong>${importFolders.length}</strong> folder(s)${fromChar}?`;

        this._dialog({ title: 'Import Notes', body: info, okText: 'Import' }, () => {
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
              folderIdRemap[f.id] = existing.id;
            } else {
              const newId = this._uid();
              folderIdRemap[f.id] = newId;
              newFolders.push({ ...f, id: newId, parentId: f.parentId ? (folderIdRemap[f.parentId] || null) : null });
            }
          });

          // Find conflicts
          const conflicts = importNotes.filter(n => existingTitles.has(n.title.toLowerCase()));
          const doImport = (overwrite) => {
            let imported = 0, skipped = 0, overwritten = 0;
            const newNotes = [...existingNotes];
            importNotes.forEach(n => {
              const existing = existingTitles.get(n.title.toLowerCase());
              if (existing) {
                if (overwrite) {
                  existing.content = n.content;
                  existing.tags = [...new Set([...existing.tags, ...n.tags])];
                  existing.modified = new Date().toISOString();
                  overwritten++;
                } else { skipped++; }
              } else {
                newNotes.unshift({ ...n, id: this._uid(), folderId: n.folderId ? (folderIdRemap[n.folderId] || null) : null });
                imported++;
              }
            });
            this.saveFolders(newFolders);
            this.saveNotes(newNotes);
            this.renderSidebar();
            this._dirty = false;
            let msg = `Import complete: ${imported} added`;
            if (overwritten) msg += `, ${overwritten} overwritten`;
            if (skipped) msg += `, ${skipped} skipped`;
            this._dialog({ type: 'alert', title: 'Done', body: msg + '.', okText: 'OK' });
          };

          if (conflicts.length) {
            const firstTitle = this._esc(conflicts[0].title);
            const more = conflicts.length > 1 ? ` (+${conflicts.length - 1} more)` : '';
            this._dialog({
              type: 'choice', title: 'Duplicate Notes',
              body: `<strong>"${firstTitle}"</strong>${more} already exist${conflicts.length > 1 ? '' : 's'}. How should duplicates be handled?`,
              cancelText: 'Cancel',
              choices: [
                { text: 'Overwrite existing', value: true,  danger: true },
                { text: 'Keep existing (skip)', value: false },
              ],
            }, (overwrite) => doImport(overwrite));
          } else {
            doImport(false);
          }
        });

      } catch (err) {
        this._dialog({ type: 'alert', title: 'Import Failed', body: 'Failed to import notes: ' + err.message, okText: 'OK' });
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
    const allNotes = this.getNotes();
    const trash = this.$('notes-trash');
    container.innerHTML = '';

    // ---- Search / tag-filter mode: show flat results ----
    if (this._searchQuery || this._filterTag) {
      let results = allNotes;
      if (this._filterTag) results = results.filter(n => n.tags.includes(this._filterTag));
      if (this._searchQuery) {
        const q = this._searchQuery;
        results = results.filter(n =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some(t => this.TAG_TYPES[t]?.label.toLowerCase().includes(q))
        );
      }
      const header = document.createElement('div');
      header.className = 'notes-tree-section-header';
      header.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
      container.appendChild(header);
      if (!results.length) {
        const empty = document.createElement('div');
        empty.className = 'notes-empty';
        empty.textContent = 'No notes found.';
        container.appendChild(empty);
      } else {
        results.forEach(note => this._renderNoteTreeItem(note, container, 0));
      }
      return;
    }

    // ---- Normal mode ----
    // "All Notes" — drop target for moving to root
    const allBtn = document.createElement('button');
    allBtn.className = 'notes-folder-item' + (this._activeFolder === null ? ' active' : '');
    allBtn.innerHTML = `<span class="notes-folder-icon">📋</span><span class="notes-folder-name">All Notes</span><span class="notes-folder-count">${allNotes.length}</span>`;
    allBtn.addEventListener('click', () => { this._activeFolder = null; this.renderSidebar(); });
    allBtn.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; allBtn.classList.add('drag-over'); });
    allBtn.addEventListener('dragleave', () => allBtn.classList.remove('drag-over'));
    allBtn.addEventListener('drop', (e) => {
      e.preventDefault(); allBtn.classList.remove('drag-over');
      const raw = e.dataTransfer.getData('application/x-dnd-items');
      if (raw) {
        const { noteIds = [], folderIds = [] } = JSON.parse(raw);
        folderIds.forEach(fid => this._moveFolder(fid, null));
        if (noteIds.length) this._moveNotes(noteIds, null);
      }
    });
    container.appendChild(allBtn);

    // Folders
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(f => this._renderFolderItem(f, container, 0));

    // Root notes (no folder) — shown at bottom of tree
    const rootNotes = allNotes.filter(n => !n.folderId);
    if (rootNotes.length) {
      rootNotes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.modified) - new Date(a.modified);
      });
      rootNotes.forEach(note => this._renderNoteTreeItem(note, container, 0));
    }
    if (trash) container.appendChild(trash);
  },

  _renderFolderItem(folder, container, depth) {
    const notes = this.getNotes().filter(n => n.folderId === folder.id);
    const subfolders = this.getFolders().filter(f => f.parentId === folder.id);

    const item = document.createElement('div');
    item.className = 'notes-folder-item-wrap';

    const hasChildren = subfolders.length > 0 || notes.length > 0;

    const btn = document.createElement('button');
    btn.className = 'notes-folder-item' +
      (this._activeFolder === folder.id ? ' active' : '') +
      (this._selectedFolderIds.has(folder.id) ? ' selected' : '');
    btn.dataset.folderId = folder.id;
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
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const hasSelection = this._selectedNoteIds.size > 0 || this._selectedFolderIds.size > 0;
        if (hasSelection && this._getItemParent(folder.id) !== this._getItemParent(this._lastClickedId)) return;
        if (this._selectedFolderIds.has(folder.id)) this._selectedFolderIds.delete(folder.id);
        else this._selectedFolderIds.add(folder.id);
        this._lastClickedId = folder.id;
        this._updateSelectionUI();
        return;
      }
      if (e.shiftKey && this._lastClickedId) {
        e.preventDefault();
        const sameLevel = this._getSameLevelElements(this._lastClickedId);
        const fromIdx = sameLevel.findIndex(el => (el.dataset.noteId || el.dataset.folderId) === this._lastClickedId);
        const toIdx   = sameLevel.findIndex(el => el.dataset.folderId === folder.id);
        if (fromIdx !== -1 && toIdx !== -1) {
          const [lo, hi] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
          for (let i = lo; i <= hi; i++) {
            if (sameLevel[i].dataset.noteId) this._selectedNoteIds.add(sameLevel[i].dataset.noteId);
            if (sameLevel[i].dataset.folderId) this._selectedFolderIds.add(sameLevel[i].dataset.folderId);
          }
          this._lastClickedId = folder.id;
          this._updateSelectionUI();
        }
        return;
      }
      this._selectedNoteIds.clear();
      this._selectedFolderIds.clear();
      this._updateSelectionUI();
      this._lastClickedId = folder.id;
      this._activeFolder = folder.id;
      this.renderSidebar();
    });

    // Drag source: drag this folder (and any co-selected items) to another folder or trash
    btn.draggable = true;
    btn.addEventListener('dragstart', (e) => {
      const folderIds = this._selectedFolderIds.has(folder.id) ? [...this._selectedFolderIds] : [folder.id];
      const noteIds = [...this._selectedNoteIds];
      e.dataTransfer.setData('application/x-dnd-items', JSON.stringify({ noteIds, folderIds }));
      e.dataTransfer.setData('text/plain', folderIds[0]);
      e.dataTransfer.effectAllowed = 'move';
      btn.classList.add('dragging');
    });
    btn.addEventListener('dragend', () => btn.classList.remove('dragging'));

    // Drop target: move note/folder into this folder
    btn.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; btn.classList.add('drag-over'); });
    btn.addEventListener('dragleave', () => btn.classList.remove('drag-over'));
    btn.addEventListener('drop', (e) => {
      e.preventDefault(); btn.classList.remove('drag-over');
      const raw = e.dataTransfer.getData('application/x-dnd-items');
      if (raw) {
        const { noteIds = [], folderIds = [] } = JSON.parse(raw);
        folderIds.forEach(fid => { if (fid !== folder.id) this._moveFolder(fid, folder.id); });
        if (noteIds.length) this._moveNotes(noteIds, folder.id);
      }
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

    // Render subfolders and notes
    if (!folder.collapsed) {
      subfolders.forEach(sf => this._renderFolderItem(sf, container, depth + 1));
      notes.forEach(note => this._renderNoteTreeItem(note, container, depth + 1));
    }
  },

  _renderNoteTreeItem(note, container, depth) {
    const btn = document.createElement('button');
    btn.className = 'notes-folder-item notes-tree-note' +
      (note.id === this._activeNoteId ? ' active' : '') +
      (this._selectedNoteIds.has(note.id) ? ' selected' : '');
    btn.dataset.noteId = note.id;
    btn.style.paddingLeft = (12 + depth * 16) + 'px';
    btn.innerHTML = `<span class="notes-folder-chevron-spacer"></span><span class="notes-folder-icon">📄</span><span class="notes-folder-name">${this._esc(note.title)}</span>`;

    btn.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const hasSelection = this._selectedNoteIds.size > 0 || this._selectedFolderIds.size > 0;
        if (hasSelection && this._getItemParent(note.id) !== this._getItemParent(this._lastClickedId)) return;
        this._toggleNoteSelection(note.id);
        this._lastClickedId = note.id;
        return;
      }
      if (e.shiftKey && this._lastClickedId) {
        e.preventDefault();
        const sameLevel = this._getSameLevelElements(this._lastClickedId);
        const fromIdx = sameLevel.findIndex(el => (el.dataset.noteId || el.dataset.folderId) === this._lastClickedId);
        const toIdx   = sameLevel.findIndex(el => el.dataset.noteId === note.id);
        if (fromIdx !== -1 && toIdx !== -1) {
          const [lo, hi] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
          for (let i = lo; i <= hi; i++) {
            if (sameLevel[i].dataset.noteId) this._selectedNoteIds.add(sameLevel[i].dataset.noteId);
            if (sameLevel[i].dataset.folderId) this._selectedFolderIds.add(sameLevel[i].dataset.folderId);
          }
          this._lastClickedId = note.id;
          this._updateSelectionUI();
        }
        return;
      }
      this._selectedNoteIds.clear();
      this._selectedFolderIds.clear();
      this._updateSelectionUI();
      this._lastClickedId = note.id;
      this.openNote(note.id);
    });

    btn.draggable = true;
    btn.addEventListener('dragstart', (e) => {
      const noteIds = this._selectedNoteIds.has(note.id) ? [...this._selectedNoteIds] : [note.id];
      const folderIds = [...this._selectedFolderIds];
      e.dataTransfer.setData('application/x-dnd-items', JSON.stringify({ noteIds, folderIds }));
      e.dataTransfer.setData('text/plain', noteIds[0]);
      e.dataTransfer.effectAllowed = 'move';
      btn.classList.add('dragging');
    });
    btn.addEventListener('dragend', () => btn.classList.remove('dragging'));

    container.appendChild(btn);
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

  renderNoteList() { /* replaced by renderFolderTree */ },

  // ---- CUSTOM DIALOG ----
  // type: 'confirm' | 'alert' | 'prompt' | 'choice'
  // choices: [{text, value, danger}] — used when type='choice' (replaces ok button)
  _dialog({ type = 'confirm', title = '', body = '', okText = 'OK', cancelText = 'Cancel',
            defaultValue = '', danger = false, choices = null } = {}, onOk, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'nd-overlay';
    const isPrompt = type === 'prompt';
    const isAlert  = type === 'alert';
    const isChoice = type === 'choice' && choices?.length;
    const inputId  = 'nd-inp-' + Math.random().toString(36).slice(2);

    let choiceBtns = '';
    if (isChoice) {
      choiceBtns = choices.map((c, i) =>
        `<button class="nd-btn nd-btn-choice${c.danger ? ' nd-btn-danger' : ''}" data-idx="${i}">${this._esc(c.text)}</button>`
      ).join('');
    }

    overlay.innerHTML = `
      <div class="nd-box" role="dialog" aria-modal="true">
        ${title ? `<div class="nd-title">${this._esc(title)}</div>` : ''}
        ${body  ? `<div class="nd-body">${body}</div>` : ''}
        ${isPrompt ? `<input id="${inputId}" class="nd-input" type="text" autocomplete="off">` : ''}
        <div class="nd-footer">
          ${!isAlert && !isChoice ? `<button class="nd-btn nd-btn-cancel">${this._esc(cancelText)}</button>` : ''}
          ${isChoice ? `<button class="nd-btn nd-btn-cancel">${this._esc(cancelText)}</button>` : ''}
          ${isChoice ? choiceBtns : `<button class="nd-btn nd-btn-ok${danger ? ' nd-btn-danger' : ''}">${this._esc(okText)}</button>`}
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('nd-open'));

    // Set input default value after insertion
    if (isPrompt) {
      const inp = overlay.querySelector('.nd-input');
      inp.value = defaultValue;
      inp.focus(); inp.select();
    } else {
      overlay.querySelector('.nd-btn-ok, .nd-btn-choice')?.focus();
    }

    const close = (confirmed, value) => {
      overlay.classList.remove('nd-open');
      setTimeout(() => overlay.remove(), 180);
      overlay.removeEventListener('keydown', onKey);
      if (confirmed) onOk?.(value);
      else onCancel?.();
    };

    overlay.querySelector('.nd-btn-ok')?.addEventListener('click', () =>
      close(true, isPrompt ? overlay.querySelector('.nd-input').value : undefined));
    overlay.querySelector('.nd-btn-cancel')?.addEventListener('click', () => close(false));
    overlay.querySelectorAll('.nd-btn-choice').forEach(btn =>
      btn.addEventListener('click', () => close(true, choices[+btn.dataset.idx].value)));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Enter' && !isPrompt && !isChoice) { e.preventDefault(); close(true); }
      if (e.key === 'Enter' && isPrompt) { e.preventDefault(); close(true, overlay.querySelector('.nd-input').value); }
    };
    overlay.addEventListener('keydown', onKey);
  },

  // ---- MULTI-SELECT ----
  _toggleNoteSelection(noteId) {
    if (this._selectedNoteIds.has(noteId)) this._selectedNoteIds.delete(noteId);
    else this._selectedNoteIds.add(noteId);
    this._updateSelectionUI();
  },

  _rangeSelectNotes(fromId, toId, notes) {
    const fromIdx = notes.findIndex(n => n.id === fromId);
    const toIdx   = notes.findIndex(n => n.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [lo, hi] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    for (let i = lo; i <= hi; i++) this._selectedNoteIds.add(notes[i].id);
    this._lastClickedId = toId;
    this._updateSelectionUI();
  },

  _updateSelectionUI() {
    document.querySelectorAll('[data-note-id]').forEach(el =>
      el.classList.toggle('selected', this._selectedNoteIds.has(el.dataset.noteId)));
    document.querySelectorAll('[data-folder-id]').forEach(el =>
      el.classList.toggle('selected', this._selectedFolderIds.has(el.dataset.folderId)));
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
