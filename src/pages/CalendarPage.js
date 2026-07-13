import { getEventsForDate, getMonthDays, toDateKey, formatDate, watchCalendarEvents } from '../services/calendarService.js?v=20260713-11';
import { listenNotices } from '../../database/firestore.js?v=20260708-28';
import { icon } from '../components/icons.js?v=20260713-7';
import { openEventDetails, renderEventDetailsHost } from '../components/EventDetailsModal.js?v=20260713-11';

export function renderCalendar(root, navigate) {
  const today = new Date();
  let current = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = new Date(today);
  let remoteEvents = [];
  let activeNotices = [];

  root.innerHTML = `
    <section class="panel calendar-panel">
      <div class="section-header">
        <div>
          <h1>Calendario</h1>
          <p>Eventos da Mocidade Zuriel.</p>
        </div>
      </div>
      <div data-calendar></div>
    </section>
    ${renderEventDetailsHost()}
  `;

  const calendar = root.querySelector('[data-calendar]');
  const stop = watchCalendarEvents((events) => {
    remoteEvents = events;
    draw();
  });
  const stopNotices = listenNotices((notices) => {
    activeNotices = notices.filter(isNoticeActive);
    draw();
  });
  root.dataset.cleanup = stop ? 'watching' : '';

  function draw() {
    const days = getMonthDays(current.getFullYear(), current.getMonth());
    const selectedEvents = getEventsForDate(selected, remoteEvents);
    const selectedNotices = activeNotices;
    calendar.innerHTML = `
      <div class="calendar-toolbar">
        <button class="plain-button" data-prev>Anterior</button>
        <h2>${current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
        <button class="plain-button" data-next>Proximo</button>
      </div>
      <div class="calendar-weekdays">
        ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => `<span>${day}</span>`).join('')}
      </div>
      <div class="calendar-grid">
        ${days.map((day) => {
          const events = getEventsForDate(day, remoteEvents);
          const notices = getNoticesForDate(day, activeNotices);
          const inMonth = day.getMonth() === current.getMonth();
          const active = toDateKey(day) === toDateKey(selected);
          const totalItems = events.length + notices.length;
          return `
            <button class="calendar-day ${inMonth ? '' : 'muted'} ${active ? 'active' : ''}" data-date="${toDateKey(day)}">
              <strong>${day.getDate()}</strong>
              ${totalItems ? `<span class="${notices.length ? 'has-notice' : ''}">${totalItems}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
      <div class="day-events">
        <h3>${formatDate(selected)}</h3>
        ${selectedEvents.length || selectedNotices.length
          ? `
            ${selectedNotices.map((notice) => {
              const noticeDate = parseDateKey(getNoticeDateKey(notice));
              return `
                <article class="calendar-event calendar-warning-event" style="--event-color:#ff4848">
                  <time>${formatShortDate(noticeDate)}</time>
                  <div>
                    <strong>Aviso: ${escapeHtml(notice.title || 'Aviso')}</strong>
                    <span>${escapeHtml(notice.message || '')}</span>
                    <small>Data: ${formatDate(noticeDate)}</small>
                  </div>
                </article>
              `;
            }).join('')}
            ${selectedEvents.map((event, index) => `
            <article class="calendar-event calendar-event-clickable" role="button" tabindex="0" data-event-details="${index}" style="--event-color:${event.color || '#FFC107'}">
              <time>${event.time || '--:--'}</time>
              <div>
                <strong>${escapeHtml(event.icon || '')} ${escapeHtml(event.title || event.description || 'Evento')}</strong>
                ${!isRehearsal(event) ? `<span>${escapeHtml(event.location || 'Local nao informado')}</span>` : ''}
                ${event.eventType === 'sunday-school' ? `<small><b>Tema:</b> ${escapeHtml(event.lessonTitle || '')}</small>` : ''}
                ${isRehearsal(event) && event.conductor ? `<small><b>Regente:</b> ${escapeHtml(event.conductor)}</small>` : ''}
                ${isRehearsal(event) && event.rehearsalHymn ? `<small><b>Hino:</b> ${escapeHtml(event.rehearsalHymn)}</small>` : ''}
                ${event.notes ? `<small>${escapeHtml(event.notes)}</small>` : ''}
                <small class="event-open-hint">Toque para ver detalhes</small>
                <a class="share-button whatsapp-button" href="${escapeAttr(getEventWhatsAppUrl(event, selected))}" target="_blank" rel="noopener" aria-label="Compartilhar evento no WhatsApp">${icon('whatsapp')}<span>WhatsApp</span></a>
              </div>
            </article>
          `).join('')}
          `
          : '<p class="empty">Nenhum evento para este dia.</p>'}
      </div>
    `;

    calendar.querySelector('[data-prev]').addEventListener('click', () => {
      current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      draw();
    });
    calendar.querySelector('[data-next]').addEventListener('click', () => {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      draw();
    });
    calendar.querySelectorAll('[data-date]').forEach((button) => {
      button.addEventListener('click', () => {
        selected = parseDateKey(button.dataset.date);
        current = new Date(selected.getFullYear(), selected.getMonth(), 1);
        draw();
      });
    });
    calendar.querySelectorAll('[data-event-details]').forEach((card) => {
      const open = () => openEventDetails(root, selectedEvents[Number(card.dataset.eventDetails)], selected, navigate);
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

  draw();
}

function isNoticeActive(notice) {
  if (notice.active === false || notice.active === 'false') return false;
  const today = toDateKey(new Date());
  if (notice.expiresAt && String(notice.expiresAt).slice(0, 10) < today) return false;
  return true;
}

function getNoticesForDate(date, notices) {
  const dateKey = toDateKey(date);
  return notices.filter((notice) => getNoticeDateKey(notice) === dateKey);
}

function getNoticeDateKey(notice) {
  return String(notice.startDate || toDateKey(new Date())).slice(0, 10);
}

function formatShortDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseDateKey(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
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

function getEventWhatsAppUrl(event, date) {
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
