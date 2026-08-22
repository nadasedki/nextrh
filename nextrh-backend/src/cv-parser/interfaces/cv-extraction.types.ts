export interface SectionResult<T> {
  data: T[];
  source: 'heuristic' | 'llm';
  lowConfidence: boolean;
}

export interface ContactInfo {
  fullName: string;
  profession: string;
  phone: string;
  fax: string;
  email: string;
  address: string;
}

export interface CertificationEntry {
  cert_name: string;
  provider: string;
  date: string | null;
  issue_date: Date | null;
  expiry_date: Date | null;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  start_year: number | null;
  end_year: number;
}

export interface ProjectEntry {
  name: string;
  client: string;
  role: string;
  description: string;
  start_date: Date | null;
  end_date: Date | null;
  year: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  start_date: Date | null;
  end_date: Date | null;
  description: string;
}

export interface CvParseResult {
  profile: ContactInfo;
  skills: string[];
  experiences: SectionResult<ExperienceEntry>;
  certifications: SectionResult<CertificationEntry>;
  education: SectionResult<EducationEntry>;
  projects: SectionResult<ProjectEntry>;
}

// Fixed Error 3: Added ParsedCv type mapping for the heuristic parser
export interface ParsedCv {
  cv_id: number;
  user_id: number;
  file_path: string;
  format: string;
  generated: boolean;
  last_updated: Date;
  full_name: string;
  profession: string;
  email: string;
  phone: string;
  fax: string;
  address: string;
  skills: string[];
  certifications: CertificationEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  experiences: ExperienceEntry[];
}

// Fixed Error 2: Added ParsedCvResponse type mapping for the orchestrator output
export interface ParsedCvResponse {
  status: 'success';
  execution_metrics: {
    total_time_ms: number;
    heuristic_time_ms: number;
    llm_inference_ms: number;
    fallback_triggered: boolean;
    character_count: number;
  };
  data: {
    profile: {
      name: string;
      profession: string;
      phone: string;
      fax: string;
      email: string;
      address: string;
      skills: string[];
    };
    experience: Array<{ period: string; company: string; role: string; lowConfidence?: boolean }>;
    certifications: Array<{ certName: string; date: string | null; lowConfidence?: boolean }>;
    education: Array<{ year: string; institution: string; degree: string; lowConfidence?: boolean }>;
    projects: Array<{ year: string | null; client: string; description: string; lowConfidence?: boolean }>;
  };
}