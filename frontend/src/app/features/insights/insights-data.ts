import { computed, DestroyRef, inject, Injectable, linkedSignal, Signal, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HeadacheService } from '../../services/headache.service';
import { WorkoutService } from '../../services/workout.service';
import { UserService } from '../../services/user.service';
import { Headache } from '../../models/headache.model';
import { Workout } from '../../models/workout.model';
import { startOfWeek } from '../../utils/date';
import { Period, periodLabel, periodStart, RANGES } from './period';
import { InsightsCategory } from './insights';
import { Readiness, readiness } from './readiness';

const HOUR_MS = 60 * 60 * 1000;
/** Headaches starting from a workout's start until this many hours after it ends are linked to it. */
const WINDOW_HOURS = 24;

/** Entries of each loaded source, newest first. */
interface Loaded {
  headaches: Headache[];
  workouts: Workout[];
}

/** What a chart shows: the picked range, with its label and first shown day. */
export interface ChartPeriod {
  period: Signal<Period>;
  label: Signal<string>;
  start: Signal<Date>;
}

/**
 * Data shared by the insights charts. Each source is loaded back to the earliest day a shown chart needs,
 * through `since()`, and loaded again only when a chart needs an earlier day.
 */
@Injectable()
export class InsightsData {
  private headacheService = inject(HeadacheService);
  private workoutService = inject(WorkoutService);
  private userService = inject(UserService);

  /** Period picked for every chart. */
  range = signal<Period>(RANGES[0].period);

  /** First day each shown chart needs from each source. */
  private needs = {
    headaches: signal<Signal<Date>[]>([]),
    workouts: signal<Signal<Date>[]>([]),
  };

  headaches = rxResource({
    params: this.loadFrom('headaches'),
    // With doses, as headache patterns need them.
    stream: ({ params: from }) => this.headacheService.getHeadaches({ from: new Date(from) }, true),
  });

  workouts = rxResource({
    params: this.loadFrom('workouts'),
    stream: ({ params: from }) => this.workoutService.getWorkouts({ from: new Date(from) }),
  });

  /** Counts and first dates of all entries, to tell whether there is enough history for the charts to mean something. */
  private history = rxResource({ stream: () => this.userService.historySummary() });

  /** How ready each category is, or undefined while the entries load. */
  readiness = computed<Record<InsightsCategory, Readiness> | undefined>(() => {
    if (!this.history.hasValue()) return undefined;
    const history = this.history.value();
    return {
      headaches: readiness('headaches', history),
      workouts: readiness('workouts', history),
      correlations: readiness('correlations', history),
      analysis: readiness('analysis', history),
    };
  });

  /**
   * True while data for the shown charts is loading, so the page shows one spinner instead of one per chart.
   * A failed history summary doesn't count, or the spinner would never go away.
   */
  loading = computed(
    () =>
      (this.readiness() === undefined && !this.history.error()) ||
      this.headaches.isLoading() ||
      this.workouts.isLoading() ||
      this.exercises.isLoading(),
  );

  /** The exercise library, for each exercise's muscles. */
  exercises = rxResource({
    stream: () => this.workoutService.getExercises(),
  });

  /**
   * The picked range. Its first shown day is moved back to the start of its week or month for charts
   * counting whole weeks or months.
   */
  chartPeriod(align: 'day' | 'week' | 'month' = 'day'): ChartPeriod {
    const period = this.range.asReadonly();
    return {
      period,
      label: computed(() => periodLabel(period())),
      start: computed(() => {
        const start = periodStart(period());
        if (align === 'week') return startOfWeek(start);
        if (align === 'month') return new Date(start.getFullYear(), start.getMonth(), 1);
        return start;
      }),
    };
  }

  /**
   * Entries of `source` from `from` until now, newest first. Keeps `source` loaded back to `from` while the
   * calling chart is shown, so it must be called while the chart is created.
   */
  since<K extends keyof Loaded>(source: K, from: Signal<Date>): Signal<Loaded[K]> {
    const needs = this.needs[source];
    untracked(() => needs.update(n => [...n, from]));
    inject(DestroyRef).onDestroy(() => needs.update(n => n.filter(f => f !== from)));

    return computed(() => {
      const entries: { startedAt: string }[] = this[source].value() ?? [];
      return entries.filter(e => new Date(e.startedAt) >= from()) as Loaded[K];
    });
  }

  /**
   * Workouts from `from` on whose window is over, each with the pain levels of its linked headaches.
   * `hasPending` is true when a workout is left out because its window is not over yet.
   */
  linkedWorkouts(from: Signal<Date>) {
    const workouts = this.since('workouts', from);
    const headaches = this.since('headaches', from);

    return computed(() => {
      const now = Date.now();
      const starts = headaches().map(h => ({ start: new Date(h.startedAt).getTime(), pain: h.painLevel }));

      const linked: { workout: Workout; pains: number[] }[] = [];
      let hasPending = false;
      for (const workout of workouts()) {
        const start = new Date(workout.startedAt).getTime();
        const until = start + workout.durationSeconds * 1000 + WINDOW_HOURS * HOUR_MS;
        if (until > now) {
          hasPending = true;
          continue;
        }
        linked.push({ workout, pains: starts.filter(h => h.start >= start && h.start < until).map(h => h.pain) });
      }
      return { linked, hasPending };
    });
  }

  /**
   * Time of the earliest day the shown charts need from `source`, or undefined while none needs it.
   * It only ever moves earlier, so picking a shorter range or hiding charts does not load again.
   */
  private loadFrom(source: keyof Loaded) {
    return linkedSignal<number | undefined, number | undefined>({
      source: () => {
        const starts = this.needs[source]().map(from => from().getTime());
        return starts.length ? Math.min(...starts) : undefined;
      },
      computation: (needed, previous) =>
        previous?.value !== undefined && (needed === undefined || previous.value <= needed) ? previous.value : needed,
    });
  }
}
