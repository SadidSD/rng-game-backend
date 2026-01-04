import { ManapoolService } from './manapool.service';
export declare class ManapoolController {
    private readonly manapoolService;
    constructor(manapoolService: ManapoolService);
    search(query: string, game: string): Promise<any>;
}
