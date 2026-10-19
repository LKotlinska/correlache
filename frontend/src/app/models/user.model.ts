export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
}

export type authUserPayload = Omit<CreateUserPayload, 'name'>;