import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, RegisterPlayerDto } from './dto/events.dto';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async create(storeId: string, dto: CreateEventDto) {
        return this.prisma.event.create({
            data: {
                name: dto.name,
                description: dto.description,
                date: new Date(dto.date),
                maxPlayers: dto.maxPlayers,
                game: dto.game,
                format: dto.format,
                entryFee: dto.entryFee,
                image: dto.image,
                prizes: dto.prizes,
                location: dto.location,
                status: dto.status as any,
                storeId,
            },
        });
    }

    async findAll(storeId: string) {
        return this.prisma.event.findMany({
            where: { storeId },
            orderBy: { date: 'asc' },
            include: {
                _count: { select: { players: true } }
            }
        });
    }

    async findPublic(storeId: string) {
        return this.prisma.event.findMany({
            where: {
                storeId,
                status: { not: 'CANCELLED' }
            },
            orderBy: { date: 'asc' },
            include: {
                _count: { select: { players: true } }
            }
        });
    }

    async findOne(storeId: string, id: string) {
        const event = await this.prisma.event.findFirst({
            where: { id, storeId },
            include: { players: true }
        });
        if (!event) throw new NotFoundException('Event not found');
        return event;
    }

    async update(storeId: string, id: string, dto: Partial<CreateEventDto>) {
        await this.findOne(storeId, id); // check exists
        return this.prisma.event.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
                status: dto.status as any,
            }
        });
    }

    async remove(storeId: string, id: string) {
        await this.findOne(storeId, id);
        return this.prisma.event.delete({ where: { id } });
    }

    async registerPlayer(storeId: string, eventId: string, dto: RegisterPlayerDto) {
        const event = await this.findOne(storeId, eventId);

        if (event.maxPlayers && event.players.length >= event.maxPlayers) {
            throw new Error('Event is full');
        }

        // Prevent duplicate registration for same email or customerId
        const existing = event.players.find(p =>
            (dto.customerId && p.customerId === dto.customerId) ||
            (dto.playerEmail && p.playerEmail === dto.playerEmail)
        );

        if (existing) {
            throw new Error('Player already registered');
        }

        return this.prisma.eventPlayer.create({
            data: {
                eventId,
                playerName: dto.playerName,
                playerEmail: dto.playerEmail,
                customerId: dto.customerId,
                deckList: dto.deckList
            }
        });
    }
}
