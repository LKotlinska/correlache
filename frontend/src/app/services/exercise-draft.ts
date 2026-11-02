import { effect, inject, Service, signal } from '@angular/core';
import { Exercise, TrackingMode } from '../models/workout.model';
import { DraftStorage } from './draft-storage';
import { DraftController } from './draft-controller';

const KEY = 'workout-draft';

export interface SetDraft {
  weight: number | null;
  reps: number | null;
  distance: number | null;
  durationHours: number | null;
  durationMinutes: number | null;
}

/** Everything of an unfinished workout that has to outlive the workout form component. */
export interface WorkoutDraft {
  exercises: Exercise[];
  form: Record<string, unknown> | null;
  sets: Record<number, SetDraft[]>;
  /** Tracking mode per library exercise id; a missing entry means the default for its equipment. */
  modes: Record<number, TrackingMode>;
}

@Service()
export class ExerciseDraftService {
  private draft = new DraftController(inject(DraftStorage), KEY);
  private saved = this.draft.restore<WorkoutDraft>();

  readonly exercises = signal<Exercise[]>(this.saved?.exercises ?? []);
  form: WorkoutDraft['form'] = this.saved?.form ?? null;
  sets: WorkoutDraft['sets'] = this.saved?.sets ?? {};
  modes: WorkoutDraft['modes'] = this.saved?.modes ?? {};
  /**
   * Id of the workout being edited, or null when adding. While editing, the state lives in memory only,
   * so it never overwrites the stored draft of a new workout.
   */
  editingId: string | null = null;
  /** Set when leaving the edit form for the exercise picker, so the edits survive the round trip. */
  keepEdit = false;

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
    this.modes = Object.fromEntries(Object.entries(this.modes).filter(([id]) => ids.has(Number(id))));
    this.exercises.set(list);
  }

  /** Stores the form values, sets and tracking modes alongside the picked exercises. */
  saveForm(form: WorkoutDraft['form'], sets: WorkoutDraft['sets'], modes: WorkoutDraft['modes']) {
    this.form = form;
    this.sets = sets;
    this.modes = modes;
    this.persist();
  }

  /** Starts editing a saved workout, replacing whatever is held in memory. */
  startEdit(id: string, draft: WorkoutDraft) {
    this.editingId = id;
    this.form = draft.form;
    this.sets = draft.sets;
    this.modes = draft.modes;
    this.exercises.set(draft.exercises);
  }

  /** Leaves edit mode and brings back the stored draft of a new workout, if there is one. */
  endEdit() {
    if (this.editingId === null) return;
    this.editingId = null;
    this.keepEdit = false;
    const saved = this.draft.restore<WorkoutDraft>();
    this.form = saved?.form ?? null;
    this.sets = saved?.sets ?? {};
    this.modes = saved?.modes ?? {};
    this.exercises.set(saved?.exercises ?? []);
  }

  hasDraft() {
    return this.exercises().length > 0 || this.form !== null;
  }

  clear() {
    this.form = null;
    this.sets = {};
    this.modes = {};
    this.exercises.set([]);
    this.draft.discard();
  }

  private persist() {
    if (this.editingId !== null || !this.hasDraft()) return;
    this.draft.save({ exercises: this.exercises(), form: this.form, sets: this.sets, modes: this.modes });
  }
}
