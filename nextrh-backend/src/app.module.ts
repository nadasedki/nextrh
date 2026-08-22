import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { APP_GUARD } from '@nestjs/core';

import { CertificationsModule } from './certifications/certifications.module';
import { TrainingModule } from './training/training.module';
import { ProjectModule } from './project/project.module';
import { EmployeesModule } from './Employee/EmployeesModule';


import { CvModule } from './cvs/cv.module';
import { ParserModule } from './parser/parser.module';

import { ExperienceModule } from './experience/experience.module';
import { RagModule } from './rag/rag.module';
import { GoogleCalendarService } from './google-calendar/google-calendar.service';
import { GoogleCalendarController } from './google-calendar/google-calendar.controller';
import { GoogleCalendarModule } from './google-calendar/google-calendar.module';
import { CvGeneratorModule } from './cv-generator/cv-generator.module';


import { ScoringModule } from './scoring/scoring.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CvParserModule } from './cv-parser/cv-parser.module';
import { MailModule } from './mail/mail.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LlmModule } from './llm/llm.module';
@Module({
 imports: [
    ConfigModule.forRoot({ isGlobal: true , 
       envFilePath: '.env',}),
      ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
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

    ExperienceModule,
    RagModule,
    GoogleCalendarModule,
    CvGeneratorModule,
    
    
    ScoringModule,
    CvParserModule,
    MailModule,
    LlmModule,

    
    
  ],
 controllers: [ GoogleCalendarController],
 providers: [ GoogleCalendarService ,{
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },],

})
export class AppModule {}
