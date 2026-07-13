import { icon } from '../components/icons.js?v=20260713-8';
import { SUNDAY_SCHOOL_LESSONS as lessons } from '../data/sundaySchoolLessons.js?v=20260713-12';

const NOTE_KEY_PREFIX = 'ebd:2026:3-trimestre:licao:';

export function renderSundaySchool(root) {
  root.innerHTML = `
    <section class="panel sunday-school-panel fade-in">
      <div class="section-header sunday-school-header">
        <div>
          <span class="section-kicker">3º trimestre de 2026</span>
          <h1>Escola Bíblica Dominical</h1>
          <p>Livros Poéticos — acesse as lições que já foram publicadas.</p>
        </div>
      </div>
      <p class="private-notes-message">Suas anotações ficam salvas somente neste aparelho e não são compartilhadas.</p>
      <div class="lesson-grid" aria-label="Lista de lições da Escola Bíblica Dominical">
        ${lessons.map(renderLesson).join('')}
      </div>
    </section>
  `;

  bindPrivateNotes(root);
}

function renderLesson(lesson) {
  return `
    <article class="lesson-card">
      <div class="lesson-number" aria-hidden="true">${String(lesson.number).padStart(2, '0')}</div>
      <div class="lesson-content">
        <span>Lição ${lesson.number}</span>
        <time class="lesson-date" datetime="${lesson.date}">${formatLessonDate(lesson.date)}</time>
        <h2>${lesson.title}</h2>
        <div class="lesson-actions">
          ${lesson.studyUrl
            ? `<a class="lesson-link primary" href="${lesson.studyUrl}" target="_blank" rel="noopener">Abrir lição</a>`
            : '<span class="lesson-pending">Lição em breve</span>'}
          <a class="share-button whatsapp-button" href="${escapeAttr(getLessonWhatsAppUrl(lesson))}" target="_blank" rel="noopener" aria-label="Compartilhar lição no WhatsApp">${icon('whatsapp')}<span>WhatsApp</span></a>
        </div>
        <details class="lesson-notes">
          <summary>Minhas anotações</summary>
          <label for="lesson-note-${lesson.number}">O que você entendeu desta aula?</label>
          <textarea id="lesson-note-${lesson.number}" data-lesson-note="${lesson.number}" maxlength="5000" placeholder="Escreva aqui suas anotações pessoais..."></textarea>
          <div class="lesson-note-footer">
            <small data-note-status="${lesson.number}">Salvo somente neste aparelho</small>
            <button type="button" data-clear-note="${lesson.number}">Limpar anotações</button>
          </div>
        </details>
      </div>
    </article>
  `;
}

function bindPrivateNotes(root) {
  root.querySelectorAll('[data-lesson-note]').forEach((textarea) => {
    const lessonNumber = textarea.dataset.lessonNote;
    const status = root.querySelector(`[data-note-status="${lessonNumber}"]`);
    textarea.value = readNote(lessonNumber);
    textarea.addEventListener('input', () => {
      try {
        localStorage.setItem(`${NOTE_KEY_PREFIX}${lessonNumber}`, textarea.value);
        status.textContent = 'Anotação salva neste aparelho';
      } catch {
        status.textContent = 'Não foi possível salvar neste aparelho';
      }
    });
  });

  root.querySelectorAll('[data-clear-note]').forEach((button) => {
    button.addEventListener('click', () => {
      const lessonNumber = button.dataset.clearNote;
      const textarea = root.querySelector(`[data-lesson-note="${lessonNumber}"]`);
      if (!textarea.value || !window.confirm('Deseja apagar suas anotações desta lição?')) return;
      textarea.value = '';
      localStorage.removeItem(`${NOTE_KEY_PREFIX}${lessonNumber}`);
      root.querySelector(`[data-note-status="${lessonNumber}"]`).textContent = 'Anotações apagadas';
    });
  });
}

function readNote(lessonNumber) {
  try {
    return localStorage.getItem(`${NOTE_KEY_PREFIX}${lessonNumber}`) || '';
  } catch {
    return '';
  }
}

function getLessonWhatsAppUrl(lesson) {
  const link = lesson.studyUrl || `${location.origin}${location.pathname}#ebd`;
  const availability = lesson.studyUrl ? '' : '\nConteúdo em breve.';
  const message = `Escola Bíblica Dominical\nLição ${lesson.number} - ${lesson.title}\nData: ${formatLessonDate(lesson.date)}${availability}\n${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function formatLessonDate(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function escapeAttr(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
