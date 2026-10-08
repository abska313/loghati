import { State } from './state.js';
import { LANGUAGE_LIST, getLanguage, getAllVocab, getAllLessons, ACHIEVEMENTS } from './data/languages.js';
import { review, gradeFromAttempt, isDue, masteryLevel, masteryLabel, newCard } from './srs.js';
import { Speech } from './speech.js';
import { h, esc, shuffle, targetDir, toast } from './utils.js';
import { Sync } from './sync.js';
import { Notifications } from './notifications.js';
import { AI } from './ai-provider.js';
import {
  WritingView, TranslationView, ConversationV2View,
  ListeningPlusView, CertificatesView
} from './views-phase2.js';

function navigate(view, params = {}) {
  State.view = view;
  State.viewParams = params || {};
  location.hash = '#' + view + (params && Object.keys(params).length ? '/' + encodeURIComponent(JSON.stringify(params)) : '');
  State.emit();
}

export const Nav = { navigate };

/* ================= SPLASH ================= */
function SplashView() {
  const el = h(`<div class="screen center" style="display:flex;flex-direction:column;justify-content:center;min-height:80vh">
    <div style="font-size:64px;margin-bottom:14px">🌍</div>
    <h1 class="h1">لغتي</h1>
    <p class="sub">من الصفر إلى الإتقان — رحلة حقيقية لتعلم اللغات</p>
    <button class="btn btn-primary btn-block" id="start">ابدأ الآن</button>
  </div>`);
  el.querySelector('#start').onclick = () => navigate('languages');
  return el;
}

/* ================= LANGUAGES ================= */
function LanguagesView() {
  const el = h(`<div class="screen">
    <h1 class="h1">اختر لغتك</h1>
    <p class="sub">سيبني النظام مسارًا مخصصًا لك بناءً على مستواك وأهدافك.</p>
    <div class="grid" id="list"></div>
    <div class="card mt-lg small muted">البنية مهيأة لإضافة لغات جديدة دون إعادة بناء التطبيق.</div>
  </div>`);
  const list = el.querySelector('#list');
  LANGUAGE_LIST.forEach(lang => {
    const card = h(`<button class="lang-card">
      <span class="flag">${lang.flag}</span>
      <span class="info"><b>${esc(lang.name)}</b><span>${esc(lang.nativeName)} — ${esc(lang.speakers)}</span></span>
      <span style="color:var(--accent);font-size:22px">‹</span>
    </button>`);
    card.onclick = async () => {
      await State.setCurrentLang(lang.code);
      const p = State.getLangProgress(lang.code);
      if (!p.placement) navigate('goal');
      else navigate('dashboard');
    };
    list.appendChild(card);
  });
  return el;
}

/* ================= GOAL ================= */
function GoalView() {
  const goals = [
    { id: 'travel', label: 'السفر', desc: 'تواصل أساسي للرحلات' },
    { id: 'work', label: 'العمل', desc: 'مصطلحات مهنية وعامة' },
    { id: 'study', label: 'الدراسة', desc: 'لغة أكاديمية' },
    { id: 'culture', label: 'الثقافة', desc: 'أفلام، كتب، محادثات' },
    { id: 'general', label: 'اهتمام عام', desc: 'تطور شامل' }
  ];
  const el = h(`<div class="screen">
    <h1 class="h1">ما هدفك؟</h1>
    <p class="sub">سيؤثر هذا في ترتيب أولويات المحتوى.</p>
    <div class="grid" id="goals"></div>
  </div>`);
  const wrap = el.querySelector('#goals');
  goals.forEach(g => {
    const b = h(`<button class="card card-press" style="text-align:start">
      <div class="h3">${esc(g.label)}</div>
      <div class="small muted">${esc(g.desc)}</div>
    </button>`);
    b.onclick = async () => {
      const p = State.getLangProgress();
      p.goal = g.id;
      await State.saveProgress();
      navigate('placement');
    };
    wrap.appendChild(b);
  });
  return el;
}

/* ================= PLACEMENT ================= */
function PlacementView() {
  const lang = getLanguage(State.currentLangCode);
  const questions = lang.placement || [];
  if (!questions.length) {
    const el = h(`<div class="screen"><div class="alert alert-info">لا يوجد اختبار تحديد مستوى لهذه اللغة، سنبدأ من A0.</div>
      <button class="btn btn-primary btn-block" id="skip">ابدأ من A0</button></div>`);
    el.querySelector('#skip').onclick = async () => {
      const p = State.getLangProgress();
      p.placement = { level: 'A0', score: 0, strong: [], weak: [] };
      p.level = 'A0';
      await State.saveProgress();
      navigate('dashboard');
    };
    return el;
  }

  const st = { idx: 0, answers: [], startedAt: Date.now() };
  const el = h(`<div class="screen">
    <div class="ex-head">
      <span class="chip" id="counter"></span>
      <button class="btn btn-sm btn-ghost" id="quit">إلغاء</button>
    </div>
    <div class="bar mb"><i id="bar" style="width:0%"></i></div>
    <div id="stage"></div>
  </div>`);
  const stage = el.querySelector('#stage');
  const counter = el.querySelector('#counter');
  const bar = el.querySelector('#bar');

  el.querySelector('#quit').onclick = () => navigate('languages');

  function renderQ() {
    const q = questions[st.idx];
    counter.textContent = `${st.idx + 1} / ${questions.length}`;
    bar.style.width = `${(st.idx / questions.length) * 100}%`;
    stage.innerHTML = '';

    const card = h(`<div class="ex-card">
      <div class="ex-prompt">${esc(q.skill)}</div>
      <div style="font-size:17px;font-weight:600;margin-bottom:14px">${esc(q.q)}</div>
      <div id="ansBox"></div>
    </div>`);
    const ansBox = card.querySelector('#ansBox');

    if (q.type === 'mc') {
      const grid = h(`<div class="ex-options"></div>`);
      q.options.forEach((opt, i) => {
        const b = h(`<button class="opt">${esc(opt)}</button>`);
        b.onclick = () => {
          const ok = i === q.answer;
          b.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) grid.children[q.answer].classList.add('reveal');
          st.answers.push({ q, ok });
          setTimeout(next, 550);
        };
        grid.appendChild(b);
      });
      ansBox.appendChild(grid);
    } else {
      const inp = h(`<input class="input" placeholder="اكتب إجابتك…" autocomplete="off">`);
      const btn = h(`<button class="btn btn-primary btn-block mt">تأكيد</button>`);
      const submit = () => {
        const v = inp.value.trim();
        const ok = (q.answer || []).some(a => a.toLowerCase() === v.toLowerCase());
        inp.disabled = true;
        inp.style.borderColor = ok ? 'var(--success)' : 'var(--danger)';
        st.answers.push({ q, ok });
        btn.disabled = true;
        setTimeout(next, 550);
      };
      btn.onclick = submit;
      inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
      ansBox.appendChild(inp);
      ansBox.appendChild(btn);
      setTimeout(() => inp.focus(), 100);
    }
    stage.appendChild(card);
  }

  async function next() {
    st.idx++;
    if (st.idx >= questions.length) return finish();
    renderQ();
  }

  async function finish() {
    const perSkill = {};
    for (const a of st.answers) {
      (perSkill[a.q.skill] ||= { total: 0, correct: 0 });
      perSkill[a.q.skill].total++;
      if (a.ok) perSkill[a.q.skill].correct++;
    }
    const score = st.answers.filter(a => a.ok).length / st.answers.length;
    let level = 'A0';
    if (score >= 0.9) level = 'A2';
    else if (score >= 0.7) level = 'A1';
    else if (score >= 0.45) level = 'A0+';
    else level = 'A0';

    const strong = [], weak = [];
    for (const [skill, v] of Object.entries(perSkill)) {
      const ratio = v.correct / v.total;
      if (ratio >= 0.7) strong.push(skill);
      else if (ratio < 0.5) weak.push(skill);
    }

    const p = State.getLangProgress();
    p.placement = { score, level, strong, weak, perSkill };
    p.level = level === 'A0+' ? 'A0' : level;
    await State.saveProgress();
    navigate('placement-result');
  }

  renderQ();
  return el;
}

