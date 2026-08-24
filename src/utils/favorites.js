export function getFavorites(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

export function isFavorite(key, id) {
  return getFavorites(key).some((item) => getFavoriteId(item) === id);
}

export function toggleFavorite(key, favorite) {
  const id = getFavoriteId(favorite);
  const current = getFavorites(key);
  const exists = current.some((item) => getFavoriteId(item) === id);
  const next = exists ? current.filter((item) => getFavoriteId(item) !== id) : [favorite, ...current];
  localStorage.setItem(key, JSON.stringify(next));
  return !exists;
}

export function sortFavoritesFirst(items, key, getId = (item) => item.id) {
  const favorites = new Set(getFavorites(key).map(getFavoriteId));
  return [...items].sort((a, b) => {
    const aFav = favorites.has(getId(a));
    const bFav = favorites.has(getId(b));
    if (aFav !== bFav) return aFav ? -1 : 1;
    return Number(a.number || 0) - Number(b.number || 0);
  });
}

function getFavoriteId(item) {
  return typeof item === 'string' ? item : item?.id;
}
