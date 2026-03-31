import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class CreateTeamMemberDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
}

export class UpdateTeamMemberDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
}

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTeamMemberDto, agencyId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    if (!['ADMIN', 'SECRETAIRE', 'COMPTABLE'].includes(createDto.role)) {
      throw new ConflictException('Rôle invalide pour un membre de l\'équipe');
    }

    const hashedPassword = await bcrypt.hash('TeamMember1234!', 12);

    const user = await this.prisma.user.create({
      data: {
        email: createDto.email,
        password: hashedPassword,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        phone: createDto.phone,
        role: createDto.role,
        agencyId,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      temporaryPassword: 'TeamMember1234!',
      createdAt: user.createdAt,
    };
  }

  async findAll(agencyId: string) {
    return this.prisma.user.findMany({
      where: {
        agencyId,
        role: { in: ['ADMIN', 'SECRETAIRE', 'COMPTABLE'] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, agencyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, agencyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Membre introuvable');
    }

    return user;
  }

  async update(id: string, updateDto: UpdateTeamMemberDto, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.user.update({
      where: { id },
      data: updateDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  }

  async resetPassword(id: string, agencyId: string) {
    await this.findOne(id, agencyId);

    const hashedPassword = await bcrypt.hash('TeamMember1234!', 12);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe réinitialisé', temporaryPassword: 'TeamMember1234!' };
  }

  async toggleActive(id: string, agencyId: string) {
    const user = await this.findOne(id, agencyId);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }
}