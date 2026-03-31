import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TeamService, CreateTeamMemberDto, UpdateTeamMemberDto } from './team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createDto: CreateTeamMemberDto, @CurrentUser() user: any) {
    return this.teamService.create(createDto, user.agencyId);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() user: any) {
    return this.teamService.findAll(user.agencyId);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teamService.findOne(id, user.agencyId);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTeamMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.teamService.update(id, updateDto, user.agencyId);
  }

  @Put(':id/reset-password')
  @Roles(Role.ADMIN)
  resetPassword(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teamService.resetPassword(id, user.agencyId);
  }

  @Put(':id/toggle-active')
  @Roles(Role.ADMIN)
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teamService.toggleActive(id, user.agencyId);
  }
}