import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AccountService } from "./account.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("account")
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get("profile")
  async getProfile(@CurrentUser("id") userId: string) {
    const user = await this.accountService.getProfile(userId);
    return { user, status: 200 };
  }

  @Patch("profile")
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.accountService.updateProfile(userId, dto);
  }

  @Post("change-password")
  async changePassword(
    @CurrentUser("id") userId: string,
    @Body() dto: ChangePasswordDto
  ) {
    return this.accountService.changePassword(userId, dto);
  }

  @Get("sessions")
  async getActiveSessions(@CurrentUser("id") userId: string) {
    return this.accountService.getActiveSessions(userId);
  }

  @Delete("sessions/:id")
  async revokeSession(
    @CurrentUser("id") userId: string,
    @Param("id") sessionId: string
  ) {
    return this.accountService.revokeSession(userId, sessionId);
  }

  @Get("bookings")
  async getBookings(@CurrentUser("id") userId: string) {
    return this.accountService.getBookings(userId);
  }
}
