import { Controller, Post, Body, UseGuards, Req, UploadedFile, UseInterceptors, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { CvService } from './cv.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvImportService } from './cv-import/cv-import.service';

@Controller('cvs')
export class CvController {
  private readonly logger = new Logger(CvController.name);
  constructor(private readonly cvService: CvService,
    private readonly cvImportService: CvImportService
  ) {}
/*
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) throw new BadRequestException('No file uploaded');

    const userId = req.user.userId;
    const cvJson = body.cvJson; // assume client sends parsed JSON
    const savedCv = await this.cvService.saveIdentityCv(userId, file.path, cvJson);

    return { status: 'success', data: savedCv };
  }*/
 @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(@Req() req, @UploadedFile() file: Express.Multer.File) {
    // 2. Guard Clause: Verify that a file was actually uploaded
    if (!file) {
      throw new BadRequestException('Aucun fichier n\'a été fourni. Veuillez téléverser un CV au format PDF.');
    }

    // 3. Guard Clause: Strict check for PDF mimetype
    if (file.mimetype !== 'application/pdf') {
      this.logger.warn(`Unsupported upload attempt with mimetype: ${file.mimetype}`);
      throw new BadRequestException('Type de fichier non supporté. Seurs les fichiers PDF sont acceptés.');
    }

    try {
      // 4. Retrieve real dynamic parameters from the JWT Auth Payload
      const userId = req.user.userId; 
      this.logger.log(`Initiating parsing pipeline for user ${userId} with file: ${file.originalname}`);

      // 5. Delegate processing to the internal pipeline orchestrator
      // We pass the memory buffer directly instead of file.path to avoid cross-platform filesystem lock errors
      const result = await this.cvImportService.uploadAndSaveCv(file.buffer, userId, file.originalname);

      return result;
    } catch (error) {
      this.logger.error(`Critical failure in upload execution trace: ${error.message}`);
      throw new InternalServerErrorException(
        `Une erreur est survenue lors du traitement automatisé de votre CV : ${error.message}`
      );
    }
  }

}