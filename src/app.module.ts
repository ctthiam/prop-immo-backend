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
import { ProviderModule } from './provider/provider.module';
import { WorkOrderModule } from './work-order/work-order.module';
import { MessagingModule } from './messaging/messaging.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AgencyModule, OwnerModule, TenantModule, PropertyModule, ContractModule, RentPaymentModule, PdfModule, StatementModule, ProviderModule, WorkOrderModule, MessagingModule, TeamModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
