import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from 'src/project/entities/project.entity';
import { Training } from 'src/training/entities/training.entity';
import { Certification } from 'src/certifications/entities/certification.entity';

@Injectable()
export class ScoringService {
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
    @InjectRepository(Certification)
    private readonly certificationRepository: Repository<Certification>,
 
  ) {}


  // Optimisation suggérée dans scoring.service.ts
async calculateAndSaveScore(userId: number): Promise<number> {
  // On compte directement en SQL sans charger les données
  const [certCount, projectCount, trainingCount] = await Promise.all([
    this.certificationRepository.count({ where: { userId: userId } }),
    this.projectRepository.count({ where: { user_id: userId } }),
    this.trainingRepository.count({ where: { user_id: userId } }),
  ]);

  const totalScore = (certCount * 10) + (projectCount * 20) + (trainingCount * 30);

  await this.userRepository.update(userId, { score: totalScore });
  return totalScore;
}

  async getUserScore(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    return user ? user.score : 0;
  }

 
  async getLeaderboard() {
    return await this.userRepository.find({
      select: ['user_id', 'full_name', 'score', 'title'],
      order: { score: 'DESC' }, // Le plus haut score en premier
    });
  }
}


  
/*  async calculateAndSaveScore(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['certifications', 'projects', 'trainings'],
    });

    if (!user) return 0;

    const pointsCertifs = (user.certifications?.length || 0) * 10;
    const pointsProjets = (user.projects?.length || 0) * 20;
    const pointsFormations = (user.trainings?.length || 0) * 30;

    const totalScore = pointsCertifs + pointsProjets + pointsFormations;

   
    await this.userRepository.update(userId, { score: totalScore });

    return totalScore;
  }
*/