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

    @IsString()
    @IsOptional()
    game?: string;

    @IsString()
    @IsOptional()
    format?: string;

    @IsNumber()
    @IsOptional()
    entryFee?: number;

    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsOptional()
    prizes?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    status?: string;
}

export class UpdateEventDto extends CreateEventDto { }

export class RegisterPlayerDto {
    @IsString()
    @IsNotEmpty()
    playerName: string;

    @IsEmail()
    @IsOptional()
    playerEmail?: string;

    @IsString()
    @IsOptional()
    customerId?: string;

    @IsString()
    @IsOptional()
    deckList?: string;
}
