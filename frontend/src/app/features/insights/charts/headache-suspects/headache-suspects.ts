import { Component, computed, inject } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { InfoButton } from '../../../../components/info-button/info-button';
import { InsightsData } from '../../insights-data';
import { alwaysDone, Count, Feature, MIN_WORKOUTS, rankSuspects, Session, Suspect } from '../../suspects';
import { ErrorMessage } from '../../../../components/error-message/error-message';

/** Most suspects listed. */
const MAX_SHOWN = 5;
/** Suspects below this chance are left out; at about 50% a feature makes no difference either way. */
const MIN_SHOWN = 0.6;
/** Chance from which a suspect is called likely in the summary. */
const LIKELY = 0.8;
/** Chance from which a pattern is called strong, and from which moderate; anything shown below that is weak. */
const STRONG = 0.9;
const MODERATE = 0.75;

/** How clear a suspect's pattern is, as a word and the number of filled signal bars beside it. */
export interface Strength {
  label: 'Strong' | 'Moderate' | 'Weak';
  bars: 1 | 2 | 3;
}

@Component({
  imports: [
    ErrorMessage,
    InfoButton,
    MatAccordion,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    PercentPipe,
  ],
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

  /** The picked range. */
  private shown = this.data.chartPeriod();
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

  /**
   * A short name that fits on a line or two: "Core" for a muscle group, "Jump rope + 4 more" for exercises done
   * together. The full list is in {@link members}.
   */
  name(suspect: Suspect): string {
    const [first] = suspect.features;
    if (first.kind === 'muscleGroup') return first.name;
    const others = this.members(suspect).length - 1;
    return others > 0 ? `${first.name} + ${others} more` : first.name;
  }

  /** Every exercise in a suspect, for the full list in its open row; empty for a lone feature. */
  members(suspect: Suspect): string[] {
    if (suspect.features.length < 2) return [];
    return suspect.features.filter(f => f.kind === 'exercise').map(f => f.name);
  }

  /** The chance that headaches are more common with a suspect, as a word: easier to read than a second percentage. */
  strength(probability: number): Strength {
    if (probability >= STRONG) return { label: 'Strong', bars: 3 };
    if (probability >= MODERATE) return { label: 'Moderate', bars: 2 };
    return { label: 'Weak', bars: 1 };
  }

  /** "Headache after 5 of 8 workouts with it", read out in place of a bar. */
  countLabel({ workouts, withHeadache }: Count, side: string): string {
    return `Headache after ${withHeadache} of ${workouts} workouts ${side}`;
  }

  rate({ workouts, withHeadache }: Count): number {
    return workouts ? withHeadache / workouts : 0;
  }
}
