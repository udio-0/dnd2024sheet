/* =============================================
   SIMPLE HASH ROUTER
   ============================================= */
'use strict';

window.Router = {
  routes: {},
  currentView: null,
  _guard: null,  // function() → true to proceed, false to cancel

  register(pattern, handler) {
    this.routes[pattern] = handler;
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  init() {
    window.addEventListener('hashchange', (e) => {
      if (this._guard) {
        const ok = this._guard();
        if (ok === false) {
          // Revert to previous hash without triggering another hashchange
          const prev = (e.oldURL || '').split('#')[1] || 'home';
          history.replaceState(null, '', '#' + prev);
          return;
        }
        this._guard = null;
      }
      this._resolve();
    });
    this._resolve();
  },

  _resolve() {
    const hash = window.location.hash.slice(1) || 'home';
    // Try exact match first
    if (this.routes[hash]) {
      this._show(hash);
      return;
    }
    // Try pattern match (e.g., "sheet/abc123")
    for (const pattern of Object.keys(this.routes)) {
      if (pattern.includes(':')) {
        const regex = new RegExp('^' + pattern.replace(/:([^/]+)/g, '([^/]+)') + '$');
        const match = hash.match(regex);
        if (match) {
          const params = {};
          const paramNames = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1]);
          paramNames.forEach((name, i) => params[name] = match[i + 1]);
          this._show(pattern, params);
          return;
        }
      }
    }
    // Fallback
    this._show('home');
  },

  _show(pattern, params) {
    const handler = this.routes[pattern];
    if (!handler) return;
    // Hide all views
    document.querySelectorAll('.view-container').forEach(v => v.style.display = 'none');
    handler(params || {});
    this.currentView = pattern;
  },

  showView(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  },
};
