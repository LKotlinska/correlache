import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension"
import { Muscle } from "../../exercise-library/lookups/muscle.entity.js";
import { MuscleGroup } from "../../exercise-library/lookups/muscle-group.entity.js";

export const MuscleGroupSeed = [
    {
        id: 1,
        name: 'Neck & upper traps'
    },
    {
        id: 2,
        name: 'Shoulders'
    },
    {
        id: 3,
        name: 'Chest'
    },
    {
        id: 4,
        name: 'Back'
    },
    {
        id: 5,
        name: 'Arms'
    },
    {
        id: 6,
        name: 'Core'
    },
    {
        id: 7,
        name: 'Hips & glutes'
    },
    {
        id: 8,
        name: 'Legs'
    },
    {
        id: 9,
        name: 'Calves & shins'
    },
]

export const MuscleSeed = [
    {
        id: 33,
        name: 'Splenius',
        muscleGroup: 1
    },
    {
        id: 34,
        name: 'Sternocleidomastoid',
        muscleGroup: 1
    },
    {
        id: 21,
        name: 'Levator Scapulae',
        muscleGroup: 1
    },
    {
        id: 43,
        name: 'Trapezius Upper Fibers',
        muscleGroup: 1
    },
    {
        id: 8,
        name: 'Deltoid Anterior',
        muscleGroup: 2
    },
    {
        id: 9,
        name: 'Deltoid Lateral',
        muscleGroup: 2
    },
    {
        id: 10,
        name: 'Deltoid Posterior',
        muscleGroup: 2
    },
    {
        id: 19,
        name: 'Infraspinatus',
        muscleGroup: 2
    },
    {
        id: 38,
        name: 'Teres Minor',
        muscleGroup: 2
    },
    {
        id: 35,
        name: 'Subscapularis',
        muscleGroup: 2
    },
    {
        id: 24,
        name: 'Pectoralis Major Clavicular Head',
        muscleGroup: 3
    },
    {
        id: 25,
        name: 'Pectoralis Major Sternal Head',
        muscleGroup: 3
    },
    {
        id: 31,
        name: 'Serratus Anterior',
        muscleGroup: 3
    },
    {
        id: 30,
        name: 'Serratus Ante',
        muscleGroup: 3
    },
    {
        id: 20,
        name: 'Latissimus Dorsi',
        muscleGroup: 4
    },
    {
        id: 37,
        name: 'Teres Major',
        muscleGroup: 4
    },
    {
        id: 11,
        name: 'Erector Spinae',
        muscleGroup: 4
    },
    {
        id: 42,
        name: 'Trapezius Middle Fibers',
        muscleGroup: 4
    },
    {
        id: 41,
        name: 'Trapezius Lower Fibers',
        muscleGroup: 4
    },
    {
        id: 4,
        name: 'Biceps Brachii',
        muscleGroup: 5
    },
    {
        id: 5,
        name: 'Brachialis',
        muscleGroup: 5
    },
    {
        id: 6,
        name: 'Brachioradialis',
        muscleGroup: 5
    },
    {
        id: 44,
        name: 'Triceps Brachii',
        muscleGroup: 5
    },
    {
        id: 45,
        name: 'Wrist Extensors',
        muscleGroup: 5
    },
    {
        id: 46,
        name: 'Wrist Flexors',
        muscleGroup: 5
    },
    {
        id: 28,
        name: 'Rectus Abdominis',
        muscleGroup: 6
    },
    {
        id: 22,
        name: 'Obliques',
        muscleGroup: 6
    },
    {
        id: 40,
        name: 'Transverse Abdominis',
        muscleGroup: 6
    },
    {
        id: 13,
        name: 'Gluteus Maximus',
        muscleGroup: 7
    },  
    {
        id: 14,
        name: 'Gluteus Medius',
        muscleGroup: 7
    },   
    {
        id: 15,
        name: 'Gluteus Minimus',
        muscleGroup: 7
    },
    {
        id: 7,
        name: 'Deep Hip External Rotators',
        muscleGroup: 7
    },
    {
        id: 18,
        name: 'Iliopsoas',
        muscleGroup: 7
    },
    {
        id: 36,
        name: 'Tensor Fasciae Latae',
        muscleGroup: 7
    },
    {
        id: 29,
        name: 'Sartorius',
        muscleGroup: 7
    },
    {
        id: 27,
        name: 'Quadriceps',
        muscleGroup: 8
    },
    {
        id: 17,
        name: 'Hamstrings',
        muscleGroup: 8
    },
    {
        id: 2,
        name: 'Adductor Longus',
        muscleGroup: 8
    },
    {
        id: 3,
        name: 'Adductor Magnus',
        muscleGroup: 8
    },
    {
        id: 16,
        name: 'Gracilis',
        muscleGroup: 8
    },
    {
        id: 23,
        name: 'Pectineus',
        muscleGroup: 8
    },
    {
        id: 26,
        name: 'Popliteus',
        muscleGroup: 8
    },
    {
        id: 12,
        name: 'Gastrocnemius',
        muscleGroup: 9
    },
    {
        id: 32,
        name: 'Soleus',
        muscleGroup: 9
    },
    {
        id: 39,
        name: 'Tibialis Anterior',
        muscleGroup: 9
    },
]

export default class WorkoutLookupSeeder implements Seeder {
 public async run(dataSource: DataSource): Promise<void> {
        // groups first: muscles reference them via foreign key
        await dataSource.getRepository(MuscleGroup).upsert(MuscleGroupSeed, ['id']);
        await dataSource.getRepository(Muscle).upsert(
            MuscleSeed.map(({ muscleGroup, ...m }) => ({ ...m, muscleGroup: { id: muscleGroup } })),
            ['id'],
        );
    }
}