function PlacementResultView() {
  const lang = getLanguage(State.currentLangCode);
  const p = State.getLangProgress();
  const pl = p.placement || { level: 'A0', strong: [], weak: [] };
  const skillAr = { vocabulary: 'المفردات', grammar: 'القواعد', reading: 'القراءة', listening: 'الاستماع', translation: 'الترجمة' };
  const el = h(`<div class="screen">
    <div class="hero">
      <div class="ex-prompt" style="color:rgba(247,245,239,.7)">نتيجة اختبار تحديد المستوى</div>
      <div class="h1" style="font-size:44px">${esc(pl.level)}</div>
      <div class="sub" style="margin-bottom:0">مستواك التقريبي في ${esc(lang.name)}</div>
    </div>
    <div class="card mb">
      <div class="h3">نقاط القوة</div>
      <div>${pl.strong.length ? pl.strong.map(s => `<span class="chip success">${esc(skillAr[s] || s)}</span>`).join(' ') : '<span class="muted small">لا يوجد بعد</span>'}</div>
    </div>
    <div class="card mb">
      <div class="h3">نقاط تحتاج تطويرًا</div>
      <div>${pl.weak.length ? pl.weak.map(s => `<span class="chip">${esc(skillAr[s] || s)}</span>`).join(' ') : '<span class="muted small">لا يوجد — بداية قوية!</span>'}</div>
    </div>
    <div class="card mb">
      <div class="h3">خطتك الشخصية</div>
      <ul style="padding-inline-start:20px;line-height:1.9">
        <li>ابدأ من المستوى <b>${esc(pl.level)}</b></li>
        <li>جلسة يومية قصيرة (10-20 دقيقة)</li>
        <li>مراجعة تلقائية بالتكرار المتباعد</li>
      </ul>
    </div>
    <button class="btn btn-primary btn-block" id="go">ابدأ التعلم</button>
  </div>`);
  el.querySelector('#go').onclick = () => navigate('dashboard');
  return el;
}

/* ================= DASHBOARD ================= */
function DashboardView() {
  const lang = getLanguage(State.currentLangCode);
  if (!lang) return SplashView();
  const p = State.getLangProgress();
  const lessons = getAllLessons(lang);
  const completed = Object.values(p.lessons).filter(l => l.completed).length;
  const total = lessons.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const wordsLearned = Object.values(p.cards).filter(c => c.reps >= 2).length;

  const skills = [
    { id: 'vocab', label: 'مفردات', ic: '📚', view: 'learn', done: p.todayDone.vocab },
    { id: 'grammar', label: 'قواعد', ic: '⚙️', view: 'grammar', done: p.todayDone.grammar },
    { id: 'listening', label: 'استماع', ic: '🎧', view: 'listening', done: p.todayDone.listening },
    { id: 'reading', label: 'قراءة', ic: '📖', view: 'reading', done: p.todayDone.reading },
    { id: 'speaking', label: 'تحدث', ic: '🎙️', view: 'speaking', done: p.todayDone.speaking },
    { id: 'writing', label: 'كتابة', ic: '✍️', view: 'writing', done: p.todayDone.writing },
    { id: 'translation', label: 'ترجمة', ic: '🔤', view: 'translation', done: false },
    { id: 'conversation', label: 'محادثة حرة', ic: '💬', view: 'conversation-v2', done: false },
    { id: 'listeningPlus', label: 'استماع متقدم', ic: '🎧', view: 'listening-plus', done: false },
    { id: 'review', label: 'مراجعة', ic: '🔁', view: 'review', done: false }
  ];

  const dueCount = Object.values(p.cards).filter(c => isDue(c)).length;

  const el = h(`<div>
    <div class="topbar">
      <div>
        <div class="title">${esc(lang.flag)} ${esc(lang.name)}</div>
        <div class="stat">المستوى ${esc(p.level)}</div>
      </div>
      <div class="row">
        <span class="chip accent">🔥 ${p.streak.current}</span>
        <span class="chip">⭐ ${p.xp} XP</span>
      </div>
    </div>
    <div class="screen">
      <div class="hero">
        <div class="ex-prompt" style="color:rgba(247,245,239,.7)">مهمة اليوم</div>
        <div class="h1">${completed > 0 ? 'أحسنت! واصل' : 'ابدأ جلستك اليومية'}</div>
        <div class="sub" style="margin-bottom:10px">${completed} من ${total} دروس مكتملة — التقدم ${pct}%</div>
        <div class="bar"><i style="width:${pct}%;background:rgba(255,255,255,.7)"></i></div>
      </div>

      <div class="stat-grid mb-lg">
        <div class="stat-box"><b>${wordsLearned}</b><span>كلمة مُتعلّمة</span></div>
        <div class="stat-box"><b>${Object.keys(p.cards).length}</b><span>في المراجعة</span></div>
        <div class="stat-box"><b>${dueCount}</b><span>مستحقة</span></div>
        <div class="stat-box"><b>${p.streak.longest}</b><span>أطول سلسلة</span></div>
      </div>

      <div class="h2">جلسة اليوم</div>
      <div id="skills"></div>

      <div class="h2 mt-lg">الدرس القادم</div>
      <div id="nextLesson"></div>

      <div class="h2 mt-lg">🎓 الشهادات</div>
      <div class="card card-press" id="certCard">
        <div class="row between"><span>عرض الشهادات المتاحة</span><span>›</span></div>
      </div>

      ${p.mistakes.length ? `<div class="h2 mt-lg">أخطاء للمراجعة</div>
        <div class="card" style="cursor:pointer" id="mistakesCard">
          <div class="row between"><span>📓 دفتر الأخطاء</span><span class="chip">${p.mistakes.length}</span></div>
        </div>` : ''}
    </div>
  </div>`);

  const skillsWrap = el.querySelector('#skills');
  skills.forEach(s => {
    const row = h(`<div class="skill-row ${s.done ? 'done' : ''}">
      <span class="ic">${s.ic}</span>
      <span class="body"><b>${esc(s.label)}</b><span>${s.done ? 'مكتمل' : 'جلسة قصيرة'}</span></span>
      <span class="skill-check">${s.done ? '✓' : ''}</span>
    </div>`);
    row.onclick = () => navigate(s.view);
    skillsWrap.appendChild(row);
  });

  const nextLessonWrap = el.querySelector('#nextLesson');
  const nextLesson = lessons.find(l => !p.lessons[l.id]?.completed);
  if (nextLesson) {
    const c = h(`<div class="card card-press">
      <div class="row between">
        <div>
          <div class="h3">${esc(nextLesson.title)}</div>
          <div class="small muted">${esc(nextLesson.unitTitle)} — ${esc(nextLesson.levelKey)}</div>
        </div>
        <span class="btn btn-sm btn-primary">ابدأ</span>
      </div>
    </div>`);
    c.onclick = () => navigate('lesson', { lessonId: nextLesson.id });
    nextLessonWrap.appendChild(c);
  } else {
    nextLessonWrap.appendChild(h(`<div class="card center muted">أكملت كل الدروس المتاحة ✨</div>`));
  }

  el.querySelector('#certCard').onclick = () => navigate('certificates');
  const mist = el.querySelector('#mistakesCard');
  if (mist) mist.onclick = () => navigate('mistakes');

  return el;
}

