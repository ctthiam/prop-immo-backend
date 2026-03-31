import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MessagingService, SendMessageDto } from './messaging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE, Role.PROPRIETAIRE, Role.LOCATAIRE)
  sendMessage(@Body() sendMessageDto: SendMessageDto, @CurrentUser() user: any) {
    return this.messagingService.sendMessage(sendMessageDto, user.id, user.agencyId);
  }

  @Get('inbox')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE, Role.PROPRIETAIRE, Role.LOCATAIRE)
  getInbox(@CurrentUser() user: any) {
    return this.messagingService.getInbox(user.id, user.agencyId);
  }

  @Get('contacts')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE, Role.PROPRIETAIRE, Role.LOCATAIRE)
  getContacts(@CurrentUser() user: any) {
    return this.messagingService.getAgencyContacts(user.agencyId);
  }

  @Get('unread')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE, Role.PROPRIETAIRE, Role.LOCATAIRE)
  getUnreadCount(@CurrentUser() user: any) {
    return this.messagingService.getUnreadCount(user.id, user.agencyId);
  }

  @Get('conversation/:userId')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE, Role.PROPRIETAIRE, Role.LOCATAIRE)
  getConversation(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.messagingService.getConversation(user.id, userId, user.agencyId);
  }

  @Put('read')
  @Roles(Role.ADMIN, Role.SECRETAIRE, Role.COMPTABLE, Role.PROPRIETAIRE, Role.LOCATAIRE)
  markAsRead(@Body() body: { messageIds: string[] }, @CurrentUser() user: any) {
    return this.messagingService.markAsRead(body.messageIds, user.id);
  }
}