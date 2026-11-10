/** Fewest workouts a feature needs both with and without it before it is compared. */
export const MIN_WORKOUTS = 3;
/** Features whose workouts overlap at least this much (shared / either) are done together and can't be told apart. */
const TOGETHER_OVERLAP = 0.9;

/** Something a workout can train: one exercise, or a muscle group worked by its exercises. */
export interface Feature {
  key: string;
  name: string;
  kind: 'exercise' | 'muscleGroup';
}

/** A workout whose headache window is over: how much it trained each feature, and whether a headache followed. */
export interface Session {
  /** Feature key to dose. 1 means trained once as a primary muscle or exercise; 0.5 is a secondary muscle. */
  doses: Map<string, number>;
  headache: boolean;
}

export interface Count {
  workouts: number;
  withHeadache: number;
}

/** A feature, or features always done together, with how often headaches followed workouts with and without it. */
export interface Suspect {
  /** The feature done most often first, then those done together with it. */
  features: Feature[];
  /** Workouts that trained it at a dose of at least 1. */
  exposed: Count;
  /** Workouts that didn't train it at all. Workouts with a smaller dose count as neither. */
  unexposed: Count;
  /** Chance the headache rate with it is higher than without it, from 0 to 1. */
  probability: number;
}

/**
 * Ranks features by how likely they raise the chance of a headache after a workout, most likely first.
 *
 * Each feature's headache rate with and without it gets a Beta(1, 1) prior, so a feature with few workouts is
 * pulled towards an even chance instead of ranking high on a lucky 2 out of 2. Features done in (almost) the
 * same workouts are merged, since no amount of data can separate them; varying the routine is the only way.
 */
export function rankSuspects(sessions: Session[], features: Feature[], minWorkouts = MIN_WORKOUTS): Suspect[] {
  const exposedIn = new Map(features.map(f => [
    f.key,
    new Set(sessions.flatMap((s, i) => ((s.doses.get(f.key) ?? 0) >= 1 ? [i] : []))),
  ]));

  // Most done first, muscle groups before exercises, so each group of features is named by its broadest one
  const ordered = [...features].sort((a, b) =>
    exposedIn.get(b.key)!.size - exposedIn.get(a.key)!.size || Number(b.kind === 'muscleGroup') - Number(a.kind === 'muscleGroup'),
  );
  const together: Feature[][] = [];
  for (const feature of ordered) {
    const own = exposedIn.get(feature.key)!;
    if (!own.size) continue;
    const match = together.find(t => overlap(own, exposedIn.get(t[0].key)!) >= TOGETHER_OVERLAP);
    if (match) match.push(feature);
    else together.push([feature]);
  }

  const suspects: Suspect[] = [];
  for (const group of together) {
    const key = group[0].key;
    const exposed = count(sessions.filter(s => (s.doses.get(key) ?? 0) >= 1));
    const unexposed = count(sessions.filter(s => !s.doses.get(key)));
    if (exposed.workouts < minWorkouts || unexposed.workouts < minWorkouts) continue;
    suspects.push({ features: group, exposed, unexposed, probability: probabilityHigher(exposed, unexposed) });
  }
  return suspects.sort((a, b) => b.probability - a.probability || b.exposed.workouts - a.exposed.workouts);
}

/** Features done in nearly every workout, which leaves too few workouts without them to compare against. */
export function alwaysDone(sessions: Session[], features: Feature[], minWorkouts = MIN_WORKOUTS): Feature[] {
  return features.filter(f => {
    const without = sessions.filter(s => !s.doses.get(f.key)).length;
    return sessions.length - without >= minWorkouts && without < minWorkouts;
  });
}

function count(sessions: Session[]): Count {
  return { workouts: sessions.length, withHeadache: sessions.filter(s => s.headache).length };
}

function overlap(a: Set<number>, b: Set<number>): number {
  let shared = 0;
  for (const i of a) if (b.has(i)) shared++;
  return shared / (a.size + b.size - shared);
}

/**
 * P(rate with > rate without), each rate Beta(1 + headaches, 1 + workouts without one). Exact for whole-number
 * parameters (Evan Miller, "Formulas for Bayesian A/B Testing"), so the result doesn't change between renders.
 */
export function probabilityHigher(exposed: Count, unexposed: Count): number {
  const aB = 1 + exposed.withHeadache;
  const bB = 1 + exposed.workouts - exposed.withHeadache;
  const aA = 1 + unexposed.withHeadache;
  const bA = 1 + unexposed.workouts - unexposed.withHeadache;

  let total = 0;
  for (let i = 0; i < aB; i++) {
    total += Math.exp(logBeta(aA + i, bA + bB) - Math.log(bB + i) - logBeta(1 + i, bB) - logBeta(aA, bA));
  }
  return Math.min(1, Math.max(0, total));
}

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** ln Γ(x) for x >= 1 (Lanczos approximation, g = 7). */
function logGamma(x: number): number {
  x -= 1;
  let sum = LANCZOS[0];
  for (let i = 1; i < LANCZOS.length; i++) sum += LANCZOS[i] / (x + i);
  const t = x + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum);
}
