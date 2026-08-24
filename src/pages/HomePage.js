import { icon } from '../components/icons.js?v=20260817-4';
import { getUpcomingEvents, watchCalendarEvents } from '../services/calendarService.js?v=20260824-5';
import { openEventDetails, renderEventDetailsHost } from '../components/EventDetailsModal.js?v=20260824-5';

let homeEventsUnsubscribe;

export function renderHome(root, navigate) {
  const congressCards = [
    { route: 'mocidade', icon: icon('music'), title: 'Hinos', subtitle: 'Louvores' },
    { route: 'shirt', icon: icon('shirt'), title: 'Camisa', subtitle: 'Modelo oficial' },
    { route: 'calendar:2026-10-03', icon: icon('calendar'), title: 'Data', subtitle: '03 e 04/10' },
    { route: 'bible:MAT:5:6', icon: icon('book'), title: 'Tema', subtitle: 'Mateus 5:6' },
  ];
  const cards = [
    { route: 'mocidade', image: '/img/mocidade-card.jpg?v=20260817-4', icon: icon('music'), titleTop: 'Hinos da', titleMain: 'MOCIDADE' },
    { combined: true, image: '/img/biblia-card.jpg?v=20260817-4', icon: icon('book'), titleTop: 'B&iacute;blia Sagrada', titleMain: 'HARPA CRIST&Atilde;' },
    { route: 'ebd', image: '/img/escola-dominical-card.jpg?v=20260817-4', icon: icon('book'), titleTop: 'Escola B&iacute;blica', titleMain: 'DOMINICAL' },
    { route: 'calendar', image: '/img/calendario-card.jpg?v=20260817-4', icon: icon('calendar'), titleTop: 'Calend&aacute;rio', titleMain: 'ZURIEL' },
  ];

  root.innerHTML = `
    <section class="home-premium fade-in">
      <button class="congress-hero" type="button" data-route="calendar" aria-label="Abrir informacoes do Congresso Zuriel">
        <img src="img/congresso-banner.png?v=20260817-1" alt="Congresso Zuriel - Insaciaveis - Mateus 5:6" width="2200" height="1000" fetchpriority="high" decoding="async">
      </button>

      <section class="congress-mini-grid" aria-label="Informacoes do congresso">
        ${congressCards.map((card) => `
          <button class="congress-mini-card" type="button" ${card.route ? `data-route="${card.route}"` : `data-congress-action="${card.action}"`}>
            <span>${card.icon}</span>
            <strong>${card.title}</strong>
            <small>${card.subtitle}</small>
          </button>
        `).join('')}
      </section>

      <div class="quick-title">
        <span></span>
        <h1>Acessos r&aacute;pidos</h1>
      </div>

      <section class="quick-grid" aria-label="Acessos rapidos">
        ${cards.map((card) => card.combined ? `
          <article class="quick-card combined-card" style="--card-image: url('${card.image}')">
            <span class="quick-overlay"></span>
            <span class="quick-icon">${card.icon}</span>
            <div class="quick-copy combined-copy">
              <strong><span>${card.titleTop}</span><b>${card.titleMain}</b></strong>
              <div class="quick-split-actions">
                <button type="button" data-route="bible">Ver B&iacute;blia</button>
                <button type="button" data-route="harpa">Ver Harpa</button>
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
          <h2>Pr&oacute;ximos Eventos</h2>
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
    target.innerHTML = '<p class="empty">Nenhum evento pr&oacute;ximo.</p>';
    return;
  }

  target.innerHTML = `
    <div class="upcoming-list">
      ${events.map((event, index) => {
        const date = parseDateKey(event.date);
        return `
          <article class="event-card event-card-clickable ${isSpecialEvent(event) ? 'event-card-special' : ''}" role="button" tabindex="0" data-event-details="${index}">
            <div class="event-date">
              <strong>${String(date.getDate()).padStart(2, '0')}</strong>
              <span>${getMonthLabel(date)}</span>
            </div>
            <div class="event-info">
              <h3>${escapeHtml(event.title || event.description || 'Evento')}</h3>
              <p>${escapeHtml(event.time || '--:--')}</p>
              ${!isRehearsal(event) ? `<small>${escapeHtml(event.location || 'Local nao informado')}</small>` : ''}
              ${event.eventType === 'sunday-school' ? `<small><b>Tema:</b> ${escapeHtml(event.lessonTitle || '')}</small>` : ''}
              ${event.lessonCompleted ? '<small class="lesson-status-done">Realizada</small>' : ''}
              ${isSpecialEvent(event) ? `<small class="special-event-theme"><b>Referência:</b> ${escapeHtml(event.theme || 'Mateus 5:6')}</small>` : ''}
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

function isSpecialEvent(event) {
  return event.special === true || ['congress', 'retreat'].includes(event.eventType);
}

function getEventWhatsAppUrl(event) {
  const date = event.dateObject instanceof Date ? event.dateObject : parseDateKey(event.date);
  const lines = [
    `Evento: ${event.title || event.description || 'Evento'}`,
    `Data: ${date.toLocaleDateString('pt-BR')}`,
    `Horario: ${event.time || 'Nao informado'}`,
  ];
  if (!isRehearsal(event)) lines.push(`Local: ${event.location || 'Nao informado'}`);
  if (isRehearsal(event) && event.conductor) lines.push(`Regente: ${event.conductor}`);
  if (isRehearsal(event) && event.rehearsalHymn) lines.push(`Hino: ${event.rehearsalHymn}`);
  if (event.eventType === 'sunday-school' && event.lessonTitle) lines.push(`Tema: ${event.lessonTitle}`);
  if (event.notes) lines.push(`Observacoes: ${event.notes}`);
  lines.push(`${location.origin}${location.pathname}#calendar`);
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}
