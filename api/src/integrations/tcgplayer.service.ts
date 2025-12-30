import { Injectable } from '@nestjs/common';

@Injectable()
export class TcgPlayerService {
  async syncPricing(storeId: string) {
    console.log(`[TCGplayer] Syncing pricing for store ${storeId}...`);
    // TODO: Implement TCGplayer Pricing API calls
    return { success: true, message: 'Pricing sync started' };
  }
}
