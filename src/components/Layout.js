import { icon } from './icons.js?v=20260713-8';
import { listenNotices, listenNotifications } from '../../database/firestore.js?v=20260713-33';
import {
  enableNotifications,
  getNotificationsLastSeen,
  getNotificationStatus,
  markNotificationsRead,
  showSiteNotification,
} from '../services/notificationService.js?v=20260713-19';

let noticesUnsubscribe;
let notificationsUnsubscribe;
let activeNotices = [];
let autoNoticeOpened = false;

export function renderLayout(root, activeRoute, navigate) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <button class="icon-button top-icon" data-menu-toggle title="Menu" aria-label="Menu">
          ${icon('menu')}
        </button>
        <button class="brand-title" data-route="home" title="Inicio">MOCIDADE ZURIEL</button>
        <nav class="top-actions" aria-label="Navegacao principal">
          <button class="icon-button top-icon notice-button" data-notices title="Avisos">${icon('bell')}<span class="notice-badge hidden" data-notice-badge>0</span></button>
          <button class="icon-button admin-shortcut" data-route="admin" title="Painel administrativo">${icon('user')}</button>
        </nav>
      </header>
      <div class="drawer-overlay hidden" data-drawer-overlay></div>
      <aside class="side-drawer" data-side-drawer>
        <strong>Mocidade Zuriel</strong>
        <button data-route="home">${icon('home')} Inicio</button>
        <button data-route="mocidade">${icon('music')} Hinos da Mocidade</button>
        <button data-route="harpa">${icon('harp')} Hinos da Harpa</button>
        <button data-route="bible">${icon('book')} Biblia</button>
        <button data-route="ebd">${icon('book')} Escola Bíblica Dominical</button>
        <button data-route="calendar">${icon('calendar')} Calendario</button>
        <button data-route="admin">${icon('user')} Perfil/Admin</button>
      </aside>
      <main class="main" data-main data-active-route="${activeRoute}"></main>
      <nav class="bottom-nav" aria-label="Navegacao inferior">
        <button class="${activeRoute === 'home' ? 'active' : ''}" data-route="home">${icon('home')}<span>Inicio</span></button>
        <button class="${activeRoute === 'calendar' ? 'active' : ''}" data-route="calendar">${icon('calendar')}<span>Agenda</span></button>
        <button class="${activeRoute === 'bible' ? 'active' : ''}" data-route="bible">${icon('book')}<span>Biblia</span></button>
        <button class="${activeRoute === 'admin' ? 'active' : ''}" data-route="admin">${icon('user')}<span>Perfil</span></button>
      </nav>
      <div class="modal-screen hidden" data-public-modal-screen>
        <section class="app-modal notice-modal" data-public-notice-modal></section>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.route));
  });
  bindMenu(root);
  bindNotices(root);
}

function bindMenu(root) {
  const drawer = root.querySelector('[data-side-drawer]');
  const overlay = root.querySelector('[data-drawer-overlay]');
  const setOpen = (open) => {
    drawer.classList.toggle('open', open);
    overlay.classList.toggle('hidden', !open);
  };
  root.querySelector('[data-menu-toggle]').addEventListener('click', () => setOpen(!drawer.classList.contains('open')));
  overlay.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', () => setOpen(false)));
}

