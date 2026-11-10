import { LookupOption } from '../models/headache.model';
import { IntakeEffect, MedicationUse } from '../models/medication.model';

/**
 * Which well-known headache pattern a logged headache resembles, based on the ICHD-3 criteria for each type.
 * Each pattern needs the features ICHD-3 defines it by; the remaining features only change how closely it matches.
 * It looks at one headache at a time, so it can't check how often attacks happen. It is not a diagnosis.
 */
export type PatternKey = 'migraine' | 'tension' | 'cluster' | 'exercise' | 'neck' | 'sinus';

export const PATTERN_NAMES: Record<PatternKey, string> = {
  migraine: 'Migraine-like',
  tension: 'Tension-type-like',
  cluster: 'Cluster-like',
  exercise: 'Exercise-related',
  neck: 'Neck-related',
  sinus: 'Sinus-related',
};

/** Lowest score, from 0 to 1, for a headache to resemble a pattern at all. */
const MIN_SCORE = 0.55;
/** Patterns scoring this close to the best one are shown together as a mix. */
const MIXED_GAP = 0.08;

/** Symptoms that can need a doctor rather than a pattern label. Fever only counts together with a stiff neck. */
const WARNING_SYMPTOMS = ['Trouble speaking', 'Vision loss', 'Confusion', 'Sudden, severe onset'];
const NECK_SYMPTOMS = ['Neck pain', 'Neck or shoulder stiffness'];
const NAUSEA = ['Nausea', 'Vomiting'];
/** "Aura" is kept for headaches logged before the specific aura symptoms existed. */
const AURA = ['Aura', 'Zigzag lines or flashing lights', 'Spreading tingling or numbness'];
/** Eye and nose signs that come with cluster headache, on the same side as the pain. */
const AUTONOMIC = ['Watery or red eye', 'Congested nose', 'Runny nose', 'Drooping or swollen eyelid', 'Forehead or face sweating'];
const NOSE = ['Congested nose', 'Runny nose'];

const LEFT = ['Left side', 'Behind left eye'];
const RIGHT = ['Right side', 'Behind right eye'];
const EYES = ['Behind left eye', 'Behind right eye'];
const BOTH_SIDES = ['Forehead band', 'Whole head', 'Scattered, top of head'];
const NECK_AREA = ['Back of head', 'Scattered, scalp and neck', 'Neck to temple'];
const TENSION_TRIGGERS = ['Stress', 'Tense muscles', 'Lack of sleep'];
const EXERCISE_TRIGGERS = ['Cardio', 'Physical strain'];

/** Pain levels from 0 to 10 grouped like ICHD-3's mild, moderate and severe. */
const MODERATE = 4;
const SEVERE = 7;

/** What a headache needs for matching. The list response has all of it; relief measures aren't used. */
export interface PatternInput {
  startedAt: string;
  endedAt: string | null;
  painLevel: number;
  locations?: LookupOption[];
  symptoms?: LookupOption[];
  triggers?: LookupOption[];
  intakes?: { effect: IntakeEffect | null; medication?: { use: MedicationUse } }[];
}

interface Facts {
  locations: Set<string>;
  symptoms: Set<string>;
  triggers: Set<string>;
  /** How long it lasted untreated, or null when it hasn't ended or a dose may have shortened it. */
  hours: number | null;
  pain: number;
}

interface Rule {
  weight: number;
  /** Shown when the rule matched, e.g. "throbbing". */
  label: string;
  /** Null when it can't be told from what was logged; the rule then doesn't count either way. */
  test: (f: Facts) => boolean | null;
}

interface Pattern {
  /** The features the pattern is defined by. Without them, it isn't considered at all. */
  requires: (f: Facts) => boolean;
  rules: Rule[];
}

const any = (set: Set<string>, names: string[]) => names.some(n => set.has(n));
const only = (set: Set<string>, names: string[]) => set.size > 0 && [...set].every(n => names.includes(n));
const atLeast = (n: number, results: boolean[]) => results.filter(Boolean).length >= n;
const lasted = (f: Facts, min: number, max: number) => (f.hours === null ? null : f.hours >= min && f.hours <= max);

const oneSide = (f: Facts) => only(f.locations, LEFT) || only(f.locations, RIGHT);
const bothSides = (f: Facts) => any(f.locations, BOTH_SIDES);
const throbbing = (f: Facts) => f.symptoms.has('Throbbing');
const pressing = (f: Facts) => f.symptoms.has('Pressing or tightening');
const worseWithMovement = (f: Facts) => f.symptoms.has('Worse with movement');
const nausea = (f: Facts) => any(f.symptoms, NAUSEA);
const lightAndSound = (f: Facts) => f.symptoms.has('Light sensitivity') && f.symptoms.has('Sound sensitivity');
const aura = (f: Facts) => any(f.symptoms, AURA);

