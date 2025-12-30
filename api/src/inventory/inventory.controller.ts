import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get(':variantId')
    @Roles(Role.ADMIN, Role.STAFF) // Owner implied? No, Owner role usually needs explicit include if not hierarchal. But RolesGuard checks exact match.
    // Actually, let's just use ADMIN/STAFF for now. Owner usually is Admin.
    findOne(@Request() req, @Param('variantId') variantId: string) {
        return this.inventoryService.getInventory(req.user.storeId, variantId);
    }

    @Patch(':variantId')
    @Roles(Role.ADMIN, Role.STAFF)
    update(@Request() req, @Param('variantId') variantId: string, @Body() dto: UpdateInventoryDto) {
        return this.inventoryService.updateInventory(req.user.storeId, variantId, dto);
    }
}
