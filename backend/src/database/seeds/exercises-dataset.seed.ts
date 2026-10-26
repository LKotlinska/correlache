import { In, type DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { basename } from 'path';
import { Exercise } from '../../exercise-library/entities/exercise.entity.js';
import { ExerciseMuscle, MuscleRole } from '../../exercise-library/entities/exercise-muscle.entity.js';
import { Muscle } from '../../exercise-library/lookups/muscle.entity.js';
import { Equipment } from '../../exercise-library/lookups/equipment.entity.js';
import { BodyPart } from '../../exercise-library/lookups/body-part.entity.js';
import { MuscleAliases } from './exercise-library.seed.js';

// https://github.com/hasaneyldrm/exercises-dataset, pinned so reseeding is reproducible
const DATASET_COMMIT = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd';
const DATASET_URL = `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/${DATASET_COMMIT}/data/exercises.json`;

// The images and GIFs are (c) Gym visual and may not be used without their permission.
// Keep this off until that is granted; turning it on and re-running the seed fills image_name / gif_name.
const SEED_MEDIA = false;

interface DatasetExercise {
    id: string;
    name: string;
    body_part: string;
    equipment: string;
    target: string;
    secondary_muscles: string[] | null;
    instruction_steps: { en?: string[] } | null;
    image: string | null;
    gif_url: string | null;
}

export default class ExercisesDatasetSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        const res = await fetch(DATASET_URL);
        if (!res.ok) throw new Error(`Exercises dataset request failed: HTTP ${res.status}`);
        const raw = (await res.json()) as DatasetExercise[];

        const [equipment, bodyParts, muscles] = await Promise.all([
            dataSource.getRepository(Equipment).find(),
            dataSource.getRepository(BodyPart).find(),
            dataSource.getRepository(Muscle).find(),
        ]);
        const equipmentIdByName = new Map(equipment.map((e) => [e.name.toLowerCase(), e.id]));
        const bodyPartIdByName = new Map(bodyParts.map((b) => [b.name.toLowerCase(), b.id]));
        const muscleIdByName = new Map(muscles.map((m) => [m.name, m.id]));
        const muscleIdOf = (datasetName: string): number | undefined => {
            const canonical = MuscleAliases.get(datasetName.toLowerCase());
            return canonical === undefined ? undefined : muscleIdByName.get(canonical);
        };

        const exercises = new Map<number, Partial<Exercise>>();
        const links = new Map<string, ExerciseMuscle>();
        let skippedInvalid = 0;
        const unmappedMuscles = new Set<string>();

        for (const ex of raw) {
            const id = Number(ex.id);
            const equipmentId = equipmentIdByName.get(ex.equipment.toLowerCase());
            const bodyPartId = bodyPartIdByName.get(ex.body_part.toLowerCase());
            if (!Number.isInteger(id) || equipmentId === undefined || bodyPartId === undefined) {
                skippedInvalid++;
                continue;
            }

            exercises.set(id, {
                id,
                name: ex.name.slice(0, 150),
                imageName: SEED_MEDIA && ex.image ? basename(ex.image) : null,
                instructions: ex.instruction_steps?.en ?? null,
                gifName: SEED_MEDIA && ex.gif_url ? basename(ex.gif_url) : null,
                equipmentId,
                bodyPartId,
            });

            // secondary first so a muscle listed as both ends up primary
            const roles: [string[], MuscleRole][] = [
                [ex.secondary_muscles ?? [], MuscleRole.SECONDARY],
                [[ex.target], MuscleRole.PRIMARY],
            ];
            for (const [names, role] of roles) {
                for (const name of names) {
                    const muscleId = muscleIdOf(name);
                    if (muscleId === undefined) {
                        unmappedMuscles.add(name);
                        continue;
                    }
                    links.set(`${id}:${muscleId}`, { exerciseId: id, muscleId, role } as ExerciseMuscle);
                }
            }
        }

        const ids = [...exercises.keys()];
        await dataSource.transaction(async (em) => {
            // upsert in chunks to stay well under MySQL's placeholder limit
            for (let i = 0; i < ids.length; i += 500) {
                await em.getRepository(Exercise).upsert(
                    ids.slice(i, i + 500).map((id) => exercises.get(id)!),
                    ['id'],
                );
            }
            // muscle links are rebuilt so removed/changed muscles don't linger
            for (let i = 0; i < ids.length; i += 500) {
                await em.getRepository(ExerciseMuscle).delete({ exerciseId: In(ids.slice(i, i + 500)) });
            }
            const rows = [...links.values()];
            for (let i = 0; i < rows.length; i += 500) {
                await em.getRepository(ExerciseMuscle).insert(rows.slice(i, i + 500));
            }
        });

        console.log(
            `Exercises dataset: fetched ${raw.length}, seeded ${ids.length}, ` +
                `skipped ${skippedInvalid} with unknown equipment/body part` +
                (unmappedMuscles.size ? `; no muscle for: ${[...unmappedMuscles].join(', ')}` : ''),
        );
    }
}
