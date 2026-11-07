import { getAllLessons, getGrammar, getVocabulary } from './data.js';
import { getAll, get, put } from './database.js';
import { addToReview, getDueReviews, rateReview } from './spaced-repetition.js';
import { speakTurkish, startRecording, stopRecording, recognizeTurkish, canRecognize, isRecording } from './audio.js';
import { saveQuizResult, recordStudy } from './progress.js';
import { escapeHtml, escapeAttr, questionMarkup, matchesExpected } from './quizzes.js';

const icon = (name) => window.turkiyaIcon?.(name) || '';

export async function renderGrammar(root) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحمّل قواعد التركية…</p></div>';
  try {
    const rules = await getGrammar();
    root.innerHTML = `<div class="view-header"><div><span class="kicker">افهم كيف تعمل اللغة</span><h1>القواعد التركية</h1><p>قواعد قصيرة داخل أمثلة استعمالية، مع تصحيح خطأ شائع وسبب التصحيح.</p></div><span class="status-pill">${rules.length} قاعدة</span></div>
      <label class="search-box"><span data-icon="search"></span><input id="grammar-search" type="search" placeholder="ابحث عن قاعدة أو مستوى…"></label>
      <div class="filter-row">${['all','Pre-A1','A1','A2','B1','B2','C1','C2'].map((level) => `<button class="filter-chip ${level === 'all' ? 'active' : ''}" data-grammar-level="${level}">${level === 'all' ? 'كل المستويات' : level}</button>`).join('')}</div>
      <div id="grammar-list">${rules.map((rule) => `<details class="panel rule-card" data-rule data-level="${escapeAttr(rule.level)}" data-search="${escapeAttr([rule.titleAr,rule.explanationAr,rule.level].join(' '))}"><summary class="rule-summary"><span><span class="level-pill">${escapeHtml(rule.level)}</span> <strong>${escapeHtml(rule.titleAr)}</strong></span><span data-icon="chevron"></span></summary><div class="rule-body"><p>${escapeHtml(rule.explanationAr)}</p><div class="rule-formula">${escapeHtml(rule.form || '')}</div><p><b>متى نستخدمها؟</b> ${escapeHtml(rule.whenToUse || '')}</p>${(rule.examples || []).map((example) => `<div class="example-row"><div><span class="tr" dir="ltr" lang="tr">${escapeHtml(example.tr)}</span><br>${escapeHtml(example.ar)}</div><div><span class="wrong-example" dir="ltr">${escapeHtml(example.wrong || '')}</span><br><span class="corrected-example" dir="ltr">${escapeHtml(example.correction || example.tr)}</span><small class="word-example">${escapeHtml(example.why || '')}</small></div></div>`).join('')}</div></details>`).join('') || '<div class="empty-state"><strong>لا توجد قواعد محمّلة</strong><p>تحقق من ملف بيانات القواعد.</p></div>'}</div>`;
    root.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon(el.closest('summary') ? 'chevron' : 'search'); });
    const practice = document.createElement('section');
    practice.className = 'section-block panel panel-padding';
    const samples = rules.flatMap((rule) => (rule.examples || []).map((example) => ({
      level: rule.level, title: rule.titleAr, questionAr: `اختر الصياغة الصحيحة: ${rule.titleAr}`,
      options: [example.correction || example.tr, example.wrong].filter(Boolean), correctIndex: 0, explanationAr: example.why || ''
    })));
    practice.innerHTML = `<div class="section-heading"><div><h2>اختبر القاعدة</h2><p>اختر الصياغة الصحيحة؛ تُحفظ النتيجة محلياً.</p></div></div>${samples.slice(0, 8).map((question, index) => `<div data-grammar-sample="${escapeAttr(question.title)}">${questionMarkup(question, index, 'grammar')}</div>`).join('')}`;
    root.querySelector('#grammar-list').after(practice);
    practice.querySelectorAll('.question-card input').forEach((input) => input.addEventListener('change', async () => {
      const card = input.closest('.question-card'); if (card.dataset.answered) return;
      card.dataset.answered = 'true'; card.querySelectorAll('input').forEach((radio) => { radio.disabled = true; });
      const correct = Number(input.value) === Number(card.dataset.correct); const feedback = card.querySelector('.quiz-feedback');
      feedback.textContent = `${correct ? 'صحيح. ' : 'راجع القاعدة. '}${card.dataset.explanation}`;
      feedback.className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
      await saveQuizResult({ score: correct ? 1 : 0, total: 1, skill: 'القواعد', label: card.closest('[data-grammar-sample]')?.dataset.grammarSample || 'قواعد' });
      window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
    }));
    let selectedLevel = 'all';
    const applyFilter = () => {
      const query = root.querySelector('#grammar-search').value.trim().toLocaleLowerCase('ar');
      root.querySelectorAll('[data-rule]').forEach((rule) => {
        const matchesLevel = selectedLevel === 'all' || rule.dataset.level.toLocaleLowerCase('en') === selectedLevel.toLocaleLowerCase('en');
        rule.hidden = !matchesLevel || (query && !rule.dataset.search.toLocaleLowerCase('ar').includes(query));
      });
    };
    root.querySelector('#grammar-search').addEventListener('input', applyFilter);
    root.querySelectorAll('[data-grammar-level]').forEach((button) => button.addEventListener('click', () => {
      selectedLevel = button.dataset.grammarLevel;
      root.querySelectorAll('[data-grammar-level]').forEach((chip) => chip.classList.toggle('active', chip === button));
      applyFilter();
    }));
  } catch (error) { root.innerHTML = `<div class="empty-state"><strong>تعذر تحميل القواعد</strong><p>${escapeHtml(error.message)}</p></div>`; }
}

