import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class UploadsService {
  private supabase;
  private readonly bucketName = 'event-images';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(file: { originalname: string; buffer: Buffer; mimetype: string }) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExt}`;

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(`Upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return {
      url: data.publicUrl,
      filename: fileName,
      mimetype: file.mimetype,
    };
  }
}
