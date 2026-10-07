import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export interface SearchResults {
  query: string;
  movies: Array<{
    id: string;
    title: string;
    slug: string;
    posterUrl: string;
    rating: number;
    durationMinutes: number;
    language: string;
    certification: string;
  }>;
  theaters: Array<{
    id: string;
    name: string;
    slug: string;
    city: string;
    address: string;
  }>;
  cities: string[];
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Section 88 & 89: Full-Text Multi-Entity Search across Movies, Theaters, and Cities
   */
  async search(query: string): Promise<SearchResults> {
    const cleanQuery = (query || "").trim();

    if (!cleanQuery || cleanQuery.length < 2) {
      return {
        query: cleanQuery,
        movies: [],
        theaters: [],
        cities: [],
      };
    }

    const [moviesRaw, theatersRaw, citiesRaw] = await Promise.all([
      this.prisma.movie.findMany({
        where: {
          OR: [
            { title: { contains: cleanQuery, mode: "insensitive" } },
            { description: { contains: cleanQuery, mode: "insensitive" } },
            { language: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          posterUrl: true,
          rating: true,
          durationMinutes: true,
          language: true,
          certification: true,
        },
        take: 10,
      }),
      this.prisma.theater.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { address: { contains: cleanQuery, mode: "insensitive" } },
            { city: { name: { contains: cleanQuery, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: {
            select: { name: true },
          },
        },
        take: 10,
      }),
      this.prisma.city.findMany({
        where: {
          name: { contains: cleanQuery, mode: "insensitive" },
        },
        select: { name: true },
        take: 5,
      }),
    ]);

    const movies = moviesRaw.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      posterUrl: m.posterUrl,
      rating: m.rating,
      durationMinutes: m.durationMinutes,
      language: m.language,
      certification: m.certification || "",
    }));

    const theaters = theatersRaw.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      city: t.city?.name || "",
      address: t.address,
    }));

    const cities = citiesRaw.map((c) => c.name);

    return {
      query: cleanQuery,
      movies,
      theaters,
      cities,
    };
  }
}
