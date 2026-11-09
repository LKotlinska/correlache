import { HeadacheIntakePayload, MedicationIntake } from './medication.model';

export interface LookupOption {
    id: number;
    name: string;
}

export interface LocationLookupOption {
    id: number;
    name: string;
    image: string;   
}

export interface HeadacheOptions {
    headacheLocations: LocationLookupOption[];
    triggers: LookupOption[];
    symptoms: LookupOption[];
    reliefMeasures: LookupOption[];
}

export interface CreateHeadachePayload {
    startedAt: string,
    endedAt?: string,
    painLevel: number,
    notes?: string,
    locationIds: number[],
    triggerIds: number[],
    symptomIds: number[],
    reliefIds: number[],
    /** Doses to add (no `id`) or update (with `id`); doses not listed are kept as they are. */
    intakes?: HeadacheIntakePayload[],
    /** Doses the form loaded and the user removed; only these are deleted. */
    removedIntakeIds?: string[]
}

export interface Headache {
    id: string,
    startedAt: string,
    endedAt: string | null,
    painLevel: number,
    notes: string | null,
    /** Included in the list response only */
    locations?: LookupOption[],
    symptoms?: LookupOption[],
    triggers?: LookupOption[]
}

export interface HeadacheDetail extends Headache {
    locations: LocationLookupOption[];
    triggers: LookupOption[];
    symptoms: LookupOption[];
    reliefMeasures: LookupOption[];
    /** Doses taken for this headache, earliest first. */
    intakes: MedicationIntake[];
}