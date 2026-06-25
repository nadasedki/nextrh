"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CertificationsCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationsCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const certifications_service_1 = require("./services/certifications.service");
let CertificationsCron = CertificationsCron_1 = class CertificationsCron {
    constructor(certificationsService) {
        this.certificationsService = certificationsService;
        this.logger = new common_1.Logger(CertificationsCron_1.name);
    }
    async handleDailyCertificationEvaluation() {
        this.logger.log('Starting daily certifications status evaluation...');
        const result = await this.certificationsService.evaluateAllCertificationsStatus();
        this.logger.log(`Evaluation finished. Updated ${result.updatedCount} certifications.`);
    }
};
exports.CertificationsCron = CertificationsCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CertificationsCron.prototype, "handleDailyCertificationEvaluation", null);
exports.CertificationsCron = CertificationsCron = CertificationsCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [certifications_service_1.CertificationsService])
], CertificationsCron);
//# sourceMappingURL=certifications.cron.js.map