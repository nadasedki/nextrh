import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationsService } from './certifications.service';
import { CertificationsController } from './certifications.controller';
import { Certification } from './entities/certification.entity';
import { ParserModule } from 'src/parser/parser.module';
@Module({
  imports: [TypeOrmModule.forFeature([Certification]),ParserModule],
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService],
})
export class CertificationsModule {}
