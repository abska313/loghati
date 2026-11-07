let recognitionInstance = null;
let mediaRecorder = null;
let recordStream = null;
let recordedChunks = [];
let recordedUrl = null;

export function canSpeak() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
export function canRecognize() { return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition); }
export function isRecording() { return mediaRecorder?.state === 'recording'; }

export function speakTurkish(text, { rate = 0.88 } = {}) {
  if (!canSpeak()) return { ok: false, message: 'ميزة النطق غير متاحة في هذا المتصفح.' };
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  utterance.rate = rate;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const turkish = voices.find((voice) => voice.lang?.toLowerCase().startsWith('tr'));
  if (turkish) utterance.voice = turkish;
  window.speechSynthesis.speak(utterance);
  return { ok: true, voice: turkish?.name || 'صوت تركي متاح من الجهاز' };
}

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

export function recognizeTurkish({ onResult, onError, onEnd } = {}) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) throw new Error('التعرّف على الكلام غير مدعوم في هذا المتصفح.');
  recognitionInstance?.abort();
  recognitionInstance = new Recognition();
  recognitionInstance.lang = 'tr-TR';
  recognitionInstance.interimResults = false;
  recognitionInstance.maxAlternatives = 1;
  recognitionInstance.onresult = (event) => onResult?.(event.results?.[0]?.[0]?.transcript || '');
  recognitionInstance.onerror = (event) => onError?.(event.error || 'unknown');
  recognitionInstance.onend = () => onEnd?.();
  recognitionInstance.start();
  return recognitionInstance;
}

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
