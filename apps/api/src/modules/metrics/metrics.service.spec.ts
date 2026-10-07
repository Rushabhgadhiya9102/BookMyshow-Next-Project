import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MetricsService } from "./metrics.service";

describe("MetricsService - Section 154 Invariant Tests", () => {
  it("initializes all default counters to 0", () => {
    const service = new MetricsService();
    const snapshot = service.getSnapshot();

    assert.ok(snapshot.collectedAt);
    assert.strictEqual(typeof snapshot.uptimeSeconds, "number");
    assert.strictEqual(snapshot.metrics["booking.hold.success"], 0);
    assert.strictEqual(snapshot.metrics["booking.hold.conflict"], 0);
    assert.strictEqual(snapshot.metrics["booking.confirmed"], 0);
    assert.strictEqual(snapshot.metrics["payment.success"], 0);
    assert.strictEqual(snapshot.metrics["ticket.created"], 0);
  });

  it("increments counters correctly by 1 or specified amount", () => {
    const service = new MetricsService();

    const val1 = service.increment("booking.hold.success");
    assert.strictEqual(val1, 1);

    const val2 = service.increment("booking.hold.success", 5);
    assert.strictEqual(val2, 6);

    const snapshot = service.getSnapshot();
    assert.strictEqual(snapshot.metrics["booking.hold.success"], 6);
  });

  it("generates valid Prometheus / OpenTelemetry text format with sanitized keys", () => {
    const service = new MetricsService();
    service.increment("payment.success", 42);
    service.increment("ticket.created", 100);

    const prom = service.getPrometheusFormat();

    assert.ok(prom.includes("# HELP bookmyshow_ticketing_metrics"));
    assert.ok(prom.includes("# TYPE bookmyshow_ticketing_metrics counter"));
    assert.ok(prom.includes("bookmyshow_payment_success 42"));
    assert.ok(prom.includes("bookmyshow_ticket_created 100"));
    assert.ok(prom.includes("bookmyshow_booking_hold_success 0"));
  });
});
