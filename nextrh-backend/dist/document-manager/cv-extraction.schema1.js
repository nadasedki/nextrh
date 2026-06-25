"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvExtractionSchema = void 0;
const zod_1 = require("zod");
exports.CvExtractionSchema = zod_1.z.object({
    full_name: zod_1.z
        .string()
        .nullable()
        .describe("Le nom et prénom de l'employé (null si absent du texte)"),
    profession: zod_1.z
        .string()
        .nullable()
        .describe("Le diplôme ou le poste actuel de l'employé (null si absent du texte)"),
    email: zod_1.z
        .string()
        .nullable()
        .describe("L'adresse email de contact"),
    phone: zod_1.z
        .string()
        .nullable()
        .describe("Le numéro de téléphone principal (ex: +216 ...)"),
    fax: zod_1.z
        .string()
        .nullable()
        .describe("Le numéro de fax s'il existe dans le CV"),
    address: zod_1.z
        .string()
        .nullable()
        .describe("L'adresse complète du candidat telle qu'écrite dans le CV"),
    skills: zod_1.z
        .array(zod_1.z.string())
        .describe("Le tableau des compétences techniques clés"),
    certifications: zod_1.z.array(zod_1.z.object({
        cert_name: zod_1.z
            .string()
            .describe("Le nom officiel de la certification (ex: CCNP Security)"),
        provider: zod_1.z
            .string()
            .describe("L'éditeur ou organisme (ex: Cisco, Fortinet, Professional Issuer)"),
        date: zod_1.z
            .string()
            .nullable()
            .describe("Le mois et l'année d'obtention tels qu'écrits sur le CV (ex: Février 2020) ou null")
    })).describe("Le tableau des certifications obtenues"),
    experiences: zod_1.z.array(zod_1.z.object({
        company: zod_1.z
            .string()
            .describe("Le nom de l'entreprise"),
        role: zod_1.z
            .string()
            .describe("Le poste occupé"),
        period: zod_1.z
            .string()
            .nullable()
            .describe("La période exacte de l'expérience"),
        description: zod_1.z
            .string()
            .describe("Résumé des tâches accomplies")
    })).describe("Le parcours de l'historique professionnel"),
    education: zod_1.z.array(zod_1.z.object({
        year: zod_1.z
            .string()
            .nullable()
            .describe("L'année ou la période d'études"),
        institution: zod_1.z
            .string()
            .describe("Le nom de l'école ou de l'université"),
        degree: zod_1.z
            .string()
            .describe("Le diplôme obtenu et son option")
    })).describe("Le parcours de formation et diplômes"),
    projects: zod_1.z.array(zod_1.z.object({
        year: zod_1.z
            .string()
            .nullable()
            .describe("L'année de réalisation du projet"),
        client: zod_1.z
            .string()
            .describe("Le nom du client ou de l'entreprise cible"),
        description: zod_1.z
            .string()
            .describe("La description de la réalisation technique réseau ou sécurité")
    })).describe("Les projets et réalisations notables")
});
//# sourceMappingURL=cv-extraction.schema1.js.map