/** At least 2 of the 4 pain features of migraine. */
const migrainePain = (f: Facts) => atLeast(2, [oneSide(f), throbbing(f), f.pain >= MODERATE, worseWithMovement(f)]);
/**
 * At least 2 of the 4 pain features of tension-type headache, one of them logged as present: "not worse with
 * movement" and mild pain fit almost any headache, as they're just what's left when nothing else was logged.
 */
const tensionPain = (f: Facts) =>
  atLeast(2, [bothSides(f), pressing(f), f.pain > 0 && f.pain < SEVERE, !worseWithMovement(f)]) && (bothSides(f) || pressing(f));

const PATTERNS: Record<PatternKey, Pattern> = {
  migraine: {
    // Nausea, or light and sound sensitivity together. Aura stands in for them, as migraine with aura doesn't need them.
    requires: f => migrainePain(f) && (nausea(f) || lightAndSound(f) || aura(f)),
    rules: [
      { weight: 2, label: 'pain on one side', test: oneSide },
      { weight: 1, label: 'throbbing', test: throbbing },
      { weight: 1, label: 'moderate to severe pain', test: f => f.pain >= MODERATE },
      { weight: 1, label: 'worse with movement', test: worseWithMovement },
      { weight: 2, label: 'nausea or vomiting', test: nausea },
      { weight: 1.5, label: 'sensitive to light and sound', test: lightAndSound },
      { weight: 1, label: 'aura', test: aura },
      { weight: 1, label: 'lasted 4 to 72 hours', test: f => lasted(f, 4, 72) },
      { weight: 0.5, label: 'hormonal shift', test: f => f.triggers.has('Hormonal shifts') },
    ],
  },
  tension: {
    // No nausea, and at most one of light or sound sensitivity. These only mean something once symptoms were logged.
    requires: f => f.symptoms.size > 0 && tensionPain(f) && !nausea(f) && !lightAndSound(f),
    rules: [
      { weight: 2, label: 'pain on both sides', test: bothSides },
      { weight: 1.5, label: 'pressing or tightening', test: pressing },
      { weight: 1, label: 'not throbbing', test: f => !throbbing(f) },
      { weight: 1, label: 'mild to moderate pain', test: f => f.pain < SEVERE },
      { weight: 1, label: 'not worse with movement', test: f => !worseWithMovement(f) },
      { weight: 1.5, label: 'no nausea', test: f => !nausea(f) },
      { weight: 1, label: 'lasted 30 minutes to 7 days', test: f => lasted(f, 0.5, 168) },
      { weight: 0.5, label: 'stress, tension or tiredness', test: f => any(f.triggers, TENSION_TRIGGERS) },
    ],
  },
  cluster: {
    // Severe pain on one side, with an eye or nose sign or restlessness.
    requires: f =>
      oneSide(f) && f.pain >= SEVERE && (any(f.symptoms, AUTONOMIC) || f.symptoms.has('Restlessness')),
    rules: [
      { weight: 2, label: 'around one eye', test: f => any(f.locations, EYES) },
      { weight: 1, label: 'severe pain', test: f => f.pain >= SEVERE },
      { weight: 1.5, label: 'lasted 15 minutes to 3 hours', test: f => lasted(f, 0.25, 3) },
      { weight: 2, label: 'eye or nose signs', test: f => any(f.symptoms, AUTONOMIC) },
      { weight: 1.5, label: 'restlessness', test: f => f.symptoms.has('Restlessness') },
      { weight: 0.5, label: 'woke from sleep', test: f => f.symptoms.has('Woke me from sleep') },
    ],
  },
  exercise: {
    // Brought on by exercise and gone within 2 days. Coughing or straining is a different headache type.
    requires: f => any(f.triggers, EXERCISE_TRIGGERS) && lasted(f, 0, 48) !== false,
    rules: [
      { weight: 3, label: 'came on with exercise or strain', test: f => any(f.triggers, EXERCISE_TRIGGERS) },
      { weight: 1, label: 'throbbing', test: throbbing },
      { weight: 1, label: 'lasted under 2 days', test: f => lasted(f, 0, 48) },
    ],
  },
  neck: {
    requires: f => any(f.locations, NECK_AREA) && any(f.symptoms, NECK_SYMPTOMS),
    rules: [
      { weight: 2, label: 'back of head or neck', test: f => any(f.locations, NECK_AREA) },
      { weight: 2.5, label: 'neck pain or stiffness', test: f => any(f.symptoms, NECK_SYMPTOMS) },
      { weight: 2, label: 'worse when moving neck', test: f => f.symptoms.has('Worse when moving neck') },
      {
        weight: 1,
        label: 'physical strain or tense muscles',
        test: f => any(f.triggers, ['Physical strain', 'Tense muscles']),
      },
      { weight: 0.5, label: 'not throbbing', test: f => !throbbing(f) },
    ],
  },
  sinus: {
    requires: f => f.locations.has('Sinus area') && any(f.symptoms, NOSE),
    rules: [
      { weight: 2, label: 'sinus area', test: f => f.locations.has('Sinus area') },
      { weight: 2, label: 'congested or runny nose', test: f => any(f.symptoms, NOSE) },
      { weight: 1, label: 'fever', test: f => f.symptoms.has('Fever') },
      { weight: 2, label: 'infection', test: f => f.triggers.has('Infection') },
    ],
  },
};

