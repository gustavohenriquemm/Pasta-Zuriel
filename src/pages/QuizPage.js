import { icon } from '../components/icons.js?v=20260817-4';
import { loadPublicQuizScores, saveQuizScore } from '../../database/firestore.js?v=20261001-1';

export const QUIZ_ID = 'licoes-1-11';
const POINTS_PER_QUESTION = 5;
const LOCAL_KEY = 'zuriel:quiz-scores:v1';

const QUESTIONS = [
  {
    lesson: 1,
    text: 'Na visão bíblica, como o tempo e a História são apresentados?',
    options: ['Como ciclos sem propósito', 'Como uma linha guiada por Deus, com começo, desenvolvimento e fim', 'Como resultado apenas do acaso', 'Como uma realidade sem esperança'],
    answer: 1,
  },
  {
    lesson: 2,
    text: 'Qual é uma das funções da escrita e da oralidade destacadas na Lição 2?',
    options: ['Apagar a memória do povo', 'Preservar e transmitir a Palavra de Deus entre as gerações', 'Substituir a fé pela técnica', 'Impedir a comunicação da comunidade'],
    answer: 1,
  },
  {
    lesson: 3,
    text: 'Como Ciência e fé são descritas na Lição 3?',
    options: ['Como inimigas que nunca dialogam', 'Como perspectivas complementares: a Ciência investiga o “como” e a fé aponta o “porquê”', 'Como áreas sem relação com a vida', 'Como formas de conhecimento que rejeitam a responsabilidade'],
    answer: 1,
  },
  {
    lesson: 4,
    text: 'O exemplo de Bezalel ensina que a criatividade e a habilidade técnica podem ser:',
    options: ['Dons concedidos por Deus para servir e glorificá-Lo', 'Sinais de independência em relação a Deus', 'Recursos úteis apenas para guerras', 'Talentos que devem ser escondidos'],
    answer: 0,
  },
  {
    lesson: 5,
    text: 'Qual é o limite da inteligência artificial apresentado na Lição 5?',
    options: ['Ela nunca processa informações', 'Ela pode imitar inteligência, mas não possui espiritualidade nem capacidade de amar como o ser humano', 'Ela é superior à dignidade humana', 'Ela substitui o relacionamento com Deus'],
    answer: 1,
  },
  {
    lesson: 6,
    text: 'Qual princípio deve orientar o uso cristão da tecnologia?',
    options: ['A busca por controle e vantagem pessoal', 'O amor ao próximo, a justiça e o bem comum', 'A rejeição de toda inovação', 'A exposição de toda informação privada'],
    answer: 1,
  },
  {
    lesson: 7,
    text: 'Qual equilíbrio a comunicação digital da Igreja deve buscar?',
    options: ['Trocar completamente a comunhão presencial por telas', 'Usar as plataformas para alcançar pessoas, sem perder a profundidade e o contato humano', 'Publicar qualquer conteúdo para obter alcance', 'Evitar toda conversa sobre o Evangelho na internet'],
    answer: 1,
  },
  {
    lesson: 8,
    text: 'Qual princípio orienta a reflexão cristã sobre biotecnologia?',
    options: ['A vida humana é sagrada e deve ser respeitada desde a concepção', 'A ciência pode buscar qualquer aperfeiçoamento sem limites', 'A vida tem valor apenas quando é saudável', 'A tecnologia deve ocupar o lugar do Criador'],
    answer: 0,
  },
  {
    lesson: 9,
    text: 'Por que a coleta de dados sem transparência é um problema ético?',
    options: ['Porque impede qualquer avanço tecnológico', 'Porque pode invadir a intimidade e ferir o respeito ao próximo', 'Porque torna a internet mais rápida', 'Porque elimina a necessidade de responsabilidade'],
    answer: 1,
  },
  {
    lesson: 10,
    text: 'Quando a tecnologia se transforma em idolatria?',
    options: ['Quando é usada como ferramenta para o bem', 'Quando passa a substituir Deus e dominar o tempo, a mente e os sentimentos', 'Quando ajuda na comunicação', 'Quando é usada com sabedoria e domínio próprio'],
    answer: 1,
  },
  {
    lesson: 11,
    text: 'Qual é a mensagem central de esperança destacada nas profecias apocalípticas?',
    options: ['O medo deve controlar todas as decisões', 'A tecnologia determina o futuro da humanidade', 'Deus conduz a História, Cristo vence e a esperança impulsiona uma vida fiel', 'As profecias não precisam de estudo cuidadoso'],
    answer: 2,
  },
];

