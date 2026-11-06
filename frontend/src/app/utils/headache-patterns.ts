import { LookupOption } from '../models/headache.model';

/**
 * Which well-known headache pattern a logged headache resembles, loosely following the ICHD-3 descriptions.
 * This only compares what was logged with typical features of each pattern; it is not a diagnosis.
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

const LEFT = ['Left side', 'Behind left eye'];
const RIGHT = ['Right side', 'Behind right eye'];
const BOTH_SIDES = ['Forehead band', 'Whole head', 'Scattered, top of head'];
const NECK_AREA = ['Back of head', 'Scattered, scalp and neck', 'Neck to temple'];
const TENSION_TRIGGERS = ['Stress', 'Tense muscles', 'Lack of sleep', 'Loud sounds', 'Bright lights', 'Hunger'];

/** What a headache needs for matching. The list response has all of it; relief measures aren't used. */
export interface PatternInput {
  startedAt: string;
  endedAt: string | null;
  painLevel: number;
  locations?: LookupOption[];
  symptoms?: LookupOption[];
  triggers?: LookupOption[];
}

interface Facts {
  locations: Set<string>;
  symptoms: Set<string>;
  triggers: Set<string>;
  hours: number | null;
  pain: number;
}

interface Rule {
  weight: number;
  /** Shown when the rule matched, e.g. "throbbing". */
  label: string;
  test: (f: Facts) => boolean;
}

interface Pattern {
  rules: Rule[];
  /** Without this, the pattern isn't considered: it would otherwise score on the absence of other features. */
  requires?: (f: Facts) => boolean;
}

const any = (set: Set<string>, names: string[]) => names.some(n => set.has(n));
const only = (set: Set<string>, names: string[]) => set.size > 0 && [...set].every(n => names.includes(n));
const oneSide = (f: Facts) => only(f.locations, LEFT) || only(f.locations, RIGHT);
const lasted = (f: Facts, min: number, max: number) => f.hours !== null && f.hours >= min && f.hours <= max;

