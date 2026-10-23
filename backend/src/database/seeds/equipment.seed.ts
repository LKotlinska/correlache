import type { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { Equipment } from '../../exercise-library/lookups/equipment.entity.js';

// Ids match the Lyfta equipment ids used by exercises.equipment_id
export const EquipmentSeed = [
    { id: 1, name: 'Barbell' },
    { id: 2, name: 'Body weight' },
    { id: 3, name: 'Cable' },
    { id: 4, name: 'Dumbbell' },
    { id: 5, name: 'EZ Barbell' },
    { id: 6, name: 'Leverage machine' },
    { id: 7, name: 'Sled machine' },
    { id: 8, name: 'Smith machine' },
    { id: 9, name: 'Weighted' },
    { id: 10, name: 'Assisted' },
    { id: 11, name: 'Band' },
    { id: 12, name: 'Battling Rope' },
    { id: 13, name: 'Bosu ball' },
    { id: 14, name: 'Hammer' },
    { id: 15, name: 'Kettlebell' },
    { id: 16, name: 'Medicine Ball' },
    { id: 17, name: 'Olympic barbell' },
    { id: 18, name: 'Power Sled' },
    { id: 19, name: 'Resistance Band' },
    { id: 20, name: 'Roll' },
    { id: 21, name: 'Rollball' },
    { id: 22, name: 'Rope' },
    { id: 23, name: 'Stability ball' },
    { id: 24, name: 'Stick' },
    { id: 25, name: 'Suspension' },
    { id: 26, name: 'Trap bar' },
    { id: 27, name: 'Vibrate Plate' },
    { id: 28, name: 'Wheel roller' },
];

export default class EquipmentSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        await dataSource.getRepository(Equipment).upsert(EquipmentSeed, ['id']);
    }
}
