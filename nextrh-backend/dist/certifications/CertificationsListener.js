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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const google_calendar_service_1 = require("../google-calendar/google-calendar.service");
const scoring_service_1 = require("../scoring/scoring.service");
let CertificationsListener = class CertificationsListener {
    constructor(userRepo, googleCalendarService, scoringService) {
        this.userRepo = userRepo;
        this.googleCalendarService = googleCalendarService;
        this.scoringService = scoringService;
    }
    async handleCertificationSaved(payload) {
        const { employeeId, certName, expiryDate } = payload;
        console.log(` [Event-Listener] Traitement en tâche de fond pour la nouvelle certification : "${certName}"`);
        try {
            await this.scoringService.calculateAndSaveScore(employeeId);
            console.log(` [Event-Listener] Score recalculé avec succès pour l'employé ID: ${employeeId}`);
        }
        catch (scoreError) {
            console.error(` [Event-Listener] Échec du recalcul du score :`, scoreError.message);
        }
        if (!expiryDate) {
            console.log(` [Event-Listener] Pas de date d'expiration pour "${certName}". Synchro Calendar ignorée.`);
            return;
        }
        try {
            const user = await this.userRepo.findOne({ where: { user_id: employeeId } });
            if (user && user.email) {
                const expiryDateStr = expiryDate instanceof Date ? expiryDate.toISOString() : new Date(expiryDate).toISOString();
                await this.googleCalendarService.scheduleEmployeeReminder(user.full_name, user.email, certName, expiryDateStr);
                console.log(` [Event-Listener] Rappel d'expiration planifié à J-60 dans l'agenda pour ${user.email}`);
            }
            else {
                console.warn(` [Event-Listener] Impossible de planifier l'agenda : Employé introuvable ou email manquant.`);
            }
        }
        catch (calendarError) {
            console.error(` [Event-Listener] Erreur Google Calendar :`, calendarError.message);
        }
    }
    async handleCertificationUpdated(payload) {
        const { employeeId, certId } = payload;
        console.log(` [Event-Listener] Certification ID: ${certId} mise à jour. Recalcul du score...`);
        try {
            await this.scoringService.calculateAndSaveScore(employeeId);
            console.log(` [Event-Listener] Score mis à jour suite à la modification.`);
        }
        catch (error) {
            console.error(` [Event-Listener] Erreur lors de la mise à jour du score (Update) :`, error.message);
        }
    }
    async handleCertificationDeleted(payload) {
        const { employeeId, certId } = payload;
        console.log(`[Event-Listener] Certification ID: ${certId} supprimée. Recalcul du score...`);
        try {
            await this.scoringService.calculateAndSaveScore(employeeId);
            console.log(` [Event-Listener] Score mis à jour suite à la suppression.`);
        }
        catch (error) {
            console.error(` [Event-Listener] Erreur lors de la mise à jour du score (Delete) :`, error.message);
        }
    }
};
exports.CertificationsListener = CertificationsListener;
__decorate([
    (0, event_emitter_1.OnEvent)('certification.saved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificationsListener.prototype, "handleCertificationSaved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('certification.updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificationsListener.prototype, "handleCertificationUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('certification.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificationsListener.prototype, "handleCertificationDeleted", null);
exports.CertificationsListener = CertificationsListener = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        google_calendar_service_1.GoogleCalendarService,
        scoring_service_1.ScoringService])
], CertificationsListener);
//# sourceMappingURL=CertificationsListener.js.map