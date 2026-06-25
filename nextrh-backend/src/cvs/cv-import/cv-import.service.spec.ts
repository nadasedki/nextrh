import { Test, TestingModule } from '@nestjs/testing';
import { CvImportService } from './cv-import.service';

describe('CvImportService', () => {
  let service: CvImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CvImportService],
    }).compile();

    service = module.get<CvImportService>(CvImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
