import { Certification, Education, Project, Experience, Training } from '../types/cv-index.types';
export interface TextChunk {
    text: string;
    chunkIndex: number;
}
export interface CandidateProfile {
    cv_id: number;
    full_name: string;
    profession?: string;
    email?: string;
    address?: string;
    skills?: string;
    educations: Education[];
    experiences: Experience[];
    projects: Project[];
    certifications: Certification[];
    trainings: Training[];
}
export declare class ChunkingService {
    private formatDate;
    chunkStaticProfile(profile: CandidateProfile): TextChunk[];
    chunkAllProjects(profile: CandidateProfile): TextChunk[];
    chunkAllCredentials(profile: CandidateProfile): TextChunk[];
    chunkCandidate(profile: CandidateProfile): TextChunk[];
}
