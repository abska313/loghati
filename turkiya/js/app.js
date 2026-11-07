import { initDatabase, get, getAll, put, clearStore, exportBackup, importBackup, storeNames } from './database.js';
import { initRouter, navigate } from './router.js';
import { getAllLessons } from './data.js';
import { getDashboardStats, getProfileData, updateProfile, recordStudy } from './progress.js';
import { getDueReviews } from './spaced-repetition.js';
import { initPWA, promptInstall } from './pwa.js';
import { releaseAudio } from './audio.js';
import { renderLessons, openLessonById } from './lessons.js';
import { renderAlphabet } from './alphabet.js';
import { renderVocabulary } from './vocabulary.js';
import { renderGrammar, renderListening, renderSpeaking, renderReading, renderWriting, renderReview } from './skills.js';
import { escapeHtml, escapeAttr } from './quizzes.js';

const ICONS = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h8"/>',
  cards:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M8 2h11a2 2 0 0 1 2 2v13M8 9h8M8 13h6"/>',
  grammar:'<path d="M5 4h14M5 9h9M5 14h14M5 19h8"/><circle cx="18" cy="9" r="2"/><circle cx="16" cy="19" r="2"/>',
  headphones:'<path d="M3 13v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/><path d="M21 18v1a3 3 0 0 1-3 3h-3"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M9 22h6"/>',
  read:'<path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 0 3 23zM21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5a2.5 2.5 0 0 1 2.5 2z"/><path d="M6 7h3M15 7h3M6 11h3M15 11h3"/>',
  write:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"/>',
  flame:'<path d="M12 22c4 0 7-2.8 7-6.8 0-3.3-1.9-5.3-4.2-8.2-.3 2-1.3 3.1-2.2 3.7.1-3.3-1.8-6.2-4.7-8.7.2 4.5-3.9 7.5-3.9 13.1C4 19.2 7.1 22 12 22z"/><path d="M12 22c-1.8 0-3-1.2-3-3 0-1.3.8-2.4 2-3.8.1 1.1.7 1.7 1.4 2 .2-1.2 1-2.1 1.6-2.6.3 2 1 2.8 1 4.1 0 1.9-1.2 3.3-3 3.3z"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  moon:'<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  volume:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  zap:'<path d="m13 2-3 9h7l-6 11 2-9H6z"/>',
  award:'<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1.1 8 4.9-2.5 4.9 2.5-1.1-8"/>',
  play:'<path d="m8 5 12 7-12 7z"/>',
  coffee:'<path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM17 10h2a2 2 0 1 1 0 4h-2M7 3v2m4-2v2m4-2v2"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};

function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.book}</svg>`; }
window.turkiyaIcon = icon;
const root = document.getElementById('view-root');
const toastRegion = document.getElementById('toast-region');
let toastTimer;

function toast(message) {
  if (!toastRegion) return;
  const node = document.createElement('div'); node.className = 'toast'; node.textContent = String(message || '');
  toastRegion.append(node); clearTimeout(toastTimer);
  setTimeout(() => node.remove(), 3000);
}
window.turkiyaToast = toast;

function applyStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((element) => { element.innerHTML = icon(element.dataset.icon); });
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('turkiya-theme', theme);
  const button = document.getElementById('theme-toggle');
  if (button) { button.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon'); button.setAttribute('aria-label', theme === 'dark' ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن'); }
}

function openDialog(title, body, { footer = '', onReady = () => {} } = {}) {
  const dialog = document.getElementById('app-dialog');
  const content = document.getElementById('dialog-content');
  content.innerHTML = `<div class="dialog-inner"><header class="dialog-header"><div><span class="kicker">تركيّة · بياناتك على جهازك</span><h2 id="dialog-title">${escapeHtml(title)}</h2></div><button class="dialog-close" type="button" data-close-dialog aria-label="إغلاق">×</button></header><div class="dialog-body">${body}</div>${footer ? `<footer class="dialog-footer">${footer}</footer>` : ''}</div>`;
  content.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  onReady(content);
  dialog.showModal();
}

async function downloadBackup() {
  try {
    const payload = await exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `turkiya-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    toast('نُزّلت نسخة JSON من بيانات هذا الجهاز.');
  } catch (error) { toast(error.message || 'تعذر إنشاء النسخة.'); }
}

