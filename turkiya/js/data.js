const LEVEL_FILES = [
  ['pre-a1', 'Pre-A1'], ['a1', 'A1'], ['a2', 'A2'], ['b1', 'B1'],
  ['b2', 'B2'], ['c1', 'C1'], ['c2', 'C2']
];
const cache = new Map();

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

export async function getLevels() {
  const files = await Promise.all(LEVEL_FILES.map(([file]) => loadJson(`levels/${file}.json`)));
  return files.map((data, index) => ({ ...data, level: data.level || LEVEL_FILES[index][1] }));
}

export async function getVocabulary() {
  const data = await loadJson('vocabulary/index.json');
  return Array.isArray(data) ? data : data.words || [];
}

export async function getGrammar() {
  const data = await loadJson('grammar/index.json');
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
  try { return await loadJson('listening/index.json'); }
  catch { return []; }
}
