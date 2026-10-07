import { Injectable } from "@nestjs/common";

export type MetricName =
  | "booking.hold.success"
  | "booking.hold.conflict"
  | "booking.confirmed"
  | "booking.expired"
  | "payment.success"
  | "payment.failed"
  | "payment.webhook.retry"
  | "ticket.created"
  | "ticket.validation.success"
  | "ticket.validation.duplicate";

@Injectable()
export class MetricsService {
  private readonly counters: Map<MetricName, number> = new Map();
  private readonly startTime = new Date();

  constructor() {
    this.initCounters();
  }

  private initCounters() {
    const defaultMetrics: MetricName[] = [
      "booking.hold.success",
      "booking.hold.conflict",
      "booking.confirmed",
      "booking.expired",
      "payment.success",
      "payment.failed",
      "payment.webhook.retry",
      "ticket.created",
      "ticket.validation.success",
      "ticket.validation.duplicate",
    ];

    for (const m of defaultMetrics) {
      this.counters.set(m, 0);
    }
  }

  /**
   * Section 154: Increments an operational counter.
   */
  increment(metric: MetricName, by = 1): number {
    const current = this.counters.get(metric) || 0;
    const updated = current + by;
    this.counters.set(metric, updated);
    return updated;
  }

  /**
   * Returns snapshot of all metrics as a dictionary.
   */
  getSnapshot(): Record<string, any> {
    const metrics: Record<string, number> = {};
    for (const [key, val] of this.counters.entries()) {
      metrics[key] = val;
    }

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      collectedAt: new Date().toISOString(),
      metrics,
    };
  }

  /**
   * Formats metrics for Prometheus / OpenTelemetry scraping.
   */
  getPrometheusFormat(): string {
    const lines: string[] = [
      "# HELP bookmyshow_ticketing_metrics Operational ticketing counters",
      "# TYPE bookmyshow_ticketing_metrics counter",
    ];

    for (const [key, val] of this.counters.entries()) {
      const sanitizedKey = key.replace(/\./g, "_");
      lines.push(`bookmyshow_${sanitizedKey} ${val}`);
    }

    return `${lines.join("\n")}\n`;
  }
}
