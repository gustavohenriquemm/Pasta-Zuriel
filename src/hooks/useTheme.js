const THEME_KEY = 'theme';

export function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const fallback = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = stored || fallback;
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
}
