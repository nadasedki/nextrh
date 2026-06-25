import { z } from 'zod';

// ==========================================
// 1. MINI-SCHÉMAS DE FALLBACK (PAR SECTION)
// ==========================================

export const ExperiencesFallbackSchema = z.object({
  experiences: z.array(
    z.object({
      company: z.string().describe("Le nom de l'entreprise"),
      role: z.string().describe("Le poste occupé"),
      period: z.string().nullable().describe("La période exacte de l'expérience (ex: Février 2018 ou 2006 - 2016)"),
      description: z.string().describe("Résumé des tâches accomplies")
    })
  ).describe("Le tableau des expériences professionnelles extraites")
});

export const CertificationsFallbackSchema = z.object({
  certifications: z.array(
    z.object({
      cert_name: z.string().describe("Le nom officiel de la certification (ex: CCNP Security)"),
      provider: z.string().describe("L'éditeur ou organisme (ex: Cisco, Fortinet, Dell, Microsoft)"),
      date: z.string().nullable().describe("Le mois et l'année d'obtention (ex: Février 2020) ou null")
    })
  ).describe("Le tableau des certifications obtenues")
});

export const EducationFallbackSchema = z.object({
  education: z.array(
    z.object({
      year: z.string().nullable().describe("L'année ou la période d'études"),
      institution: z.string().describe("Le nom de l'école ou de l'université"),
      degree: z.string().describe("Le diplôme obtenu et son option")
    })
  ).describe("Le parcours de formation et diplômes")
});

export const ProjectsFallbackSchema = z.object({
  projects: z.array(
    z.object({
      year: z.string().nullable().describe("L'année de réalisation du projet"),
      client: z.string().describe("Le nom du client ou de l'entreprise cible"),
      description: z.string().describe("La description de la réalisation technique réseau ou sécurité")
    })
  ).describe("Les projets et réalisations notables")
});


// ==========================================
// 2. SCHÉMA GLOBAL (CONSERVÉ POUR L'HEURISTIQUE)
// ==========================================

export const CvExtractionSchema = z.object({
  full_name: z.string().nullable().describe("Le nom et prénom de l'employé"),
  profession: z.string().nullable().describe("Le diplôme ou le poste actuel de l'employé"),
  email: z.string().nullable().describe("L'adresse email de contact"),
  phone: z.string().nullable().describe("Le numéro de téléphone principal"),
  fax: z.string().nullable().describe("Le numéro de fax s'il existe dans le CV"),
  address: z.string().nullable().describe("L'adresse complète du candidat"),
  skills: z.array(z.string()).describe("Le tableau des compétences techniques clés"),
  
  // Utilisation des structures internes identiques
  certifications: z.array(
    z.object({
      cert_name: z.string(),
      provider: z.string(),
      date: z.string().nullable()
    })
  ),
  experiences: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      period: z.string().nullable(),
      description: z.string()
    })
  ),
  education: z.array(
    z.object({
      year: z.string().nullable(),
      institution: z.string(),
      degree: z.string()
    })
  ),
  projects: z.array(
    z.object({
      year: z.string().nullable(),
      client: z.string(),
      description: z.string()
    })
  )
});


// ==========================================
// 3. EXPORT DES TYPES TYPESCRIPT
// ==========================================

export type ExperiencesFallbackResult = z.infer<typeof ExperiencesFallbackSchema>;
export type CertificationsFallbackResult = z.infer<typeof CertificationsFallbackSchema>;
export type EducationFallbackResult = z.infer<typeof EducationFallbackSchema>;
export type ProjectsFallbackResult = z.infer<typeof ProjectsFallbackSchema>;
export type CvExtractionResult = z.infer<typeof CvExtractionSchema>;