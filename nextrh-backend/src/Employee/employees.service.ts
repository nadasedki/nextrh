import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Like, Repository } from 'typeorm';

// Entities
import { User } from '../users/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Training } from '../training/entities/training.entity';
import { Certification } from '../certifications/entities/certification.entity';
import { Cv } from '../cvs/entities/cv.entity';

import { Team } from 'src/teams/entities/team.entity';
import { Education } from 'src/education/entities/education.entity';
import { Experience } from 'src/experience/entities/experience.entity';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Training)
    private trainingRepository: Repository<Training>,
    @InjectRepository(Certification)
    private certificationRepository: Repository<Certification>,
    @InjectRepository(Cv)
    private cvRepository: Repository<Cv>,

     @InjectRepository(Education)
    private educationRepository: Repository<Education>,
     @InjectRepository(Experience)
    private experienceRepository: Repository<Experience>,
    
    @InjectRepository(Certification) private certRepository: Repository<Certification>,
    @InjectRepository(Team) private teamRepository: Repository<Team>,
  ) {}

  async getDashboardData(userId: number) {
    // 1. Fetch user profile data
    const user = await this.userRepository.findOne({ where: { user_id: userId, 
      active: true } }); 
    if (!user) {
      throw new NotFoundException('User not found');
    }

// 2. Fetch data from all sources in parallel
const [projects, trainings, certifications, latestCv] = await Promise.all([
  this.projectRepository.find({ where: { user_id: userId } }),
  this.trainingRepository.find({ where: { user_id: userId } }),
  this.certificationRepository.find({ where: { userId: userId } }),
  this.cvRepository.findOne({ 
    where: { user_id: userId },
    order: { last_updated: 'DESC' }
  }),
]);


return {
  title: user.title || 'No Title', 
  yearsOfExperience: user.years_of_experience || 0, 
  certifications: certifications.map(c => ({
    id: c.certId,
    name: c.certName,
    issuer: c.provider,
    status: c.status 
  })),
  
  trainings: trainings.map(t => ({ 
    id: t.training_id, 
    name: t.training_name 
  })),
  
  projects: projects.map(p => ({ 
    id: p.id, 
    name: p.name 
  })),
  
  cvLastUpdated: latestCv ? latestCv.last_updated.toISOString().split('T')[0] : 'Never'
};
  }
  //


  async getFullEmployeeCv(userId: number) {
  
   const user = await this.userRepository.findOne({ 
    where: { user_id: userId, active: true }, 
    relations: ['teams']
});

    if (!user) throw new NotFoundException('User not found');

    const [experiences,projects, trainings, certifications,education,latestCv] = await Promise.all([
      this.experienceRepository.find({ where: { user_id: userId } }),
      this.projectRepository.find({ where: { user_id: userId } }),
      this.trainingRepository.find({ where: { user_id: userId } }),
      this.certificationRepository.find({ where: { userId: userId } }),
      this.educationRepository.find({ where: { user_id: userId } }),
      this.cvRepository.findOne({
        where: { user_id: userId },
        order: { last_updated: 'DESC' }
      }),
      
    ]);

    let skillsList = [];
    if (latestCv?.skills) {
      skillsList = Array.isArray(latestCv.skills) 
        ? latestCv.skills 
        : String(latestCv.skills).split(',').map(s => s.trim());
    }
 
   
    return {
          
    id: latestCv?.cv_id,     
    filePath: latestCv?.file_path, 
      name: latestCv?.full_name ,
      profession: latestCv?.profession || user.title || 'N/A',
      email: latestCv?.email || user.email,
      phone: latestCv?.phone || 'N/A',
      fax: latestCv?.fax || 'N/A',
      address: latestCv?.address || 'N/A',
      skills: skillsList, 
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        client: p.client, 
        startDate: p.start_date,
        endDate: p.end_date,
        description: p.description,
       })),
       experiences: experiences.map(e => ({
        id: e.id,
        company: e.company,
        startDate: e.start_date,
        endDate: e.end_date,
        description: e.description,
       })),
      certifications: certifications.map(c => ({
        id: c.certId,
        name: c.certName,
        issuer: c.provider,
        expirationDate: c.expiryDate,
        status: c.status
      })),
      
      trainings: trainings.map(t => ({
        id: t.training_id,
        name: t.training_name,
        provider: t.provider, 
        completionDate: t.completion_date,
        duration: t.duration 
      })),
      
       education: education.map(edu => ({
        id: edu.education_id,
        degree: edu.degree,
        field: edu.field_of_study,
        institution: edu.institution,
        graduationYear: edu.end_year, 
        startYear: edu.start_year
      }))
    };
  }
  async findAllEmployees() {
    return this.userRepository.find({
           relations: ['certifications'], 
       where: { active: true }, 
        order: { score: 'DESC' } 
    });
  }
  async searchEmployees(query: string) {
    // Basic search functionality (can be made more robust with SQL queries)
    return this.userRepository.find({
      where: [
        { full_name: Like(`%${query}%`), active: true },
        { title: Like(`%${query}%`), active: true },
          ],
      relations: [ 'certifications'],
    });
  }
  async findOne(id: number) {
  const user = await this.userRepository.findOne({
    where: { user_id: id ,active: true},
    relations: [
      'certifications',
      'trainings',  
      'projects'    
    ],
  });

  if (!user) {
    throw new NotFoundException(`Member not found`);
  }
   const latestCv = await this.cvRepository.findOne({
    where: { user_id: id },
    order: { last_updated: 'DESC' },
  });
  return {
    ...user,
    // On injecte les colonnes spécifiques du CV si elles existent
    cv_full_name: latestCv?.full_name ,
    cv_profession: latestCv?.profession || 'N/A',
    cv_phone: latestCv?.phone || 'N/A',
    cv_fax: latestCv?.fax || 'N/A',
    cv_address: latestCv?.address || 'N/A',
    cv_skills: latestCv?.skills || [], 
    cv_email: latestCv?.email || user.email,
    cv_last_updated: latestCv?.last_updated || null,
  };
}
async calculateDashboardStats() {
    // 1. Total Employees
    const totalEmployees = await this.userRepository.count({ where: { active: true } });

    // 2. Total Certifications
   const totalCertifications = await this.certRepository.count({
  where: {
    user: { active: true } // ◄ Filters out inactive users' certs
  }
});
    // 3. Expiring This Month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const expiringThisMonth = await this.certRepository.count({
      where: {
        expiryDate: Between(now, endOfMonth),
         user: { active: true }
      },
    });

    // 4. Total Teams
    const totalTeams = await this.teamRepository.count();

    // 5. Certification Status Breakdown
const certs = await this.certRepository.find({
  where: {
    user: { active: true } 
  }
});
    const certStatus = certs.reduce((acc, cert) => {
      acc[cert.status] = (acc[cert.status] || 0) + 1;
      return acc;
    }, { active: 0, expiringSoon: 0, expired: 0 });

    // 6. Certifications by Provider (Top 6)
    const providerStats = certs.reduce((acc, cert) => {
      acc[cert.provider] = (acc[cert.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const certificationsByProvider = Object.entries(providerStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      totalEmployees,
      totalCertifications,
      expiringThisMonth,
      totalTeams,
      certificationStatus: certStatus,
      certificationsByProvider,
    };
  }

}