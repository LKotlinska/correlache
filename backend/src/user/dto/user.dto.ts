import { Equals, IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

const HEALTH_CONSENT_MESSAGE = 'You must consent to the processing of your health data';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;

    /** Explicit consent to processing health data (GDPR art. 9(2)(a)). Signup is refused without it. */
    @Equals(true, { message: HEALTH_CONSENT_MESSAGE })
    healthDataConsent: boolean;
}

/** Consent given after signup, by accounts created before signup asked for it. */
export class GiveConsentDto {
    @Equals(true, { message: HEALTH_CONSENT_MESSAGE })
    healthDataConsent: boolean;
}

export class LoginDto {
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;    
}