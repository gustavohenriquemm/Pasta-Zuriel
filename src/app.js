import { renderLayout } from './components/Layout.js?v=20260708-30';
import { renderHome } from './pages/HomePage.js?v=20260708-21';
import { renderBible } from './pages/BiblePage.js?v=20260708-2';
import { renderHymnal } from './pages/HymnalPage.js?v=20260708-23';
import { renderCalendar } from './pages/CalendarPage.js?v=20260708-29';
import { renderAdmin } from '../admin/AdminPage.js?v=20260708-30';
import { initTheme } from './hooks/useTheme.js';
import { registerServiceWorker } from './utils/pwa.js?v=20260708-2';

const routes = {
  home: renderHome,
  bible: renderBible,
  harpa: (root, navigate, route) => renderHymnal(root, 'harpa', navigate, route),
  mocidade: (root, navigate, route) => renderHymnal(root, 'mocidade', navigate, route),
  calendar: renderCalendar,
  admin: renderAdmin,
};

const app = document.querySelector('#app');

function navigate(route) {
  const baseRoute = route.split(':')[0];
  const nextRoute = routes[baseRoute] ? route : 'home';
  history.pushState({ route: nextRoute }, '', `#${nextRoute}`);
  render();
}

function render() {
  const route = location.hash.replace('#', '') || 'home';
  const baseRoute = route.split(':')[0];
  renderLayout(app, baseRoute, navigate);
  const main = app.querySelector('[data-main]');
  routes[baseRoute]?.(main, navigate, route);
}

function boot() {
  initTheme();
  localStorage.removeItem('favorites:bible');
  localStorage.removeItem('favorites:harpa');
  localStorage.removeItem('favorites:mocidade');
  registerServiceWorker();
  render();
}

window.addEventListener('popstate', render);

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
