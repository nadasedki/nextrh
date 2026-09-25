import { ConfigService } from '@nestjs/config';
export type StorageCategory = 'cvs' | 'certifications' | 'templates';
export declare class FileStorageService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    private getTargetDirectory;
    saveFile(fileBuffer: Buffer, originalName: string, prefix: string, category?: StorageCategory): Promise<{
        fullDiskPath: string;
        relativePath: string;
        fileName: string;
    }>;
    deleteFile(relativePathOrFull: string, category?: StorageCategory): Promise<void>;
}