/* ================= LESSON ================= */
function LessonView({ lessonId }) {
  const lang = getLanguage(State.currentLangCode);
  const lessons = getAllLessons(lang);
  const lesson = lessons.find(l => l.id === lessonId) || lessons[0];
  if (!lesson) return h(`<div class="screen"><div class="alert alert-warn">لم يتم العثور على الدرس.</div></div>`);

  let step = 0;
  const steps = ['intro', 'vocab', 'grammar', 'practice', 'summary'];
  const dir = targetDir(lang);
  const el = h(`<div>
    <div class="topbar">
      <button class="btn btn-sm btn-ghost" id="back">← رجوع</button>
      <div class="title">${esc(lesson.title)}</div>
      <span class="stat" id="progress"></span>
    </div>
    <div class="screen"><div id="stage"></div></div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const stage = el.querySelector('#stage');
  const progressLabel = el.querySelector('#progress');

  function render() {
    progressLabel.textContent = `${step + 1}/${steps.length}`;
    stage.innerHTML = '';
    const s = steps[step];
    if (s === 'intro') return renderIntro();
    if (s === 'vocab') return renderVocab();
    if (s === 'grammar') return renderGrammar();
    if (s === 'practice') return renderPractice();
    if (s === 'summary') return renderSummary();
  }

  function next() { step++; render(); }

  function renderIntro() {
    const card = h(`<div class="card-lg card">
      <div class="ex-prompt">هدف الدرس</div>
      <div class="h2">${esc(lesson.objective)}</div>
      <p class="sub">في هذا الدرس سنتعرّف على ${lesson.vocab.length} كلمة جديدة ونطبّقها في سياق حقيقي.</p>
      <div class="divider"></div>
      <div class="h3">ماذا سنتعلم؟</div>
      <ul style="padding-inline-start:20px;line-height:1.9">
        <li>مفردات أساسية + أمثلة</li>
        <li>قاعدة: ${esc(lesson.grammar.concept)}</li>
        <li>تمارين تفاعلية</li>
      </ul>
      <button class="btn btn-primary btn-block mt-lg" id="n">التالي</button>
    </div>`);
    card.querySelector('#n').onclick = next;
    stage.appendChild(card);
  }

  function renderVocab() {
    let i = 0;
    const container = h(`<div>
      <div class="bar thin mb"><i id="b" style="width:0%"></i></div>
      <div id="vocabStage"></div>
    </div>`);
    const vStage = container.querySelector('#vocabStage');
    const bar = container.querySelector('#b');

    function show() {
      vStage.innerHTML = '';
      if (i >= lesson.vocab.length) return next();
      bar.style.width = `${(i / lesson.vocab.length) * 100}%`;
      const v = lesson.vocab[i];
      const card = h(`<div class="card-lg card">
        <div class="ex-prompt">كلمة ${i + 1} من ${lesson.vocab.length}</div>
        <div class="ex-word target-text" data-dir="${dir}">${esc(v.word)}</div>
        ${v.roman ? `<div class="ex-roman">${esc(v.roman)}</div>` : ''}
        <div class="divider"></div>
        <div class="h3">${esc(v.meaning)}</div>
        <div class="small muted mb">${esc(v.type || '')}</div>
        ${v.example ? `<div class="card" style="background:var(--surface-2);margin-top:8px">
          <div class="target-text" data-dir="${dir}" style="font-weight:600">${esc(v.example)}</div>
          <div class="small muted">${esc(v.exampleMeaning || '')}</div>
        </div>` : ''}
        <div class="row mt-lg" style="gap:8px">
          ${Speech.ttsAvailable ? `<button class="btn btn-sm" id="snd">🔊 استمع</button>` : ''}
          <button class="btn btn-primary" style="flex:1" id="n">التالي</button>
        </div>
      </div>`);
      const snd = card.querySelector('#snd');
      if (snd) snd.onclick = () => Speech.speak(v.word, lang.code, { rate: State.settings.speechRate });
      card.querySelector('#n').onclick = () => { i++; show(); };
      vStage.appendChild(card);
      State.ensureCard(v.id);
    }
    show();
    stage.appendChild(container);
  }

  function renderGrammar() {
    const g = lesson.grammar;
    const card = h(`<div class="card-lg card">
      <div class="ex-prompt">قاعدة</div>
      <div class="h2">${esc(g.concept)}</div>
      <p style="line-height:1.7">${esc(g.explanation)}</p>
      <div class="card" style="background:var(--surface-2);margin:12px 0">
        <div class="small muted">الصيغة</div>
        <div style="font-weight:700;font-size:16px">${esc(g.pattern)}</div>
      </div>
      <div class="h3">أمثلة</div>
      <div class="grid">
        ${g.examples.map(ex => `
          <div class="card" style="background:var(--surface-2)">
            <div class="target-text" data-dir="${dir}" style="font-weight:700;font-size:17px">${esc(ex.t)}</div>
            ${ex.r ? `<div class="small muted">${esc(ex.r)}</div>` : ''}
            <div style="margin-top:4px">${esc(ex.m)}</div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-block mt-lg" id="n">تدرّب</button>
    </div>`);
    card.querySelector('#n').onclick = next;
    stage.appendChild(card);
  }

  function renderPractice() {
    const exercises = buildExercisesForLesson(lesson);
    runExerciseSet(exercises, stage, {
      title: 'تمرين',
      onDone: (correct, total) => {
        const score = Math.round((correct / total) * 100);
        State.getLangProgress()._lastScore = score;
        next();
      }
    });
  }

  function renderSummary() {
    const p = State.getLangProgress();
    const score = p._lastScore || 0;
    p.lessons[lesson.id] = { completed: true, score, at: Date.now() };
    delete p._lastScore;
    State.saveProgress();
    State.addXP(20);
    State.touchStreak();
    State.markToday('grammar');
    State.addStat('grammarLessonsCompleted');
    State.unlockAchievement('first-lesson');

    const card = h(`<div class="card-lg card center">
      <div style="font-size:56px">🎉</div>
      <div class="h1">أكملت الدرس!</div>
      <div class="sub">${esc(lesson.title)}</div>
      <div class="stat-grid mt" style="margin-top:20px">
        <div class="stat-box"><b>${score}%</b><span>النتيجة</span></div>
        <div class="stat-box"><b>${lesson.vocab.length}</b><span>كلمات جديدة</span></div>
        <div class="stat-box"><b>+20</b><span>XP</span></div>
        <div class="stat-box"><b>${p.streak.current}</b><span>سلسلة</span></div>
      </div>
      <button class="btn btn-primary btn-block mt-lg" id="n">إلى الرئيسية</button>
    </div>`);
    card.querySelector('#n').onclick = () => navigate('dashboard');
    stage.appendChild(card);
  }

  render();
  return el;
}

/* ================= EXERCISE ENGINE ================= */
export function buildExercisesForLesson(lesson) {
  const out = [];
  const vocab = lesson.vocab;
  for (const v of vocab) {
    out.push({ type: 'mc', skill: 'vocabulary', wordId: v.id, prompt: v.word, promptRoman: v.roman, promptDir: 'target',
      question: 'ما معنى هذه الكلمة؟',
      options: shuffle([v.meaning, ...pickDistractors(v, vocab, 3).map(x => x.meaning)]),
      correct: v.meaning });
  }
  for (const v of vocab.slice(0, Math.min(3, vocab.length))) {
    out.push({ type: 'mc', skill: 'vocabulary', wordId: v.id, prompt: v.meaning, promptDir: 'ar',
      question: 'اختر الكلمة الصحيحة',
      options: shuffle([v.word, ...pickDistractors(v, vocab, 3).map(x => x.word)]),
      correct: v.word });
  }
  for (const v of vocab.slice(0, Math.min(2, vocab.length))) {
    if (!v.example) continue;
    const blank = v.example.replace(v.word, '_____');
    out.push({ type: 'type', skill: 'vocabulary', wordId: v.id,
      prompt: blank, promptDir: 'target',
      question: `أكمل الجملة (${v.meaning})`,
      correct: v.word, accept: [v.word, v.roman].filter(Boolean) });
  }
  return shuffle(out).slice(0, Math.min(8, out.length));
}

function pickDistractors(v, all, n) {
  return shuffle(all.filter(x => x.id !== v.id)).slice(0, n);
}

export function runExerciseSet(exercises, container, { title = 'تمرين', onDone } = {}) {
  const st = { idx: 0, correct: 0, total: exercises.length, startedAt: Date.now() };

  function render() {
    container.innerHTML = '';
    if (st.idx >= exercises.length) return finish();
    const ex = exercises[st.idx];
    const lang = getLanguage(State.currentLangCode);
    const dir = ex.promptDir === 'ar' ? 'rtl' : targetDir(lang);

    const wrap = h(`<div>
      <div class="ex-head">
        <span class="chip">${title} — ${st.idx + 1} / ${st.total}</span>
        <button class="btn btn-sm btn-ghost" id="quit">✕</button>
      </div>
      <div class="bar thin mb"><i style="width:${(st.idx / st.total) * 100}%"></i></div>
      <div class="ex-card">
        <div class="ex-prompt">${esc(ex.question)}</div>
        <div class="ex-word target-text" data-dir="${dir}">${esc(ex.prompt)}</div>
        ${ex.promptRoman ? `<div class="ex-roman">${esc(ex.promptRoman)}</div>` : ''}
      </div>
      <div id="ansBox"></div>
      <div id="fb"></div>
    </div>`);

    wrap.querySelector('#quit').onclick = () => { if (onDone) onDone(st.correct, st.total); };

    const ansBox = wrap.querySelector('#ansBox');
    const fb = wrap.querySelector('#fb');

    const finishOne = (ok, correctText, userText) => {
      if (ex.wordId) {
        const card = State.getLangProgress().cards[ex.wordId];
        if (!card) State.ensureCard(ex.wordId);
        const fresh = State.getLangProgress().cards[ex.wordId];
        const grade = gradeFromAttempt({ correct: ok, firstTry: true, timeMs: Date.now() - st.startedAt });
        State.setCard(ex.wordId, review(fresh || newCard(), grade));
        State.getLangProgress().mastery[ex.wordId] = masteryLevel(State.getLangProgress().cards[ex.wordId]);
      }
      if (ok) {
        st.correct++;
        State.addXP(5);
        fb.innerHTML = `<div class="alert alert-info">✓ صحيح</div>`;
      } else {
        fb.innerHTML = `<div class="alert alert-warn">✕ الإجابة الصحيحة: <b>${esc(correctText)}</b></div>`;
        State.logMistake({ type: ex.skill, prompt: ex.prompt, correct: correctText, user: userText });
      }
      const btn = h(`<button class="btn btn-primary btn-block mt">التالي</button>`);
      btn.onclick = () => { st.idx++; st.startedAt = Date.now(); render(); };
      fb.appendChild(btn);
    };

    if (ex.type === 'mc') {
      const grid = h(`<div class="ex-options"></div>`);
      ex.options.forEach(opt => {
        const b = h(`<button class="opt">${esc(opt)}</button>`);
        b.onclick = () => {
          if (grid.dataset.locked) return;
          grid.dataset.locked = '1';
          const ok = opt === ex.correct;
          b.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) [...grid.children].find(x => x.textContent === ex.correct)?.classList.add('reveal');
          finishOne(ok, ex.correct, opt);
        };
        grid.appendChild(b);
      });
      ansBox.appendChild(grid);
    } else {
      const inp = h(`<input class="input" placeholder="اكتب إجابتك…" autocomplete="off">`);
      const btn = h(`<button class="btn btn-primary btn-block mt">تحقق</button>`);
      const submit = () => {
        if (btn.disabled) return;
        const v = inp.value.trim();
        const accepted = ex.accept || [ex.correct];
        const ok = accepted.some(a => String(a).toLowerCase() === v.toLowerCase());
        inp.disabled = true; btn.disabled = true;
        inp.style.borderColor = ok ? 'var(--success)' : 'var(--danger)';
        finishOne(ok, ex.correct, v);
      };
      btn.onclick = submit;
      inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
      ansBox.appendChild(inp); ansBox.appendChild(btn);
      setTimeout(() => inp.focus(), 80);
    }
    container.appendChild(wrap);
  }

  function finish() { if (onDone) onDone(st.correct, st.total); }
  render();
}

