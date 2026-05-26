import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as xss from 'xss';

@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        if (req.body) {
            req.body = this.sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = this.sanitizeObject(req.query);
        }
        if (req.params) {
            req.params = this.sanitizeObject(req.params);
        }
        next();
    }

    private sanitizeObject(obj: any): any {
        if (typeof obj === 'string') {
            return this.sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        if (obj !== null && typeof obj === 'object') {
            const sanitized: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = this.sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    }

    private sanitizeString(str: string): string {
        return xss.filterXSS(str);
    }
}
