import { Test, TestingModule } from '@nestjs/testing';
import { CvGeneratorController } from './cv-generator.controller';

describe('CvGeneratorController', () => {
  let controller: CvGeneratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CvGeneratorController],
    }).compile();

    controller = module.get<CvGeneratorController>(CvGeneratorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
