export declare class ScryfallService {
    private readonly baseUrl;
    private readonly httpsAgent;
    searchCardByName(name: string): Promise<{
        id: any;
        name: any;
        set: any;
        setId: any;
        image: any;
        rarity: any;
        oracleId: any;
        oracleText: any;
        legalities: any;
        tcgplayerUrl: any;
        price: any;
    } | null>;
}