function bindNotices(root) {
  const badge = root.querySelector('[data-notice-badge]');
  const button = root.querySelector('[data-notices]');
  const screen = root.querySelector('[data-public-modal-screen]');
  const modal = root.querySelector('[data-public-notice-modal]');

  const getFeed = () => buildNotificationFeed([], activeNotices);
  const getUnread = () => getFeed().filter((item) => Number(item.updatedAt || 0) > getNotificationsLastSeen());
  const renderBadge = () => {
    const unreadCount = getUnread().length;
    badge.textContent = String(unreadCount);
    badge.classList.toggle('hidden', unreadCount === 0);
    button.classList.toggle('has-notices', unreadCount > 0);
    button.setAttribute('aria-label', unreadCount ? `${unreadCount} notificação(ões) não lida(s)` : 'Notificações');
  };
  const closeNotices = () => {
    screen.classList.add('hidden');
    document.body.classList.remove('modal-open');
  };
  const openNotices = () => {
    const feed = getFeed();
    modal.innerHTML = `
      <header>
        <h2>Avisos</h2>
      </header>
      <div class="notice-list">
        ${feed.length ? feed.map((notice) => `
          <article>
            <strong>${escapeHtml(notice.title || 'Atualização')}</strong>
            <time>${escapeHtml(formatNotificationDate(notice))}</time>
            <p>${escapeHtml(notice.body || notice.message || '')}</p>
            ${notice.link ? `<button class="plain-button notification-link" type="button" data-notification-link="${escapeHtml(notice.link)}">Ver detalhes</button>` : ''}
          </article>
        `).join('') : '<article><strong>Nenhum aviso ativo</strong><p>Os avisos cadastrados pela igreja aparecerão aqui.</p></article>'}
      </div>
      ${renderNotificationPermission()}
      <div class="form-actions">
        <button class="plain-button" data-close-notice>Fechar</button>
        <button class="primary-button" data-close-notice>Entendi</button>
      </div>
    `;
    screen.classList.remove('hidden');
    document.body.classList.add('modal-open');
    markNotificationsRead();
    renderBadge();
    modal.querySelectorAll('[data-close-notice]').forEach((item) => item.addEventListener('click', () => {
      closeNotices();
    }));
    modal.querySelectorAll('[data-notification-link]').forEach((item) => item.addEventListener('click', () => {
      const route = String(item.dataset.notificationLink || '').split('#')[1] || 'home';
      closeNotices();
      navigate(route);
    }));
    const notificationButton = modal.querySelector('[data-enable-notifications]');
    notificationButton?.addEventListener('click', async () => {
      const status = modal.querySelector('[data-notification-permission-status]');
      notificationButton.disabled = true;
      status.textContent = 'Ativando notificações...';
      try {
        const result = await enableNotifications();
        status.textContent = result.message;
        notificationButton.textContent = 'Notificações ativadas';
      } catch (error) {
        status.textContent = error.message || 'Não foi possível ativar as notificações.';
        notificationButton.disabled = false;
      }
    });
  };
  const openNotificationPermissionPrompt = () => {
    sessionStorage.setItem('zuriel:notification-permission-prompt-shown', 'true');
    modal.innerHTML = `
      <header>
        <h2>Ativar notificações?</h2>
      </header>
      <article class="notification-permission-card permission-entry-card">
        <div>
          <strong>Receba as atualizações da igreja</strong>
          <p data-notification-permission-status>Permita as notificações para receber avisos de ensaios, hinos e eventos na barra do seu celular ou computador, mesmo com o aplicativo fechado.</p>
        </div>
      </article>
      <div class="form-actions">
        <button class="plain-button" type="button" data-skip-notifications>Agora não</button>
        <button class="primary-button" type="button" data-allow-notifications>Permitir notificações</button>
      </div>
    `;
    screen.classList.remove('hidden');
    document.body.classList.add('modal-open');
    modal.querySelector('[data-skip-notifications]').addEventListener('click', closeNotices);
    modal.querySelector('[data-allow-notifications]').addEventListener('click', async (event) => {
      const allowButton = event.currentTarget;
      const status = modal.querySelector('[data-notification-permission-status]');
      allowButton.disabled = true;
      status.textContent = 'Aguardando sua permissão...';
      try {
        const result = await enableNotifications();
        status.textContent = result.message;
        allowButton.textContent = 'Notificações ativadas';
        setTimeout(closeNotices, 900);
      } catch (error) {
        status.textContent = error.message || 'Não foi possível ativar as notificações.';
        allowButton.disabled = false;
      }
    });
  };

  screen.addEventListener('click', (event) => {
    if (event.target === screen) closeNotices();
  });
  button.addEventListener('click', () => openNotices());
  renderBadge();
  noticesUnsubscribe?.();
  noticesUnsubscribe = listenNotices((notices) => {
    activeNotices = notices.filter(isNoticeActive);
    renderBadge();
  });
  notificationsUnsubscribe?.();
  notificationsUnsubscribe = listenNotifications((notifications, changes, initialized) => {
    if (initialized) changes.slice(0, 3).forEach((notification) => showSiteNotification(notification));
    if (screen.classList.contains('hidden') && shouldAutoOpenNotices(getUnread())) openNotices();
  });
  if (
    getNotificationStatus().state === 'available'
    && sessionStorage.getItem('zuriel:notification-permission-prompt-shown') !== 'true'
  ) {
    openNotificationPermissionPrompt();
  }
}

function renderNotificationPermission() {
  const status = getNotificationStatus();
  const canEnable = status.state === 'available';
  const enabled = status.state === 'enabled';
  return `
    <article class="notification-permission-card">
      <div>
        <strong>Avisos no seu aparelho</strong>
        <p data-notification-permission-status>${escapeHtml(status.message)}</p>
      </div>
      <button class="primary-button" type="button" data-enable-notifications ${canEnable ? '' : 'disabled'}>${enabled ? 'Notificações ativadas' : 'Ativar notificações'}</button>
    </article>
  `;
}

function isNoticeActive(notice) {
  if (notice.active === false || notice.active === 'false') return false;
  const today = getLocalDateKey();
  const expiresAt = normalizeDateKey(notice.expiresAt);
  if (expiresAt && expiresAt < today) return false;
  return true;
}

function shouldAutoOpenNotices(notices) {
  if (!notices.length || autoNoticeOpened) return false;
  autoNoticeOpened = true;
  return true;
}

function buildNotificationFeed(notifications, notices) {
  const coveredNoticeIds = new Set(
    notifications.filter((item) => item.sourceType === 'notice').map((item) => item.sourceId),
  );
  const legacyNotices = notices
    .filter((notice) => !coveredNoticeIds.has(notice.id))
    .map((notice) => ({
      id: `notice-${notice.id}`,
      title: notice.title || 'Aviso importante',
      body: notice.message || '',
      type: 'notice',
      sourceType: 'notice',
      sourceId: notice.id,
      link: '/#home',
      updatedAt: Number(notice.updatedAt || 0),
      startDate: notice.startDate,
    }));
  return [...notifications, ...legacyNotices]
    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
    .slice(0, 30);
}

function getLocalDateKey() {
  const now = new Date();
  return toDateKey(now);
}

function normalizeDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (typeof value?.toDate === 'function') return toDateKey(value.toDate());
  if (value instanceof Date) return toDateKey(value);
  return '';
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function formatNotificationDate(notification) {
  const timestamp = Number(notification.updatedAt || 0);
  if (timestamp) {
    return new Date(timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  const key = normalizeDateKey(notification.startDate) || getLocalDateKey();
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
