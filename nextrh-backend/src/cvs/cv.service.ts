import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cv } from './entities/cv.entity';

@Injectable()
export class CvService {
  constructor(
    @InjectRepository(Cv)
    private cvRepository: Repository<Cv>,
  ) {}

  async saveIdentityCv(userId: number, filePath: string, cvJson: any): Promise<Cv> {
    const cv = this.cvRepository.create({
      user_id: userId,
      file_path: filePath,
      format: 'pdf',
      generated: true,
      full_name: cvJson.contact?.name,
      profession: cvJson.contact?.profession,
      email: cvJson.contact?.email,
      phone: cvJson.contact?.phone,
      fax: cvJson.contact?.fax,
      address: cvJson.contact?.address,
    });

    return await this.cvRepository.save(cv);
  }

}