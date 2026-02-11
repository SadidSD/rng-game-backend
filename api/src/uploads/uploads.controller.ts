import { Controller, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
// Fastify file uploads handled via @fastify/multipart (configured in main.ts)
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Post()
    // @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file: any) {
        return this.uploadsService.uploadFile(file);
    }
}
