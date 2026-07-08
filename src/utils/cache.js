export async function getCachedJson(key, url, ttlMs) {
  const cached = readCache(key);
  if (cached && Date.now() - cached.createdAt < ttlMs) return cached.data;

  const response = await fetch(url);
  if (!response.ok) {
    if (cached) return cached.data;
    throw new Error(`Nao foi possivel carregar ${url}`);
  }
  const data = await response.json();
  writeCache(key, data);
  return data;
}

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(`cache:${key}`));
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(`cache:${key}`, JSON.stringify({ createdAt: Date.now(), data }));
  } catch {
    // Local storage pode estar cheio; o app continua usando a rede.
  }
}
