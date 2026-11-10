import type { TrackingMode } from '../../exercise-library/tracking-mode.js';

// Generates a year of believable training and headache history for the example account.
// Pure (no database access) and seeded, so every run produces the same shape of data,
// shifted so the year always ends yesterday.

export interface ExampleSet {
  weight?: number;
  reps?: number;
  distance?: number;
  durationSeconds?: number;
}

export interface ExampleExercise {
  exerciseId: number;
  trackingMode: TrackingMode;
  sets: ExampleSet[];
}

export interface ExampleWorkout {
  title: string;
  startedAt: Date;
  durationSeconds: number;
  exercises: ExampleExercise[];
}

// Lookups are referenced by name since their ids differ between databases
export interface ExampleHeadache {
  startedAt: Date;
  endedAt: Date | null;
  painLevel: number;
  notes: string | null;
  triggers: string[];
  symptoms: string[];
  reliefMeasures: string[];
  locations: string[];
}

const TIME_ZONE = 'Europe/Warsaw';
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------- random

// mulberry32: small seeded PRNG so the data is reproducible
function createRandom(seed: number) {
  let a = seed;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  const uniform = (lo: number, hi: number) => lo + next() * (hi - lo);
  const choice = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
  const sample = <T>(items: readonly T[], k: number): T[] => {
    const pool = [...items];
    const out: T[] = [];
    while (out.length < Math.min(k, items.length)) out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
    return out;
  };
  const weighted = <T>(items: readonly T[], weights: number[]): T => {
    let r = next() * weights.reduce((sum, w) => sum + w, 0);
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r < 0) return items[i];
    }
    return items[items.length - 1];
  };
  return { next, int, uniform, choice, sample, weighted };
}

// ---------------------------------------------------------------- dates
// Calendar days are UTC-midnight Dates; times of day are converted from the example user's time zone.

const addDays = (day: Date, n: number) => new Date(day.getTime() + n * DAY_MS);
const addMinutes = (date: Date, n: number) => new Date(date.getTime() + n * 60_000);
const weekday = (day: Date) => (day.getUTCDay() + 6) % 7; // Monday = 0
const month = (day: Date) => day.getUTCMonth() + 1;
const inRange = (day: Date, [from, to]: Range) => day >= from && day <= to;

type Range = [Date, Date];

const zoneFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

function zoneOffsetMs(date: Date): number {
  const parts = zoneFormat.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute')) - date.getTime();
}

/** The instant `hour:minute` happens on `day` in the example user's time zone. */
function at(day: Date, hour: number, minute: number): Date {
  const guess = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute);
  return new Date(guess - zoneOffsetMs(new Date(guess)));
}

// ---------------------------------------------------------------- exercises

interface Lift {
  id: number;
  mode: TrackingMode;
  sets: number;
  reps: [number, number];
  startKg?: number;
  stepKg?: number;
}

