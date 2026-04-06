import { Test, TestingModule } from '@nestjs/testing';
import { CvParsingService } from './cv-parsing.service';

describe('CvParsingService', () => {
  let service: CvParsingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CvParsingService],
    }).compile();

    service = module.get<CvParsingService>(CvParsingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
