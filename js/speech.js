const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
const hasSTT = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

const LANG_MAP = { fa: 'fa-IR', tr: 'tr-TR', es: 'es-ES', ar: 'ar-SA', en: 'en-US' };

let voicesCache = null;
function loadVoices() {
  return new Promise(resolve => {
    if (!hasTTS) return resolve([]);
    const v = speechSynthesis.getVoices();
    if (v && v.length) { voicesCache = v; return resolve(v); }
    const handler = () => {
      voicesCache = speechSynthesis.getVoices();
      speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(voicesCache);
    };
    speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => resolve(speechSynthesis.getVoices()), 800);
  });
}

export const Speech = {
  ttsAvailable: hasTTS,
  sttAvailable: hasSTT,

  async speak(text, langCode, { rate = 1, pitch = 1 } = {}) {
    if (!hasTTS || !text) return false;
    const voices = voicesCache || await loadVoices();
    const target = LANG_MAP[langCode] || langCode;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = target;
    utter.rate = rate;
    utter.pitch = pitch;
    const voice = voices.find(v => v.lang === target)
      || voices.find(v => v.lang.startsWith(target.split('-')[0]));
    if (voice) utter.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
    return true;
  },

  stop() { if (hasTTS) speechSynthesis.cancel(); },

  listen(langCode, { timeout = 8000 } = {}) {
    if (!hasSTT) return Promise.resolve(null);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = LANG_MAP[langCode] || langCode;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    return new Promise(resolve => {
      let done = false;
      const finish = (val) => {
        if (done) return;
        done = true;
        try { rec.stop(); } catch {}
        resolve(val);
      };
      const timer = setTimeout(() => finish(null), timeout);

      rec.onresult = e => {
        const r = e.results[0][0];
        clearTimeout(timer);
        finish({ transcript: r.transcript, confidence: r.confidence || 0 });
      };
      rec.onerror = () => { clearTimeout(timer); finish(null); };
      rec.onend = () => { clearTimeout(timer); if (!done) finish(null); };

      try { rec.start(); } catch { clearTimeout(timer); finish(null); }
    });
  }
};
