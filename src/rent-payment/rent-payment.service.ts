import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { PdfService } from '../pdf/pdf.service';

export class CreateRentPaymentDto {
  contractId: string;
  month: number;
  year: number;
  dueDate: string;
}

export class RecordPaymentDto {
  paidAt: string;
  paymentMethod: string;
  amount?: number;
}

@Injectable()
export class RentPaymentService {
 
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  private generateReference(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `PAY-${year}-${random}`;
  }

  async create(createDto: CreateRentPaymentDto, agencyId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: createDto.contractId, agencyId },
    });

    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    const existing = await this.prisma.rentPayment.findFirst({
      where: {
        contractId: createDto.contractId,
        month: createDto.month,
        year: createDto.year,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Un paiement existe déjà pour ${createDto.month}/${createDto.year}`,
      );
    }

    return this.prisma.rentPayment.create({
      data: {
        reference: this.generateReference(),
        amount: contract.rentTTC,
        month: createDto.month,
        year: createDto.year,
        dueDate: new Date(createDto.dueDate),
        status: PaymentStatus.PENDING,
        agencyId,
        contractId: createDto.contractId,
      },
      include: {
        contract: {
          select: {
            reference: true,
            rentTTC: true,
            tenant: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            property: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
      },
    });
  }

  async recordPayment(id: string, recordDto: RecordPaymentDto, agencyId: string) {
    const payment = await this.prisma.rentPayment.findFirst({
      where: { id, agencyId },
    });

    if (!payment) {
      throw new NotFoundException('Paiement introuvable');
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Ce loyer est déjà payé');
    }

    return this.prisma.rentPayment.update({
      where: { id },
      data: {
        paidAt: new Date(recordDto.paidAt),
        paymentMethod: recordDto.paymentMethod,
        amount: recordDto.amount || payment.amount,
        status: PaymentStatus.PAID,
      },
      include: {
        contract: {
          select: {
            reference: true,
            tenant: {
              select: { firstName: true, lastName: true },
            },
            property: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async findAll(agencyId: string) {
    return this.prisma.rentPayment.findMany({
      where: { agencyId },
      include: {
        contract: {
          select: {
            reference: true,
            tenant: {
              select: { firstName: true, lastName: true, phone: true },
            },
            property: {
              select: { name: true, address: true },
            },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findByContract(contractId: string, agencyId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, agencyId },
    });

    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    return this.prisma.rentPayment.findMany({
      where: { contractId, agencyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findPending(agencyId: string) {
    return this.prisma.rentPayment.findMany({
      where: { agencyId, status: PaymentStatus.PENDING },
      include: {
        contract: {
          select: {
            reference: true,
            tenant: {
              select: { firstName: true, lastName: true, phone: true },
            },
            property: {
              select: { name: true, address: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markLate(agencyId: string) {
    const today = new Date();
    const result = await this.prisma.rentPayment.updateMany({
      where: {
        agencyId,
        status: PaymentStatus.PENDING,
        dueDate: { lt: today },
      },
      data: { status: PaymentStatus.LATE },
    });

    return { message: `${result.count} paiement(s) marqué(s) en retard` };
  }

  async generateQuittancePdf(id: string, agencyId: string) {
  const payment = await this.prisma.rentPayment.findFirst({
    where: { id, agencyId },
    include: {
      contract: {
        include: {
          property: true,
          tenant: true,
          agency: true,
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundException('Paiement introuvable');
  }

  if (payment.status !== 'PAID') {
    throw new BadRequestException('La quittance ne peut être générée que pour un loyer payé');
  }

  const pdfBase64 = await this.pdfService.generateQuittancePdf(payment);
  return { pdfBase64, filename: `quittance_${payment.reference}.pdf` };
}
}