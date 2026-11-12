import { InsightsCategory } from './insights';
import { HistorySummary } from '../../models/user.model';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** How much history a category needs before its charts say something reliable. */
export interface Threshold {
  headaches: number;
  workouts: number;
  weeks: number;
}

/** Rough rules of thumb, not a statistical guarantee. Correlations and analysis need both sources and a longer history. */
export const THRESHOLDS: Record<InsightsCategory, Threshold> = {
  headaches: { headaches: 5, workouts: 0, weeks: 2 },
  workouts: { headaches: 0, workouts: 5, weeks: 2 },
  correlations: { headaches: 10, workouts: 10, weeks: 4 },
  analysis: { headaches: 10, workouts: 10, weeks: 4 },
};

/** What a user has logged so far, and whether it reaches a category's threshold. */
export interface Readiness {
  headaches: number;
  workouts: number;
  /** Whole weeks between the earliest entry of the sources the category needs and now. */
  weeks: number;
  threshold: Threshold;
  ready: boolean;
}

/** Whole weeks from `since` until `now`, 0 when there is no entry. */
export function weeksSince(since: number | undefined, now = Date.now()): number {
  return since === undefined ? 0 : Math.max(0, Math.floor((now - since) / WEEK_MS));
}

export function readiness(category: InsightsCategory, { headaches, workouts }: HistorySummary, now = Date.now()): Readiness {
  const threshold = THRESHOLDS[category];
  const needed = [
    ...(threshold.headaches ? [headaches.firstStartedAt] : []),
    ...(threshold.workouts ? [workouts.firstStartedAt] : []),
  ]
    .filter((first): first is string => first !== null)
    .map(first => Date.parse(first));
  const weeks = weeksSince(needed.length ? Math.min(...needed) : undefined, now);

  return {
    headaches: headaches.count,
    workouts: workouts.count,
    weeks,
    threshold,
    ready: headaches.count >= threshold.headaches && workouts.count >= threshold.workouts && weeks >= threshold.weeks,
  };
}
