import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export class CreateOwnerDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  idCardNum?: string;
  bankInfo?: string;
}

export class UpdateOwnerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  idCardNum?: string;
  bankInfo?: string;
}

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService) {}

  async create(createOwnerDto: CreateOwnerDto, agencyId: string) {
    return this.prisma.owner.create({
      data: { ...createOwnerDto, agencyId },
    });
  }

  async findAll(agencyId: string) {
    return this.prisma.owner.findMany({
      where: { agencyId, isActive: true },
      include: {
        _count: { select: { properties: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, agencyId: string) {
    const owner = await this.prisma.owner.findFirst({
      where: { id, agencyId },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            status: true,
            rentBase: true,
          },
        },
      },
    });

    if (!owner) {
      throw new NotFoundException('Propriétaire introuvable');
    }

    return owner;
  }

  async update(id: string, updateOwnerDto: UpdateOwnerDto, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.owner.update({
      where: { id },
      data: updateOwnerDto,
    });
  }

  async remove(id: string, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.owner.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async createPortalAccess(ownerId: string, agencyId: string, prisma: PrismaService) {
  const owner = await this.findOne(ownerId, agencyId);

  const existingUser = await prisma.user.findUnique({
    where: { email: owner.email! },
  });

  if (existingUser) {
    return { message: 'Accès déjà existant', email: owner.email };
  }

  if (!owner.email) {
    throw new Error('Le propriétaire doit avoir un email pour accéder au portail');
  }

  const hashedPassword = await bcrypt.hash('Proprio1234!', 12);

  const user = await prisma.user.create({
    data: {
      email: owner.email,
      password: hashedPassword,
      firstName: owner.firstName,
      lastName: owner.lastName,
      phone: owner.phone || undefined,
      role: 'PROPRIETAIRE',
      agencyId,
    },
  });

  return {
    message: 'Accès portail créé avec succès',
    email: user.email,
    temporaryPassword: 'Proprio1234!',
  };
}

async getPortalDashboard(userId: string, agencyId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error('Utilisateur introuvable');

  const owner = await this.prisma.owner.findFirst({
    where: { email: user.email, agencyId },
    include: {
      properties: {
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            include: {
              tenant: {
                select: { firstName: true, lastName: true, phone: true },
              },
              rentPayments: {
                where: { status: 'PAID' },
                orderBy: { createdAt: 'desc' },
                take: 3,
              },
            },
          },
          workOrders: {
            where: { status: { not: 'COMPLETED' } },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!owner) throw new Error('Propriétaire introuvable');

  return owner;
}
}