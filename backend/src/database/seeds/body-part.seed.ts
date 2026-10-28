import type { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { BodyPart } from '../../exercise-library/lookups/body-part.entity.js';

// Names match the dataset's `body_part` values case-insensitively (see exercises-dataset.seed.ts)
export const BodyPartSeed = [
    { id: 1, name: 'Upper arms' },
    { id: 2, name: 'Upper legs' },
    { id: 3, name: 'Back' },
    { id: 4, name: 'Waist' },
    { id: 5, name: 'Chest' },
    { id: 6, name: 'Shoulders' },
    { id: 7, name: 'Lower legs' },
    { id: 8, name: 'Lower arms' },
    { id: 9, name: 'Cardio' },
    { id: 10, name: 'Neck' },
];

export default class BodyPartSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        // upsert on the unique name, not the id: a database seeded before may hold these names under other ids
        await dataSource.getRepository(BodyPart).upsert(
            BodyPartSeed.map(({ name }) => ({ name })),
            ['name'],
        );
    }
}
