import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { StoreService } from './store.service';
import { UpdateStoreDto } from './dto/store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('store')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OWNER)
export class StoreController {
    constructor(private readonly storeService: StoreService) { }

    @Get()
    getSettings(@Request() req) {
        return this.storeService.findOne(req.user.storeId);
    }

    @Patch()
    updateSettings(@Request() req, @Body() dto: UpdateStoreDto) {
        return this.storeService.update(req.user.storeId, dto);
    }
}
