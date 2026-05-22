import { Test, TestingModule } from '@nestjs/testing';
import { CvGeneratorService } from './cv-generator.service';

describe('CvGeneratorService', () => {
  let service: CvGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CvGeneratorService],
    }).compile();

    service = module.get<CvGeneratorService>(CvGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
