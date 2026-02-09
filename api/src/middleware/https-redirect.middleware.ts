import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Only redirect in production
        if (process.env.NODE_ENV === 'production') {
            // Check if request is NOT secure (not HTTPS)
            const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

            if (!isHttps) {
                // Construct HTTPS URL
                const httpsUrl = `https://${req.headers.host}${req.url}`;
                return res.redirect(301, httpsUrl);
            }
        }
        next();
    }
}
