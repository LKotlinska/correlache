import { Exercise, WorkoutDetail } from '../models/workout.model';
import { WorkoutDraft } from '../services/exercise-draft';

/** Converts a saved workout into the draft the workout form edits. */
export function workoutToDraft(workout: WorkoutDetail): WorkoutDraft {
  const started = new Date(workout.startedAt);
  const minutes = Math.floor(workout.durationSeconds / 60);
  const draft: WorkoutDraft = {
    exercises: [],
    sets: {},
    modes: {},
    form: {
      title: workout.title,
      startDate: started,
      startTime: started,
      durationHours: Math.floor(minutes / 60),
      durationMinutes: minutes % 60,
    },
  };

  for (const e of workout.exercises) {
    // Sets are keyed by library id like in the picker, so a repeated exercise is kept once
    if (draft.sets[e.exerciseId]) continue;
    draft.exercises.push(toExercise(e.exerciseId, e.exerciseName, e.muscles));
    draft.modes[e.exerciseId] = e.trackingMode;
    draft.sets[e.exerciseId] = e.sets.map(({ weight, reps, distance, durationSeconds }) => {
      const minutes = durationSeconds === null ? null : Math.floor(durationSeconds / 60);
      return {
        weight,
        reps,
        distance,
        durationHours: minutes === null ? null : Math.floor(minutes / 60),
        durationMinutes: minutes === null ? null : minutes % 60,
      };
    });
  }
  return draft;
}

/** The form only shows the name and muscles; the picker takes the rest from the library. */
function toExercise(id: number, name: string, muscles: Exercise['muscles']): Exercise {
  return { id, name, imageName: null, gifName: null, equipment: { id: 0, name: '' }, bodyPart: { id: 0, name: '' }, muscles };
}
