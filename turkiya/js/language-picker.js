import { applyLanguageContext, getActiveLanguage, getLanguages, selectLanguage } from './language-registry.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export async function mountLanguagePicker(select, { onChange = () => {}, onError = () => {} } = {}) {
  const languages = await getLanguages();
  const active = await getActiveLanguage();
  applyLanguageContext(active);
  if (!select) return { language: active, dispose() {} };

  select.innerHTML = languages.map((language) => {
    const planned = language.status !== 'active';
    const suffix = planned ? ' — قريباً' : '';
    return `<option value="${escapeHtml(language.id)}"${planned ? ' disabled' : ''}>${escapeHtml(language.nameAr)} · ${escapeHtml(language.nativeName)}${suffix}</option>`;
  }).join('');
  select.value = active.id;
  select.setAttribute('aria-label', 'اختيار لغة التعلّم');
  select.title = `لغة التعلّم الحالية: ${active.nameAr}`;

  const handleChange = async () => {
    const nextId = select.value;
    try {
      const selected = await selectLanguage(nextId);
      if (!selected) { select.value = active.id; return; }
      applyLanguageContext(selected);
      await onChange(selected);
    } catch (error) {
      select.value = active.id;
      onError(error);
    }
  };
  select.addEventListener('change', handleChange);
  return { language: active, dispose() { select.removeEventListener('change', handleChange); } };
}
