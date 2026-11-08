import { saveQuizResult } from './progress.js';
import { getTargetLocale } from './language-registry.js';

export function normalizeTarget(value, locale = getTargetLocale()) {
  return String(value || '').trim().normalize('NFC').toLocaleLowerCase(locale).replace(/[.!?،,؛;:]+$/u, '').replace(/\s+/g, ' ');
}

// Compatibility alias for the current Turkish curriculum and older local backups.
export function normalizeTurkish(value) { return normalizeTarget(value, 'tr-TR'); }

export function matchesExpected(input, expected, locale = getTargetLocale()) {
  const accepted = Array.isArray(expected) ? expected : [expected];
  const candidate = normalizeTarget(input, locale);
  return accepted.some((answer) => normalizeTarget(answer, locale) === candidate);
}

export function questionMarkup(question, index, prefix = 'q') {
  const options = (question.options || []).map((option, optionIndex) => `
    <label class="quiz-option"><input type="radio" name="${prefix}-${index}" value="${optionIndex}"><span dir="auto">${escapeHtml(option)}</span></label>`).join('');
  return `<div class="question-card" data-question="${index}" data-correct="${Number(question.correctIndex) || 0}" data-explanation="${escapeAttr(question.explanationAr || '')}"><p>${escapeHtml(question.questionAr || '')}</p><div class="option-list">${options}</div><div class="quiz-feedback" aria-live="polite"></div></div>`;
}

export async function scoreQuestion(element, selectedIndex, skill = 'general', label = '') {
  const correct = Number(element.dataset.correct);
  const feedback = element.querySelector('.quiz-feedback');
  if (selectedIndex === correct) {
    feedback.textContent = `صحيح. ${element.dataset.explanation || ''}`;
    feedback.className = 'quiz-feedback correct';
    await saveQuizResult({ score: 1, total: 1, skill, label });
    return true;
  }
  feedback.textContent = `ليست الإجابة الصحيحة. ${element.dataset.explanation || ''}`;
  feedback.className = 'quiz-feedback incorrect';
  await saveQuizResult({ score: 0, total: 1, skill, label });
  return false;
}

export function attachQuizHandlers(root, { skill = 'general', label = '' } = {}) {
  root.querySelectorAll('.question-card input[type="radio"]').forEach((input) => {
    input.addEventListener('change', async () => {
      const card = input.closest('.question-card');
      if (card.dataset.answered === 'true') return;
      card.dataset.answered = 'true';
      card.querySelectorAll('input').forEach((item) => { item.disabled = true; });
      await scoreQuestion(card, Number(input.value), skill, label);
    });
  });
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
export function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }
