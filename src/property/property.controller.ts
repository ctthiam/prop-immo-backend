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
import { PropertyService, CreatePropertyDto, UpdatePropertyDto } from './property.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertyController {
  constructor(private propertyService: PropertyService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertyService.create(createPropertyDto, user.agencyId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findAll(@CurrentUser() user: any) {
    return this.propertyService.findAll(user.agencyId);
  }

  @Get('owner/:ownerId')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findByOwner(
    @Param('ownerId') ownerId: string,
    @CurrentUser() user: any,
  ) {
    return this.propertyService.findByOwner(ownerId, user.agencyId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.propertyService.findOne(id, user.agencyId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertyService.update(id, updatePropertyDto, user.agencyId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  archive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.propertyService.archive(id, user.agencyId);
  }
}