const PATTERNS: Record<PatternKey, Pattern> = {
  migraine: {
    rules: [
      { weight: 2, label: 'pain on one side', test: oneSide },
      { weight: 1, label: 'throbbing', test: f => f.symptoms.has('Throbbing') },
      { weight: 1, label: 'moderate to severe pain', test: f => f.pain >= 5 },
      { weight: 2, label: 'nausea or vomiting', test: f => any(f.symptoms, ['Nausea', 'Vomiting']) },
      { weight: 0.5, label: 'sensitive to light', test: f => f.symptoms.has('Light sensitivity') },
      {
        weight: 1,
        label: 'sensitive to sound or smell',
        test: f => any(f.symptoms, ['Sound sensitivity', 'Smell sensitivity']),
      },
      { weight: 1, label: 'aura', test: f => f.symptoms.has('Aura') },
      { weight: 1, label: 'worse with movement', test: f => f.symptoms.has('Worse with movement') },
      { weight: 1, label: 'lasted 4 to 72 hours', test: f => lasted(f, 4, 72) },
      { weight: 1, label: 'hormonal shift', test: f => f.triggers.has('Hormonal shifts') },
    ],
  },
  tension: {
    // Most of tension's weight is for features being absent, so a location alone would otherwise be enough.
    requires: f => f.symptoms.has('Pressing or tightening') || any(f.triggers, TENSION_TRIGGERS),
    rules: [
      { weight: 2, label: 'pain on both sides', test: f => any(f.locations, BOTH_SIDES) && !oneSide(f) },
      { weight: 1.5, label: 'pressing or tightening', test: f => f.symptoms.has('Pressing or tightening') },
      { weight: 1, label: 'not throbbing', test: f => !f.symptoms.has('Throbbing') },
      { weight: 1, label: 'mild to moderate pain', test: f => f.pain <= 6 },
      { weight: 1.5, label: 'no nausea', test: f => !any(f.symptoms, ['Nausea', 'Vomiting']) },
      {
        weight: 1,
        label: 'stress, tension or tiredness',
        test: f => any(f.triggers, TENSION_TRIGGERS),
      },
      {
        weight: 0.5,
        label: 'trouble concentrating or mood changes',
        test: f => any(f.symptoms, ['Trouble concentrating', 'Mood changes']),
      },
    ],
  },
  cluster: {
    requires: f => any(f.symptoms, ['Watery or red eye', 'Restlessness']),
    rules: [
      {
        weight: 2,
        label: 'around one eye',
        test: f => oneSide(f) && any(f.locations, ['Behind left eye', 'Behind right eye']),
      },
      { weight: 1, label: 'severe pain', test: f => f.pain >= 7 },
      { weight: 1.5, label: 'lasted 15 minutes to 3 hours', test: f => lasted(f, 0.25, 3) },
      { weight: 2, label: 'watery or red eye', test: f => f.symptoms.has('Watery or red eye') },
      { weight: 0.5, label: 'congested nose', test: f => f.symptoms.has('Congested nose') },
      { weight: 1.5, label: 'restlessness', test: f => f.symptoms.has('Restlessness') },
    ],
  },
  exercise: {
    rules: [
      { weight: 3, label: 'came on with exercise or strain', test: f => any(f.triggers, ['Cardio', 'Physical strain']) },
      { weight: 1, label: 'throbbing', test: f => f.symptoms.has('Throbbing') },
      { weight: 1, label: 'lasted under 4 hours', test: f => f.hours !== null && f.hours < 4 },
      { weight: 1, label: 'dizziness', test: f => f.symptoms.has('Dizziness') },
      {
        weight: 1,
        label: 'back, top or whole head',
        test: f => any(f.locations, ['Back of head', 'Scattered, top of head', 'Whole head']),
      },
    ],
  },
  neck: {
    rules: [
      { weight: 2, label: 'back of head or neck', test: f => any(f.locations, NECK_AREA) },
      { weight: 2.5, label: 'neck pain or stiffness', test: f => any(f.symptoms, NECK_SYMPTOMS) },
      { weight: 2, label: 'worse when moving neck', test: f => f.symptoms.has('Worse when moving neck') },
      {
        weight: 1,
        label: 'physical strain or tense muscles',
        test: f => any(f.triggers, ['Physical strain', 'Tense muscles']),
      },
      { weight: 0.5, label: 'not throbbing', test: f => !f.symptoms.has('Throbbing') },
    ],
  },
  sinus: {
    requires: f => f.locations.has('Sinus area') || f.symptoms.has('Congested nose'),
    rules: [
      { weight: 2, label: 'sinus area', test: f => f.locations.has('Sinus area') },
      { weight: 2, label: 'congested nose', test: f => f.symptoms.has('Congested nose') },
      { weight: 1, label: 'fever', test: f => f.symptoms.has('Fever') },
      { weight: 2, label: 'infection', test: f => f.triggers.has('Infection') },
    ],
  },
};

export interface PatternScore {
  key: PatternKey;
  /** Share of the pattern's weight that matched, from 0 to 1. */
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
  const f = facts(headache);
  return (Object.keys(PATTERNS) as PatternKey[])
    .map(key => {
      const { rules, requires } = PATTERNS[key];
      if (requires && !requires(f)) return { key, score: 0, matched: [] };
      const hits = rules.filter(r => r.test(f));
      const total = rules.reduce((sum, r) => sum + r.weight, 0);
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

  const scores = scorePatterns(headache);
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

function facts(h: PatternInput): Facts {
  const names = (options?: LookupOption[]) => new Set((options ?? []).map(o => o.name));
  return {
    locations: names(h.locations),
    symptoms: names(h.symptoms),
    triggers: names(h.triggers),
    hours: h.endedAt ? (Date.parse(h.endedAt) - Date.parse(h.startedAt)) / 3_600_000 : null,
    pain: h.painLevel,
  };
}
