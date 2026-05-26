import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { NotificationService } from '../notifications/notification.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(
        private healthService: HealthService,
        private notificationService: NotificationService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    async check() {
        return this.healthService.checkHealth();
    }

    @Get('test-email')
    @ApiOperation({ summary: 'Test email notifications (Resend / Gmail SMTP)' })
    async testEmail(@Query('email') email?: string) {
        const targetEmail = email || 'sadidbinhasan3@gmail.com';
        try {
            await this.notificationService.sendShippingNotification(
                targetEmail,
                '1Z999AA10123456784',
                'https://www.ups.com'
            );
            
            const notificationServiceAny = this.notificationService as any;
            const providerUsed = notificationServiceAny.resend 
                ? 'Resend' 
                : (notificationServiceAny.gmailTransporter ? 'Gmail SMTP' : 'None (Logged Only)');

            return {
                success: true,
                message: `Test shipping tracking email sent successfully to ${targetEmail}. Please check your inbox and spam folder.`,
                provider: providerUsed
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to send email: ${error.message}`,
                error: error
            };
        }
    }
}
