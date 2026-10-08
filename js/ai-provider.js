import { getLanguage } from './data/languages.js';

const FEEDBACK_RULES = {
  length: { minWords: 3, check(text) { return text.trim().split(/\s+/).length >= this.minWords; } },
  script: {
    check(text, lang) {
      if (!lang) return true;
      if (lang.script === 'arabic') return /[\u0600-\u06FF]/.test(text);
      if (lang.script === 'latin') return /[a-zA-ZáéíóúñüçğıöşİĞÖŞÇ]/.test(text);
      return true;
    }
  },
  noArabicOnly: {
    check(text, lang) {
      if (!lang || lang.script === 'arabic') return true;
      const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
      const total = text.replace(/\s/g, '').length || 1;
      return arabicChars / total < 0.4;
    }
  }
};

const LOCAL_ENGINE = {
  async evaluateWriting(text, langCode, prompt) {
    const lang = getLanguage(langCode);
    if (!lang) return { ok: false, errors: ['لغة غير معروفة'], score: 0 };

    const errors = [];
    const suggestions = [];
    let score = 0;

    const trimmed = (text || '').trim();
    if (!trimmed) return { ok: false, errors: ['لا يوجد نص'], score: 0, suggestions: ['اكتب جملة واحدة على الأقل.'] };

    const words = trimmed.split(/\s+/).length;

    if (words < 3) errors.push('النص قصير جدًا — اكتب 3 كلمات على الأقل.');
    else if (words <= 5) { score += 30; suggestions.push('أضف جملة ثانية لتحسين التعبير.'); }
    else if (words <= 15) { score += 60; suggestions.push('جيد. حاول استخدام رابط (و، ثم، لأنّ).'); }
    else { score += 80; suggestions.push('نص جيد الطول. ركّز على الدقة النحوية.'); }

    if (!FEEDBACK_RULES.script.check(trimmed, lang)) errors.push(`استخدم الحروف الخاصة بـ ${lang.name}.`);
    else score += 10;

    if (!FEEDBACK_RULES.noArabicOnly.check(trimmed, lang)) errors.push('يبدو أنك كتبت بالعربية بدلًا من اللغة المستهدفة.');

    if (prompt && prompt.keywords && prompt.keywords.length) {
      const lower = trimmed.toLowerCase();
      const hits = prompt.keywords.filter(k => lower.includes(k.toLowerCase())).length;
      if (hits === 0) suggestions.push(`حاول استخدام كلمات من الطلب: ${prompt.keywords.slice(0, 3).join('، ')}`);
      else score += Math.min(10, hits * 3);
    }

    score = Math.max(0, Math.min(100, score));
    const ok = errors.length === 0 && score >= 40;
    return { ok, score, errors, suggestions, source: 'local' };
  },

  async respond(message, langCode, { level = 'A0', topic = 'free', history = [] } = {}) {
    const lang = getLanguage(langCode);
    if (!lang) return { text: '...', meaning: '' };

    const packs = CONVERSATION_PACKS[langCode] || {};
    const levelPack = packs[level] || packs.A0 || packs.default || null;
    if (!levelPack) return { text: '...', meaning: '', fallback: true };

    if (topic !== 'free' && levelPack.topics?.[topic]) {
      return pickReply(levelPack.topics[topic], message, history);
    }

    for (const [tName, t] of Object.entries(levelPack.topics || {})) {
      for (const rule of t.rules || []) {
        if (rule.match.test(message)) {
          const reply = typeof rule.reply === 'function' ? rule.reply(message) : rule.reply;
          return { text: reply.text, meaning: reply.meaning, topic: tName };
        }
      }
    }

    const generic = levelPack.generic || ['...'];
    const g = generic[Math.floor(Math.random() * generic.length)];
    return { text: g.text, meaning: g.meaning, topic: 'general' };
  }
};

function pickReply(topic, message, history) {
  const rules = topic.rules || [];
  for (const rule of rules) {
    if (rule.match.test(message)) {
      const reply = typeof rule.reply === 'function' ? rule.reply(message) : rule.reply;
      return { text: reply.text, meaning: reply.meaning };
    }
  }
  const generic = topic.generic || ['...'];
  const g = generic[Math.floor(Math.random() * generic.length)];
  return { text: g.text, meaning: g.meaning };
}

