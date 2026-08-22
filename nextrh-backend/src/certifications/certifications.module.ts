import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationsService } from './services/certifications.service';
import { CertificationsController } from './certifications.controller';
import { Certification } from './entities/certification.entity';
import { ParserModule } from 'src/parser/parser.module';
import { User } from '../users/entities/user.entity';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { ScoringModule } from 'src/scoring/scoring.module';
import { CertificationsListener } from './CertificationsListener';
import { CertificationsParserService } from './services/certifications-extraction.service';
@Module({
  imports: [TypeOrmModule.forFeature([Certification,User]),ParserModule,GoogleCalendarModule,ScoringModule],
  controllers: [CertificationsController],
  providers: [CertificationsService,
    CertificationsListener,
    CertificationsParserService],
  exports: [CertificationsService],
})
export class CertificationsModule {}
