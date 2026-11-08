import { getActiveLanguageId, getTargetTextAttrs } from './language-registry.js';
import { speakTarget } from './audio.js';
import { getAll, put, remove } from './database.js';
import { escapeHtml, escapeAttr } from './quizzes.js';
import { buildYouTubeEmbedUrl, parseYouTubeUrl, validateClipRange } from './youtube-utils.js';

const cleanups = new WeakMap();

function languageIdFor(language) {
  try { return String(language?.id || getActiveLanguageId() || 'tr'); }
  catch { return String(language?.id || 'tr'); }
}

function notify(root, toast, message, type = 'info') {
  const status = root.querySelector('[data-youtube-status]');
  if (status) {
    status.textContent = message;
    status.dataset.state = type;
  }
  if (typeof toast === 'function') toast(message, type);
}

function readForm(root, language) {
  const urlValue = root.querySelector('[name="youtube-url"]').value;
  const parsed = parseYouTubeUrl(urlValue);
  if (!parsed.ok) return parsed;
  const range = validateClipRange(
    root.querySelector('[name="clip-start"]').value,
    root.querySelector('[name="clip-end"]').value,
  );
  if (!range.ok) return range;
  return {
    ok: true,
    id: parsed.id,
    url: parsed.canonicalUrl,
    start: range.start,
    end: range.end,
    loop: root.querySelector('[name="clip-loop"]').checked,
    captions: root.querySelector('[name="clip-captions"]').checked,
    captionLanguage: language?.captionLanguage || language?.locale || '',
    title: root.querySelector('[name="lesson-title"]').value.trim(),
    notes: root.querySelector('[name="lesson-notes"]').value.trim(),
    transcript: root.querySelector('[name="lesson-transcript"]').value.trim(),
  };
}

function formatSeconds(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function transcriptMarkup(text, textAttrs) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return '<p class="youtube-empty-transcript">ألصق هنا سطراً أو أكثر لتفعيل الاستماع.</p>';
  return lines.map((line, index) => `
    <div class="youtube-transcript-line">
      <p ${textAttrs}>${escapeHtml(line)}</p>
      <button class="youtube-speak-button" type="button" data-action="speak-line" data-line-index="${index}" aria-label="استمع إلى السطر ${index + 1}">استمع إلى السطر</button>
    </div>`).join('');
}

async function refreshSaved(root, languageId) {
  const list = root.querySelector('[data-youtube-saved-list]');
  if (!list) return;
  try {
    const records = await getAll('youtubeLessons');
    const filtered = (Array.isArray(records) ? records : [])
      .filter((record) => String(record.languageId || '') === languageId)
      .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
    if (!filtered.length) {
      list.innerHTML = '<p class="youtube-empty">لا توجد مقاطع محفوظة لهذه اللغة بعد.</p>';
      return;
    }
    list.innerHTML = filtered.map((record) => `
      <article class="youtube-saved-card">
        <div class="youtube-saved-copy">
          <h3>${escapeHtml(record.title || 'مقطع بدون عنوان')}</h3>
          <p>${escapeHtml(record.url || '')}${record.start ? ` · من ${escapeHtml(formatSeconds(record.start))} ث` : ''}${record.end !== null && record.end !== undefined ? ` إلى ${escapeHtml(formatSeconds(record.end))} ث` : ''}</p>
        </div>
        <div class="youtube-saved-actions">
          <button type="button" class="secondary-button button-small" data-action="open-saved" data-record-id="${escapeAttr(record.id)}">فتح</button>
          <button type="button" class="danger-button button-small" data-action="delete-saved" data-record-id="${escapeAttr(record.id)}" aria-label="حذف ${escapeAttr(record.title || 'المقطع')}">حذف</button>
        </div>
      </article>`).join('');
  } catch (error) {
    list.innerHTML = `<p class="youtube-empty">تعذر قراءة المقاطع المحفوظة: ${escapeHtml(error?.message || 'خطأ في التخزين المحلي.')}</p>`;
  }
}

