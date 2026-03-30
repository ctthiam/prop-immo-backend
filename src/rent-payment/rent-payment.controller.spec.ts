import { Test, TestingModule } from '@nestjs/testing';
import { RentPaymentController } from './rent-payment.controller';

describe('RentPaymentController', () => {
  let controller: RentPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RentPaymentController],
    }).compile();

    controller = module.get<RentPaymentController>(RentPaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
