import { IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    date: string; // ISO String

    @IsNumber()
    @IsOptional()
    maxPlayers?: number;
}

export class RegisterPlayerDto {
    @IsString()
    @IsNotEmpty()
    playerName: string;

    @IsEmail()
    @IsOptional()
    playerEmail?: string;
}
