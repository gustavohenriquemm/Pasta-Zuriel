import { renderLayout } from './components/Layout.js?v=20260824-7';
import { renderHome } from './pages/HomePage.js?v=20260824-7';
import { renderBible } from './pages/BiblePage.js?v=20260824-6';
import { renderHymnal } from './pages/HymnalPage.js?v=20260830-1';
import { renderCalendar } from './pages/CalendarPage.js?v=20260824-7';
import { renderSundaySchool } from './pages/SundaySchoolPage.js?v=20260824-6';
import { renderShirt } from './pages/ShirtPage.js?v=20260824-6';
import { renderAdmin } from '../admin/AdminPage.js?v=20260830-1';
import { initTheme } from './hooks/useTheme.js';
import { registerServiceWorker } from './utils/pwa.js?v=20260713-3';
import { initializeNotifications } from './services/notificationService.js?v=20260713-19';

const routes = {
  home: renderHome,
  bible: (root, navigate, route) => renderBible(root, navigate, route),
  ebd: renderSundaySchool,
  harpa: (root, navigate, route) => renderHymnal(root, 'harpa', navigate, route),
  mocidade: (root, navigate, route) => renderHymnal(root, 'mocidade', navigate, route),
  calendar: (root, navigate, route) => renderCalendar(root, navigate, route),
  shirt: renderShirt,
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
  registerServiceWorker();
  initializeNotifications();
  render();
}

window.addEventListener('popstate', render);

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