const UPPER_A: Lift[] = [
  { id: 314, mode: 'weight_reps', sets: 3, reps: [8, 10], startKg: 14, stepKg: 2 }, // dumbbell incline bench press
  { id: 150, mode: 'weight_reps', sets: 3, reps: [8, 12], startKg: 40, stepKg: 2.5 }, // cable bar lateral pulldown
  { id: 405, mode: 'weight_reps', sets: 3, reps: [8, 10], startKg: 10, stepKg: 1 }, // dumbbell seated shoulder press
  { id: 239, mode: 'weight_reps', sets: 3, reps: [10, 12], startKg: 35, stepKg: 2.5 }, // cable straight back seated row
  { id: 294, mode: 'weight_reps', sets: 3, reps: [10, 12], startKg: 8, stepKg: 1 }, // dumbbell biceps curl
  { id: 241, mode: 'weight_reps', sets: 3, reps: [10, 12], startKg: 17.5, stepKg: 2.5 }, // cable triceps pushdown (v-bar)
];
const UPPER_B: Lift[] = [
  { id: 25, mode: 'weight_reps', sets: 4, reps: [5, 8], startKg: 40, stepKg: 2.5 }, // barbell bench press
  { id: 27, mode: 'weight_reps', sets: 4, reps: [6, 8], startKg: 37.5, stepKg: 2.5 }, // barbell bent over row
  { id: 652, mode: 'reps', sets: 3, reps: [3, 6] }, // pull-up
  { id: 334, mode: 'weight_reps', sets: 3, reps: [12, 15], startKg: 5, stepKg: 1 }, // dumbbell lateral raise
  { id: 313, mode: 'weight_reps', sets: 3, reps: [10, 12], startKg: 8, stepKg: 1 }, // dumbbell hammer curl
  { id: 109, mode: 'weight_reps', sets: 3, reps: [10, 12], startKg: 15, stepKg: 2.5 }, // barbell standing overhead triceps extension
];
const LOWER_A: Lift[] = [
  { id: 43, mode: 'weight_reps', sets: 4, reps: [5, 8], startKg: 55, stepKg: 2.5 }, // barbell full squat
  { id: 1459, mode: 'weight_reps', sets: 3, reps: [8, 10], startKg: 16, stepKg: 2 }, // dumbbell romanian deadlift
  { id: 585, mode: 'weight_reps', sets: 3, reps: [10, 12], startKg: 30, stepKg: 2.5 }, // lever leg extension
  { id: 599, mode: 'weight_reps', sets: 3, reps: [10, 12], startKg: 25, stepKg: 2.5 }, // lever seated leg curl
  { id: 1372, mode: 'weight_reps', sets: 3, reps: [12, 15], startKg: 40, stepKg: 5 }, // barbell standing calf raise
  { id: 274, mode: 'reps', sets: 3, reps: [15, 20] }, // crunch floor
];
const LOWER_B: Lift[] = [
  { id: 32, mode: 'weight_reps', sets: 3, reps: [4, 6], startKg: 70, stepKg: 5 }, // barbell deadlift
  { id: 336, mode: 'weight_reps', sets: 3, reps: [8, 10], startKg: 10, stepKg: 2 }, // dumbbell lunge
  { id: 58, mode: 'weight_reps', sets: 3, reps: [8, 10], startKg: 50, stepKg: 5 }, // barbell lying lifting (on hip)
  { id: 586, mode: 'weight_reps', sets: 3, reps: [10, 12], startKg: 25, stepKg: 2.5 }, // lever lying leg curl
  { id: 687, mode: 'weight_reps', sets: 3, reps: [16, 20], startKg: 4, stepKg: 1 }, // russian twist
  { id: 620, mode: 'reps', sets: 3, reps: [10, 15] }, // lying leg raise flat bench
];
const SPLIT: [string, Lift[]][] = [
  ['Upper A', UPPER_A],
  ['Lower A', LOWER_A],
  ['Upper B', UPPER_B],
  ['Lower B', LOWER_B],
];
const HEAVY_LOWER = new Set(['Lower A', 'Lower B']);

const RUN = 685;
const TREADMILL_RUN = 684;
const STATIONARY_BIKE = 798;
const INCLINE_WALK = 3666;
const ELLIPTICAL = 2141;
const STEPMILL = 2311;
const PULL_UP = 652;
const KETTLEBELL_SWING = 549;
const SQUAT = 43;

/** Every exercise id the generator can use, so the seeder can check they exist in the library. */
export const EXAMPLE_EXERCISE_IDS = [
  ...[UPPER_A, UPPER_B, LOWER_A, LOWER_B].flat().map((l) => l.id),
  RUN, TREADMILL_RUN, STATIONARY_BIKE, INCLINE_WALK, ELLIPTICAL, STEPMILL,
  2612, KETTLEBELL_SWING, 1760, 662, 630, 1160,
];

// ---------------------------------------------------------------- headache lookups

const NOTES: Record<HeadacheKind, string[]> = {
  exertion: ['Came on during the last km', 'Forgot water bottle', 'Hot gym, pushed too hard',
    'Started right after the intervals', 'Pounding at the back of the head after the session'],
  strain: ['Neck felt tight after deadlifts', 'Probably bracing wrong on squats', 'Shoulders tense after training'],
  migraine: ['Had to leave work early', 'Aura first, then the pain', "Couldn't look at screens",
    'Took the whole evening to settle', 'Woke up with it'],
  tension: ['Long day at the laptop', 'Deadline week', 'Slept badly', 'Skipped lunch',
    'Too many meetings', 'Back-to-back calls all afternoon'],
  sinus: ['Blocked nose since yesterday', 'Cold going around the office', 'Pressure behind cheeks'],
  weekend: ["Wine at a friend's dinner", 'Slept in and had coffee late', 'Late night out'],
};

