import { getCachedJson } from '../utils/cache.js';
import { loadPublicHymn, loadPublicHymns } from '../../database/firestore.js?v=20260831-1';
import { MOCIDADE_OFFLINE_HYMNS } from '../data/mocidadeOfflineHymns.js?v=20260926-1';

const HARPA_URL = 'https://raw.githubusercontent.com/DanielLiberato/Harpa-Crista-JSON-640-Hinos-Completa/main/harpa_crista_640_hinos.json';

export async function getHymns(collection) {
  if (collection === 'harpa') {
    const raw = await getCachedJson('harpa-json-640', HARPA_URL, 1000 * 60 * 60 * 24 * 30);
    return Object.entries(raw)
      .filter(([number]) => Number(number) > 0)
      .map(([number, hymn]) => normalizeHarpaHymn(number, hymn));
  }
  const seedHymns = await getCachedJson('mocidade-seed', 'data/hymns/mocidade.seed.json', 1000 * 60 * 30);
  return mergeLocalHymns(seedHymns, MOCIDADE_OFFLINE_HYMNS);
}

export function watchHymns(collection, onChange) {
  return loadPublicHymns(collection, onChange);
}

export async function getHymn(collection, idOrNumber) {
  if (collection === 'harpa') {
    const hymns = await getHymns(collection);
    return hymns.find((hymn) => hymn.id === idOrNumber) || hymns.find((hymn) => String(hymn.number) === String(idOrNumber)) || null;
  }
  const localHymns = await getHymns(collection);
  const localHymn = localHymns.find((hymn) => hymn.id === idOrNumber)
    || localHymns.find((hymn) => String(hymn.number) === String(idOrNumber));
  if (localHymn) return localHymn;
  return loadPublicHymn(collection, idOrNumber);
}

function mergeLocalHymns(seedHymns, offlineHymns) {
  const byNumber = new Map(seedHymns.map((hymn) => [Number(hymn.number), hymn]));
  offlineHymns.forEach((hymn) => byNumber.set(Number(hymn.number), hymn));
  return [...byNumber.values()].sort((a, b) => Number(a.number) - Number(b.number));
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

