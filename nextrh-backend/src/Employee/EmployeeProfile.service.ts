import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
export interface CvProfile {
  cv_id: number;
  user_id: number;
  full_name: string;
  profession?: string;
  email?: string;
  address?: string;
  skills?: string;
  active_generation ?: number;
}
@Injectable()
export class EmployeeProfileService {
  constructor(private readonly dataSource: DataSource) {}

  //methode for rag indexing data

    /**
   * Get all CVs basic profiles (Requires a valid user_id link)
   */
  async getAllCVs(): Promise<CvProfile[]> {
    return await this.dataSource.query(`
      SELECT 
        cv_id,
        user_id,
        full_name,
        profession,
        email,
        phone,
        fax,
        address,
        skills,
        active_generation
      FROM public.cvs
      WHERE user_id IS NOT NULL
    `);
  }

  /**
   * Fetch a single candidate profile record cleanly using their user_id
   */
 async getCVByUserId(userId: number): Promise<CvProfile | null> {
    const rows = await this.dataSource.query(`
      SELECT 
        cv.cv_id,
        cv.user_id,
        cv.full_name,
        cv.profession,
        cv.email,
        cv.phone,
        cv.fax,
        cv.address,
        cv.skills,
        cv.active_generation,
        u.years_of_experience -- Joined from public.users table
      FROM public.cvs cv
      LEFT JOIN public.users u ON cv.user_id = u.user_id
      WHERE cv.user_id = $1
      LIMIT 1
    `, [userId]);
    
    return rows.length > 0 ? rows[0] : null;
  }

  async getAllCertifications() {
    return await this.dataSource.query(`
      SELECT * FROM public.certifications
    `);
  }

  /**
   * Fetch elements by bridging the cvCvId relation to the primary user_id
   */
  async getEducationByUserId(userId: number) {
    return await this.dataSource.query(
      `SELECT e.* FROM public.educations e 
       JOIN public.cvs cv ON e."cvCvId" = cv.cv_id 
       WHERE cv.user_id = $1`,
      [userId],
    );
  }

  async getProjectsByUserId(userId: number) {
    return await this.dataSource.query(
      `SELECT p.* FROM public.projects p 
       JOIN public.cvs cv ON p."cvCvId" = cv.cv_id 
       WHERE cv.user_id = $1`,
      [userId],
    );
  }

  async getExperiencesByUserId(userId: number) {
    return await this.dataSource.query(
      `SELECT e.* FROM public.experiences e 
       JOIN public.cvs cv ON e."cvCvId" = cv.cv_id 
       WHERE cv.user_id = $1`,
      [userId],
    );
  }

  /**
   * Fetches certifications for a specific user.
   * FIX: Removed try/catch block to stop silent array corruption.
   */
  async getCertificationsByUserId(userId: number) {
    return await this.dataSource.query(
      `SELECT c.* FROM public.certifications c
       JOIN public.cvs cv ON c."cvCvId" = cv.cv_id
       WHERE cv.user_id = $1`,
      [userId],
    );
  }
/**
   * Fetch professional training modules assigned directly to the primary user_id
   */
  async getTrainingsByUserId(userId: number) {
    return await this.dataSource.query(`
      SELECT 
        training_id,
        user_id,
        training_name,
        provider,
        description,
        completion_date,
        duration
      FROM public.training_sessions
      WHERE user_id = $1
    `, [userId]);
  }
}