import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StatementService } from './statement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('statements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatementController {
  constructor(private statementService: StatementService) {}

  @Get('owners')
  @Roles(Role.ADMIN, Role.COMPTABLE)
  getOwnerStatements(@CurrentUser() user: any) {
    return this.statementService.getOwnerStatements(user.agencyId);
  }

  @Get('owner/:ownerId/pdf')
  @Roles(Role.ADMIN, Role.COMPTABLE)
  generateOwnerStatement(
    @Param('ownerId') ownerId: string,
    @Query('month') month: string,
    @Query('year') year: string,
    @CurrentUser() user: any,
  ) {
    return this.statementService.generateOwnerStatement(
      ownerId,
      user.agencyId,
      parseInt(month),
      parseInt(year),
    );
  }
}