import type { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { Location } from '../../headaches/lookups/location.entity.js';
import { ReliefMeasure } from '../../headaches/lookups/relief-measure.entity.js';
import { Symptom } from '../../headaches/lookups/symptom.entity.js';
import { Trigger } from '../../headaches/lookups/trigger.entity.js';

export const LocationSeed = [
    {
        name: 'Forehead band',
        image: 'forehead.png'
    },
    {
        name: 'One side',
        image: 'oneside.png'
    },
    {
        name: 'Around eye',
        image: 'aroundeye.png'
    },    
    {
        name: 'Behind eye',
        image: 'behindeye.png'
    },    
    {
        name: 'Scattered, top of head',
        image: 'tophead.png'
    },    
    {
        name: 'Scattered, scalp and neck',
        image: 'scalpneck.png'
    },    
    {
        name: 'Sinus area',
        image: 'sinus.png'
    },    
    {
        name: 'Back of head',
        image: 'backhead.png'
    },    
    {
        name: 'Neck to temple',
        image: 'necktemple.png'
    },    
]

export const ReliefMeasureSeed = [
    {
        name: 'Caffeine'
    }, 
    {
        name: 'Hydration'
    }, 
    {
        name: 'Cold compress'
    }, 
    {
        name: 'Warm compress'
    }, 
    {
        name: 'Rest in a quiet, dark room'
    }, 
    {
        name: 'Massage'
    }, 
    {
        name: 'Aromatherapy'
    }, 
]

export const SymptomSeed = [
    {
        name: 'Nausea'
    },
    {
        name: 'Light sensitivity'
    },
    {
        name: 'Sound sensitivity'
    },
    {
        name: 'Smell sensitivity'
    },
    {
        name: 'Throbbing'
    },
    {
        name: 'Vomiting'
    },
    {
        name: 'Neck stiffness'
    },
    {
        name: 'Trouble speaking'
    },
    {
        name: 'Vision loss'
    },
    {
        name: 'Confusion'
    },
    {
        name: 'Mood changes'
    },
    {
        name: 'Aura'
    },
]

export const TriggerSeed = [
    {
        name: 'Physical strain'
    },
    {
        name: 'Lack of sleep'
    }, 
    {
        name: 'Hunger'
    },
    {
        name: 'Dehydration'
    },
    {
        name: 'Tense muscles'
    },
    {
        name: 'Stress'
    },
    {
        name: 'Bright lights'
    },
    {
        name: 'Strong smells'
    },
    {
        name: 'Loud sounds'
    },
    {
        name: 'Alcohol'
    },
    {
        name: 'Caffeine'
    },
    {
        name: 'Hormonal shifts'
    },

]

export default class HeadacheLookupSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        // name is unique, so upsert keeps re-runs idempotent
        await dataSource.getRepository(Location).upsert(LocationSeed, ['name']);
        await dataSource.getRepository(ReliefMeasure).upsert(ReliefMeasureSeed, ['name']);
        await dataSource.getRepository(Symptom).upsert(SymptomSeed, ['name']);
        await dataSource.getRepository(Trigger).upsert(TriggerSeed, ['name']);
    }
}
