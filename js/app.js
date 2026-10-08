import { State } from './state.js';
import { renderApp } from './views.js';
import { mergeExpanded } from './data/expanded.js';
import { LANGUAGES } from './data/languages.js';
import { Notifications } from './notifications.js';

mergeExpanded(LANGUAGES);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW failed:', e.message));
  });
}

function parseHash() {
  const h = location.hash.slice(1);
  if (!h) return { view: 'splash', params: {} };
  const [view, paramsStr] = h.split('/');
  let params = {};
  if (paramsStr) { try { params = JSON.parse(decodeURIComponent(paramsStr)); } catch {} }
  return { view, params };
}

function boot() {
  const root = document.getElementById('app');
  State.subscribe(() => renderApp(root));

  const initial = parseHash();
  State.view = initial.view;
  State.viewParams = initial.params;

  if (initial.view === 'splash' && State.currentLangCode) {
    const p = State.getLangProgress();
    if (p && p.placement) State.view = 'dashboard';
  }

  window.addEventListener('hashchange', () => {
    const { view, params } = parseHash();
    State.view = view;
    State.viewParams = params;
    State.emit();
  });

  renderApp(root);

  if (Notifications.supported) {
    const cfg = Notifications.getConfig();
    if (cfg.enabled) Notifications.scheduleCheck();
  }

  window.addEventListener('error', e => console.error('Runtime:', e.error || e.message));
  window.addEventListener('unhandledrejection', e => console.error('Promise:', e.reason));
}

State.load().then(boot);
