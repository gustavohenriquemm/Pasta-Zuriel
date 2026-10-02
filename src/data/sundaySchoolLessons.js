export const SUNDAY_SCHOOL_LESSONS = [
  {
    number: 1,
    date: '2026-10-04',
    title: 'A singularidade da visão bíblica do tempo e da história',
  },
  {
    number: 2,
    date: '2026-10-11',
    title: 'A tecnologia no contexto bíblico',
  },
  {
    number: 3,
    date: '2026-10-18',
    title: 'Ciência e fé: aliadas ou rivais?',
  },
  {
    number: 4,
    date: '2026-10-25',
    title: 'A evolução das ferramentas',
  },
  {
    number: 5,
    date: '2026-11-01',
    title: 'Inteligência Artificial e criação divina',
  },
  {
    number: 6,
    date: '2026-11-08',
    title: 'Tecnologia e ética cristã',
  },
  {
    number: 7,
    date: '2026-11-15',
    title: 'Comunicação digital e evangelização',
  },
  {
    number: 8,
    date: '2026-11-22',
    title: 'A biotecnologia e a santidade da vida',
  },
  {
    number: 9,
    date: '2026-11-29',
    title: 'Privacidade e controle no mundo digital',
  },
  {
    number: 10,
    date: '2026-12-06',
    title: 'Os perigos da idolatria tecnológica',
  },
  {
    number: 11,
    date: '2026-12-13',
    title: 'As profecias apocalípticas e os avanços tecnológicos',
  },
];

export function toLessonDateKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// A lição de domingo abre na segunda-feira da mesma semana.
export function getLessonReleaseDate(lessonDate) {
  const [year, month, day] = String(lessonDate).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const daysFromMonday = date.getDay() === 0 ? 6 : date.getDay() - 1;
  date.setDate(date.getDate() - daysFromMonday);
  return toLessonDateKey(date);
}

export function isLessonReleased(lesson, now = new Date()) {
  return Boolean(lesson && toLessonDateKey(now) >= getLessonReleaseDate(lesson.date));
}

export function formatLessonReleaseDate(lessonDate) {
  const [year, month, day] = getLessonReleaseDate(lessonDate).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
