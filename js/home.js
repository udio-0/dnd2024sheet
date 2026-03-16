/* =============================================
   HOME PAGE - Character Manager
   ============================================= */
'use strict';

window.Home = {
  init() {
    document.getElementById('btn-new-char')?.addEventListener('click', () => Router.navigate('#wizard'));
    document.getElementById('btn-import-home')?.addEventListener('click', () => document.getElementById('import-file-home')?.click());
    document.getElementById('import-file-home')?.addEventListener('change', function () {
      const file = this.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const id = CharStore.importCharacter(e.target.result);
          // Immediately save to folder if connected
          if (typeof FileSync !== 'undefined' && FileSync.hasFolder()) {
            FileSync.saveCharacterToFile(id);
          }
          Home.render();
        } catch (err) { alert('Invalid character file: ' + err.message); }
      };
      reader.readAsText(file);
      this.value = '';
    });

    // Folder picker
    const folderBtn = document.getElementById('btn-open-folder');
    const changeBtn = document.getElementById('btn-change-folder');
    if (folderBtn) {
      folderBtn.addEventListener('click', () => this._openFolder());
      // Hide if File System Access API not supported
      if (typeof FileSync !== 'undefined' && !FileSync.isSupported()) {
        folderBtn.style.display = 'none';
      }
    }
    if (changeBtn) {
      changeBtn.addEventListener('click', () => this._openFolder());
    }
  },

  async _openFolder() {
    if (typeof FileSync === 'undefined') {
      alert('FileSync module not loaded');
      return;
    }
    if (!FileSync.isSupported()) {
      alert('Your browser does not support the File System Access API.\nPlease use Chrome or Edge.');
      return;
    }
    try {
      const ok = await FileSync.pickFolder();
      if (!ok) return;

      // Sync characters from folder
      await FileSync.syncFromFolder();
      FileSync.markAllClean(); // freshly loaded = clean

      this._updateFolderStatus();
      this.render();
    } catch (err) {
      console.error('Open folder error:', err);
      alert('Error opening folder: ' + err.message);
    }
  },

  _updateFolderStatus() {
    const status = document.getElementById('folder-status');
    const folderBtn = document.getElementById('btn-open-folder');
    if (typeof FileSync === 'undefined' || !FileSync.hasFolder()) {
      if (status) status.style.display = 'none';
      if (folderBtn) folderBtn.style.display = '';
      return;
    }
    if (status) status.style.display = 'inline-flex';
    if (folderBtn) folderBtn.style.display = 'none';
    // Show folder name
    const textEl = document.getElementById('folder-status-text');
    if (textEl && FileSync._dirHandle) {
      textEl.textContent = FileSync._dirHandle.name || 'Local folder';
    }
  },

  async render() {
    // Auto-sync from folder if handle was restored from a previous session
    if (typeof FileSync !== 'undefined' && FileSync.hasFolder() && !this._synced) {
      this._synced = true;
      const ok = await FileSync.ensurePermission();
      if (ok) {
        await FileSync.syncFromFolder();
        FileSync.markAllClean();
      }
    }
    this._updateFolderStatus();
    const chars = CharStore.listCharacters();
    const grid = document.getElementById('character-cards');
    const empty = document.getElementById('empty-state');
    if (!grid) return;
    grid.innerHTML = '';

    if (!chars.length) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    chars.forEach(c => {
      const card = document.createElement('div');
      card.className = 'char-card';
      const classIcon = this._classIcon(c.class);
      const timeAgo = this._timeAgo(c.updatedAt);

      card.innerHTML = `
        <div class="char-card-icon">${classIcon}</div>
        <div class="char-card-info">
          <div class="char-card-name">${c.name || 'Unnamed'}</div>
          <div class="char-card-meta">
            Level ${c.level || 1} ${c.species || ''} ${c.class || ''}
          </div>
          <div class="char-card-time">${timeAgo}</div>
        </div>
        <div class="char-card-actions">
          <button class="btn btn-primary btn-sm card-edit" title="Edit">Edit</button>
          <button class="btn btn-sm card-export" title="Export">Export</button>
          <button class="btn btn-danger btn-sm card-delete" title="Delete">Delete</button>
        </div>
      `;

      card.querySelector('.card-edit').addEventListener('click', () => {
        Router.navigate('#sheet/' + c.id);
      });

      card.querySelector('.card-export').addEventListener('click', () => {
        const json = CharStore.exportCharacter(c.id);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(c.name || 'character').replace(/[^a-z0-9]/gi, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });

      card.querySelector('.card-delete').addEventListener('click', async () => {
        if (confirm(`Delete "${c.name}"? This cannot be undone.`)) {
          // Also delete from folder
          if (typeof FileSync !== 'undefined') {
            await FileSync.deleteCharacterFile(c.id);
          }
          CharStore.deleteCharacter(c.id);
          this.render();
        }
      });

      // Click card body to edit
      card.querySelector('.char-card-info').addEventListener('click', () => {
        Router.navigate('#sheet/' + c.id);
      });

      grid.appendChild(card);
    });
  },

  _classIcon(cls) {
    const icons = {
      Barbarian: '⚔', Bard: '🎵', Cleric: '✝', Druid: '🌿',
      Fighter: '🗡', Monk: '👊', Paladin: '🛡', Ranger: '🏹',
      Rogue: '🗝', Sorcerer: '✨', Warlock: '🔮', Wizard: '📖',
      Artificer: '⚙',
    };
    return icons[cls] || '⚔';
  },

  _timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  },
};
