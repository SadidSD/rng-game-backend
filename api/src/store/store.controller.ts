import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { StoreService } from './store.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('store')
@UseGuards(AuthGuard('jwt'))
export class StoreController {
    constructor(private readonly storeService: StoreService) { }

    @Post('api-key')
    generateApiKey(@Request() req) {
        // Only Admin should generate API key?
        // For now, allow any authenticated user of the store
        return this.storeService.generateApiKey(req.user.storeId);
    }

    @Get()
    getStore(@Request() req) {
        return this.storeService.getStore(req.user.storeId);
    }
}
