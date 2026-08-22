import { CertificationEntry, EducationEntry, ExperienceEntry, ProjectEntry } from '../interfaces/cv-extraction.types';
export interface CertValidationResult {
    valid: boolean;
    reason?: string;
}
export declare function validateCertification(cert: CertificationEntry): CertValidationResult;
export declare function isCertificationSectionValid(certs: CertificationEntry[]): boolean;
export interface EduValidationResult {
    valid: boolean;
    reason?: string;
}
export declare function validateEducation(edu: EducationEntry): EduValidationResult;
export declare function isEducationSectionValid(education: EducationEntry[]): boolean;
export interface ExpValidationResult {
    valid: boolean;
    reason?: string;
}
export declare function validateExperience(exp: ExperienceEntry): ExpValidationResult;
export declare function isExperienceSectionValid(experiences: ExperienceEntry[]): boolean;
export interface ProjValidationResult {
    valid: boolean;
    reason?: string;
}
export declare function validateProject(proj: ProjectEntry): ProjValidationResult;
export declare function isProjectSectionValid(projects: ProjectEntry[]): boolean;
export declare function isValidSkill(token: string): boolean;
export declare function isSkillsSectionValid(skills: string[]): boolean;
