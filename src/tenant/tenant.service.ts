import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class CreateTenantDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  idCardNum?: string;
  profession?: string;
  contractType?: ContractType;
}

export class UpdateTenantDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  idCardNum?: string;
  profession?: string;
  contractType?: ContractType;
}

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto, agencyId: string) {
    return this.prisma.tenant.create({
      data: { ...createTenantDto, agencyId },
    });
  }

  async findAll(agencyId: string) {
    return this.prisma.tenant.findMany({
      where: { agencyId, isActive: true },
      include: {
        _count: { select: { contracts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, agencyId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, agencyId },
      include: {
        contracts: {
          select: {
            id: true,
            reference: true,
            type: true,
            startDate: true,
            endDate: true,
            rentTTC: true,
            status: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire introuvable');
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async createPortalAccess(tenantId: string, agencyId: string) {
  const tenant = await this.findOne(tenantId, agencyId);

  if (!tenant.email) {
    throw new Error('Le locataire doit avoir un email pour accéder au portail');
  }

  const existingUser = await this.prisma.user.findUnique({
    where: { email: tenant.email },
  });

  if (existingUser) {
    return { message: 'Accès déjà existant', email: tenant.email };
  }

  const hashedPassword = await bcrypt.hash('Locataire1234!', 12);

  const user = await this.prisma.user.create({
    data: {
      email: tenant.email,
      password: hashedPassword,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      phone: tenant.phone || undefined,
      role: 'LOCATAIRE',
      agencyId,
    },
  });

  return {
    message: 'Accès portail créé avec succès',
    email: user.email,
    temporaryPassword: 'Locataire1234!',
  };
}

async getPortalDashboard(userId: string, agencyId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error('Utilisateur introuvable');

  const tenant = await this.prisma.tenant.findFirst({
    where: { email: user.email, agencyId },
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        include: {
          property: {
            select: {
              name: true,
              address: true,
              type: true,
            },
          },
          rentPayments: {
            orderBy: { createdAt: 'desc' },
            take: 6,
          },
        },
      },
    },
  });

  if (!tenant) throw new Error('Locataire introuvable');

  return tenant;
}
}