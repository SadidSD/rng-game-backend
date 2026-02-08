export declare class CreateEventDto {
    name: string;
    description?: string;
    date: string;
    maxPlayers?: number;
    game?: string;
    format?: string;
    entryFee?: number;
    image?: string;
    prizes?: string;
    location?: string;
    status?: string;
}
export declare class UpdateEventDto extends CreateEventDto {
}
export declare class RegisterPlayerDto {
    playerName: string;
    playerEmail?: string;
    customerId?: string;
    deckList?: string;
}
