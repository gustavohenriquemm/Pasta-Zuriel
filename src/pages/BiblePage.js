import { BIBLE_BOOKS, getBibleBook, searchBibleWord } from '../services/bibleService.js';
import { getFavorites, isFavorite, toggleFavorite } from '../utils/favorites.js?v=20260824-5';

const BIBLE_FAVORITES_KEY = 'favorites:bible';

export function renderBible(root, navigate, route = 'bible') {
  root.innerHTML = `
    <section class="panel">
      <div class="section-header">
        <div>
          <h1>Biblia ARC</h1>
          <p>Livros, capitulos, versiculos e pesquisa.</p>
        </div>
      </div>
      <div class="toolbar">
        <div class="field">
          <label for="word">Pesquisar palavra</label>
          <input id="word" placeholder="Ex.: graca, amor, fe">
        </div>
        <div class="field">
          <label for="book">Livro</label>
          <select id="book"></select>
        </div>
        <div class="field">
          <label for="chapter">Capitulo</label>
          <select id="chapter"></select>
        </div>
        <div class="field">
          <label for="verse">Versiculo</label>
          <select id="verse"></select>
        </div>
      </div>
      <div class="content-grid">
        <aside class="list" data-results></aside>
        <article class="reader" data-reader></article>
      </div>
    </section>
  `;

  const bookSelect = root.querySelector('#book');
  const chapterSelect = root.querySelector('#chapter');
  const verseSelect = root.querySelector('#verse');
  const wordInput = root.querySelector('#word');
  const results = root.querySelector('[data-results]');
  const reader = root.querySelector('[data-reader]');
  let currentBook;

  bookSelect.innerHTML = BIBLE_BOOKS.map((book) => `<option value="${book.code}">${book.name}</option>`).join('');

  async function loadBook(code, chapterNumber = 1, verseNumber = 0) {
    reader.innerHTML = '<p class="empty">Carregando...</p>';
    currentBook = await getBibleBook(code);
    chapterSelect.innerHTML = currentBook.chapters.map((chapter) => `<option value="${chapter.number}">${chapter.number}</option>`).join('');
    chapterSelect.value = String(chapterNumber);
    renderChapter();
    verseSelect.value = String(verseNumber);
    renderVerses();
  }

  function renderChapter() {
    const chapter = currentBook.chapters.find((item) => item.number === Number(chapterSelect.value)) || currentBook.chapters[0];
    verseSelect.innerHTML = '<option value="0">Todos</option>' + chapter.verses.map((verse) => `<option value="${verse.number}">${verse.number}</option>`).join('');
    renderVerses();
  }

  function renderVerses() {
    const chapter = currentBook.chapters.find((item) => item.number === Number(chapterSelect.value)) || currentBook.chapters[0];
    const selectedVerse = Number(verseSelect.value);
    const verses = selectedVerse ? chapter.verses.filter((verse) => verse.number === selectedVerse) : chapter.verses;
    reader.innerHTML = `
      <h2>${currentBook.name} ${chapter.number}</h2>
      ${renderFavoriteVerses()}
      <div class="verses">
        ${verses.map((verse) => `
          <div class="verse bible-verse-only">
            <strong class="verse-number">${verse.number}</strong>
            <span>${verse.text}</span>
            <button class="favorite-verse-button ${isFavorite(BIBLE_FAVORITES_KEY, getVerseId(currentBook.code || bookSelect.value, chapter.number, verse.number)) ? 'active' : ''}" type="button" data-favorite-verse="${getVerseId(currentBook.code || bookSelect.value, chapter.number, verse.number)}" aria-label="${isFavorite(BIBLE_FAVORITES_KEY, getVerseId(currentBook.code || bookSelect.value, chapter.number, verse.number)) ? 'Remover versículo dos favoritos' : 'Favoritar versículo'}">
              ${isFavorite(BIBLE_FAVORITES_KEY, getVerseId(currentBook.code || bookSelect.value, chapter.number, verse.number)) ? '★' : '☆'}
            </button>
          </div>
        `).join('')}
      </div>
    `;
    reader.querySelectorAll('[data-favorite-verse]').forEach((button) => {
      button.addEventListener('click', () => {
        const verse = verses.find((item) => getVerseId(currentBook.code || bookSelect.value, chapter.number, item.number) === button.dataset.favoriteVerse);
        if (!verse) return;
        toggleFavorite(BIBLE_FAVORITES_KEY, {
          id: button.dataset.favoriteVerse,
          bookCode: currentBook.code || bookSelect.value,
          bookName: currentBook.name,
          chapter: chapter.number,
          verse: verse.number,
          text: verse.text,
        });
        renderVerses();
      });
    });
    reader.querySelectorAll('[data-open-favorite-verse]').forEach((button) => {
      button.addEventListener('click', async () => {
        const favorite = getFavorites(BIBLE_FAVORITES_KEY).find((item) => item.id === button.dataset.openFavoriteVerse);
        if (!favorite) return;
        bookSelect.value = favorite.bookCode;
        await loadBook(favorite.bookCode, favorite.chapter, favorite.verse);
      });
    });
  }

  async function doSearch() {
    const query = wordInput.value.trim();
    if (query.length < 3) {
      results.innerHTML = '<p class="empty">Digite ao menos 3 letras para pesquisar em toda a Biblia.</p>';
      return;
    }
    results.innerHTML = '<p class="empty">Pesquisando...</p>';
    const found = await searchBibleWord(query);
    results.innerHTML = found.length
      ? found.map((item) => `<button class="list-item" data-ref="${item.bookCode}|${item.chapter}|${item.verse}"><strong>${item.bookName} ${item.chapter}:${item.verse}</strong><span>${item.text}</span></button>`).join('')
      : '<p class="empty">Nenhum versiculo encontrado.</p>';
    results.querySelectorAll('[data-ref]').forEach((button) => {
      button.addEventListener('click', async () => {
        const [bookCode, chapter, verse] = button.dataset.ref.split('|');
        bookSelect.value = bookCode;
        await loadBook(bookCode);
        chapterSelect.value = chapter;
        renderChapter();
        verseSelect.value = verse;
        renderVerses();
      });
    });
  }

  bookSelect.addEventListener('change', () => loadBook(bookSelect.value));
  chapterSelect.addEventListener('change', renderChapter);
  verseSelect.addEventListener('change', renderVerses);
  wordInput.addEventListener('input', debounce(doSearch, 350));
  const routedReference = getRouteReference(route);
  if (routedReference) {
    bookSelect.value = routedReference.bookCode;
    loadBook(routedReference.bookCode, routedReference.chapter, routedReference.verse);
  } else {
    loadBook(bookSelect.value);
  }
  results.innerHTML = '<p class="empty">Use a busca por palavra ou navegue por livro, capitulo e versiculo.</p>';
}

function renderFavoriteVerses() {
  const favorites = getFavorites(BIBLE_FAVORITES_KEY);
  if (!favorites.length) return '';
  return `
    <section class="favorite-verses-panel" aria-label="Versículos favoritos">
      <h3>Versículos favoritos</h3>
      <div>
        ${favorites.map((favorite) => `
          <button type="button" data-open-favorite-verse="${escapeAttr(favorite.id)}">
            <strong>${escapeHtml(favorite.bookName)} ${favorite.chapter}:${favorite.verse}</strong>
            <span>${escapeHtml(favorite.text)}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function getVerseId(bookCode, chapter, verse) {
  return `${bookCode}-${chapter}-${verse}`;
}

function getRouteReference(route) {
  const [, bookCode, chapter, verse] = String(route || '').split(':');
  if (!bookCode || !chapter) return null;
  return {
    bookCode,
    chapter: Number(chapter),
    verse: Number(verse || 0),
  };
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}