function renderHome() {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحدّث لوحة التعلّم…</p></div>';
  Promise.all([getAllLessons(), getDueReviews()]).then(async ([lessons, due]) => {
    const [stats, progressRecords] = await Promise.all([getDashboardStats(lessons), getAll('progress')]);
    const profile = stats.profile;
    const completedIds = new Set(progressRecords.filter((record) => record.id?.startsWith('lesson:') && record.completedAt).map((record) => record.id.slice(7)));
    const nextLesson = lessons.find((lesson) => !completedIds.has(lesson.id)) || lessons[0];
    const weak = stats.skills.slice(0, 3);
    const fallbackSkills = [
      { name: 'استماع', percent: 0 }, { name: 'مفردات', percent: Math.min(100, stats.practicedCount * 4) },
      { name: 'قراءة', percent: 0 }, { name: 'قواعد', percent: 0 }
    ];
    const skillRows = (weak.length ? weak.map((item) => ({ name: item.name, percent: item.percent })) : fallbackSkills).map((item) => `<div class="skill-row"><span>${escapeHtml(item.name)}</span><div class="progress-track"><div class="progress-fill ${item.percent < 45 ? 'warm' : ''}" style="width:${item.percent}%"></div></div><b>${item.percent ? `${item.percent}%` : '—'}</b></div>`).join('');
    root.innerHTML = `<section class="hero-card"><div class="hero-copy"><span class="kicker">خطوة تركية جديدة اليوم</span><h1>Merhaba!<br>لنبدأ من حيث توقّفت.</h1><p>تعلّم اللغة داخل مواقفها، وامنح ذاكرتك فرصة لاستدعاء ما تعرفه قبل إضافة كلمات جديدة.</p><div class="button-row"><button class="primary-button" type="button" data-route="${nextLesson ? 'lessons' : 'lessons'}"><span data-icon="play"></span>${nextLesson ? 'تابع المسار' : 'استكشف الدروس'}</button><button class="secondary-button" type="button" data-route="review"><span data-icon="refresh"></span>مراجعة ${due.length ? `(${due.length})` : 'اليوم'}</button></div></div><div class="hero-photo"><img src="./assets/images/turkish-tea.jpg" alt="كأس شاي تركي مع مشهد من تركيا" loading="eager"><span class="hero-stamp">لغةٌ تُعاش، لا تُحفظ فقط</span></div></section>
      <section class="stats-grid" aria-label="إحصاءات التعلّم"><article class="stat-card"><span class="stat-icon" data-icon="zap"></span><div><span class="stat-value">${profile.xp}</span><span class="stat-label">نقطة خبرة XP</span></div></article><article class="stat-card"><span class="stat-icon" data-icon="flame"></span><div><span class="stat-value">${profile.streak}</span><span class="stat-label">يوم متتالٍ</span></div></article><article class="stat-card"><span class="stat-icon" data-icon="cards"></span><div><span class="stat-value">${stats.practicedCount}</span><span class="stat-label">كلمات قيد المراجعة</span></div></article><article class="stat-card"><span class="stat-icon" data-icon="clock"></span><div><span class="stat-value">${stats.hours}س ${stats.minutes}د</span><span class="stat-label">وقت التعلّم المسجّل</span></div></article></section>
      <section class="section-block content-columns"><article class="panel daily-panel"><div class="daily-copy"><span class="kicker">هدف اليوم</span><h3>${stats.todayMinutes} من ${profile.dailyGoal} دقيقة</h3><p>جلسة قصيرة منتظمة أفضل من جلسة طويلة متقطّعة.</p><div class="button-row" style="margin-top:11px"><button class="quiet-button button-small" type="button" data-route="lessons">ابدأ درساً</button><button class="quiet-button button-small" type="button" data-route="review">${due.length ? `راجع ${due.length} كلمة` : 'افتح المراجعة'}</button></div></div><div class="goal-ring" style="--ring-progress:${stats.goalPercent}%"><span>${stats.goalPercent}%</span></div></article><article class="panel panel-padding"><div class="section-heading"><div><h2>مهاراتك</h2><p>${weak.length ? 'تقدير تقريبي من نتائجك المسجلة' : 'تظهر المؤشرات بعد حل التمارين'}</p></div><span data-icon="target"></span></div><div class="skill-list">${skillRows}</div></article></section>
      <section class="section-block"><div class="section-heading"><div><h2>تعلّم بطريقة متنوعة</h2><p>بدّل بين المهارات لتسترجع اللغة في سياقات مختلفة.</p></div></div><div class="quick-grid"><button class="quick-card" type="button" data-route="lessons"><span class="quick-icon" data-icon="book"></span><strong>المسار التعليمي</strong><small>${stats.completedCount} / ${stats.lessonCount} درساً مكتمل</small></button><button class="quick-card" type="button" data-route="listening"><span class="quick-icon" data-icon="headphones"></span><strong>استمع وافهم</strong><small>تدرّب على المسموع</small></button><button class="quick-card" type="button" data-route="speaking"><span class="quick-icon" data-icon="mic"></span><strong>تحدّث وقلّد</strong><small>Shadowing وتسجيل محلي</small></button><button class="quick-card" type="button" data-route="writing"><span class="quick-icon" data-icon="write"></span><strong>اكتب بنفسك</strong><small>استرجاع وتصحيح مفسّر</small></button></div></section>
      <section class="section-block"><div class="section-heading"><div><h2>خريطة المستويات</h2><p>المستوى يشير إلى تنظيم المحتوى، ولا يمثل شهادة رسمية.</p></div><button type="button" class="section-link" data-route="lessons">عرض المنهج</button></div><div class="level-list">${stats.levelProgress.map((level) => `<article class="level-card"><span class="level-mark">${escapeHtml(level.level)}</span><div><h3>${escapeHtml(levelTitle(level.level))}</h3><p>${level.count} دروس متاحة · ${level.completed} مكتملة</p></div><div class="level-meta"><small>${level.percent}%</small><div class="progress-track"><div class="progress-fill" style="width:${level.percent}%"></div></div></div></article>`).join('')}</div></section>
      ${nextLesson ? `<section class="section-block panel daily-panel"><div class="daily-copy"><span class="kicker">الدرس المقترح التالي</span><h3>${escapeHtml(nextLesson.titleAr)}</h3><p>${escapeHtml(nextLesson.titleTr || '')} · ${escapeHtml(nextLesson.level)} · ${escapeHtml((nextLesson.objectivesAr || []).join('، '))}</p></div><button class="primary-button button-small" type="button" data-route="lessons">افتح الدرس</button></section>` : ''}
      <div class="notice warning">هذه المنصة تحفظ تقدمك محلياً على هذا الجهاز. خذ نسخة احتياطية قبل تغيير الجهاز أو مسح بيانات المتصفح. الأصوات تعتمد على دعم المتصفح ولا يوجد تحليل نطق ذكي أو مزامنة سحابية.</div>`;
    applyStaticIcons();
    root.querySelector('.section-block.panel.daily-panel [data-route="lessons"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (nextLesson) openLessonById(nextLesson.id, toast);
    });
    const challengeCount = Math.min(3, stats.reviewedToday);
    const weeklySection = document.createElement('section');
    weeklySection.className = 'section-block panel panel-padding weekly-progress';
    weeklySection.innerHTML = `<div class="section-heading"><div><span class="kicker">استمرارية بلا ضغط</span><h2>هدف هذا الأسبوع</h2><p>${stats.weeklyMinutes} من ${stats.weeklyGoalMinutes} دقيقة خلال آخر سبعة أيام</p></div><span class="level-pill">المتعلم · المستوى ${stats.learnerLevel}</span></div><div class="progress-track" role="progressbar" aria-label="تقدم الهدف الأسبوعي" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stats.weeklyPercent}"><div class="progress-fill" style="width:${stats.weeklyPercent}%"></div></div><div class="weekly-challenge-row"><div><strong>تحدّي اليوم: راجع 3 كلمات</strong><p>أنجزت ${challengeCount} من 3 في جلسة مراجعة الاستدعاء.</p></div><span class="level-pill">${challengeCount}/3</span><button class="quiet-button button-small" type="button" data-route="review">${challengeCount >= 3 ? 'أحسنت اليوم' : 'ابدأ المراجعة'}</button></div>`;
    root.querySelector('.content-columns')?.after(weeklySection);
  }).catch((error) => {
    root.innerHTML = `<div class="empty-state"><strong>تعذر تحميل لوحة التعلّم</strong><p>${escapeHtml(error.message)}</p><button class="secondary-button button-small" data-reload="home">إعادة المحاولة</button></div>`;
  });
}


