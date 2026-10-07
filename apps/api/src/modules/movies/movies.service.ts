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
      poster: movie.posterUrl || "",
      posterUrl: movie.posterUrl || "",
      banners: movie.backdropUrl || movie.posterUrl || "",
      backdropUrl: movie.backdropUrl || movie.posterUrl || "",
      synopsis: movie.description || "",
      duration: movie.durationMinutes || 120,
      runtime: movie.durationMinutes || 120,
      genres: Array.isArray(movie.genres)
        ? movie.genres
        : typeof movie.genres === "string" && movie.genres.length > 0
          ? movie.genres.split(",").map((g: string) => g.trim())
          : ["Drama", "Action"],
      cinemas: Array.isArray(movie.cinemas) ? movie.cinemas : [],
      cast: Array.isArray(movie.cast) ? movie.cast : [],
      category: movie.category || "Movie",
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

  async findAll(
    adminId?: string,
    city?: string,
    status?: string,
    language?: string
  ) {
    const where: any = {};
    if (adminId) where.createdBy = adminId;
    if (status) where.status = status.toUpperCase();
    if (language) where.language = { equals: language, mode: "insensitive" };

    if (city) {
      const cityMatches = await this.prisma.city.findFirst({
        where: {
          OR: [
            { slug: { equals: city.toLowerCase(), mode: "insensitive" } },
            { name: { equals: city, mode: "insensitive" } },
          ],
        },
      });

      if (cityMatches) {
        where.shows = {
          some: {
            screen: {
              theater: {
                cityId: cityMatches.id,
              },
            },
          },
        };
      }
    }

    const movies = await this.prisma.movie.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (city && movies.length === 0) {
      // Fallback: If no movies are currently scheduled in that city, return available movies so discovery is never empty
      const fallbackWhere: any = {};
      if (adminId) fallbackWhere.createdBy = adminId;
      if (status) fallbackWhere.status = status.toUpperCase();
      if (language) fallbackWhere.language = { equals: language, mode: "insensitive" };

      const fallback = await this.prisma.movie.findMany({
        where: fallbackWhere,
        orderBy: { createdAt: "desc" },
      });
      return fallback.map((m) => this.mapMovie(m));
    }

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
    const backdropUrl = dto.backdropUrl || dto.banners || "";
    const durationMinutes = Number(dto.durationMinutes || dto.duration || dto.runtime) || 120;
    const releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : new Date();
    const description = dto.description || dto.synopsis || dto.title;
    const language = Array.isArray(dto.language)
      ? (dto.language.length > 0 ? dto.language.join(", ") : "English")
      : (dto.language || "English");

    const movie = await this.prisma.movie.create({
      data: {
        title: dto.title,
        slug,
        description,
        durationMinutes: Number(durationMinutes),
        releaseDate,
        language,
        certification: dto.certification || "U/A",
        status: (dto.status || "NOW_SHOWING").toUpperCase(),
        posterUrl,
        backdropUrl,
        trailerUrl: dto.trailerUrl,
        rating: dto.rating ? Number(dto.rating) : 0,
        createdBy: createdBy || dto.createdBy,
      },
    });

    const mapped = this.mapMovie(movie);
    if (mapped) {
      if (dto.genres) {
        mapped.genres = Array.isArray(dto.genres)
          ? dto.genres
          : typeof dto.genres === "string"
            ? dto.genres.split(",").map((g: string) => g.trim())
            : mapped.genres;
      }
      if (dto.cinemas && Array.isArray(dto.cinemas)) mapped.cinemas = dto.cinemas;
      if (dto.cast && Array.isArray(dto.cast)) mapped.cast = dto.cast;
      if (dto.category) mapped.category = dto.category;
    }
    return mapped;
  }

  async update(id: string, dto: UpdateMovieDto) {
    const existing = await this.prisma.movie.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined || dto.synopsis !== undefined) {
      data.description = dto.description || dto.synopsis;
    }
    if (dto.durationMinutes !== undefined || dto.duration !== undefined || dto.runtime !== undefined) {
      data.durationMinutes = Number(dto.durationMinutes ?? dto.duration ?? dto.runtime);
    }
    if (dto.releaseDate !== undefined) data.releaseDate = new Date(dto.releaseDate);
    if (dto.language !== undefined) {
      data.language = Array.isArray(dto.language) ? dto.language.join(", ") : dto.language;
    }
    if (dto.certification !== undefined) data.certification = dto.certification;
    if (dto.status !== undefined) data.status = dto.status.toUpperCase();
    if (dto.posterUrl !== undefined || dto.poster !== undefined) {
      data.posterUrl = dto.posterUrl ?? dto.poster;
    }
    if (dto.backdropUrl !== undefined || dto.banners !== undefined) {
      data.backdropUrl = dto.backdropUrl ?? dto.banners;
    }
    if (dto.trailerUrl !== undefined) data.trailerUrl = dto.trailerUrl;
    if (dto.rating !== undefined) data.rating = Number(dto.rating);

    const updated = await this.prisma.movie.update({
      where: { id },
      data,
    });

    const mapped = this.mapMovie(updated);
    if (mapped) {
      if (dto.genres) {
        mapped.genres = Array.isArray(dto.genres)
          ? dto.genres
          : typeof dto.genres === "string"
            ? dto.genres.split(",").map((g: string) => g.trim())
            : mapped.genres;
      }
      if (dto.cinemas && Array.isArray(dto.cinemas)) mapped.cinemas = dto.cinemas;
      if (dto.cast && Array.isArray(dto.cast)) mapped.cast = dto.cast;
      if (dto.category) mapped.category = dto.category;
    }
    return mapped;
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
