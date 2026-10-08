import { icon } from '../components/icons.js?v=20261001-1';
import { SUNDAY_SCHOOL_LESSONS, isLessonReleased } from '../data/sundaySchoolLessons.js?v=20261007-1';
import { SUNDAY_SCHOOL_CONTENT } from '../data/sundaySchoolContent.js?v=20261007-5';

export function renderLessonPage(root, navigate, route = 'lesson:1') {
  const number = Number(String(route).match(/lesson:(\d+)/)?.[1] || 1);
  const lesson = SUNDAY_SCHOOL_LESSONS.find((item) => item.number === number) || SUNDAY_SCHOOL_LESSONS[0];
  const content = SUNDAY_SCHOOL_CONTENT[lesson.number];
  if (!content || !isLessonReleased(lesson)) {
    root.innerHTML = `
      <section class="panel lesson-reader-panel fade-in">
        <button class="quiz-back-link" type="button" data-back>${icon('arrow-left')} Voltar para a Escola Bíblica</button>
        <div class="lesson-reader-locked"><span>${icon('lock')}</span><h1>Lição ainda não liberada</h1><p>O conteúdo desta revista será liberado na segunda-feira da semana da aula.</p></div>
      </section>`;
    root.querySelector('[data-back]').addEventListener('click', () => navigate('ebd'));
    return;
  }

  root.innerHTML = `
    <section class="panel lesson-reader-panel fade-in">
      <div class="lesson-reader-header">
        <button class="quiz-back-link" type="button" data-back>${icon('arrow-left')} Escola Bíblica</button>
        <span class="section-kicker">Revista · Lição ${lesson.number}</span>
        <h1>${escapeHtml(content.title)}</h1>
        <p class="lesson-reader-reference">${escapeHtml(content.reference)}</p>
      </div>
      <div class="lesson-reader-actions">
        <button class="lesson-link devotional-link" type="button" data-devotional>${icon('heart')} Fazer devocional</button>
        <button class="share-button whatsapp-button" type="button" data-share>${icon('whatsapp')} Compartilhar</button>
      </div>
      <article class="lesson-reader-card">
        ${content.verseOfDay ? `<blockquote class="lesson-reader-box lesson-verse"><h2>${icon('book')} Versículo do dia</h2><p>${escapeHtml(content.verseOfDay)}</p></blockquote>` : ''}
        ${content.appliedTruth ? `<section class="lesson-reader-box lesson-applied-truth"><h2>${icon('heart')} Verdade aplicada</h2><p>${escapeHtml(content.appliedTruth)}</p></section>` : ''}
        <section class="lesson-reader-box lesson-objectives"><h2>${icon('award')} Objetivos da lição</h2><ul>${content.objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section class="lesson-reader-box"><h2>Introdução</h2><p>${escapeHtml(content.introduction)}</p></section>
        <blockquote class="lesson-key-point"><strong>Ponto-chave</strong><span>${escapeHtml(content.keyPoint)}</span></blockquote>
        <div class="lesson-reader-sections">${content.sections.map(renderSection).join('')}</div>
        ${content.conclusion ? `<section class="lesson-reader-box lesson-conclusion"><h2>Conclusão</h2><p>${escapeHtml(content.conclusion)}</p></section>` : ''}
        ${content.learned ? `<section class="lesson-reader-box lesson-learned"><h2>${icon('award')} Eu aprendi que</h2><p>${escapeHtml(content.learned)}</p></section>` : ''}
      </article>
      <p class="lesson-reader-source">Conteúdo transcrito e organizado a partir da revista enviada para a Escola Bíblica. O devocional e a pergunta da lição ficam disponíveis no mesmo fluxo.</p>
    </section>
  `;
  root.querySelector('[data-back]').addEventListener('click', () => navigate('ebd'));
  root.querySelector('[data-devotional]').addEventListener('click', () => navigate(`devotional:lesson-${lesson.number}`));
  root.querySelector('[data-share]').addEventListener('click', () => {
    const text = `Escola Bíblica Dominical\nLição ${lesson.number} - ${content.title}\n${location.origin}${location.pathname}#lesson:${lesson.number}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
}

function renderSection(section) {
  const subsections = section.subsections?.length
    ? `<div class="lesson-reader-subsections">${section.subsections.map((item) => `<section class="lesson-reader-subsection"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></section>`).join('')}</div>`
    : '';
  return `<section class="lesson-reader-box"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.text)}</p>${subsections}</section>`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
