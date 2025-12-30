import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { EbayService } from './ebay.service';
import { TcgPlayerService } from './tcgplayer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class IntegrationsController {
    constructor(
        private readonly ebayService: EbayService,
        private readonly tcgPlayerService: TcgPlayerService
    ) { }

    @Post('ebay/sync')
    syncEbay(@Request() req) {
        return this.ebayService.syncInventory(req.user.storeId);
    }

    @Post('tcgplayer/sync')
    syncTcgPlayer(@Request() req) {
        return this.tcgPlayerService.syncPricing(req.user.storeId);
    }
}
