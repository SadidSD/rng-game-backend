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
        date: Date;
        maxPlayers: number | null;
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
        date: Date;
        maxPlayers: number | null;
    })[]>;
    findOne(storeId: string, id: string): Promise<{
        players: {
            id: string;
            createdAt: Date;
            playerName: string;
            playerEmail: string | null;
            eventId: string;
            paid: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        description: string | null;
        date: Date;
        maxPlayers: number | null;
    }>;
    registerPlayer(storeId: string, eventId: string, dto: RegisterPlayerDto): Promise<{
        id: string;
        createdAt: Date;
        playerName: string;
        playerEmail: string | null;
        eventId: string;
        paid: boolean;
    }>;
}
