"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const certifications_service_1 = require("./services/certifications.service");
const certifications_controller_1 = require("./certifications.controller");
const certification_entity_1 = require("./entities/certification.entity");
const parser_module_1 = require("../parser/parser.module");
const user_entity_1 = require("../users/entities/user.entity");
const google_calendar_module_1 = require("../google-calendar/google-calendar.module");
const scoring_module_1 = require("../scoring/scoring.module");
const CertificationsListener_1 = require("./CertificationsListener");
const certifications_parser_service_1 = require("./services/certifications-parser.service");
let CertificationsModule = class CertificationsModule {
};
exports.CertificationsModule = CertificationsModule;
exports.CertificationsModule = CertificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([certification_entity_1.Certification, user_entity_1.User]), parser_module_1.ParserModule, google_calendar_module_1.GoogleCalendarModule, scoring_module_1.ScoringModule],
        controllers: [certifications_controller_1.CertificationsController],
        providers: [certifications_service_1.CertificationsService,
            CertificationsListener_1.CertificationsListener,
            certifications_parser_service_1.CertificationsParserService],
        exports: [certifications_service_1.CertificationsService],
    })
], CertificationsModule);
//# sourceMappingURL=certifications.module.js.map