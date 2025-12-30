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
        date: Date;
        maxPlayers: number | null;
    }>;
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
        date: Date;
        maxPlayers: number | null;
    })[]>;
    register(req: any, id: string, dto: RegisterPlayerDto): Promise<{
        id: string;
        createdAt: Date;
        playerName: string;
        playerEmail: string | null;
        eventId: string;
        paid: boolean;
    }>;
}