export async function renderListening(root, { toast = () => {} } = {}) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحضّر مختبر الاستماع…</p></div>';
  try {
    const lessons = await getAllLessons();
    const items = lessons.flatMap((lesson) => (lesson.listening || []).map((item, index) => ({ ...item, id: `${lesson.id}-listen-${index}`, level: lesson.level, lesson: lesson.titleAr })));
    const vocab = await getVocabulary();
    root.innerHTML = `<div class="view-header"><div><span class="kicker">استمع، توقّع، ثم تحقّق</span><h1>مختبر الاستماع</h1><p>استمع إلى الجملة بتمهّل أو بسرعة طبيعية. الصوت الذي يعمل في هذه الصفحة هو صوت الجهاز الآلي عند توفره، وليس تسجيلاً لمتحدث أصلي.</p></div><span class="status-pill">${items.length} تمريناً</span></div>
      <div class="notice warning">تختلف الأصوات التركية المتاحة من جهاز إلى آخر. إذا لم تجد صوتاً تركياً، يبقى النص والاختبار متاحين ويمكن إعادة المحاولة لاحقاً.</div>
      <div class="filter-row"><label class="range-control">السرعة <input id="speech-rate" type="range" min="0.65" max="1.1" step="0.05" value="0.85"><span id="speech-rate-label">0.85×</span></label><label class="filter-chip"><input type="checkbox" id="show-listening-text"> إظهار النصوص</label></div>
      ${items.length ? items.map((item, index) => `<article class="activity-card" data-listen-card><div class="section-heading"><div><span class="level-pill">${escapeHtml(item.level)}</span><h3>${escapeHtml(item.lesson)}</h3></div><span class="word-pos">تمرين ${index + 1}</span></div><button class="secondary-button button-small" type="button" data-speak-listening="${escapeAttr(item.id)}">${icon('volume')} استمع</button><button class="quiet-button button-small" type="button" data-toggle-listening>إظهار النص</button><p class="activity-sentence" data-listen-sentence hidden lang="tr" dir="ltr">${escapeHtml(item.sentenceTr)}</p><div class="question-card" data-question="${escapeAttr(item.id)}" data-correct="${Number(item.correctIndex) || 0}" data-explanation="${escapeAttr(item.explanationAr || '')}"><p>${escapeHtml(item.questionAr)}</p><div class="option-list">${(item.options || []).map((option, optionIndex) => `<label class="quiz-option"><input type="radio" name="listen-${index}" value="${optionIndex}"><span>${escapeHtml(option)}</span></label>`).join('')}</div><div class="quiz-feedback" aria-live="polite"></div></div></article>`).join('') : '<div class="empty-state"><strong>لا توجد تمارين استماع متاحة بعد</strong><p>ستظهر التمارين فور إضافة جمل إلى ملفات الدروس.</p></div>'}
      <section class="section-block panel panel-padding"><div class="section-heading"><div><h2>كلمات فاتتك؟</h2><p>أدخل الكلمات التركية مفصولة بفواصل أو مسافات لإضافتها إلى المراجعة إن كانت في القاموس.</p></div></div><div class="form-field"><label for="missed-words">الكلمات غير المفهومة</label><input id="missed-words" lang="tr" dir="ltr" placeholder="merhaba, teşekkürler"></div><button id="add-missed" type="button" class="secondary-button button-small">أضف الكلمات المعروفة للمراجعة</button></section>`;
    root.querySelectorAll('[data-speak-listening]').forEach((button) => button.addEventListener('click', () => {
      const item = items.find((entry) => entry.id === button.dataset.speakListening);
      const speed = Number(root.querySelector('#speech-rate').value);
      const response = item && speakTurkish(item.sentenceTr, { rate: speed });
      if (!response?.ok) toast(response?.message || 'تعذر تشغيل النطق.');
      else toast('صوت آلي من الجهاز، وليس تسجيلاً أصلياً.');
    }));
    root.querySelector('#speech-rate').addEventListener('input', (event) => { root.querySelector('#speech-rate-label').textContent = `${Number(event.target.value).toFixed(2)}×`; });
    root.querySelector('#show-listening-text').addEventListener('change', (event) => {
      root.querySelectorAll('[data-listen-sentence]').forEach((sentence) => { sentence.hidden = !event.target.checked; });
    });
    root.querySelectorAll('[data-toggle-listening]').forEach((button) => button.addEventListener('click', () => {
      const sentence = button.previousElementSibling;
      sentence.hidden = !sentence.hidden;
      button.textContent = sentence.hidden ? 'إظهار النص' : 'إخفاء النص';
    }));
    root.querySelectorAll('.question-card input').forEach((input) => input.addEventListener('change', async () => {
      const card = input.closest('.question-card'); if (card.dataset.answered) return;
      card.dataset.answered = 'true'; card.querySelectorAll('input').forEach((radio) => { radio.disabled = true; });
      const good = Number(input.value) === Number(card.dataset.correct); const feedback = card.querySelector('.quiz-feedback');
      feedback.textContent = `${good ? 'إجابة صحيحة. ' : 'إجابة غير صحيحة. '}${card.dataset.explanation}`;
      feedback.className = `quiz-feedback ${good ? 'correct' : 'incorrect'}`;
      await saveQuizResult({ score: good ? 1 : 0, total: 1, skill: 'الاستماع', label: card.dataset.question });
      window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
    }));
    root.querySelector('#add-missed').addEventListener('click', async () => {
      const raw = root.querySelector('#missed-words').value;
      const tokens = raw.split(/[\s,،;؛]+/u).map((item) => item.trim().toLocaleLowerCase('tr-TR')).filter(Boolean);
      const found = vocab.filter((word) => tokens.includes(word.tr.toLocaleLowerCase('tr-TR')));
      for (const word of found) await addToReview(word);
      toast(found.length ? `أُضيفت ${found.length} كلمة إلى المراجعة.` : 'لم نجد كلمات مطابقة في القاموس.');
    });
  } catch (error) { root.innerHTML = `<div class="empty-state"><strong>تعذر تحميل مختبر الاستماع</strong><p>${escapeHtml(error.message)}</p></div>`; }
}

