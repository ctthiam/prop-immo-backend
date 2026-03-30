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
import { TenantService, CreateTenantDto, UpdateTenantDto } from './tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  create(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser() user: any,
  ) {
    return this.tenantService.create(createTenantDto, user.agencyId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findAll(@CurrentUser() user: any) {
    return this.tenantService.findAll(user.agencyId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tenantService.findOne(id, user.agencyId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser() user: any,
  ) {
    return this.tenantService.update(id, updateTenantDto, user.agencyId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tenantService.remove(id, user.agencyId);
  }
}