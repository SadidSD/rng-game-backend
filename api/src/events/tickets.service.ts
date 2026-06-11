import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import * as QRCode from 'qrcode';

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) { }

    /**
     * Generate a QR code ticket for a registered player and store it in the DB.
     * Called after payment is confirmed (or immediately for free events).
     */
    async generateTicket(playerId: string) {
        // Avoid duplicate tickets
        const existing = await this.prisma.eventTicket.findUnique({ where: { playerId } });
        if (existing) {
            this.logger.warn(`Ticket already exists for player ${playerId}`);
            return existing;
        }

        const player = await this.prisma.eventPlayer.findUnique({
            where: { id: playerId },
            include: { event: true },
        });

        if (!player) throw new Error(`Player ${playerId} not found`);

        const ticketId = `TKT-${player.id.slice(0, 8).toUpperCase()}`;

        const ticketPayload = JSON.stringify({
            ticketId,
            eventId: player.eventId,
            playerId: player.id,
            eventName: player.event.name,
            playerName: player.playerName,
            eventDate: player.event.date.toISOString(),
        });

        // Generate QR code as base64 data URL
        const qrDataUrl = await QRCode.toDataURL(ticketPayload, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 256,
        });

        const ticket = await this.prisma.eventTicket.create({
            data: {
                eventId: player.eventId,
                playerId: player.id,
                qrCode: qrDataUrl,
            },
        });

        this.logger.log(`Ticket ${ticketId} generated for ${player.playerName} (event: ${player.event.name})`);

        // Send email via the existing NotificationService
        if (player.playerEmail) {
            await this.sendTicketEmail({
                playerName: player.playerName,
                playerEmail: player.playerEmail,
                eventName: player.event.name,
                eventDate: player.event.date,
                eventLocation: player.event.location,
                qrCode: qrDataUrl,
                ticketId,
            });
        }

        return ticket;
    }

    /**
     * Send the ticket QR code via email using the shared NotificationService.
     */
    async sendTicketEmail(params: {
        playerName: string;
        playerEmail: string;
        eventName: string;
        eventDate: Date;
        eventLocation?: string | null;
        qrCode: string;
        ticketId: string;
    }) {
        const { playerName, playerEmail, eventName, eventDate, eventLocation, qrCode, ticketId } = params;

        const formattedDate = new Date(eventDate).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#111;color:#fff;padding:32px 24px;text-align:center;">
      <h1 style="margin:0 0 4px;font-size:22px;letter-spacing:0.1em;">🎴 RNG Gamez</h1>
      <p style="margin:0;color:#aaa;font-size:13px;">Your Event Ticket</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 24px;text-align:center;">
      <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hey <strong>${playerName}</strong>! 🎉<br/>
        You're all set for the event below. Show this QR code at the door for check-in.
      </p>

      <!-- Event Details -->
      <div style="background:#f9f9f9;border-radius:10px;padding:16px 20px;text-align:left;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.08em;padding:4px 0 2px;">Event</td>
          </tr>
          <tr>
            <td style="font-size:16px;color:#111;font-weight:600;padding-bottom:12px;">${eventName}</td>
          </tr>
          <tr>
            <td style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.08em;padding:4px 0 2px;">Date &amp; Time</td>
          </tr>
          <tr>
            <td style="font-size:15px;color:#111;font-weight:600;padding-bottom:12px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.08em;padding:4px 0 2px;">Location</td>
          </tr>
          <tr>
            <td style="font-size:15px;color:#111;font-weight:600;padding-bottom:4px;">${eventLocation || '2325 Plainfield Ave, South Plainfield, NJ'}</td>
          </tr>
        </table>
      </div>

      <!-- Ticket ID -->
      <p style="font-size:12px;color:#999;margin:0 0 12px;">Ticket ID: <strong style="color:#555;font-family:monospace;">${ticketId}</strong></p>

      <!-- QR Code -->
      <div style="display:inline-block;padding:12px;background:#fff;border:2px solid #eee;border-radius:12px;margin-bottom:16px;">
        <img src="${qrCode}" alt="Event Ticket QR Code" style="display:block;width:200px;height:200px;" />
      </div>

      <p style="font-size:13px;color:#888;margin:0;">Screenshot or print this QR code and present it at check-in.</p>
    </div>

    <!-- Footer -->
    <div style="background:#f4f4f4;padding:16px 24px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">
        RNG Gamez · 2325 Plainfield Ave, South Plainfield, NJ<br/>
        Questions? Visit us in-store or check <a href="https://rng-gamez.com" style="color:#6d28d9;">rng-gamez.com</a>
      </p>
    </div>

  </div>
</body>
</html>`;

        // Delegate to the existing NotificationService which handles Resend / Gmail / fallback
        await (this.notificationService as any).sendEmail(
            playerEmail,
            `🎴 Your Ticket for ${eventName}`,
            html,
        );

        this.logger.log(`Ticket email sent to ${playerEmail} for event "${eventName}"`);
    }

    /**
     * Send waitlist promotion email via NotificationService.
     */
    async sendWaitlistPromotionEmail(params: {
        playerName: string;
        playerEmail: string;
        eventName: string;
        eventDate: Date;
    }) {
        const { playerName, playerEmail, eventName, eventDate } = params;
        const formattedDate = new Date(eventDate).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px;">
  <h2 style="color:#111;">🎉 Great news, ${playerName}!</h2>
  <p style="color:#555;">A spot just opened up for <strong>${eventName}</strong> on <strong>${formattedDate}</strong>.</p>
  <p style="color:#555;">You've been automatically moved off the waitlist and registered. If there's an entry fee, please pay at the door or contact the store.</p>
  <p style="color:#555;">See you there!<br/><em>— RNG Gamez</em></p>
</div>`;

        await (this.notificationService as any).sendEmail(
            playerEmail,
            `✅ Spot opened — you're in for ${eventName}!`,
            html,
        );
    }
}
