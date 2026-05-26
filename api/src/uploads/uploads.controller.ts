import { Controller, Post, UseGuards } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async uploadFile() {
        // Fastify file upload handling via @fastify/multipart
        // File will be available in request.file()
        return { message: 'File upload endpoint - Fastify multipart configured' };
    }
}
