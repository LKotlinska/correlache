import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension"
import { Muscle } from "../../exercise-library/lookups/muscle.entity.js";
import { MuscleGroup } from "../../exercise-library/lookups/muscle-group.entity.js";

export const MuscleGroupSeed = [
    { id: 1, name: 'Neck & upper traps' },
    { id: 2, name: 'Shoulders' },
    { id: 3, name: 'Chest' },
    { id: 4, name: 'Back' },
    { id: 5, name: 'Arms' },
    { id: 6, name: 'Core' },
    { id: 7, name: 'Hips & glutes' },
    { id: 8, name: 'Legs' },
    { id: 9, name: 'Calves & shins' },
];

// `aliases` are the other spellings the exercises dataset uses for the same muscle
// (it mixes e.g. "delts" / "deltoids" / "shoulders"); they are folded into one row here.
export const MuscleSeed = [
    { name: 'Trapezius', muscleGroup: 1, aliases: ['traps', 'trapezius'] },
    { name: 'Levator scapulae', muscleGroup: 1, aliases: [] },
    { name: 'Sternocleidomastoid', muscleGroup: 1, aliases: [] },
    { name: 'Deltoids', muscleGroup: 2, aliases: ['delts', 'deltoids', 'shoulders'] },
    { name: 'Rear deltoids', muscleGroup: 2, aliases: [] },
    { name: 'Rotator cuff', muscleGroup: 2, aliases: [] },
    { name: 'Pectorals', muscleGroup: 3, aliases: ['chest', 'upper chest'] },
    { name: 'Serratus anterior', muscleGroup: 3, aliases: [] },
    { name: 'Latissimus dorsi', muscleGroup: 4, aliases: ['lats'] },
    { name: 'Upper back', muscleGroup: 4, aliases: ['back'] },
    { name: 'Rhomboids', muscleGroup: 4, aliases: [] },
    { name: 'Lower back', muscleGroup: 4, aliases: ['spine'] },
    { name: 'Biceps', muscleGroup: 5, aliases: [] },
    { name: 'Brachialis', muscleGroup: 5, aliases: [] },
    { name: 'Triceps', muscleGroup: 5, aliases: [] },
    { name: 'Forearms', muscleGroup: 5, aliases: ['wrist flexors', 'wrist extensors', 'wrists', 'hands', 'grip muscles'] },
    { name: 'Abs', muscleGroup: 6, aliases: ['abdominals', 'lower abs', 'core'] },
    { name: 'Obliques', muscleGroup: 6, aliases: [] },
    { name: 'Glutes', muscleGroup: 7, aliases: [] },
    { name: 'Hip flexors', muscleGroup: 7, aliases: [] },
    { name: 'Abductors', muscleGroup: 7, aliases: [] },
    { name: 'Adductors', muscleGroup: 8, aliases: ['inner thighs', 'groin'] },
    { name: 'Quadriceps', muscleGroup: 8, aliases: ['quads'] },
    { name: 'Hamstrings', muscleGroup: 8, aliases: [] },
    { name: 'Calves', muscleGroup: 9, aliases: [] },
    { name: 'Soleus', muscleGroup: 9, aliases: [] },
    { name: 'Ankles & feet', muscleGroup: 9, aliases: ['ankles', 'ankle stabilizers', 'feet'] },
    { name: 'Shins', muscleGroup: 9, aliases: [] },
];

// lower-cased dataset muscle name -> muscles.name
export const MuscleAliases = new Map<string, string>(
    MuscleSeed.flatMap(({ name, aliases }) =>
        [name, ...aliases].map((alias) => [alias.toLowerCase(), name] as [string, string]),
    ),
);

export default class WorkoutLookupSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        // groups first: muscles reference them via foreign key
        await dataSource.getRepository(MuscleGroup).upsert(MuscleGroupSeed, ['id']);
        await dataSource.getRepository(Muscle).upsert(
            MuscleSeed.map(({ name, muscleGroup }) => ({ name, muscleGroup: { id: muscleGroup } })),
            ['name'],
        );
    }
}
