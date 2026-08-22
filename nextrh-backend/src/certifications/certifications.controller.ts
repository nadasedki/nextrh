import { Controller,Get, Post, Patch,Delete,Param,Body,Req,Request,UseGuards,UseInterceptors, UploadedFile, BadRequestException, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CertificationsService } from './services/certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CertificationsParserService } from './services/certifications-extraction.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYEE')
@Controller('certifications')
export class CertificationsController {
  constructor(
    private readonly service: CertificationsService,
    private readonly parserService: CertificationsParserService,
  ) {}

  @Get('me')
  getMyCertifications(@Req() req) {
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }
    
    return this.service.findMyCertifications(userId);
  }

  @Post()
  create(@Req() req, @Body() dto: CreateCertificationDto) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new Error('User ID is missing from JWT token!');
    }

    return this.service.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateCertificationDto,
  ) {
    const userId = req.user?.userId;
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    const userId = req.user?.userId;
    return this.service.remove(id, userId);
  }
@UseGuards(JwtAuthGuard)
@Post('parse-preview')
@UseInterceptors(FileInterceptor('file'))
async parseCertificatePreview(
  @UploadedFile() file: Express.Multer.File,
  @Req() req,
) {
  const userId = req.user?.userId; 
  const userFullName = req.user.full_name; 
  console.log(`User ID: ${userId}, Full Name from JWT: ${userFullName}`); // ◄ Log pour debug
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  const previewData = await this.parserService.extractAndPreviewCertificate(
    userId,
    file,
    userFullName // ◄ Transmis ici
  );

  return {
    status: 'success',
    data: previewData,
  };
}
  /*@UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCertificate(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const userId = req.user?.userId; 
    if (!file) {
      return { status: 'error', message: 'No file uploaded' };
    }

    const saved = await this.parserService.extractAndSaveCertificate(
      userId,
      file,
    );

    return {
      status: 'success',
      data: saved,
      message: 'Certificate extracted and saved successfully',
    };
  }*/
}