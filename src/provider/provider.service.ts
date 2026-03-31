import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateProviderDto {
  name: string;
  type: string;
  phone: string;
  email?: string;
  address?: string;
}

export class UpdateProviderDto {
  name?: string;
  type?: string;
  phone?: string;
  email?: string;
  address?: string;
}

@Injectable()
export class ProviderService {
  constructor(private prisma: PrismaService) {}

  async create(createProviderDto: CreateProviderDto, agencyId: string) {
    return this.prisma.provider.create({
      data: { ...createProviderDto, agencyId },
    });
  }

  async findAll(agencyId: string) {
    return this.prisma.provider.findMany({
      where: { agencyId, isActive: true },
      include: {
        _count: { select: { workOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, agencyId: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, agencyId },
      include: {
        workOrders: {
          select: {
            id: true,
            reference: true,
            title: true,
            status: true,
            createdAt: true,
            property: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Prestataire introuvable');
    }

    return provider;
  }

  async update(id: string, updateProviderDto: UpdateProviderDto, agencyId: string) {
    await this.findOne(id, agencyId);
    return this.prisma.provider.update({
      where: { id },
      data: updateProviderDto,
    });
  }

  async remove(id: string, agencyId: string) {
    await this.findOne(id, agencyId);
    return this.prisma.provider.update({
      where: { id },
      data: { isActive: false },
    });
  }
}