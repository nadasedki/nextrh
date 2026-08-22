export interface CvProfile {
    cv_id: number;
    user_id: number;
    full_name: string;
    profession?: string;
    email?: string;
    address?: string;
    skills?: string;
    active_generation?: number;
}
export interface Certification {
    certId: number;
    cert_name: string;
    provider: string;
    issue_date?: string;
    full_name?: string;
    profession?: string;
    cv_id?: number;
}
export interface Education {
    education_id: number;
    degree: string;
    institution: string;
    field_of_study?: string;
    start_year: string;
    end_year?: string;
}
export interface Project {
    id: number;
    name: string;
    client?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
    technologies?: string;
}
export interface Experience {
    id: number;
    role: string;
    company: string;
    start_date?: string;
    end_date?: string;
    description?: string;
}
export interface Training {
    training_id: number;
    user_id: number;
    training_name: string;
    provider: string;
    description?: string;
    completion_date?: string;
    duration?: string;
}
