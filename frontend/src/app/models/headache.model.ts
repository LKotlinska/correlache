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