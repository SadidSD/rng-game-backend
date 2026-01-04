import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ManapoolService } from './manapool.service';
import { ManapoolController } from './manapool.controller';

@Module({
    imports: [ConfigModule],
    controllers: [ManapoolController],
    providers: [ManapoolService],
    exports: [ManapoolService]
})
export class ManapoolModule { }
