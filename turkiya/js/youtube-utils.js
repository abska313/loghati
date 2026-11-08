const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const ALLOWED_HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
  'youtube-nocookie.com', 'www.youtube-nocookie.com',
]);

export function parseYouTubeUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { ok: false, message: 'أدخل رابط فيديو YouTube أولاً.' };

  let candidate = raw;
  if (!/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(candidate)) candidate = `https://${candidate}`;

  let url;
  try { url = new URL(candidate); } catch { return { ok: false, message: 'صيغة الرابط غير صالحة.' }; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    return { ok: false, message: 'استخدم رابط YouTube عامّاً صالحاً دون بيانات دخول.' };
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!ALLOWED_HOSTS.has(host) || url.port) {
    return { ok: false, message: 'المضيف غير مقبول. استخدم رابطاً من YouTube أو youtu.be.' };
  }

  let id = '';
  if (host === 'youtu.be') {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 1) id = parts[0];
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v') || '';
  } else {
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/);
    if (match) id = match[1];
  }

  if (!VIDEO_ID_PATTERN.test(id)) {
    return { ok: false, message: 'تعذّر العثور على معرّف فيديو صالح من 11 محرفاً في الرابط.' };
  }
  return { ok: true, id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` };
}

export function parseClipTime(input, { optional = false } = {}) {
  const raw = String(input ?? '').trim();
  if (!raw) return optional ? { ok: true, value: null } : { ok: false, message: 'أدخل وقتاً بالثواني أو بصيغة MM:SS.' };

  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const value = Number(raw);
    return Number.isFinite(value) ? { ok: true, value } : { ok: false, message: 'الوقت غير صالح.' };
  }

  const parts = raw.split(':');
  if ((parts.length !== 2 && parts.length !== 3) || parts.some((part) => !/^\d+$/.test(part))) {
    return { ok: false, message: 'استخدم ثوانٍ أو MM:SS أو HH:MM:SS.' };
  }
  const nums = parts.map(Number);
  const tail = nums.slice(1);
  if (tail.some((part) => part >= 60)) return { ok: false, message: 'يجب أن تكون الدقائق/الثواني بعد النقطتين أقل من 60.' };
  const value = parts.length === 2 ? nums[0] * 60 + nums[1] : nums[0] * 3600 + nums[1] * 60 + nums[2];
  return Number.isFinite(value) ? { ok: true, value } : { ok: false, message: 'الوقت غير صالح.' };
}

export function validateClipRange(startInput, endInput) {
  const start = parseClipTime(startInput);
  if (!start.ok) return start;
  const end = parseClipTime(endInput, { optional: true });
  if (!end.ok) return end;
  if (end.value !== null && end.value <= start.value) {
    return { ok: false, message: 'وقت النهاية يجب أن يكون أكبر من وقت البداية.' };
  }
  return { ok: true, start: start.value, end: end.value };
}

export function buildYouTubeEmbedUrl(videoId, { start = 0, end = null, loop = false, captions = false, captionLanguage = '' } = {}) {
  if (!VIDEO_ID_PATTERN.test(String(videoId))) throw new TypeError('معرّف فيديو YouTube غير صالح.');
  const params = new URLSearchParams({
    playsinline: '1', controls: '1', autoplay: '0',
  });
  if (Number.isFinite(Number(start)) && Number(start) > 0) params.set('start', String(Math.floor(Number(start))));
  if (end !== null && Number.isFinite(Number(end))) params.set('end', String(Math.floor(Number(end))));
  if (loop) {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }
  if (captions) {
    params.set('cc_load_policy', '1');
    const lang = String(captionLanguage || '').trim();
    if (/^[A-Za-z0-9-]{2,35}$/.test(lang)) params.set('cc_lang_pref', lang);
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
