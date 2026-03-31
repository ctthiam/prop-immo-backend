import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class SendMessageDto {
  content: string;
  receiverId: string;
}

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(sendMessageDto: SendMessageDto, senderId: string, agencyId: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: sendMessageDto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Destinataire introuvable');
    }

    return this.prisma.message.create({
      data: {
        content: sendMessageDto.content,
        senderId,
        receiverId: sendMessageDto.receiverId,
        agencyId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async getConversation(userId1: string, userId2: string, agencyId: string) {
    return this.prisma.message.findMany({
      where: {
        agencyId,
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getInbox(userId: string, agencyId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        agencyId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const conversations: Record<string, any> = {};
    messages.forEach((msg) => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          otherUser: msg.senderId === userId ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: 0,
        };
      }
      if (!msg.isRead && msg.receiverId === userId) {
        conversations[otherUserId].unreadCount++;
      }
    });

    return Object.values(conversations);
  }

  async markAsRead(messageIds: string[], userId: string) {
    return this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: userId,
      },
      data: { isRead: true },
    });
  }

  async getAgencyContacts(agencyId: string) {
    return this.prisma.user.findMany({
      where: {
        agencyId,
        isActive: true,
        role: { in: ['ADMIN', 'SECRETAIRE', 'COMPTABLE', 'PROPRIETAIRE', 'LOCATAIRE'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
      },
      orderBy: { role: 'asc' },
    });
  }

  async getUnreadCount(userId: string, agencyId: string) {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        agencyId,
        isRead: false,
      },
    });
    return { count };
  }
}