/* ================= LEARN ================= */
function LearnView() {
  const lang = getLanguage(State.currentLangCode);
  const p = State.getLangProgress();
  const allVocab = getAllVocab(lang);
  const due = allVocab.filter(v => p.cards[v.id] && isDue(p.cards[v.id]));
  const unseen = allVocab.filter(v => !p.cards[v.id]);
  const pool = [...due, ...unseen].slice(0, 10);

  if (!pool.length) {
    const el = h(`<div class="screen"><div class="alert alert-info">لا توجد مفردات جديدة. راجع ما تعلمته.</div>
      <button class="btn btn-primary btn-block" id="rv">المراجعة</button></div>`);
    el.querySelector('#rv').onclick = () => navigate('review');
    return el;
  }

  const exercises = pool.map(v => ({
    type: 'mc', skill: 'vocabulary', wordId: v.id,
    question: 'اختر المعنى الصحيح',
    prompt: v.word, promptRoman: v.roman, promptDir: 'target',
    options: shuffle([v.meaning, ...shuffle(allVocab.filter(x => x.id !== v.id)).slice(0, 3).map(x => x.meaning)]),
    correct: v.meaning
  }));

  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">📚 مفردات</div><div></div></div>
    <div class="screen"><div id="stage"></div></div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const stage = el.querySelector('#stage');
  runExerciseSet(shuffle(exercises), stage, {
    title: 'مفردات',
    onDone: async (c, t) => {
      State.markToday('vocab');
      State.touchStreak();
      await State.addXP(15);
      const words = Object.values(State.getLangProgress().cards).filter(x => x.reps >= 2).length;
      if (words >= 100) State.unlockAchievement('words-100');
      if (words >= 500) State.unlockAchievement('words-500');
      if (words >= 1000) State.unlockAchievement('words-1000');
      stage.innerHTML = '';
      stage.appendChild(h(`<div class="card-lg card center">
        <div style="font-size:52px">📚</div>
        <div class="h2">أحسنت!</div>
        <div class="sub">${c} / ${t} صحيحة</div>
        <button class="btn btn-primary btn-block mt-lg" id="n">متابعة</button>
      </div>`));
      stage.querySelector('#n').onclick = () => navigate('dashboard');
    }
  });
  return el;
}

/* ================= GRAMMAR ================= */
function GrammarView() {
  const lang = getLanguage(State.currentLangCode);
  const lessons = getAllLessons(lang).filter(l => l.grammar);
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">⚙️ القواعد</div><div></div></div>
    <div class="screen"><div class="grid" id="list"></div></div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const list = el.querySelector('#list');
  lessons.forEach(l => {
    const c = h(`<div class="card card-press">
      <div class="row between">
        <div>
          <div class="h3">${esc(l.grammar.concept)}</div>
          <div class="small muted">${esc(l.levelKey)} — ${esc(l.title)}</div>
        </div>
        <span class="chip">${esc(l.grammar.pattern)}</span>
      </div>
    </div>`);
    c.onclick = () => navigate('lesson', { lessonId: l.id });
    list.appendChild(c);
  });
  return el;
}

