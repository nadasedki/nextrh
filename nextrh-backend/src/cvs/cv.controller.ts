// src/cvs/cv.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Param, 
  Req, 
  UseGuards, 
  UploadedFile, 
  UseInterceptors, 
  BadRequestException, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CvService } from './cv.service';

@Controller('cvs')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  /**
   * POST /cvs/upload
   * Receives PDF file and delegates saving + queueing to CvService
   */
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED) // Returns 202 Accepted
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(@Req() req, @UploadedFile() file: Express.Multer.File) {
    // 1. Guard Clause: Verify file was uploaded
    if (!file) {
      throw new BadRequestException('Aucun fichier n\'a été fourni. Veuillez téléverser un CV au format PDF.');
    }

    // 2. Guard Clause: Verify PDF mimetype
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Type de fichier non supporté. Seuls les fichiers PDF sont acceptés.');
    }

    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('Utilisateur non authentifié.');
    }

    // 3. Delegate to service (Saves file to disk + pushes job to BullMQ Redis queue)
    return await this.cvService.enqueueCvUpload(userId, file);
  }

  /**
   * GET /cvs/status/:jobId
   * Allows the frontend polling loop to check job progress (waiting, active, completed, failed)
   */
  @UseGuards(JwtAuthGuard)
  @Get('status/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    if (!jobId) {
      throw new BadRequestException('Identifiant de tâche (jobId) manquant.');
    }

    return await this.cvService.getJobStatus(jobId);
  }

  /**
   * DELETE /cvs/:cvId
   * Cascade deletes CV records from PostgreSQL and unlinks physical file from disk
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':cvId')
  async removeCv(
    @Param('cvId') cvId: string,
    @Req() req,
  ): Promise<{ message: string }> {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const cvIdNumber = Number(cvId);

    if (!Number.isInteger(cvIdNumber) || cvIdNumber <= 0) {
      throw new BadRequestException('Identifiant du CV invalide.');
    }

    await this.cvService.remove(cvIdNumber, userId);

    return {
      message: 'CV supprimé avec succès.',
    };
  }
}