import { BIBLE_BOOKS, getBibleBook, searchBibleWord } from '../services/bibleService.js';

export function renderBible(root) {
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

  async function loadBook(code) {
    reader.innerHTML = '<p class="empty">Carregando...</p>';
    currentBook = await getBibleBook(code);
    chapterSelect.innerHTML = currentBook.chapters.map((chapter) => `<option value="${chapter.number}">${chapter.number}</option>`).join('');
    renderChapter();
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
      <div class="verses">
        ${verses.map((verse) => `
          <div class="verse bible-verse-only">
            <strong class="verse-number">${verse.number}</strong>
            <span>${verse.text}</span>
          </div>
        `).join('')}
      </div>
    `;
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
  loadBook(bookSelect.value);
  results.innerHTML = '<p class="empty">Use a busca por palavra ou navegue por livro, capitulo e versiculo.</p>';
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}
