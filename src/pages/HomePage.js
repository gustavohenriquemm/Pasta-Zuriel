import { icon } from '../components/icons.js?v=20260708-5';
import { getUpcomingEvents, watchCalendarEvents } from '../services/calendarService.js?v=20260708-21';

let homeEventsUnsubscribe;

export function renderHome(root, navigate) {
  const cards = [
    { route: 'mocidade', image: '/img/mocidade.jpg?v=3', icon: icon('music'), titleTop: 'Hinos da', titleMain: 'MOCIDADE' },
    { route: 'harpa', image: '/img/harpa.jpg?v=3', icon: icon('harp'), titleTop: 'Hinos da', titleMain: 'HARPA' },
    { route: 'bible', image: '/img/biblia.jpg?v=3', icon: icon('book'), titleTop: 'Biblia', titleMain: 'SAGRADA' },
    { route: 'calendar', image: '/img/calendario.jpg?v=3', icon: icon('calendar'), titleTop: 'Calendario', titleMain: 'ZURIEL' },
  ];

  root.innerHTML = `
    <section class="home-premium fade-in">
      <div class="banner-card">
        <img src="img/bannerzuriel.png" alt="Banner Mocidade Zuriel">
      </div>

      <div class="quick-title">
        <span></span>
        <h1>Acessos rapidos</h1>
      </div>

      <section class="quick-grid" aria-label="Acessos rapidos">
        ${cards.map((card) => `
          <button class="quick-card" data-route="${card.route}" style="--card-image: url('${card.image}')">
            <span class="quick-overlay"></span>
            <span class="quick-icon">${card.icon}</span>
            <span class="quick-copy">
              <strong><span>${card.titleTop}</span><b>${card.titleMain}</b></strong>
              <small>Clique para acessar <span class="inline-arrow">${icon('arrow')}</span></small>
            </span>
          </button>
        `).join('')}
      </section>

      <section class="events-section">
        <div class="events-heading">
          <h2>Proximos Eventos</h2>
          <button type="button" data-route="calendar">Ver todos</button>
        </div>
        <div data-upcoming-events>
          <p class="empty">Carregando eventos...</p>
        </div>
      </section>
    </section>
  `;

  root.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.route));
  });

  const eventsTarget = root.querySelector('[data-upcoming-events]');
  homeEventsUnsubscribe?.();
  homeEventsUnsubscribe = watchCalendarEvents((events) => {
    renderUpcoming(eventsTarget, getUpcomingEvents(events, 3));
  });
}

function renderUpcoming(target, events) {
  if (!events.length) {
    target.innerHTML = '<p class="empty">Nenhum evento proximo.</p>';
    return;
  }

  target.innerHTML = `
    <div class="upcoming-list">
      ${events.map((event) => {
        const date = parseDateKey(event.date);
        return `
          <article class="event-card">
            <div class="event-date">
              <strong>${String(date.getDate()).padStart(2, '0')}</strong>
              <span>${getMonthLabel(date)}</span>
            </div>
            <div class="event-info">
              <h3>${escapeHtml(event.title || event.description || 'Evento')}</h3>
              <p>${escapeHtml(event.time || '--:--')}</p>
              <small>${escapeHtml(event.location || 'Local nao informado')}</small>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function parseDateKey(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getMonthLabel(date) {
  return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
