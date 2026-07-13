import { icon } from './icons.js?v=20260713-7';

export function renderEventDetailsHost() {
  return `
    <div class="modal-screen hidden" data-event-details-screen>
      <section class="app-modal event-details-modal" data-event-details-modal></section>
    </div>
  `;
}

export function openEventDetails(root, event, date, navigate) {
  const screen = root.querySelector('[data-event-details-screen]');
  const modal = root.querySelector('[data-event-details-modal]');
  if (!screen || !modal) return;

  const rehearsal = isRehearsal(event);
  const sundaySchool = event.eventType === 'sunday-school';
  const eventDate = date instanceof Date ? date : parseDateKey(event.date);
  modal.innerHTML = `
    <header class="event-detail-header">
      <div>
        <span>${rehearsal ? 'Ensaio da Mocidade' : sundaySchool ? 'Escola Bíblica Dominical' : 'Evento'}</span>
        <h2>${escapeHtml(event.title || event.description || 'Evento')}</h2>
      </div>
      <button class="plain-button" type="button" data-close-event-details>Fechar</button>
    </header>
    <div class="event-detail-list">
      <p><b>Data</b><span>${eventDate.toLocaleDateString('pt-BR')}</span></p>
      <p><b>Horário</b><span>${escapeHtml(event.time || 'Não informado')}</span></p>
      ${!rehearsal ? `<p><b>Local</b><span>${escapeHtml(event.location || 'Não informado')}</span></p>` : ''}
      ${rehearsal ? `<p><b>Regente</b><span>${escapeHtml(event.conductor || 'Não informada')}</span></p>` : ''}
      ${rehearsal ? `<p><b>Hino</b><span>${escapeHtml(event.rehearsalHymn || 'Não informado')}</span></p>` : ''}
      ${sundaySchool ? `<p><b>Lição</b><span>${escapeHtml(event.lessonNumber)}</span></p>` : ''}
      ${sundaySchool ? `<p><b>Tema</b><span>${escapeHtml(event.lessonTitle || 'Não informado')}</span></p>` : ''}
      ${event.notes ? `<p><b>Observações</b><span>${escapeHtml(event.notes)}</span></p>` : ''}
    </div>
    <div class="form-actions event-detail-actions">
      ${rehearsal && event.rehearsalHymnId ? `<button class="primary-button" type="button" data-open-rehearsal-hymn>Abrir hino da Mocidade</button>` : ''}
      ${sundaySchool ? '<button class="primary-button" type="button" data-open-sunday-school-lesson>Abrir lição</button>' : ''}
      <a class="share-button whatsapp-button" href="${escapeAttr(getWhatsAppUrl(event, eventDate))}" target="_blank" rel="noopener" aria-label="Compartilhar evento no WhatsApp">${icon('whatsapp')}<span>WhatsApp</span></a>
    </div>
  `;

  const close = () => {
    screen.classList.add('hidden');
    document.body.classList.remove('modal-open');
  };
  screen.classList.remove('hidden');
  document.body.classList.add('modal-open');
  screen.onclick = (clickEvent) => {
    if (clickEvent.target === screen) close();
  };
  modal.querySelector('[data-close-event-details]').addEventListener('click', close);
  modal.querySelector('[data-open-rehearsal-hymn]')?.addEventListener('click', () => {
    close();
    navigate(`mocidade:${encodeURIComponent(event.rehearsalHymnId)}`);
  });
  modal.querySelector('[data-open-sunday-school-lesson]')?.addEventListener('click', () => {
    close();
    if (event.lessonUrl) window.open(event.lessonUrl, '_blank', 'noopener,noreferrer');
    else navigate('ebd');
  });
}

function isRehearsal(event) {
  return event.eventType === 'rehearsal'
    || normalize(event.title).includes('ensaio');
}

function getWhatsAppUrl(event, date) {
  const rehearsal = isRehearsal(event);
  const lines = [
    `Evento: ${event.title || event.description || 'Evento'}`,
    `Data: ${date.toLocaleDateString('pt-BR')}`,
    `Horário: ${event.time || 'Não informado'}`,
  ];
  if (!rehearsal) lines.push(`Local: ${event.location || 'Não informado'}`);
  if (rehearsal && event.conductor) lines.push(`Regente: ${event.conductor}`);
  if (rehearsal && event.rehearsalHymn) lines.push(`Hino: ${event.rehearsalHymn}`);
  if (event.eventType === 'sunday-school' && event.lessonTitle) lines.push(`Tema: ${event.lessonTitle}`);
  if (event.notes) lines.push(`Observações: ${event.notes}`);
  lines.push(`${location.origin}${location.pathname}#calendar`);
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

function parseDateKey(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}
