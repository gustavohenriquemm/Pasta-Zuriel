import {
  deleteCalendarEvent,
  deleteHymn,
  deleteNotice,
  listenAuth,
  listenCalendarEvents,
  listenHymns,
  listenNotices,
  saveCalendarEvent,
  saveHymn,
  saveNotice,
  signInAdmin,
  signOutAdmin,
} from '../database/firestore.js?v=20260713-33';
import { getHymns } from '../src/services/hymnService.js';

const DEFAULT_REHEARSAL = {
  id: 'recurring-youth-rehearsal',
  title: 'Ensaio da Mocidade',
  date: '',
  time: '11:00',
  recurrence: 'sundays',
  location: '',
  eventType: 'rehearsal',
  conductor: '',
  rehearsalHymn: '',
  notes: '',
  color: '#FFC107',
  isDefaultTemplate: true,
};

export function renderAdmin(root) {
  root.innerHTML = `
    <section class="panel">
      <div class="section-header">
        <div>
          <h1>Painel administrativo</h1>
          <p>Acesso exclusivo para regentes cadastrados no Firebase.</p>
        </div>
      </div>
      <div data-admin-content>
        <div class="login-box">
          <form data-login>
            <div class="field">
              <label for="email">E-mail</label>
              <input id="email" type="email" autocomplete="email" required>
            </div>
            <div class="field">
              <label for="password">Senha</label>
              <input id="password" type="password" autocomplete="current-password" required>
            </div>
            <div class="form-actions">
              <button class="primary-button" type="submit">Entrar</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  const content = root.querySelector('[data-admin-content]');
  root.querySelector('[data-login]').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await signInAdmin(root.querySelector('#email').value, root.querySelector('#password').value);
      showToast('Login realizado.');
    } catch (error) {
      showToast(error.message);
    }
  });

  listenAuth((user) => {
    if (user) renderEditor(content, user);
  });
}

function renderEditor(content, user) {
  content.innerHTML = `
    <div class="tabs">
      <button class="tab active" data-view="hymns" data-collection="mocidade">Mocidade</button>
      <button class="tab" data-view="calendar">Calendário / Ensaios</button>
      <button class="tab" data-view="notices">Avisos <span data-active-count></span></button>
      <button class="plain-button" data-logout>Sair</button>
    </div>
    <div class="status-note">Conectado como ${escapeHtml(user.email)}.</div>
    <div data-admin-area></div>
    <div class="modal-screen hidden" data-modal-screen>
      <form class="app-modal hidden" data-hymn-form>
        <h2 data-hymn-modal-title>Cadastrar Hino</h2>
        <input type="hidden" id="hymn-id">
        <div class="field"><label for="hymn-number">Numero</label><input id="hymn-number" type="number" min="1" required></div>
        <div class="field"><label for="hymn-title">Titulo</label><input id="hymn-title" required></div>
        <div class="field"><label for="hymn-youtube">Link do YouTube (opcional)</label><input id="hymn-youtube" placeholder="Cole o link do YouTube"></div>
        <div class="field"><label for="hymn-lyrics">Letra</label><textarea id="hymn-lyrics" required></textarea></div>
        <div class="form-actions">
          <button class="primary-button" type="submit">Salvar</button>
          <button class="danger-button" type="button" data-delete-hymn>Excluir</button>
          <button class="plain-button" type="button" data-close-modal>Cancelar</button>
        </div>
      </form>
      <form class="app-modal hidden" data-event-form>
        <h2 data-event-modal-title>Cadastrar Evento</h2>
        <input type="hidden" id="event-id">
        <div class="field"><label for="event-type">Tipo de evento</label><select id="event-type"><option value="general">Evento geral</option><option value="rehearsal">Ensaio da Mocidade</option></select></div>
        <div class="field"><label for="event-title">Descricao</label><input id="event-title" required></div>
        <div class="field"><label for="event-date">Data</label><input id="event-date" type="date"></div>
        <div class="field"><label for="event-time">Horario</label><input id="event-time" type="time" required></div>
        <div class="field"><label for="event-recurrence">Recorrencia</label><select id="event-recurrence"><option value="none">Somente nesta data</option><option value="sundays">Todos os domingos</option></select></div>
        <div class="field" data-general-only><label for="event-location">Local</label><input id="event-location"></div>
        <div class="field hidden" data-rehearsal-only><label for="event-conductor">Quem vai reger?</label><select id="event-conductor"><option value="">Selecione a regente</option><option value="Yasmin">Yasmin</option><option value="Bia">Bia</option><option value="Renata">Renata</option></select></div>
        <div class="field hidden hymn-search-field" data-rehearsal-only>
          <label for="event-hymn-search">Hino que será ensaiado</label>
          <input id="event-hymn-search" autocomplete="off" placeholder="Digite o número ou nome do hino">
          <input id="event-hymn-id" type="hidden">
          <div class="hymn-search-results hidden" data-hymn-search-results></div>
          <small>Digite e selecione um hino da lista.</small>
        </div>
        <div class="field"><label for="event-notes">Observacoes</label><textarea id="event-notes"></textarea></div>
        <div class="field"><label for="event-color">Cor do evento</label><input id="event-color" type="color" value="#FFC107"></div>
        <div class="form-actions">
          <button class="primary-button" type="submit">Salvar evento</button>
          <button class="danger-button" type="button" data-delete-event>Excluir</button>
          <button class="plain-button" type="button" data-close-modal>Cancelar</button>
        </div>
      </form>
      <form class="app-modal hidden" data-notice-form>
        <h2 data-notice-modal-title>Cadastrar Aviso</h2>
        <input type="hidden" id="notice-id">
        <div class="field"><label for="notice-title">Titulo</label><input id="notice-title" required></div>
        <div class="field"><label for="notice-message">Mensagem</label><textarea id="notice-message" required></textarea></div>
        <div class="field"><label for="notice-active">Ativo</label><select id="notice-active"><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
        <div class="field"><label for="notice-start">Data do aviso</label><input id="notice-start" type="date"></div>
        <div class="form-actions">
          <button class="primary-button" type="submit">Salvar aviso</button>
          <button class="danger-button" type="button" data-delete-notice>Excluir</button>
          <button class="plain-button" type="button" data-close-modal>Cancelar</button>
        </div>
      </form>
      <section class="app-modal confirm-modal hidden" data-confirm-modal>
        <h2>Confirmar exclusao</h2>
        <p data-confirm-text>Deseja excluir este item?</p>
        <div class="form-actions">
          <button class="danger-button" type="button" data-confirm-yes>Excluir</button>
          <button class="plain-button" type="button" data-close-modal>Cancelar</button>
        </div>
      </section>
    </div>
  `;

  const state = { collection: 'mocidade', hymns: [], baseHymns: [], events: [], notices: [], selected: null, confirmAction: null };
  const area = content.querySelector('[data-admin-area]');
  const screen = content.querySelector('[data-modal-screen]');
  const forms = {
    hymn: content.querySelector('[data-hymn-form]'),
    event: content.querySelector('[data-event-form]'),
    notice: content.querySelector('[data-notice-form]'),
    confirm: content.querySelector('[data-confirm-modal]'),
  };
  let rehearsalHymnOptions = [];

  content.querySelector('[data-logout]').addEventListener('click', () => signOutAdmin().then(() => location.reload()));
  content.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => closeModal(screen, forms)));
  content.querySelector('[data-confirm-yes]').addEventListener('click', async () => {
    if (state.confirmAction) await state.confirmAction();
    closeModal(screen, forms);
  });

  content.querySelectorAll('[data-view]').forEach((tab) => {
    tab.addEventListener('click', () => {
      content.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.view === 'hymns') loadHymns(tab.dataset.collection);
      if (tab.dataset.view === 'calendar') renderEvents();
      if (tab.dataset.view === 'notices') renderNotices();
    });
  });

  listenCalendarEvents((items) => {
    state.events = items;
    if (content.querySelector('[data-view="calendar"]').classList.contains('active')) renderEvents();
  });
  listenNotices((items) => {
    state.notices = items;
    content.querySelector('[data-active-count]').textContent = `(${items.filter(isNoticeActive).length})`;
    if (content.querySelector('[data-view="notices"]').classList.contains('active')) renderNotices();
  });

  async function loadHymns(collection) {
    state.collection = collection;
    state.baseHymns = await getHymns(collection);
    listenHymns(collection, (items) => {
      state.hymns = items;
      if (content.querySelector('[data-view="hymns"]').classList.contains('active')) renderHymns();
    });
    renderHymns();
  }

  function renderHymns() {
    const merged = mergeByNumber(state.baseHymns, state.hymns.filter(isValidRemoteHymn));
    area.innerHTML = `
      <div class="admin-actions">
        <h2>${state.collection === 'harpa' ? 'Hinos da Harpa' : 'Hinos da Mocidade'}</h2>
        <button class="primary-button" data-new-hymn>Cadastrar Hino</button>
      </div>
      <div class="list admin-list">
        ${merged.map((hymn) => `<button class="list-item" data-edit-hymn="${escapeAttr(hymn.id)}"><strong>${hymn.number}. ${escapeHtml(hymn.title)}</strong></button>`).join('')}
      </div>
    `;
    area.querySelector('[data-new-hymn]').addEventListener('click', () => openHymnForm());
    area.querySelectorAll('[data-edit-hymn]').forEach((button) => {
      button.addEventListener('click', () => openHymnForm(merged.find((hymn) => hymn.id === button.dataset.editHymn)));
    });
  }

  function openHymnForm(hymn = null) {
    forms.hymn.querySelector('[data-hymn-modal-title]').textContent = hymn ? 'Editar Hino' : 'Cadastrar Hino';
    forms.hymn.querySelector('#hymn-id').value = hymn?.id || '';
    forms.hymn.querySelector('#hymn-number').value = hymn?.number || '';
    forms.hymn.querySelector('#hymn-title').value = hymn?.title || '';
    forms.hymn.querySelector('#hymn-youtube').value = hymn?.youtubeUrl || '';
    forms.hymn.querySelector('#hymn-lyrics').value = hymn?.lyrics || '';
    openModal(screen, forms, forms.hymn);
  }

  forms.hymn.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = forms.hymn.querySelector('#hymn-id').value;
    const number = Number(forms.hymn.querySelector('#hymn-number').value);
    const allHymns = mergeByNumber(state.baseHymns, state.hymns.filter(isValidRemoteHymn));
    const duplicate = allHymns.find((hymn) => Number(hymn.number) === number && hymn.id !== id);
    if (duplicate) {
      showToast(`O hino nº ${number} ja existe. O proximo numero disponivel e ${getNextNumber(allHymns)}.`);
      return;
    }
    try {
      await saveHymn(state.collection, {
        id: id || `${state.collection}-${number}`,
        number,
        title: forms.hymn.querySelector('#hymn-title').value.trim(),
        youtubeUrl: normalizeExternalUrl(forms.hymn.querySelector('#hymn-youtube').value),
        lyrics: forms.hymn.querySelector('#hymn-lyrics').value.trim(),
        category: state.collection,
      });
      closeModal(screen, forms);
      showToast('Hino salvo.');
    } catch (error) {
      showToast(error.message || 'Nao foi possivel salvar o hino.');
    }
  });

  forms.hymn.querySelector('[data-delete-hymn]').addEventListener('click', () => {
    const id = forms.hymn.querySelector('#hymn-id').value;
    if (!id) return;
    confirmDelete(screen, forms, state, 'Excluir este hino?', async () => {
      await deleteHymn(state.collection, id);
      showToast('Hino excluido.');
    });
  });

  function renderEvents() {
    const adminEvents = getAdminEvents(state.events);
    area.innerHTML = `
      <div class="admin-actions">
        <h2>Calendário e ensaios</h2>
        <button class="primary-button" data-new-event>Cadastrar Evento</button>
      </div>
      <div class="list admin-list">
        ${adminEvents.map((item) => `<button class="list-item ${isRehearsal(item) ? 'admin-rehearsal-item' : ''}" data-edit-event="${item.id}"><strong>${item.time || '--:--'} - ${escapeHtml(item.title || '')}</strong><span>${item.recurrence === 'sundays' ? 'Todos os domingos' : item.date || 'Sem data'}${isRehearsal(item) ? ` · Regente: ${escapeHtml(item.conductor || 'Não informada')} · Hino: ${escapeHtml(item.rehearsalHymn || 'Não informado')}` : ''}</span>${item.isDefaultTemplate ? '<em>Clique para adicionar a regente e o hino</em>' : ''}</button>`).join('')}
      </div>
    `;
    area.querySelector('[data-new-event]').addEventListener('click', () => openEventForm());
    area.querySelectorAll('[data-edit-event]').forEach((button) => button.addEventListener('click', () => openEventForm(adminEvents.find((item) => item.id === button.dataset.editEvent))));
  }

  function openEventForm(item = null) {
    forms.event.querySelector('[data-event-modal-title]').textContent = item ? 'Editar Evento' : 'Cadastrar Evento';
    setValue(forms.event, '#event-id', item?.id);
    setValue(forms.event, '#event-type', isRehearsal(item) ? 'rehearsal' : 'general');
    setValue(forms.event, '#event-title', item?.title);
    setValue(forms.event, '#event-date', item?.date);
    setValue(forms.event, '#event-time', item?.time);
    setValue(forms.event, '#event-recurrence', item?.recurrence || 'none');
    setValue(forms.event, '#event-location', item?.location);
    setValue(forms.event, '#event-conductor', item?.conductor);
    populateRehearsalHymns(item?.rehearsalHymnId, item?.rehearsalHymn);
    setValue(forms.event, '#event-notes', item?.notes);
    setValue(forms.event, '#event-color', item?.color || '#FFC107');
    toggleRehearsalFields();
    openModal(screen, forms, forms.event);
  }

  function toggleRehearsalFields() {
    const rehearsal = forms.event.querySelector('#event-type').value === 'rehearsal';
    forms.event.querySelectorAll('[data-rehearsal-only]').forEach((field) => field.classList.toggle('hidden', !rehearsal));
    forms.event.querySelectorAll('[data-general-only]').forEach((field) => field.classList.toggle('hidden', rehearsal));
    forms.event.querySelector('#event-conductor').required = rehearsal;
    forms.event.querySelector('#event-hymn-search').required = rehearsal;
    if (rehearsal && !forms.event.querySelector('#event-title').value.trim()) {
      forms.event.querySelector('#event-title').value = 'Ensaio da Mocidade';
    }
  }

  forms.event.querySelector('#event-type').addEventListener('change', toggleRehearsalFields);

  function populateRehearsalHymns(selectedId = '', legacyTitle = '') {
    const hymns = mergeByNumber(state.baseHymns, state.hymns.filter(isValidRemoteHymn));
    rehearsalHymnOptions = hymns.map((hymn) => ({
      id: hymn.id,
      label: `${String(hymn.number).padStart(3, '0')} - ${hymn.title}`,
      search: normalizeText(`${hymn.number} ${hymn.title}`),
    }));
    const legacyMatch = !selectedId && legacyTitle
      ? hymns.find((hymn) => normalizeText(legacyTitle).includes(normalizeText(hymn.title)))
      : null;
    const selected = rehearsalHymnOptions.find((hymn) => hymn.id === (selectedId || legacyMatch?.id));
    forms.event.querySelector('#event-hymn-id').value = selected?.id || '';
    forms.event.querySelector('#event-hymn-search').value = selected?.label || '';
    forms.event.querySelector('[data-hymn-search-results]').classList.add('hidden');
  }

  function renderHymnSearchResults(query) {
    const results = forms.event.querySelector('[data-hymn-search-results]');
    const normalizedQuery = normalizeText(query);
    const matches = rehearsalHymnOptions
      .filter((hymn) => !normalizedQuery || hymn.search.includes(normalizedQuery))
      .slice(0, 10);
    results.innerHTML = matches.length
      ? matches.map((hymn) => `<button type="button" data-select-rehearsal-hymn="${escapeAttr(hymn.id)}"><strong>${escapeHtml(hymn.label)}</strong></button>`).join('')
      : '<p class="hymn-search-empty">Hino não encontrado. Caso o hino não apareça, adicione-o primeiro na área Hinos da Mocidade para ser mostrado aqui.</p>';
    results.classList.remove('hidden');
  }

  const hymnSearch = forms.event.querySelector('#event-hymn-search');
  hymnSearch.addEventListener('focus', () => renderHymnSearchResults(hymnSearch.value));
  hymnSearch.addEventListener('input', () => {
    forms.event.querySelector('#event-hymn-id').value = '';
    renderHymnSearchResults(hymnSearch.value);
  });
  forms.event.querySelector('[data-hymn-search-results]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-select-rehearsal-hymn]');
    if (!button) return;
    const selected = rehearsalHymnOptions.find((hymn) => hymn.id === button.dataset.selectRehearsalHymn);
    if (!selected) return;
    forms.event.querySelector('#event-hymn-id').value = selected.id;
    hymnSearch.value = selected.label;
    forms.event.querySelector('[data-hymn-search-results]').classList.add('hidden');
  });

  forms.event.addEventListener('submit', async (event) => {
    event.preventDefault();
    const recurrence = forms.event.querySelector('#event-recurrence').value;
    const date = forms.event.querySelector('#event-date').value;
    const eventType = forms.event.querySelector('#event-type').value;
    const selectedHymnId = forms.event.querySelector('#event-hymn-id').value;
    const selectedHymn = rehearsalHymnOptions.find((hymn) => hymn.id === selectedHymnId);
    if (recurrence === 'none' && !date) {
      showToast('Escolha uma data para o evento.');
      return;
    }
    if (eventType === 'rehearsal' && !selectedHymn) {
      showToast('Selecione um hino da lista. Se ele não aparecer, adicione-o primeiro na área Hinos da Mocidade.');
      return;
    }
    try {
      const result = await saveCalendarEvent({
        id: forms.event.querySelector('#event-id').value,
        title: forms.event.querySelector('#event-title').value.trim(),
        date,
        time: forms.event.querySelector('#event-time').value,
        recurrence,
        location: eventType === 'rehearsal' ? '' : forms.event.querySelector('#event-location').value.trim(),
        eventType,
        conductor: eventType === 'rehearsal' ? forms.event.querySelector('#event-conductor').value : '',
        rehearsalHymnId: eventType === 'rehearsal' ? selectedHymn.id : '',
        rehearsalHymn: eventType === 'rehearsal' ? selectedHymn.label : '',
        notes: forms.event.querySelector('#event-notes').value.trim(),
        color: forms.event.querySelector('#event-color').value,
      });
      closeModal(screen, forms);
      showToast(result?.notificationSent === false
        ? 'Evento salvo, mas a notificação não foi enviada. Verifique a configuração da Vercel.'
        : 'Evento salvo e notificação enviada.');
    } catch (error) {
      showToast(error.message || 'Nao foi possivel salvar o evento.');
    }
  });

  forms.event.querySelector('[data-delete-event]').addEventListener('click', () => {
    const id = forms.event.querySelector('#event-id').value;
    if (!id) return;
    confirmDelete(screen, forms, state, 'Excluir este evento?', async () => {
      const result = await deleteCalendarEvent(id);
      showToast(result?.notificationSent === false
        ? 'Evento excluído, mas a notificação não foi enviada.'
        : 'Evento excluído e notificação enviada.');
    });
  });

  function renderNotices() {
    area.innerHTML = `
      <div class="admin-actions">
        <h2>Avisos ativos: ${state.notices.filter(isNoticeActive).length}</h2>
        <button class="primary-button" data-new-notice>Cadastrar Aviso</button>
      </div>
      <div class="list admin-list">
        ${state.notices.length ? state.notices.map((item) => `<button class="list-item" data-edit-notice="${item.id}"><strong>${escapeHtml(item.title || 'Aviso')}</strong><span>${item.active === false ? 'Inativo' : 'Ativo'}</span></button>`).join('') : '<p class="empty">Nenhum aviso cadastrado.</p>'}
      </div>
    `;
    area.querySelector('[data-new-notice]').addEventListener('click', () => openNoticeForm());
    area.querySelectorAll('[data-edit-notice]').forEach((button) => button.addEventListener('click', () => openNoticeForm(state.notices.find((item) => item.id === button.dataset.editNotice))));
  }

  function openNoticeForm(item = null) {
    forms.notice.querySelector('[data-notice-modal-title]').textContent = item ? 'Editar Aviso' : 'Cadastrar Aviso';
    setValue(forms.notice, '#notice-id', item?.id);
    setValue(forms.notice, '#notice-title', item?.title);
    setValue(forms.notice, '#notice-message', item?.message);
    setValue(forms.notice, '#notice-active', String(item?.active !== false));
    setValue(forms.notice, '#notice-start', item?.startDate || getLocalDateKey());
    openModal(screen, forms, forms.notice);
  }

  forms.notice.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await saveNotice({
        id: forms.notice.querySelector('#notice-id').value,
        title: forms.notice.querySelector('#notice-title').value.trim(),
        message: forms.notice.querySelector('#notice-message').value.trim(),
        active: forms.notice.querySelector('#notice-active').value === 'true',
        startDate: forms.notice.querySelector('#notice-start').value,
        expiresAt: '',
      });
      closeModal(screen, forms);
      showToast(result?.notificationSent === false
        ? 'Aviso salvo, mas a notificação não foi enviada. Verifique a configuração da Vercel.'
        : result?.notificationSent === true
          ? 'Aviso salvo e notificação enviada.'
          : 'Aviso salvo.');
    } catch (error) {
      showToast(error.message || 'Nao foi possivel salvar o aviso.');
    }
  });

  forms.notice.querySelector('[data-delete-notice]').addEventListener('click', () => {
    const id = forms.notice.querySelector('#notice-id').value;
    if (!id) return;
    confirmDelete(screen, forms, state, 'Excluir este aviso?', async () => {
      const result = await deleteNotice(id);
      showToast(result?.notificationSent === false
        ? 'Aviso excluído, mas a notificação não foi enviada.'
        : 'Aviso excluído e notificação enviada.');
    });
  });

  loadHymns('mocidade');
}

function openModal(screen, forms, active) {
  Object.values(forms).forEach((form) => form.classList.add('hidden'));
  active.classList.remove('hidden');
  screen.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeModal(screen, forms) {
  Object.values(forms).forEach((form) => form.classList.add('hidden'));
  screen.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function confirmDelete(screen, forms, state, text, action) {
  state.confirmAction = action;
  forms.confirm.querySelector('[data-confirm-text]').textContent = text;
  openModal(screen, forms, forms.confirm);
}

function setValue(form, selector, value = '') {
  form.querySelector(selector).value = value || '';
}

function mergeByNumber(base, remote) {
  const map = new Map();
  base.forEach((item) => map.set(Number(item.number), item));
  remote.forEach((item) => map.set(Number(item.number), item));
  return [...map.values()].sort((a, b) => Number(a.number) - Number(b.number));
}

function isValidRemoteHymn(hymn) {
  const suffix = String(hymn.id || '').match(/-(\d+)$/)?.[1];
  return !suffix || Number(suffix) === Number(hymn.number);
}

function isRehearsal(event) {
  if (!event) return false;
  return event.eventType === 'rehearsal' || normalizeText(event.title).includes('ensaio');
}

function getAdminEvents(events) {
  const savedDefault = events.find((event) => event.id === DEFAULT_REHEARSAL.id);
  const defaultRehearsal = savedDefault || DEFAULT_REHEARSAL;
  return [defaultRehearsal, ...events.filter((event) => event.id !== DEFAULT_REHEARSAL.id)];
}

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getNextNumber(items) {
  const used = new Set(items.map((item) => Number(item.number)));
  let next = 1;
  while (used.has(next)) next += 1;
  return next;
}

function isNoticeActive(notice) {
  if (notice.active === false || notice.active === 'false') return false;
  const today = getLocalDateKey();
  if (notice.expiresAt && notice.expiresAt < today) return false;
  return true;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

function normalizeExternalUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
