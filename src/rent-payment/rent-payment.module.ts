import { Module } from '@nestjs/common';
import { RentPaymentService } from './rent-payment.service';
import { RentPaymentController } from './rent-payment.controller';

@Module({
  controllers: [RentPaymentController],
  providers: [RentPaymentService],
  exports: [RentPaymentService],
})
export class RentPaymentModule {}