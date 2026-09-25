import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

export type StorageCategory = 'cvs' | 'certifications' | 'templates';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves the absolute directory path based on environment variables
   */
  private getTargetDirectory(category: StorageCategory): string {
    const envKey = category === 'certifications' 
      ? 'UPLOAD_CERT_DESTINATION' 
      : 'UPLOAD_DESTINATION';

    const configuredPath = this.configService.get<string>(envKey) || `./uploads/${category}`;
    
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
  }

  /**
   * Saves a file buffer and returns both physical disk path and DB relative path
   */
  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    prefix: string,
    category: StorageCategory = 'cvs',
  ): Promise<{ fullDiskPath: string; relativePath: string; fileName: string }> {
    const targetDir = this.getTargetDirectory(category);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = path.extname(originalName) || '.pdf';
    const fileName = `${prefix}-${Date.now()}${ext}`;
    const fullDiskPath = path.join(targetDir, fileName);

    await fs.writeFile(fullDiskPath, fileBuffer);
    const relativePath = path.join('uploads', category, fileName).replace(/\\/g, '/');

    this.logger.log(`File persisted: ${fullDiskPath}`);
    return { fullDiskPath, relativePath, fileName };
  }

  /**
   * Safely removes a file from disk
   */
  async deleteFile(relativePathOrFull: string, category: StorageCategory = 'cvs'): Promise<void> {
    if (!relativePathOrFull) return;

    try {
      const fileName = path.basename(relativePathOrFull);
      const targetDir = this.getTargetDirectory(category);
      const fullPath = path.join(targetDir, fileName);

      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${fullPath}`);
    } catch (err: any) {
      this.logger.warn(`Could not delete file (${relativePathOrFull}): ${err.message}`);
    }
  }
}