/* ================= REVIEW ================= */
function ReviewView() {
  const lang = getLanguage(State.currentLangCode);
  const p = State.getLangProgress();
  const allVocab = getAllVocab(lang);
  const due = allVocab.filter(v => p.cards[v.id] && isDue(p.cards[v.id])).slice(0, 20);

  if (!due.length) {
    const el = h(`<div class="screen">
      <div class="topbar" style="position:static;background:transparent;border:none;padding:0;margin-bottom:16px">
        <button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">🔁 مراجعة</div><div></div>
      </div>
      <div class="card-lg card center">
        <div style="font-size:52px">✅</div>
        <div class="h2">لا يوجد شيء للمراجعة الآن</div>
        <div class="sub">عُد لاحقًا — سيعرض النظام المراجعات تلقائيًا.</div>
        <button class="btn btn-primary btn-block" id="n">الرئيسية</button>
      </div>
    </div>`);
    el.querySelector('#back').onclick = () => navigate('dashboard');
    el.querySelector('#n').onclick = () => navigate('dashboard');
    return el;
  }

  const exercises = due.map(v => {
    const c = p.cards[v.id];
    const useReverse = c && c.reps >= 3;
    if (useReverse) {
      return { type: 'mc', skill: 'vocabulary', wordId: v.id,
        question: 'اختر الكلمة الصحيحة',
        prompt: v.meaning, promptDir: 'ar',
        options: shuffle([v.word, ...shuffle(allVocab.filter(x => x.id !== v.id)).slice(0, 3).map(x => x.word)]),
        correct: v.word };
    }
    return { type: 'mc', skill: 'vocabulary', wordId: v.id,
      question: 'ما معنى هذه الكلمة؟',
      prompt: v.word, promptRoman: v.roman, promptDir: 'target',
      options: shuffle([v.meaning, ...shuffle(allVocab.filter(x => x.id !== v.id)).slice(0, 3).map(x => x.meaning)]),
      correct: v.meaning };
  });

  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">🔁 مراجعة (${due.length})</div><div></div></div>
    <div class="screen"><div id="stage"></div></div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const stage = el.querySelector('#stage');
  runExerciseSet(shuffle(exercises), stage, {
    title: 'مراجعة',
    onDone: async (c, t) => {
      State.touchStreak();
      await State.addXP(10);
      stage.innerHTML = '';
      stage.appendChild(h(`<div class="card-lg card center">
        <div style="font-size:52px">🎯</div>
        <div class="h2">تمت المراجعة</div>
        <div class="sub">${c} / ${t} صحيحة</div>
        <button class="btn btn-primary btn-block mt-lg" id="n">الرئيسية</button>
      </div>`));
      stage.querySelector('#n').onclick = () => navigate('dashboard');
    }
  });
  return el;
}

/* ================= LISTENING ================= */
function ListeningView() {
  const lang = getLanguage(State.currentLangCode);
  const allVocab = getAllVocab(lang).slice(0, 40);
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">🎧 استماع</div><div></div></div>
    <div class="screen"><div id="stage"></div></div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const stage = el.querySelector('#stage');

  if (!Speech.ttsAvailable) {
    stage.appendChild(h(`<div class="alert alert-warn">⚠️ متصفحك لا يدعم تخليق الصوت. يمكنك المتابعة نصيًا.</div>`));
  }

  const pool = shuffle(allVocab).slice(0, 6);
  const exercises = pool.map(v => ({
    type: 'mc', skill: 'listening', wordId: v.id,
    question: Speech.ttsAvailable ? 'استمع واختر المعنى الصحيح' : 'اختر معناها',
    prompt: Speech.ttsAvailable ? '🔊' : v.word, promptDir: 'target',
    options: shuffle([v.meaning, ...shuffle(allVocab.filter(x => x.id !== v.id)).slice(0, 3).map(x => x.meaning)]),
    correct: v.meaning
  }));

  runExerciseSet(exercises, stage, {
    title: 'استماع',
    onDone: async (c, t) => {
      State.markToday('listening');
      State.touchStreak();
      await State.addXP(10);
      await State.addStat('listeningCount', t);
      const s = State.getLangProgress().stats.listeningCount;
      if (s >= 30) State.unlockAchievement('listening-master');
      stage.innerHTML = '';
      stage.appendChild(h(`<div class="card-lg card center">
        <div style="font-size:52px">🎧</div>
        <div class="h2">أحسنت</div>
        <div class="sub">${c} / ${t}</div>
        <button class="btn btn-primary btn-block mt-lg" id="n">الرئيسية</button>
      </div>`));
      stage.querySelector('#n').onclick = () => navigate('dashboard');
    }
  });
  return el;
}

/* ================= READING ================= */
function ReadingView() {
  const lang = getLanguage(State.currentLangCode);
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">📖 قراءة</div><div></div></div>
    <div class="screen">
      <div class="h2">القصص المتدرجة</div>
      <div class="grid" id="list"></div>
    </div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const list = el.querySelector('#list');
  (lang.stories || []).forEach(s => {
    const c = h(`<div class="card card-press">
      <div class="row between">
        <div>
          <div class="h3">${esc(s.title)}</div>
          <div class="small muted">${esc(s.titleAr || '')} — ${esc(s.level)}</div>
        </div>
        <span class="chip accent">${esc(s.level)}</span>
      </div>
    </div>`);
    c.onclick = () => navigate('story', { id: s.id });
    list.appendChild(c);
  });
  return el;
}

function StoryView({ id }) {
  const lang = getLanguage(State.currentLangCode);
  const story = (lang.stories || []).find(s => s.id === id);
  if (!story) return h(`<div class="screen"><div class="alert alert-warn">القصة غير متاحة.</div></div>`);
  const dir = targetDir(lang);

  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">${esc(story.title)}</div><div></div></div>
    <div class="screen">
      <div id="textWrap"></div>
      <div class="h2 mt-lg">أسئلة الفهم</div>
      <div id="qWrap"></div>
    </div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('reading');

  const wrap = el.querySelector('#textWrap');
  story.text.forEach(line => {
    const c = h(`<div class="card mb" style="cursor:pointer">
      <div class="row between">
        <div class="target-text" data-dir="${dir}" style="font-weight:600;font-size:17px;flex:1">${esc(line.t)}</div>
        ${Speech.ttsAvailable ? `<button class="btn btn-sm btn-ghost" title="استمع">🔊</button>` : ''}
      </div>
      ${line.r ? `<div class="small muted">${esc(line.r)}</div>` : ''}
      <div style="margin-top:6px">${esc(line.m)}</div>
    </div>`);
    const sb = c.querySelector('button');
    if (sb) sb.onclick = (e) => { e.stopPropagation(); Speech.speak(line.t, lang.code); };
    wrap.appendChild(c);
  });

  const qWrap = el.querySelector('#qWrap');
  let answered = 0, correct = 0;
  story.questions.forEach((q, qi) => {
    const c = h(`<div class="card mb">
      <div class="h3">${qi + 1}. ${esc(q.q)}</div>
      <div class="ex-options" data-q="${qi}"></div>
    </div>`);
    const grid = c.querySelector('.ex-options');
    shuffle(q.options.map((opt, i) => ({ opt, i }))).forEach(({ opt, i }) => {
      const b = h(`<button class="opt">${esc(opt)}</button>`);
      b.onclick = () => {
        if (grid.dataset.locked) return;
        grid.dataset.locked = '1';
        const ok = i === q.answer;
        b.classList.add(ok ? 'correct' : 'wrong');
        if (ok) correct++;
        answered++;
        if (answered === story.questions.length) {
          State.markToday('reading');
          State.touchStreak();
          State.addXP(15);
          State.addStat('storiesRead');
          State.unlockAchievement('first-story');
          toast(`نتيجة الفهم: ${correct} / ${story.questions.length}`);
        }
      };
      grid.appendChild(b);
    });
    qWrap.appendChild(c);
  });

  return el;
}

