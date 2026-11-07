let installPrompt = null;

export function initPWA({ onInstallAvailable = () => {}, onConnectionChange = () => {}, toast = () => {} } = {}) {
  const updateConnection = () => onConnectionChange(navigator.onLine);
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
  updateConnection();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register(new URL('../service-worker.js', import.meta.url), { scope: new URL('../', import.meta.url).pathname })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) toast('تحديث التطبيق جاهز؛ احفظ تقدمك ثم أعد تحميل الصفحة لتطبيقه.');
          });
        });
      })
      .catch(() => toast('تعذر تفعيل وضع العمل دون اتصال في هذا السياق.'));
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    onInstallAvailable(true);
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    onInstallAvailable(false);
    toast('أُضيف التطبيق إلى جهازك.');
  });
}

export async function promptInstall() {
  if (!installPrompt) return false;
  installPrompt.prompt();
  const outcome = await installPrompt.userChoice;
  installPrompt = null;
  return outcome?.outcome === 'accepted';
}
