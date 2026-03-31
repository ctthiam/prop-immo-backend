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
import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('agencies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgencyController {
  constructor(private agencyService: AgencyService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createAgencyDto: CreateAgencyDto) {
    return this.agencyService.create(createAgencyDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  findAll() {
    return this.agencyService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.agencyService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateAgencyDto: UpdateAgencyDto) {
    return this.agencyService.update(id, updateAgencyDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.agencyService.remove(id);
  }
  @Get('dashboard/stats')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  getDashboardStats(@CurrentUser() user: any) {
    return this.agencyService.getDashboardStats(user.agencyId);
  }
}