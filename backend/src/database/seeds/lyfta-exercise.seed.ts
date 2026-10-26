import { In, type DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { Exercise, ExerciseType } from '../../exercise-library/entities/exercise.entity.js';
import { ExerciseMuscle, MuscleRole } from '../../exercise-library/entities/exercise-muscle.entity.js';
import { Muscle } from '../../exercise-library/lookups/muscle.entity.js';
import { Equipment } from '../../exercise-library/lookups/equipment.entity.js';
import { BodyPart } from '../../exercise-library/lookups/body-part.entity.js';

const LYFTA_URL = 'https://my.lyfta.app/api/v1/exercises/library';
const PAGE_SIZE = 100; // Lyfta's maximum per page
// Used when Lyfta sends a null or unrecognised exercise_type (e.g. 'db_1_alt_sides')
const DEFAULT_TYPE = ExerciseType.WEIGHT_REPS;

// The API sends ids as JSON-encoded string arrays, e.g. '["18","5"]'
interface LyftaExercise {
    id: string;
    name: string;
    image_name: string | null;
    equipment_id: string;
    body_part_id: string;
    Target_muscles_id: string;
    Synergist_muscles_id: string;
    exercise_type: string | null;
}

interface LyftaPage {
    status: boolean;
    message?: string;
    data?: {
        results: LyftaExercise[];
        pagination: { limit: number; offset: number; total: number; hasMore: boolean };
    };
}

const parseIds = (raw: string | null | undefined): number[] => {
    try {
        const ids: unknown = JSON.parse(raw ?? '[]');
        return Array.isArray(ids) ? ids.map(Number).filter(Number.isInteger) : [];
    } catch {
        return [];
    }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Lyfta allows 60 requests/minute and 5,000/day. One request per 1.1s stays safely under
// the per-minute limit (~55/min); the full library is only ~77 requests, far below the daily cap.
const REQUEST_INTERVAL_MS = 1100;
const MAX_RETRIES = 5;

async function fetchPage(apiKey: string, offset: number): Promise<LyftaPage> {
    for (let attempt = 0; ; attempt++) {
        const res = await fetch(`${LYFTA_URL}?limit=${PAGE_SIZE}&offset=${offset}`, {
            headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        });
        if (res.status === 429 && attempt < MAX_RETRIES) {
            // honour Retry-After when given, otherwise wait out the rate-limit window
            const retryAfter = Number(res.headers.get('retry-after'));
            await sleep((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60) * 1000);
            continue;
        }
        if (!res.ok) throw new Error(`Lyfta request failed at offset ${offset}: HTTP ${res.status}`);
        return (await res.json()) as LyftaPage;
    }
}

async function fetchAllExercises(apiKey: string): Promise<LyftaExercise[]> {
    const all: LyftaExercise[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const started = Date.now();
        const body = await fetchPage(apiKey, offset);
        if (!body.status || !body.data) throw new Error(`Lyfta error: ${body.message ?? 'unknown'}`);
        all.push(...body.data.results);
        if (!body.data.pagination.hasMore || !body.data.results.length) break;
        await sleep(Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - started)));
    }
    return all;
}

export default class LyftaExerciseSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        const apiKey = process.env.LYFTA_API_KEY;
        if (!apiKey) throw new Error('LYFTA_API_KEY is not set');

        const raw = await fetchAllExercises(apiKey);

        const [equipment, bodyParts, muscles] = await Promise.all([
            dataSource.getRepository(Equipment).find(),
            dataSource.getRepository(BodyPart).find(),
            dataSource.getRepository(Muscle).find(),
        ]);
        const equipmentIds = new Set(equipment.map((e) => e.id));
        const bodyPartIds = new Set(bodyParts.map((b) => b.id));
        const muscleIdByLyftaId = new Map(muscles.map((m) => [m.lyfta_id, m.id]));
        const exerciseTypes = new Set<string>(Object.values(ExerciseType));

        const exercises = new Map<number, Partial<Exercise>>();
        const links = new Map<string, ExerciseMuscle>();
        let skippedNoId = 0;
        let skippedInvalid = 0;

        for (const ex of raw) {
            const id = Number(ex.id);
            if (ex.id == null || !Number.isInteger(id)) {
                skippedNoId++;
                continue;
            }
            // exercises hold a single equipment / body part, so take the first one listed
            const equipmentId = parseIds(ex.equipment_id)[0];
            const bodyPartId = parseIds(ex.body_part_id)[0];
            if (!equipmentIds.has(equipmentId) || !bodyPartIds.has(bodyPartId)) {
                skippedInvalid++;
                continue;
            }

            exercises.set(id, {
                id,
                name: ex.name.slice(0, 150),
                imageName: ex.image_name,
                equipmentId,
                bodyPartId,
                exerciseType: exerciseTypes.has(ex.exercise_type ?? '')
                    ? (ex.exercise_type as ExerciseType)
                    : DEFAULT_TYPE,
            });

            // synergists first so a muscle listed as both ends up primary
            const roles: [number[], MuscleRole][] = [
                [parseIds(ex.Synergist_muscles_id), MuscleRole.SECONDARY],
                [parseIds(ex.Target_muscles_id), MuscleRole.PRIMARY],
            ];
            for (const [lyftaIds, role] of roles) {
                for (const lyftaId of lyftaIds) {
                    const muscleId = muscleIdByLyftaId.get(lyftaId);
                    if (muscleId === undefined) continue;
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
            `Lyfta exercises: fetched ${raw.length}, seeded ${ids.length}, ` +
                `skipped ${skippedNoId} without id and ${skippedInvalid} with unknown equipment/body part`,
        );
    }
}
