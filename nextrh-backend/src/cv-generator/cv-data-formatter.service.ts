import { Injectable, BadRequestException } from '@nestjs/common';
import { FormattedCandidateData, EducationItem, ExperienceItem, CertificationItem, ProjectItem, TrainingItem } from './candidate-data.types';
import { EmployeeProfileService } from '../Employee/employeeProfile.service';

@Injectable()
export class CvDataFormatterService {

  constructor(
    private readonly employeeService: EmployeeProfileService,
  ) {}

  /**
   * Fetches raw database records concurrently and compiles them into the clean type contract
   */
  async getFormattedCandidateData(userId: number): Promise<FormattedCandidateData> {
    const profile = await this.employeeService.getCVByUserId(userId);
    if (!profile) {
      throw new BadRequestException(`No profile found for user #${userId}`);
    }

    const [eduRaw, expRaw, certsRaw, projectsRaw, trainingsRaw] = await Promise.all([
      this.employeeService.getEducationByUserId(userId),
      this.employeeService.getExperiencesByUserId(userId),
      this.employeeService.getCertificationsByUserId(userId),
      this.employeeService.getProjectsByUserId(userId),
      this.employeeService.getTrainingsByUserId(userId),
    ]);

    return this.format(profile, eduRaw, expRaw, certsRaw, projectsRaw, trainingsRaw);
  }

  /**
   * Evaluates and formats raw database records
   */
  private format(
    profile: any, 
    eduRaw: any[], 
    expRaw: any[], 
    certsRaw: any[], 
    projectsRaw: any[], 
    trainingsRaw: any[]
  ): FormattedCandidateData {
    return {
      full_name: profile.full_name,
      profession: profile.profession,
      email: profile.email,
      phone: (profile as any).phone || '',
      address: profile.address,
      skills: profile.skills ? profile.skills.split(',').map((s: string) => s.trim()) : [],
      years_of_experience:profile.years_of_experience || '',
      education: eduRaw.map(edu => ({
        degree: edu.degree || edu.diploma || '',
        institution: edu.institution || edu.school || '',
        start_year: edu.start_year || '', 
        end_year: edu.end_year || '',    
       
      })),

      experiences: expRaw.map(exp => ({
        role: exp.role || exp.title || '',
        company: exp.company || exp.enterprise || '',
        period: this.formatPeriod(exp.start_date, exp.end_date || exp.period),
        description: exp.description || '',
      })),

      certifications: certsRaw.map(cert => ({
        cert_name: cert.certification_name || cert.cert_name || cert.name || '',
        provider: cert.provider || '',
        date: this.formatDate(cert.completion_date || cert.date),
      })),

      projects: projectsRaw.map(proj => ({
        client: proj.client || proj.project_name || '',
        // FIX: Extract and format strictly as 4-digit years [1]
        year: this.formatPeriodYearsOnly(proj.start_date, proj.end_date || proj.year), 
        description: proj.description || '',
      })),

      trainings: trainingsRaw.map(t => ({
        training_name: t.training_name || '',
        provider: t.provider || '',
        duration: t.duration || '',
      })),
    };
  }

  // --- STANDARD DATE HELPERS ---
  private formatDate(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  private formatPeriod(startInput: any, endInput: any): string {
    const start = this.formatDate(startInput);
    const end = this.formatDate(endInput);
    
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    if (end) return end;
    return '';
  }

  // --- SPECIALIZED YEAR-ONLY DATE HELPERS ---
  private formatDateYearOnly(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      // Clean up string inputs (extract the 4-digit year if already formatted) [1]
      const match = String(dateInput).match(/\d{4}/);
      return match ? match[0] : String(dateInput);
    }
    return `${date.getFullYear()}`;
  }

  private formatPeriodYearsOnly(startInput: any, endInput: any): string {
    const start = this.formatDateYearOnly(startInput);
    const end = this.formatDateYearOnly(endInput);
    
    if (start && end) {
      // If start year and end year are identical (e.g. 2018 - 2018), collapse to single year [1]
      return start === end ? start : `${start} - ${end}`;
    }
    if (start) return start;
    if (end) return end;
    return '';
  }
}