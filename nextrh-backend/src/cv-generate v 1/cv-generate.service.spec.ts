import { Test, TestingModule } from '@nestjs/testing';
import { CvGenerateService } from './cv-generate.service';

describe('CvGenerateService', () => {
  let service: CvGenerateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CvGenerateService],
    }).compile();

    service = module.get<CvGenerateService>(CvGenerateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
