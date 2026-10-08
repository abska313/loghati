import { State } from './state.js';
import { getLanguage, getAllVocab } from './data/languages.js';
import { WRITING_PROMPTS, TRANSLATION_DRILLS } from './data/expanded.js';
import { AI } from './ai-provider.js';
import { Speech } from './speech.js';
import { h, esc, shuffle, targetDir, toast } from './utils.js';

/* ================= WRITING ================= */
export function WritingView() {
  const lang = getLanguage(State.currentLangCode);
  const prompts = (WRITING_PROMPTS[lang.code] || []).slice(0, 8);
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">✍️ كتابة</div><div></div></div>
    <div class="screen"><div id="stage"></div></div>
  </div>`);
  el.querySelector('#back').onclick = () => State.view = 'dashboard', location.hash = '#dashboard', State.emit();
  const stage = el.querySelector('#stage');

  if (!prompts.length) {
    stage.appendChild(h(`<div class="alert alert-info">لا توجد تمارين كتابة متاحة لهذه اللغة بعد.</div>`));
    return el;
  }

  let idx = 0;
  const results = [];

  function showPrompt() {
    stage.innerHTML = '';
    if (idx >= prompts.length) return showSummary();
    const p = prompts[idx];
    const dir = targetDir(lang);
    const card = h(`<div>
      <div class="ex-head">
        <span class="chip">${idx + 1} / ${prompts.length}</span>
        <span class="chip">${esc(p.level)}</span>
      </div>
      <div class="bar thin mb"><i style="width:${(idx / prompts.length) * 100}%"></i></div>
      <div class="card-lg card">
        <div class="ex-prompt">اكتب باللغة المستهدفة</div>
        <div class="h2">${esc(p.prompt)}</div>
        <div class="sub" style="margin:0">💡 ${esc(p.hint)}</div>
        <textarea class="textarea mt" id="ta" dir="${dir}" placeholder="اكتب هنا…"></textarea>
        <div class="row between mt" style="font-size:12px">
          <span class="muted" id="wc">0 كلمة</span>
        </div>
        <button class="btn btn-primary btn-block mt" id="submit">إرسال للتقييم</button>
      </div>
      <div id="fb"></div>
    </div>`);
    const ta = card.querySelector('#ta');
    const wc = card.querySelector('#wc');
    ta.oninput = () => { wc.textContent = ta.value.trim().split(/\s+/).filter(Boolean).length + ' كلمة'; };
    ta.onkeydown = e => { if (e.key === 'Enter' && e.ctrlKey) card.querySelector('#submit').click(); };
    ta.focus();

    card.querySelector('#submit').onclick = async () => {
      const text = ta.value.trim();
      if (!text) { toast('اكتب شيئًا أولًا'); return; }
      const btn = card.querySelector('#submit');
      btn.disabled = true; btn.textContent = '… جارٍ التقييم';
      const result = await AI.evaluateWriting(text, lang.code, p);
      results.push({ prompt: p, text, result });
      showFeedback(card, p, text, result);
    };
    stage.appendChild(card);
  }

  function showFeedback(card, prompt, text, result) {
    const fb = card.querySelector('#fb');
    const ok = result.ok;
    fb.innerHTML = '';
    fb.appendChild(h(`<div class="card mt" style="${ok ? 'border-color:var(--success)' : 'border-color:var(--warn)'}">
      <div class="row between">
        <div class="h3" style="margin:0">${ok ? '✓ جيد' : '⚠ يحتاج تحسينًا'}</div>
        <span class="chip ${result.score >= 70 ? 'success' : ''}">${result.score}%</span>
      </div>
      <div class="small muted mt">المصدر: ${result.source === 'remote' ? 'AI' : 'تقييم محلي'}</div>
      ${result.errors?.length ? `<div class="mt"><div class="h3">ملاحظات</div>${result.errors.map(e => `<div class="small">• ${esc(e)}</div>`).join('')}</div>` : ''}
      ${result.suggestions?.length ? `<div class="mt"><div class="h3">اقتراحات</div>${result.suggestions.map(s => `<div class="small muted">• ${esc(s)}</div>`).join('')}</div>` : ''}
    </div>`));

    if (ok) {
      State.addXP(20);
      State.touchStreak();
      State.markToday('writing');
    } else {
      State.logMistake({ type: 'writing', prompt: prompt.prompt, correct: '[نص صحيح]', user: text });
    }

    const btn = h(`<button class="btn btn-primary btn-block mt">${idx + 1 >= prompts.length ? 'إتمام' : 'السؤال التالي'}</button>`);
    btn.onclick = () => { idx++; showPrompt(); };
    fb.appendChild(btn);
  }

  function showSummary() {
    stage.innerHTML = '';
    const avg = results.length ? Math.round(results.reduce((a, r) => a + r.result.score, 0) / results.length) : 0;
    const card = h(`<div class="card-lg card center">
      <div style="font-size:52px">✍️</div>
      <div class="h2">انتهت جلسة الكتابة</div>
      <div class="stat-grid mt-lg">
        <div class="stat-box"><b>${results.length}</b><span>تمارين</span></div>
        <div class="stat-box"><b>${avg}%</b><span>متوسط</span></div>
        <div class="stat-box"><b>+${results.filter(r => r.result.ok).length * 20}</b><span>XP</span></div>
        <div class="stat-box"><b>${results.filter(r => r.result.ok).length}</b><span>ناجح</span></div>
      </div>
      <button class="btn btn-primary btn-block mt-lg" id="n">الرئيسية</button>
    </div>`);
    card.querySelector('#n').onclick = () => { State.view = 'dashboard'; location.hash = '#dashboard'; State.emit(); };
    stage.appendChild(card);
  }

  showPrompt();
  return el;
}

/* ================= TRANSLATION ================= */
export function TranslationView() {
  const lang = getLanguage(State.currentLangCode);
  const all = TRANSLATION_DRILLS[lang.code] || [];
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">🔤 ترجمة</div><div></div></div>
    <div class="screen"><div id="stage"></div></div>
  </div>`);
  el.querySelector('#back').onclick = () => { State.view = 'dashboard'; location.hash = '#dashboard'; State.emit(); };
  const stage = el.querySelector('#stage');

  if (!all.length) {
    stage.appendChild(h(`<div class="alert alert-info">لا توجد تمارين ترجمة متاحة بعد لهذه اللغة.</div>`));
    return el;
  }

  const userLevel = State.getLangProgress().level || 'A0';
  const levelOrder = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const userIdx = levelOrder.indexOf(userLevel);
  const pool = all.filter(d => levelOrder.indexOf(d.level) <= userIdx + 1).slice(0, 12);
  const queue = shuffle(pool.length ? pool : all).slice(0, 8);

  let idx = 0, correctCount = 0;

  function render() {
    stage.innerHTML = '';
    if (idx >= queue.length) return summary();
    const d = queue[idx];
    const fromAr = d.dir === 'ar2t';
    const dir = fromAr ? 'rtl' : targetDir(lang);

    const card = h(`<div>
      <div class="ex-head">
        <span class="chip">${idx + 1} / ${queue.length}</span>
        <span class="chip">${esc(d.level)}</span>
      </div>
      <div class="bar thin mb"><i style="width:${(idx / queue.length) * 100}%"></i></div>
      <div class="card-lg card">
        <div class="ex-prompt">${fromAr ? '🇸🇦 → ' + esc(lang.flag) : esc(lang.flag) + ' → 🇸🇦'}</div>
        <div class="h2" style="direction:${dir}">${esc(fromAr ? d.ar : d.target)}</div>
        ${Speech.ttsAvailable && !fromAr ? `<button class="btn btn-sm mt" id="snd">🔊 استمع</button>` : ''}
      </div>
      <div class="card">
        <input class="input" id="in" placeholder="اكتب الترجمة…" dir="${fromAr ? targetDir(lang) : 'rtl'}" autocomplete="off">
        <div class="row mt" style="gap:8px">
          <button class="btn btn-primary" style="flex:1" id="check">تحقق</button>
          <button class="btn btn-ghost" id="skip">تخطّي</button>
        </div>
      </div>
      <div id="fb"></div>
    </div>`);

    const inp = card.querySelector('#in');
    const snd = card.querySelector('#snd');
    if (snd) snd.onclick = () => Speech.speak(d.target, lang.code);

    const check = () => {
      const v = inp.value.trim();
      if (!v) { toast('اكتب إجابتك'); return; }
      const accepted = [d.target, ...(d.accept || [])];
      const norm = s => s.trim().replace(/[.؟?!,،]/g, '').replace(/\s+/g, ' ').toLowerCase();
      const ok = accepted.some(a => norm(a) === norm(v));
      const fb = card.querySelector('#fb');
      inp.disabled = true;
      inp.style.borderColor = ok ? 'var(--success)' : 'var(--danger)';
      fb.innerHTML = '';
      if (ok) {
        correctCount++;
        State.addXP(8);
        State.touchStreak();
        fb.appendChild(h(`<div class="alert alert-info">✓ ترجمة صحيحة</div>`));
      } else {
        fb.appendChild(h(`<div class="alert alert-warn">
          <div>الإجابة الصحيحة:</div>
          <div style="font-weight:700;margin-top:6px;direction:${fromAr ? targetDir(lang) : 'rtl'}">${esc(fromAr ? d.target : d.ar)}</div>
        </div>`));
        State.logMistake({ type: 'translation', prompt: fromAr ? d.ar : d.target, correct: fromAr ? d.target : d.ar, user: v });
      }
      const next = h(`<button class="btn btn-primary btn-block mt">التالي</button>`);
      next.onclick = () => { idx++; render(); };
      fb.appendChild(next);
    };
    card.querySelector('#check').onclick = check;
    inp.onkeydown = e => { if (e.key === 'Enter') check(); };
    card.querySelector('#skip').onclick = () => { idx++; render(); };
    setTimeout(() => inp.focus(), 80);

    stage.appendChild(card);
  }

  function summary() {
    State.markToday('writing');
    const card = h(`<div class="card-lg card center">
      <div style="font-size:52px">🔤</div>
      <div class="h2">انتهى تدريب الترجمة</div>
      <div class="sub">${correctCount} / ${queue.length} صحيحة</div>
      <button class="btn btn-primary btn-block mt-lg" id="n">الرئيسية</button>
    </div>`);
    card.querySelector('#n').onclick = () => { State.view = 'dashboard'; location.hash = '#dashboard'; State.emit(); };
    stage.appendChild(card);
  }

  render();
  return el;
}

