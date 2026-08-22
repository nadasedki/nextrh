import { Injectable } from '@nestjs/common';
import { CvProfile, Certification, Education, Project, Experience, Training } from '../types/cv-index.types';

export interface TextChunk {
  text: string;
  chunkIndex: number;
}

// Unified input contract to pass to the chunking pipeline [1]
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

@Injectable()
export class ChunkingService {

  /**
   * Formats a raw Date or string value to a clean, readable calendar year [1]
   */
  private formatDate(date?: Date | string | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? String(date) : d.getFullYear().toString();
  }

  /**
   * CHUNK 1 (Static): Competencies & Core Background
   * Combines candidate metadata, core skills, academic history, and career experiences [1].
   */
  chunkStaticProfile(profile: CandidateProfile): TextChunk[] {
    const { full_name, profession, email, address, skills, educations, experiences } = profile;
    const lines: string[] = [];

    // Semantic Identity Statement (gives the model clear subject context) [2]
    lines.push(`${full_name} est un professionnel spécialisé en tant que ${profession || 'spécialiste IT'}.`);

    if (email) lines.push(`Contact email: ${email}.`);
    if (address) lines.push(`Adresse professionnelle: ${address}.`);

    if (skills?.trim()) {
      lines.push(`Ses compétences techniques principales incluent: ${skills.trim()}.`);
    }

    // Academic Background
    lines.push(`Parcours académique et d'études de ${full_name}:`);
    if (educations && educations.length > 0) {
      educations.forEach((edu) => {
        const period = edu.start_year && edu.end_year ? `${edu.start_year}–${edu.end_year}` : 'période non spécifiée';
        lines.push(`  - Titulaire d'un ${edu.degree || 'diplôme'} en ${edu.field_of_study || 'N/A'} délivré par ${edu.institution || 'N/A'} (${period}).`);
      });
    } else {
      lines.push(`  Aucun parcours académique enregistré.`);
    }

    // Career Timeline
    lines.push(`Historique de carrière et expériences de ${full_name}:`);
    if (experiences && experiences.length > 0) {
      experiences.forEach((exp) => {
        const start = this.formatDate(exp.start_date);
        const end = this.formatDate(exp.end_date) || 'présent';
        const desc = exp.description && exp.description !== exp.role ? ` Missions principales accomplies: ${exp.description}.` : '';
        lines.push(`  - Poste de ${exp.role || 'collaborateur'} chez ${exp.company || 'N/A'} de ${start} à ${end}.${desc}`);
      });
    } else {
      lines.push(`  Aucune expérience professionnelle enregistrée.`);
    }

    return [{ text: lines.join('\n').trim(), chunkIndex: 0 }];
  }

  /**
   * CHUNK 2 (Dynamic): The Unified Project Portfolio [1]
   */
  chunkAllProjects(profile: CandidateProfile): TextChunk[] {
    const { full_name, profession, projects } = profile;
    const lines: string[] = [];

    lines.push(`Historique complet des projets et réalisations techniques de ${full_name} (${profession || 'spécialiste IT'}):`);

    if (projects && projects.length > 0) {
      projects.forEach((proj, index) => {
        const start = this.formatDate(proj.start_date);
        const end = this.formatDate(proj.end_date);
        const period = start === end ? start : `${start}–${end}`;
        
        lines.push(
          `  [Projet ${index + 1}] Client: ${proj.client || 'N/A'} (${period}).` +
          ` Réalisation: ${proj.description || 'N/A'}.`
        );
      });
    } else {
      lines.push(`  ${full_name} n'a aucun projet client enregistré.`);
    }

    return [{ text: lines.join('\n').trim(), chunkIndex: 1 }];
  }

  /**
   * CHUNK 3 (Dynamic): The Professional Credentials (Certifications & Trainings) [1]
   */
  chunkAllCredentials(profile: CandidateProfile): TextChunk[] {
    const { full_name, profession, certifications, trainings } = profile;
    const lines: string[] = [];

    lines.push(`Accréditations, certifications officielles et formations de ${full_name} (${profession || 'spécialiste IT'}):`);

    // Certifications
    lines.push(`Certifications professionnelles obtenues:`);
    if (certifications && certifications.length > 0) {
      certifications.forEach((cert) => {
        const date = this.formatDate(cert.issue_date);
        const provider = cert.provider && cert.provider !== 'Professional Issuer' ? ` délivrée par ${cert.provider}` : '';
        lines.push(`  - Certification ${cert.cert_name || 'N/A'}${provider}, obtenue en ${date}.`);
      });
    } else {
      lines.push(`  Aucune certification professionnelle enregistrée.`);
    }

    // Trainings
    lines.push(`Formations complémentaires et séminaires suivis:`);
    if (trainings && trainings.length > 0) {
      trainings.forEach((train) => {
        const org = train.provider ? ` dispensé par ${train.provider}` : '';
        const duration = train.duration ? ` (durée de ${train.duration})` : '';
        lines.push(`  - Séminaire sur ${train.training_name || 'formation'}${org}${duration}.`);
      });
    } else {
      lines.push(`  Aucune formation complémentaire enregistrée.`);
    }

    return [{ text: lines.join('\n').trim(), chunkIndex: 2 }];
  }

  /**
   * Generates all 3 semantic vectors in a single execution pipeline [1]
   */
  chunkCandidate(profile: CandidateProfile): TextChunk[] {
    return [
      ...this.chunkStaticProfile(profile),
      ...this.chunkAllProjects(profile),
      ...this.chunkAllCredentials(profile),
    ];
  }
}