import { effect, inject, Service, signal } from '@angular/core';
import { Exercise } from '../models/workout.model';
import { DraftStorage } from './draft-storage';
import { DraftController } from './draft-controller';

const KEY = 'workout-draft';

export interface SetDraft {
  weight: number | null;
  reps: number | null;
}

/** Everything of an unfinished workout that has to outlive the workout form component. */
export interface WorkoutDraft {
  exercises: Exercise[];
  form: Record<string, unknown> | null;
  sets: Record<number, SetDraft[]>;
}

@Service()
export class ExerciseDraftService {
  private draft = new DraftController(inject(DraftStorage), KEY);
  private saved = this.draft.restore<WorkoutDraft>();

  readonly exercises = signal<Exercise[]>(this.saved?.exercises ?? []);
  form: WorkoutDraft['form'] = this.saved?.form ?? null;
  sets: WorkoutDraft['sets'] = this.saved?.sets ?? {};

  constructor() {
    effect(() => {
      this.exercises();
      this.persist();
    });
  }

  /** Replaces the picked exercises and drops the sets of any exercise that is no longer picked. */
  setExercises(list: Exercise[]) {
    const ids = new Set(list.map((e) => e.id));
    this.sets = Object.fromEntries(Object.entries(this.sets).filter(([id]) => ids.has(Number(id))));
    this.exercises.set(list);
  }

  /** Stores the form values and sets alongside the picked exercises. */
  saveForm(form: WorkoutDraft['form'], sets: WorkoutDraft['sets']) {
    this.form = form;
    this.sets = sets;
    this.persist();
  }

  hasDraft() {
    return this.exercises().length > 0 || this.form !== null;
  }

  clear() {
    this.form = null;
    this.sets = {};
    this.exercises.set([]);
    this.draft.discard();
  }

  private persist() {
    if (!this.hasDraft()) return;
    this.draft.save({ exercises: this.exercises(), form: this.form, sets: this.sets });
  }
}