const CONVERSATION_PACKS = {
  fa: {
    A0: {
      generic: [
        { text: 'بله، درسته.', meaning: 'نعم، صحيح.' },
        { text: 'خوبم، ممنون.', meaning: 'أنا بخير، شكرًا.' },
        { text: 'ببخشید، نفهمیدم.', meaning: 'عذرًا، لم أفهم.' }
      ],
      topics: {
        greeting: {
          rules: [
            { match: /سلام|درود/, reply: { text: 'سلام! خوبی؟', meaning: 'مرحبًا! كيف حالك؟' } },
            { match: /خوبم|خوب/, reply: { text: 'خوشحالم! اسمت چیه؟', meaning: 'سعيد! ما اسمك؟' } },
            { match: /ممنون|مرسی/, reply: { text: 'خواهش می‌کنم.', meaning: 'على الرحب والسعة.' } }
          ],
          generic: [{ text: 'بیشتر بگو.', meaning: 'أخبرني أكثر.' }]
        }
      }
    }
  },
  tr: {
    A0: {
      generic: [
        { text: 'Evet, doğru.', meaning: 'نعم، صحيح.' },
        { text: 'Anlamadım, tekrar eder misin?', meaning: 'لم أفهم، هل تعيد؟' },
        { text: 'İyiyim, teşekkürler.', meaning: 'أنا بخير، شكرًا.' }
      ],
      topics: {
        greeting: {
          rules: [
            { match: /merhaba|selam/, reply: { text: 'Merhaba! Nasılsın?', meaning: 'مرحبًا! كيف حالك؟' } },
            { match: /iyiyim|iyi/, reply: { text: 'Sevindim! Adın ne?', meaning: 'سعيد! ما اسمك؟' } },
            { match: /teşekkür|sağol/, reply: { text: 'Rica ederim.', meaning: 'على الرحب والسعة.' } }
          ],
          generic: [{ text: 'Anlat bakalım.', meaning: 'أخبرني.' }]
        }
      }
    }
  },
  es: {
    A0: {
      generic: [
        { text: 'Sí, correcto.', meaning: 'نعم، صحيح.' },
        { text: 'No entiendo, ¿puedes repetir?', meaning: 'لم أفهم، هل تعيد؟' },
        { text: 'Estoy bien, gracias.', meaning: 'أنا بخير، شكرًا.' }
      ],
      topics: {
        greeting: {
          rules: [
            { match: /hola|buenas/, reply: { text: '¡Hola! ¿Cómo estás?', meaning: 'مرحبًا! كيف حالك؟' } },
            { match: /bien|estoy/, reply: { text: '¡Qué bien! ¿Cómo te llamas?', meaning: 'كم جيد! ما اسمك؟' } },
            { match: /gracias/, reply: { text: 'De nada.', meaning: 'على الرحب والسعة.' } }
          ],
          generic: [{ text: 'Cuéntame más.', meaning: 'أخبرني المزيد.' }]
        }
      }
    }
  }
};

const REMOTE_PROVIDER = {
  enabled: false,
  config: { endpoint: null, apiKey: null, model: 'gpt-4o-mini' },

  async evaluateWriting(text, langCode, prompt) {
    if (!this.enabled || !this.config.endpoint || !this.config.apiKey) return null;
    try {
      const r = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
        body: JSON.stringify({ action: 'evaluate', text, langCode, prompt, model: this.config.model })
      });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  },

  async respond(message, langCode, ctx) {
    if (!this.enabled || !this.config.endpoint || !this.config.apiKey) return null;
    try {
      const r = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
        body: JSON.stringify({ action: 'chat', message, langCode, ...ctx, model: this.config.model })
      });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }
};

export const AI = {
  configure({ endpoint, apiKey, model } = {}) {
    REMOTE_PROVIDER.config = { endpoint, apiKey, model: model || REMOTE_PROVIDER.config.model };
    REMOTE_PROVIDER.enabled = !!(endpoint && apiKey);
  },
  isRemote() { return REMOTE_PROVIDER.enabled; },
  async evaluateWriting(text, langCode, prompt) {
    const remote = await REMOTE_PROVIDER.evaluateWriting(text, langCode, prompt);
    if (remote) return { ...remote, source: 'remote' };
    return LOCAL_ENGINE.evaluateWriting(text, langCode, prompt);
  },
  async respond(message, langCode, ctx) {
    const remote = await REMOTE_PROVIDER.respond(message, langCode, ctx);
    if (remote) return { ...remote, source: 'remote' };
    return LOCAL_ENGINE.respond(message, langCode, ctx);
  }
};
