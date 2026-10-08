import { DB } from './db.js';
import { newCard } from './srs.js';
import { getLanguage } from './data/languages.js';

const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 16,
  sound: true,
  speechRate: 1,
  reducedMotion: false
};

const EMPTY_LANG_PROGRESS = () => ({
  level: 'A0',
  xp: 0,
  streak: { current: 0, longest: 0, lastDay: null },
  cards: {},
  mastery: {},
  lessons: {},
  mistakes: [],
  achievements: [],
  placement: null,
  goal: 'general',
  dailyGoalMin: 20,
  todayKey: null,
  todayDone: { vocab: false, grammar: false, listening: false, reading: false, speaking: false, writing: false },
  stats: { listeningCount: 0, speakingCount: 0, grammarLessonsCompleted: 0, storiesRead: 0 }
});

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const State = {
  settings: { ...DEFAULT_SETTINGS },
  currentLangCode: null,
  progress: {},
  view: 'splash',
  viewParams: {},
  listeners: new Set(),

  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit() { for (const fn of this.listeners) fn(); },

  async load() {
    try {
      const s = await DB.get('settings', 'app');
      if (s) this.settings = { ...DEFAULT_SETTINGS, ...s };
      const cur = await DB.get('kv', 'currentLang');
      if (cur) this.currentLangCode = cur;
      const allProg = await DB.all('progress');
      for (const p of allProg || []) if (p && p.langCode) this.progress[p.langCode] = p.data;
    } catch (e) { console.warn('load state failed', e); }
    this.applySettings();
  },

  async saveSettings() {
    try { await DB.put('settings', 'app', this.settings); } catch {}
    this.applySettings();
    this.emit();
  },

  applySettings() {
    document.documentElement.dataset.theme = this.settings.theme;
    document.documentElement.style.fontSize = this.settings.fontSize + 'px';
    if (this.settings.reducedMotion) document.documentElement.dataset.motion = 'reduced';
  },

  async setCurrentLang(code) {
    this.currentLangCode = code;
    try { await DB.put('kv', 'currentLang', code); } catch {}
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    this.emit();
  },

  getLangProgress(code = this.currentLangCode) {
    if (!code) return null;
    if (!this.progress[code]) this.progress[code] = EMPTY_LANG_PROGRESS();
    const p = this.progress[code];
    const t = todayKey();
    if (p.todayKey !== t) {
      p.todayKey = t;
      p.todayDone = { vocab: false, grammar: false, listening: false, reading: false, speaking: false, writing: false };
    }
    return p;
  },

  async saveProgress(code = this.currentLangCode) {
    if (!code || !this.progress[code]) return;
    try { await DB.put('progress', code, { langCode: code, data: this.progress[code] }); }
    catch (e) { console.warn('save failed', e); }
  },

  async ensureCard(wordId, code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    if (!p.cards[wordId]) {
      p.cards[wordId] = newCard();
      await this.saveProgress(code);
    }
    return p.cards[wordId];
  },

  async setCard(wordId, card, code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    p.cards[wordId] = card;
    await this.saveProgress(code);
  },

  async addXP(amount, code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    p.xp += amount;
    await this.saveProgress(code);
    this.emit();
  },

  async touchStreak(code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    const t = todayKey();
    if (p.streak.lastDay === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    if (p.streak.lastDay === yKey) p.streak.current += 1;
    else p.streak.current = 1;
    p.streak.lastDay = t;
    if (p.streak.current > p.streak.longest) p.streak.longest = p.streak.current;
    await this.saveProgress(code);
    this.emit();
  },

  async logMistake({ type, prompt, correct, user }, code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    p.mistakes.push({ type, prompt, correct, user, at: Date.now() });
    if (p.mistakes.length > 200) p.mistakes = p.mistakes.slice(-200);
    await this.saveProgress(code);
  },

  async clearMistakes(code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    p.mistakes = [];
    await this.saveProgress(code);
  },

  async unlockAchievement(id, code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    if (p.achievements.includes(id)) return false;
    p.achievements.push(id);
    await this.saveProgress(code);
    this.emit();
    return true;
  },

  async addStat(key, delta = 1, code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    p.stats[key] = (p.stats[key] || 0) + delta;
    await this.saveProgress(code);
  },

  async markToday(skill, code = this.currentLangCode) {
    const p = this.getLangProgress(code);
    if (!p.todayDone[skill]) { p.todayDone[skill] = true; await this.saveProgress(code); this.emit(); }
  },

  async exportAll() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: this.settings,
      currentLangCode: this.currentLangCode,
      progress: this.progress
    };
  },

  async importAll(data) {
    if (!data || typeof data !== 'object') throw new Error('ملف غير صالح');
    if (data.settings) { this.settings = { ...DEFAULT_SETTINGS, ...data.settings }; await DB.put('settings', 'app', this.settings); }
    if (data.currentLangCode) { this.currentLangCode = data.currentLangCode; await DB.put('kv', 'currentLang', data.currentLangCode); }
    if (data.progress && typeof data.progress === 'object') {
      for (const [code, pdata] of Object.entries(data.progress)) {
        this.progress[code] = pdata;
        await DB.put('progress', code, { langCode: code, data: pdata });
      }
    }
    this.applySettings();
    this.emit();
  },

  async resetAll() {
    await DB.clear();
    this.settings = { ...DEFAULT_SETTINGS };
    this.currentLangCode = null;
    this.progress = {};
    this.applySettings();
    this.emit();
  }
};
