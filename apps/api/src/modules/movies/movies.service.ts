import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";

@Injectable()
export class MoviesService {
  constructor(private prisma: PrismaService) {}

  private mapMovie(movie: any) {
    if (!movie) return null;
    return {
      ...movie,
      _id: movie.id,
      poster: movie.posterUrl,
      duration: movie.durationMinutes,
    };
  }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") + `-${Date.now().toString(36)}`
    );
  }

  async findAll(adminId?: string) {
    const where = adminId ? { createdBy: adminId } : {};
    const movies = await this.prisma.movie.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return movies.map((m) => this.mapMovie(m));
  }

  async findOne(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        shows: {
          include: {
            screen: {
              include: {
                theater: true,
              },
            },
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return this.mapMovie(movie);
  }

  async create(dto: CreateMovieDto, createdBy?: string) {
    const slug = dto.slug || this.generateSlug(dto.title);
    const posterUrl = dto.posterUrl || dto.poster || "";
    const durationMinutes = dto.durationMinutes || dto.duration || 120;
    const releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : new Date();

    const movie = await this.prisma.movie.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        durationMinutes: Number(durationMinutes),
        releaseDate,
        language: dto.language || "English",
        certification: dto.certification || "U/A",
        status: dto.status || "NOW_SHOWING",
        posterUrl,
        backdropUrl: dto.backdropUrl,
        trailerUrl: dto.trailerUrl,
        rating: dto.rating ? Number(dto.rating) : 0,
        createdBy: createdBy || dto.createdBy,
      },
    });

    return this.mapMovie(movie);
  }

  async update(id: string, dto: UpdateMovieDto) {
    const existing = await this.prisma.movie.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.durationMinutes !== undefined || dto.duration !== undefined) {
      data.durationMinutes = Number(dto.durationMinutes ?? dto.duration);
    }
    if (dto.releaseDate !== undefined) data.releaseDate = new Date(dto.releaseDate);
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.certification !== undefined) data.certification = dto.certification;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.posterUrl !== undefined || dto.poster !== undefined) {
      data.posterUrl = dto.posterUrl ?? dto.poster;
    }
    if (dto.backdropUrl !== undefined) data.backdropUrl = dto.backdropUrl;
    if (dto.trailerUrl !== undefined) data.trailerUrl = dto.trailerUrl;
    if (dto.rating !== undefined) data.rating = Number(dto.rating);

    const updated = await this.prisma.movie.update({
      where: { id },
      data,
    });

    return this.mapMovie(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.movie.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    await this.prisma.movie.delete({ where: { id } });
    return { id, message: "Movie deleted successfully" };
  }
}
