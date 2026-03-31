import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WorkOrderService, CreateWorkOrderDto, UpdateWorkOrderDto } from './work-order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrderController {
  constructor(private workOrderService: WorkOrderService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  create(@Body() createWorkOrderDto: CreateWorkOrderDto, @CurrentUser() user: any) {
    return this.workOrderService.create(createWorkOrderDto, user.agencyId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findAll(@CurrentUser() user: any) {
    return this.workOrderService.findAll(user.agencyId);
  }

  @Get('property/:propertyId')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findByProperty(@Param('propertyId') propertyId: string, @CurrentUser() user: any) {
    return this.workOrderService.findByProperty(propertyId, user.agencyId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workOrderService.findOne(id, user.agencyId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  update(@Param('id') id: string, @Body() updateWorkOrderDto: UpdateWorkOrderDto, @CurrentUser() user: any) {
    return this.workOrderService.update(id, updateWorkOrderDto, user.agencyId);
  }

  @Put(':id/assign')
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  assign(
    @Param('id') id: string,
    @Body() body: { providerId: string },
    @CurrentUser() user: any,
  ) {
    return this.workOrderService.assign(id, body.providerId, user.agencyId);
  }

  @Put(':id/complete')
  @Roles(Role.ADMIN, Role.SECRETAIRE)
  complete(
    @Param('id') id: string,
    @Body() body: { cost: number },
    @CurrentUser() user: any,
  ) {
    return this.workOrderService.complete(id, body.cost, user.agencyId);
  }
}