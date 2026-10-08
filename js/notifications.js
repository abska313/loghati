import { State } from './state.js';

const KEY = 'loghati-reminder';

export const Notifications = {
  supported: typeof window !== 'undefined' && 'Notification' in window,

  async requestPermission() {
    if (!this.supported) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    try { return await Notification.requestPermission(); }
    catch { return 'denied'; }
  },

  getConfig() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') || { enabled: false, hour: 20, minute: 0 }; }
    catch { return { enabled: false, hour: 20, minute: 0 }; }
  },

  setConfig(cfg) {
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {}
    if (cfg.enabled) this.scheduleCheck();
  },

  scheduleCheck() {
    clearInterval(this._timer);
    this._timer = setInterval(() => this._maybeFire(), 60_000);
    this._maybeFire();
  },

  _lastFired: null,

  async _maybeFire() {
    const cfg = this.getConfig();
    if (!cfg.enabled) return;
    if (Notification.permission !== 'granted') return;
    if (!State.currentLangCode) return;

    const now = new Date();
    const today = now.toDateString();
    if (this._lastFired === today) return;

    if (now.getHours() === cfg.hour && now.getMinutes() >= cfg.minute) {
      this._lastFired = today;
      const p = State.getLangProgress();
      const streak = p?.streak?.current || 0;
      const dueCount = Object.values(p?.cards || {}).filter(c => c.due <= Date.now()).length;
      const body = dueCount > 0
        ? `لديك ${dueCount} كلمة للمراجعة اليوم. حافظ على سلسلتك 🔥 ${streak}`
        : `حافظ على تعلّمك اليومي! سلسلتك: 🔥 ${streak}`;
      try { new Notification('لغتي — تذكير يومي', { body, tag: 'daily' }); } catch {}
    }
  },

  stop() { clearInterval(this._timer); }
};
