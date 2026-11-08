import { getTargetLocale } from './language-registry.js';

let recognitionInstance = null;
let mediaRecorder = null;
let recordStream = null;
let recordedChunks = [];
let recordedUrl = null;

export function canSpeak() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
export function canRecognize() { return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition); }
export function isRecording() { return mediaRecorder?.state === 'recording'; }

export function speakTarget(text, { rate = 0.88, locale = getTargetLocale() } = {}) {
  if (!canSpeak()) return { ok: false, message: 'ميزة النطق غير متاحة في هذا المتصفح.' };
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text ?? ''));
  utterance.lang = locale;
  utterance.rate = Math.min(1.25, Math.max(0.5, Number(rate) || 0.88));
  utterance.pitch = 1;
  const base = locale.toLowerCase().split('-')[0];
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang?.toLowerCase().startsWith(base));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  return { ok: true, voice: voice?.name || `صوت ${locale} من الجهاز` };
}

// Kept as compatibility aliases for the current Turkish alphabet module and older lesson code.
export function speakTurkish(text, options = {}) { return speakTarget(text, options); }
export function cancelSpeech() { if (canSpeak()) window.speechSynthesis.cancel(); }

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('التسجيل غير مدعوم في هذا المتصفح أو يحتاج إلى اتصال آمن HTTPS.');
  try {
    recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(recordStream);
    mediaRecorder.ondataavailable = (event) => { if (event.data.size) recordedChunks.push(event.data); };
    return await new Promise((resolve, reject) => {
      mediaRecorder.onstart = () => resolve(true);
      mediaRecorder.onerror = () => reject(new Error('تعذر بدء التسجيل.'));
      mediaRecorder.start();
    });
  } catch (error) {
    releaseAudio();
    throw error;
  }
}

export function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') throw new Error('لا يوجد تسجيل جارٍ.');
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      recordStream?.getTracks().forEach((track) => track.stop());
      recordStream = null;
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      recordedUrl = URL.createObjectURL(blob);
      resolve({ blob, url: recordedUrl, seconds: Math.round(blob.size / 16000) });
    };
    mediaRecorder.stop();
  });
}

export function recognizeTarget({ onResult, onError, onEnd, locale = getTargetLocale() } = {}) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) throw new Error('التعرّف على الكلام غير مدعوم في هذا المتصفح.');
  recognitionInstance?.abort();
  recognitionInstance = new Recognition();
  recognitionInstance.lang = locale;
  recognitionInstance.interimResults = false;
  recognitionInstance.maxAlternatives = 1;
  recognitionInstance.onresult = (event) => onResult?.(event.results?.[0]?.[0]?.transcript || '');
  recognitionInstance.onerror = (event) => onError?.(event.error || 'unknown');
  recognitionInstance.onend = () => onEnd?.();
  recognitionInstance.start();
  return recognitionInstance;
}

export function recognizeTurkish(options = {}) { return recognizeTarget(options); }
export function stopRecognition() { recognitionInstance?.stop(); }
export function releaseAudio() {
  cancelSpeech();
  try { recognitionInstance?.abort(); } catch { /* قد تكون جلسة التعرف انتهت بالفعل */ }
  recognitionInstance = null;
  const recorder = mediaRecorder;
  mediaRecorder = null;
  if (recorder && recorder.state !== 'inactive') {
    recorder.ondataavailable = null;
    try { recorder.stop(); } catch { /* أُوقف المسجل بالفعل */ }
  }
  recordStream?.getTracks().forEach((track) => track.stop());
  recordStream = null;
  recordedChunks = [];
  if (recordedUrl) URL.revokeObjectURL(recordedUrl);
  recordedUrl = null;
  window.dispatchEvent(new CustomEvent('turkiya:audio-released'));
}