function levelTitle(level) {
  return ({'Pre-A1':'التهيئة للمبتدئين', A1:'مبتدئ', A2:'ابتدائي', B1:'متوسط', B2:'فوق المتوسط', C1:'متقدم', C2:'إتقان متقدم'})[level] || level;
}

async function renderProfile() {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحمّل ملفك المحلي…</p></div>';
  const [stats, profile] = await Promise.all([getDashboardStats(), getProfileData()]);
  const badges = [
    { title: 'أول خطوة', detail: 'أكمل درساً واحداً', earned: stats.completedCount >= 1 },
    { title: 'جامع الكلمات', detail: 'أضف 10 كلمات للمراجعة', earned: stats.practicedCount >= 10 },
    { title: 'استمرارية', detail: 'تعلّم 3 أيام متتالية', earned: profile.streak >= 3 },
    { title: 'قارئ نشط', detail: 'حلّ اختبار قراءة', earned: stats.skills.some((item) => item.name.includes('قراءة')) }
  ];
  root.innerHTML = `<div class="view-header"><div><span class="kicker">تقدّم محلي وخصوصية واضحة</span><h1>ملفي الشخصي</h1><p>لا يوجد حساب أو مزامنة سحابية؛ بياناتك محفوظة في متصفح هذا الجهاز.</p></div><span class="status-pill">${profile.xp} XP</span></div>
    <div class="profile-grid"><section class="panel profile-card"><div class="profile-head"><div class="profile-avatar">ت</div><div><h2>${escapeHtml(profile.displayName || 'متعلّم التركية')}</h2><p>المستوى النشط: ${escapeHtml(profile.currentLevel || 'Pre-A1')}</p></div></div><form id="profile-form"><div class="form-field"><label for="display-name">الاسم المعروض على هذا الجهاز</label><input id="display-name" maxlength="35" value="${escapeAttr(profile.displayName || '')}"></div><div class="form-field"><label for="daily-goal">هدف التعلّم اليومي (دقيقة)</label><input id="daily-goal" type="number" min="5" max="180" step="5" value="${Number(profile.dailyGoal) || 20}"></div><button class="primary-button button-small" type="submit">حفظ الإعدادات</button></form><div class="backup-row"><button id="export-backup" class="secondary-button button-small" type="button">تصدير JSON</button><button id="import-backup" class="secondary-button button-small" type="button">استيراد نسخة</button><input id="backup-file" type="file" accept="application/json,.json" hidden></div><div class="notice">النسخ الاحتياطي يشمل تقدمك ومفرداتك وسجل الاختبارات. احفظ الملف في مكان آمن.</div></section>
    <section class="panel profile-card"><div class="section-heading"><div><h2>إنجازاتك</h2><p>شارات قليلة مرتبطة بعادات التعلم، وليست سباقاً.</p></div><span data-icon="award"></span></div><div class="achievement-list">${badges.map((badge) => `<div class="achievement"><span class="achievement-icon" style="opacity:${badge.earned ? 1 : .35}" data-icon="award"></span><div><strong>${escapeHtml(badge.title)} ${badge.earned ? '✓' : '· قريباً'}</strong><small>${escapeHtml(badge.detail)}</small></div></div>`).join('')}</div></section></div>
    <section class="section-block panel panel-padding"><div class="section-heading"><div><h2>ملخص التقدّم</h2><p>${stats.completedCount} درساً · ${stats.vocabularyCount} كلمة في القاموس · ${stats.quizCount} نتيجة اختبار</p></div></div><div class="stats-grid"><article class="stat-card"><span class="stat-icon" data-icon="book"></span><div><span class="stat-value">${stats.completedCount}</span><span class="stat-label">دروس مكتملة</span></div></article><article class="stat-card"><span class="stat-icon" data-icon="cards"></span><div><span class="stat-value">${stats.favoriteCount}</span><span class="stat-label">مفردات مفضلة</span></div></article><article class="stat-card"><span class="stat-icon" data-icon="clock"></span><div><span class="stat-value">${stats.hours}س ${stats.minutes}د</span><span class="stat-label">وقت نشط مسجل</span></div></article><article class="stat-card"><span class="stat-icon" data-icon="target"></span><div><span class="stat-value">${stats.quizCount}</span><span class="stat-label">محاولات مسجلة</span></div></article></div></section>
    <section class="section-block panel panel-padding"><div class="section-heading"><div><h2>بيانات الجهاز</h2><p>تعمل هذه الصفحة دون خادم؛ حذف بيانات الموقع من إعدادات المتصفح قد يمحو سجل التعلم.</p></div></div><button id="clear-local-data" type="button" class="danger-button button-small">حذف بيانات التعلّم المحلية</button></section>`;
  applyStaticIcons();
  const weeklyGoalField = document.createElement('div');
  weeklyGoalField.className = 'form-field';
  weeklyGoalField.innerHTML = `<label for="weekly-goal">الهدف الأسبوعي (دقيقة، من 30 إلى 900)</label><input id="weekly-goal" type="number" min="30" max="900" step="30" value="${Number(profile.weeklyGoalMinutes) || 100}">`;
  root.querySelector('#daily-goal')?.closest('.form-field')?.after(weeklyGoalField);
  root.querySelector('#profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = root.querySelector('#display-name').value.trim() || 'متعلّم التركية';
    const goal = Math.min(180, Math.max(5, Number(root.querySelector('#daily-goal').value) || 20));
    const weeklyGoal = Math.min(900, Math.max(30, Number(root.querySelector('#weekly-goal').value) || 100));
    await updateProfile({ displayName: name, dailyGoal: goal, weeklyGoalMinutes: weeklyGoal }); toast('حُفظت إعداداتك على هذا الجهاز.'); renderProfile();
  });
  root.querySelector('#export-backup').addEventListener('click', downloadBackup);
  root.querySelector('#import-backup').addEventListener('click', () => root.querySelector('#backup-file').click());
  root.querySelector('#backup-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      openDialog('استعادة نسخة احتياطية', '<p>يمكنك استبدال بيانات هذا الجهاز ببيانات الملف. يُستحسن تصدير نسخة من الوضع الحالي أولاً.</p>', {
        footer: '<button class="primary-button" id="confirm-import">استبدل بيانات هذا الجهاز</button><button class="secondary-button" data-close-dialog>إلغاء</button>',
        onReady: (content) => content.querySelector('#confirm-import').addEventListener('click', async () => {
          try { await importBackup(payload, { replace: true }); document.getElementById('app-dialog').close(); toast('استُعيدت النسخة الاحتياطية.'); window.dispatchEvent(new CustomEvent('turkiya:progress-changed')); renderProfile(); }
          catch (error) { toast(error.message); }
        })
      });
    } catch { toast('الملف ليس JSON صالحاً.'); }
    event.target.value = '';
  });
  root.querySelector('#clear-local-data').addEventListener('click', async () => {
    const approved = window.confirm('سيُحذف تقدمك ومراجعاتك ومفضلاتك ونتائجك من هذا الجهاز. هل صدّرت نسخة احتياطية قبل المتابعة؟');
    if (!approved) return;
    for (const name of storeNames) await clearStore(name);
    toast('حُذفت البيانات المحلية.'); window.dispatchEvent(new CustomEvent('turkiya:progress-changed')); renderProfile();
  });
}

