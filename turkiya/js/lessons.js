import { getLevels, getAllLessons, getVocabulary } from './data.js';
import { getAll, get } from './database.js';
import { markLessonComplete } from './progress.js';
import { addToReview } from './spaced-repetition.js';
import { speakTurkish } from './audio.js';
import { saveQuizResult } from './progress.js';
import { attachQuizHandlers, escapeHtml, escapeAttr, matchesExpected, questionMarkup } from './quizzes.js';

const levelOrder = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const arabicLevel = { 'Pre-A1':'التهيئة', A1:'مبتدئ', A2:'ابتدائي', B1:'متوسط', B2:'فوق المتوسط', C1:'متقدم', C2:'إتقان متقدم' };
const dialog = () => document.getElementById('app-dialog');
const dialogRoot = () => document.getElementById('dialog-content');

function formatLevel(level) { return `${level} · ${arabicLevel[level] || ''}`; }
function getCompleted(records, id) { return records.some((record) => record.id === `lesson:${id}` && record.completedAt); }

export async function renderLessons(root, { toast = () => {} } = {}) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحمّل خريطة المنهج…</p></div>';
  try {
    const [levels, records] = await Promise.all([getLevels(), getAll('progress')]);
    const completed = new Set(records.filter((record) => record.id.startsWith('lesson:') && record.completedAt).map((record) => record.id.slice(7)));
    const totalLessons = levels.reduce((sum, level) => sum + (level.units || []).reduce((n, unit) => n + (unit.lessons || []).length, 0), 0);
    root.innerHTML = `
      <div class="view-header"><div><span class="kicker">منهج متدرّج</span><h1>مسارك إلى التركية</h1><p>ابدأ من الأساس، ثم وسّع ما تستطيع فهمه واستخدامه في مواقف يومية.</p></div><span class="status-pill">${totalLessons} درساً متاحاً</span></div>
      <div class="filter-row" id="level-filters"><button class="filter-chip active" data-level-filter="all">كل المستويات</button>${levels.map((level) => `<button class="filter-chip" data-level-filter="${escapeAttr(level.level)}">${escapeHtml(level.level)}</button>`).join('')}</div>
      ${levels.map((level) => {
        const lessons = (level.units || []).flatMap((unit) => (unit.lessons || []).map((lesson) => ({ ...lesson, unitTitleAr: unit.titleAr })));
        const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
        return `<section class="level-section" data-level-section="${escapeAttr(level.level)}">
          <div class="section-heading"><div><h2><span class="level-pill">${escapeHtml(level.level)}</span> ${escapeHtml(level.titleAr || '')}</h2><p>${escapeHtml(level.descriptionAr || '')}</p></div><span class="status-pill">${done} / ${lessons.length}</span></div>
          <div class="level-card level-intro"><span class="level-mark">${escapeHtml(level.level)}</span><div><h3>${escapeHtml(level.titleAr || formatLevel(level.level))}</h3><p>${lessons.length} دروس فعلية · تقدّمك محفوظ على هذا الجهاز</p></div><div class="level-meta"><small>${lessons.length ? Math.round(done / lessons.length * 100) : 0}% مكتمل</small><div class="progress-track"><div class="progress-fill" style="width:${lessons.length ? Math.round(done / lessons.length * 100) : 0}%"></div></div></div></div>
          <div class="lesson-list">${lessons.map((lesson, index) => `<article class="lesson-card ${completed.has(lesson.id) ? 'completed' : ''}">
            <div class="lesson-number">${String(index + 1).padStart(2, '0')}</div><div><h3>${escapeHtml(lesson.titleAr)} <span class="level-pill">${escapeHtml(lesson.titleTr || level.level)}</span></h3><p>${escapeHtml(lesson.unitTitleAr || '')} · ${escapeHtml((lesson.objectivesAr || []).slice(0, 1).join(''))}</p></div>
            <div class="lesson-actions">${completed.has(lesson.id) ? '<span class="status-pill">مكتمل</span>' : ''}<button class="primary-button button-small" type="button" data-start-lesson="${escapeAttr(lesson.id)}">${completed.has(lesson.id) ? 'إعادة الدرس' : 'ابدأ الدرس'}</button></div>
          </article>`).join('')}</div>
        </section>`;
      }).join('')}
      <div class="notice warning">المحتوى متدرّج ومتاح بحسب الدروس المنشورة داخل هذه النسخة. إكمال الدروس المتاحة لا يعني اجتياز المستوى رسمياً أو شهادة CEFR.</div>`;

    root.querySelector('#level-filters').addEventListener('click', (event) => {
      const button = event.target.closest('[data-level-filter]');
      if (!button) return;
      root.querySelectorAll('[data-level-filter]').forEach((item) => item.classList.toggle('active', item === button));
      root.querySelectorAll('[data-level-section]').forEach((section) => {
        section.hidden = button.dataset.levelFilter !== 'all' && section.dataset.levelSection !== button.dataset.levelFilter;
      });
    });
    root.onclick = async (event) => {
      const button = event.target.closest('[data-start-lesson]');
      if (!button) return;
      const lesson = await getLessonById(button.dataset.startLesson);
      if (lesson) showLesson(lesson, toast);
    };
  } catch (error) {
    root.innerHTML = `<div class="empty-state"><strong>تعذر تحميل المنهج</strong><p>${escapeHtml(error.message)} تحقق من الاتصال ثم أعد المحاولة.</p><button class="secondary-button button-small" data-reload="lessons">إعادة المحاولة</button></div>`;
  }
}

