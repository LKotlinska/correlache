import { randomUUID } from 'node:crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DataSource, In } from 'typeorm';
import type { EntityManager, ObjectLiteral } from 'typeorm';
import { dbConfig } from '../../db.config.js';
import { hashPassword } from '../../common/password.js';
import { User } from '../../user/entities/user.entity.js';
import { Workout } from '../../exercise-library/entities/workout.entity.js';
import { WorkoutExercise } from '../../exercise-library/entities/workout-exercise.entity.js';
import { WorkoutSet } from '../../exercise-library/entities/set.entity.js';
import { Exercise } from '../../exercise-library/entities/exercise.entity.js';
import { Headache } from '../../headaches/entities/headache.entity.js';
import { Trigger } from '../../headaches/lookups/trigger.entity.js';
import { Symptom } from '../../headaches/lookups/symptom.entity.js';
import { ReliefMeasure } from '../../headaches/lookups/relief-measure.entity.js';
import { HeadacheLocation } from '../../headaches/lookups/headache-location.entity.js';
import { EXAMPLE_EXERCISE_IDS, generateExampleData } from './example-data.js';

// Creates (or resets) a demo account with a year of workouts and headaches ending yesterday.
// Needs the lookup data from `npm run seed` first. Running it again replaces the account's data.

const EXAMPLE_USER = { username: 'Data example', email: 'data@example.com', password: 'example123' };
const CHUNK = 500;

// ESM has no __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === 'production') {
  throw new Error('The example user is for development only');
}

const dataSource = new DataSource({
  ...dbConfig(process.env),
  entities: [join(__dirname, '..', '..', '**', '*.entity{.ts,.js}')],
});

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

try {
  await dataSource.initialize();
  const { workouts, headaches } = generateExampleData(new Date());

  await dataSource.transaction(async (manager) => {
    const exercises = await manager.findBy(Exercise, { id: In(EXAMPLE_EXERCISE_IDS) });
    const exerciseNames = new Map(exercises.map((e) => [e.id, e.name]));
    const missing = EXAMPLE_EXERCISE_IDS.filter((id) => !exerciseNames.has(id));
    if (missing.length) throw new Error(`Missing exercises ${missing.join(', ')}. Run npm run seed first.`);

    const triggers = await lookupIds(manager, Trigger, headaches.flatMap((h) => h.triggers));
    const symptoms = await lookupIds(manager, Symptom, headaches.flatMap((h) => h.symptoms));
    const reliefs = await lookupIds(manager, ReliefMeasure, headaches.flatMap((h) => h.reliefMeasures));
    const locations = await lookupIds(manager, HeadacheLocation, headaches.flatMap((h) => h.locations));

    // Reset the password too, so the documented login always works
    const passwordHash = await hashPassword(EXAMPLE_USER.password);
    let user = await manager.findOneBy(User, { email: EXAMPLE_USER.email });
    if (user) {
      await manager.update(User, user.id, { username: EXAMPLE_USER.username, password_hash: passwordHash, health_data_consent_at: new Date() });
    } else {
      user = await manager.save(manager.create(User, { username: EXAMPLE_USER.username, email: EXAMPLE_USER.email, password_hash: passwordHash, health_data_consent_at: new Date() }));
    }
    const userId = user.id;

    // Exercises, sets and headache links go with them through ON DELETE CASCADE
    await manager.delete(Workout, { userId });
    await manager.delete(Headache, { userId });

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

    const headacheRows: Partial<Headache>[] = [];
    const links = { headache_triggers: [], headache_symptoms: [], headache_relief: [], headache_locations: [] } as Record<string, ObjectLiteral[]>;
    for (const h of headaches) {
      const headacheId = randomUUID();
      headacheRows.push({ id: headacheId, userId, startedAt: h.startedAt, endedAt: h.endedAt, painLevel: h.painLevel, notes: h.notes });
      for (const name of h.triggers) links.headache_triggers.push({ headache_id: headacheId, trigger_id: triggers.get(name) });
      for (const name of h.symptoms) links.headache_symptoms.push({ headache_id: headacheId, symptom_id: symptoms.get(name) });
      for (const name of h.reliefMeasures) links.headache_relief.push({ headache_id: headacheId, relief_measure_id: reliefs.get(name) });
      for (const name of h.locations) links.headache_locations.push({ headache_id: headacheId, location_id: locations.get(name) });
    }

    await insertChunked(manager, Workout, workoutRows);
    await insertChunked(manager, WorkoutExercise, exerciseRows);
    await insertChunked(manager, WorkoutSet, setRows);
    await insertChunked(manager, Headache, headacheRows);
    for (const [table, rows] of Object.entries(links)) await insertChunked(manager, table, rows);
  });

  console.log(
    `Seeded ${EXAMPLE_USER.email} (password: ${EXAMPLE_USER.password}) with ${workouts.length} workouts and ${headaches.length} headaches.`,
  );
} finally {
  if (dataSource.isInitialized) await dataSource.destroy();
}