/* ================= CONVERSATION V2 ================= */
export function ConversationV2View() {
  const lang = getLanguage(State.currentLangCode);
  const p = State.getLangProgress();
  const userLevel = p.level || 'A0';

  const el = h(`<div>
    <div class="topbar">
      <button class="btn btn-sm btn-ghost" id="back">←</button>
      <div class="title">💬 محادثة حرة</div>
      <div class="chip small">${AI.isRemote() ? '🌐 AI' : '💾 محلي'}</div>
    </div>
    <div class="screen">
      <div id="chat" style="display:flex;flex-direction:column;gap:10px;padding-bottom:120px"></div>
    </div>
    <div style="position:fixed;bottom:88px;left:0;right:0;padding:10px 18px;background:var(--bg);max-width:720px;margin:auto;z-index:25">
      <div class="row" style="gap:8px">
        <input class="input" id="msg" placeholder="اكتب رسالة…" autocomplete="off">
        ${Speech.sttAvailable ? `<button class="btn" id="mic" title="تحدث">🎙️</button>` : ''}
        <button class="btn btn-primary" id="send">إرسال</button>
      </div>
    </div>
  </div>`);

  el.querySelector('#back').onclick = () => { State.view = 'dashboard'; location.hash = '#dashboard'; State.emit(); };
  const chat = el.querySelector('#chat');
  const msgIn = el.querySelector('#msg');
  const history = [];

  function pushBubble(text, meaning, isUser = false) {
    const bubble = h(`<div style="align-self:${isUser ? 'flex-end' : 'flex-start'};max-width:80%;background:${isUser ? 'var(--primary)' : 'var(--surface)'};color:${isUser ? '#f7f5ef' : 'var(--text)'};border-radius:16px;padding:10px 14px;border:1px solid var(--border);direction:${isUser ? 'rtl' : targetDir(lang)}">
      <div style="font-weight:600">${esc(text)}</div>
      ${meaning ? `<div class="small" style="opacity:.75;margin-top:2px;direction:rtl">${esc(meaning)}</div>` : ''}
    </div>`);
    chat.appendChild(bubble);
    chat.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  (async () => {
    const r = await AI.respond('', lang.code, { level: userLevel, topic: 'greeting', history });
    pushBubble(r.text, r.meaning);
    history.push({ role: 'ai', text: r.text });
  })();

  async function send() {
    const v = msgIn.value.trim();
    if (!v) return;
    msgIn.value = '';
    pushBubble(v, '', true);
    history.push({ role: 'user', text: v });
    const r = await AI.respond(v, lang.code, { level: userLevel, topic: 'free', history });
    pushBubble(r.text, r.meaning);
    history.push({ role: 'ai', text: r.text });
    State.addXP(3);
    State.touchStreak();
  }

  el.querySelector('#send').onclick = send;
  msgIn.onkeydown = e => { if (e.key === 'Enter') send(); };

  const mic = el.querySelector('#mic');
  if (mic) mic.onclick = async () => {
    toast('جاري الاستماع…');
    const out = await Speech.listen(lang.code);
    if (out?.transcript) { msgIn.value = out.transcript; send(); }
    else toast('لم نستطع الالتقاط');
  };

  setTimeout(() => msgIn.focus(), 200);
  return el;
}

/* ================= LISTENING PLUS ================= */
export function ListeningPlusView() {
  const lang = getLanguage(State.currentLangCode);
  const allVocab = getAllVocab(lang);
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">🎧 استماع متقدم</div><div></div></div>
    <div class="screen">
      <div class="row mb" style="gap:8px">
        <button class="btn btn-sm btn-primary" data-mode="dictation">إملاء</button>
        <button class="btn btn-sm" data-mode="comprehension">فهم</button>
      </div>
      <div id="stage"></div>
    </div>
  </div>`);
  el.querySelector('#back').onclick = () => { State.view = 'dashboard'; location.hash = '#dashboard'; State.emit(); };
  const stage = el.querySelector('#stage');

  if (!Speech.ttsAvailable) {
    stage.appendChild(h(`<div class="alert alert-warn">⚠️ تخليق الصوت غير متاح في هذا المتصفح.</div>`));
    return el;
  }

  let mode = 'dictation';
  el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
    mode = b.dataset.mode;
    el.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('btn-primary', x.dataset.mode === mode));
    start();
  });

  const dir = targetDir(lang);

  function start() {
    stage.innerHTML = '';
    const items = shuffle(allVocab).slice(0, 6);
    let i = 0;

    function next() {
      stage.innerHTML = '';
      if (i >= items.length) return done();
      const v = items[i];

      if (mode === 'dictation') {
        const card = h(`<div>
          <div class="ex-head"><span class="chip">${i + 1} / ${items.length}</span><span class="chip">إملاء</span></div>
          <div class="card-lg card">
            <div class="ex-prompt">استمع واكتب ما تسمع</div>
            <div class="center" style="font-size:56px;padding:20px">🔊</div>
            <button class="btn btn-block" id="play">🔊 تشغيل</button>
            <button class="btn btn-sm btn-block mt" id="slow">🐢 بطيء</button>
            <input class="input mt" id="in" placeholder="اكتب ما سمعت…" dir="${dir}" autocomplete="off">
            <button class="btn btn-primary btn-block mt" id="check">تحقق</button>
          </div>
          <div id="fb"></div>
        </div>`);
        const play = (rate) => Speech.speak(v.word, lang.code, { rate });
        card.querySelector('#play').onclick = () => play(1);
        card.querySelector('#slow').onclick = () => play(0.6);
        play(1);
        const inp = card.querySelector('#in');
        card.querySelector('#check').onclick = () => {
          const val = inp.value.trim();
          const norm = s => s.trim().toLowerCase().replace(/[.؟?!,،]/g, '');
          const ok = norm(val) === norm(v.word) || norm(val) === norm(v.roman || '');
          const fb = card.querySelector('#fb');
          fb.innerHTML = '';
          if (ok) { State.addXP(10); fb.appendChild(h(`<div class="alert alert-info">✓ صحيح</div>`)); }
          else {
            fb.appendChild(h(`<div class="alert alert-warn">الصحيح: <b dir="${dir}">${esc(v.word)}</b>${v.roman ? ` (${esc(v.roman)})` : ''}<br>المعنى: ${esc(v.meaning)}</div>`));
            State.logMistake({ type: 'listening', prompt: '(سمعي)', correct: v.word, user: val });
          }
          const b = h(`<button class="btn btn-primary btn-block mt">التالي</button>`);
          b.onclick = () => { i++; next(); };
          fb.appendChild(b);
        };
        setTimeout(() => inp.focus(), 200);
        stage.appendChild(card);
      } else {
        const story = (lang.stories || [])[0];
        if (!story) { toast('لا توجد قصة متاحة'); return done(); }
        const line = story.text[i % story.text.length];
        const card = h(`<div>
          <div class="ex-head"><span class="chip">${i + 1} / ${items.length}</span><span class="chip">فهم</span></div>
          <div class="card-lg card">
            <div class="ex-prompt">استمع واختر المعنى</div>
            <button class="btn btn-block" id="play">🔊 استمع</button>
            <div id="opts" class="ex-options mt"></div>
          </div>
          <div id="fb"></div>
        </div>`);
        card.querySelector('#play').onclick = () => Speech.speak(line.t, lang.code);
        Speech.speak(line.t, lang.code);
        const opts = card.querySelector('#opts');
        const distractors = shuffle(story.text.filter(x => x !== line)).slice(0, 3).map(x => x.m);
        const allOpts = shuffle([line.m, ...distractors]);
        allOpts.forEach(opt => {
          const b = h(`<button class="opt">${esc(opt)}</button>`);
          b.onclick = () => {
            const ok = opt === line.m;
            b.classList.add(ok ? 'correct' : 'wrong');
            if (ok) State.addXP(8);
            const fb = card.querySelector('#fb');
            fb.innerHTML = '';
            const n = h(`<button class="btn btn-primary btn-block mt">التالي</button>`);
            n.onclick = () => { i++; next(); };
            fb.appendChild(n);
          };
          opts.appendChild(b);
        });
        stage.appendChild(card);
      }
    }

    function done() {
      State.markToday('listening');
      State.touchStreak();
      State.addStat('listeningCount', items.length);
      stage.innerHTML = '';
      stage.appendChild(h(`<div class="card-lg card center">
        <div style="font-size:52px">🎧</div>
        <div class="h2">انتهت الجلسة</div>
        <button class="btn btn-primary btn-block mt-lg" id="n">الرئيسية</button>
      </div>`));
      stage.querySelector('#n').onclick = () => { State.view = 'dashboard'; location.hash = '#dashboard'; State.emit(); };
    }
    next();
  }
  start();
  return el;
}

/* ================= CERTIFICATES ================= */
export function CertificatesView() {
  const lang = getLanguage(State.currentLangCode);
  const p = State.getLangProgress();
  const lessons = Object.values(p.lessons).filter(l => l.completed).length;
  const learnedWords = Object.values(p.cards).filter(c => c.reps >= 3).length;

  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">🎓 الشهادات</div><div></div></div>
    <div class="screen">
      <div class="sub">احصل على شهادة عند إتمام متطلبات كل مستوى.</div>
      <div id="list"></div>
    </div>
  </div>`);
  el.querySelector('#back').onclick = () => { State.view = 'dashboard'; location.hash = '#dashboard'; State.emit(); };
  const list = el.querySelector('#list');

  const certs = [
    { id: 'A0', label: 'A0 — البداية', req: { lessons: 2, words: 10 }, check: () => lessons >= 2 && learnedWords >= 10 },
    { id: 'A1', label: 'A1 — أساسي', req: { lessons: 5, words: 30 }, check: () => lessons >= 5 && learnedWords >= 30 },
    { id: 'A2', label: 'A2 — ما قبل المتوسط', req: { lessons: 12, words: 80 }, check: () => lessons >= 12 && learnedWords >= 80 },
    { id: 'B1', label: 'B1 — متوسط', req: { lessons: 25, words: 200 }, check: () => lessons >= 25 && learnedWords >= 200 }
  ];

  certs.forEach(c => {
    const ok = c.check();
    const card = h(`<div class="card mb" style="${ok ? 'border-color:var(--accent)' : ''}">
      <div class="row between">
        <div>
          <div class="h3">${esc(c.label)}</div>
          <div class="small muted">${c.req.lessons} درس • ${c.req.words} كلمة متقنة</div>
        </div>
        <span class="chip ${ok ? 'accent' : ''}">${ok ? '✓ مستحق' : 'مقفل'}</span>
      </div>
      ${ok ? `<button class="btn btn-sm btn-accent mt" data-cert="${c.id}">⬇️ تحميل الشهادة</button>` : ''}
    </div>`);
    const btn = card.querySelector('[data-cert]');
    if (btn) btn.onclick = () => downloadCertificate(lang, c);
    list.appendChild(card);
  });
  return el;
}

