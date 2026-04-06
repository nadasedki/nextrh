import { Injectable } from '@nestjs/common';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from './entities/experience.entity';
import { Cv } from 'src/cvs/entities/cv.entity';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectRepository(Experience)
    private readonly experienceRepo: Repository<Experience>,
  ) {}

  /**
   * Bulk creation from the Parser JSON output
   */
  async createBulkFromParsedData(expData: any[], userId: number, cvEntity?: Cv) {
    if (!expData || expData.length === 0) return [];

    const entities = expData.map((exp) => {
      const { startDate, endDate } = this.parsePeriod(exp.period);

      return this.experienceRepo.create({
        user_id: userId,
        company: exp.company || 'Entreprise non spécifiée',
        role: exp.role || 'Poste non spécifié',
        start_date: startDate,
        end_date: endDate,
        description: exp.role, // Using role as description as well
        cv: cvEntity, 
      });
    });

    return await this.experienceRepo.save(entities);
  }

  /**
   * Converts "Août 2015- Décembre 2019" or "Depuis Janvier 2020" to Date objects
   */
  private parsePeriod(period: string): { startDate: Date | null; endDate: Date | null } {
    if (!period) return { startDate: null, endDate: null };

    const months: Record<string, number> = {
      janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
      juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
    };

    const periodLower = period.toLowerCase();
    const years = period.match(/\d{4}/g);
    
    if (!years) return { startDate: null, endDate: null };

    // Find months mentioned in the string
    const foundMonths = periodLower.match(new RegExp(Object.keys(months).join('|'), 'g')) || [];

    const startDate = new Date(
      parseInt(years[0]), 
      foundMonths[0] ? months[foundMonths[0]] : 0, 
      1
    );

    let endDate: Date | null = null;
    
    // If it's a range (has two years)
    if (years.length >= 2) {
      endDate = new Date(
        parseInt(years[1]), 
        foundMonths[1] ? months[foundMonths[1]] : 11, 
        1
      );
    } 
    // If it's "Depuis", endDate remains null

    return { startDate, endDate };
  }

// experience.service.ts

// experience.service.ts

async create(data: any) {
  // 1. Extraction des dates pour le mapping
  const { startDate, endDate, ...rest } = data;

  // 2. Création de l'objet (TypeORM crée une instance unique ici)
  const newExp = this.experienceRepo.create({
    ...rest,
    start_date: startDate ? new Date(startDate) : null,
    end_date: endDate ? new Date(endDate) : null,
  });

  // 3. Sauvegarde (On force le type de retour à 'Experience' pour éviter l'erreur de tableau)
  const saved = await this.experienceRepo.save(newExp) as unknown as Experience;

  // 4. Retour des données au format attendu par le Frontend
  return {
    id: saved.id,
    company: saved.company,
    role: saved.role,
    description: saved.description,
    startDate: saved.start_date, // Mapping snake_case -> camelCase
    endDate: saved.end_date,
  };
}

  async findByUser(userId: number) {
    const exps = await this.experienceRepo.find({
      where: { user_id: userId },
      order: { start_date: 'DESC' },
    });

    return exps.map(e => ({
      id: e.id,
      company: e.company,
      role: e.role,
      description: e.description,
      startDate: e.start_date,
      endDate: e.end_date,
    }));
}
}