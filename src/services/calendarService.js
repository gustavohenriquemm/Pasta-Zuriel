import { listenCalendarEvents } from '../../database/firestore.js?v=20260713-33';
import { SUNDAY_SCHOOL_LESSONS } from '../data/sundaySchoolLessons.js?v=20260713-12';

const SUNDAY_EVENTS = [
  {
    id: 'recurring-youth-rehearsal',
    title: 'Ensaio da Mocidade',
    time: '11:00',
    location: 'Sede da Igreja',
    color: '#FFC107',
    recurrence: 'sundays',
    eventType: 'rehearsal',
    icon: '🎶',
  },
];

export function watchCalendarEvents(callback) {
  return listenCalendarEvents(callback);
}

export function getEventsForDate(date, remoteEvents = []) {
  const dateKey = toDateKey(date);
  const events = SUNDAY_SCHOOL_LESSONS
    .filter((lesson) => lesson.date === dateKey)
    .map((lesson) => ({
      id: `sunday-school-lesson-${lesson.number}`,
      title: `Escola Bíblica Dominical - Lição ${lesson.number}`,
      date: lesson.date,
      time: '08:30',
      location: 'Sede da Igreja',
      color: '#FFC107',
      eventType: 'sunday-school',
      lessonNumber: lesson.number,
      lessonTitle: lesson.title,
      lessonUrl: lesson.studyUrl || '',
      icon: '📖',
      fixed: true,
    }));
  const remoteEventsForDay = remoteEvents.filter((event) => event.recurrence === 'sundays'
    ? date.getDay() === 0
    : event.date === dateKey);
  const hasRehearsalOverride = remoteEventsForDay.some(isRehearsal);
  if (date.getDay() === 0) {
    events.push(...SUNDAY_EVENTS
      .filter((event) => !(event.eventType === 'rehearsal' && hasRehearsalOverride))
      .map((event) => ({ ...event, date: dateKey, recurring: true })));
  }
  events.push(...remoteEventsForDay.map((event) => ({ ...event, date: dateKey })));
  return events.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
}

export function getUpcomingEvents(remoteEvents = [], limit = 3, fromDate = new Date()) {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const nowKey = toDateKey(fromDate);
  const nowTime = `${String(fromDate.getHours()).padStart(2, '0')}:${String(fromDate.getMinutes()).padStart(2, '0')}`;
  const upcoming = [];

  for (let index = 0; index < 180 && upcoming.length < limit; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const dayKey = toDateKey(day);
    const events = getEventsForDate(day, remoteEvents)
      .filter((event) => dayKey > nowKey || String(event.time || '23:59') >= nowTime)
      .map((event) => ({ ...event, date: dayKey, dateObject: new Date(day) }));
    upcoming.push(...events);
    upcoming.sort(compareEvents);
    if (upcoming.length > limit) upcoming.length = limit;
  }

  return upcoming.slice(0, limit);
}

export function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function compareEvents(a, b) {
  return `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`);
}

function isRehearsal(event) {
  return event.eventType === 'rehearsal'
    || String(event.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('ensaio');
}
