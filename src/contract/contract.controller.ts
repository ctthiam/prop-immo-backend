import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ContractService, CreateContractDto, UpdateContractDto } from './contract.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  create(
    @Body() createContractDto: CreateContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractService.create(createContractDto, user.agencyId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findAll(@CurrentUser() user: any) {
    return this.contractService.findAll(user.agencyId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contractService.findOne(id, user.agencyId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractService.update(id, updateContractDto, user.agencyId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  terminate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contractService.terminate(id, user.agencyId);
  }

  @Get(':id/pdf')
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  generatePdf(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contractService.generateContractPdf(id, user.agencyId);
  }

}