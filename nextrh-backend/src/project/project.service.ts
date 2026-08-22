import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity'; 
import { CreateProjectDto } from './dto/create-project.dto'; 
import { Cv } from 'src/cvs/entities/cv.entity';
import { NotFoundException } from '@nestjs/common';
import { ScoringService } from 'src/scoring/scoring.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; 
@Injectable()
export class ProjectService {
 
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readonly scoringService: ScoringService,
    private readonly eventEmitter: EventEmitter2, 
 
  ) {}


async create(userId: number, createDto: CreateProjectDto): Promise<any> {
  const { startDate, endDate, ...otherData } = createDto;

   const newProject = this.projectRepository.create({
    ...otherData, 
    user_id: userId,
    start_date: startDate ? new Date(startDate) : null,
    end_date: endDate ? new Date(endDate) : null,
  });

    const savedProject = await this.projectRepository.save(newProject);

   await this.scoringService.calculateAndSaveScore(userId);

    this.eventEmitter.emit('project.saved', {
      entityId: savedProject.id,
      userId,
    });

  return {
    ...savedProject,
    startDate: savedProject.start_date, 
    endDate: savedProject.end_date,
  };
}

  async findByUser(userId: number) {
    const projects = await this.projectRepository.find({
      where: { user_id: userId },
      order: { start_date: 'DESC' },
    });


    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      client: p.client,
      role: p.role,
      description: p.description,
      startDate: p.start_date, 
      endDate: p.end_date,     
      technologies: p.technologies || [],
    }));
  }


 
  async createBulkFromParsedData(projectsData: any[], userId: number, cvEntity?: Cv) {
    if (!projectsData || projectsData.length === 0) return [];

    const entities = projectsData.map((proj) => {
      const { startDate, endDate } = this.mapYearToDates(proj.year);

      return this.projectRepository.create({
        user_id: userId,
        name: proj.client || 'Projet Technique', 
        client: proj.client,
        description: proj.description,
        start_date: startDate,
        end_date: endDate,
        role: proj.role || '', 
        technologies: proj.technologies || [], 
        cv: cvEntity, 
      });
    });

    return await this.projectRepository.save(entities);
  }

  /**
   * Helper: Converts "2020" or "2019-2021" to Date objects
   */
  private mapYearToDates(yearStr: string): { startDate: Date | null; endDate: Date | null } {
    if (!yearStr || yearStr.includes('Non spécifiée')) {
      return { startDate: null, endDate: null };
    }

    const years = yearStr.match(/\d{4}/g);
    
    if (!years) return { startDate: null, endDate: null };

    if (years.length === 1) {
      // If only one year (e.g., "2020"), set it as the end date
      return { 
        startDate: null, 
        endDate: new Date(parseInt(years[0]), 11, 31) // Dec 31st of that year
      };
    }

    // If a range (e.g., "2019 - 2021")
    return {
      startDate: new Date(parseInt(years[0]), 0, 1),  // Jan 1st
      endDate: new Date(parseInt(years[1]), 11, 31), // Dec 31st
    };
  }


  async update(id: number, userId: number, updateDto: any): Promise<any> {
  const project = await this.projectRepository.findOne({
    where: { id, user_id: userId },
  });

  if (!project) {
    throw new NotFoundException('Project not found or unauthorized');
  }

  const { startDate, endDate, ...otherData } = updateDto;

  Object.assign(project, otherData);
  if (startDate) project.start_date = new Date(startDate);
  if (endDate) project.end_date = new Date(endDate);

   const saved = await this.projectRepository.save(project);

   this.eventEmitter.emit('project.saved', {
      entityId: id,
      userId,
    });

  return {
    ...saved,
    startDate: saved.start_date,
    endDate: saved.end_date,
  };
}

async remove(id: number, userId: number) {
  const project = await this.projectRepository.findOne({
    where: { id, user_id: userId },
  });

  if (!project) {
    throw new NotFoundException('Project not found or unauthorized');
  }

  await this.projectRepository.remove(project);
  
  await this.scoringService.calculateAndSaveScore(userId);
  
  this.eventEmitter.emit('project.deleted', {
      entityId: id,
      userId,
    });
}
}
