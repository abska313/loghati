import { getActiveLanguage } from './language-registry.js';

const LEVEL_FILES = [
  ['pre-a1', 'Pre-A1'], ['a1', 'A1'], ['a2', 'A2'], ['b1', 'B1'],
  ['b2', 'B2'], ['c1', 'C1'], ['c2', 'C2']
];
const cache = new Map();
const FIELD_ALIASES = [
  ['target', 'tr'], ['titleTarget', 'titleTr'], ['exampleTarget', 'exampleTr'],
  ['sentenceTarget', 'sentenceTr'], ['textTarget', 'textTr'], ['expectedTarget', 'expectedTr']
];

async function loadJson(relativePath) {
  if (!cache.has(relativePath)) {
    const url = new URL(`../data/${relativePath}`, import.meta.url);
    cache.set(relativePath, fetch(url).then((response) => {
      if (!response.ok) throw new Error(`تعذر تحميل الملف ${relativePath} (${response.status}).`);
      return response.json();
    }).catch((error) => { cache.delete(relativePath); throw error; }));
  }
  return cache.get(relativePath);
}

function normalizeContent(value, languageId) {
  if (Array.isArray(value)) return value.map((item) => normalizeContent(item, languageId));
  if (!value || typeof value !== 'object') return value;
  const output = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeContent(item, languageId)]));
  for (const [generic, legacy] of FIELD_ALIASES) {
    if (!(generic in output) && legacy in output) output[generic] = output[legacy];
    if (!(legacy in output) && generic in output) output[legacy] = output[generic];
  }
  if (languageId !== 'tr' && typeof output.id === 'string' && !output.id.startsWith(`${languageId}::`)) {
    output.id = `${languageId}::${output.id}`;
  }
  return output;
}

async function activePath() {
  const language = await getActiveLanguage();
  return { language, base: language.dataPath };
}

export async function getLevels() {
  const { language, base } = await activePath();
  const files = await Promise.all(LEVEL_FILES.map(([file]) => loadJson(`${base}/levels/${file}.json`)));
  return files.map((data, index) => {
    const normalized = normalizeContent(data, language.id);
    return { ...normalized, level: normalized.level || LEVEL_FILES[index][1] };
  });
}

export async function getVocabulary() {
  const { language, base } = await activePath();
  const data = normalizeContent(await loadJson(`${base}/vocabulary/index.json`), language.id);
  return Array.isArray(data) ? data : data.words || [];
}

export async function getGrammar() {
  const { language, base } = await activePath();
  const data = normalizeContent(await loadJson(`${base}/grammar/index.json`), language.id);
  return Array.isArray(data) ? data : data.rules || [];
}

export async function getAllLessons() {
  const levels = await getLevels();
  return levels.flatMap((level) => (level.units || []).flatMap((unit) =>
    (unit.lessons || []).map((lesson) => ({ ...lesson, level: level.level, levelTitleAr: level.titleAr, unitTitleAr: unit.titleAr, unitId: unit.id }))
  ));
}

export async function getLessonById(id) {
  return (await getAllLessons()).find((lesson) => lesson.id === id) || null;
}

export async function getListeningItems() {
  try {
    const { language, base } = await activePath();
    return normalizeContent(await loadJson(`${base}/listening/index.json`), language.id);
  } catch { return []; }
}
