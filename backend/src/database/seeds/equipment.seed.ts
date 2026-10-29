import type { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { Equipment } from '../../exercise-library/lookups/equipment.entity.js';

// Names match the dataset's `equipment` values case-insensitively (see exercises-dataset.seed.ts)
export const EquipmentSeed = [
    { id: 1, name: 'Body weight' },
    { id: 2, name: 'Dumbbell' },
    { id: 3, name: 'Cable' },
    { id: 4, name: 'Barbell' },
    { id: 5, name: 'Leverage machine' },
    { id: 6, name: 'Band' },
    { id: 7, name: 'Smith machine' },
    { id: 8, name: 'Kettlebell' },
    { id: 9, name: 'Weighted' },
    { id: 10, name: 'Stability ball' },
    { id: 11, name: 'EZ Barbell' },
    { id: 12, name: 'Assisted' },
    { id: 13, name: 'Sled machine' },
    { id: 14, name: 'Medicine ball' },
    { id: 15, name: 'Rope' },
    { id: 16, name: 'Roller' },
    { id: 17, name: 'Resistance band' },
    { id: 18, name: 'Bosu ball' },
    { id: 19, name: 'Olympic barbell' },
    { id: 20, name: 'Wheel roller' },
    { id: 21, name: 'Upper body ergometer' },
    { id: 22, name: 'SkiErg machine' },
    { id: 23, name: 'Hammer' },
    { id: 24, name: 'Stationary bike' },
    { id: 25, name: 'Tire' },
    { id: 26, name: 'Trap bar' },
    { id: 27, name: 'Elliptical machine' },
    { id: 28, name: 'Stepmill machine' },
];

export default class EquipmentSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        // upsert on the unique name, not the id: a database seeded before may hold these names under other ids
        await dataSource.getRepository(Equipment).upsert(
            EquipmentSeed.map(({ name }) => ({ name })),
            ['name'],
        );
    }
}
