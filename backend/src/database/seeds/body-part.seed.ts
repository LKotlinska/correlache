import type { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { BodyPart } from '../../exercise-library/lookups/body-part.entity.js';

// Ids match the Lyfta body part ids used by exercises.body_part_id
export const BodyPartSeed = [
    { id: 1, name: 'Thighs' },
    { id: 2, name: 'Chest' },
    { id: 3, name: 'Hips' },
    { id: 4, name: 'Back' },
    { id: 5, name: 'Upper Arms' },
    { id: 6, name: 'Shoulders' },
    { id: 7, name: 'Forearms' },
    { id: 8, name: 'Calves' },
    { id: 9, name: 'Neck' },
    { id: 10, name: 'Cardio' },
    { id: 11, name: 'Full body' },
    { id: 12, name: 'Waist' },
    { id: 13, name: 'Plyometrics' },
    { id: 14, name: 'Weightlifting' },
    { id: 15, name: 'Yoga' },
    { id: 16, name: 'Stretching' },
    { id: 17, name: 'Biceps' },
    { id: 18, name: 'Triceps' },
    { id: 19, name: 'Quadriceps' },
    { id: 20, name: 'Hamstrings' },
];

export default class BodyPartSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        await dataSource.getRepository(BodyPart).upsert(BodyPartSeed, ['id']);
    }
}
