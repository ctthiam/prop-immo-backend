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
}