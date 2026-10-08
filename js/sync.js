import { State } from './state.js';

const CFG_KEY = 'loghati-sync-cfg';

export const Sync = {
  getConfig() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY) || 'null') || { enabled: false, endpoint: '', token: '' }; }
    catch { return { enabled: false, endpoint: '', token: '' }; }
  },

  setConfig(cfg) {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch {}
  },

  isEnabled() {
    const c = this.getConfig();
    return !!(c.enabled && c.endpoint && c.token);
  },

  async push() {
    if (!this.isEnabled()) return { ok: false, reason: 'disabled' };
    const cfg = this.getConfig();
    try {
      const data = await State.exportAll();
      const r = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.token}` },
        body: JSON.stringify({ action: 'push', data, at: Date.now() })
      });
      if (!r.ok) return { ok: false, reason: 'http_' + r.status };
      return { ok: true };
    } catch (e) { return { ok: false, reason: e.message }; }
  },

  async pull() {
    if (!this.isEnabled()) return { ok: false, reason: 'disabled' };
    const cfg = this.getConfig();
    try {
      const r = await fetch(cfg.endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${cfg.token}` }
      });
      if (!r.ok) return { ok: false, reason: 'http_' + r.status };
      const { data } = await r.json();
      if (!data) return { ok: false, reason: 'empty' };
      await State.importAll(data);
      return { ok: true };
    } catch (e) { return { ok: false, reason: e.message }; }
  }
};
