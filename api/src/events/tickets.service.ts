import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';
import * as nodemailer from 'nodemailer';

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);
    private transporter: nodemailer.Transporter | null = null;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPass = this.configService.get<string>('SMTP_PASS');

        if (smtpHost && smtpUser && smtpPass) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: Number(this.configService.get<string>('SMTP_PORT') || '587'),
                secure: this.configService.get<string>('SMTP_SECURE') === 'true',
                auth: { user: smtpUser, pass: smtpPass },
            });
            this.logger.log('[TicketsService] Email transporter initialized');
        } else {
            this.logger.warn('[TicketsService] SMTP not configured — emails will be logged only');
        }
    }

    /**
     * Generate a QR code ticket for a registered player and store it in the DB.
     * This is called after payment is confirmed (or immediately for free events).
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

        const ticketPayload = JSON.stringify({
            ticketId: `TKT-${player.id.slice(0, 8).toUpperCase()}`,
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

        this.logger.log(`Ticket generated for player ${player.playerName} (event: ${player.event.name})`);

        // Send email if player has one
        if (player.playerEmail) {
            const emailPlayer = {
                playerName: player.playerName,
                playerEmail: player.playerEmail, // guaranteed non-null here
                event: player.event,
            };
            await this.sendTicketEmail(emailPlayer, ticket.qrCode);
        }

        return ticket;
    }

    /**
     * Send the ticket QR code via email.
     */
    async sendTicketEmail(
        player: { playerName: string; playerEmail: string; event: { name: string; date: Date; location?: string | null } },
        qrCode: string,
    ) {
        const eventDate = new Date(player.event.date).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #111; color: #fff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0 0 4px; font-size: 22px; letter-spacing: 0.1em; }
    .header p { margin: 0; color: #aaa; font-size: 13px; }
    .body { padding: 28px 24px; text-align: center; }
    .body p { color: #444; font-size: 15px; line-height: 1.6; }
    .event-info { background: #f9f9f9; border-radius: 10px; padding: 16px; text-align: left; margin: 20px 0; }
    .event-info dt { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
    .event-info dd { font-size: 15px; color: #111; margin: 0 0 12px; font-weight: 600; }
    .qr-wrapper { margin: 24px auto; display: inline-block; padding: 12px; background: #fff; border: 2px solid #eee; border-radius: 12px; }
    .qr-wrapper img { display: block; width: 200px; height: 200px; }
    .footer { background: #f4f4f4; padding: 16px 24px; text-align: center; }
    .footer p { color: #888; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎴 RNG Gamez</h1>
      <p>Your Event Ticket</p>
    </div>
    <div class="body">
      <p>Hey <strong>${player.playerName}</strong>! 🎉<br>
      You're registered for the event below. Show this QR code at the door.</p>

      <div class="event-info">
        <dl>
          <dt>Event</dt>
          <dd>${player.event.name}</dd>
          <dt>Date &amp; Time</dt>
          <dd>${eventDate}</dd>
          <dt>Location</dt>
          <dd>${player.event.location || 'In-Store — 2325 Plainfield Ave, South Plainfield, NJ'}</dd>
        </dl>
      </div>

      <div class="qr-wrapper">
        <img src="${qrCode}" alt="Your Event Ticket QR Code" />
      </div>

      <p style="font-size: 13px; color: #888;">Screenshot or print this QR code and present it at check-in.</p>
    </div>
    <div class="footer">
      <p>RNG Gamez · 2325 Plainfield Ave, South Plainfield, NJ<br>Questions? Visit us in-store or check rng-gamez.com</p>
    </div>
  </div>
</body>
</html>`;

        if (!this.transporter) {
            this.logger.log(
                `[EMAIL MOCK] Would send ticket to ${player.playerEmail} for ${player.event.name}`,
            );
            return;
        }

        const fromAddress = this.configService.get<string>('SMTP_FROM') || '"RNG Gamez" <noreply@rng-gamez.com>';

        try {
            await this.transporter.sendMail({
                from: fromAddress,
                to: player.playerEmail,
                subject: `🎴 Your Ticket for ${player.event.name}`,
                html: htmlBody,
            });
            this.logger.log(`Ticket email sent to ${player.playerEmail}`);
        } catch (err) {
            this.logger.error(`Failed to send ticket email to ${player.playerEmail}`, err);
        }
    }

    /**
     * Send a waitlist promotion email.
     */
    async sendWaitlistPromotionEmail(
        playerName: string,
        playerEmail: string,
        eventName: string,
        eventDate: Date,
    ) {
        const formattedDate = new Date(eventDate).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const html = `
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
  <h2>🎉 Great news, ${playerName}!</h2>
  <p>A spot just opened up for <strong>${eventName}</strong> on <strong>${formattedDate}</strong>.</p>
  <p>You've been automatically moved off the waitlist and registered. 
     If there's an entry fee, please pay at the door or contact the store.</p>
  <p>See you there!<br><em>— RNG Gamez</em></p>
</div>`;

        if (!this.transporter) {
            this.logger.log(`[EMAIL MOCK] Waitlist promotion email to ${playerEmail}`);
            return;
        }

        const fromAddress = this.configService.get<string>('SMTP_FROM') || '"RNG Gamez" <noreply@rng-gamez.com>';

        try {
            await this.transporter.sendMail({
                from: fromAddress,
                to: playerEmail,
                subject: `✅ Spot opened! You're registered for ${eventName}`,
                html,
            });
        } catch (err) {
            this.logger.error(`Failed to send waitlist promotion email to ${playerEmail}`, err);
        }
    }
}
