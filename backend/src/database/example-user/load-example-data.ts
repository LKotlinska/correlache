import { randomUUID } from 'node:crypto';
import { In } from 'typeorm';
import type { EntityManager, ObjectLiteral } from 'typeorm';
import { Workout } from '../../exercise-library/entities/workout.entity.js';
import { WorkoutExercise } from '../../exercise-library/entities/workout-exercise.entity.js';
import { WorkoutSet } from '../../exercise-library/entities/set.entity.js';
import { Exercise } from '../../exercise-library/entities/exercise.entity.js';
import { Headache } from '../../headaches/entities/headache.entity.js';
import { Trigger } from '../../headaches/lookups/trigger.entity.js';
import { Symptom } from '../../headaches/lookups/symptom.entity.js';
import { ReliefMeasure } from '../../headaches/lookups/relief-measure.entity.js';
import { HeadacheLocation } from '../../headaches/lookups/headache-location.entity.js';
import { Medication } from '../../medications/entities/medication.entity.js';
import { MedicationIntake } from '../../medications/entities/medication-intake.entity.js';
import { EXAMPLE_EXERCISE_IDS, generateExampleData } from './example-data.js';

const CHUNK = 500;

export interface ExampleDataSummary {
  workouts: number;
  headaches: number;
  intakes: number;
}

async function insertChunked(manager: EntityManager, target: string | (new () => ObjectLiteral), rows: ObjectLiteral[]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await manager.createQueryBuilder().insert().into(target).values(rows.slice(i, i + CHUNK)).execute();
  }
}

/** Name -> id for a lookup table, failing loudly if the generator uses a name the table lacks. */
async function lookupIds(manager: EntityManager, entity: new () => { id: number; name: string }, names: string[]) {
  const rows = await manager.find(entity);
  const ids = new Map(rows.map((r) => [r.name, r.id]));
  const missing = [...new Set(names)].filter((n) => !ids.has(n));
  if (missing.length) throw new Error(`Missing ${entity.name} rows: ${missing.join(', ')}. Run npm run seed first.`);
  return ids;
}

/**
 * Replaces the user's workouts, headaches and medications with a generated year ending yesterday.
 * Run it inside a transaction, so a failure leaves the user's own data in place.
 */
export async function replaceWithExampleData(manager: EntityManager, userId: string, now: Date): Promise<ExampleDataSummary> {
  const { workouts, headaches, medications, intakes } = generateExampleData(now);

  const exercises = await manager.findBy(Exercise, { id: In(EXAMPLE_EXERCISE_IDS) });
  const exerciseNames = new Map(exercises.map((e) => [e.id, e.name]));
  const missing = EXAMPLE_EXERCISE_IDS.filter((id) => !exerciseNames.has(id));
  if (missing.length) throw new Error(`Missing exercises ${missing.join(', ')}. Run npm run seed first.`);

  const triggers = await lookupIds(manager, Trigger, headaches.flatMap((h) => h.triggers));
  const symptoms = await lookupIds(manager, Symptom, headaches.flatMap((h) => h.symptoms));
  const reliefs = await lookupIds(manager, ReliefMeasure, headaches.flatMap((h) => h.reliefMeasures));
  const locations = await lookupIds(manager, HeadacheLocation, headaches.flatMap((h) => h.locations));

  // Exercises, sets, headache links and doses go with them through ON DELETE CASCADE
  await manager.delete(Workout, { userId });
  await manager.delete(Headache, { userId });
  await manager.delete(Medication, { userId });

  const workoutRows: Partial<Workout>[] = [];
  const exerciseRows: Partial<WorkoutExercise>[] = [];
  const setRows: Partial<WorkoutSet>[] = [];
  for (const w of workouts) {
    const workoutId = randomUUID();
    workoutRows.push({ id: workoutId, userId, title: w.title, startedAt: w.startedAt, durationSeconds: w.durationSeconds });
    w.exercises.forEach((e, order) => {
      const workoutExerciseId = randomUUID();
      exerciseRows.push({
        id: workoutExerciseId,
        workoutId,
        exerciseId: e.exerciseId,
        exerciseName: exerciseNames.get(e.exerciseId)!,
        order,
        trackingMode: e.trackingMode,
      });
      e.sets.forEach((s, setOrder) =>
        setRows.push({
          id: randomUUID(),
          workoutExerciseId,
          order: setOrder,
          weight: s.weight ?? null,
          reps: s.reps ?? null,
          distance: s.distance ?? null,
          durationSeconds: s.durationSeconds ?? null,
        }),
      );
    });
  }

  const headacheIds: string[] = [];
  const headacheRows: Partial<Headache>[] = [];
  const links = { headache_triggers: [], headache_symptoms: [], headache_relief: [], headache_locations: [] } as Record<string, ObjectLiteral[]>;
  for (const h of headaches) {
    const headacheId = randomUUID();
    headacheIds.push(headacheId);
    headacheRows.push({ id: headacheId, userId, startedAt: h.startedAt, endedAt: h.endedAt, painLevel: h.painLevel, notes: h.notes });
    for (const name of h.triggers) links.headache_triggers.push({ headache_id: headacheId, trigger_id: triggers.get(name) });
    for (const name of h.symptoms) links.headache_symptoms.push({ headache_id: headacheId, symptom_id: symptoms.get(name) });
    for (const name of h.reliefMeasures) links.headache_relief.push({ headache_id: headacheId, relief_measure_id: reliefs.get(name) });
    for (const name of h.locations) links.headache_locations.push({ headache_id: headacheId, location_id: locations.get(name) });
  }

  const medicationIds = new Map(medications.map((m) => [m.name, randomUUID()]));
  const medicationRows: Partial<Medication>[] = medications.map((m) => ({ id: medicationIds.get(m.name), userId, ...m }));
  const intakeRows: Partial<MedicationIntake>[] = intakes.map((d) => ({
    id: randomUUID(),
    userId,
    medicationId: medicationIds.get(d.medication)!,
    takenAt: d.takenAt,
    dose: d.dose,
    headacheId: d.headacheIndex === null ? null : headacheIds[d.headacheIndex],
    effect: d.effect,
    effectAt: d.effectAt,
  }));

  await insertChunked(manager, Workout, workoutRows);
  await insertChunked(manager, WorkoutExercise, exerciseRows);
  await insertChunked(manager, WorkoutSet, setRows);
  await insertChunked(manager, Headache, headacheRows);
  for (const [table, rows] of Object.entries(links)) await insertChunked(manager, table, rows);
  await insertChunked(manager, Medication, medicationRows);
  await insertChunked(manager, MedicationIntake, intakeRows);

  return { workouts: workouts.length, headaches: headaches.length, intakes: intakes.length };
}
