const REGISTRY_URL = new URL('../data/languages.json', import.meta.url);
const ACTIVE_LANGUAGE_KEY = 'loghati-active-language';
let registryPromise;

function isValidLanguage(language) {
  return Boolean(language &&
    /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/u.test(language.id || '') &&
    /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/u.test(language.locale || '') &&
    /^[a-z]{2,3}$/u.test(language.captionLanguage || '') &&
    ['ltr', 'rtl'].includes(language.direction) &&
    ['active', 'planned'].includes(language.status) &&
    /^languages\/[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/u.test(language.dataPath || '') &&
    typeof language.nameAr === 'string' && typeof language.nativeName === 'string');
}

export async function loadLanguageRegistry() {
  if (!registryPromise) {
    registryPromise = fetch(REGISTRY_URL).then((response) => {
      if (!response.ok) throw new Error(`تعذر تحميل سجل اللغات (${response.status}).`);
      return response.json();
    }).then((registry) => {
      if (!Array.isArray(registry.languages) || !registry.languages.length ||
          registry.languages.some((language) => !isValidLanguage(language))) {
        throw new Error('سجل اللغات لا يطابق البنية المطلوبة.');
      }
      const active = registry.languages.filter((language) => language.status === 'active');
      if (!active.length || !active.some((language) => language.id === registry.defaultLanguage)) {
        throw new Error('يجب أن يشير defaultLanguage إلى لغة متاحة.');
      }
      return registry;
    }).catch((error) => { registryPromise = null; throw error; });
  }
  return registryPromise;
}

export function getActiveLanguageId() {
  try { return localStorage.getItem(ACTIVE_LANGUAGE_KEY) || 'tr'; }
  catch { return 'tr'; }
}

export async function getLanguages() {
  const registry = await loadLanguageRegistry();
  return registry.languages;
}

export async function getActiveLanguage() {
  const registry = await loadLanguageRegistry();
  const requested = getActiveLanguageId();
  const chosen = registry.languages.find((language) => language.id === requested && language.status === 'active');
  const fallback = registry.languages.find((language) => language.id === registry.defaultLanguage && language.status === 'active') || registry.languages.find((language) => language.status === 'active');
  if (!chosen || chosen.id !== requested) {
    try { localStorage.setItem(ACTIVE_LANGUAGE_KEY, fallback.id); } catch { /* قد يكون التخزين المحلي معطلاً */ }
  }
  return chosen || fallback;
}

export async function selectLanguage(id) {
  const registry = await loadLanguageRegistry();
  const selected = registry.languages.find((language) => language.id === id && language.status === 'active');
  if (!selected) return null;
  try { localStorage.setItem(ACTIVE_LANGUAGE_KEY, selected.id); } catch { throw new Error('تعذر حفظ اختيار اللغة في هذا المتصفح.'); }
  return selected;
}

export function applyLanguageContext(language) {
  if (!language) return;
  document.documentElement.dataset.targetCode = language.id;
  document.documentElement.dataset.targetDirection = language.direction;
  document.documentElement.dataset.targetLocale = language.locale;
  document.documentElement.dataset.targetName = language.nameAr;
}

export function getTargetLanguageCode() {
  return document.documentElement.dataset.targetCode || getActiveLanguageId() || 'tr';
}

export function getTargetDirection() {
  return document.documentElement.dataset.targetDirection === 'rtl' ? 'rtl' : 'ltr';
}

export function getTargetLocale() {
  return document.documentElement.dataset.targetLocale || 'tr-TR';
}

export function getTargetTextAttrs() {
  return `lang="${getTargetLanguageCode()}" dir="${getTargetDirection()}"`;
}