async function getLessonById(id) { return (await getAllLessons()).find((lesson) => lesson.id === id); }

export async function openLessonById(id, toast = () => {}) {
  const lesson = await getLessonById(id);
  if (!lesson) return false;
  showLesson(lesson, toast);
  return true;
}

function tokenizedReading(text, dictionary) {
  return String(text || '').split(/(\s+)/u).map((part) => {
    if (!part.trim()) return part;
    const clean = part.replace(/^[^\p{L}ığüşöçİĞÜŞÖÇ]+|[^\p{L}ığüşöçİĞÜŞÖÇ]+$/gu, '');
    const entry = dictionary.find((word) => word.tr.toLocaleLowerCase('tr-TR') === clean.toLocaleLowerCase('tr-TR'));
    return `<button type="button" data-word-lookup="${escapeAttr(clean)}" title="${entry ? escapeAttr(entry.ar) : 'اضغط للاستماع'}">${escapeHtml(part)}</button>`;
  }).join('');
}

function showLesson(lesson, toast) {
  const root = dialogRoot();
  const d = dialog();
  if (!root || !d) return;
  const vocab = lesson.vocabulary || [];
  const rootId = `lesson-${lesson.id}`;
  root.innerHTML = `<div class="dialog-inner" id="${escapeAttr(rootId)}">
    <header class="dialog-header"><div><span class="kicker">${escapeHtml(lesson.level)} · درس عملي</span><h2 id="dialog-title">${escapeHtml(lesson.titleAr)}</h2><p dir="ltr">${escapeHtml(lesson.titleTr || '')}</p></div><button class="dialog-close" type="button" data-close-dialog aria-label="إغلاق">×</button></header>
    <div class="dialog-body">
      <div class="notice"><strong>هدف الدرس:</strong> ${(lesson.objectivesAr || []).map(escapeHtml).join(' · ') || escapeHtml(lesson.explanationAr || '')}</div>
      <section class="exercise-box"><h4>تعرّف إلى الكلمات</h4><div class="vocab-grid">${vocab.map((word) => `<article class="vocab-card"><div class="vocab-card-top"><div><div class="word-tr" lang="tr" dir="ltr">${escapeHtml(word.tr)}</div><div class="word-ar">${escapeHtml(word.ar)}</div></div><span class="word-pos">${escapeHtml(word.pos || '')}</span></div><div class="word-example"><b dir="ltr" lang="tr">${escapeHtml(word.exampleTr || '')}</b><br>${escapeHtml(word.exampleAr || '')}</div><div class="word-actions"><button class="tiny-icon-button" type="button" data-speak="${escapeAttr(word.tr)}" aria-label="استمع إلى ${escapeAttr(word.tr)}" title="استمع"><span data-icon="volume"></span></button><button class="quiet-button button-small" type="button" data-add-review="${escapeAttr(word.id || word.tr)}">أضف للمراجعة</button></div></article>`).join('')}</div></section>
      <section class="exercise-box"><h4>القاعدة: ${escapeHtml(lesson.grammar?.titleAr || '')}</h4><p>${escapeHtml(lesson.grammar?.explanationAr || lesson.explanationAr || '')}</p><div class="rule-formula">${escapeHtml(lesson.grammar?.form || '')}</div>${(lesson.grammar?.examples || []).map((example) => `<div class="example-row"><div><span class="wrong-example" dir="ltr">${escapeHtml(example.wrong || '')}</span><br><span class="corrected-example" dir="ltr">${escapeHtml(example.correction || example.tr)}</span></div><div><span dir="ltr" class="tr">${escapeHtml(example.tr)}</span><br>${escapeHtml(example.ar)}<small class="word-example">${escapeHtml(example.why || '')}</small></div></div>`).join('')}</section>
      <section class="exercise-box"><h4>محادثة قصيرة</h4>${(lesson.dialogue || []).map((line) => `<div class="example-row"><div><span class="tr" dir="ltr" lang="tr">${escapeHtml(line.tr)}</span></div><div><b>${escapeHtml(line.speaker)}:</b> ${escapeHtml(line.ar)} <button class="tiny-icon-button" type="button" data-speak="${escapeAttr(line.tr)}" aria-label="استمع"><span data-icon="volume"></span></button></div></div>`).join('')}</section>
      ${lesson.reading ? `<section class="exercise-box reading-card"><h4>اقرأ في السياق: ${escapeHtml(lesson.reading.titleAr || '')}</h4><div class="reading-text" lang="tr" dir="ltr">${tokenizedReading(lesson.reading.textTr, vocab)}</div><button class="quiet-button button-small" type="button" data-toggle-translation>إظهار الترجمة</button><div class="reading-translation" hidden>${escapeHtml(lesson.reading.translationAr || '')}</div>${(lesson.reading.questions || []).map((question,index) => questionMarkup(question,index,'read')).join('')}</section>` : ''}
      ${(lesson.comprehension || []).length ? `<section class="exercise-box"><h4>استرجع الفكرة</h4>${lesson.comprehension.map((question,index) => questionMarkup(question,index,'comp')).join('')}</section>` : ''}
      ${(lesson.listening || []).length ? `<section class="exercise-box"><h4>استمع وأجب</h4>${lesson.listening.map((question,index) => `<div class="question-card" data-question="listen-${index}" data-correct="${Number(question.correctIndex) || 0}" data-explanation="${escapeAttr(question.explanationAr || '')}"><button class="secondary-button button-small" type="button" data-speak="${escapeAttr(question.sentenceTr)}"><span data-icon="volume"></span> استمع إلى الجملة</button><p class="activity-sentence" data-listening-text hidden>${escapeHtml(question.sentenceTr)}</p><button class="quiet-button button-small" type="button" data-reveal-listening>إظهار الجملة</button><p>${escapeHtml(question.questionAr)}</p><div class="option-list">${question.options.map((option,index2) => `<label class="quiz-option"><input type="radio" name="listen-${index}" value="${index2}"><span>${escapeHtml(option)}</span></label>`).join('')}</div><div class="quiz-feedback" aria-live="polite"></div></div>`).join('')}</section>` : ''}
      ${(lesson.pronunciation || []).length ? `<section class="exercise-box"><h4>اسمع وكرّر</h4>${lesson.pronunciation.map((item) => `<div class="example-row"><div class="tr" dir="ltr" lang="tr">${escapeHtml(item.textTr)}<button class="tiny-icon-button" type="button" data-speak="${escapeAttr(item.textTr)}" aria-label="استمع"><span data-icon="volume"></span></button></div><div>${escapeHtml(item.focusAr)}</div></div>`).join('')}<p class="word-example">النطق هنا عبر صوت النظام التركي عند توفره، وليس تسجيلاً لمتحدث أصلي.</p></section>` : ''}
      ${(lesson.writing || []).length ? `<section class="exercise-box"><h4>اكتب لاسترجاع ما تعلّمت</h4>${lesson.writing.map((item,index) => `<div class="question-card"><p>${escapeHtml(item.promptAr)}</p><div class="form-field"><label for="write-${index}">إجابتك بالتركية</label><input id="write-${index}" data-writing-input="${index}" lang="tr" dir="ltr" autocomplete="off"></div><button class="secondary-button button-small" type="button" data-check-writing="${index}">تحقق من الإجابة</button><div class="quiz-feedback" data-writing-feedback="${index}" aria-live="polite"></div><div class="word-example">${escapeHtml(item.explanationAr || '')}</div></div>`).join('')}</section>` : ''}
      ${(lesson.finalQuiz || []).length ? `<section class="exercise-box"><h4>اختبار ختامي قصير</h4>${lesson.finalQuiz.map((question,index) => questionMarkup(question,index,'final')).join('')}</section>` : ''}
      <div class="notice warning">التصحيح الكتابي في هذا الدرس يقارن إجابتك بنموذج محدد؛ قد توجد صياغات تركية صحيحة أخرى لا يتعرف عليها هذا الفحص المحلي.</div>
    </div>
    <footer class="dialog-footer"><button class="primary-button" type="button" data-complete-lesson="${escapeAttr(lesson.id)}" data-level="${escapeAttr(lesson.level)}">أنهيت الدرس (+25 XP)</button><button class="secondary-button" type="button" data-close-dialog>إغلاق</button></footer>
  </div>`;
  root.querySelectorAll('[data-icon]').forEach((icon) => { icon.innerHTML = window.turkiyaIcon?.('volume') || ''; });
  root.querySelectorAll('[data-speak]').forEach((button) => button.addEventListener('click', () => {
    const result = speakTurkish(button.dataset.speak);
    if (!result.ok) toast(result.message);
    else toast('صوت آلي تركي من الجهاز؛ قد لا يتوفر على بعض المتصفحات.');
  }));
  root.querySelectorAll('[data-add-review]').forEach((button) => button.addEventListener('click', async () => {
    const word = vocab.find((item) => (item.id || item.tr) === button.dataset.addReview);
    if (word) { await addToReview({ ...word, level: lesson.level }); toast(`أُضيفت «${word.tr}» إلى المراجعة.`); window.dispatchEvent(new CustomEvent('turkiya:progress-changed')); }
  }));
  root.querySelectorAll('[data-toggle-translation]').forEach((button) => button.addEventListener('click', () => {
    const translation = button.nextElementSibling;
    translation.hidden = !translation.hidden;
    button.textContent = translation.hidden ? 'إظهار الترجمة' : 'إخفاء الترجمة';
  }));
  root.querySelectorAll('[data-reveal-listening]').forEach((button) => button.addEventListener('click', () => {
    const sentence = button.previousElementSibling;
    sentence.hidden = !sentence.hidden;
    button.textContent = sentence.hidden ? 'إظهار الجملة' : 'إخفاء الجملة';
  }));
  root.querySelectorAll('[data-word-lookup]').forEach((button) => button.addEventListener('click', async () => {
    const all = await getVocabulary();
    const word = [...vocab, ...all].find((item) => item.tr?.toLocaleLowerCase('tr-TR') === button.dataset.wordLookup.toLocaleLowerCase('tr-TR'));
    toast(word ? `${word.tr} — ${word.ar}` : `استمع إلى ${button.dataset.wordLookup}`);
    if (!word) speakTurkish(button.dataset.wordLookup);
  }));
  root.querySelectorAll('[data-check-writing]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.checkWriting);
    const answer = lesson.writing[index];
    const input = root.querySelector(`[data-writing-input="${index}"]`);
    const feedback = root.querySelector(`[data-writing-feedback="${index}"]`);
    const accepted = Array.isArray(answer.expectedTr) ? answer.expectedTr : [answer.expectedTr];
    const normalizedInput = input.value.trim().normalize('NFC').toLocaleLowerCase('tr-TR');
    const flexibleNameIntro = answer.acceptNameIntro && /^(?:ben\s+[\p{L}'’-]+|benim\s+ad[ıi]m\s+[\p{L}'’-]+)[.!?]?$/u.test(normalizedInput);
    const isCorrect = flexibleNameIntro || accepted.some((expected) => expected.trim().normalize('NFC').toLocaleLowerCase('tr-TR') === normalizedInput);
    feedback.textContent = isCorrect ? `إجابة مطابقة للنموذج. ${answer.explanationAr || ''}` : `راجع الإجابة النموذجية: ${accepted.join(' / ')}. ${answer.explanationAr || ''}`;
    feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  }));
  root.querySelectorAll('.question-card').forEach((card) => {
    card.querySelectorAll('input[type="radio"]').forEach((input) => input.addEventListener('change', async () => {
      if (card.dataset.answered) return;
      card.dataset.answered = 'true';
      card.querySelectorAll('input').forEach((radio) => { radio.disabled = true; });
      const isCorrect = Number(input.value) === Number(card.dataset.correct);
      const feedback = card.querySelector('.quiz-feedback');
      feedback.textContent = `${isCorrect ? 'صحيح. ' : 'الإجابة مختلفة. '}${card.dataset.explanation || ''}`;
      feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
      const skill = card.closest('.reading-card') ? 'القراءة' : String(card.dataset.question || '').startsWith('listen-') ? 'الاستماع' : 'الفهم';
      await saveQuizResult({ score: isCorrect ? 1 : 0, total: 1, skill, label: lesson.titleAr });
      window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
    }));
  });
  root.querySelectorAll('[data-complete-lesson]').forEach((button) => button.addEventListener('click', async () => {
    const first = await markLessonComplete(button.dataset.completeLesson, button.dataset.level);
    toast(first ? 'أُنجز الدرس وأُضيفت 25 نقطة خبرة.' : 'هذا الدرس مسجّل كمكتمل بالفعل.');
    button.disabled = true;
    button.textContent = first ? 'اكتمل الدرس' : 'مكتمل سابقاً';
    window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
  }));
  root.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => d.close()));
  d.showModal();
}
