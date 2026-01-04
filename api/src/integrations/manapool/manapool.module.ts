import { Module } from '@nestjs/common';
import { ManapoolService } from './manapool.service';
import { ManapoolController } from './manapool.controller';

@Module({
    controllers: [ManapoolController],
    providers: [ManapoolService],
    exports: [ManapoolService]
})
export class ManapoolModule { }
