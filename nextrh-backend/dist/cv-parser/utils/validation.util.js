"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCertification = validateCertification;
exports.isCertificationSectionValid = isCertificationSectionValid;
exports.validateEducation = validateEducation;
exports.isEducationSectionValid = isEducationSectionValid;
exports.validateExperience = validateExperience;
exports.isExperienceSectionValid = isExperienceSectionValid;
exports.validateProject = validateProject;
exports.isProjectSectionValid = isProjectSectionValid;
exports.isValidSkill = isValidSkill;
exports.isSkillsSectionValid = isSkillsSectionValid;
const cv_parser_constants_1 = require("../constants/cv-parser.constants");
const ROLE_KEYWORDS = [
    'chef', 'manager', 'engineer', 'ingénieur', 'consultant',
    'administrator', 'administrateur', 'technicien', 'developer',
    'développeur', 'infrastructure', 'directeur', 'responsable',
    'architecte', 'analyste', 'coordinateur',
];
const KNOWN_CERT_PROVIDERS = [
    'cisco', 'fortinet', 'sophos', 'microsoft', 'dell', 'hp',
    'ibm', 'vmware', 'barracuda', 'forcepoint', 'comptia',
    'pmi', 'isaca', 'ec-council', 'red hat', 'aws', 'azure', 'google',
];
const MONTH_NAMES = Object.keys(cv_parser_constants_1.MONTH_MAP);
const TECH_LEAK_KEYWORDS = [
    'backend', 'frontend', 'api', 'rest', 'microservices', 'microservice',
    'services', 'système', 'system', 'développement', 'developpement',
    'réseau', 'architecture', 'application', 'logiciel', 'solution',
];
const HANGING_PREPOSITIONS = [
    'de', 'du', 'des', 'd\'', 'pour', 'avec', 'en', 'par', 'sur', 'le', 'la', 'les',
];
function looksLikeDate(str) {
    const s = str.toLowerCase().trim();
    if (/^\d{4}$/.test(s))
        return true;
    if (MONTH_NAMES.some(m => s.startsWith(m)))
        return true;
    if (/^\d{4}\s*[-–]\s*\d{4}$/.test(s))
        return true;
    return false;
}
function looksLikeRole(str) {
    const words = str.toLowerCase().split(/\s+/);
    return words.some(w => ROLE_KEYWORDS.includes(w));
}
function validateCertification(cert) {
    const name = (cert.cert_name ?? '').trim();
    if (name.length < 3)
        return { valid: false, reason: 'name too short' };
    if (name.length > 120)
        return { valid: false, reason: 'name too long — likely paragraph fusion' };
    if (name.split(/\s+/).length > 15)
        return { valid: false, reason: 'too many words — likely merged lines' };
    if ((name.match(/[:\-|•●▪]/g) ?? []).length > 2)
        return { valid: false, reason: 'too many separators — likely merged lines' };
    if (looksLikeDate(name))
        return { valid: false, reason: 'name is a date fragment — parser misalignment' };
    if (/^\d+$/.test(name))
        return { valid: false, reason: 'name is purely numeric' };
    if (name.split(/\s+/).length === 1 && !KNOWN_CERT_PROVIDERS.includes(name.toLowerCase()))
        return { valid: false, reason: 'single generic word — likely a parsing noise artifact' };
    return { valid: true };
}
function isCertificationSectionValid(certs) {
    if (certs.length === 0)
        return false;
    const results = certs.map(validateCertification);
    const invalidCount = results.filter(r => !r.valid).length;
    results
        .filter(r => !r.valid)
        .forEach(r => console.debug(`[CertGate] Invalid: ${r.reason}`));
    return invalidCount / certs.length === 0;
}
const DEGREE_KEYWORDS = [
    'diplôme', 'licence', 'baccalauréat', 'ingénieur', 'master',
    'doctorat', 'technicien', 'bts', 'dut', 'deug', 'bac',
    'bachelor', 'mba', 'phd', 'msc', 'bsc',
];
const INSTITUTION_NOISE = [
    'option', 'spécialité', 'mention', 'filière',
];
function validateEducation(edu) {
    const institution = (edu.institution ?? '').trim();
    const degree = (edu.degree ?? '').trim();
    if (!institution)
        return { valid: false, reason: 'missing institution' };
    if (!degree || degree.length < 5)
        return { valid: false, reason: 'missing or too short degree' };
    const institutionLower = institution.toLowerCase();
    if (DEGREE_KEYWORDS.some(kw => institutionLower.startsWith(kw)))
        return { valid: false, reason: 'institution field contains degree keyword — fields swapped' };
    if (looksLikeDate(institution))
        return { valid: false, reason: 'institution field is a date fragment' };
    const degreeLower = degree.toLowerCase();
    if (INSTITUTION_NOISE.some(kw => degreeLower.startsWith(kw)))
        return { valid: false, reason: 'degree field starts with option/filière — likely noise' };
    if (institution.split(/\s+/).length === 1 && institution.length < 4)
        return { valid: false, reason: 'institution is a single short token — likely parsing artifact' };
    return { valid: true };
}
function isEducationSectionValid(education) {
    if (education.length === 0)
        return false;
    const results = education.map(validateEducation);
    const invalidCount = results.filter(r => !r.valid).length;
    return invalidCount / education.length === 0;
}
function validateExperience(exp) {
    const company = (exp.company ?? '').trim();
    const role = (exp.role ?? '').trim();
    if (!company || company === 'Inconnu')
        return { valid: false, reason: 'missing company' };
    if (!role || role.length < 3)
        return { valid: false, reason: 'missing or too short role' };
    if (looksLikeDate(company))
        return { valid: false, reason: 'company field is a date fragment — parser misalignment' };
    if (looksLikeRole(company))
        return { valid: false, reason: 'company field contains job title keywords — fields swapped' };
    if (looksLikeDate(role))
        return { valid: false, reason: 'role field is a date fragment' };
    if (/^[A-Z\s]+$/.test(role) && role.length < 20)
        return { valid: false, reason: 'role looks like a company name — fields possibly swapped' };
    return { valid: true };
}
function isExperienceSectionValid(experiences) {
    if (experiences.length === 0)
        return false;
    const results = experiences.map(validateExperience);
    const invalidCount = results.filter(r => !r.valid).length;
    return invalidCount / experiences.length === 0;
}
const ACTION_PREFIXES = [
    'mise en place', 'migration', 'déploiement', 'configuration',
    'installation', 'audit', 'conception', 'développement',
    'maintenance', 'intégration', 'virtualisation', 'implémentation',
];
function validateProject(proj) {
    const client = (proj.client ?? '').trim();
    const description = (proj.description ?? '').trim();
    if (!client || client === 'Client Inconnu')
        return { valid: false, reason: 'missing client' };
    if (!description || description.length < 10)
        return { valid: false, reason: 'description too short' };
    const clientLower = client.toLowerCase();
    const clientWords = clientLower.split(/\s+/);
    if (clientWords.some(w => TECH_LEAK_KEYWORDS.includes(w))) {
        return {
            valid: false,
            reason: 'client field contains technical keywords — description leakage detected'
        };
    }
    if (looksLikeDate(client)) {
        return { valid: false, reason: 'client field is a date fragment' };
    }
    if (ACTION_PREFIXES.some(a => clientLower.startsWith(a))) {
        return { valid: false, reason: 'client field starts with action keyword — split failed' };
    }
    const lastWord = clientWords[clientWords.length - 1];
    if (HANGING_PREPOSITIONS.includes(lastWord)) {
        return {
            valid: false,
            reason: 'client field ends with a hanging preposition — split truncated mid-phrase'
        };
    }
    if (clientWords.length > 10) {
        return { valid: false, reason: 'client name too long — likely contains description' };
    }
    if (client === description) {
        return { valid: false, reason: 'client and description are identical' };
    }
    return { valid: true };
}
function isProjectSectionValid(projects) {
    if (projects.length === 0)
        return false;
    const results = projects.map(validateProject);
    const invalidCount = results.filter(r => !r.valid).length;
    return invalidCount / projects.length === 0;
}
function isValidSkill(token) {
    const cleanToken = token.replace(/^[-\–\.\*•●▪\s\(\)]+|[-\–\.\*•●▪\s\(\)]+$/g, '').trim();
    if (cleanToken.length < 2 || cleanToken.length > 40)
        return false;
    const words = cleanToken.split(/\s+/);
    if (words.length > 4)
        return false;
    if (/^\d+$/.test(cleanToken) || /^\d{4}/.test(cleanToken))
        return false;
    if (words.length === 1 && cv_parser_constants_1.SKILL_STOP_WORDS.has(cleanToken.toLowerCase())) {
        return false;
    }
    if (!/[a-zA-Zà-ÿ]/i.test(cleanToken))
        return false;
    return true;
}
function isSkillsSectionValid(skills) {
    return skills.length >= 3;
}
//# sourceMappingURL=validation.util.js.map