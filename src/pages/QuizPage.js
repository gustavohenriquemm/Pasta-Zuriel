import { icon } from '../components/icons.js?v=20261001-1';
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

const DEVOTIONALS = [
  {
    lesson: 1,
    title: 'A singularidade da visão bíblica do tempo e da história',
    reference: 'Apocalipse 21:1; Romanos 8:18',
    verse: '“Eis que faço novas todas as coisas.” (Ap 21:5)',
    text: 'A Bíblia apresenta a História como uma jornada linear, conduzida pela soberania de Deus. Cristo é o centro dessa história, e o verdadeiro progresso aparece no crescimento espiritual, no conhecimento de Deus e na expansão do Seu Reino. A promessa de um novo céu e uma nova terra sustenta nossa esperança.',
    practice: 'Hoje, escolha uma atitude de santidade e esperança que aponte para o futuro de Deus.',
  },
  {
    lesson: 2,
    title: 'A tecnologia no contexto bíblico',
    reference: 'Provérbios 8:12',
    verse: '“Eu, a sabedoria, habito com a prudência.” (Pv 8:12)',
    text: 'As ferramentas do Antigo Testamento mostram que criatividade, agricultura, metalurgia e construção faziam parte da vida do povo. O Templo de Salomão exigiu planejamento e excelência. A escrita e a comunicação oral também preservaram a Palavra de Deus para as próximas gerações.',
    practice: 'Use hoje uma habilidade ou ferramenta como um dom para servir alguém e glorificar a Deus.',
  },
  {
    lesson: 3,
    title: 'Ciência e fé: aliadas ou rivais?',
    reference: 'Daniel 12:3-4',
    verse: '“A criação testemunha a glória de Deus.” (Sl 19:1)',
    text: 'Ciência e fé podem caminhar juntas. A Ciência investiga os mecanismos e responde principalmente “como”; a fé revela o propósito e ajuda a responder “por quê”. Quando o conhecimento é submetido à verdade e à ética, ele pode servir ao bem e reconhecer a sabedoria do Criador.',
    practice: 'Ao aprender algo novo, agradeça a Deus e pense em como esse conhecimento pode beneficiar o próximo.',
  },
  {
    lesson: 4,
    title: 'A evolução das ferramentas',
    reference: '1 Reis 7:9',
    verse: '“Deus encheu Bezalel de sabedoria, entendimento e ciência em todo artifício.” (Êx 31:3)',
    text: 'A capacidade de criar e inovar é uma expressão da imagem de Deus. Bezalel recebeu habilidade para construir o Tabernáculo, mostrando que arte e técnica podem ser graça comum. Entretanto, a tecnologia é ambígua: pode promover o bem ou ser usada para destruição, dependendo do caráter de quem a utiliza.',
    practice: 'Antes de usar uma tecnologia, pergunte: isto edifica, serve ao bem comum e honra a Deus?',
  },
  {
    lesson: 5,
    title: 'Inteligência artificial e criação divina',
    reference: 'Salmo 139:6',
    verse: '“Criou Deus, pois, o homem à sua imagem.” (Gn 1:27)',
    text: 'A inteligência artificial pode simular funções cognitivas e processar muitos dados, mas continua sendo uma ferramenta criada por pessoas. A dignidade humana é singular porque inclui racionalidade, criatividade, espiritualidade e relacionamento com Deus. Nenhuma máquina substitui o amor genuíno ou a Imago Dei.',
    practice: 'Use a IA com honestidade, justiça e responsabilidade, sem diminuir o valor de nenhuma pessoa.',
  },
  {
    lesson: 6,
    title: 'Tecnologia e ética cristã',
    reference: 'Romanos 14:21',
    verse: '“Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor.” (Cl 3:23)',
    text: 'A tecnologia não é boa ou má por si só; o uso é orientado pelas motivações e pelos impactos. O amor ao próximo, a mordomia da criação, a busca da verdade e o bem comum devem guiar nossas escolhas. Isso inclui evitar difamação, cyberbullying, desinformação e dependência.',
    practice: 'Revise uma atitude digital e troque uma reação impulsiva por uma resposta sábia e edificante.',
  },
  {
    lesson: 7,
    title: 'Comunicação digital e evangelização',
    reference: 'Atos 1:8',
    verse: '“Sereis minhas testemunhas [...] até aos confins da terra.” (At 1:8)',
    text: 'As plataformas digitais ampliam o alcance da Igreja e podem levar o Evangelho a pessoas distantes. Porém, velocidade não deve produzir superficialidade. Conteúdo relevante, verdade, mansidão e relacionamento presencial continuam essenciais para uma comunicação cristã autêntica.',
    practice: 'Compartilhe uma mensagem que edifique alguém e procure também fortalecer um relacionamento presencial.',
  },
  {
    lesson: 8,
    title: 'A biotecnologia e a santidade da vida',
    reference: 'Salmo 139:13-16',
    verse: '“Por modo assombrosamente maravilhoso me formaste.” (Sl 139:14)',
    text: 'Avanços como terapias genéticas podem aliviar o sofrimento e cuidar da saúde. Ao mesmo tempo, manipulação genética, reprodução assistida e descarte de embriões exigem discernimento. A vida humana tem dignidade desde a concepção, e a Ciência deve ser praticada com sabedoria, humildade e respeito ao Criador.',
    practice: 'Ore por sabedoria para defender a vida e tratar cada pessoa com compaixão e dignidade.',
  },
  {
    lesson: 9,
    title: 'Privacidade e controle no mundo digital',
    reference: 'Levítico 19:16',
    verse: '“Para onde me irei do teu Espírito?” (Sl 139:7)',
    text: 'A vigilância tecnológica e a coleta massiva de dados podem invadir a intimidade e ameaçar a liberdade. O olhar de Deus é perfeito e amoroso; já o controle humano sem ética pode manipular e oprimir. Justiça, transparência, consentimento e respeito ao próximo são indispensáveis.',
    practice: 'Confira as permissões de um aplicativo e escolha proteger seus dados e os dados de outras pessoas.',
  },
  {
    lesson: 10,
    title: 'Os perigos da idolatria tecnológica',
    reference: '1 Coríntios 10:14',
    verse: '“Portanto, meus amados, fugi da idolatria.” (1Co 10:14)',
    text: 'A tecnologia se torna um ídolo quando ocupa o lugar de Deus, domina o tempo e promete uma realização que só Cristo pode oferecer. Consumo, validação por curtidas e dependência digital podem afastar a pessoa da comunhão e do propósito. A ferramenta deve servir à vida, e não escravizar o coração.',
    practice: 'Separe um período sem telas para buscar a Deus e estar presente com sua família ou comunidade.',
  },
  {
    lesson: 11,
    title: 'As profecias apocalípticas e os avanços tecnológicos',
    reference: 'Apocalipse 13:15-18',
    verse: '“Eis que faço novas todas as coisas.” (Ap 21:5)',
    text: 'As profecias devem ser estudadas com reverência, contexto e humildade. A tecnologia pode criar estruturas de comunicação, vigilância e controle que tornam certos cenários plausíveis, mas não determina o futuro. A mensagem central do Apocalipse é esperança: Deus conduz a História, Cristo vence e o povo é chamado a perseverar.',
    practice: 'Troque o medo do futuro por uma ação fiel hoje: ore, sirva e viva com propósito.',
  },
];

