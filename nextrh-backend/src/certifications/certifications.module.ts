import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationsService } from './certifications.service';
import { CertificationsController } from './certifications.controller';
import { Certification } from './entities/certification.entity';
import { ParserModule } from 'src/parser/parser.module';
import { User } from '../users/entities/user.entity';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';

@Module({
  imports: [TypeOrmModule.forFeature([Certification,User]),ParserModule,GoogleCalendarModule],
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService],
})
export class CertificationsModule {}
