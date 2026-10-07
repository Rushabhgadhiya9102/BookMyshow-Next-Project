import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import * as argon2 from "argon2";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma/prisma.service";
import { Role } from "@bookmyshow/database";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  private hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  private generateRandomToken(): string {
    return crypto.randomBytes(40).toString("hex");
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  private async verifyPassword(hash: string, plain: string): Promise<boolean> {
    if (hash.startsWith("$argon2")) {
      try {
        return await argon2.verify(hash, plain);
      } catch {
        return false;
      }
    }
    // Fallback for existing bcrypt hashes
    try {
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  }

  private mapRole(inputRole?: string | Role): Role {
    if (!inputRole) return Role.CUSTOMER;
    const normalized = String(inputRole).toUpperCase();
    if (normalized === "ADMIN" || normalized === "SUPER_ADMIN") return Role.SUPER_ADMIN;
    if (normalized === "THEATER_ADMIN") return Role.THEATER_ADMIN;
    if (normalized === "CONTENT_MANAGER") return Role.CONTENT_MANAGER;
    if (normalized === "FINANCE_ADMIN") return Role.FINANCE_ADMIN;
    return Role.CUSTOMER;
  }

  private generateAccessToken(user: { id: string; email: string; username: string; role: Role | string }): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      { expiresIn: "15m" }
    );
  }

  private async createSession(
    userId: string,
    rawRefreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        userAgent: userAgent || "Unknown Device",
        ipAddress: ipAddress || "Unknown IP",
        expiresAt,
      },
    });
  }

  async signup(dto: SignupDto, userAgent?: string, ipAddress?: string) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException("User with this email already exists");
    }

    const passwordHash = await this.hashPassword(dto.password);
    const role = this.mapRole(dto.role);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username.trim(),
        email,
        passwordHash,
        role,
        phone: dto.phone,
        preferredCity: dto.preferredCity,
        preferredLanguage: dto.preferredLanguage,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        preferredCity: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRandomToken();
    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      message: "User registered successfully",
      accessToken,
      refreshToken,
      token: accessToken, // Backward compatibility
      role: user.role,
      user,
      status: 201,
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException("Invalid email or password");
    }

    const isValid = await this.verifyPassword(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Auto-upgrade bcrypt hash to Argon2id on successful login
    if (!user.passwordHash.startsWith("$argon2")) {
      const upgradedHash = await this.hashPassword(dto.password);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: upgradedHash },
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRandomToken();
    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      message: "Login successful",
      accessToken,
      refreshToken,
      token: accessToken, // Backward compatibility
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        phone: user.phone,
        preferredCity: user.preferredCity,
        preferredLanguage: user.preferredLanguage,
      },
      status: 200,
    };
  }

  async refreshToken(rawRefreshToken: string, userAgent?: string, ipAddress?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session has expired or was revoked. Please log in again.");
    }

    // Revoke old session
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Rotate refresh token
    const newRefreshToken = this.generateRandomToken();
    await this.createSession(session.userId, newRefreshToken, userAgent, ipAddress);

    const newAccessToken = this.generateAccessToken(session.user);

    return {
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      token: newAccessToken,
      role: session.user.role,
      status: 200,
    };
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: "Logged out successfully", status: 200 };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: "All sessions have been revoked successfully", status: 200 };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success message to prevent user enumeration
      return {
        message: "If this email is registered, a password reset link has been generated.",
        status: 200,
      };
    }

    const rawToken = this.generateRandomToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      message: "If this email is registered, a password reset link has been generated.",
      resetToken: rawToken, // Provided in response for development / direct testing
      status: 200,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired password reset token");
    }

    const newPasswordHash = await this.hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all active sessions for security
      this.prisma.session.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: "Password has been reset successfully. Please log in.", status: 200 };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        preferredCity: true,
        preferredLanguage: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      users,
      status: 200,
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}
