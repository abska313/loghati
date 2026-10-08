const MIN_EASE = 1.3;

export function newCard() {
  return {
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    due: Date.now(),
    lastReview: null,
    difficulty: 0.5,
    history: []
  };
}

export function review(card, grade) {
  const c = { ...card, history: [...(card.history || []).slice(-19), grade] };
  const q = grade;

  if (q < 3) {
    c.reps = 0;
    c.lapses++;
    c.interval = 10 / (60 * 24);
  } else {
    if (c.reps === 0) c.interval = 1;
    else if (c.reps === 1) c.interval = 3;
    else c.interval = Math.round(c.interval * c.ease * 10) / 10;
    c.reps++;
  }

  c.ease = c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (c.ease < MIN_EASE) c.ease = MIN_EASE;

  const recent = c.history.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  c.difficulty = Math.max(0, Math.min(1, 1 - avg / 5));

  c.lastReview = Date.now();
  c.due = Date.now() + c.interval * 24 * 3600 * 1000;
  return c;
}

export function isDue(card, now = Date.now()) {
  return !card || !card.due || card.due <= now;
}

export function masteryLevel(card) {
  if (!card || !card.reps) return 0;
  const level = Math.min(card.reps, 5) / 5;
  const easeBonus = Math.min((card.ease - 1.3) / 1.7, 1) * 0.3;
  const recency = card.lastReview
    ? Math.max(0, 1 - (Date.now() - card.lastReview) / (14 * 24 * 3600 * 1000))
    : 0;
  return Math.min(1, level * 0.5 + easeBonus + recency * 0.2);
}

export function masteryLabel(m) {
  if (m < 0.1) return 'جديد';
  if (m < 0.25) return 'مألوف';
  if (m < 0.5) return 'قيد التطور';
  if (m < 0.75) return 'قوي';
  if (m < 0.9) return 'متمكن';
  return 'متقن';
}

export function nextIntervalLabel(card) {
  if (!card || !card.interval) return 'الآن';
  const d = card.interval;
  if (d < 1 / 24) return 'بعد دقائق';
  if (d < 1) return `بعد ${Math.round(d * 24)} ساعة`;
  if (d < 30) return `بعد ${Math.round(d)} يوم`;
  return `بعد ${Math.round(d / 30)} شهر`;
}

export function gradeFromAttempt({ correct, firstTry, timeMs, hintUsed }) {
  if (!correct) return 1;
  if (hintUsed) return 3;
  if (!firstTry) return 3;
  if (timeMs < 2500) return 5;
  if (timeMs < 6000) return 4;
  return 3;
}