/* ================= SPEAKING ================= */
function SpeakingView() {
  const lang = getLanguage(State.currentLangCode);
  const vocab = getAllVocab(lang).slice(0, 30);
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">🎙️ تحدث</div><div></div></div>
    <div class="screen" id="stage"></div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const stage = el.querySelector('#stage');

  if (!Speech.sttAvailable) {
    stage.appendChild(h(`<div class="alert alert-warn">⚠️ التعرّف على الكلام غير مدعوم في متصفحك.</div>`));
  }

  let idx = 0;
  const dir = targetDir(lang);

  function show() {
    stage.innerHTML = '';
    if (idx >= 6) {
      State.markToday('speaking'); State.touchStreak(); State.addXP(15);
      State.addStat('speakingCount');
      if (State.getLangProgress().stats.speakingCount >= 30) State.unlockAchievement('speaking-master');
      stage.appendChild(h(`<div class="card-lg card center">
        <div style="font-size:52px">🎙️</div><div class="h2">أحسنت</div>
        <button class="btn btn-primary btn-block mt-lg" id="n">الرئيسية</button>
      </div>`));
      stage.querySelector('#n').onclick = () => navigate('dashboard');
      return;
    }
    const v = vocab[idx % vocab.length];
    const card = h(`<div class="card-lg card">
      <div class="ex-prompt">قل هذه الجملة</div>
      <div class="ex-word target-text" data-dir="${dir}">${esc(v.word)}</div>
      <div class="ex-roman">${esc(v.meaning)}</div>
      <div class="row mt-lg" style="gap:8px">
        <button class="btn" id="snd">🔊 اسمع</button>
        <button class="btn btn-primary" style="flex:1" id="mic">${Speech.sttAvailable ? '🎙️ سجل' : 'ℹ️ تعلّم'}</button>
        <button class="btn btn-ghost" id="skip">تخطّي</button>
      </div>
      <div id="result" class="mt"></div>
    </div>`);
    card.querySelector('#snd').onclick = () => Speech.speak(v.word, lang.code);
    card.querySelector('#skip').onclick = () => { idx++; show(); };
    card.querySelector('#mic').onclick = async () => {
      const res = card.querySelector('#result');
      res.innerHTML = '<div class="alert alert-info">… استمع إليك</div>';
      const out = await Speech.listen(lang.code);
      if (!out) { res.innerHTML = '<div class="alert alert-warn">لم نستطع التقاط صوتك.</div>'; return; }
      const score = Math.round(similarity(out.transcript, v.word) * 100);
      res.innerHTML = score >= 70
        ? `<div class="alert alert-info">✓ نطق جيد (${score}%)</div>`
        : `<div class="alert alert-warn">سمعنا: "${esc(out.transcript)}" — حاول مجددًا.</div>`;
      if (score >= 70) { State.addXP(5); setTimeout(() => { idx++; show(); }, 900); }
    };
    stage.appendChild(card);
  }
  show();
  return el;
}

function similarity(a, b) {
  a = (a || '').trim().toLowerCase();
  b = (b || '').trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  let best = 0;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      if (a[i - 1] === b[j - 1]) { m[i][j] = m[i - 1][j - 1] + 1; if (m[i][j] > best) best = m[i][j]; }
  return best / Math.max(a.length, b.length);
}

/* ================= CONVERSATION (simple rule-based) ================= */
function ConversationView() {
  const lang = getLanguage(State.currentLangCode);
  const convs = lang.conversations || [];
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">💬 محادثة</div><div></div></div>
    <div class="screen"><div id="stage"></div></div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const stage = el.querySelector('#stage');

  if (!convs.length) {
    stage.appendChild(h(`<div class="alert alert-info">لا توجد محادثات متاحة لهذه اللغة بعد.</div>`));
    return el;
  }

  const conv = convs[0];
  let turnIdx = 0;
  const dir = targetDir(lang);

  function render() {
    stage.innerHTML = '';
    if (turnIdx >= conv.turns.length) {
      State.markToday('speaking'); State.touchStreak(); State.addXP(20);
      State.unlockAchievement('first-conversation');
      stage.appendChild(h(`<div class="card-lg card center">
        <div style="font-size:52px">💬</div><div class="h2">أكملت المحادثة</div>
        <button class="btn btn-primary btn-block mt-lg" id="n">الرئيسية</button>
      </div>`));
      stage.querySelector('#n').onclick = () => navigate('dashboard');
      return;
    }
    const turn = conv.turns[turnIdx];
    const card = h(`<div class="card-lg card">
      <div class="ex-prompt">قل هذا</div>
      <div class="ex-word target-text" data-dir="${dir}">${esc(turn.user)}</div>
      <div class="divider"></div>
      <div class="small muted">الرد المتوقع</div>
      <div class="target-text" data-dir="${dir}" style="font-weight:600">${esc(turn.reply)}</div>
      <div class="small muted">${esc(turn.replyMeaning || '')}</div>
      <div class="row mt-lg" style="gap:8px">
        <button class="btn" id="snd">🔊</button>
        <button class="btn btn-primary" style="flex:1" id="next">التالي</button>
      </div>
    </div>`);
    card.querySelector('#snd').onclick = () => Speech.speak(turn.reply, lang.code);
    card.querySelector('#next').onclick = () => { turnIdx++; render(); };
    stage.appendChild(card);
  }
  render();
  return el;
}

/* ================= DICTIONARY ================= */
function DictionaryView() {
  const lang = getLanguage(State.currentLangCode);
  const allVocab = getAllVocab(lang);
  const dir = targetDir(lang);
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">📕 القاموس</div><div></div></div>
    <div class="screen">
      <input class="input mb" id="q" placeholder="ابحث بالعربية أو باللغة المستهدفة…">
      <div id="res"></div>
    </div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const res = el.querySelector('#res');
  const q = el.querySelector('#q');

  function render(qs = '') {
    res.innerHTML = '';
    const s = qs.trim().toLowerCase();
    const filtered = s ? allVocab.filter(v =>
      v.word.toLowerCase().includes(s) ||
      (v.roman || '').toLowerCase().includes(s) ||
      v.meaning.toLowerCase().includes(s)
    ) : allVocab;
    if (!filtered.length) return res.appendChild(h(`<div class="card center muted">لا توجد نتائج.</div>`));
    filtered.slice(0, 40).forEach(v => {
      const card = State.getLangProgress().cards[v.id];
      const m = card ? masteryLevel(card) : 0;
      const entry = h(`<div class="dict-entry">
        <div class="row between">
          <div>
            <div class="w target-text" data-dir="${dir}">${esc(v.word)}</div>
            ${v.roman ? `<div class="r">${esc(v.roman)}</div>` : ''}
          </div>
          ${Speech.ttsAvailable ? `<button class="btn btn-sm btn-ghost" title="استمع">🔊</button>` : ''}
        </div>
        <div class="m">${esc(v.meaning)}</div>
        ${v.example ? `<div class="ex"><div class="target-text" data-dir="${dir}">${esc(v.example)}</div><div class="small muted">${esc(v.exampleMeaning || '')}</div></div>` : ''}
        <div class="row between" style="margin-top:8px">
          <span class="chip small">${esc(v.type || '')}</span>
          <span class="chip small ${m > 0.5 ? 'success' : ''}">${esc(masteryLabel(m))}</span>
        </div>
      </div>`);
      const sb = entry.querySelector('button');
      if (sb) sb.onclick = () => Speech.speak(v.word, lang.code);
      res.appendChild(entry);
    });
  }
  q.oninput = () => render(q.value);
  render();
  return el;
}

