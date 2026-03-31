import { Test, TestingModule } from '@nestjs/testing';
import { WorkOrderController } from './work-order.controller';

describe('WorkOrderController', () => {
  let controller: WorkOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkOrderController],
    }).compile();

    controller = module.get<WorkOrderController>(WorkOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
