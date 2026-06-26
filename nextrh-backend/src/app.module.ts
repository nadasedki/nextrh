import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CertificationsModule } from './certifications/certifications.module';
import { TrainingModule } from './training/training.module';
import { ProjectModule } from './project/project.module';
import { EmployeesModule } from './Employee/EmployeesModule';


import { CvModule } from './cvs/cv.module';
import { ParserModule } from './parser/parser.module';
import { CvParsingModule } from './cv-parsing/cv-parsing.module';
import { ExperienceModule } from './experience/experience.module';
import { RagModule } from './rag/rag.module';
import { GoogleCalendarService } from './google-calendar/google-calendar.service';
import { GoogleCalendarController } from './google-calendar/google-calendar.controller';
import { GoogleCalendarModule } from './google-calendar/google-calendar.module';
import { CvGeneratorModule } from './cv-generator/cv-generator.module';

import { CvGenerateModule } from './cv-generate/cv-generate.module';
import { DocumentModule } from './document-manager/document.module';
import { ScoringModule } from './scoring/scoring.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
 imports: [
    ConfigModule.forRoot({ isGlobal: true }),
   TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5434),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME', 'nextrh_db'),
    // This dynamically loads all your entities automatically
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    // In production, synchronize MUST be false to protect your data.
    // It will only be true during local development.
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
  }),
}),
     EventEmitterModule.forRoot(),
    UsersModule,
    AuthModule,
    CertificationsModule,
    TrainingModule,
    ProjectModule,
    EmployeesModule,
    
    CvModule,
    ParserModule,
    CvParsingModule,
    ExperienceModule,
    RagModule,
    GoogleCalendarModule,
    CvGeneratorModule,
    CvGenerateModule,
    DocumentModule,
    ScoringModule,

    
    
  ],
 controllers: [ GoogleCalendarController],
 providers: [ GoogleCalendarService],

})
export class AppModule {}
