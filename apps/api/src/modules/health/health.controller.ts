import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Section 96: General health check
   */
  @Public()
  @Get()
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "bookmyshow-api",
    };
  }

  /**
   * Section 96: Process liveness check
   */
  @Public()
  @Get("live")
  getLiveness() {
    return {
      status: "live",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Section 96: Dependency readiness check (PostgreSQL connectivity)
   */
  @Public()
  @Get("ready")
  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      throw new ServiceUnavailableException({
        status: "down",
        database: "disconnected",
        error: err.message || "Database connection error",
      });
    }
  }
}