async function renderRoute(route) {
  if (!root) return;
  const previousRoute = root.dataset.route;
  if (previousRoute === 'speaking' && route !== 'speaking') releaseAudio();
  root.dataset.route = route;
  root.setAttribute('aria-busy', 'true');
  document.title = `${routeTitle(route)} — تركيّة`;
  try {
    switch (route) {
      case 'home': renderHome(); break;
      case 'lessons': await renderLessons(root, { toast }); break;
      case 'alphabet': await renderAlphabet(root, { toast }); break;
      case 'vocabulary': await renderVocabulary(root, { toast }); break;
      case 'grammar': await renderGrammar(root); break;
      case 'listening': await renderListening(root, { toast }); break;
      case 'speaking': await renderSpeaking(root, { toast }); break;
      case 'reading': await renderReading(root, { toast }); break;
      case 'writing': await renderWriting(root); break;
      case 'review': await renderReview(root, { toast }); break;
      case 'profile': await renderProfile(); break;
      default: renderHome();
    }
  } catch (error) { root.innerHTML = `<div class="empty-state"><strong>تعذر فتح القسم</strong><p>${escapeHtml(error.message)}</p></div>`; }
  root.setAttribute('aria-busy', 'false');
  if (route !== 'home') applyStaticIcons();
  updateReviewBadge();
}

