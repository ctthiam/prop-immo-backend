import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgencyService {
  constructor(private prisma: PrismaService) {}

  async create(createAgencyDto: CreateAgencyDto) {
    const existingAgency = await this.prisma.agency.findUnique({
      where: { slug: createAgencyDto.slug },
    });

    if (existingAgency) {
      throw new ConflictException('Une agence avec ce slug existe déjà');
    }

    const agency = await this.prisma.agency.create({
      data: {
        name: createAgencyDto.name,
        slug: createAgencyDto.slug,
        email: createAgencyDto.email,
        phone: createAgencyDto.phone,
        address: createAgencyDto.address,
        plan: createAgencyDto.plan || 'trial',
        status: 'active',
      },
    });

    const hashedPassword = await bcrypt.hash('Admin1234!', 12);

    const adminUser = await this.prisma.user.create({
      data: {
        email: createAgencyDto.email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: createAgencyDto.name,
        role: 'ADMIN',
        agencyId: agency.id,
      },
    });

    return {
      agency,
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        temporaryPassword: 'Admin1234!',
      },
    };
  }

  async findAll() {
    return this.prisma.agency.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException('Agence introuvable');
    }

    return agency;
  }

  async update(id: string, updateAgencyDto: UpdateAgencyDto) {
    await this.findOne(id);

    return this.prisma.agency.update({
      where: { id },
      data: updateAgencyDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.agency.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
  async getDashboardStats(agencyId: string) {
  const [
    totalOwners,
    totalTenants,
    totalProperties,
    vacantProperties,
    occupiedProperties,
    activeContracts,
    totalPaidThisMonth,
    totalPendingPayments,
    latePayments,
    recentPayments,
    workOrdersByStatus,
  ] = await Promise.all([
    this.prisma.owner.count({ where: { agencyId, isActive: true } }),
    this.prisma.tenant.count({ where: { agencyId, isActive: true } }),
    this.prisma.property.count({ where: { agencyId, status: { not: 'ARCHIVED' } } }),
    this.prisma.property.count({ where: { agencyId, status: 'VACANT' } }),
    this.prisma.property.count({ where: { agencyId, status: 'OCCUPIED' } }),
    this.prisma.contract.count({ where: { agencyId, status: 'ACTIVE' } }),
    this.prisma.rentPayment.aggregate({
      where: {
        agencyId,
        status: 'PAID',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
      _sum: { amount: true },
    }),
    this.prisma.rentPayment.count({ where: { agencyId, status: 'PENDING' } }),
    this.prisma.rentPayment.count({ where: { agencyId, status: 'LATE' } }),
    this.prisma.rentPayment.findMany({
      where: { agencyId, status: 'PAID' },
      include: {
        contract: {
          select: {
            tenant: { select: { firstName: true, lastName: true } },
            property: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 5,
    }),
    this.prisma.workOrder.groupBy({
      by: ['status'],
      where: { agencyId },
      _count: { status: true },
    }),
  ]);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }).reverse();

  const monthlyRevenue = await Promise.all(
    last6Months.map(async ({ month, year }) => {
      const result = await this.prisma.rentPayment.aggregate({
        where: { agencyId, status: 'PAID', month, year },
        _sum: { amount: true },
      });
      const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
      return {
        name: `${MONTHS[month - 1]} ${year}`,
        montant: result._sum.amount || 0,
      };
    })
  );

  return {
    kpis: {
      totalOwners,
      totalTenants,
      totalProperties,
      vacantProperties,
      occupiedProperties,
      activeContracts,
      totalPaidThisMonth: totalPaidThisMonth._sum.amount || 0,
      totalPendingPayments,
      latePayments,
    },
    monthlyRevenue,
    propertyStatus: [
      { name: 'Occupés', value: occupiedProperties, color: '#27AE60' },
      { name: 'Vacants', value: vacantProperties, color: '#D4A843' },
    ],
    workOrdersByStatus: workOrdersByStatus.map((w) => ({
      status: w.status,
      count: w._count.status,
    })),
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      month: p.month,
      year: p.year,
      paidAt: p.paidAt,
      tenant: `${p.contract.tenant.firstName} ${p.contract.tenant.lastName}`,
      property: p.contract.property.name,
    })),
  };
}
}