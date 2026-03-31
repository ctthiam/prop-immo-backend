import { Module } from '@nestjs/common';
import { RentPaymentService } from './rent-payment.service';
import { RentPaymentController } from './rent-payment.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [RentPaymentController],
  providers: [RentPaymentService],
  exports: [RentPaymentService],
})
export class RentPaymentModule {}