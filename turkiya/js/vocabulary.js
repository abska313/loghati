import { getVocabulary } from './data.js';
import { getAll, put, remove } from './database.js';
import { addToReview } from './spaced-repetition.js';
import { speakTurkish } from './audio.js';
import { escapeHtml, escapeAttr } from './quizzes.js';

function unique(items) { return [...new Set(items.filter(Boolean))]; }

export async function renderVocabulary(root, { toast = () => {}, initialQuery = '' } = {}) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحمّل القاموس…</p></div>';
  try {
    const [words, favorites] = await Promise.all([getVocabulary(), getAll('favorites')]);
    const favoriteIds = new Set(favorites.map((item) => item.id));
    const categories = unique(words.map((word) => word.category)).sort((a, b) => a.localeCompare(b, 'ar'));
    root.innerHTML = `<div class="view-header"><div><span class="kicker">كلمات في سياقها</span><h1>المفردات</h1><p>ابحث عن كلمة أو صفّها حسب الموضوع والمستوى، ثم أضف ما تريد تذكره إلى مراجعتك.</p></div><span class="status-pill">${words.length} مفردة</span></div>
      <label class="search-box"><span data-icon="search"></span><input id="vocab-search" type="search" placeholder="ابحث بالتركية أو العربية…" value="${escapeAttr(initialQuery)}" autocomplete="off"><button class="quiet-button button-small" id="favorites-filter" type="button">المفضلة فقط</button></label>
      <div class="filter-row"><select id="category-select" class="filter-chip"><option value="all">كل الموضوعات</option>${categories.map((category) => `<option value="${escapeAttr(category)}">${escapeHtml(category)}</option>`).join('')}</select><select id="level-select" class="filter-chip"><option value="all">كل المستويات</option>${unique(words.map((word) => word.level)).map((level) => `<option value="${escapeAttr(level)}">${escapeHtml(level)}</option>`).join('')}</select><span class="word-pos" id="vocab-count">${words.length} نتيجة</span></div>
      <div id="vocab-results" class="vocab-grid"></div>`;
    const results = root.querySelector('#vocab-results');
    const searchInput = root.querySelector('#vocab-search');
    const categorySelect = root.querySelector('#category-select');
    const levelSelect = root.querySelector('#level-select');
    const favoriteToggle = root.querySelector('#favorites-filter');
    let favoritesOnly = false;
    const draw = () => {
      const query = searchInput.value.trim().toLocaleLowerCase('tr-TR');
      const category = categorySelect.value;
      const level = levelSelect.value;
      const filtered = words.filter((word) => {
        const text = [word.tr, word.ar, word.exampleTr, word.exampleAr, word.category].join(' ').toLocaleLowerCase('tr-TR');
        return (!query || text.includes(query)) && (category === 'all' || word.category === category) && (level === 'all' || word.level === level) && (!favoritesOnly || favoriteIds.has(word.id));
      });
      root.querySelector('#vocab-count').textContent = `${filtered.length} نتيجة`;
      results.innerHTML = filtered.length ? filtered.map((word) => `<article class="vocab-card"><div class="vocab-card-top"><div><div class="word-tr" lang="tr" dir="ltr">${escapeHtml(word.tr)}</div><div class="word-ar">${escapeHtml(word.ar)}</div></div><button class="tiny-icon-button ${favoriteIds.has(word.id) ? 'active' : ''}" type="button" data-favorite="${escapeAttr(word.id)}" aria-label="${favoriteIds.has(word.id) ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'}" title="المفضلة"><span data-icon="star"></span></button></div><div class="word-pos">${escapeHtml(word.pos || '')} · ${escapeHtml(word.category || '')} · ${escapeHtml(word.level || '')}${word.ipa ? ` · IPA ${escapeHtml(word.ipa)}` : ''}</div><div class="word-example"><b lang="tr" dir="ltr">${escapeHtml(word.exampleTr || '')}</b><br>${escapeHtml(word.exampleAr || '')}</div><div class="word-actions"><button class="tiny-icon-button" type="button" data-speak="${escapeAttr(word.tr)}" aria-label="استمع إلى ${escapeAttr(word.tr)}" title="استمع"><span data-icon="volume"></span></button><button class="quiet-button button-small" type="button" data-add-review="${escapeAttr(word.id)}">أضف للمراجعة</button></div></article>`).join('') : '<div class="empty-state"><strong>لم نجد مفردات مطابقة</strong><p>جرّب كلمة أخرى أو غيّر الفلاتر.</p></div>';
      results.querySelectorAll('[data-icon]').forEach((icon) => { icon.innerHTML = window.turkiyaIcon?.(icon.closest('[data-favorite]') ? 'star' : 'volume') || ''; });
      results.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', async () => {
        const id = button.dataset.favorite;
        if (favoriteIds.has(id)) { favoriteIds.delete(id); await remove('favorites', id); toast('أزيلت الكلمة من المفضلة.'); }
        else { favoriteIds.add(id); await put('favorites', { id, addedAt: new Date().toISOString() }); toast('أُضيفت الكلمة إلى المفضلة.'); }
        draw();
      }));
      results.querySelectorAll('[data-add-review]').forEach((button) => button.addEventListener('click', async () => {
        const word = words.find((item) => item.id === button.dataset.addReview);
        if (word) { await addToReview(word); toast(`أُضيفت «${word.tr}» إلى المراجعة.`); window.dispatchEvent(new CustomEvent('turkiya:progress-changed')); }
      }));
      results.querySelectorAll('[data-speak]').forEach((button) => button.addEventListener('click', () => {
        const response = speakTurkish(button.dataset.speak);
        toast(response.ok ? 'نطق آلي من الجهاز؛ لا يتوفر صوت تركي على كل جهاز.' : response.message);
      }));
    };
    searchInput.addEventListener('input', draw);
    categorySelect.addEventListener('change', draw);
    levelSelect.addEventListener('change', draw);
    favoriteToggle.addEventListener('click', () => { favoritesOnly = !favoritesOnly; favoriteToggle.classList.toggle('active', favoritesOnly); draw(); });
    root.querySelectorAll('[data-icon]').forEach((icon) => { icon.innerHTML = window.turkiyaIcon?.('search') || ''; });
    draw();
  } catch (error) {
    root.innerHTML = `<div class="empty-state"><strong>تعذر تحميل المفردات</strong><p>${escapeHtml(error.message)}</p></div>`;
  }
}