type HeadacheKind = 'exertion' | 'strain' | 'migraine' | 'tension' | 'sinus' | 'weekend';

interface LoggedWorkout {
  start: Date;
  end: Date;
  kind: 'strength' | 'strength_heavy' | 'cardio' | 'mixed';
  intensity: number;
  title: string;
}

// ---------------------------------------------------------------- generator

export function generateExampleData(now: Date, seed = 42): { workouts: ExampleWorkout[]; headaches: ExampleHeadache[] } {
  const rnd = createRandom(seed);
  const end = addDays(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), -1);
  const start = addDays(end, -364);
  const windowEnd = at(addDays(end, 1), 0, 0);

  // The single date in the window that falls on this month and day
  const occurrence = (m: number, d: number) => {
    const date = new Date(Date.UTC(end.getUTCFullYear(), m - 1, d));
    return date > end ? new Date(Date.UTC(end.getUTCFullYear() - 1, m - 1, d)) : date;
  };
  const span = (m: number, d: number, days: number): Range => {
    const from = occurrence(m, d);
    return [from, addDays(from, days)];
  };

  const sick = [span(1, 12, 6), span(3, 23, 4)];
  const vacation = span(7, 25, 15);
  const christmas = span(12, 22, 11);
  const stress = [span(12, 1, 18), span(3, 2, 18), span(6, 8, 11), span(10, 5, 18)];
  const raceWeek = occurrence(5, 17);
  const race = addDays(raceWeek, 6 - weekday(raceWeek)); // half marathon on a Sunday
  const isSick = (day: Date) => sick.some((r) => inRange(day, r));
  const isStress = (day: Date) => stress.some((r) => inRange(day, r));

  const workouts: ExampleWorkout[] = [];
  const log: LoggedWorkout[] = [];
  const progress = new Map<number, number>(); // exercise id -> weight steps gained
  let fitness = 0; // 0..1, makes running ~10% faster over the year

  const step = (id: number) => progress.get(id) ?? 0;
  const half = (kg: number) => Math.round(kg * 2) / 2;
  const pace = (secondsPerKm: number) => secondsPerKm * (1 - 0.1 * fitness) * rnd.uniform(0.96, 1.05);
  const km = (lo: number, hi: number) => Math.round(rnd.uniform(lo, hi) * 100) / 100;

  const addWorkout = (title: string, startedAt: Date, exercises: ExampleExercise[], kind: LoggedWorkout['kind'], intensity: number) => {
    let work = 0;
    for (const s of exercises.flatMap((e) => e.sets)) work += s.durationSeconds ?? 150; // a lifting set incl. rest
    const durationSeconds = Math.round(work + rnd.int(180, 600));
    workouts.push({ title, startedAt, durationSeconds, exercises });
    log.push({ start: startedAt, end: new Date(startedAt.getTime() + durationSeconds * 1000), kind, intensity, title });
  };

  const strengthBlock = (lifts: Lift[], deload: boolean, short: boolean, rusty: number): ExampleExercise[] =>
    (short ? lifts.slice(0, 4) : lifts).map((lift) => {
      const n = Math.max(0, step(lift.id) - rusty);
      const sets: ExampleSet[] = [];
      for (let i = 0; i < lift.sets - (deload ? 1 : 0); i++) {
        let reps = rnd.int(...lift.reps) - (rnd.next() < 0.5 ? Math.floor(i / 2) : 0);
        if (lift.mode === 'reps') {
          reps += Math.floor(n / 4) + (lift.id === PULL_UP ? Math.min(Math.floor(n / 3), 4) : 0);
          sets.push({ reps: Math.max(1, reps) });
        } else {
          const weight = half(half(lift.startKg! + lift.stepKg! * n) * (deload ? 0.85 : 1));
          sets.push({ weight, reps: Math.max(1, reps) });
        }
      }
      return { exerciseId: lift.id, trackingMode: lift.mode, sets };
    });

  const run = (distance: number, secondsPerKm: number, id = RUN): ExampleExercise => ({
    exerciseId: id,
    trackingMode: 'duration_distance',
    sets: [{ distance, durationSeconds: Math.round(distance * pace(secondsPerKm)) }],
  });
  const timed = (id: number, minutes: [number, number]): ExampleExercise => ({
    exerciseId: id,
    trackingMode: 'duration',
    sets: [{ durationSeconds: rnd.int(...minutes) * 60 }],
  });
  const spin = (minutes: number): ExampleExercise => ({
    exerciseId: STATIONARY_BIKE,
    trackingMode: 'duration_distance',
    sets: [{ distance: Math.round(minutes * rnd.uniform(0.42, 0.52) * 10) / 10, durationSeconds: minutes * 60 }],
  });
  const intervals = (): ExampleExercise => {
    const dist = rnd.choice([0.4, 0.4, 0.8]);
    const sets: ExampleSet[] = [{ distance: 1.5, durationSeconds: Math.round(1.5 * pace(400)) }];
    for (let i = rnd.choice([6, 8, 10]); i > 0; i--) sets.push({ distance: dist, durationSeconds: Math.round(dist * pace(290)) });
    sets.push({ distance: 1, durationSeconds: Math.round(pace(420)) });
    return { exerciseId: TREADMILL_RUN, trackingMode: 'duration_distance', sets };
  };
  const longRun = (day: Date) => {
    // Builds towards the half marathon, then settles at 8-12 km
    const weeksToRace = (race.getTime() - day.getTime()) / (7 * DAY_MS);
    const target = weeksToRace > 0 ? Math.min(18, Math.max(8, 18 - weeksToRace * 0.4)) : rnd.uniform(8, 12);
    return run(Math.round(target * rnd.uniform(0.85, 1.05) * 100) / 100, 385);
  };
  const repeat = <T>(n: number, make: () => T) => Array.from({ length: n }, make);
  const conditioning = (): ExampleExercise[] => [
    { exerciseId: 2612, trackingMode: 'duration', sets: repeat(3, () => ({ durationSeconds: rnd.choice([60, 90, 120]) })) }, // jump rope
    { exerciseId: KETTLEBELL_SWING, trackingMode: 'weight_reps', sets: repeat(4, () => ({ weight: 12 + 4 * Math.min(2, Math.floor(step(KETTLEBELL_SWING) / 8)), reps: rnd.int(15, 20) })) },
    { exerciseId: 1760, trackingMode: 'weight_reps', sets: repeat(3, () => ({ weight: 16 + 2 * Math.floor(step(SQUAT) / 6), reps: rnd.int(12, 15) })) }, // dumbbell goblet squat
    { exerciseId: 662, trackingMode: 'reps', sets: repeat(3, () => ({ reps: rnd.int(10, 16) })) }, // push-up
    { exerciseId: 630, trackingMode: 'duration', sets: repeat(3, () => ({ durationSeconds: rnd.choice([30, 40, 45]) })) }, // mountain climber
    { exerciseId: 1160, trackingMode: 'reps', sets: repeat(3, () => ({ reps: rnd.int(8, 12) })) }, // burpee
  ];

  let rotation = 0;
  let weeksSinceBreak = 99;
  let weekIndex = 0;
  for (let monday = addDays(start, -weekday(start)); monday <= end; monday = addDays(monday, 7), weekIndex++) {
    const deload = weekIndex % 8 === 7;
    const summer = month(monday) >= 5 && month(monday) <= 9;

    // How keen this week is: busy, normal or motivated
    const roll = rnd.next();
    let [strength, cardio] =
      roll < 0.15 ? [1, rnd.choice([1, 2])] : roll < 0.25 ? [3, 3] : [rnd.choice([2, 3, 3]), rnd.choice([1, 2, 2])];
    if (isStress(monday)) [strength, cardio] = [Math.max(1, strength - 1), Math.max(1, cardio - 1)];

    const strengthDays = rnd.sample(rnd.next() < 0.7 ? [0, 2, 4] : [0, 1, 3, 4], Math.min(strength, 3));
    const cardioPool = [1, 3, 5, 6].filter((d) => !strengthDays.includes(d));
    const cardioDays = rnd.sample(cardioPool, cardio);
    const rusty = weeksSinceBreak < 2 ? 3 : 0;
    let trained = false;

    for (const wd of [...strengthDays, ...cardioDays].sort((a, b) => a - b)) {
      const day = addDays(monday, wd);
      if (day < start || day > end || isSick(day)) continue;
      if (inRange(day, vacation)) {
        // On holiday: the odd early run
        if ((wd === 1 || wd === 4) && rnd.next() < 0.6) {
          addWorkout('Holiday run', at(day, 7, rnd.int(0, 40)), [run(km(4.5, 7.5), 370)], 'cardio', 1);
          trained = true;
        }
        continue;
      }
      if (inRange(day, christmas) && rnd.next() < 0.5) continue;

      const startedAt =
        wd >= 5 ? at(day, rnd.int(8, 10), rnd.int(0, 59))
        : rnd.next() < 0.25 ? at(day, 6, rnd.int(15, 59))
        : at(day, rnd.int(17, 19), rnd.int(0, 59));
      trained = true;

      if (strengthDays.includes(wd)) {
        const [title, lifts] = SPLIT[rotation++ % SPLIT.length];
        if (rnd.next() < 0.18) {
          // Mixed: bike warm-up before, or a short treadmill run after lifting
          if (rnd.next() < 0.5) {
            const warmUp = spin(10);
            warmUp.sets[0].distance = Math.round(rnd.uniform(4.2, 5.2) * 10) / 10;
            addWorkout(title, startedAt, [warmUp, ...strengthBlock(lifts, deload, true, rusty)], 'mixed', 2);
          } else {
            addWorkout(`${title} + run`, startedAt, [...strengthBlock(lifts, deload, true, rusty), run(km(2, 3), 360, TREADMILL_RUN)], 'mixed', 2);
          }
        } else {
          const heavy = HEAVY_LOWER.has(title);
          addWorkout(title, startedAt, strengthBlock(lifts, deload, false, rusty), heavy ? 'strength_heavy' : 'strength', heavy && !deload ? 3 : 2);
        }
        continue;
      }

      if (day.getTime() === race.getTime()) {
        addWorkout('Half marathon', at(day, 9, 0), [run(21.1, 355)], 'cardio', 3);
      } else if (day > race && day.getTime() - race.getTime() < 7 * DAY_MS) {
        addWorkout('Recovery walk', startedAt, [timed(INCLINE_WALK, [30, 45])], 'cardio', 1);
      } else if (wd === 6 && rnd.next() < 0.7) {
        addWorkout('Long run', startedAt, [longRun(day)], 'cardio', 3);
      } else if (rnd.next() < 0.15) {
        addWorkout('Conditioning', startedAt, conditioning(), 'mixed', 3);
      } else {
        const options: [string, () => ExampleExercise, number, number][] = [
          ['Easy run', () => run(km(4.5, 7.5), 370, summer || rnd.next() < 0.3 ? RUN : TREADMILL_RUN), 1, summer ? 4 : 2],
          ['Intervals', intervals, 3, 2],
          ['Spin', () => spin(rnd.int(30, 50)), 2, summer ? 1 : 3],
          ['Incline walk', () => timed(INCLINE_WALK, [30, 45]), 1, summer ? 1 : 2],
          ['Elliptical', () => timed(ELLIPTICAL, [25, 40]), 1, 1],
          ['Stairs', () => timed(STEPMILL, [15, 25]), 2, 1],
        ];
        const [title, make, intensity] = rnd.weighted(options, options.map((o) => o[3]));
        addWorkout(title, startedAt, [make()], 'cardio', intensity);
      }
    }

    // Lifts move up a step every ~7 weeks; a week off costs some of it back
    if (trained && !deload) {
      for (const lift of SPLIT.flatMap(([, lifts]) => lifts)) {
        if (rnd.next() < 0.15) progress.set(lift.id, step(lift.id) + 1);
      }
      progress.set(KETTLEBELL_SWING, step(KETTLEBELL_SWING) + 1);
      fitness = Math.min(1, fitness + 0.025);
      weeksSinceBreak++;
    } else if (!trained) {
      for (const [id, n] of progress) progress.set(id, Math.max(0, n - 1));
      fitness = Math.max(0, fitness - 0.03);
      weeksSinceBreak = 0;
    }
  }

  // ---------------------------------------------------------------- headaches

  const pick = <T>(items: readonly T[], lo: number, hi: number) => rnd.sample(items, rnd.int(lo, hi));

  const describe = (kind: HeadacheKind) => {
    switch (kind) {
      case 'exertion':
        return {
          pain: rnd.int(4, 7), hours: [1, 4],
          triggers: ['Cardio', ...pick(['Dehydration', 'Physical strain'], 0, 2)],
          locations: rnd.choice([['Back of head'], ['Whole head'], ['Back of head', 'Scattered, top of head']]),
          symptoms: ['Throbbing', ...pick(['Dizziness', 'Fatigue', 'Light sensitivity'], 0, 2)],
          reliefMeasures: pick(['Hydration', 'Rest in a quiet, dark room', 'Cold compress'], 1, 2),
        };
      case 'strain':
        return {
          pain: rnd.int(3, 6), hours: [2, 6],
          triggers: ['Physical strain', ...pick(['Tense muscles', 'Dehydration'], 0, 1)],
          locations: rnd.choice([['Neck to temple'], ['Scattered, scalp and neck'], ['Back of head', 'Neck to temple']]),
          symptoms: pick(['Neck or shoulder stiffness', 'Neck pain', 'Fatigue'], 1, 2),
          reliefMeasures: pick(['Warm compress', 'Massage', 'Hydration'], 1, 2),
        };
      case 'migraine': {
        const left = rnd.next() < 0.5;
        const symptoms = ['Light sensitivity', 'Throbbing', ...pick(['Nausea', 'Sound sensitivity', 'Smell sensitivity', 'Mood changes'], 1, 3)];
        if (rnd.next() < 0.25) symptoms.push('Aura', ...(rnd.next() < 0.3 ? ['Vision loss'] : []));
        if (rnd.next() < 0.1) symptoms.push('Vomiting');
        return {
          pain: rnd.int(6, 9), hours: [6, 26],
          triggers: ['Hormonal shifts', ...pick(['Lack of sleep', 'Bright lights', 'Stress', 'Strong smells'], 0, 2)],
          locations: [left ? 'Left side' : 'Right side', ...(rnd.next() < 0.6 ? [left ? 'Behind left eye' : 'Behind right eye'] : [])],
          symptoms,
          reliefMeasures: pick(['Rest in a quiet, dark room', 'Cold compress', 'Caffeine'], 1, 3),
        };
      }
      case 'tension':
        return {
          pain: rnd.int(3, 6), hours: [2, 8],
          triggers: pick(['Stress', 'Lack of sleep', 'Tense muscles', 'Hunger', 'Bright lights', 'Loud sounds', 'Dehydration'], 1, 3),
          locations: rnd.choice([['Forehead band'], ['Forehead band', 'Neck to temple'], ['Scattered, top of head'], ['Whole head']]),
          symptoms: pick(['Trouble concentrating', 'Neck or shoulder stiffness', 'Fatigue', 'Mood changes'], 1, 2),
          reliefMeasures: pick(['Hydration', 'Caffeine', 'Massage', 'Warm compress', 'Aromatherapy'], 1, 2),
        };
      case 'weekend':
        return {
          pain: rnd.int(3, 6), hours: [3, 8],
          triggers: pick(['Alcohol', 'Caffeine', 'Lack of sleep', 'Dehydration'], 1, 2),
          locations: rnd.choice([['Forehead band'], ['Whole head'], ['Behind left eye', 'Behind right eye']]),
          symptoms: pick(['Fatigue', 'Light sensitivity', 'Nausea'], 1, 2),
          reliefMeasures: pick(['Hydration', 'Caffeine', 'Rest in a quiet, dark room'], 1, 2),
        };
      case 'sinus':
        return {
          pain: rnd.int(4, 6), hours: [4, 10],
          triggers: ['Infection'],
          locations: ['Sinus area', ...(rnd.next() < 0.5 ? ['Forehead band'] : [])],
          symptoms: ['Congested nose', ...pick(['Fever', 'Fatigue', 'Throbbing'], 0, 2)],
          reliefMeasures: pick(['Warm compress', 'Hydration', 'Rest in a quiet, dark room'], 1, 2),
        };
    }
  };

  const headaches: ExampleHeadache[] = [];
  const busy: Range[] = []; // logged headaches plus an 8 hour cool-down, so they never overlap

  const addHeadache = (startedAt: Date, kind: HeadacheKind) => {
    const h = describe(kind);
    const endedAt = addMinutes(startedAt, rnd.int(h.hours[0] * 60, h.hours[1] * 60));
    if (startedAt >= windowEnd || endedAt >= now) return;
    const coolDown = addMinutes(endedAt, 8 * 60);
    if (busy.some(([from, to]) => startedAt < to && from < coolDown)) return;
    busy.push([startedAt, coolDown]);
    headaches.push({
      startedAt,
      endedAt: rnd.next() < 0.03 ? null : endedAt, // occasionally forgot to log the end
      painLevel: h.pain,
      notes: rnd.next() < 0.35 ? rnd.choice(NOTES[kind]) : null,
      triggers: h.triggers,
      symptoms: h.symptoms,
      reliefMeasures: rnd.next() < 0.1 ? [] : h.reliefMeasures,
      locations: h.locations,
    });
  };

  // Hard cardio (worse in summer heat) and heavy leg days make a headache that day more likely
  for (const w of log) {
    if ((w.kind === 'cardio' || w.kind === 'mixed') && w.intensity >= 3) {
      const p = (w.title === 'Intervals' || w.title === 'Half marathon' ? 0.5 : 0.32) + ([6, 7, 8].includes(w.start.getUTCMonth() + 1) ? 0.1 : 0);
      if (rnd.next() < p) addHeadache(addMinutes(w.end, rnd.int(10, 180)), 'exertion');
    } else if (w.kind === 'mixed' && rnd.next() < 0.15) {
      addHeadache(addMinutes(w.end, rnd.int(30, 240)), 'exertion');
    } else if (w.kind === 'strength_heavy' && rnd.next() < 0.2) {
      addHeadache(addMinutes(w.end, rnd.int(60, 360)), 'strain');
    } else if ((w.kind === 'cardio' || w.kind === 'strength') && rnd.next() < 0.04) {
      addHeadache(addMinutes(w.end, rnd.int(60, 300)), 'tension');
    }
  }

  // Hormonal cycle of 26-31 days, with a migraine around its start most months
  for (let cycle = addDays(start, 13); cycle <= end; cycle = addDays(cycle, rnd.int(26, 31))) {
    if (rnd.next() < 0.7) {
      const day = addDays(cycle, rnd.choice([-2, -1, -1, 0, 0, 1]));
      addHeadache(at(day, rnd.choice([6, 7, 13, 15, 16, 20]), rnd.int(0, 59)), 'migraine');
    }
  }

  // Everyday background: stress periods, winter, early week, weekends and colds
  for (let day = start; day <= end; day = addDays(day, 1)) {
    let tension = 0.045 + (isStress(day) ? 0.13 : 0) + ([11, 12, 1, 2].includes(month(day)) ? 0.02 : 0);
    if (inRange(day, vacation)) tension = 0.01;
    if (weekday(day) <= 1) tension += 0.015;
    if (rnd.next() < tension) addHeadache(at(day, rnd.choice([10, 11, 13, 14, 15, 16, 17]), rnd.int(0, 59)), 'tension');
    if (weekday(day) >= 5 && rnd.next() < 0.035) addHeadache(at(day, rnd.int(9, 12), rnd.int(0, 59)), 'weekend');
    if (isSick(day) && rnd.next() < 0.45) addHeadache(at(day, rnd.int(8, 18), rnd.int(0, 59)), 'sinus');
  }

  headaches.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  return { workouts, headaches };
}
