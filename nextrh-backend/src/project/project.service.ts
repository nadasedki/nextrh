import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity'; // Adjust path
import { CreateProjectDto } from './dto/create-project.dto'; // Adjust path
import { Cv } from 'src/cvs/entities/cv.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}
// project.service.ts

async create(userId: number, createDto: CreateProjectDto): Promise<any> {
  // 1. On sépare les champs du DTO qui ne correspondent pas à l'entité SQL
  const { startDate, endDate, ...otherData } = createDto;

  // 2. On crée l'entité en passant uniquement les champs connus
  const newProject = this.projectRepository.create({
    ...otherData, // Contient name, client, role, description, technologies
    user_id: userId,
    // On mappe manuellement vers les colonnes de la DB (snake_case)
    start_date: startDate ? new Date(startDate) : null,
    end_date: endDate ? new Date(endDate) : null,
  });

  // 3. Sauvegarde dans la base de données
  const savedProject = await this.projectRepository.save(newProject);

  // 4. IMPORTANT : On retourne l'objet mappé en camelCase pour que 
  // le frontend (React) puisse l'afficher sans refresh
  return {
    ...savedProject,
    startDate: savedProject.start_date, // On rajoute les clés attendues par le front
    endDate: savedProject.end_date,
  };
}

  async findByUser(userId: number) {
    const projects = await this.projectRepository.find({
      where: { user_id: userId },
      order: { start_date: 'DESC' },
    });

    // Map database entity names to frontend camelCase expectations
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      client: p.client,
      role: p.role,
      description: p.description,
      startDate: p.start_date, // Map snake_case to camelCase
      endDate: p.end_date,     // Map snake_case to camelCase
      technologies: p.technologies || [],
    }));
  }


  //
  
  /**
   * Bulk creation from the Parser JSON output
   */
  async createBulkFromParsedData(projectsData: any[], userId: number, cvEntity?: Cv) {
    if (!projectsData || projectsData.length === 0) return [];

    const entities = projectsData.map((proj) => {
      const { startDate, endDate } = this.mapYearToDates(proj.year);

      return this.projectRepository.create({
        user_id: userId,
        // Since 'name' is required in your entity, we use the client name
        name: proj.client || 'Projet Technique', 
        client: proj.client,
        description: proj.description,
        start_date: startDate,
        end_date: endDate,
        role: proj.role || '', // Default value
        technologies: proj.technologies || [], // Default empty array
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

}
