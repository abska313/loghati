const ROUTES = new Set(['home', 'lessons', 'alphabet', 'vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing', 'review', 'profile']);
let currentRoute = 'home';
let onRouteChange = () => {};

function readRoute() {
  const candidate = location.hash.replace(/^#\/?/, '').split('/')[0];
  return ROUTES.has(candidate) ? candidate : 'home';
}

function applyRoute() {
  const next = readRoute();
  if (next === currentRoute && document.querySelector('#view-root')?.dataset.route === next) return;
  currentRoute = next;
  document.querySelectorAll('[data-route]').forEach((element) => {
    const active = element.dataset.route === currentRoute;
    element.classList.toggle('active', active);
    if (element.matches('a')) {
      if (active) element.setAttribute('aria-current', 'page');
      else element.removeAttribute('aria-current');
    }
  });
  onRouteChange(currentRoute);
}

export function initRouter(callback) {
  onRouteChange = callback;
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-route]');
    if (!target) return;
    event.preventDefault();
    const route = target.dataset.route;
    if (ROUTES.has(route)) {
      if (location.hash === `#${route}`) applyRoute();
      else location.hash = route;
    }
  });
  window.addEventListener('hashchange', applyRoute);
  applyRoute();
}

export function navigate(route) {
  if (ROUTES.has(route)) location.hash = route;
}
export function getCurrentRoute() { return currentRoute; }