export async function renderSpeaking(root, { toast = () => {} } = {}) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحمّل مواقف المحادثة…</p></div>';
  try {
    const lessons = await getAllLessons();
    const dialogues = lessons.flatMap((lesson) => lesson.dialogue?.length ? [{ id: lesson.id, level: lesson.level, title: lesson.titleAr, dialogue: lesson.dialogue }] : []);
    root.innerHTML = `<div class="view-header"><div><span class="kicker">تدرّب على قولها بصوتك</span><h1>التحدث وShadowing</h1><p>استمع إلى الجملة ثم قلّدها. يمكن تسجيل صوتك محلياً للاستماع والمقارنة، من دون رفعه إلى خادم.</p></div><span class="status-pill">${dialogues.length} حوارات</span></div>
      <div class="notice warning">صوت النموذج من SpeechSynthesis وقد يكون صوتاً آلياً. تعرف المتصفح على الكلام، عند توفره، تقديري ويتطلب إذن الميكروفون؛ لا يقيّم جودة النطق حكماً دقيقاً.</div>
      ${dialogues.map((item) => `<article class="activity-card"><div class="section-heading"><div><span class="level-pill">${escapeHtml(item.level)}</span><h3>${escapeHtml(item.title)}</h3></div></div>${item.dialogue.map((line,index) => `<div class="example-row"><div><span class="tr" lang="tr" dir="ltr">${escapeHtml(line.tr)}</span></div><div><b>${escapeHtml(line.speaker || `المتحدث ${index + 1}`)}:</b> ${escapeHtml(line.ar)} <button class="tiny-icon-button" type="button" data-speak="${escapeAttr(line.tr)}" aria-label="استمع"><span data-icon="volume"></span></button></div></div>`).join('')}</article>`).join('')}
      <section class="section-block panel panel-padding"><div class="section-heading"><div><h2>سجّل وقارن</h2><p>اختر جملة أعلاه، استمع إليها، ثم سجّل صوتك وأعد تشغيل التسجيل.</p></div></div><div class="form-field"><label for="shadow-line">الجملة التركية للتدريب</label><input id="shadow-line" lang="tr" dir="ltr" placeholder="Merhaba, nasılsınız?"></div><div class="audio-controls"><button id="model-play" class="secondary-button button-small" type="button">${icon('volume')} استمع للنموذج</button><button id="record-toggle" class="primary-button button-small" type="button">${icon('mic')} ابدأ التسجيل</button><button id="recognize-toggle" class="quiet-button button-small" type="button" ${canRecognize() ? '' : 'disabled'}>تعرف تقريبي على الكلام</button><span id="record-status" class="word-pos"></span></div><p id="speech-comparison" class="transcript" aria-live="polite"></p><audio id="recorded-audio" controls hidden></audio></section>`;
    root.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon('volume'); });
    root.querySelectorAll('[data-speak]').forEach((button) => button.addEventListener('click', () => {
      const result = speakTurkish(button.dataset.speak);
      toast(result.ok ? 'استمع ثم قلّد الإيقاع والنبر.' : result.message);
    }));
    root.querySelector('#model-play').addEventListener('click', () => {
      const text = root.querySelector('#shadow-line').value.trim();
      if (!text) return toast('أدخل جملة تركية أولاً.');
      const result = speakTurkish(text); if (!result.ok) toast(result.message);
    });
    root.querySelector('#record-toggle').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      const status = root.querySelector('#record-status');
      if (!isRecording()) {
        try {
          await startRecording(); button.textContent = 'أوقف التسجيل'; status.innerHTML = '<span class="record-indicator">يسجّل الآن</span>';
        } catch (error) { toast(error.message); }
      } else {
        try {
          const result = await stopRecording(); button.textContent = 'ابدأ التسجيل';
          const player = root.querySelector('#recorded-audio'); player.src = result.url; player.hidden = false;
          status.textContent = 'التسجيل مؤقت في هذه الجلسة؛ لم يُرفع ولم يُحفظ بعد إغلاق الصفحة.';
        } catch (error) { toast(error.message); button.textContent = 'ابدأ التسجيل'; }
      }
    });
    root.querySelector('#recognize-toggle').addEventListener('click', () => {
      const status = root.querySelector('#speech-comparison');
      if (!canRecognize()) return toast('التعرف على الكلام غير مدعوم في هذا المتصفح.');
      status.textContent = 'جارٍ الاستماع… اسمح بالميكروفون عند الطلب.';
      try {
        recognizeTurkish({ onResult: (text) => {
          const target = root.querySelector('#shadow-line').value.trim();
          status.textContent = `سمع المتصفح: «${text}» — مقارنة نصية تقريبية فقط${target ? `؛ الجملة المقصودة: «${target}»` : ''}.`;
        }, onError: (error) => { status.textContent = `تعذر التعرف على الكلام: ${error}.`; }, onEnd: () => {} });
      } catch (error) { toast(error.message); }
    });
  } catch (error) { root.innerHTML = `<div class="empty-state"><strong>تعذر تحميل المواقف</strong><p>${escapeHtml(error.message)}</p></div>`; }
}

