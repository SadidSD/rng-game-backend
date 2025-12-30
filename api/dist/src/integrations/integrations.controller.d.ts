import { EbayService } from './ebay.service';
import { TcgPlayerService } from './tcgplayer.service';
export declare class IntegrationsController {
    private readonly ebayService;
    private readonly tcgPlayerService;
    constructor(ebayService: EbayService, tcgPlayerService: TcgPlayerService);
    syncEbay(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    syncTcgPlayer(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
