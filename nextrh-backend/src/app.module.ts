import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CertificationsModule } from './certifications/certifications.module';
import { TrainingModule } from './training/training.module';
import { ProjectModule } from './project/project.module';
import { EmployeesModule } from './Employee/EmployeesModule';
import { SkillsModule } from './skill/skills.module';

import { CvModule } from './cvs/cv.module';
import { ParserController } from './parser/parser.controller';
import { ParserService } from './parser/parser.service';
import { ParserModule } from './parser/parser.module';
import { CvParsingModule } from './cv-parsing/cv-parsing.module';
import { ExperienceModule } from './experience/experience.module';
import { RagModule } from './rag/rag.module';
import { GoogleCalendarService } from './google-calendar/google-calendar.service';
import { GoogleCalendarController } from './google-calendar/google-calendar.controller';
@Module({
 imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5434,
      username: 'postgres',
      password: 'nadasedki',
      database: 'nextrh_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // dev only!
    }),
    UsersModule,
    AuthModule,
    CertificationsModule,
    TrainingModule,
    ProjectModule,
    EmployeesModule,
    SkillsModule,
    CvModule,
    ParserModule,
    CvParsingModule,
    ExperienceModule,
    RagModule
    
  ],
 controllers: [ParserController, GoogleCalendarController],
 providers: [ParserService, GoogleCalendarService],

})
export class AppModule {}
