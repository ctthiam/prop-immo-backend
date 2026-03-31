import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkOrderStatus } from '@prisma/client';

export class CreateWorkOrderDto {
  title: string;
  description: string;
  priority?: string;
  propertyId: string;
  providerId?: string;
}

export class UpdateWorkOrderDto {
  title?: string;
  description?: string;
  priority?: string;
  status?: WorkOrderStatus;
  providerId?: string;
  cost?: number;
}

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  private generateReference(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `TRV-${year}-${random}`;
  }

  async create(createWorkOrderDto: CreateWorkOrderDto, agencyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: createWorkOrderDto.propertyId, agencyId },
    });

    if (!property) {
      throw new NotFoundException('Bien introuvable');
    }

    return this.prisma.workOrder.create({
      data: {
        reference: this.generateReference(),
        title: createWorkOrderDto.title,
        description: createWorkOrderDto.description,
        priority: createWorkOrderDto.priority || 'NORMAL',
        propertyId: createWorkOrderDto.propertyId,
        providerId: createWorkOrderDto.providerId || null,
        agencyId,
        status: WorkOrderStatus.PENDING,
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        provider: { select: { id: true, name: true, type: true, phone: true } },
      },
    });
  }

  async findAll(agencyId: string) {
    return this.prisma.workOrder.findMany({
      where: { agencyId },
      include: {
        property: { select: { id: true, name: true, address: true } },
        provider: { select: { id: true, name: true, type: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, agencyId: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, agencyId },
      include: {
        property: {
          include: {
            owner: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        provider: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException('Travail introuvable');
    }

    return workOrder;
  }

  async update(id: string, updateWorkOrderDto: UpdateWorkOrderDto, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.workOrder.update({
      where: { id },
      data: updateWorkOrderDto,
      include: {
        property: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, type: true, phone: true } },
      },
    });
  }

  async assign(id: string, providerId: string, agencyId: string) {
    await this.findOne(id, agencyId);

    const provider = await this.prisma.provider.findFirst({
      where: { id: providerId, agencyId },
    });

    if (!provider) {
      throw new NotFoundException('Prestataire introuvable');
    }

    return this.prisma.workOrder.update({
      where: { id },
      data: {
        providerId,
        status: WorkOrderStatus.ASSIGNED,
      },
      include: {
        property: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, type: true, phone: true } },
      },
    });
  }

  async complete(id: string, cost: number, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.workOrder.update({
      where: { id },
      data: {
        status: WorkOrderStatus.COMPLETED,
        cost,
      },
    });
  }

  async findByProperty(propertyId: string, agencyId: string) {
    return this.prisma.workOrder.findMany({
      where: { propertyId, agencyId },
      include: {
        provider: { select: { id: true, name: true, type: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}