import { Test, TestingModule } from '@nestjs/testing';
import { CvParsingController } from './cv-parsing.controller';

describe('CvParsingController', () => {
  let controller: CvParsingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CvParsingController],
    }).compile();

    controller = module.get<CvParsingController>(CvParsingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