export interface PatternScore {
  key: PatternKey;
  /** Share of the weight of the features that could be told which matched, from 0 to 1. */
  score: number;
  /** Labels of the features that matched. */
  matched: string[];
}

export type PatternMatch =
  /** Symptoms that can need a doctor were logged, so no pattern is suggested. */
  | { kind: 'warning'; symptoms: string[] }
  /** Neither a location nor a symptom was logged. */
  | { kind: 'too-little' }
  /** No pattern scored high enough. */
  | { kind: 'unclear'; scores: PatternScore[] }
  /** One pattern, or a mix of the patterns scoring close to the best one, best first. */
  | { kind: 'match'; patterns: PatternScore[]; scores: PatternScore[] };

/** Every pattern's score for a headache, best first. */
export function scorePatterns(headache: PatternInput): PatternScore[] {
  return scoreFacts(facts(headache));
}

function scoreFacts(f: Facts): PatternScore[] {
  return (Object.keys(PATTERNS) as PatternKey[])
    .map(key => {
      const { rules, requires } = PATTERNS[key];
      if (!requires(f)) return { key, score: 0, matched: [] };
      const results = rules.map(r => ({ rule: r, result: r.test(f) }));
      const known = results.filter(r => r.result !== null);
      const hits = known.filter(r => r.result).map(r => r.rule);
      const total = known.reduce((sum, r) => sum + r.rule.weight, 0);
      return { key, score: hits.reduce((sum, r) => sum + r.weight, 0) / total, matched: hits.map(r => r.label) };
    })
    .sort((a, b) => b.score - a.score);
}

export function matchPattern(headache: PatternInput): PatternMatch {
  const f = facts(headache);
  const warnings = WARNING_SYMPTOMS.filter(s => f.symptoms.has(s));
  if (f.symptoms.has('Fever') && any(f.symptoms, NECK_SYMPTOMS)) warnings.push('Fever with a stiff or painful neck');
  if (warnings.length) return { kind: 'warning', symptoms: warnings };

  if (!f.locations.size && !f.symptoms.size) return { kind: 'too-little' };

  const scores = scoreFacts(f);
  if (scores[0].score < MIN_SCORE) return { kind: 'unclear', scores };
  const patterns = scores.filter(s => s.score >= MIN_SCORE && scores[0].score - s.score < MIXED_GAP);
  return { kind: 'match', patterns, scores };
}

/** "Migraine-like" or "Neck-related and tension-type-like" for a match. */
export function patternLabel(patterns: PatternScore[]): string {
  return patterns
    .map((p, i) => (i === 0 ? PATTERN_NAMES[p.key] : PATTERN_NAMES[p.key].toLowerCase()))
    .join(' and ');
}

/**
 * ICHD-3 durations are for headaches left untreated or treated without success. A dose that helped, or whose
 * effect wasn't logged, may have shortened it, so the duration is then unknown. Preventives don't count.
 */
function untreatedHours(h: PatternInput): number | null {
  if (!h.endedAt) return null;
  const treated = (h.intakes ?? []).some(i => i.medication?.use !== 'preventive' && i.effect !== 'none');
  return treated ? null : (Date.parse(h.endedAt) - Date.parse(h.startedAt)) / 3_600_000;
}

function facts(h: PatternInput): Facts {
  const names = (options?: LookupOption[]) => new Set((options ?? []).map(o => o.name));
  return {
    locations: names(h.locations),
    symptoms: names(h.symptoms),
    triggers: names(h.triggers),
    hours: untreatedHours(h),
    pain: h.painLevel,
  };
}
