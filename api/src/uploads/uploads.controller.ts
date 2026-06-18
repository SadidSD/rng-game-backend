import { Controller, Post, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async uploadFile(@Req() req: FastifyRequest) {
        // Fastify file upload handling via @fastify/multipart
        const fileData = await (req as any).file();
        if (!fileData) {
            throw new BadRequestException('No file uploaded');
        }

        const buffer = await fileData.toBuffer();

        return this.uploadsService.uploadFile({
            originalname: fileData.filename,
            buffer: buffer,
            mimetype: fileData.mimetype
        });
    }
}
