import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CvService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * Get all CVs (basic profile layer)
   */
  async getAllCVs() {
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
        skills
      FROM public.cvs
    `);
  }

  
  async getAllCertifications() {
    return await this.dataSource.query(`
      SELECT * FROM public.certifications
    `);
  }

  /**
   * Education still linked to cv OR user (depending on your DB)
   */
  async getEducationByCvId(cvId: number) {
    return await this.dataSource.query(
      `SELECT * FROM public.education WHERE "cvCvId" = $1`,
      [cvId],
    );
  }

  async getProjectsByCvId(cvId: number) {
    return await this.dataSource.query(
      `SELECT * FROM public.projects WHERE "cvCvId" = $1`,
      [cvId],
    );
  }

  async getExperiencesByCvId(cvId: number) {
    return await this.dataSource.query(
      `SELECT * FROM public.experiences WHERE "cvCvId" = $1`,
      [cvId],
    );
  }


  async getAllUnifiedProfiles() {
    const cvs = await this.getAllCVs();
    const certs = await this.getAllCertifications();

    const profiles = [];

    for (const cv of cvs) {
      const identityKey = (cv.full_name || '').toLowerCase();

      const profileCerts = certs.filter(
        c =>
          (c.certificate_holder || '').toLowerCase() === identityKey,
      );

      const education = await this.getEducationByCvId(cv.cv_id);
      const projects = await this.getProjectsByCvId(cv.cv_id);
      const experiences = await this.getExperiencesByCvId(cv.cv_id);

      profiles.push({
        ...cv,
        identity_key: identityKey,
        certifications: profileCerts,
        education,
        projects,
        experiences,
      });
    }

    return profiles;
  }

  /**
   * Names for retrieval
   */
  async getAllNames(): Promise<string[]> {
    const result = await this.dataSource.query(`
      SELECT DISTINCT full_name FROM public.cvs WHERE full_name IS NOT NULL
    `);

    return result.map(r => r.full_name);
  }
  async getCertificationsByCvId(cvId: number) {
  try {
    const result = await this.dataSource.query(
      `
      SELECT *
      FROM public.certifications
      WHERE "cvCvId" = $1
      `,
      [cvId],
    );

    return result;
  } catch (err) {
    console.error(
      'Erreur SQL certifications by holder:',
      err.message,
    );
    return [];
  }
}
//
// Dans src/cvs/cv.service.ts
async getCertificationWithCvContext(certId: number) {
  const [result] = await this.dataSource.query(`
    SELECT c.*, cv.full_name, cv.profession, cv.cv_id
    FROM certifications c
    JOIN cvs cv ON c."cvCvId" = cv.cv_id
    WHERE c.cert_id = $1
  `, [certId]);
  return result;
}
}