function routeTitle(route) {
  return ({home:'الرئيسية',lessons:'المسار التعليمي',alphabet:'الحروف والأصوات',vocabulary:'المفردات',grammar:'القواعد',listening:'الاستماع',speaking:'التحدث',reading:'القراءة',writing:'الكتابة',review:'مراجعة اليوم',profile:'ملفي الشخصي'})[route] || 'تعلّم التركية';
}

async function updateReviewBadge() {
  try {
    const due = await getDueReviews();
    const count = document.getElementById('review-count'); if (count) { count.textContent = due.length; count.hidden = !due.length; }
    const streak = await getProfileData(); const label = document.getElementById('sidebar-streak'); if (label) label.textContent = streak.streak || 0;
  } catch { /* قاعدة البيانات تهيّأ عند بدء التطبيق */ }
}

function wireBackupShortcut() { document.getElementById('backup-shortcut')?.addEventListener('click', downloadBackup); }

function startActiveTimeTracking() {
  let lastCheck = Date.now();
  let lastInteraction = Date.now();
  const markActive = () => { lastInteraction = Date.now(); };
  ['pointerdown','keydown','touchstart'].forEach((eventName) => document.addEventListener(eventName, markActive, { passive: true }));
  const saveElapsed = async () => {
    const now = Date.now(); const elapsed = Math.min(60, Math.max(0, Math.round((now - lastCheck) / 1000)));
    const active = document.visibilityState === 'visible' && now - lastInteraction < 120000;
    lastCheck = now;
    if (active && elapsed >= 20) {
      await recordStudy({ seconds: elapsed });
      window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
    }
  };
  setInterval(saveElapsed, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { saveElapsed(); if (root.dataset.route === 'speaking') releaseAudio(); } else { lastCheck = Date.now(); markActive(); } });
  window.addEventListener('pagehide', () => { saveElapsed(); releaseAudio(); });
}

