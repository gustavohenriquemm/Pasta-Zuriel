import { icon } from '../components/icons.js?v=20260708-5';
import { getHymns, watchHymns } from '../services/hymnService.js';

export async function renderHymnal(root, collection, navigate, route = collection) {
  const title = collection === 'harpa' ? 'Hinos da Harpa' : 'Hinos da Mocidade';
  const baseHymns = await getHymns(collection);
  let remoteHymns = [];
  let hymns = mergeHymns(baseHymns, remoteHymns);
  const selectedId = route.includes(':') ? decodeURIComponent(route.split(':').slice(1).join(':')) : '';

  root.innerHTML = `
    <section class="panel hymnal-panel">
      <div class="section-header">
        <div>
          <h1>${title}</h1>
          <p>${selectedId ? 'Letra completa do hino selecionado.' : 'Lista de titulos. Escolha um hino para abrir a letra.'}</p>
        </div>
        ${selectedId ? `<button class="plain-button" data-back-list>Voltar</button>` : ''}
      </div>
      <div data-hymnal-body><p class="empty">Carregando...</p></div>
    </section>
  `;

  const body = root.querySelector('[data-hymnal-body]');

  function renderCurrent() {
    hymns = mergeHymns(baseHymns, remoteHymns);
    const id = location.hash.replace('#', '').split(':').slice(1).join(':') || selectedId;
    id ? renderDetail(id) : renderList();
  }

  const stopWatch = watchHymns(collection, (items) => {
    remoteHymns = items;
    renderCurrent();
  });
  root.dataset.cleanup = stopWatch ? 'watching' : '';

  function renderList() {
    body.innerHTML = `
      <div class="toolbar compact">
        <div class="field">
          <label for="search">Pesquisar</label>
          <input id="search" placeholder="Digite numero ou titulo">
        </div>
      </div>
      <div class="hymn-title-list" data-list></div>
    `;
    const input = body.querySelector('#search');
    const list = body.querySelector('[data-list]');
    const draw = () => {
      const query = normalize(input.value);
      const items = hymns.filter((hymn) => !query || String(hymn.number).includes(query) || normalize(hymn.title).includes(query));
      list.innerHTML = items.length
        ? items.map((hymn) => `
          <button class="hymn-row" data-id="${escapeAttr(hymn.id)}">
            <span><b>${String(hymn.number).padStart(3, '0')}</b> - ${escapeHtml(hymn.title)}</span>
            ${icon('arrow')}
          </button>
        `).join('')
        : '<p class="empty">Nenhum hino encontrado.</p>';
      list.querySelectorAll('[data-id]').forEach((button) => {
        button.addEventListener('click', () => navigate(`${collection}:${button.dataset.id}`));
      });
    };
    input.addEventListener('input', draw);
    draw();
  }

  function renderDetail(id) {
    const selected = hymns.find((hymn) => hymn.id === id) || hymns.find((hymn) => String(hymn.number) === String(id));
    if (!selected) {
      body.innerHTML = '<p class="empty">Hino nao encontrado.</p>';
      return;
    }
    const index = hymns.findIndex((hymn) => hymn.id === selected.id);
    const prev = hymns[index - 1];
    const next = hymns[index + 1];
    body.innerHTML = `
      <article class="hymn-detail">
        <button class="plain-button" data-back-list>Voltar</button>
        <header>
          <span>Hino ${String(selected.number).padStart(3, '0')}</span>
          <h2>${escapeHtml(selected.title)}</h2>
        </header>
        <div class="lyrics">${escapeHtml(selected.lyrics)}</div>
        ${collection === 'mocidade' ? `
          <div class="hymn-share-actions">
            <a class="share-button whatsapp-button" href="${getWhatsAppUrl(selected, collection)}" target="_blank" rel="noopener" aria-label="Enviar link no WhatsApp">
              ${brandIcon('whatsapp')}
              <span>WhatsApp</span>
            </a>
            ${selected.youtubeUrl
              ? `<a class="share-button youtube-button" href="${escapeAttr(normalizeExternalUrl(selected.youtubeUrl))}" target="_blank" rel="noopener" aria-label="Abrir hino no YouTube">
                  ${brandIcon('youtube')}
                  <span>YouTube</span>
                </a>`
              : `<button class="share-button youtube-button" type="button" disabled aria-label="Hino sem link do YouTube">
                  ${brandIcon('youtube')}
                  <span>YouTube</span>
                </button>`}
          </div>
        ` : ''}
        <nav class="detail-nav">
          <button class="plain-button" ${prev ? `data-go="${escapeAttr(prev.id)}"` : 'disabled'}>Anterior</button>
          <button class="primary-button" ${next ? `data-go="${escapeAttr(next.id)}"` : 'disabled'}>Proximo</button>
        </nav>
      </article>
    `;
    body.querySelectorAll('[data-back-list]').forEach((button) => button.addEventListener('click', () => navigate(collection)));
    body.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => navigate(`${collection}:${button.dataset.go}`)));
  }

  root.querySelectorAll('[data-back-list]').forEach((button) => button.addEventListener('click', () => navigate(collection)));
  renderCurrent();
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function mergeHymns(baseHymns, remoteHymns) {
  const byKey = new Map();
  baseHymns.forEach((hymn) => byKey.set(hymn.id || String(hymn.number), hymn));
  remoteHymns.filter(isValidRemoteHymn).forEach((hymn) => {
    const key = hymn.id || `${hymn.category || 'hymn'}-${hymn.number}`;
    const sameNumber = [...byKey.entries()].find(([, item]) => Number(item.number) === Number(hymn.number));
    if (sameNumber) byKey.delete(sameNumber[0]);
    byKey.set(key, hymn);
  });
  return [...byKey.values()].sort((a, b) => Number(a.number) - Number(b.number));
}

function isValidRemoteHymn(hymn) {
  const suffix = String(hymn.id || '').match(/-(\d+)$/)?.[1];
  return !suffix || Number(suffix) === Number(hymn.number);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function getWhatsAppUrl(hymn, collection) {
  const link = getHymnLink(hymn, collection);
  const text = `Hino ${String(hymn.number).padStart(3, '0')} - ${hymn.title}\n${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function getHymnLink(hymn, collection) {
  const route = `#${collection}:${encodeURIComponent(hymn.id || hymn.number)}`;
  return `${location.origin}${location.pathname}${route}`;
}

function normalizeExternalUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function brandIcon(name) {
  if (name === 'youtube') {
    return '<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/></svg>';
  }
  return '<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M20.5 3.5A11.7 11.7 0 0 0 12.1 0 11.9 11.9 0 0 0 1.8 17.8L0 24l6.4-1.7a11.9 11.9 0 0 0 5.7 1.5h.1A11.9 11.9 0 0 0 24 11.9a11.8 11.8 0 0 0-3.5-8.4ZM12.2 21.8h-.1a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 1 1 8.5 4.7Zm5.4-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1a8.1 8.1 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-.3-.2Z"/></svg>';
}
