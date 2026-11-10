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