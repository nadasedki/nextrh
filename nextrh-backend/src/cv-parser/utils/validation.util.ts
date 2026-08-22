// src/cv-parser/utils/validation.util.ts

import { MONTH_MAP, SKILL_STOP_WORDS } from '../constants/cv-parser.constants';
import { CertificationEntry, EducationEntry, ExperienceEntry, ProjectEntry } from '../interfaces/cv-extraction.types';

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

// words that should never be the primary content of a company or client field
// their presence signals a parsing split error
const ROLE_KEYWORDS = [
  'chef', 'manager', 'engineer', 'ingénieur', 'consultant',
  'administrator', 'administrateur', 'technicien', 'developer',
  'développeur', 'infrastructure', 'directeur', 'responsable',
  'architecte', 'analyste', 'coordinateur',
];

// known certification providers — cert names from unknown providers are suspicious
// if the name contains no known provider AND no known cert acronym pattern, flag it
const KNOWN_CERT_PROVIDERS = [
  'cisco', 'fortinet', 'sophos', 'microsoft', 'dell', 'hp',
  'ibm', 'vmware', 'barracuda', 'forcepoint', 'comptia',
  'pmi', 'isaca', 'ec-council', 'red hat', 'aws', 'azure', 'google',
];

// month names — a field containing only a month/year is a date fragment, not a value
const MONTH_NAMES = Object.keys(MONTH_MAP);
// Words that indicate technical descriptions, not client/company entities
const TECH_LEAK_KEYWORDS = [
  'backend', 'frontend', 'api', 'rest', 'microservices', 'microservice',
  'services', 'système', 'system', 'développement', 'developpement', 
  'réseau', 'architecture', 'application', 'logiciel', 'solution',
];

// Prepositions that signal a sentence was cut in half mid-phrase
const HANGING_PREPOSITIONS = [
  'de', 'du', 'des', 'd\'', 'pour', 'avec', 'en', 'par', 'sur', 'le', 'la', 'les',
];
// checks if a string is (or starts with) a date fragment
function looksLikeDate(str: string): boolean {
  const s = str.toLowerCase().trim();
  // pure year
  if (/^\d{4}$/.test(s)) return true;
  // month year or "depuis month year"
  if (MONTH_NAMES.some(m => s.startsWith(m))) return true;
  // date range
  if (/^\d{4}\s*[-–]\s*\d{4}$/.test(s)) return true;
  return false;
}

// checks if a string looks like a role/job title rather than a company name
function looksLikeRole(str: string): boolean {
  const words = str.toLowerCase().split(/\s+/);
  return words.some(w => ROLE_KEYWORDS.includes(w));
}

// ─── CERTIFICATION VALIDATOR ─────────────────────────────────────────────────

export interface CertValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateCertification(cert: CertificationEntry): CertValidationResult {
  const name = (cert.cert_name ?? '').trim();

  // structural checks
  if (name.length < 3)
    return { valid: false, reason: 'name too short' };

  if (name.length > 120)
    return { valid: false, reason: 'name too long — likely paragraph fusion' };

  if (name.split(/\s+/).length > 15)
    return { valid: false, reason: 'too many words — likely merged lines' };

  if ((name.match(/[:\-|•●▪]/g) ?? []).length > 2)
    return { valid: false, reason: 'too many separators — likely merged lines' };

  // semantic checks
  if (looksLikeDate(name))
    return { valid: false, reason: 'name is a date fragment — parser misalignment' };

  // a cert name that is purely numeric is wrong
  if (/^\d+$/.test(name))
    return { valid: false, reason: 'name is purely numeric' };

  // cert name that is only a single common word with no technical content is suspicious
  if (name.split(/\s+/).length === 1 && !KNOWN_CERT_PROVIDERS.includes(name.toLowerCase()))
    return { valid: false, reason: 'single generic word — likely a parsing noise artifact' };

  return { valid: true };
}

export function isCertificationSectionValid(certs: CertificationEntry[]): boolean {
  if (certs.length === 0) return false;
  const results = certs.map(validateCertification);
  const invalidCount = results.filter(r => !r.valid).length;

  // log reasons for debugging during development
  results
    .filter(r => !r.valid)
    .forEach(r => console.debug(`[CertGate] Invalid: ${r.reason}`));

  // fail the section if more than a third of entries are invalid
  // this avoids triggering fallback when only one entry out of many has noise
  return invalidCount / certs.length === 0;// <= 0.33;
}

// ─── EDUCATION VALIDATOR ─────────────────────────────────────────────────────

export interface EduValidationResult {
  valid: boolean;
  reason?: string;
}

const DEGREE_KEYWORDS = [
  'diplôme', 'licence', 'baccalauréat', 'ingénieur', 'master',
  'doctorat', 'technicien', 'bts', 'dut', 'deug', 'bac',
  'bachelor', 'mba', 'phd', 'msc', 'bsc',
];

const INSTITUTION_NOISE = [
  'option', 'spécialité', 'mention', 'filière',
];

export function validateEducation(edu: EducationEntry): EduValidationResult {
  const institution = (edu.institution ?? '').trim();
  const degree      = (edu.degree ?? '').trim();

  if (!institution)
    return { valid: false, reason: 'missing institution' };

  if (!degree || degree.length < 5)
    return { valid: false, reason: 'missing or too short degree' };

  // semantic: institution field should not look like a degree
  const institutionLower = institution.toLowerCase();
  if (DEGREE_KEYWORDS.some(kw => institutionLower.startsWith(kw)))
    return { valid: false, reason: 'institution field contains degree keyword — fields swapped' };

  // semantic: institution field should not be a date
  if (looksLikeDate(institution))
    return { valid: false, reason: 'institution field is a date fragment' };

  // semantic: degree field should not look like an institution name
  const degreeLower = degree.toLowerCase();
  if (INSTITUTION_NOISE.some(kw => degreeLower.startsWith(kw)))
    return { valid: false, reason: 'degree field starts with option/filière — likely noise' };

  // semantic: if institution is very short it is likely a parsing split artifact
  if (institution.split(/\s+/).length === 1 && institution.length < 4)
    return { valid: false, reason: 'institution is a single short token — likely parsing artifact' };

  return { valid: true };
}