/* ================= MISTAKES ================= */
function MistakesView() {
  const p = State.getLangProgress();
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">📓 دفتر الأخطاء</div><div></div></div>
    <div class="screen">
      <div class="sub">تُحفظ أخطاؤك المهمة ليعيد النظام تدريبك عليها.</div>
      <div id="list"></div>
    </div>
  </div>`);
  el.querySelector('#back').onclick = () => navigate('dashboard');
  const list = el.querySelector('#list');
  if (!p.mistakes.length) {
    list.appendChild(h(`<div class="card-lg card center"><div style="font-size:52px">✨</div><div>لا توجد أخطاء مسجلة بعد.</div></div>`));
  } else {
    [...p.mistakes].reverse().forEach(m => {
      list.appendChild(h(`<div class="card mb">
        <div class="row between"><span class="chip">${esc(m.type)}</span></div>
        <div class="mt" style="font-weight:600">${esc(m.prompt)}</div>
        <div class="small">الصحيح: <b style="color:var(--success)">${esc(m.correct)}</b></div>
        ${m.user ? `<div class="small muted">إجابتك: ${esc(m.user)}</div>` : ''}
      </div>`));
    });
    const b = h(`<button class="btn btn-danger btn-block mt-lg">مسح سجل الأخطاء</button>`);
    b.onclick = async () => {
      if (!confirm('سيتم مسح سجل الأخطاء بالكامل. متأكد؟')) return;
      await State.clearMistakes();
      toast('تم مسح السجل');
      navigate('mistakes');
    };
    list.appendChild(b);
  }
  return el;
}

/* ================= PROGRESS ================= */
function ProgressView() {
  const lang = getLanguage(State.currentLangCode);
  const p = State.getLangProgress();
  const allVocab = getAllVocab(lang);
  const lessons = getAllLessons(lang);
  const completed = Object.values(p.lessons).filter(l => l.completed).length;
  const total = lessons.length || 1;
  const pct = Math.round((completed / total) * 100);
  const learned = Object.values(p.cards).filter(c => c.reps >= 2).length;

  const known = allVocab.filter(v => p.cards[v.id]);
  const learnedArr = known.filter(v => p.cards[v.id].reps >= 2);
  const vocabRatio = allVocab.length ? learnedArr.length / allVocab.length : 0;
  const lessonArr = Object.values(p.lessons);
  const grammarRatio = lessonArr.filter(l => l.score >= 70).length / Math.max(1, lessonArr.length);
  const listeningRatio = Math.min(1, (p.stats.listeningCount || 0) / 30);
  const speakingRatio = Math.min(1, (p.stats.speakingCount || 0) / 30);
  const readingRatio = Math.min(1, (p.stats.storiesRead || 0) / 5);

  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">📊 التقدم</div><div></div></div>
    <div class="screen">
      <div class="hero">
        <div class="ex-prompt" style="color:rgba(247,245,239,.7)">المستوى الحالي</div>
        <div class="h1" style="font-size:44px">${esc(p.level)}</div>
        <div class="sub" style="margin-bottom:0">التقدم العام ${pct}%</div>
      </div>

      <div class="stat-grid mb-lg">
        <div class="stat-box"><b>${p.xp}</b><span>XP</span></div>
        <div class="stat-box"><b>${p.streak.current}</b><span>سلسلة</span></div>
        <div class="stat-box"><b>${learned}</b><span>كلمات</span></div>
        <div class="stat-box"><b>${completed}</b><span>دروس</span></div>
      </div>

      <div class="h2">المهارات</div>
      <div id="skills"></div>

      <div class="h2 mt-lg">مسار المستويات</div>
      <div class="card">
        <div style="display:flex;flex-direction:column;gap:8px">
          ${['A0','A1','A2','B1','B2','C1','C2'].map(lv => {
            const active = lv === p.level;
            const done = ['A0','A1','A2','B1','B2','C1','C2'].indexOf(lv) < ['A0','A1','A2','B1','B2','C1','C2'].indexOf(p.level);
            return `<div class="row" style="gap:8px;opacity:${done||active?1:.45}">
              <span style="width:26px;text-align:center">${done ? '✓' : (active ? '●' : '○')}</span>
              <b>${lv}</b>
              <div class="bar" style="flex:1"><i style="width:${active?pct:done?100:0}%"></i></div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="h2 mt-lg">الإنجازات</div>
      <div class="grid grid-2" id="ach"></div>
    </div>
  </div>`);

  el.querySelector('#back').onclick = () => navigate('dashboard');

  const sWrap = el.querySelector('#skills');
  [
    { k: 'المفردات', v: vocabRatio },
    { k: 'القواعد', v: grammarRatio },
    { k: 'الاستماع', v: listeningRatio },
    { k: 'التحدث', v: speakingRatio },
    { k: 'القراءة', v: readingRatio }
  ].forEach(s => {
    sWrap.appendChild(h(`<div class="card mb" style="padding:12px">
      <div class="row between mb"><span>${s.k}</span><span class="small muted">${Math.round(s.v * 100)}%</span></div>
      <div class="bar"><i style="width:${s.v * 100}%"></i></div>
    </div>`));
  });

  const aWrap = el.querySelector('#ach');
  ACHIEVEMENTS.forEach(a => {
    const unlocked = p.achievements.includes(a.id);
    aWrap.appendChild(h(`<div class="ach ${unlocked ? 'unlocked' : ''}">
      <div class="medal">${a.icon}</div>
      <div><div style="font-weight:600;font-size:14px">${esc(a.name)}</div><div class="small muted">${esc(a.desc)}</div></div>
    </div>`));
  });

  return el;
}

/* ================= SETTINGS ================= */
function SettingsView() {
  const s = State.settings;
  const el = h(`<div>
    <div class="topbar"><button class="btn btn-sm btn-ghost" id="back">←</button><div class="title">⚙️ الإعدادات</div><div></div></div>
    <div class="screen">
      <div class="card mb">
        <div class="h3">المظهر</div>
        <div class="row wrap" style="gap:8px">
          <button class="btn btn-sm ${s.theme === 'light' ? 'btn-primary' : ''}" data-theme-set="light">☀️ نهاري</button>
          <button class="btn btn-sm ${s.theme === 'dark' ? 'btn-primary' : ''}" data-theme-set="dark">🌙 ليلي</button>
        </div>
      </div>

      <div class="card mb">
        <div class="h3">حجم الخط</div>
        <input type="range" min="14" max="20" step="1" value="${s.fontSize}" id="fs" style="width:100%">
        <div class="small muted center" id="fsVal">${s.fontSize}px</div>
      </div>

      <div class="card mb">
        <div class="h3">سرعة النطق</div>
        <input type="range" min="0.6" max="1.4" step="0.1" value="${s.speechRate}" id="sr" style="width:100%">
        <div class="small muted center" id="srVal">${s.speechRate}x</div>
      </div>

      <div class="card mb">
        <div class="h3">اللغة الحالية</div>
        <div class="sub" style="margin:0">${State.currentLangCode ? getLanguage(State.currentLangCode).name : 'لم يتم الاختيار'}</div>
        <button class="btn btn-sm mt" id="changeLang">تبديل اللغة</button>
      </div>

      <div class="card mb">
        <div class="h3">🔔 التذكير اليومي</div>
        <div id="notifBox"></div>
      </div>

      <div class="card mb">
        <div class="h3">☁️ المزامنة السحابية (اختياري)</div>
        <div class="small muted">اربط endpoint خاص بك. لا تضع مفاتيح حساسة هنا.</div>
        <div id="syncBox"></div>
      </div>

      <div class="card mb">
        <div class="h3">🤖 مساعد AI (اختياري)</div>
        <div class="small muted">اربط endpoint متوافق مع OpenAI/Gemini.</div>
        <div class="row mt"><span class="chip ${AI.isRemote() ? 'success' : ''}">${AI.isRemote() ? '🌐 مُفعّل' : '💾 محلي فقط'}</span></div>
        <input class="input mt" id="aiEndpoint" placeholder="https://your-ai-proxy/v1">
        <input class="input mt" id="aiKey" type="password" placeholder="API Key (يُخزَّن محليًا فقط)">
        <button class="btn btn-sm mt" id="aiSave">حفظ</button>
      </div>

      <div class="card mb">
        <div class="h3">النسخ الاحتياطي</div>
        <div class="row wrap" style="gap:8px">
          <button class="btn btn-sm" id="exp">⬇️ تصدير</button>
          <button class="btn btn-sm" id="imp">⬆️ استيراد</button>
        </div>
      </div>

      <div class="card mb" style="border-color:var(--danger)">
        <div class="h3" style="color:var(--danger)">منطقة الخطر</div>
        <p class="small muted">مسح كل التقدم والإعدادات — لا يمكن الرجوع.</p>
        <button class="btn btn-danger btn-sm" id="reset">مسح كل البيانات</button>
      </div>

      <div class="small muted center mt-lg">لغتي — الإصدار 1.0.0</div>
    </div>
  </div>`);

  el.querySelector('#back').onclick = () => navigate('dashboard');
  el.querySelectorAll('[data-theme-set]').forEach(b => b.onclick = async () => {
    State.settings.theme = b.dataset.themeSet;
    await State.saveSettings();
    navigate('settings');
  });
  const fs = el.querySelector('#fs'), fsVal = el.querySelector('#fsVal');
  fs.oninput = async () => { fsVal.textContent = fs.value + 'px'; State.settings.fontSize = +fs.value; await State.saveSettings(); };
  const sr = el.querySelector('#sr'), srVal = el.querySelector('#srVal');
  sr.oninput = async () => { srVal.textContent = sr.value + 'x'; State.settings.speechRate = +sr.value; await State.saveSettings(); };
  el.querySelector('#changeLang').onclick = () => navigate('languages');

  // Notifications
  const notifCfg = Notifications.getConfig();
  const notifBox = el.querySelector('#notifBox');
  if (Notifications.supported) {
    notifBox.innerHTML = `
      <label class="row" style="gap:8px;cursor:pointer">
        <input type="checkbox" id="notifOn" ${notifCfg.enabled ? 'checked' : ''}>
        <span>تشغيل التذكير</span>
      </label>
      <div class="row mt" style="gap:8px">
        <input type="number" class="input" id="notifHour" min="0" max="23" value="${notifCfg.hour}" style="width:80px">
        <span>:</span>
        <input type="number" class="input" id="notifMin" min="0" max="59" value="${notifCfg.minute}" style="width:80px">
      </div>`;
    notifBox.querySelector('#notifOn').onchange = async (e) => {
      if (e.target.checked) {
        const perm = await Notifications.requestPermission();
        if (perm !== 'granted') { toast('تم رفض الإذن'); e.target.checked = false; return; }
      }
      Notifications.setConfig({ enabled: e.target.checked, hour: +notifBox.querySelector('#notifHour').value, minute: +notifBox.querySelector('#notifMin').value });
    };
    notifBox.querySelector('#notifHour').onchange = () => Notifications.setConfig({ ...Notifications.getConfig(), hour: +notifBox.querySelector('#notifHour').value });
    notifBox.querySelector('#notifMin').onchange = () => Notifications.setConfig({ ...Notifications.getConfig(), minute: +notifBox.querySelector('#notifMin').value });
  } else {
    notifBox.innerHTML = '<div class="small muted">الإشعارات غير مدعومة في متصفحك.</div>';
  }

  // Sync
  const syncCfg = Sync.getConfig();
  const syncBox = el.querySelector('#syncBox');
  syncBox.innerHTML = `
    <label class="row mt" style="gap:8px;cursor:pointer">
      <input type="checkbox" id="syncOn" ${syncCfg.enabled ? 'checked' : ''}>
      <span>تفعيل المزامنة</span>
    </label>
    <input class="input mt" id="syncEndpoint" placeholder="https://your-backend/sync" value="${syncCfg.endpoint || ''}">
    <input class="input mt" id="syncToken" type="password" placeholder="Token" value="${syncCfg.token || ''}">
    <div class="row mt" style="gap:8px">
      <button class="btn btn-sm" id="syncPush">⬆️ رفع</button>
      <button class="btn btn-sm" id="syncPull">⬇️ تنزيل</button>
    </div>`;
  syncBox.querySelector('#syncOn').onchange = (e) => Sync.setConfig({ enabled: e.target.checked, endpoint: syncBox.querySelector('#syncEndpoint').value, token: syncBox.querySelector('#syncToken').value });
  syncBox.querySelector('#syncEndpoint').onchange = () => Sync.setConfig({ ...Sync.getConfig(), endpoint: syncBox.querySelector('#syncEndpoint').value });
  syncBox.querySelector('#syncToken').onchange = () => Sync.setConfig({ ...Sync.getConfig(), token: syncBox.querySelector('#syncToken').value });
  syncBox.querySelector('#syncPush').onclick = async () => { const r = await Sync.push(); toast(r.ok ? 'تم الرفع' : 'فشل: ' + r.reason); };
  syncBox.querySelector('#syncPull').onclick = async () => { const r = await Sync.pull(); toast(r.ok ? 'تم التنزيل' : 'فشل: ' + r.reason); };

  // AI
  el.querySelector('#aiSave').onclick = () => {
    AI.configure({ endpoint: el.querySelector('#aiEndpoint').value, apiKey: el.querySelector('#aiKey').value });
    toast(AI.isRemote() ? 'تم تفعيل AI' : 'AI محلي فقط');
  };

  // Backup
  el.querySelector('#exp').onclick = async () => {
    const data = await State.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `loghati-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('تم التصدير');
  };
  el.querySelector('#imp').onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        await State.importAll(data);
        toast('تم الاستيراد');
        navigate('dashboard');
      } catch { toast('ملف غير صالح'); }
    };
    inp.click();
  };
  el.querySelector('#reset').onclick = async () => {
    if (!confirm('سيتم مسح جميع بياناتك نهائيًا. متابعة؟')) return;
    if (!confirm('تأكيد أخير — لا يمكن التراجع.')) return;
    await State.resetAll();
    toast('تمت التهيئة');
    navigate('splash');
  };

  return el;
}

