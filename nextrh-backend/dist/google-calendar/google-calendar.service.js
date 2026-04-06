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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
let GoogleCalendarService = class GoogleCalendarService {
    constructor() {
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'https://developers.google.com/oauthplayground');
        this.oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });
    }
    async createTestEvent() {
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
        const now = new Date();
        const inOneHour = new Date(now.getTime() + 3600000);
        const event = {
            summary: '🚀 Test PFE : Alerte Expiration CV',
            description: 'Ceci est un test automatique envoyé depuis le backend NestJS.',
            start: {
                dateTime: now.toISOString(),
                timeZone: 'Africa/Tunis',
            },
            end: {
                dateTime: inOneHour.toISOString(),
                timeZone: 'Africa/Tunis',
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };
        try {
            const res = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });
            console.log('✅ Événement créé :', res.data.htmlLink);
            return {
                success: true,
                link: res.data.htmlLink,
                message: 'L\'événement a été ajouté à votre Google Agenda.'
            };
        }
        catch (error) {
            console.error('❌ Erreur Google Calendar:', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException('Impossible de créer l\'événement Google');
        }
    }
    async createExpirationEvent(candidateName, candidateEmail, certName) {
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
        const startTime = new Date(Date.now() + 120000);
        const endTime = new Date(startTime.getTime() + 3600000);
        const event = {
            summary: `⚠️ Expiration : ${certName}`,
            description: `Bonjour ${candidateName}, ceci est une notification pour le renouvellement de votre certification ${certName}.`,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Africa/Tunis',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Africa/Tunis',
            },
            attendees: [
                { email: candidateEmail }
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 0 },
                    { method: 'popup', minutes: 1 },
                ],
            },
        };
        try {
            const res = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
                sendUpdates: 'all',
            });
            return { success: true, link: res.data.htmlLink };
        }
        catch (error) {
            throw error;
        }
    }
};
exports.GoogleCalendarService = GoogleCalendarService;
exports.GoogleCalendarService = GoogleCalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GoogleCalendarService);
//# sourceMappingURL=google-calendar.service.js.map