export function isEducationSectionValid(education: EducationEntry[]): boolean {
  if (education.length === 0) return false;
  const results      = education.map(validateEducation);
  const invalidCount = results.filter(r => !r.valid).length;
  return invalidCount / education.length === 0;
}

// ─── EXPERIENCE VALIDATOR ────────────────────────────────────────────────────

export interface ExpValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateExperience(exp: ExperienceEntry): ExpValidationResult {
  const company = (exp.company ?? '').trim();
  const role    = (exp.role    ?? '').trim();

  if (!company || company === 'Inconnu')
    return { valid: false, reason: 'missing company' };

  if (!role || role.length < 3)
    return { valid: false, reason: 'missing or too short role' };

  // semantic: company field should not contain a date
  if (looksLikeDate(company))
    return { valid: false, reason: 'company field is a date fragment — parser misalignment' };

  // semantic: company field should not contain role keywords
  // e.g. "Chef de Projet" ending up as company name
  if (looksLikeRole(company))
    return { valid: false, reason: 'company field contains job title keywords — fields swapped' };

  // semantic: role field should not be a date
  if (looksLikeDate(role))
    return { valid: false, reason: 'role field is a date fragment' };

  // semantic: role that is only a company name pattern (all caps, no verbs) is suspicious
  // real roles are descriptive: "Ingénieur Réseaux", not "NEXTSTEP IT"
  if (/^[A-Z\s]+$/.test(role) && role.length < 20)
    return { valid: false, reason: 'role looks like a company name — fields possibly swapped' };

  return { valid: true };
}

export function isExperienceSectionValid(experiences: ExperienceEntry[]): boolean {
  if (experiences.length === 0) return false;
  const results      = experiences.map(validateExperience);
  const invalidCount = results.filter(r => !r.valid).length;
  return invalidCount / experiences.length === 0;
}

// ─── PROJECT VALIDATOR ───────────────────────────────────────────────────────

export interface ProjValidationResult {
  valid: boolean;
  reason?: string;
}

// action keywords that should appear in description, not in client
// if these appear as the client name, the split failed
const ACTION_PREFIXES = [
  'mise en place', 'migration', 'déploiement', 'configuration',
  'installation', 'audit', 'conception', 'développement',
  'maintenance', 'intégration', 'virtualisation', 'implémentation',
];

export function validateProject(proj: ProjectEntry): ProjValidationResult {
  const client      = (proj.client      ?? '').trim();
  const description = (proj.description ?? '').trim();

  // 1. Structural checks
  if (!client || client === 'Client Inconnu')
    return { valid: false, reason: 'missing client' };

  if (!description || description.length < 10)
    return { valid: false, reason: 'description too short' };

  const clientLower = client.toLowerCase();
  const clientWords = clientLower.split(/\s+/);

  // 2. NEW SEMANTIC CHECK: Technical keywords leaked into client
  if (clientWords.some(w => TECH_LEAK_KEYWORDS.includes(w))) {
    return { 
      valid: false, 
      reason: 'client field contains technical keywords — description leakage detected' 
    };
  }

  // 3. NEW SEMANTIC CHECK: Client field ends with/is a date fragment
  if (looksLikeDate(client)) {
    return { valid: false, reason: 'client field is a date fragment' };
  }

  // 4. NEW SEMANTIC CHECK: Client field should not start with an action keyword
  if (ACTION_PREFIXES.some(a => clientLower.startsWith(a))) {
    return { valid: false, reason: 'client field starts with action keyword — split failed' };
  }

  // 5. NEW SEMANTIC CHECK: Client field ends with a preposition (truncation error)
  const lastWord = clientWords[clientWords.length - 1];
  if (HANGING_PREPOSITIONS.includes(lastWord)) {
    return { 
      valid: false, 
      reason: 'client field ends with a hanging preposition — split truncated mid-phrase' 
    };
  }

  // 6. Structural check: Client name too long
  if (clientWords.length > 10) {
    return { valid: false, reason: 'client name too long — likely contains description' };
  }

  if (client === description) {
    return { valid: false, reason: 'client and description are identical' };
  }

  return { valid: true };
}

export function isProjectSectionValid(projects: ProjectEntry[]): boolean {
  if (projects.length === 0) return false;
  const results      = projects.map(validateProject);
  const invalidCount = results.filter(r => !r.valid).length;
  return invalidCount / projects.length === 0;
}

export function isValidSkill(token: string): boolean {
  const cleanToken = token.replace(/^[-\–\.\*•●▪\s\(\)]+|[-\–\.\*•●▪\s\(\)]+$/g, '').trim();

  // Length constraints
  if (cleanToken.length < 2 || cleanToken.length > 40) return false;

  // Maximum word count
  const words = cleanToken.split(/\s+/);
  if (words.length > 4) return false;

  // Avoid raw years/numbers
  if (/^\d+$/.test(cleanToken) || /^\d{4}/.test(cleanToken)) return false;

  // Ignore solo generic stop-words
  if (words.length === 1 && SKILL_STOP_WORDS.has(cleanToken.toLowerCase())) {
    return false;
  }

  // Must contain letters
  if (!/[a-zA-Zà-ÿ]/i.test(cleanToken)) return false;

  return true;
}
export function isSkillsSectionValid(skills: string[]): boolean {
  return skills.length >= 3;
}