import { Component, computed, inject } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ChartInfo } from '../../chart-info/chart-info';
import { InsightsData } from '../../insights-data';
import { Period } from '../../period';
import { alwaysDone, Feature, MIN_WORKOUTS, rankSuspects, Session, Suspect } from '../../suspects';

/** Longer than other charts: each exercise is only done in some workouts, so it needs a long history to compare. */
const DEFAULT_PERIOD: Period = { unit: 'month', count: 6 };
/** Most suspects listed. */
const MAX_SHOWN = 5;
/** Suspects below this chance are left out; at about 50% a feature makes no difference either way. */
const MIN_SHOWN = 0.6;
/** Chance from which a suspect is called likely in the summary. */
const LIKELY = 0.8;

@Component({
  imports: [ChartInfo, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar, PercentPipe],
  selector: 'app-headache-suspects',
  styleUrl: './headache-suspects.scss',
  templateUrl: './headache-suspects.html',
})
export class HeadacheSuspects {
  readonly minWorkouts = MIN_WORKOUTS;

  private data = inject(InsightsData);

  /** Workouts, headaches and the exercise library shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;
  exercises = this.data.exercises;

  hasData = computed(() => this.workouts.hasValue() && this.headaches.hasValue() && this.exercises.hasValue());

  hasError = computed(() => !!this.workouts.error() || !!this.headaches.error() || !!this.exercises.error());

  /** The picked range, or the last 6 months. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  private linkedWorkouts = this.data.linkedWorkouts(this.shown.start);

  /** Whether a workout is left out because its window is not over yet. */
  hasPending = computed(() => this.linkedWorkouts().hasPending);

  /**
   * Each linked workout's dose of every exercise and muscle group it trained, with every feature seen. An exercise
   * counts 1; a muscle group counts 1 per exercise working it as a primary muscle and 0.5 as a secondary one.
   */
  private input = computed(() => {
    const musclesByExercise = new Map((this.exercises.value() ?? []).map(e => [e.id, e.muscles]));
    const features = new Map<string, Feature>();

    const sessions: Session[] = this.linkedWorkouts().linked.map(({ workout, pains }) => {
      const doses = new Map<string, number>();
      for (const e of workout.exercises) {
        const exerciseKey = `exercise:${e.exerciseId}`;
        features.set(exerciseKey, { key: exerciseKey, name: e.exerciseName, kind: 'exercise' });
        doses.set(exerciseKey, 1);
        for (const m of musclesByExercise.get(e.exerciseId) ?? []) {
          const groupKey = `group:${m.muscleGroup.id}`;
          features.set(groupKey, { key: groupKey, name: m.muscleGroup.name, kind: 'muscleGroup' });
          doses.set(groupKey, (doses.get(groupKey) ?? 0) + (m.role === 'primary' ? 1 : 0.5));
        }
      }
      return { doses, headache: pains.length > 0 };
    });

    return { sessions, features: [...features.values()] };
  });

  /** Whether there are enough workouts with and without some feature to compare at all. */
  private ranked = computed(() => rankSuspects(this.input().sessions, this.input().features));
  canCompare = computed(() => this.ranked().length > 0);

  /** Most likely suspects first, leaving out those that make no clear difference. */
  suspects = computed(() => this.ranked().filter(s => s.probability >= MIN_SHOWN).slice(0, MAX_SHOWN));

  /** The top suspect when it is likely enough to point out. */
  top = computed(() => {
    const top = this.suspects()[0];
    return top && top.probability >= LIKELY ? top : null;
  });

  /** Exercises in nearly every workout, which can't be compared. */
  alwaysDone = computed(() =>
    alwaysDone(this.input().sessions, this.input().features).filter(f => f.kind === 'exercise').map(f => f.name),
  );

  /**
   * For a top suspect made of exercises always done together, one of them to leave out for a few workouts so the
   * next ranking can tell them apart.
   */
  experiment = computed(() => {
    const exercises = this.top()?.features.filter(f => f.kind === 'exercise') ?? [];
    return exercises.length > 1 ? { skip: exercises[0].name, keep: exercises.slice(1).map(f => f.name) } : null;
  });

  /** "Core (russian twist, dead bug)" for a muscle group, or the exercises joined for exercises done together. */
  name(suspect: Suspect): string {
    const [first, ...rest] = suspect.features;
    const exercises = rest.filter(f => f.kind === 'exercise').map(f => f.name);
    if (first.kind === 'muscleGroup') return exercises.length ? `${first.name} (${exercises.join(', ')})` : first.name;
    return [first.name, ...exercises].join(' + ');
  }

  /** How sure, as a whole percent; never 0% or 100%, since the data can't make either certain. */
  confidence(probability: number): string {
    const percent = Math.round(probability * 100);
    if (percent >= 100) return '>99%';
    if (percent <= 0) return '<1%';
    return `${percent}%`;
  }

  rate({ workouts, withHeadache }: { workouts: number; withHeadache: number }): number {
    return workouts ? withHeadache / workouts : 0;
  }
}
