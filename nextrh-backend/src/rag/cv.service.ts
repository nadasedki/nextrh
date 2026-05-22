import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CvService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * Fetches unified profiles by pulling data from cvs, users, 
   * and all secondary child tables linked via user_id or cvCvId.
   */
  async getAllUnifiedProfiles() {
    try {
      // 1. Get all CV records joined with their master user record values
      const profiles = await this.dataSource.query(`
        SELECT 
          c.cv_id,
          c.user_id,
          u.full_name,
          u.title AS profession,
          u.summary,
          u.years_of_experience,
          u.department
        FROM public.cvs c
        INNER JOIN public.users u ON c.user_id = u.user_id
      `);

      for (const profile of profiles) {
        const [certs, edus, projs, exps] = await Promise.all([
          // Get certifications belonging to this profile's user_id
          this.dataSource.query('SELECT * FROM public.certifications WHERE user_id = $1', [profile.user_id]),
          
          // Get education linked specifically via "cvCvId" as shown in your dump
          this.dataSource.query('SELECT * FROM public.education WHERE "cvCvId" = $1', [profile.cv_id]),
          
          // Get projects belonging to this user_id
          this.dataSource.query('SELECT * FROM public.projects WHERE user_id = $1', [profile.user_id]),
          
          // Get experiences belonging to this user_id (using public.experiences)
          this.dataSource.query('SELECT * FROM public.experiences WHERE user_id = $1', [profile.user_id]),
        ]);

        profile.certifications = certs;
        profile.education = edus;
        profile.projects = projs;
        profile.experiences = exps;
      }
      return profiles;
    } catch (err) {
      console.error('Erreur SQL extraction profils:', err.message);
      return [];
    }
  }

  /**
   * Fetches unique candidate names directly from the master users directory
   */
  async getAllNames(): Promise<string[]> {
    try {
      const result = await this.dataSource.query(
        'SELECT DISTINCT full_name FROM public.users WHERE full_name IS NOT NULL'
      );
      return result.map(r => r.full_name);
    } catch (err) {
      console.error('Erreur SQL lors de la récupération des noms:', err.message);
      return [];
    }
  }
}