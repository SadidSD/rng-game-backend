import { EventsService } from './events.service';
import { CreateEventDto, RegisterPlayerDto } from './dto/events.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    create(req: any, dto: CreateEventDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        description: string | null;
        game: string;
        image: string | null;
        location: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        date: Date;
        maxPlayers: number | null;
        format: string | null;
        entryFee: import("@prisma/client/runtime/library").Decimal;
        prizes: string | null;
    }>;
    update(req: any, id: string, dto: Partial<CreateEventDto>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        description: string | null;
        game: string;
        image: string | null;
        location: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        date: Date;
        maxPlayers: number | null;
        format: string | null;
        entryFee: import("@prisma/client/runtime/library").Decimal;
        prizes: string | null;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        description: string | null;
        game: string;
        image: string | null;
        location: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        date: Date;
        maxPlayers: number | null;
        format: string | null;
        entryFee: import("@prisma/client/runtime/library").Decimal;
        prizes: string | null;
    }>;
    findAllAdmin(req: any): Promise<({
        _count: {
            players: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        description: string | null;
        game: string;
        image: string | null;
        location: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        date: Date;
        maxPlayers: number | null;
        format: string | null;
        entryFee: import("@prisma/client/runtime/library").Decimal;
        prizes: string | null;
    })[]>;
    findAll(req: any): Promise<({
        _count: {
            players: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        description: string | null;
        game: string;
        image: string | null;
        location: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        date: Date;
        maxPlayers: number | null;
        format: string | null;
        entryFee: import("@prisma/client/runtime/library").Decimal;
        prizes: string | null;
    })[]>;
    findOne(req: any, id: string): Promise<{
        players: {
            id: string;
            createdAt: Date;
            customerId: string | null;
            playerName: string;
            playerEmail: string | null;
            deckList: string | null;
            eventId: string;
            paid: boolean;
            checkedIn: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        description: string | null;
        game: string;
        image: string | null;
        location: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        date: Date;
        maxPlayers: number | null;
        format: string | null;
        entryFee: import("@prisma/client/runtime/library").Decimal;
        prizes: string | null;
    }>;
    register(req: any, id: string, dto: RegisterPlayerDto): Promise<{
        id: string;
        createdAt: Date;
        customerId: string | null;
        playerName: string;
        playerEmail: string | null;
        deckList: string | null;
        eventId: string;
        paid: boolean;
        checkedIn: boolean;
    }>;
}
