import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException("Access denied: unauthenticated");
    }

    const userRole = String(user.role).toUpperCase();

    if (userRole === "SUPER_ADMIN") {
      return true;
    }

    const normalizedRequired = requiredRoles.map((r) => String(r).toUpperCase());

    if (normalizedRequired.includes(userRole)) {
      return true;
    }

    if (
      normalizedRequired.includes("ADMIN") &&
      ["SUPER_ADMIN", "THEATER_ADMIN", "CONTENT_MANAGER", "FINANCE_ADMIN"].includes(userRole)
    ) {
      return true;
    }

    if (normalizedRequired.includes("USER") && userRole === "CUSTOMER") {
      return true;
    }

    throw new ForbiddenException("Access denied: insufficient permissions");
  }
}
