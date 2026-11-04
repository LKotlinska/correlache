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
    reliefIds: number[]
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
}