import { SetMetadata } from "@nestjs/common";
import type { Role } from "@bookmyshow/database";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Array<Role | string>) => SetMetadata(ROLES_KEY, roles);
