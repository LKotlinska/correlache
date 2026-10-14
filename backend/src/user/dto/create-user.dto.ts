import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

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
}
