import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class TheatersService {
  constructor(private prisma: PrismaService) {}

  async getCities() {
    return this.prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        theaters: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async createCity(name: string, state?: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return this.prisma.city.upsert({
      where: { slug },
      update: { name, state },
      create: { name, slug, state },
    });
  }

  async findAll(cityId?: string) {
    const where = cityId ? { cityId } : {};
    return this.prisma.theater.findMany({
      where,
      include: {
        city: true,
        screens: {
          include: {
            seats: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const theater = await this.prisma.theater.findUnique({
      where: { id },
      include: {
        city: true,
        screens: {
          include: {
            seats: true,
            shows: {
              include: {
                movie: true,
              },
            },
          },
        },
      },
    });

    if (!theater) {
      throw new NotFoundException(`Theater with ID ${id} not found`);
    }

    return theater;
  }

  async createTheater(data: {
    name: string;
    cityId: string;
    address: string;
    amenities?: string[];
    description?: string;
  }) {
    const slug =
      data.name.toLowerCase().replace(/[^a-z0-9]/g, "-") +
      `-${Date.now().toString(36)}`;

    return this.prisma.theater.create({
      data: {
        name: data.name,
        slug,
        cityId: data.cityId,
        address: data.address,
        amenities: data.amenities || [],
        description: data.description,
      },
    });
  }
}