async function init() {
  applyStaticIcons();
  try { await initDatabase(); }
  catch (error) {
    root.innerHTML = `<div class="empty-state"><strong>تعذر تهيئة التخزين المحلي</strong><p>${escapeHtml(error.message)}</p><p>جرّب متصفحاً حديثاً يدعم IndexedDB وافتح الموقع عبر HTTPS أو خادم محلي.</p></div>`;
    return;
  }
  const savedTheme = localStorage.getItem('turkiya-theme') || 'light';
  setTheme(savedTheme);
  document.getElementById('theme-toggle')?.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  document.getElementById('profile-button')?.addEventListener('click', () => navigate('profile'));
  document.getElementById('install-button')?.addEventListener('click', async () => { const accepted = await promptInstall(); if (!accepted) toast('يمكن تثبيت التطبيق من قائمة المتصفح إذا لم يظهر الطلب.'); });
  window.addEventListener('turkiya:audio-released', () => {
    const button = document.getElementById('record-toggle');
    if (button) button.textContent = 'ابدأ التسجيل';
    const status = document.getElementById('record-status');
    if (status) status.textContent = 'أُوقف التسجيل تلقائياً عند مغادرة القسم أو إخفائه؛ لم يُحفظ التسجيل.';
    const player = document.getElementById('recorded-audio');
    if (player) { player.pause(); player.removeAttribute('src'); player.hidden = true; }
  });
  initPWA({
    onInstallAvailable: (available) => { const button = document.getElementById('install-button'); if (button) button.hidden = !available; },
    onConnectionChange: (online) => {
      const status = document.getElementById('connection-status');
      if (!status) return;
      status.classList.toggle('online', online); status.classList.toggle('offline', !online);
      status.querySelector('span').textContent = online ? 'متصل' : 'وضع دون اتصال';
    },
    toast
  });
  initRouter(renderRoute);
  wireBackupShortcut();
  startActiveTimeTracking();
  document.addEventListener('click', (event) => {
    const retry = event.target.closest('[data-reload]');
    if (retry) renderRoute(retry.dataset.reload);
  });
  window.addEventListener('turkiya:progress-changed', () => { updateReviewBadge(); if (root.dataset.route === 'home') renderHome(); });
  document.getElementById('app-dialog')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });
}

init();
