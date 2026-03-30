import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}