import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ManapoolService } from './manapool.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/dto/auth.dto';

@Controller('integrations/manapool')
export class ManapoolController {
    constructor(private readonly manapoolService: ManapoolService) { }

    @Get('search')
    async search(@Query('query') query: string, @Query('game') game: string) {
        return this.manapoolService.searchCards(query, game);
    }
}
