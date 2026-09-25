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
import { CertParsingProcessor } from './processors/cert-parsing.processor';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
@Module({
  imports: [TypeOrmModule.forFeature([Certification,User]), BullModule.registerQueue({
      name: 'cert-parsing',
    }), BullBoardModule.forFeature({
      name: 'cert-parsing',
      adapter: BullMQAdapter,
    }),
    ParserModule,GoogleCalendarModule,ScoringModule],
  controllers: [CertificationsController],
  providers: [CertificationsService,
    CertificationsListener,
    CertificationsParserService,
    CertParsingProcessor
  ],
  exports: [CertificationsService],
})
export class CertificationsModule {}
