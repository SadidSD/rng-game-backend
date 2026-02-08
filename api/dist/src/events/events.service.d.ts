import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, RegisterPlayerDto } from './dto/events.dto';
export declare class EventsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(storeId: string, dto: CreateEventDto): Promise<{
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
    findAll(storeId: string): Promise<({
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
    findPublic(storeId: string): Promise<({
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
    findOne(storeId: string, id: string): Promise<{
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
    update(storeId: string, id: string, dto: Partial<CreateEventDto>): Promise<{
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
    remove(storeId: string, id: string): Promise<{
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
    registerPlayer(storeId: string, eventId: string, dto: RegisterPlayerDto): Promise<{
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
