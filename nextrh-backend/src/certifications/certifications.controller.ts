import { Controller,Get, Post, Patch,Delete,Param,Body,Req,UseGuards,UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CertificationsService } from './certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYEE')
@Controller('certifications')
export class CertificationsController {
  constructor(private readonly service: CertificationsService) {}

  @Get('me')
getMyCertifications(@Req() req) {
  // Use a fallback to ensure you get the ID regardless of JWT structure
  const userId = req.user?.sub || req.user?.userId || req.user?.id;
  
  if (!userId) {
    throw new BadRequestException('User ID not found in token');
  }
  
  return this.service.findMyCertifications(userId);
}

@Post()
create(@Req() req, @Body() dto: CreateCertificationDto) {
  
  const userId = req.user?.userId || req.user?.sub || req.user?.id || req.user?.user_id;

  if (!userId) {
    throw new Error('User ID is missing from JWT token!');
  }

  return this.service.create(userId, dto);
}

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Req() req,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.service.update(+id, req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @Req() req) {
    return this.service.remove(+id, req.user.sub);
  }
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCertificate(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const userId = req.user?.userId ; // from JWT auth guard
    if (!file) {
      return { status: 'error', message: 'No file uploaded' };
    }

    const saved = await this.service.extractAndSaveCertificate(
      userId,
      file,
    );

    return {
      status: 'success',
      data: saved,
      message: 'Certificate extracted and saved successfully',
    };
  }
}
