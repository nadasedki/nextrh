import { Injectable } from '@nestjs/common';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Education } from './entities/education.entity';
import { Repository } from 'typeorm';
import { Cv } from 'src/cvs/entities/cv.entity';

@Injectable()
export class EducationService {
 constructor(
    @InjectRepository(Education)
    private readonly educationRepository: Repository<Education>,
  ) {}
//a supprimer
  async create(data: Partial<Education>) {
    const education = this.educationRepository.create(data);
    return this.educationRepository.save(education);
  }
  //

  private extractYearsFromPeriod(period: string): { startYear: number | null; endYear: number | null } {
    if (!period) return { startYear: null, endYear: null };

    const years = period.match(/\d{4}/g);
    if (!years) return { startYear: null, endYear: null };

    if (years.length === 1) {
      return { startYear: null, endYear: parseInt(years[0]) };
    }

    return {
      startYear: parseInt(years[0]),
      endYear: parseInt(years[1]),
    };
  }

  async createParsedEducation(educationData: any[], userId: number, cvEntity: Cv) {
    if (!educationData || educationData.length === 0) return [];

    // Map the JSON objects into TypeORM entities
    const educationEntities = educationData.map((edu) => {
      const { startYear, endYear } = this.extractYearsFromPeriod(edu.year);

      return this.educationRepository.create({
        user_id: userId,
        institution: edu.institution || 'Inconnu',
        degree: edu.degree || 'Diplôme non spécifié',
        field_of_study: null,
        start_year: startYear,
        end_year: endYear,
        cv: cvEntity,
      });
    });

    // Save all at once (more efficient than saving one-by-one in a loop)
    return await this.educationRepository.save(educationEntities);
  }
}
