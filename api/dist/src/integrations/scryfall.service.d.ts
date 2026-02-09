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
        manaCost: any;
        manaValue: any;
        colors: any;
        colorIdentity: any;
        typeLine: any;
        power: any;
        toughness: any;
        loyalty: any;
        supertypes: never[];
        subtypes: never[];
    } | null>;
}
