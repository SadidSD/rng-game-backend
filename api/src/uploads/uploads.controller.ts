import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
