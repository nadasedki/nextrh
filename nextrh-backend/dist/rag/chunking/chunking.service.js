"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkingService = void 0;
const common_1 = require("@nestjs/common");
let ChunkingService = class ChunkingService {
    formatDate(date) {
        if (!date)
            return 'N/A';
        const d = new Date(date);
        return isNaN(d.getTime()) ? String(date) : d.getFullYear().toString();
    }
    chunkStaticProfile(profile) {
        const { full_name, profession, email, address, skills, educations, experiences } = profile;
        const lines = [];
        lines.push(`${full_name} est un professionnel spécialisé en tant que ${profession || 'spécialiste IT'}.`);
        if (email)
            lines.push(`Contact email: ${email}.`);
        if (address)
            lines.push(`Adresse professionnelle: ${address}.`);
        if (skills?.trim()) {
            lines.push(`Ses compétences techniques principales incluent: ${skills.trim()}.`);
        }
        lines.push(`Parcours académique et d'études de ${full_name}:`);
        if (educations && educations.length > 0) {
            educations.forEach((edu) => {
                const period = edu.start_year && edu.end_year ? `${edu.start_year}–${edu.end_year}` : 'période non spécifiée';
                lines.push(`  - Titulaire d'un ${edu.degree || 'diplôme'} en ${edu.field_of_study || 'N/A'} délivré par ${edu.institution || 'N/A'} (${period}).`);
            });
        }
        else {
            lines.push(`  Aucun parcours académique enregistré.`);
        }
        lines.push(`Historique de carrière et expériences de ${full_name}:`);
        if (experiences && experiences.length > 0) {
            experiences.forEach((exp) => {
                const start = this.formatDate(exp.start_date);
                const end = this.formatDate(exp.end_date) || 'présent';
                const desc = exp.description && exp.description !== exp.role ? ` Missions principales accomplies: ${exp.description}.` : '';
                lines.push(`  - Poste de ${exp.role || 'collaborateur'} chez ${exp.company || 'N/A'} de ${start} à ${end}.${desc}`);
            });
        }
        else {
            lines.push(`  Aucune expérience professionnelle enregistrée.`);
        }
        return [{ text: lines.join('\n').trim(), chunkIndex: 0 }];
    }
    chunkAllProjects(profile) {
        const { full_name, profession, projects } = profile;
        const lines = [];
        lines.push(`Historique complet des projets et réalisations techniques de ${full_name} (${profession || 'spécialiste IT'}):`);
        if (projects && projects.length > 0) {
            projects.forEach((proj, index) => {
                const start = this.formatDate(proj.start_date);
                const end = this.formatDate(proj.end_date);
                const period = start === end ? start : `${start}–${end}`;
                lines.push(`  [Projet ${index + 1}] Client: ${proj.client || 'N/A'} (${period}).` +
                    ` Réalisation: ${proj.description || 'N/A'}.`);
            });
        }
        else {
            lines.push(`  ${full_name} n'a aucun projet client enregistré.`);
        }
        return [{ text: lines.join('\n').trim(), chunkIndex: 1 }];
    }
    chunkAllCredentials(profile) {
        const { full_name, profession, certifications, trainings } = profile;
        const lines = [];
        lines.push(`Accréditations, certifications officielles et formations de ${full_name} (${profession || 'spécialiste IT'}):`);
        lines.push(`Certifications professionnelles obtenues:`);
        if (certifications && certifications.length > 0) {
            certifications.forEach((cert) => {
                const date = this.formatDate(cert.issue_date);
                const provider = cert.provider && cert.provider !== 'Professional Issuer' ? ` délivrée par ${cert.provider}` : '';
                lines.push(`  - Certification ${cert.cert_name || 'N/A'}${provider}, obtenue en ${date}.`);
            });
        }
        else {
            lines.push(`  Aucune certification professionnelle enregistrée.`);
        }
        lines.push(`Formations complémentaires et séminaires suivis:`);
        if (trainings && trainings.length > 0) {
            trainings.forEach((train) => {
                const org = train.provider ? ` dispensé par ${train.provider}` : '';
                const duration = train.duration ? ` (durée de ${train.duration})` : '';
                lines.push(`  - Séminaire sur ${train.training_name || 'formation'}${org}${duration}.`);
            });
        }
        else {
            lines.push(`  Aucune formation complémentaire enregistrée.`);
        }
        return [{ text: lines.join('\n').trim(), chunkIndex: 2 }];
    }
    chunkCandidate(profile) {
        return [
            ...this.chunkStaticProfile(profile),
            ...this.chunkAllProjects(profile),
            ...this.chunkAllCredentials(profile),
        ];
    }
};
exports.ChunkingService = ChunkingService;
exports.ChunkingService = ChunkingService = __decorate([
    (0, common_1.Injectable)()
], ChunkingService);
//# sourceMappingURL=chunking.service.js.map