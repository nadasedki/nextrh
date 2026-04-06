import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';

// Entities
import { User } from '../users/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Training } from '../training/entities/training.entity';
import { Certification } from '../certifications/entities/certification.entity';
import { Cv } from '../cvs/entities/cv.entity';
import { UserSkill } from 'src/skill/entities/user-skill.entity';
import { Team } from 'src/users/entities/team.entity';

@Injectable()
export class EmployeesService {
  constructor(
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
    @InjectRepository(UserSkill)
    private userSkillRepository: Repository<UserSkill>,
    
    
    @InjectRepository(Certification) private certRepository: Repository<Certification>,
    @InjectRepository(Team) private teamRepository: Repository<Team>,
  ) {}

  async getDashboardData(userId: number) {
    // 1. Fetch user profile data
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
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

    // 3. Format and combine data for the frontend
    return {
      title: user.title || 'No Title', // From updated DB column
      yearsOfExperience: user.years_of_experience || 0, // From updated DB column
      
      certifications: certifications.map(c => ({
        id: c.certId,
        name: c.certName,
        issuer: c.provider,
        status: c.status // Assuming DB has 'active', 'expiring_soon', 'expired'
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
    // 1. Fetch User with relations (if defined in entity)
    const user = await this.userRepository.findOne({ 
        where: { user_id: userId },
        relations: ['teams'] // Assuming User has team relationship
    });

    if (!user) throw new NotFoundException('User not found');

    // 2. Fetch all related data in parallel
    const [projects, trainings, certifications, userSkills] = await Promise.all([
      this.projectRepository.find({ where: { user_id: userId } }),
      this.trainingRepository.find({ where: { user_id: userId } }),
      this.certificationRepository.find({ where: { userId: userId } }),
      // Fetch skills and join with skills table to get names
      this.userSkillRepository.find({ 
        where: { user_id: userId },
        relations: ['skill'] // Assumes UserSkill entity has @ManyToOne to Skill
      }),
    ]);

    // 3. Assemble and Format for Frontend
    return {
      name: user.full_name,
      title: user.title,
      email: user.email,
      department: user.department || 'N/A',
      summary: user.summary || '', // You might need to add this column to users table
      
      skills: userSkills.map(us => us.skill.skill_name),
      
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role, // Add column to projects table
        client: p.client, // Add column to projects table
        startDate: p.start_date,
        endDate: p.end_date,
        description: p.description,
        technologies: p.technologies || [] // PostgreSQL text[] array
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
        provider: t.provider, // Add column to training_sessions table
        completionDate: t.completion_date,
        duration: t.duration // Add column to training_sessions table
      })),
      
      education: [], // Map from an education table if you have one
    };
  }
  async findAllEmployees() {
    return this.userRepository.find({
        // Include skills and certifications in the response
        relations: ['userSkills', 'userSkills.skill', 'certifications'],
        where: { active: true } // Assuming you have an active flag
    });
  }
  async searchEmployees(query: string) {
    // Basic search functionality (can be made more robust with SQL queries)
    return this.userRepository.find({
      where: [
        { full_name: Like(`%${query}%`) },
        { title: Like(`%${query}%`) },
        // Searching through relations is harder with TypeORM .find(), 
        // you might need QueryBuilder here for better performance
      ],
      relations: ['userSkills', 'userSkills.skill', 'certifications'],
    });
  }
  async findOne(id: number) {
  const user = await this.userRepository.findOne({
    where: { user_id: id },
    relations: [
      'userSkills', 
      'userSkills.skill', 
      'certifications',
      'trainings',  
      'projects'    
    ],
  });

  if (!user) {
    throw new NotFoundException(`Member not found`);
  }
  return user;
}
async calculateDashboardStats() {
    // 1. Total Employees
    const totalEmployees = await this.userRepository.count({ where: { active: true } });

    // 2. Total Certifications
    const totalCertifications = await this.certRepository.count();

    // 3. Expiring This Month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const expiringThisMonth = await this.certRepository.count({
      where: {
        expiryDate: Between(now, endOfMonth),
      },
    });

    // 4. Total Teams
    const totalTeams = await this.teamRepository.count();

    // 5. Certification Status Breakdown
    const certs = await this.certRepository.find();
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
