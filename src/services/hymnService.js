import { getCachedJson } from '../utils/cache.js';
import { listenHymns } from '../../database/firestore.js';

const HARPA_URL = 'https://raw.githubusercontent.com/DanielLiberato/Harpa-Crista-JSON-640-Hinos-Completa/main/harpa_crista_640_hinos.json';

export async function getHymns(collection) {
  if (collection === 'harpa') {
    const raw = await getCachedJson('harpa-json-640', HARPA_URL, 1000 * 60 * 60 * 24 * 30);
    return Object.entries(raw)
      .filter(([number]) => Number(number) > 0)
      .map(([number, hymn]) => normalizeHarpaHymn(number, hymn));
  }
  return getCachedJson('mocidade-seed', 'data/hymns/mocidade.seed.json', 1000 * 60 * 30);
}

export function watchHymns(collection, onChange) {
  return listenHymns(collection, onChange);
}

function normalizeHarpaHymn(number, hymn) {
  const title = String(hymn.hino || '').replace(/^\d+\s*-\s*/, '').trim();
  const verses = Object.values(hymn.verses || {}).map(htmlToText).filter(Boolean);
  const chorus = htmlToText(hymn.coro);
  const lyrics = verses
    .flatMap((verse) => chorus ? [verse, `Coro:\n${chorus}`] : [verse])
    .join('\n\n');
  return {
    id: `harpa-${number}`,
    number: Number(number),
    title,
    lyrics,
    category: 'harpa',
  };
}

function htmlToText(value) {
  const div = document.createElement('div');
  div.innerHTML = String(value || '').replace(/<br\s*\/?>/gi, '\n');
  return div.textContent.split('\n').map((line) => line.trim()).filter(Boolean).join('\n');
}
