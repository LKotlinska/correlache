import { Equals, IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

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
    @Equals(true, { message: 'You must consent to the processing of your health data' })
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