export function renderYouTubeLab(root, { language = {}, toast } = {}) {
  if (!root) throw new TypeError('يلزم تحديد عنصر الجذر لمختبر YouTube.');
  cleanups.get(root)?.();
  const activeLanguageId = languageIdFor(language);
  let targetAttrs = '';
  try { targetAttrs = getTargetTextAttrs(); } catch { targetAttrs = ''; }
  const languageName = language.nativeName || language.nameAr || 'اللغة المستهدفة';

  root.innerHTML = `
    <section class="youtube-lab" aria-labelledby="youtube-lab-title">
      <header class="youtube-lab-header">
        <span class="kicker">مختبر الاستماع والنطق</span>
        <h1 id="youtube-lab-title">فيديوهات YouTube للغة ${escapeHtml(languageName)}</h1>
        <p>ألصق رابط فيديو عامّاً، وحدّد مقطعاً قصيراً للتدرب. لا يُحمّل المشغّل إلا بعد ضغطك على زر التشغيل.</p>
      </header>

      <div class="youtube-notice" role="note">
        <strong>قبل البدء</strong>
        <ul>
          <li>تشغيل الفيديو يحتاج إلى اتصال بالإنترنت. بعض الفيديوهات تمنع التضمين أو تكون مقيدة بالعمر، وقد لا تعمل هنا.</li>
          <li>الترجمة المغلقة (CC) تعتمد على ما يتيحه صاحب الفيديو واللاعب؛ تفضيل اللغة لا يضمن توافر ترجمة بها.</li>
          <li>تغيير السرعة يتم من إعدادات مشغّل YouTube عندما يتيحها الفيديو.</li>
          <li>هذه الأداة لا تنزّل الفيديو أو الصوت ولا تستخرج الترجمات.</li>
        </ul>
      </div>

      <div class="youtube-layout">
        <section class="panel panel-padding youtube-panel" aria-labelledby="youtube-player-heading">
          <h2 id="youtube-player-heading">إعداد المقطع</h2>
          <label class="youtube-field">
            <span>رابط فيديو YouTube</span>
            <input name="youtube-url" type="url" inputmode="url" autocomplete="url" dir="ltr" placeholder="https://www.youtube.com/watch?v=…" aria-describedby="youtube-url-help">
          </label>
          <small class="youtube-field-help" id="youtube-url-help">نقبل روابط youtube.com وyoutu.be وyoutube-nocookie.com بصيغ المشاهدة أو embed أو shorts أو live.</small>

          <div class="youtube-time-grid">
            <label class="youtube-field">
              <span>وقت البداية</span>
              <input name="clip-start" type="text" inputmode="decimal" dir="ltr" value="0" placeholder="0 أو 01:20" aria-label="وقت البداية بالثواني أو بصيغة وقت">
            </label>
            <label class="youtube-field">
              <span>وقت النهاية <small>(اختياري، وقت مطلق)</small></span>
              <input name="clip-end" type="text" inputmode="decimal" dir="ltr" placeholder="02:15" aria-label="وقت النهاية بالثواني أو بصيغة وقت">
            </label>
          </div>
          <small class="youtube-field-help">الوقت يقاس من بداية الفيديو. النهاية وقت مطلق، ويجب أن تكون بعد البداية. اكتب ثوانٍ أو MM:SS أو HH:MM:SS.</small>

          <div class="youtube-options">
            <label class="youtube-check"><input name="clip-loop" type="checkbox"><span>طلب تكرار الفيديو من المشغّل</span></label>
            <label class="youtube-check"><input name="clip-captions" type="checkbox"><span>طلب إظهار CC</span></label>
          </div>
          <p class="youtube-cc-hint">لغة CC المفضلة: ${escapeHtml(language.captionLanguage || language.locale || 'لغة التطبيق النشطة')} — هذا تفضيل للاعب وليس ضماناً لوجود ترجمة.</p>

          <div class="button-row youtube-player-actions">
            <button type="button" class="primary-button" data-action="play">تشغيل / إعادة تحميل المقطع</button>
          </div>
          <p class="youtube-status" data-youtube-status aria-live="polite"></p>
          <div class="youtube-player-frame" data-youtube-player aria-label="مشغل فيديو YouTube">
            <p class="youtube-player-placeholder">لن يُحمّل الفيديو قبل ضغط زر التشغيل.</p>
          </div>
          <a class="youtube-open-link" data-youtube-fallback hidden target="_blank" rel="noopener noreferrer">فتح الفيديو في YouTube إذا تعذّر التضمين</a>
        </section>

        <section class="panel panel-padding youtube-panel" aria-labelledby="youtube-lesson-heading">
          <h2 id="youtube-lesson-heading">مذكرتي للمقطع</h2>
          <label class="youtube-field">
            <span>عنوان المقطع</span>
            <input name="lesson-title" type="text" maxlength="140" dir="auto" placeholder="مثال: التحية في مقهى">
          </label>
          <label class="youtube-field">
            <span>ملاحظات</span>
            <textarea name="lesson-notes" rows="3" maxlength="3000" dir="auto" placeholder="اكتب ملاحظاتك بنفسك…"></textarea>
          </label>
          <label class="youtube-field">
            <span>تفريغ أو ترجمة ألصقها بنفسي</span>
            <textarea name="lesson-transcript" rows="6" maxlength="12000" ${targetAttrs} placeholder="الصق النص الذي تملكه أو أعددته بنفسك، سطراً في كل مرة…"></textarea>
          </label>
          <p class="youtube-tts-note">الاستماع إلى السطور يستخدم صوتاً آلياً من جهازك عبر أداة النطق، وليس صوت الفيديو الأصلي.</p>
          <div class="youtube-transcript" data-youtube-transcript aria-live="polite">${transcriptMarkup('', targetAttrs)}</div>
          <div class="button-row">
            <button type="button" class="secondary-button" data-action="save">حفظ محلياً</button>
          </div>
          <p class="youtube-field-help">تُحفظ الملاحظات والنص والرابط محلياً تحت اللغة النشطة في التطبيق.</p>
        </section>
      </div>

      <section class="section-block youtube-saved-section" aria-labelledby="youtube-saved-heading">
        <div class="section-heading"><div><h2 id="youtube-saved-heading">مقاطعي المحفوظة</h2><p>القائمة خاصة بلغة التطبيق النشطة.</p></div></div>
        <div class="youtube-saved-list" data-youtube-saved-list><p class="youtube-empty">جارٍ تحميل المقاطع…</p></div>
      </section>
    </section>`;

  const transcriptInput = root.querySelector('[name="lesson-transcript"]');
  const renderTranscript = () => {
    const lines = transcriptInput.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const container = root.querySelector('[data-youtube-transcript]');
    container.innerHTML = transcriptMarkup(transcriptInput.value, targetAttrs);
    container.querySelectorAll('[data-action="speak-line"]').forEach((button) => {
      button.addEventListener('click', () => {
        const text = lines[Number(button.dataset.lineIndex)];
        if (!text) return;
        try {
          const result = speakTarget(text, { rate: 0.88 });
          notify(root, toast, result?.message || (result?.ok ? 'بدأ الاستماع بصوت آلي من الجهاز.' : 'تعذر تشغيل النطق.'), result?.ok ? 'success' : 'error');
        } catch (error) {
          notify(root, toast, error?.message || 'تعذر تشغيل النطق.', 'error');
        }
      });
    });
  };

  const onInput = (event) => {
    if (event.target === transcriptInput) renderTranscript();
  };
  const onClick = async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || !root.contains(button)) return;
    const action = button.dataset.action;

    if (action === 'play') {
      const clip = readForm(root, language);
      if (!clip.ok) { notify(root, toast, clip.message, 'error'); return; }
      const frameHost = root.querySelector('[data-youtube-player]');
      const iframe = document.createElement('iframe');
      iframe.title = 'مشغل فيديو YouTube — المحتوى يقدمه YouTube';
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('playsinline', '1');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.src = buildYouTubeEmbedUrl(clip.id, clip);
      frameHost.replaceChildren(iframe);
      const fallback = root.querySelector("[data-youtube-fallback]");
      fallback.href = clip.url;
      fallback.hidden = false;
      notify(root, toast, 'تم تحميل المشغّل. قد لا تسمح بعض الفيديوهات بالتضمين.', 'info');
      return;
    }

    if (action === 'save') {
      const clip = readForm(root, language);
      if (!clip.ok) { notify(root, toast, clip.message, 'error'); return; }
      if (!clip.title) { notify(root, toast, 'أضف عنواناً للمقطع قبل الحفظ.', 'error'); root.querySelector('[name="lesson-title"]').focus(); return; }
      const existingId = root.dataset.editingYoutubeId;
      const record = {
        id: existingId || (globalThis.crypto?.randomUUID?.() || `yt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`),
        languageId: activeLanguageId,
        title: clip.title,
        url: clip.url,
        videoId: clip.id,
        start: clip.start,
        end: clip.end,
        loop: clip.loop,
        captions: clip.captions,
        captionLanguage: clip.captionLanguage,
        notes: clip.notes,
        transcript: clip.transcript,
        updatedAt: new Date().toISOString(),
      };
      try {
        await put('youtubeLessons', record);
        delete root.dataset.editingYoutubeId;
        await refreshSaved(root, activeLanguageId);
        notify(root, toast, 'حُفظ المقطع وملاحظاتك محلياً.', 'success');
      } catch (error) {
        notify(root, toast, error?.message || 'تعذر حفظ المقطع محلياً.', 'error');
      }
      return;
    }

    const recordId = button.dataset.recordId;
    if (action === 'open-saved') {
      try {
        const records = await getAll('youtubeLessons');
        const record = records.find((item) => String(item.id) === String(recordId) && String(item.languageId || '') === activeLanguageId);
        if (!record) { notify(root, toast, 'لم يعد هذا المقطع متاحاً في اللغة النشطة.', 'error'); return; }
        root.querySelector('[name="youtube-url"]').value = record.url || '';
        root.querySelector('[data-youtube-player]').innerHTML = '<p class="youtube-player-placeholder">اضغط التشغيل لتحميل الفيديو المحفوظ.</p>';
        const fallback = root.querySelector("[data-youtube-fallback]");
        fallback.href = record.url || '#';
        fallback.hidden = !record.url;
        root.querySelector('[name="clip-start"]').value = formatSeconds(record.start ?? 0);
        root.querySelector('[name="clip-end"]').value = formatSeconds(record.end);
        root.querySelector('[name="clip-loop"]').checked = Boolean(record.loop);
        root.querySelector('[name="clip-captions"]').checked = Boolean(record.captions);
        root.querySelector('[name="lesson-title"]').value = record.title || '';
        root.querySelector('[name="lesson-notes"]').value = record.notes || '';
        transcriptInput.value = record.transcript || '';
        root.dataset.editingYoutubeId = record.id;
        renderTranscript();
        root.querySelector('[data-action="play"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
        notify(root, toast, 'فُتح المقطع المحفوظ. اضغط التشغيل لتحميل المشغّل.', 'success');
      } catch (error) {
        notify(root, toast, error?.message || 'تعذر فتح المقطع المحفوظ.', 'error');
      }
      return;
    }

    if (action === 'delete-saved') {
      try {
        await remove('youtubeLessons', recordId);
        await refreshSaved(root, activeLanguageId);
        if (root.dataset.editingYoutubeId === recordId) delete root.dataset.editingYoutubeId;
        notify(root, toast, 'حُذف المقطع المحفوظ.', 'success');
      } catch (error) {
        notify(root, toast, error?.message || 'تعذر حذف المقطع.', 'error');
      }
    }
  };

  root.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  const cleanup = () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('click', onClick);
    cleanups.delete(root);
  };
  cleanups.set(root, cleanup);
  renderTranscript();
  refreshSaved(root, activeLanguageId);
  return cleanup;
}
