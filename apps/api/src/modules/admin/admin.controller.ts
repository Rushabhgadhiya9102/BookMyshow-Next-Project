import { Controller, Get, Query } from "@nestjs/common";
import { Roles } from "@/common/decorators/roles.decorator";
import { AdminService } from "./admin.service";
import { FinancialReconciliationService } from "./reconciliation.service";
import { SupportLookupService } from "./support-lookup.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

@Controller("admin")
@Roles("ADMIN", "SUPER_ADMIN", "THEATER_ADMIN", "FINANCE_ADMIN")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly reconciliationService: FinancialReconciliationService,
    private readonly supportLookupService: SupportLookupService
  ) {}

  /**
   * Section 60: Server-side aggregated dashboard metrics.
   * Returns: todayRevenue, todayBookings, ticketsSold, occupancyRate, activeShows, failedPayments, refunds, registeredUsers.
   */
  @Get("dashboard/metrics")
  async getDashboardMetrics() {
    const data = await this.adminService.getDashboardMetrics();
    return {
      success: true,
      data,
    };
  }

  /**
   * Section 61: PostgreSQL aggregated revenue analytics.
   * Returns: array of { day, bookings, revenue } grouped by DATE_TRUNC('day', createdAt).
   */
  @Get("analytics/revenue")
  async getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    const data = await this.adminService.getRevenueAnalytics(query.days || 7);
    return {
      success: true,
      data,
    };
  }

  /**
   * Section 61: Screen & Show occupancy analytics.
   */
  @Get("analytics/occupancy")
  async getOccupancyAnalytics() {
    const data = await this.adminService.getOccupancyAnalytics();
    return {
      success: true,
      data,
    };
  }

  /**
   * Section 138: Financial Reconciliation Audit.
   * Compares internal payments, bookings, and refunds to detect discrepancies.
   */
  @Get("reconciliation")
  async runReconciliationAudit() {
    const data = await this.reconciliationService.runAudit();
    return {
      success: true,
      data,
    };
  }

  /**
   * Section 139: Multi-attribute unified support & audit lookup.
   * Search by booking number, user email, payment ID, or ticket number.
   */
  @Get("support/lookup")
  async supportLookup(@Query("q") query: string) {
    const data = await this.supportLookupService.search(query || "");
    return {
      success: true,
      data,
    };
  }
}
