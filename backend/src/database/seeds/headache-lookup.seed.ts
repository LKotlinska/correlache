import type { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { HeadacheLocation } from '../../headaches/lookups/headache-location.entity.js';
import { ReliefMeasure } from '../../headaches/lookups/relief-measure.entity.js';
import { Symptom } from '../../headaches/lookups/symptom.entity.js';
import { Trigger } from '../../headaches/lookups/trigger.entity.js';

export const LocationSeed = [
    {
        name: 'Forehead band',
        image: 'forehead.svg'
    },
    {
        name: 'Left side',
        image: 'leftside.svg'
    },
        {
        name: 'Right side',
        image: 'rightside.svg'
    },
    {
        name: 'Behind left eye',
        image: 'lefteye.svg'
    },   
    {
        name: 'Behind right eye',
        image: 'righteye.svg'
    },  
    {
        name: 'Whole head',
        image: 'wholehead.svg'
    },  
    {
        name: 'Scattered, top of head',
        image: 'tophead.svg'
    },    
    {
        name: 'Scattered, scalp and neck',
        image: 'scalpneck.svg'
    },    
    {
        name: 'Sinus area',
        image: 'sinus.svg'
    },    
    {
        name: 'Back of head',
        image: 'backhead.svg'
    },    
    {
        name: 'Neck to temple',
        image: 'necktemple.svg'
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
        name: 'Neck or shoulder stiffness'
    },
    {
        name: 'Neck pain'
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
        name: 'Trouble concentrating'
    },
    {
        name: 'Mood changes'
    },
    {
        name: 'Aura'
    },
    {
        name: 'Congested nose'
    },
    {
        name: 'Fever'
    },
    {
        name: 'Dizziness'
    }, 
    {
        name: 'Fatigue'
    },
    {
        name: 'Pressing or tightening'
    },
    {
        name: 'Worse with movement'
    },
    {
        name: 'Worse when moving neck'
    },
    {
        name: 'Watery or red eye'
    },
    {
        name: 'Restlessness'
    },
    {
        name: 'Sudden, severe onset'
    },
    {
        name: 'Runny nose'
    },
    {
        name: 'Drooping or swollen eyelid'
    },
    {
        name: 'Forehead or face sweating'
    },
    {
        name: 'Woke me from sleep'
    },
    {
        name: 'Zigzag lines or flashing lights'
    },
    {
        name: 'Spreading tingling or numbness'
    },
]

export const TriggerSeed = [
    {
        name: 'Physical strain'
    },
    {
        name: 'Cardio'
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
    {
        name: 'Infection'
    },
    {
        name: 'Cough or straining'
    },

]

export default class HeadacheLookupSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        // name is unique, so upsert keeps re-runs idempotent
        await dataSource.getRepository(HeadacheLocation).upsert(LocationSeed, ['name']);
        await dataSource.getRepository(ReliefMeasure).upsert(ReliefMeasureSeed, ['name']);
        await dataSource.getRepository(Symptom).upsert(SymptomSeed, ['name']);
        await dataSource.getRepository(Trigger).upsert(TriggerSeed, ['name']);
    }
}
