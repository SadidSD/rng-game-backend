import { IsOptional, IsString } from 'class-validator';

export class UpdateStoreDto {
    @IsString()
    @IsOptional()
    name?: string;

    // Add more settings later (theme, logoUrl from uploads)
}
