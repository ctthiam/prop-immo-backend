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
import { OwnerService, CreateOwnerDto, UpdateOwnerDto } from './owner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('owners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OwnerController {
  constructor(private ownerService: OwnerService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  create(
    @Body() createOwnerDto: CreateOwnerDto,
    @CurrentUser() user: any,
  ) {
    return this.ownerService.create(createOwnerDto, user.agencyId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findAll(@CurrentUser() user: any) {
    return this.ownerService.findAll(user.agencyId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ownerService.findOne(id, user.agencyId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  update(
    @Param('id') id: string,
    @Body() updateOwnerDto: UpdateOwnerDto,
    @CurrentUser() user: any,
  ) {
    return this.ownerService.update(id, updateOwnerDto, user.agencyId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ownerService.remove(id, user.agencyId);
  }
  @Post(':id/portal-access')
@Roles(Role.ADMIN)
createPortalAccess(@Param('id') id: string, @CurrentUser() user: any) {
  return this.ownerService.createPortalAccess(id, user.agencyId, (this.ownerService as any).prisma);
}

@Get('portal/dashboard')
@Roles(Role.PROPRIETAIRE)
getPortalDashboard(@CurrentUser() user: any) {
  return this.ownerService.getPortalDashboard(user.id, user.agencyId);
}
}