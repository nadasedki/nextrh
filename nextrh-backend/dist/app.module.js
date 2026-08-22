"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const certifications_module_1 = require("./certifications/certifications.module");
const training_module_1 = require("./training/training.module");
const project_module_1 = require("./project/project.module");
const EmployeesModule_1 = require("./Employee/EmployeesModule");
const cv_module_1 = require("./cvs/cv.module");
const parser_module_1 = require("./parser/parser.module");
const experience_module_1 = require("./experience/experience.module");
const rag_module_1 = require("./rag/rag.module");
const google_calendar_service_1 = require("./google-calendar/google-calendar.service");
const google_calendar_controller_1 = require("./google-calendar/google-calendar.controller");
const google_calendar_module_1 = require("./google-calendar/google-calendar.module");
const cv_generator_module_1 = require("./cv-generator/cv-generator.module");
const scoring_module_1 = require("./scoring/scoring.module");
const event_emitter_1 = require("@nestjs/event-emitter");
const cv_parser_module_1 = require("./cv-parser/cv-parser.module");
const mail_module_1 = require("./mail/mail.module");
const throttler_1 = require("@nestjs/throttler");
const llm_module_1 = require("./llm/llm.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true,
                envFilePath: '.env', }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 10,
                }]),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5434),
                    username: configService.get('DB_USERNAME', 'postgres'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_NAME', 'nextrh_db'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: configService.get('NODE_ENV') !== 'production',
                }),
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            certifications_module_1.CertificationsModule,
            training_module_1.TrainingModule,
            project_module_1.ProjectModule,
            EmployeesModule_1.EmployeesModule,
            cv_module_1.CvModule,
            parser_module_1.ParserModule,
            experience_module_1.ExperienceModule,
            rag_module_1.RagModule,
            google_calendar_module_1.GoogleCalendarModule,
            cv_generator_module_1.CvGeneratorModule,
            scoring_module_1.ScoringModule,
            cv_parser_module_1.CvParserModule,
            mail_module_1.MailModule,
            llm_module_1.LlmModule,
        ],
        controllers: [google_calendar_controller_1.GoogleCalendarController],
        providers: [google_calendar_service_1.GoogleCalendarService, {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map