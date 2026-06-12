import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(
        private prisma: PrismaService,
        private ticketsService: TicketsService,
    ) {}

    /**
     * Daily cron job that runs at 9:00 AM to send event reminders.
     * Finds all events happening tomorrow and sends tickets via email.
     */
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async sendEventReminders() {
        this.logger.log('Starting automated event reminders check...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
        const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

        try {
            const tomorrowEvents = await this.prisma.event.findMany({
                where: {
                    date: {
                        gte: startOfTomorrow,
                        lte: endOfTomorrow,
                    },
                    status: 'UPCOMING',
                },
                include: {
                    players: {
                        include: {
                            ticket: true,
                        },
                    },
                },
            });

            this.logger.log(`Found ${tomorrowEvents.length} events scheduled for tomorrow.`);

            let reminderCount = 0;

            for (const event of tomorrowEvents) {
                for (const player of event.players) {
                    if (player.ticket && player.playerEmail) {
                        try {
                            const ticketId = `TKT-${player.id.slice(0, 8).toUpperCase()}`;
                            await this.ticketsService.sendReminderEmail({
                                playerName: player.playerName,
                                playerEmail: player.playerEmail,
                                eventName: event.name,
                                eventDate: event.date,
                                eventLocation: event.location,
                                ticketId,
                                qrCode: player.ticket.qrCode,
                            });
                            reminderCount++;
                        } catch (err) {
                            this.logger.error(
                                `Failed to send reminder to player ${player.playerName} (${player.id}) for event ${event.name}`,
                                err.stack
                            );
                        }
                    }
                }
            }

            this.logger.log(`Event reminders job complete. Sent ${reminderCount} reminder email(s).`);
        } catch (error) {
            this.logger.error('Error occurred during automated event reminders job', error.stack);
        }
    }
}