let scoresUnsubscribe;

export function renderQuiz(root, navigate) {
  scoresUnsubscribe?.();
  root.innerHTML = `
    <section class="quiz-page fade-in">
      <header class="quiz-hero">
        <div class="quiz-kicker">Escola Bíblica Dominical</div>
        <h1>Devocional + Quiz das Lições 1–11</h1>
        <p>Leia o devocional de cada lição e responda às perguntas que serão liberadas em seguida.</p>
        <div class="quiz-meta"><span>${icon('book')} 11 devocionais</span><span>${icon('star')} 5 pontos por acerto</span></div>
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
      <h2>Comece pelo devocional</h2>
      <p>Você vai ler uma reflexão baseada em cada lição. Depois de concluir a leitura, a pergunta daquela lição será liberada. Ao final, sua pontuação entra no ranking da turma.</p>
      <label class="quiz-name-label" for="quiz-participant-name">Seu nome para o ranking</label>
      <input id="quiz-participant-name" class="quiz-name-input" type="text" maxlength="40" autocomplete="name" placeholder="Digite seu nome" />
      <button class="primary-button quiz-start-button" type="button" data-start-quiz>Começar devocional ${icon('arrow')}</button>
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
    startDevotional(root, name);
  };
  stage.querySelector('[data-start-quiz]').addEventListener('click', start);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') start();
  });
}

function startDevotional(root, displayName) {
  const state = { displayName, index: 0, answers: [], selected: null };
  renderDevotional(root, state);
}

function renderDevotional(root, state) {
  const devotional = DEVOTIONALS[state.index];
  const stage = root.querySelector('[data-quiz-stage]');
  const progress = Math.round((state.index / QUESTIONS.length) * 100);
  stage.innerHTML = `
    <article class="quiz-card devotional-card">
      <div class="quiz-progress-row"><span>Devocional ${state.index + 1} de ${DEVOTIONALS.length}</span><strong>${progress}%</strong></div>
      <div class="quiz-progress"><span style="width:${progress}%"></span></div>
      <div class="quiz-question-label">Lição ${devotional.lesson}</div>
      <h2>${escapeHtml(devotional.title)}</h2>
      <p class="devotional-reference">${escapeHtml(devotional.reference)}</p>
      <blockquote class="devotional-verse">${escapeHtml(devotional.verse)}</blockquote>
      <p class="devotional-text">${escapeHtml(devotional.text)}</p>
      <div class="devotional-practice"><strong>Para praticar hoje</strong><p>${escapeHtml(devotional.practice)}</p></div>
      <div class="quiz-actions"><span class="quiz-points">Leia com calma</span><button class="primary-button" type="button" data-open-question>Concluir leitura ${icon('arrow')}</button></div>
    </article>
  `;
  stage.querySelector('[data-open-question]').addEventListener('click', () => renderQuestion(root, state));
}

function renderQuestion(root, state) {
  const question = QUESTIONS[state.index];
  const stage = root.querySelector('[data-quiz-stage]');
  const progress = Math.round(((state.index + 0.5) / QUESTIONS.length) * 100);
  stage.innerHTML = `
    <article class="quiz-card quiz-question-card">
      <div class="quiz-progress-row"><span>Questão ${state.index + 1} de ${QUESTIONS.length}</span><strong>${progress}%</strong></div>
      <div class="quiz-progress"><span style="width:${progress}%"></span></div>
      <div class="quiz-question-label">Lição ${question.lesson} · Pergunta liberada</div>
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
    renderDevotional(root, state);
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
