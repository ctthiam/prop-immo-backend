import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyStatus } from '@prisma/client';

export class CreatePropertyDto {
  type: string;
  name: string;
  address: string;
  description?: string;
  rentBase: number;
  ownerId: string;
}

export class UpdatePropertyDto {
  type?: string;
  name?: string;
  address?: string;
  description?: string;
  rentBase?: number;
  status?: PropertyStatus;
  ownerId?: string;
}

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto, agencyId: string) {
    await this.prisma.owner.findFirst({
      where: { id: createPropertyDto.ownerId, agencyId },
    }).then(owner => {
      if (!owner) throw new NotFoundException('Propriétaire introuvable');
    });

    return this.prisma.property.create({
      data: { ...createPropertyDto, agencyId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(agencyId: string) {
    return this.prisma.property.findMany({
      where: { agencyId, status: { not: PropertyStatus.ARCHIVED } },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        _count: { select: { contracts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, agencyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, agencyId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        contracts: {
          select: {
            id: true,
            reference: true,
            type: true,
            startDate: true,
            endDate: true,
            rentTTC: true,
            status: true,
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Bien introuvable');
    }

    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.property.update({
      where: { id },
      data: updatePropertyDto,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByOwner(ownerId: string, agencyId: string) {
    return this.prisma.property.findMany({
      where: { ownerId, agencyId },
      include: {
        _count: { select: { contracts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async archive(id: string, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.property.update({
      where: { id },
      data: { status: PropertyStatus.ARCHIVED },
    });
  }
}