import { get, getAll, put } from './database.js';
import { getActiveLanguageId } from './language-registry.js';

const todayKey = () => new Date().toLocaleDateString('en-CA');
const dayDiff = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
const profileKey = () => getActiveLanguageId() === 'tr' ? 'profile' : `profile:${getActiveLanguageId()}`;
const languageName = () => document.documentElement.dataset.targetName || 'اللغة';

async function getProfile() {
  const key = profileKey();
  return (await get('meta', key)) || {
    key, languageId: getActiveLanguageId(), displayName: `متعلّم ${languageName()}`, xp: 0, streak: 0,
    lastStudyDate: null, totalSeconds: 0, dailyGoal: 20, currentLevel: 'Pre-A1', createdAt: new Date().toISOString()
  };
}

export async function recordStudy({ seconds = 0, xp = 0, lessonId = null, level = null } = {}) {
  const languageId = getActiveLanguageId();
  const profile = await getProfile();
  const today = todayKey();
  if (profile.lastStudyDate !== today) {
    const gap = profile.lastStudyDate ? dayDiff(profile.lastStudyDate, today) : 0;
    profile.streak = gap === 1 ? profile.streak + 1 : 1;
    profile.lastStudyDate = today;
  }
  profile.xp += Math.max(0, Math.round(xp));
  profile.totalSeconds += Math.max(0, Math.round(seconds));
  if (level) profile.currentLevel = level;
  profile.languageId = languageId;
  profile.updatedAt = new Date().toISOString();
  await put('meta', profile);
  const dayId = languageId === 'tr' ? today : `${languageId}:${today}`;
  const daily = (await get('progress', dayId)) || { id: dayId, dayKey: today, languageId, seconds: 0, xp: 0, lessons: [] };
  daily.dayKey = today;
  daily.seconds += Math.max(0, Math.round(seconds));
  daily.xp += Math.max(0, Math.round(xp));
  if (lessonId && !daily.lessons.includes(lessonId)) daily.lessons.push(lessonId);
  await put('progress', daily);
  return profile;
}

export async function markLessonComplete(lessonId, level) {
  const id = `lesson:${lessonId}`;
  const record = (await get('progress', id)) || { id, completedAt: null, level };
  if (record.completedAt) return false;
  record.completedAt = new Date().toISOString();
  record.level = level;
  await put('progress', record);
  await recordStudy({ seconds: 0, xp: 25, lessonId, level });
  return true;
}

export async function saveQuizResult({ score, total, skill = 'general', label = '' }) {
  const item = { id: `quiz:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`, score, total, skill, label, createdAt: new Date().toISOString() };
  await put('quizResults', item);
  await recordStudy({ seconds: 0, xp: Math.max(2, Math.round((score / Math.max(total, 1)) * 12)) });
  return item;
}

export async function getDashboardStats(lessons = []) {
  const [profile, progressRecords, reviews, vocab, results, favorites] = await Promise.all([
    getProfile(), getAll('progress'), getAll('reviews'), getAll('vocabulary'), getAll('quizResults'), getAll('favorites')
  ]);
  const today = todayKey();
  const now = new Date();
  const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = weekStart.toLocaleDateString('en-CA');
  const dateOf = (record) => record.dayKey || (/^\d{4}-\d{2}-\d{2}$/u.test(record.id || '') ? record.id : null);
  const weeklySeconds = progressRecords.filter((record) => {
    const day = dateOf(record);
    return day && day >= weekStartKey && day <= today;
  }).reduce((sum, record) => sum + (record.seconds || 0), 0);
  const weeklyGoalMinutes = Number(profile.weeklyGoalMinutes) || 100;
  const reviewedToday = reviews.filter((item) => item.lastReviewedAt && new Date(item.lastReviewedAt).toLocaleDateString('en-CA') === today).length;
  const learnerLevel = Math.floor(Math.max(0, Number(profile.xp) || 0) / 100) + 1;
  const daily = progressRecords.find((record) => dateOf(record) === today) || { seconds: 0, xp: 0, lessons: [] };
  const completed = progressRecords.filter((record) => record.id?.startsWith('lesson:') && record.completedAt);
  const due = reviews.filter((item) => !item.suspended && new Date(item.nextDue || 0).getTime() <= Date.now()).length;
  const practiced = reviews.filter((item) => (item.repetitions || 0) > 0).length;
  const weakSkills = Object.create(null);
  for (const result of results) {
    const group = weakSkills[result.skill] || (weakSkills[result.skill] = { score: 0, total: 0, count: 0 });
    group.score += result.score; group.total += result.total; group.count += 1;
  }
  const skills = Object.entries(weakSkills).map(([name, item]) => ({ name, percent: item.total ? Math.round(item.score / item.total * 100) : 0, count: item.count })).sort((a, b) => a.percent - b.percent);
  const levelCounts = Object.create(null);
  for (const lesson of lessons) levelCounts[lesson.level] = (levelCounts[lesson.level] || 0) + 1;
  const levelProgress = Object.entries(levelCounts).map(([level, count]) => {
    const finished = completed.filter((record) => record.level === level).length;
    return { level, count, completed: finished, percent: count ? Math.round(finished / count * 100) : 0 };
  });
  const hours = Math.floor(profile.totalSeconds / 3600);
  const minutes = Math.floor((profile.totalSeconds % 3600) / 60);
  const todayMinutes = Math.floor((daily.seconds || 0) / 60);
  return {
    profile, daily, due, completedCount: completed.length, lessonCount: lessons.length,
    vocabularyCount: vocab.length, practicedCount: practiced, favoriteCount: favorites.length,
    quizCount: results.length, quizResults: results.slice(-8).reverse(), skills, levelProgress, hours, minutes, todayMinutes,
    goalPercent: Math.min(100, Math.round(todayMinutes / Math.max(1, profile.dailyGoal) * 100)),
    weeklyMinutes: Math.floor(weeklySeconds / 60), weeklyGoalMinutes,
    weeklyPercent: Math.min(100, Math.round((weeklySeconds / 60) / Math.max(1, weeklyGoalMinutes) * 100)),
    reviewedToday, learnerLevel
  };
}

export async function getProfileData() { return getProfile(); }

export async function updateProfile(patch) {
  const profile = await getProfile();
  const updated = { ...profile, ...patch, key: profileKey(), languageId: getActiveLanguageId(), updatedAt: new Date().toISOString() };
  await put('meta', updated);
  return updated;
}
