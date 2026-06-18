import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class UploadsService {
  private supabase: any;
  private readonly bucketName = 'event-images';
  private readonly uploadDir = './uploads';
  private readonly useSupabase: boolean;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. Falling back to local storage (ephemeral).');
      this.useSupabase = false;
      const fs = require('fs');
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir);
      }
    } else {
      this.useSupabase = true;
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async uploadFile(file: { originalname: string; buffer: Buffer; mimetype: string }) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExt}`;

    if (!this.useSupabase) {
      const fs = require('fs');
      const filePath = path.join(this.uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      return {
        url: `/uploads/${fileName}`,
        filename: fileName,
        mimetype: file.mimetype,
      };
    }

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
