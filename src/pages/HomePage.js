import { icon } from '../components/icons.js?v=20260713-7';
import { getUpcomingEvents, watchCalendarEvents } from '../services/calendarService.js?v=20260713-11';
import { openEventDetails, renderEventDetailsHost } from '../components/EventDetailsModal.js?v=20260713-11';

let homeEventsUnsubscribe;

export function renderHome(root, navigate) {
  const cards = [
    { route: 'mocidade', image: '/img/mocidade.png?v=4', icon: icon('music'), titleTop: 'Hinos da', titleMain: 'MOCIDADE' },
    { combined: true, image: '/img/harpa.png?v=4', icon: icon('book'), titleTop: 'Bíblia Sagrada', titleMain: 'HARPA CRISTÃ' },
    { route: 'ebd', image: '/img/Escolinhadominical.png?v=5', icon: icon('book'), titleTop: 'Escola Bíblica', titleMain: 'DOMINICAL' },
    { route: 'calendar', image: '/img/calendario.png?v=4', icon: icon('calendar'), titleTop: 'Calendário', titleMain: 'ZURIEL' },
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
        ${cards.map((card) => card.combined ? `
          <article class="quick-card combined-card" style="--card-image: url('${card.image}')">
            <span class="quick-overlay"></span>
            <span class="quick-icon">${card.icon}</span>
            <div class="quick-copy combined-copy">
              <strong><span>${card.titleTop}</span><b>${card.titleMain}</b></strong>
              <div class="quick-split-actions">
                <button type="button" data-route="bible">Abrir Bíblia</button>
                <button type="button" data-route="harpa">Abrir Harpa</button>
              </div>
            </div>
          </article>
        ` : `
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
    ${renderEventDetailsHost()}
  `;

  root.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.route));
  });

  const eventsTarget = root.querySelector('[data-upcoming-events]');
  homeEventsUnsubscribe?.();
  homeEventsUnsubscribe = watchCalendarEvents((events) => {
    renderUpcoming(eventsTarget, getUpcomingEvents(events, 3), root, navigate);
  });
}

function renderUpcoming(target, events, root, navigate) {
  if (!events.length) {
    target.innerHTML = '<p class="empty">Nenhum evento proximo.</p>';
    return;
  }

  target.innerHTML = `
    <div class="upcoming-list">
      ${events.map((event, index) => {
        const date = parseDateKey(event.date);
        return `
          <article class="event-card event-card-clickable" role="button" tabindex="0" data-event-details="${index}">
            <div class="event-date">
              <strong>${String(date.getDate()).padStart(2, '0')}</strong>
              <span>${getMonthLabel(date)}</span>
            </div>
            <div class="event-info">
              <h3>${escapeHtml(event.title || event.description || 'Evento')}</h3>
              <p>${escapeHtml(event.time || '--:--')}</p>
              ${!isRehearsal(event) ? `<small>${escapeHtml(event.location || 'Local nao informado')}</small>` : ''}
              ${event.eventType === 'sunday-school' ? `<small><b>Tema:</b> ${escapeHtml(event.lessonTitle || '')}</small>` : ''}
              ${isRehearsal(event) && event.conductor ? `<small><b>Regente:</b> ${escapeHtml(event.conductor)}</small>` : ''}
              ${isRehearsal(event) && event.rehearsalHymn ? `<small><b>Hino:</b> ${escapeHtml(event.rehearsalHymn)}</small>` : ''}
              <small class="event-open-hint">Toque para ver detalhes</small>
              <a class="share-button whatsapp-button" href="${escapeAttr(getEventWhatsAppUrl(event))}" target="_blank" rel="noopener" aria-label="Compartilhar evento no WhatsApp">${icon('whatsapp')}<span>WhatsApp</span></a>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;

  target.querySelectorAll('[data-event-details]').forEach((card) => {
    const open = () => {
      const event = events[Number(card.dataset.eventDetails)];
      openEventDetails(root, event, event.dateObject || parseDateKey(event.date), navigate);
    };
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      open();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open();
    });
  });
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

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function isRehearsal(event) {
  return event.eventType === 'rehearsal'
    || String(event.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('ensaio');
}

function getEventWhatsAppUrl(event) {
  const date = event.dateObject instanceof Date ? event.dateObject : parseDateKey(event.date);
  const lines = [
    `Evento: ${event.title || event.description || 'Evento'}`,
    `Data: ${date.toLocaleDateString('pt-BR')}`,
    `Horário: ${event.time || 'Não informado'}`,
  ];
  if (!isRehearsal(event)) lines.push(`Local: ${event.location || 'Não informado'}`);
  if (isRehearsal(event) && event.conductor) lines.push(`Regente: ${event.conductor}`);
  if (isRehearsal(event) && event.rehearsalHymn) lines.push(`Hino: ${event.rehearsalHymn}`);
  if (event.eventType === 'sunday-school' && event.lessonTitle) lines.push(`Tema: ${event.lessonTitle}`);
  if (event.notes) lines.push(`Observações: ${event.notes}`);
  lines.push(`${location.origin}${location.pathname}#calendar`);
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}
