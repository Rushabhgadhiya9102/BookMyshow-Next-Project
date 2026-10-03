import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  if (req && req.headers && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("SECRET_KEY") || "super-secret-jwt-key-bookmyshow",
    });
  }

  async validate(payload: { id: string; email: string; username: string; role: string }) {
    if (!payload || !payload.id) {
      throw new UnauthorizedException("Invalid token payload");
    }
    return payload;
  }
}
