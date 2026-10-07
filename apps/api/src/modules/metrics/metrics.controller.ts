import { Controller, Get, Header } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Section 154: Operational metrics snapshot in JSON format.
   */
  @Public()
  @Get()
  getMetrics() {
    return {
      success: true,
      data: this.metricsService.getSnapshot(),
    };
  }

  /**
   * Section 154: Prometheus / OpenTelemetry text scrape endpoint.
   */
  @Public()
  @Get("prometheus")
  @Header("Content-Type", "text/plain")
  getPrometheus() {
    return this.metricsService.getPrometheusFormat();
  }
}
