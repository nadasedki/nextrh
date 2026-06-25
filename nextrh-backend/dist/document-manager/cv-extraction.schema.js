"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvExtractionSchema = exports.ProjectsFallbackSchema = exports.EducationFallbackSchema = exports.CertificationsFallbackSchema = exports.ExperiencesFallbackSchema = void 0;
const zod_1 = require("zod");
exports.ExperiencesFallbackSchema = zod_1.z.object({
    experiences: zod_1.z.array(zod_1.z.object({
        company: zod_1.z.string().describe("Le nom de l'entreprise"),
        role: zod_1.z.string().describe("Le poste occupé"),
        period: zod_1.z.string().nullable().describe("La période exacte de l'expérience (ex: Février 2018 ou 2006 - 2016)"),
        description: zod_1.z.string().describe("Résumé des tâches accomplies")
    })).describe("Le tableau des expériences professionnelles extraites")
});
exports.CertificationsFallbackSchema = zod_1.z.object({
    certifications: zod_1.z.array(zod_1.z.object({
        cert_name: zod_1.z.string().describe("Le nom officiel de la certification (ex: CCNP Security)"),
        provider: zod_1.z.string().describe("L'éditeur ou organisme (ex: Cisco, Fortinet, Dell, Microsoft)"),
        date: zod_1.z.string().nullable().describe("Le mois et l'année d'obtention (ex: Février 2020) ou null")
    })).describe("Le tableau des certifications obtenues")
});
exports.EducationFallbackSchema = zod_1.z.object({
    education: zod_1.z.array(zod_1.z.object({
        year: zod_1.z.string().nullable().describe("L'année ou la période d'études"),
        institution: zod_1.z.string().describe("Le nom de l'école ou de l'université"),
        degree: zod_1.z.string().describe("Le diplôme obtenu et son option")
    })).describe("Le parcours de formation et diplômes")
});
exports.ProjectsFallbackSchema = zod_1.z.object({
    projects: zod_1.z.array(zod_1.z.object({
        year: zod_1.z.string().nullable().describe("L'année de réalisation du projet"),
        client: zod_1.z.string().describe("Le nom du client ou de l'entreprise cible"),
        description: zod_1.z.string().describe("La description de la réalisation technique réseau ou sécurité")
    })).describe("Les projets et réalisations notables")
});
exports.CvExtractionSchema = zod_1.z.object({
    full_name: zod_1.z.string().nullable().describe("Le nom et prénom de l'employé"),
    profession: zod_1.z.string().nullable().describe("Le diplôme ou le poste actuel de l'employé"),
    email: zod_1.z.string().nullable().describe("L'adresse email de contact"),
    phone: zod_1.z.string().nullable().describe("Le numéro de téléphone principal"),
    fax: zod_1.z.string().nullable().describe("Le numéro de fax s'il existe dans le CV"),
    address: zod_1.z.string().nullable().describe("L'adresse complète du candidat"),
    skills: zod_1.z.array(zod_1.z.string()).describe("Le tableau des compétences techniques clés"),
    certifications: zod_1.z.array(zod_1.z.object({
        cert_name: zod_1.z.string(),
        provider: zod_1.z.string(),
        date: zod_1.z.string().nullable()
    })),
    experiences: zod_1.z.array(zod_1.z.object({
        company: zod_1.z.string(),
        role: zod_1.z.string(),
        period: zod_1.z.string().nullable(),
        description: zod_1.z.string()
    })),
    education: zod_1.z.array(zod_1.z.object({
        year: zod_1.z.string().nullable(),
        institution: zod_1.z.string(),
        degree: zod_1.z.string()
    })),
    projects: zod_1.z.array(zod_1.z.object({
        year: zod_1.z.string().nullable(),
        client: zod_1.z.string(),
        description: zod_1.z.string()
    }))
});
//# sourceMappingURL=cv-extraction.schema.js.map