function readingWords(text, vocab) {
  return String(text || '').split(/(\s+)/u).map((part) => {
    if (!part.trim()) return part;
    const clean = part.replace(/^[^\p{L}ığüşöçİĞÜŞÖÇ]+|[^\p{L}ığüşöçİĞÜŞÖÇ]+$/gu, '');
    const found = vocab.find((word) => word.tr?.toLocaleLowerCase('tr-TR') === clean.toLocaleLowerCase('tr-TR'));
    return `<button type="button" data-read-word="${escapeAttr(clean)}" title="${found ? escapeAttr(found.ar) : 'اضغط لمعرفة المعنى'}">${escapeHtml(part)}</button>`;
  }).join('');
}

export async function renderReading(root, { toast = () => {} } = {}) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نجهّز مكتبة القراءة…</p></div>';
  try {
    const [lessons, vocab] = await Promise.all([getAllLessons(), getVocabulary()]);
    const readings = lessons.filter((lesson) => lesson.reading).map((lesson) => ({ ...lesson.reading, level: lesson.level, lesson: lesson.titleAr, vocab: lesson.vocabulary || [] }));
    root.innerHTML = `<div class="view-header"><div><span class="kicker">اقرأ من أجل المعنى</span><h1>مكتبة القراءة</h1><p>اختر نصاً مناسباً لمستواك، اخفِ الترجمة أولاً، واضغط على كلمة تركية لتسمعها أو ترى معناها إن كانت في القاموس.</p></div><span class="status-pill">${readings.length} نصوص</span></div>
      ${readings.map((item,index) => `<article class="panel reading-card section-block"><div class="section-heading"><div><span class="level-pill">${escapeHtml(item.level)}</span><h2>${escapeHtml(item.titleAr || item.lesson)}</h2></div><button class="tiny-icon-button" type="button" data-speak-reading="${index}" aria-label="استمع إلى النص"><span data-icon="volume"></span></button></div><p class="word-pos">${escapeHtml(item.lesson)}</p><div class="reading-text" lang="tr" dir="ltr">${readingWords(item.textTr,vocab)}</div><button class="quiet-button button-small" type="button" data-toggle-read-translation>إظهار الترجمة العربية</button><div class="reading-translation" hidden>${escapeHtml(item.translationAr || '')}</div>${(item.questions || []).map((q,qIndex) => `<div class="question-card" data-question="read-${index}-${qIndex}" data-correct="${Number(q.correctIndex) || 0}" data-explanation="${escapeAttr(q.explanationAr || '')}"><p>${escapeHtml(q.questionAr)}</p><div class="option-list">${(q.options || []).map((option,optionIndex) => `<label class="quiz-option"><input type="radio" name="read-${index}-${qIndex}" value="${optionIndex}"><span>${escapeHtml(option)}</span></label>`).join('')}</div><div class="quiz-feedback" aria-live="polite"></div></div>`).join('')}</article>`).join('') || '<div class="empty-state"><strong>لا توجد نصوص منشورة في هذه النسخة</strong><p>أضف نصوص القراءة إلى بيانات الدروس.</p></div>'}`;
    root.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon('volume'); });
    root.querySelectorAll('[data-toggle-read-translation]').forEach((button) => button.addEventListener('click', () => {
      const box = button.nextElementSibling; box.hidden = !box.hidden; button.textContent = box.hidden ? 'إظهار الترجمة العربية' : 'إخفاء الترجمة';
    }));
    root.querySelectorAll('[data-speak-reading]').forEach((button) => button.addEventListener('click', () => {
      const result = speakTurkish(readings[Number(button.dataset.speakReading)].textTr, { rate: 0.82 }); if (!result.ok) toast(result.message); else toast('صوت آلي من الجهاز.');
    }));
    root.querySelectorAll('[data-read-word]').forEach((button) => button.addEventListener('click', () => {
      const word = vocab.find((item) => item.tr?.toLocaleLowerCase('tr-TR') === button.dataset.readWord.toLocaleLowerCase('tr-TR'));
      if (word) toast(`${word.tr} — ${word.ar}`); else { toast('لم نجد ترجمة لهذه الصيغة في القاموس.'); speakTurkish(button.dataset.readWord); }
    }));
    root.querySelectorAll('.question-card input').forEach((input) => input.addEventListener('change', async () => {
      const card = input.closest('.question-card'); if (card.dataset.answered) return;
      card.dataset.answered = 'true'; card.querySelectorAll('input').forEach((radio) => { radio.disabled = true; });
      const ok = Number(input.value) === Number(card.dataset.correct); const feedback = card.querySelector('.quiz-feedback');
      feedback.textContent = `${ok ? 'إجابة صحيحة. ' : 'راجع النص. '}${card.dataset.explanation}`;
      feedback.className = `quiz-feedback ${ok ? 'correct' : 'incorrect'}`;
      await saveQuizResult({ score: ok ? 1 : 0, total: 1, skill: 'القراءة', label: card.dataset.question });
      window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
    }));
  } catch (error) { root.innerHTML = `<div class="empty-state"><strong>تعذر تحميل القراءة</strong><p>${escapeHtml(error.message)}</p></div>`; }
}

