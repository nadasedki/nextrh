import { Module } from '@nestjs/common';
import { CvGeneratorService } from './cv-generator.service';
import { CvGeneratorController } from './cv-generator.controller';
import { CvModule } from 'src/cvs/cv.module';

@Module({
  imports: [CvModule], 
  providers: [CvGeneratorService],
  controllers: [CvGeneratorController]
})
export class CvGeneratorModule {}
