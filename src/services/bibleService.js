import { getCachedJson } from '../utils/cache.js';

const BIBLE_BASE_URL = 'https://raw.githubusercontent.com/damarals/biblias/main/data/canonical';
const VERSION = 'ARC';

export const BIBLE_BOOKS = [
  ['GEN', 'Genesis'], ['EXO', 'Exodo'], ['LEV', 'Levitico'], ['NUM', 'Numeros'], ['DEU', 'Deuteronomio'],
  ['JOS', 'Josue'], ['JDG', 'Juizes'], ['RUT', 'Rute'], ['1SA', '1 Samuel'], ['2SA', '2 Samuel'],
  ['1KI', '1 Reis'], ['2KI', '2 Reis'], ['1CH', '1 Cronicas'], ['2CH', '2 Cronicas'], ['EZR', 'Esdras'],
  ['NEH', 'Neemias'], ['EST', 'Ester'], ['JOB', 'Jo'], ['PSA', 'Salmos'], ['PRO', 'Proverbios'],
  ['ECC', 'Eclesiastes'], ['SNG', 'Cantares'], ['ISA', 'Isaias'], ['JER', 'Jeremias'], ['LAM', 'Lamentacoes'],
  ['EZK', 'Ezequiel'], ['DAN', 'Daniel'], ['HOS', 'Oseias'], ['JOL', 'Joel'], ['AMO', 'Amos'],
  ['OBA', 'Obadias'], ['JON', 'Jonas'], ['MIC', 'Miqueias'], ['NAM', 'Naum'], ['HAB', 'Habacuque'],
  ['ZEP', 'Sofonias'], ['HAG', 'Ageu'], ['ZEC', 'Zacarias'], ['MAL', 'Malaquias'], ['MAT', 'Mateus'],
  ['MRK', 'Marcos'], ['LUK', 'Lucas'], ['JHN', 'Joao'], ['ACT', 'Atos'], ['ROM', 'Romanos'],
  ['1CO', '1 Corintios'], ['2CO', '2 Corintios'], ['GAL', 'Galatas'], ['EPH', 'Efesios'], ['PHP', 'Filipenses'],
  ['COL', 'Colossenses'], ['1TH', '1 Tessalonicenses'], ['2TH', '2 Tessalonicenses'], ['1TI', '1 Timoteo'], ['2TI', '2 Timoteo'],
  ['TIT', 'Tito'], ['PHM', 'Filemom'], ['HEB', 'Hebreus'], ['JAS', 'Tiago'], ['1PE', '1 Pedro'],
  ['2PE', '2 Pedro'], ['1JN', '1 Joao'], ['2JN', '2 Joao'], ['3JN', '3 Joao'], ['JUD', 'Judas'], ['REV', 'Apocalipse'],
].map(([code, name]) => ({ code, name }));

export async function getBibleBook(code) {
  return getCachedJson(`bible-${VERSION}-${code}`, `${BIBLE_BASE_URL}/${VERSION}/${code}.json`, 1000 * 60 * 60 * 24 * 30);
}

export async function searchBibleWord(query) {
  const normalizedQuery = normalize(query);
  const results = [];
  for (const book of BIBLE_BOOKS) {
    const data = await getBibleBook(book.code);
    for (const chapter of data.chapters) {
      for (const verse of chapter.verses) {
        if (normalize(verse.text).includes(normalizedQuery)) {
          results.push({ bookCode: book.code, bookName: data.name || book.name, chapter: chapter.number, verse: verse.number, text: verse.text });
          if (results.length >= 80) return results;
        }
      }
    }
  }
  return results;
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
