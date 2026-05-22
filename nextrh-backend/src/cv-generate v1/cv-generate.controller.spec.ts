import { Test, TestingModule } from '@nestjs/testing';
import { CvGenerateController } from './cv-generate.controller';

describe('CvGenerateController', () => {
  let controller: CvGenerateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CvGenerateController],
    }).compile();

    controller = module.get<CvGenerateController>(CvGenerateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
