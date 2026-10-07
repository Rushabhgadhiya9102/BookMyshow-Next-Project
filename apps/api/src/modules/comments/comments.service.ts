import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  private mapComment(c: any) {
    if (!c) return null;
    return {
      ...c,
      _id: c.id,
      isVerifiedBooking: true,
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

  /**
   * Section 90: Verified Movie Reviews
   * Business rule: Only users with a completed/confirmed booking for the movie may submit a review.
   * Duplicate reviews are rejected.
   */
  async create(data: {
    movieId: string;
    userId: string;
    username?: string;
    comment: string;
    rating?: number;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // 1. Verify User has an eligible confirmed booking for this movie
    const eligibleBooking = await this.prisma.booking.findFirst({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        show: { movieId: data.movieId },
      },
    });

    if (!eligibleBooking) {
      throw new ForbiddenException(
        "Only customers who have confirmed bookings for this movie can submit a verified review (Section 90)."
      );
    }

    // 2. Prevent duplicate reviews by the same user for this movie
    const existingReview = await this.prisma.review.findFirst({
      where: {
        movieId: data.movieId,
        userId: user.id,
      },
    });

    if (existingReview) {
      throw new ConflictException(
        "You have already submitted a review for this movie."
      );
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
      message: "Verified review created successfully",
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
      comment: this.mapComment(updated),
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
      _id: id,
    };
  }
}
