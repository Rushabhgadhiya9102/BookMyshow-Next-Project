import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  private mapComment(c: any) {
    if (!c) return null;
    return {
      ...c,
      _id: c.id,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async findByMovieId(movieId: string) {
    const comments = await this.prisma.review.findMany({
      where: { movieId },
      orderBy: { createdAt: "desc" },
    });

    return {
      movieComment: comments.map((c) => this.mapComment(c)),
      status: 200,
    };
  }

  async create(data: {
    movieId: string;
    userId: string;
    username?: string;
    comment: string;
    rating?: number;
  }) {
    let user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      user = await this.prisma.user.findFirst();
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            username: data.username || "Guest",
            email: `guest-${Date.now()}@bookmyshow.local`,
            passwordHash: "dummy-hash",
          },
        });
      }
    }

    const review = await this.prisma.review.create({
      data: {
        movieId: data.movieId,
        userId: user.id,
        username: data.username || user.username,
        comment: data.comment,
        rating: data.rating ? Number(data.rating) : 0,
      },
    });

    return {
      message: "comment created successfully",
      status: 201,
      comment: this.mapComment(review),
    };
  }

  async update(id: string, commentText: string) {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { comment: commentText },
    });

    return {
      message: "comment updated successfully",
      status: 200,
      updatedComment: this.mapComment(updated),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    await this.prisma.review.delete({ where: { id } });
    return {
      message: "comment deleted successfully",
      status: 200,
    };
  }
}
