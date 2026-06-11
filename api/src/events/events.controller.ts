import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete, Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import { TicketsService } from './tickets.service';
import { CreateEventDto, RegisterPlayerDto } from './dto/events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';
import { StripeService } from '../payments/stripe.service';

@Controller('events')
export class EventsController {
    private readonly logger = new Logger(EventsController.name);

    constructor(
        private readonly eventsService: EventsService,
        private readonly ticketsService: TicketsService,
        private readonly stripeService: StripeService,
    ) { }

    // ─── Admin Endpoints ────────────────────────────────────────────────────────

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    create(@Request() req, @Body() dto: CreateEventDto) {
        return this.eventsService.create(req.user.storeId, dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    update(@Request() req, @Param('id') id: string, @Body() dto: Partial<CreateEventDto>) {
        return this.eventsService.update(req.user.storeId, id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    remove(@Request() req, @Param('id') id: string) {
        return this.eventsService.remove(req.user.storeId, id);
    }

    @Get('admin/list')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    findAllAdmin(@Request() req) {
        return this.eventsService.findAll(req.user.storeId);
    }

    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    findOneAdmin(@Request() req, @Param('id') id: string) {
        return this.eventsService.findOne(req.user.storeId, id);
    }

    @Patch(':eventId/players/:playerId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    updatePlayer(
        @Request() req,
        @Param('eventId') eventId: string,
        @Param('playerId') playerId: string,
        @Body() body: { paid?: boolean; checkedIn?: boolean }
    ) {
        return this.eventsService.updatePlayer(req.user.storeId, eventId, playerId, body);
    }

    @Delete(':eventId/players/:playerId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    async removePlayer(
        @Request() req,
        @Param('eventId') eventId: string,
        @Param('playerId') playerId: string,
    ) {
        const result = await this.eventsService.removePlayer(req.user.storeId, eventId, playerId);

        // If someone was promoted from the waitlist, generate their ticket (free) and email them
        if (result.promoted && result.promoted.playerEmail) {
            try {
                await this.ticketsService.generateTicket(result.promoted.id);
            } catch (err) {
                this.logger.error('Failed to generate ticket for promoted waitlist player', err);
            }
        }

        return result;
    }

    // ─── Admin Waitlist Endpoints ──────────────────────────────────────────────

    @Get(':eventId/waitlist')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getWaitlist(@Request() req, @Param('eventId') eventId: string) {
        return this.eventsService.getWaitlist(req.user.storeId, eventId);
    }

    @Delete(':eventId/waitlist/:waitlistId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    removeFromWaitlist(
        @Request() req,
        @Param('eventId') eventId: string,
        @Param('waitlistId') waitlistId: string,
    ) {
        return this.eventsService.removeFromWaitlist(req.user.storeId, eventId, waitlistId);
    }

    // ─── Public Storefront Endpoints ──────────────────────────────────────────

    @Get()
    @UseGuards(ApiKeyGuard)
    findAll(@Request() req) {
        return this.eventsService.findPublic(req.store.id);
    }

    @Get(':id')
    @UseGuards(ApiKeyGuard)
    findOne(@Request() req, @Param('id') id: string) {
        return this.eventsService.findOne(req.store.id, id);
    }

    /**
     * POST /events/:id/register
     * Free events: registers player immediately, generates QR ticket, emails.
     * Paid events: use /checkout instead.
     */
    @Post(':id/register')
    @UseGuards(ApiKeyGuard)
    async register(@Request() req, @Param('id') id: string, @Body() dto: RegisterPlayerDto) {
        const result = await this.eventsService.registerPlayer(req.store.id, id, dto);

        // If successfully registered (not waitlisted), generate a ticket
        if (!result.waitlisted && result.player) {
            try {
                // Mark as paid for free events, then generate ticket
                if (result.player.playerEmail) {
                    await this.ticketsService.generateTicket(result.player.id);
                }
            } catch (err) {
                this.logger.error('Failed to generate ticket after free registration', err);
            }
        }

        return result;
    }

    /**
     * POST /events/:id/checkout
     * Paid events: creates a pending player and a Stripe Checkout session.
     * Returns { checkoutUrl } for the frontend to redirect to.
     * Free events: registers directly (same as /register).
     */
    @Post(':id/checkout')
    @UseGuards(ApiKeyGuard)
    async checkout(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: RegisterPlayerDto & { successUrl?: string; cancelUrl?: string }
    ) {
        // Fetch the event to check entry fee
        const event = await this.eventsService.findOne(req.store.id, id);
        const entryFee = Number(event.entryFee);

        // Free event — register directly
        if (entryFee === 0) {
            return this.register(req, id, dto);
        }

        // Paid event — create a pending registration then Stripe session
        const pendingResult = await this.eventsService.createPendingPlayer(req.store.id, id, dto);

        if (pendingResult.full) {
            // Send to waitlist
            return this.eventsService.registerPlayer(req.store.id, id, dto);
        }

        const player = pendingResult.player!;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const successUrl = dto.successUrl || `${frontendUrl}/events?payment=success&session={CHECKOUT_SESSION_ID}`;
        const cancelUrl = dto.cancelUrl || `${frontendUrl}/events?payment=cancelled`;

        try {
            const session = await this.stripeService.createCheckoutSession({
                items: [{
                    name: event.name,
                    price: entryFee,
                    quantity: 1,
                }],
                customerEmail: dto.playerEmail || '',
                orderId: `event-${id}-player-${player.id}`,
                successUrl,
                cancelUrl,
            });

            // Store session ID on the player record
            await this.eventsService.updatePlayer(req.store.id, id, player.id, {});

            return {
                checkoutUrl: session.url,
                sessionId: session.sessionId,
                playerId: player.id,
            };
        } catch (err) {
            this.logger.error('Stripe checkout failed', err);
            // Clean up the pending player
            await this.eventsService.updatePlayer(req.store.id, id, player.id, {});
            throw err;
        }
    }
}