let scoresUnsubscribe;

export function renderQuiz(root, navigate) {
  scoresUnsubscribe?.();
  root.innerHTML = `
    <section class="quiz-page fade-in">
      <header class="quiz-hero">
        <div class="quiz-kicker">Escola Bíblica Dominical</div>
        <h1>Quiz das Lições 1–11</h1>
        <p>Revise o conteúdo da revista e participe do ranking da turma.</p>
        <div class="quiz-meta"><span>${icon('book')} 11 perguntas</span><span>${icon('star')} 5 pontos por acerto</span></div>
      </header>
      <div class="quiz-layout">
        <div class="quiz-stage" data-quiz-stage></div>
        <aside class="quiz-ranking" data-ranking-panel>
          <div class="quiz-section-title"><span>${icon('award')}</span><div><strong>Ranking</strong><small>Melhores pontuações</small></div></div>
          <div data-ranking-list><p class="empty">Carregando ranking...</p></div>
        </aside>
      </div>
      <button class="quiz-back-link" type="button" data-route="ebd">${icon('arrow-left')} Voltar para a Escola Bíblica</button>
    </section>
  `;

  root.querySelector('[data-route="ebd"]').addEventListener('click', () => navigate('ebd'));
  const ranking = mergeScores(readLocalScores(), []);
  renderRanking(root, ranking);
  scoresUnsubscribe = loadPublicQuizScores((remoteScores) => {
    renderRanking(root, mergeScores(remoteScores, readLocalScores()));
  });
  showIntro(root);
}

function showIntro(root) {
  const stage = root.querySelector('[data-quiz-stage]');
  stage.innerHTML = `
    <article class="quiz-card quiz-intro-card">
      <span class="quiz-card-icon">${icon('award')}</span>
      <h2>Pronto para testar o que aprendeu?</h2>
      <p>As perguntas passam pelas onze lições sobre tempo bíblico, tecnologia, ética, comunicação, biotecnologia, privacidade, idolatria e esperança cristã.</p>
      <label class="quiz-name-label" for="quiz-participant-name">Seu nome para o ranking</label>
      <input id="quiz-participant-name" class="quiz-name-input" type="text" maxlength="40" autocomplete="name" placeholder="Digite seu nome" />
      <button class="primary-button quiz-start-button" type="button" data-start-quiz>Começar questionário ${icon('arrow')}</button>
      <p class="quiz-note">Seu nome e sua pontuação serão exibidos no ranking público.</p>
    </article>
  `;
  const input = stage.querySelector('#quiz-participant-name');
  const start = () => {
    const name = input.value.trim().replace(/\s+/g, ' ');
    if (name.length < 2) {
      input.focus();
      input.setCustomValidity('Digite pelo menos duas letras.');
      input.reportValidity();
      return;
    }
    input.setCustomValidity('');
    startQuiz(root, name);
  };
  stage.querySelector('[data-start-quiz]').addEventListener('click', start);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') start();
  });
}

function startQuiz(root, displayName) {
  const state = { displayName, index: 0, answers: [], selected: null };
  renderQuestion(root, state);
}

function renderQuestion(root, state) {
  const question = QUESTIONS[state.index];
  const stage = root.querySelector('[data-quiz-stage]');
  const progress = Math.round((state.index / QUESTIONS.length) * 100);
  stage.innerHTML = `
    <article class="quiz-card quiz-question-card">
      <div class="quiz-progress-row"><span>Questão ${state.index + 1} de ${QUESTIONS.length}</span><strong>${progress}%</strong></div>
      <div class="quiz-progress"><span style="width:${progress}%"></span></div>
      <div class="quiz-question-label">Lição ${question.lesson}</div>
      <h2>${escapeHtml(question.text)}</h2>
      <div class="quiz-options" role="radiogroup" aria-label="Alternativas">
        ${question.options.map((option, index) => `<button class="quiz-option" type="button" role="radio" aria-checked="false" data-option="${index}"><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option)}</button>`).join('')}
      </div>
      <div class="quiz-actions"><span class="quiz-points">Vale ${POINTS_PER_QUESTION} pontos</span><button class="primary-button" type="button" data-next-quiz disabled>${state.index === QUESTIONS.length - 1 ? 'Finalizar' : 'Próxima'} ${icon('arrow')}</button></div>
    </article>
  `;
  const next = stage.querySelector('[data-next-quiz]');
  stage.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => {
    state.selected = Number(button.dataset.option);
    stage.querySelectorAll('[data-option]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-checked', String(selected));
    });
    next.disabled = false;
  }));
  next.addEventListener('click', () => {
    if (state.selected === null) return;
    state.answers[state.index] = state.selected;
    if (state.index === QUESTIONS.length - 1) {
      finishQuiz(root, state);
      return;
    }
    state.index += 1;
    state.selected = null;
    renderQuestion(root, state);
  });
}