function downloadCertificate(lang, cert) {
  const name = prompt('اسمك على الشهادة؟') || 'طالب/ة';
  const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0d3b2e"/>
        <stop offset="1" stop-color="#14523f"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="#f7f5ef"/>
    <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#g)" stroke-width="3"/>
    <rect x="34" y="34" width="732" height="532" fill="none" stroke="#c9a961" stroke-width="1"/>
    <text x="400" y="90" font-family="serif" font-size="20" fill="#5b6660" text-anchor="middle" letter-spacing="6">شهادة إتمام</text>
    <text x="400" y="170" font-family="serif" font-size="54" fill="#0d3b2e" text-anchor="middle" font-weight="bold">لغتي</text>
    <text x="400" y="220" font-family="serif" font-size="16" fill="#c9a961" text-anchor="middle" letter-spacing="4">LANGUAGE MASTERY</text>
    <line x1="280" y1="245" x2="520" y2="245" stroke="#c9a961" stroke-width="1"/>
    <text x="400" y="300" font-family="serif" font-size="18" fill="#5b6660" text-anchor="middle">تشهد المنصة أن</text>
    <text x="400" y="360" font-family="serif" font-size="40" fill="#0d3b2e" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
    <text x="400" y="405" font-family="serif" font-size="16" fill="#5b6660" text-anchor="middle">أتم/ت متطلبات المستوى</text>
    <text x="400" y="455" font-family="serif" font-size="34" fill="#c9a961" text-anchor="middle" font-weight="bold">${escapeXml(cert.id)} — ${escapeXml(lang.name)}</text>
    <text x="400" y="510" font-family="serif" font-size="14" fill="#5b6660" text-anchor="middle">${escapeXml(date)}</text>
    <text x="400" y="545" font-family="serif" font-size="11" fill="#93a39b" text-anchor="middle">لغتي — منصة إتقان اللغات</text>
  </svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certificate-${lang.code}-${cert.id}.svg`;
  a.click();
  URL.revokeObjectURL(url);
  toast('تم تحميل الشهادة');
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;' }[c]));
        }
