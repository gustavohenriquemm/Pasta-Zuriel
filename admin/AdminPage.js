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
} from '../database/firestore.js?v=20260708-30';
import { getHymns } from '../src/services/hymnService.js';

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
      <button class="tab" data-view="calendar">Calendario</button>
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
        <div class="field"><label for="event-title">Descricao</label><input id="event-title" required></div>
        <div class="field"><label for="event-date">Data</label><input id="event-date" type="date"></div>
        <div class="field"><label for="event-time">Horario</label><input id="event-time" type="time" required></div>
        <div class="field"><label for="event-recurrence">Recorrencia</label><select id="event-recurrence"><option value="none">Somente nesta data</option><option value="sundays">Todos os domingos</option></select></div>
        <div class="field"><label for="event-location">Local</label><input id="event-location"></div>
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
      renderHymns();
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
    area.innerHTML = `
      <div class="admin-actions">
        <h2>Calendario</h2>
        <button class="primary-button" data-new-event>Cadastrar Evento</button>
      </div>
      <div class="list admin-list">
        ${state.events.length ? state.events.map((item) => `<button class="list-item" data-edit-event="${item.id}"><strong>${item.time || '--:--'} - ${escapeHtml(item.title || '')}</strong><span>${item.recurrence === 'sundays' ? 'Todos os domingos' : item.date || 'Sem data'}</span></button>`).join('') : '<p class="empty">Nenhum evento cadastrado.</p>'}
      </div>
    `;
    area.querySelector('[data-new-event]').addEventListener('click', () => openEventForm());
    area.querySelectorAll('[data-edit-event]').forEach((button) => button.addEventListener('click', () => openEventForm(state.events.find((item) => item.id === button.dataset.editEvent))));
  }

  function openEventForm(item = null) {
    forms.event.querySelector('[data-event-modal-title]').textContent = item ? 'Editar Evento' : 'Cadastrar Evento';
    setValue(forms.event, '#event-id', item?.id);
    setValue(forms.event, '#event-title', item?.title);
    setValue(forms.event, '#event-date', item?.date);
    setValue(forms.event, '#event-time', item?.time);
    setValue(forms.event, '#event-recurrence', item?.recurrence || 'none');
    setValue(forms.event, '#event-location', item?.location);
    setValue(forms.event, '#event-notes', item?.notes);
    setValue(forms.event, '#event-color', item?.color || '#FFC107');
    openModal(screen, forms, forms.event);
  }

  forms.event.addEventListener('submit', async (event) => {
    event.preventDefault();
    const recurrence = forms.event.querySelector('#event-recurrence').value;
    const date = forms.event.querySelector('#event-date').value;
    if (recurrence === 'none' && !date) {
      showToast('Escolha uma data para o evento.');
      return;
    }
    try {
      await saveCalendarEvent({
        id: forms.event.querySelector('#event-id').value,
        title: forms.event.querySelector('#event-title').value.trim(),
        date,
        time: forms.event.querySelector('#event-time').value,
        recurrence,
        location: forms.event.querySelector('#event-location').value.trim(),
        notes: forms.event.querySelector('#event-notes').value.trim(),
        color: forms.event.querySelector('#event-color').value,
      });
      closeModal(screen, forms);
      showToast('Evento salvo.');
    } catch (error) {
      showToast(error.message || 'Nao foi possivel salvar o evento.');
    }
  });

  forms.event.querySelector('[data-delete-event]').addEventListener('click', () => {
    const id = forms.event.querySelector('#event-id').value;
    if (!id) return;
    confirmDelete(screen, forms, state, 'Excluir este evento?', async () => {
      await deleteCalendarEvent(id);
      showToast('Evento excluido.');
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
      await saveNotice({
        id: forms.notice.querySelector('#notice-id').value,
        title: forms.notice.querySelector('#notice-title').value.trim(),
        message: forms.notice.querySelector('#notice-message').value.trim(),
        active: forms.notice.querySelector('#notice-active').value === 'true',
        startDate: forms.notice.querySelector('#notice-start').value,
        expiresAt: '',
      });
      closeModal(screen, forms);
      showToast('Aviso salvo.');
    } catch (error) {
      showToast(error.message || 'Nao foi possivel salvar o aviso.');
    }
  });

  forms.notice.querySelector('[data-delete-notice]').addEventListener('click', () => {
    const id = forms.notice.querySelector('#notice-id').value;
    if (!id) return;
    confirmDelete(screen, forms, state, 'Excluir este aviso?', async () => {
      await deleteNotice(id);
      showToast('Aviso excluido.');
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
