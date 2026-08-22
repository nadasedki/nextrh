export interface EducationItem {
    degree: string;
    institution: string;
    start_year: string | number;
    end_year: string | number;
}
export interface ExperienceItem {
    role: string;
    company: string;
    period: string;
    description: string;
}
export interface CertificationItem {
    cert_name: string;
    provider: string;
    date: string;
}
export interface ProjectItem {
    client: string;
    year: string;
    description: string;
}
export interface TrainingItem {
    training_name: string;
    provider: string;
    duration: string;
}
export interface FormattedCandidateData {
    full_name: string;
    profession: string;
    email: string;
    phone: string;
    address: string;
    skills: string[];
    education: EducationItem[];
    experiences: ExperienceItem[];
    certifications: CertificationItem[];
    projects: ProjectItem[];
    trainings: TrainingItem[];
    years_of_experience?: string;
}
export type CandidateData = FormattedCandidateData;
