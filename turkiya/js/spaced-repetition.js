import { getAll, put } from './database.js';

const DAY = 86400000;

export async function addToReview(card) {
  const id = String(card.id || card.tr);
  const current = (await getAll('reviews')).find((item) => item.id === id);
  const record = {
    id, tr: card.tr, ar: card.ar, ipa: card.ipa || '', pos: card.pos || '',
    exampleTr: card.exampleTr || '', exampleAr: card.exampleAr || '', level: card.level || 'Pre-A1',
    repetitions: current?.repetitions || 0, intervalDays: current?.intervalDays || 0,
    ease: current?.ease || 2.25, lapses: current?.lapses || 0,
    nextDue: current?.nextDue || new Date().toISOString(), suspended: false,
    createdAt: current?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  await put('reviews', record);
  await put('vocabulary', { id, tr: record.tr, ar: record.ar, level: record.level, learnedAt: current?.createdAt || new Date().toISOString() });
  return record;
}

export async function getDueReviews() {
  const items = await getAll('reviews');
  return items.filter((item) => !item.suspended && new Date(item.nextDue || 0).getTime() <= Date.now())
    .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
}

export async function rateReview(item, rating) {
  const card = { ...item };
  const now = Date.now();
  if (rating === 'again') {
    card.repetitions = 0;
    card.lapses = (card.lapses || 0) + 1;
    card.intervalDays = 0;
    card.nextDue = new Date(now + 10 * 60000).toISOString();
    card.ease = Math.max(1.3, (card.ease || 2.25) - 0.2);
  } else if (rating === 'hard') {
    card.intervalDays = Math.max(1, Math.round((card.intervalDays || 1) * 1.2));
    card.repetitions = (card.repetitions || 0) + 1;
    card.ease = Math.max(1.3, (card.ease || 2.25) - 0.12);
    card.nextDue = new Date(now + card.intervalDays * DAY).toISOString();
  } else if (rating === 'good') {
    card.intervalDays = card.repetitions === 0 ? 1 : Math.max(2, Math.round((card.intervalDays || 1) * (card.ease || 2.25)));
    card.repetitions = (card.repetitions || 0) + 1;
    card.nextDue = new Date(now + card.intervalDays * DAY).toISOString();
  } else if (rating === 'easy') {
    card.intervalDays = card.repetitions === 0 ? 3 : Math.max(3, Math.round((card.intervalDays || 1) * (card.ease || 2.25) * 1.3));
    card.repetitions = (card.repetitions || 0) + 1;
    card.ease = Math.min(3.2, (card.ease || 2.25) + 0.15);
    card.nextDue = new Date(now + card.intervalDays * DAY).toISOString();
  } else {
    throw new Error('درجة مراجعة غير معروفة.');
  }
  card.lastReviewedAt = new Date(now).toISOString();
  card.updatedAt = new Date(now).toISOString();
  await put('reviews', card);
  return card;
}

export async function getReviewSummary() {
  const items = await getAll('reviews');
  const now = Date.now();
  return { total: items.length, due: items.filter((item) => !item.suspended && new Date(item.nextDue || 0).getTime() <= now).length, hard: items.filter((item) => (item.lapses || 0) > 0).length, items };
}
