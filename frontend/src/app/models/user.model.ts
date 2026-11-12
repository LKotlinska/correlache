export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    healthDataConsent: boolean;
}

export interface MeResponse {
    id: string;
    username: string;
    email: string;
    hasHealthDataConsent: boolean;
}

export type authUserPayload = Omit<CreateUserPayload, 'name' | 'healthDataConsent'>;
/** How much of one kind of entry the user has logged. */
export interface SourceSummary {
    count: number;
    /** ISO time the earliest entry started, or null when there are none. */
    firstStartedAt: string | null;
}

export interface HistorySummary {
    headaches: SourceSummary;
    workouts: SourceSummary;
}
