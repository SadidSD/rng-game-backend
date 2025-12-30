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
                storeId,
            },
        });
    }

    async findAll(storeId: string) {
        return this.prisma.event.findMany({
            where: { storeId },
            orderBy: { date: 'asc' },
            include: { _count: { select: { players: true } } }
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

    async registerPlayer(storeId: string, eventId: string, dto: RegisterPlayerDto) {
        const event = await this.findOne(storeId, eventId);

        if (event.maxPlayers && event.players.length >= event.maxPlayers) {
            throw new Error('Event is full');
        }

        return this.prisma.eventPlayer.create({
            data: {
                eventId,
                playerName: dto.playerName,
                playerEmail: dto.playerEmail
            }
        });
    }
}
