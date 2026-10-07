import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  private async verifyPassword(hash: string, plain: string): Promise<boolean> {
    if (hash.startsWith("$argon2")) {
      try {
        return await argon2.verify(hash, plain);
      } catch {
        return false;
      }
    }
    try {
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        avatar: true,
        preferredCity: true,
        preferredLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, string> = {};
    if (dto.username !== undefined) data.username = dto.username.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.avatar !== undefined) data.avatar = dto.avatar.trim();
    if (dto.preferredCity !== undefined) data.preferredCity = dto.preferredCity.trim();
    if (dto.preferredLanguage !== undefined) data.preferredLanguage = dto.preferredLanguage.trim();

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        avatar: true,
        preferredCity: true,
        preferredLanguage: true,
        updatedAt: true,
      },
    });

    return {
      message: "Profile updated successfully",
      user: updated,
      status: 200,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isValid = await this.verifyPassword(user.passwordHash, dto.currentPassword);
    if (!isValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all existing sessions
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return {
      message: "Password changed successfully. Please log in with your new password.",
      status: 200,
    };
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      sessions,
      status: 200,
    };
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException("Session not found");
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return {
      message: "Session revoked successfully",
      status: 200,
    };
  }

  async getBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: { theater: true },
            },
          },
        },
        bookingSeats: {
          include: {
            showSeat: {
              include: { seat: true },
            },
          },
        },
        payment: true,
        tickets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      bookings,
      status: 200,
    };
  }
}
