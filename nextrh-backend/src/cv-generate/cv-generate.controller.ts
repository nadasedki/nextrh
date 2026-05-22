import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CvGenerateService } from './cv-generate.service';

@Controller('cv')
export class CvGenerateController {
  constructor(private readonly generateService: CvGenerateService) {}

  /**
   * Route : POST /cv/smart-generate/:cvId
   * Description : Reçoit un template DOCX, utilise l'IA pour reconstruire le CV 
   * avec les données de la base, et renvoie le nouveau DOCX.
   */
 /* 
  @Post('smart-generate/:cvId')
  @UseInterceptors(FileInterceptor('file')) // La clé dans Postman doit être 'file'
  async smartGenerate(
    @Param('cvId') cvId: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    // 1. Validation simple du fichier
    if (!file) {
      throw new BadRequestException('Veuillez uploader un fichier DOCX servant de template.');
    }

    try {
      console.log(`[Architect] Début de la synthèse pour le CV ID: ${cvId}`);

      // 2. Appel du service de synthèse (Conversion -> Qwen -> DOCX)
      const docxBuffer = await this.generateService.generateSmartDocx(+cvId, file);

      // 3. Configuration des headers HTTP pour le téléchargement
      const filename = `CV_Intelligence_Artificielle_${cvId}.docx`;
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': docxBuffer.length,
      });

      // 4. Envoi du flux binaire au client
      return res.status(HttpStatus.OK).send(docxBuffer);

    } catch (error) {
      console.error('[Architect Error]:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Erreur lors de la génération intelligente du document.",
        details: error.message,
      });
    }
  }

  // Dans votre controller
@Post('debug-template')
@UseInterceptors(FileInterceptor('file'))
async debugTemplate(@UploadedFile() file: Express.Multer.File) {
  if (!file) throw new BadRequestException('Fichier manquant');

  const rawHtml = await this.generateService.debugDocxStructure(file);
  
  // On renvoie le HTML en tant que texte pour le lire dans Postman
  return {
    template_structure: rawHtml
  };
}
// Dans votre controller

@Post('preview')
@UseInterceptors(FileInterceptor('file'))
async previewTemplate(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
  if (!file) throw new BadRequestException('Fichier manquant');

  const fullHtml = await this.generateService.getTemplatePreview(file);

  // CRITIQUE : On dit au navigateur que c'est une page HTML
  res.set('Content-Type', 'text/html');
  return res.send(fullHtml);
}
*/


@Post('smart-pdf/:cvId')
@UseInterceptors(FileInterceptor('file'))
async generatePdf(@Param('cvId') cvId: string, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
  const pdfBuffer = await this.generateService.processSmartPdf(+cvId, file);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=CV_Generated_${cvId}.pdf`,
    'Content-Length': pdfBuffer.length,
  });

  res.end(pdfBuffer);
}
}