export async function renderWriting(root) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحمّل تمارين الكتابة…</p></div>';
  try {
    const lessons = await getAllLessons();
    const items = lessons.flatMap((lesson) => (lesson.writing || []).map((writing,index) => ({ ...writing, level: lesson.level, lesson: lesson.titleAr, id: `${lesson.id}-write-${index}` })));
    root.innerHTML = `<div class="view-header"><div><span class="kicker">اكتب ثم افهم التصحيح</span><h1>مختبر الكتابة</h1><p>تدريب على الإنتاج التركي. المقارنة هنا محلية مع إجابة مقترحة، وليست تصحيحاً مفتوحاً بالذكاء الاصطناعي.</p></div><span class="status-pill">${items.length} مطالبة</span></div>
      ${items.map((item,index) => `<article class="activity-card"><div class="section-heading"><div><span class="level-pill">${escapeHtml(item.level)}</span><h3>${escapeHtml(item.lesson)}</h3></div></div><p>${escapeHtml(item.promptAr)}</p><div class="form-field"><label for="writing-${index}">اكتب إجابتك باللغة التركية</label><textarea id="writing-${index}" lang="tr" dir="ltr" placeholder="Türkçe yazın…"></textarea></div><button class="secondary-button button-small" type="button" data-check-write="${index}">تحقق من النموذج</button><div class="quiz-feedback" data-write-feedback="${index}" aria-live="polite"></div></article>`).join('') || '<div class="empty-state"><strong>لا توجد مطالبات كتابة بعد</strong><p>ستظهر تدريبات الكتابة المضافة إلى الدروس.</p></div>'}
      <div class="notice warning">قد تكون هناك إجابات تركية صحيحة متعددة. يعرض هذا المختبر النموذج المحدد في بيانات الدرس وسبب استخدامه، ولا يحكم على كل صياغة ممكنة.</div>`;
    root.querySelectorAll('[data-check-write]').forEach((button) => button.addEventListener('click', async () => {
      const index = Number(button.dataset.checkWrite); const item = items[index];
      const value = root.querySelector(`#writing-${index}`).value;
      const accepted = Array.isArray(item.expectedTr) ? item.expectedTr : [item.expectedTr];
      const ok = matchesExpected(value, accepted); const feedback = root.querySelector(`[data-write-feedback="${index}"]`);
      feedback.textContent = ok ? `إجابة مطابقة للنموذج. ${item.explanationAr || ''}` : `النموذج المقترح: ${accepted.join(' / ')}. ${item.explanationAr || ''}`;
      feedback.className = `quiz-feedback ${ok ? 'correct' : 'incorrect'}`;
      await saveQuizResult({ score: ok ? 1 : 0, total: 1, skill: 'الكتابة', label: item.lesson });
      window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
    }));
  } catch (error) { root.innerHTML = `<div class="empty-state"><strong>تعذر تحميل تمارين الكتابة</strong><p>${escapeHtml(error.message)}</p></div>`; }
}

