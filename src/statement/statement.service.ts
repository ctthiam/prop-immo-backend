import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class StatementService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async generateOwnerStatement(
    ownerId: string,
    agencyId: string,
    month: number,
    year: number,
  ) {
    const owner = await this.prisma.owner.findFirst({
      where: { id: ownerId, agencyId },
    });

    if (!owner) {
      throw new NotFoundException('Propriétaire introuvable');
    }

    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const payments = await this.prisma.rentPayment.findMany({
      where: {
        agencyId,
        status: 'PAID',
        month,
        year,
        contract: {
          property: {
            ownerId,
          },
        },
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true,
          },
        },
      },
    });

    const MONTHS = [
      'Janvier','Février','Mars','Avril','Mai','Juin',
      'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
    ];

    const paymentsData = payments.map((p) => ({
      date: new Date(p.paidAt!).toLocaleDateString('fr-FR'),
      propertyName: p.contract.property.name,
      tenantName: `${p.contract.tenant.firstName} ${p.contract.tenant.lastName}`,
      description: `Loyer ${MONTHS[month - 1]} ${year}`,
      amount: p.amount,
    }));

    const period = `${MONTHS[month - 1]} ${year}`;

    const statementData = {
      owner,
      agency,
      payments: paymentsData,
      expenses: [],
      period,
      managementFeeRate: 8,
    };

    const pdfBase64 = await this.pdfService.generateStatementPdf(statementData);

    return {
      pdfBase64,
      filename: `releve_${owner.firstName}_${owner.lastName}_${period.replace(' ', '_')}.pdf`,
      summary: {
        owner: `${owner.firstName} ${owner.lastName}`,
        period,
        totalRents: paymentsData.reduce((sum, p) => sum + p.amount, 0),
        paymentsCount: paymentsData.length,
      },
    };
  }

  async getOwnerStatements(agencyId: string) {
    const owners = await this.prisma.owner.findMany({
      where: { agencyId, isActive: true },
      include: {
        properties: {
          include: {
            contracts: {
              include: {
                rentPayments: {
                  where: { status: 'PAID' },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return owners.map((owner) => {
      const totalProperties = owner.properties.length;
      const totalPaidRents = owner.properties.reduce((sum, prop) =>
        sum + prop.contracts.reduce((s, c) =>
          s + c.rentPayments.reduce((r, p) => r + p.amount, 0), 0), 0);

      return {
        id: owner.id,
        name: `${owner.firstName} ${owner.lastName}`,
        phone: owner.phone,
        totalProperties,
        totalPaidRents,
      };
    });
  }
}