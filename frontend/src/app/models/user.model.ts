export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    healthDataConsent: boolean;
}

export type authUserPayload = Omit<CreateUserPayload, 'name' | 'healthDataConsent'>;