export async function renderReview(root, { toast = () => {} } = {}) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحسب الكلمات المستحقة للمراجعة…</p></div>';
  const due = await getDueReviews();
  const all = await getAll('reviews');
  if (!due.length) {
    root.innerHTML = `<div class="view-header"><div><span class="kicker">الاستدعاء النشط</span><h1>مراجعة اليوم</h1><p>لا توجد كلمات مستحقة الآن. أضف مفردات جديدة من القاموس أو من الدروس.</p></div></div><div class="empty-state"><strong>أحسنت، انتهت مراجعتك الحالية</strong><p>لديك ${all.length} مفردة في نظام المراجعة. الكلمات الجديدة تظهر هنا فور إضافتها.</p><div class="button-row" style="justify-content:center;margin-top:12px"><a class="primary-button" href="#vocabulary" data-route="vocabulary">افتح المفردات</a><a class="secondary-button" href="#lessons" data-route="lessons">تابع الدروس</a></div></div>`;
    return;
  }
  let index = 0;
  let revealed = false;
  const draw = () => {
    if (index >= due.length) {
      root.innerHTML = `<div class="view-header"><div><span class="kicker">اكتمل الاستدعاء النشط</span><h1>أنهيت مراجعة اليوم</h1><p>راجعت ${due.length} مفردة. تعود الكلمات وفق موعدها التالي.</p></div></div><div class="panel panel-padding"><p>لا يحتاج المتقن إلى التكرار نفسه الذي تحتاجه الكلمات الصعبة.</p><button class="primary-button" type="button" data-route="home">العودة إلى الرئيسية</button></div>`;
      window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
      return;
    }
    const item = due[index];
    root.innerHTML = `<div class="view-header"><div><span class="kicker">مراجعة متباعدة · ${index + 1} من ${due.length}</span><h1>استرجع قبل أن تكشف الإجابة</h1><p>تأمل الكلمة، قل معناها في ذهنك، ثم اختر درجة تذكرك.</p></div><span class="status-pill">${due.length - index} متبقية</span></div>
      <div class="flashcard"><span class="level-pill">${escapeHtml(item.level || '')}</span><div class="word-tr" lang="tr" dir="ltr">${escapeHtml(item.tr)}</div>${item.ipa ? `<div class="word-pos">${escapeHtml(item.ipa)}</div>` : ''}<button class="tiny-icon-button" type="button" data-speak-card="${escapeAttr(item.tr)}" aria-label="استمع إلى الكلمة"><span data-icon="volume"></span></button>${revealed ? `<div class="flashcard-answer"><strong>${escapeHtml(item.ar)}</strong><br>${item.exampleTr ? `<span class="tr" dir="ltr">${escapeHtml(item.exampleTr)}</span><br>${escapeHtml(item.exampleAr || '')}` : ''}</div>` : '<button class="primary-button" type="button" data-reveal>أظهر الإجابة</button>'}</div>
      ${revealed ? `<div class="rating-row"><button class="rating-button" data-rating="again"><strong>لم أتذكر</strong><small>قريباً</small></button><button class="rating-button" data-rating="hard"><strong>بصعوبة</strong><small>فاصل أقصر</small></button><button class="rating-button" data-rating="good"><strong>تذكرت</strong><small>تمديد تدريجي</small></button><button class="rating-button" data-rating="easy"><strong>سهل</strong><small>فاصل أطول</small></button></div><p class="word-pos" style="text-align:center">إذا أخطأت، تعود الكلمة بعد نحو 10 دقائق؛ الإجابة الجيدة تمدد الموعد تدريجياً.</p>` : ''}`;
    root.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon('volume'); });
    root.querySelector('[data-speak-card]')?.addEventListener('click', () => { const result = speakTurkish(item.tr); if (!result.ok) toast(result.message); });
    root.querySelector('[data-reveal]')?.addEventListener('click', () => { revealed = true; draw(); });
    root.querySelectorAll('[data-rating]').forEach((button) => button.addEventListener('click', async () => {
      const updated = await rateReview(item, button.dataset.rating);
      await put('progress', { id: `review-event:${Date.now()}`, itemId: item.id, rating: button.dataset.rating, at: new Date().toISOString(), nextDue: updated.nextDue });
      await (async () => {
        await recordStudy({ seconds: 0, xp: button.dataset.rating === 'again' ? 1 : 3 });
      })();
      if (button.dataset.rating === 'again') toast('ستعود هذه الكلمة للمراجعة بعد وقت قصير.');
      index += 1; revealed = false; draw();
    }));
  };
  draw();
}