async function finishQuiz(root, state) {
  const correctAnswers = state.answers.reduce((total, answer, index) => total + (answer === QUESTIONS[index].answer ? 1 : 0), 0);
  const score = correctAnswers * POINTS_PER_QUESTION;
  const entry = {
    quizId: QUIZ_ID,
    participantId: slugify(state.displayName),
    displayName: state.displayName,
    score,
    correctAnswers,
    totalQuestions: QUESTIONS.length,
    updatedAt: Date.now(),
  };
  const localScores = mergeScores(readLocalScores(), [entry]);
  writeLocalScores(localScores);
  showResult(root, entry, localScores, true);
  try {
    await saveQuizScore(entry);
  } catch {
    // O resultado local continua disponível quando o Firebase estiver indisponível.
  }
}

function showResult(root, entry, scores, savedLocally) {
  const stage = root.querySelector('[data-quiz-stage]');
  const ordered = mergeScores(scores, [entry]);
  const position = ordered.findIndex((item) => item.participantId === entry.participantId) + 1;
  stage.innerHTML = `
    <article class="quiz-card quiz-result-card">
      <span class="quiz-card-icon">${icon('star')}</span>
      <div class="quiz-question-label">Questionário concluído</div>
      <h2>${entry.score >= 45 ? 'Excelente revisão!' : entry.score >= 30 ? 'Muito bem!' : 'Continue estudando!'}</h2>
      <div class="quiz-score"><strong>${entry.score}</strong><span>/ ${QUESTIONS.length * POINTS_PER_QUESTION} pontos</span></div>
      <p>Você acertou <strong>${entry.correctAnswers} de ${QUESTIONS.length}</strong> questões e está em <strong>${position}º lugar</strong> no ranking deste aparelho.</p>
      <p class="quiz-note">${savedLocally ? 'Pontuação salva. Se houver internet, ela também será sincronizada com o ranking geral.' : ''}</p>
      <div class="quiz-result-actions"><button class="primary-button" type="button" data-retry-quiz>Tentar novamente</button><button class="plain-button" type="button" data-scroll-ranking>Ver ranking</button></div>
    </article>
  `;
  stage.querySelector('[data-retry-quiz]').addEventListener('click', () => showIntro(root));
  stage.querySelector('[data-scroll-ranking]').addEventListener('click', () => root.querySelector('[data-ranking-panel]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function renderRanking(root, scores) {
  const target = root.querySelector('[data-ranking-list]');
  if (!target) return;
  const ordered = mergeScores(scores, []).slice(0, 10);
  target.innerHTML = ordered.length ? ordered.map((item, index) => `
    <div class="ranking-row ${index < 3 ? `ranking-top-${index + 1}` : ''}">
      <span class="ranking-position">${index + 1}</span>
      <span class="ranking-name">${escapeHtml(item.displayName)}</span>
      <strong>${item.score} pts</strong>
    </div>
  `).join('') : '<p class="empty">Ainda não há pontuações. Seja o primeiro!</p>';
}

function readLocalScores() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocalScores(scores) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(scores.slice(0, 50))); } catch { /* storage unavailable */ }
}

function mergeScores(...lists) {
  const byParticipant = new Map();
  lists.flat().forEach((item) => {
    if (!item?.displayName) return;
    if (item.quizId && item.quizId !== QUIZ_ID) return;
    const normalized = { ...item, participantId: item.participantId || slugify(item.displayName), score: Number(item.score || 0) };
    const current = byParticipant.get(normalized.participantId);
    if (!current || normalized.score > current.score || (normalized.score === current.score && Number(normalized.updatedAt || 0) > Number(current.updatedAt || 0))) byParticipant.set(normalized.participantId, normalized);
  });
  return [...byParticipant.values()].sort((a, b) => Number(b.score) - Number(a.score) || Number(a.updatedAt || 0) - Number(b.updatedAt || 0));
}

function slugify(value) {
  return String(value || 'participante').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'participante';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