/* ================= ROUTER ================= */
const VIEWS = {
  splash: { fn: SplashView },
  languages: { fn: LanguagesView },
  goal: { fn: GoalView },
  placement: { fn: PlacementView },
  'placement-result': { fn: PlacementResultView },
  dashboard: { fn: DashboardView },
  lesson: { fn: LessonView },
  learn: { fn: LearnView },
  grammar: { fn: GrammarView },
  review: { fn: ReviewView },
  listening: { fn: ListeningView },
  reading: { fn: ReadingView },
  story: { fn: StoryView },
  speaking: { fn: SpeakingView },
  conversation: { fn: ConversationView },
  dictionary: { fn: DictionaryView },
  mistakes: { fn: MistakesView },
  progress: { fn: ProgressView },
  settings: { fn: SettingsView },
  writing: { fn: WritingView },
  translation: { fn: TranslationView },
  'conversation-v2': { fn: ConversationV2View },
  'listening-plus': { fn: ListeningPlusView },
  certificates: { fn: CertificatesView }
};

export function renderApp(root) {
  root.innerHTML = '';
  const viewName = State.view;
  const entry = VIEWS[viewName] || VIEWS.splash;
  const params = State.viewParams || {};
  const el = entry.fn(params);
  root.appendChild(el);

  if (['dashboard', 'learn', 'grammar', 'review', 'progress'].includes(viewName) || State.currentLangCode) {
    root.appendChild(buildNav(viewName));
  }
}

function buildNav(active) {
  const items = [
    { id: 'dashboard', ic: '🏠', label: 'الرئيسية' },
    { id: 'learn', ic: '📚', label: 'تعلّم' },
    { id: 'review', ic: '🔁', label: 'مراجعة' },
    { id: 'progress', ic: '📊', label: 'تقدم' },
    { id: 'settings', ic: '⚙️', label: 'إعدادات' }
  ];
  const nav = h(`<nav class="nav" role="navigation" aria-label="التنقل">${items.map(i =>
    `<button data-nav="${i.id}" class="${active === i.id ? 'active' : ''}" aria-label="${i.label}">
      <span class="ic">${i.ic}</span><span>${i.label}</span>
    </button>`).join('')}</nav>`);
  nav.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = () => navigate(b.dataset.nav);
  });
  return nav;
}
