import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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
                _count: { select: { players: true, waitlist: true } }
            }
        });
    }

    async findPublic(storeId: string) {
        return this.prisma.event.findMany({
            where: {
                storeId,
                status: { not: 'CANCELLED' },
                date: { gte: new Date() }
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
            include: { players: { include: { ticket: true } }, waitlist: { orderBy: { position: 'asc' } } }
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

    /**
     * Register a player for an event.
     * - If event is full → adds to waitlist and returns { waitlisted: true, position }
     * - If player already registered → throws ConflictException
     * - Otherwise → creates EventPlayer and returns { waitlisted: false, player }
     */
    async registerPlayer(storeId: string, eventId: string, dto: RegisterPlayerDto) {
        const event = await this.findOne(storeId, eventId);

        // Resolve customerId if not explicitly provided but exists under playerEmail
        let customerId = dto.customerId;
        if (!customerId && dto.playerEmail) {
            const customer = await this.prisma.customer.findFirst({
                where: { storeId, email: dto.playerEmail }
            });
            if (customer) {
                customerId = customer.id;
            }
        }

        // Prevent duplicate registration
        const existing = event.players.find(p =>
            (customerId && p.customerId === customerId) ||
            (dto.playerEmail && p.playerEmail === dto.playerEmail)
        );
        if (existing) {
            throw new ConflictException('Player already registered');
        }

        // Check if already on waitlist
        if (dto.playerEmail) {
            const onWaitlist = await this.prisma.eventWaitlist.findFirst({
                where: { eventId, playerEmail: dto.playerEmail }
            });
            if (onWaitlist) {
                throw new ConflictException('You are already on the waitlist for this event');
            }
        }

        // If event is full, add to waitlist
        if (event.maxPlayers && event.players.length >= event.maxPlayers) {
            const lastInQueue = await this.prisma.eventWaitlist.findFirst({
                where: { eventId },
                orderBy: { position: 'desc' }
            });
            const position = (lastInQueue?.position ?? 0) + 1;

            const waitlistEntry = await this.prisma.eventWaitlist.create({
                data: {
                    eventId,
                    playerName: dto.playerName,
                    playerEmail: dto.playerEmail || '',
                    position,
                }
            });

            return { waitlisted: true, position, waitlistId: waitlistEntry.id };
        }

        // Normal registration
        const player = await this.prisma.eventPlayer.create({
            data: {
                eventId,
                playerName: dto.playerName,
                playerEmail: dto.playerEmail,
                customerId: customerId,
                deckList: dto.deckList
            }
        });

        return { waitlisted: false, player };
    }

    /**
     * Create a pending player registration (paid: false) for Stripe checkout flow.
     * Returns the playerId so the Stripe session metadata can reference it.
     */
    async createPendingPlayer(storeId: string, eventId: string, dto: RegisterPlayerDto) {
        const event = await this.findOne(storeId, eventId);

        // Resolve customerId if not explicitly provided but exists under playerEmail
        let customerId = dto.customerId;
        if (!customerId && dto.playerEmail) {
            const customer = await this.prisma.customer.findFirst({
                where: { storeId, email: dto.playerEmail }
            });
            if (customer) {
                customerId = customer.id;
            }
        }

        // Prevent duplicate
        const existing = event.players.find(p =>
            (dto.playerEmail && p.playerEmail === dto.playerEmail) ||
            (customerId && p.customerId === customerId)
        );
        if (existing) {
            throw new ConflictException('Player already registered');
        }

        // If event is full, return waitlist indicator
        if (event.maxPlayers && event.players.length >= event.maxPlayers) {
            return { full: true };
        }

        const player = await this.prisma.eventPlayer.create({
            data: {
                eventId,
                playerName: dto.playerName,
                playerEmail: dto.playerEmail,
                customerId,
                paid: false,
            }
        });

        return { full: false, player };
    }

    /**
     * Get all registered events for the currently logged in customer.
     */
    async getMyRegistrations(storeId: string, email: string) {
        return this.prisma.eventPlayer.findMany({
            where: {
                playerEmail: email,
                event: { storeId }
            },
            include: {
                event: true,
                ticket: true
            },
            orderBy: {
                event: { date: 'asc' }
            }
        });
    }

    async updatePlayer(storeId: string, eventId: string, playerId: string, data: { paid?: boolean; checkedIn?: boolean }) {
        await this.findOne(storeId, eventId); // verify event exists and belongs to store
        const player = await this.prisma.eventPlayer.findFirst({
            where: { id: playerId, eventId }
        });
        if (!player) throw new NotFoundException('Player not found');
        return this.prisma.eventPlayer.update({
            where: { id: playerId },
            data
        });
    }

    async removePlayer(storeId: string, eventId: string, playerId: string) {
        await this.findOne(storeId, eventId);
        const player = await this.prisma.eventPlayer.findFirst({
            where: { id: playerId, eventId }
        });
        if (!player) throw new NotFoundException('Player not found');
        await this.prisma.eventPlayer.delete({ where: { id: playerId } });

        // Promote the next person from the waitlist
        const next = await this.prisma.eventWaitlist.findFirst({
            where: { eventId },
            orderBy: { position: 'asc' }
        });

        if (next) {
            // Create a new player from the waitlist entry
            const promoted = await this.prisma.eventPlayer.create({
                data: {
                    eventId,
                    playerName: next.playerName,
                    playerEmail: next.playerEmail,
                    paid: false,
                }
            });

            // Mark as notified and remove from waitlist
            await this.prisma.eventWaitlist.delete({ where: { id: next.id } });

            return { removed: true, promoted: { id: promoted.id, playerName: promoted.playerName, playerEmail: promoted.playerEmail } };
        }

        return { removed: true, promoted: null };
    }

    // --- Waitlist Admin ---
    async getWaitlist(storeId: string, eventId: string) {
        await this.findOne(storeId, eventId);
        return this.prisma.eventWaitlist.findMany({
            where: { eventId },
            orderBy: { position: 'asc' }
        });
    }

    async removeFromWaitlist(storeId: string, eventId: string, waitlistId: string) {
        await this.findOne(storeId, eventId);
        const entry = await this.prisma.eventWaitlist.findFirst({ where: { id: waitlistId, eventId } });
        if (!entry) throw new NotFoundException('Waitlist entry not found');
        return this.prisma.eventWaitlist.delete({ where: { id: waitlistId } });
    }
}
