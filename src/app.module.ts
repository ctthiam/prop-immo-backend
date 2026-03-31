import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AgencyModule } from './agency/agency.module';
import { OwnerModule } from './owner/owner.module';
import { TenantModule } from './tenant/tenant.module';
import { PropertyModule } from './property/property.module';
import { ContractModule } from './contract/contract.module';
import { RentPaymentModule } from './rent-payment/rent-payment.module';
import { PdfModule } from './pdf/pdf.module';
import { StatementModule } from './statement/statement.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AgencyModule, OwnerModule, TenantModule, PropertyModule, ContractModule, RentPaymentModule, PdfModule, StatementModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
