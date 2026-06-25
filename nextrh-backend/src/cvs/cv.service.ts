import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cv } from './entities/cv.entity';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
@Injectable()
export class CvService {
  constructor(
    @InjectRepository(Cv)
    private cvRepository: Repository<Cv>,
   @InjectDataSource() private dataSource: DataSource
    
  ) {}

  async saveIdentityCv(userId: number, filePath: string, cvJson: any): Promise<Cv> {
    const cv = this.cvRepository.create({
      user_id: userId,
      file_path: filePath,
      format: 'pdf',
      generated: true,
      full_name: cvJson.profile?.name,
      profession: cvJson.profile?.profession,
      email: cvJson.profile?.email,
      phone: cvJson.profile?.phone,
      fax: cvJson.profile?.fax,
      address: cvJson.profile?.address,
      skills: cvJson.profile.skills || [],
    });

    return await this.cvRepository.save(cv);
  }

  // fct pour generation de cv 
async getFullCvData(cvId: number) {
  const [cv] = await this.dataSource.query('SELECT * FROM cvs WHERE cv_id = $1', [cvId]);
  if (!cv) throw new NotFoundException('CV non trouvé');

  const [certs, edus, projs, exps] = await Promise.all([
    // Table certifications : cert_name, provider, issue_date, expiry_date
    this.dataSource.query('SELECT cert_name, provider, issue_date, expiry_date FROM certifications WHERE "cvCvId"=$1 ORDER BY issue_date DESC', [cvId]),
    
    // Table education (en supposant le même schéma)
    this.dataSource.query('SELECT degree, institution,  start_year, end_year FROM education WHERE "cvCvId"=$1 ', [cvId]),
    
    // Table projects : name, client, role, description, start_date, end_date
    this.dataSource.query('SELECT name, client, role, description, end_date,start_date FROM projects WHERE "cvCvId"=$1 ORDER BY end_date DESC', [cvId]),
    
    // Table experiences : company, role, start_date, end_date, description
    this.dataSource.query('SELECT company, role, start_date, end_date, description FROM experiences WHERE "cvCvId"=$1 ORDER BY end_date DESC', [cvId]),
  ]);
  // 3. LOGIQUE DE TRAITEMENT DES SKILLS (Format simple-array)
 // 2. LOGIQUE DIRECTE POUR LES SKILLS
  let skillsArray = [];
  if (cv.skills) {
    // On force la conversion en String pour être sûr, puis on split par la virgule
    skillsArray = String(cv.skills)
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // LOG DE VÉRIFICATION (SANS GUILLEMETS)
  //console.log("--- TEST REUSSITE ---");
  //console.log("Contenu base de données:", cv.skills);
  //console.log("Tableau envoyé au PDF:", skillsArray);

  return {
    ...cv,
    phone: cv.phone || '',       
    address: cv.address || '',
    certifications: certs,
    education: edus,
    projects: projs.map(p => ({ ...p, year: p.end_date ? new Date(p.end_date).getFullYear() : '' })),
    experiences: exps.map(exp => ({
  ...exp,
  start_date: exp.start_date
    ? format(new Date(exp.start_date), 'MMMM yyyy', { locale: fr })
    : 'Présent',
  end_date: exp.end_date
    ? format(new Date(exp.end_date), 'MMMM yyyy', { locale: fr })
    : 'Présent',
})),
    skills: skillsArray, 
    
  };
}
}
