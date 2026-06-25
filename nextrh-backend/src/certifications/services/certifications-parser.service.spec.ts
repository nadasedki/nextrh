import { Test, TestingModule } from '@nestjs/testing';
import { CertificationsParserService } from './certifications-parser.service';

describe('CertificationsParserService', () => {
  let service: CertificationsParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CertificationsParserService],
    }).compile();

    service = module.get<CertificationsParserService>(CertificationsParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
