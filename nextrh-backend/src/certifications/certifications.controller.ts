import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  Req, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException, 
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CertificationsService } from './services/certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYEE', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
@Controller('certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Get('me')
  async getMyCertifications(@Req() req) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) throw new BadRequestException('User ID not found in token');
    return this.certificationsService.findMyCertifications(userId);
  }

  @Post()
  async create(@Req() req, @Body() dto: CreateCertificationDto) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) throw new BadRequestException('User ID not found in token');
    return this.certificationsService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body() dto: UpdateCertificationDto,
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.certificationsService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.certificationsService.remove(id, userId);
  }

  /**
   * POST /certifications/parse-preview
   * Asynchronously enqueues certificate OCR extraction in BullMQ
   */
  @Post('parse-preview')
  @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted
  @UseInterceptors(FileInterceptor('file'))
  async parseCertificatePreview(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const userId = req.user?.userId || req.user?.id;
    const userFullName = req.user?.full_name || req.user?.fullName || req.user?.name;

    return await this.certificationsService.enqueueCertParsing(userId, file, userFullName);
  }

  /**
   * GET /certifications/status/:jobId
   * Polling endpoint to retrieve the parsed certificate data
   */
  @Get('status/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    if (!jobId) throw new BadRequestException('jobId is required');
    return await this.certificationsService.getJobStatus(jobId);
  }
}