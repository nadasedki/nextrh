import { z } from 'zod';

export const CvExtractionSchema = z.object({
  // Made nullable to prevent Zod validation failures on partial chunks or missing data
  full_name: z
    .string()
    .nullable()
    .describe("Le nom et prénom de l'employé (null si absent du texte)"),

  profession: z
    .string()
    .nullable()
    .describe("Le diplôme ou le poste actuel de l'employé (null si absent du texte)"),

  email: z
    .string()
    .nullable()
    .describe("L'adresse email de contact"),

  phone: z
    .string()
    .nullable()
    .describe("Le numéro de téléphone principal (ex: +216 ...)"),

  fax: z
    .string()
    .nullable()
    .describe("Le numéro de fax s'il existe dans le CV"),

  address: z
    .string()
    .nullable()
    .describe("L'adresse complète du candidat telle qu'écrite dans le CV"),

  skills: z
    .array(z.string())
    .describe("Le tableau des compétences techniques clés"),

  certifications: z.array(
    z.object({
      cert_name: z
        .string()
        .describe("Le nom officiel de la certification (ex: CCNP Security)"),

      provider: z
        .string()
        .describe("L'éditeur ou organisme (ex: Cisco, Fortinet, Professional Issuer)"),

      date: z
        .string()
        .nullable()
        .describe("Le mois et l'année d'obtention tels qu'écrits sur le CV (ex: Février 2020) ou null")
    })
  ).describe("Le tableau des certifications obtenues"),

  experiences: z.array(
    z.object({
      company: z
        .string()
        .describe("Le nom de l'entreprise"),

      role: z
        .string()
        .describe("Le poste occupé"),

      period: z
        .string()
        .nullable()
        .describe("La période exacte de l'expérience"),

      description: z
        .string()
        .describe("Résumé des tâches accomplies")
    })
  ).describe("Le parcours de l'historique professionnel"),

  education: z.array(
    z.object({
      year: z
        .string()
        .nullable() 
        .describe("L'année ou la période d'études"),

      institution: z
        .string()
        .describe("Le nom de l'école ou de l'université"),

      degree: z
        .string()
        .describe("Le diplôme obtenu et son option")
    })
  ).describe("Le parcours de formation et diplômes"),

  projects: z.array(
    z.object({
      year: z
        .string()
        .nullable()
        .describe("L'année de réalisation du projet"),

      client: z
        .string()
        .describe("Le nom du client ou de l'entreprise cible"),

      description: z
        .string()
        .describe("La description de la réalisation technique réseau ou sécurité")
    })
  ).describe("Les projets et réalisations notables")
});

export type CvExtractionResult = z.infer<typeof CvExtractionSchema>;