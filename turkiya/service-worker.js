const CACHE_PREFIX = 'turkiya-app-';
const CACHE_VERSION = 'v8';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const APP_ROOT = new URL('./', self.registration.scope);
const SHELL_FILES = [
  'index.html', 'manifest.webmanifest', 'manus-routes.json',
  'css/themes.css', 'css/main.css', 'css/responsive.css', 'css/youtube.css',
  'js/app.js', 'js/router.js', 'js/alphabet.js', 'js/database.js', 'js/data.js',
  'js/language-registry.js', 'js/language-picker.js', 'js/progress.js', 'js/spaced-repetition.js',
  'js/audio.js', 'js/pwa.js', 'js/lessons.js', 'js/vocabulary.js', 'js/quizzes.js',
  'js/skills.js', 'js/youtube-utils.js', 'js/youtube.js',
  'assets/icons/app-icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-180.png',
  'assets/images/turkish-tea.jpg',
  'data/languages.json',
  'data/languages/tr/levels/pre-a1.json', 'data/languages/tr/levels/a1.json',
  'data/languages/tr/levels/a2.json', 'data/languages/tr/levels/b1.json',
  'data/languages/tr/levels/b2.json', 'data/languages/tr/levels/c1.json',
  'data/languages/tr/levels/c2.json',
  'data/languages/tr/vocabulary/index.json', 'data/languages/tr/grammar/index.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_FILES.map((path) => new URL(path, APP_ROOT)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put(new URL('index.html', APP_ROOT), response.clone());
        return response;
      } catch {
        return (await caches.match(new URL('index.html', APP_ROOT))) || Response.error();
      }
    })());
    return;
  }

  const isContent = url.pathname.includes('/data/');
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (!isContent && cached) {
      fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
      }).catch(() => {});
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      return cached || Response.error();
    }
  })());
});
