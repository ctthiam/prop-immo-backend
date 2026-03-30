import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RentPaymentService, CreateRentPaymentDto, RecordPaymentDto } from './rent-payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('rent-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentPaymentController {
  constructor(private rentPaymentService: RentPaymentService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  create(
    @Body() createDto: CreateRentPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.rentPaymentService.create(createDto, user.agencyId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findAll(@CurrentUser() user: any) {
    return this.rentPaymentService.findAll(user.agencyId);
  }

  @Get('pending')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findPending(@CurrentUser() user: any) {
    return this.rentPaymentService.findPending(user.agencyId);
  }

  @Get('contract/:contractId')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findByContract(
    @Param('contractId') contractId: string,
    @CurrentUser() user: any,
  ) {
    return this.rentPaymentService.findByContract(contractId, user.agencyId);
  }

  @Put(':id/pay')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  recordPayment(
    @Param('id') id: string,
    @Body() recordDto: RecordPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.rentPaymentService.recordPayment(id, recordDto, user.agencyId);
  }

  @Put('mark-late')
  @Roles(Role.ADMIN, Role.COMPTABLE)
  markLate(@CurrentUser() user: any) {
    return this.rentPaymentService.markLate(user.agencyId);
  }
}