import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType } from '@prisma/client';

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
}