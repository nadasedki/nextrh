import { Module } from '@nestjs/common';
import { CvGenerateService } from './cv-generate.service';
import { CvGenerateController } from './cv-generate.controller';
import { CvModule } from '../cvs/cv.module'; 
@Module({
  imports: [
    CvModule, 
  ],
  providers: [CvGenerateService],
  controllers: [CvGenerateController]
})
export class CvGenerateModule {}
