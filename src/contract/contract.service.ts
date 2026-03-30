import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType, ContractStatus, PropertyStatus } from '@prisma/client';

export class CreateContractDto {
  type: ContractType;
  startDate: string;
  endDate?: string;
  rentBase: number;
  charges?: number;
  managementFeePercent?: number;
  taxPercent?: number;
  deposit?: number;
  propertyId: string;
  tenantId: string;
}

export class UpdateContractDto {
  endDate?: string;
  charges?: number;
  managementFeePercent?: number;
  taxPercent?: number;
  status?: ContractStatus;
}

@Injectable()
export class ContractService {
  constructor(private prisma: PrismaService) {}

  private generateReference(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `CTR-${year}-${random}`;
  }

  private calculateRent(
    rentBase: number,
    charges: number = 0,
    managementFeePercent: number = 8,
    taxPercent: number = 3.6,
  ) {
    const tom = rentBase * (taxPercent / 100);
    const managementFeeHT = (rentBase + charges) * (managementFeePercent / 100);
    const managementFeeTTC = managementFeeHT * 1.18;
    const rentTTC = rentBase + charges + tom + managementFeeTTC;

    return {
      tom: Math.round(tom),
      managementFee: Math.round(managementFeeTTC),
      rentTTC: Math.round(rentTTC),
    };
  }

  async create(createContractDto: CreateContractDto, agencyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: createContractDto.propertyId, agencyId },
    });

    if (!property) {
      throw new NotFoundException('Bien introuvable');
    }

    if (property.status === PropertyStatus.OCCUPIED) {
      throw new BadRequestException('Ce bien est déjà occupé');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: createContractDto.tenantId, agencyId },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire introuvable');
    }

    const charges = createContractDto.charges || 0;
    const managementFeePercent = createContractDto.managementFeePercent || 8;
    const taxPercent = createContractDto.taxPercent || 3.6;

    const { tom, managementFee, rentTTC } = this.calculateRent(
      createContractDto.rentBase,
      charges,
      managementFeePercent,
      taxPercent,
    );

    const contract = await this.prisma.contract.create({
      data: {
        reference: this.generateReference(),
        type: createContractDto.type,
        startDate: new Date(createContractDto.startDate),
        endDate: createContractDto.endDate
          ? new Date(createContractDto.endDate)
          : null,
        rentBase: createContractDto.rentBase,
        charges,
        tom,
        managementFee,
        tax: taxPercent,
        rentTTC,
        deposit: createContractDto.deposit || 0,
        status: ContractStatus.ACTIVE,
        agencyId,
        propertyId: createContractDto.propertyId,
        tenantId: createContractDto.tenantId,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true, type: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    await this.prisma.property.update({
      where: { id: createContractDto.propertyId },
      data: { status: PropertyStatus.OCCUPIED },
    });

    return contract;
  }

  async findAll(agencyId: string) {
    return this.prisma.contract.findMany({
      where: { agencyId },
      include: {
        property: {
          select: { id: true, name: true, address: true, type: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, agencyId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, agencyId },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        tenant: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    return contract;
  }

  async terminate(id: string, agencyId: string) {
    const contract = await this.findOne(id, agencyId);

    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('Ce contrat est déjà résilié');
    }

    await this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.TERMINATED },
    });

    await this.prisma.property.update({
      where: { id: contract.propertyId },
      data: { status: PropertyStatus.VACANT },
    });

    return { message: 'Contrat résilié avec succès' };
  }

  async update(id: string, updateContractDto: UpdateContractDto, agencyId: string) {
    await this.findOne(id, agencyId);

    return this.prisma.contract.update({
      where: { id },
      data: {
        ...updateContractDto,
        endDate: updateContractDto.endDate
          ? new Date(updateContractDto.endDate)
          : undefined,
      },
    });
  }
}