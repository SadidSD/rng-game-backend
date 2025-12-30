import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum InventoryAction {
    ADD = 'ADD',
    REMOVE = 'REMOVE',
    SET = 'SET'
}

export class UpdateInventoryDto {
    @IsEnum(InventoryAction)
    action: InventoryAction;

    @IsInt()
    quantity: number;

    @IsString()
    @IsOptional()
    reason?: string;
}
