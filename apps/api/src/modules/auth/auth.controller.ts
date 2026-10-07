import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Public } from "@/common/decorators/public.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === "production";

    // Primary short-lived access token
    res.cookie("token", accessToken, {
      httpOnly: false, // Accessible to client for Authorization header parity
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Secure long-lived refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Secure: protected against XSS
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie("token", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
  }

  @Public()
  @Post("signup")
  async signup(
    @Body() dto: SignupDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.signup(dto, userAgent, ipAddress);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.login(dto, userAgent, ipAddress);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body("refreshToken") bodyToken?: string
  ) {
    const rawRefreshToken = req.cookies?.refreshToken || bodyToken;
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await this.authService.refreshToken(rawRefreshToken, userAgent, ipAddress);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Get("logout")
  async logoutGet(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const rawRefreshToken = req.cookies?.refreshToken;
    const result = await this.authService.logout(rawRefreshToken);
    this.clearAuthCookies(res);
    return result;
  }

  @Public()
  @Post("logout")
  async logoutPost(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body("refreshToken") bodyToken?: string
  ) {
    const rawRefreshToken = req.cookies?.refreshToken || bodyToken;
    const result = await this.authService.logout(rawRefreshToken);
    this.clearAuthCookies(res);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  async logoutAll(
    @CurrentUser("id") userId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.logoutAll(userId);
    this.clearAuthCookies(res);
    return result;
  }

  @Public()
  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getProfile(@CurrentUser("id") userId: string) {
    return {
      user: await this.authService.getUserById(userId),
      status: 200,
    };
  }

  @Public()
  @Get("users")
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}
