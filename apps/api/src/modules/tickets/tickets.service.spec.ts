import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TicketsService } from "./tickets.service";
import { MetricsService } from "../metrics/metrics.service";
import { ConflictException, BadRequestException, NotFoundException } from "@nestjs/common";

describe("TicketsService - Section 44 & 142 Invariant 4 Tests", () => {
  const createMockTicket = (status: "ACTIVE" | "USED" | "CANCELLED", ticketNumber = "TKT-TEST-1") => ({
    id: "ticket-1",
    ticketNumber,
    qrCodePayload: JSON.stringify({ ticketNumber }),
    seatCount: 2,
    status,
    issuedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    booking: {
      id: "booking-1",
      show: {
        startTime: new Date(Date.now() + 3600000),
        movie: { title: "Inception" },
        screen: {
          name: "Screen 1",
          theater: { name: "PVR Cinemas" },
        },
      },
      bookingSeats: [
        {
          showSeat: {
            seat: { rowLabel: "A", seatNumber: 1 },
          },
        },
        {
          showSeat: {
            seat: { rowLabel: "A", seatNumber: 2 },
          },
        },
      ],
    },
  });

  it("successfully verifies active ticket, marks as USED, and increments ticket.validation.success", async () => {
    const mockTicket = createMockTicket("ACTIVE");
    let updatedStatus = "";

    const mockPrisma = {
      $transaction: async (cb: any) => {
        return cb({
          ticket: {
            findUnique: async () => mockTicket,
            update: async ({ data }: any) => {
              updatedStatus = data.status;
              return { ...mockTicket, status: data.status };
            },
          },
        });
      },
    };

    const metricsService = new MetricsService();
    const service = new TicketsService(mockPrisma as any, metricsService);

    const result = await service.verifyTicket("TKT-TEST-1");

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.status, "USED");
    assert.strictEqual(updatedStatus, "USED");
    assert.strictEqual(result.movieTitle, "Inception");
    assert.strictEqual(result.theaterName, "PVR Cinemas");
    assert.deepStrictEqual(result.seats, ["A1", "A2"]);

    const snapshot = metricsService.getSnapshot();
    assert.strictEqual(snapshot.metrics["ticket.validation.success"], 1);
    assert.strictEqual(snapshot.metrics["ticket.validation.duplicate"], 0);
  });

  it("Invariant 4: duplicate scan on USED ticket throws ConflictException and increments ticket.validation.duplicate", async () => {
    const mockTicket = createMockTicket("USED");

    const mockPrisma = {
      $transaction: async (cb: any) => {
        return cb({
          ticket: {
            findUnique: async () => mockTicket,
          },
        });
      },
    };

    const metricsService = new MetricsService();
    const service = new TicketsService(mockPrisma as any, metricsService);

    await assert.rejects(
      async () => service.verifyTicket("TKT-TEST-1"),
      (err: any) => {
        assert.ok(err instanceof ConflictException);
        assert.ok(err.message.includes("already been scanned and used"));
        return true;
      }
    );

    const snapshot = metricsService.getSnapshot();
    assert.strictEqual(snapshot.metrics["ticket.validation.duplicate"], 1);
    assert.strictEqual(snapshot.metrics["ticket.validation.success"], 0);
  });

  it("rejects verification on CANCELLED ticket with BadRequestException", async () => {
    const mockTicket = createMockTicket("CANCELLED");

    const mockPrisma = {
      $transaction: async (cb: any) => {
        return cb({
          ticket: {
            findUnique: async () => mockTicket,
          },
        });
      },
    };

    const metricsService = new MetricsService();
    const service = new TicketsService(mockPrisma as any, metricsService);

    await assert.rejects(
      async () => service.verifyTicket("TKT-TEST-1"),
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.ok(err.message.includes("INVALID. This booking was cancelled or refunded"));
        return true;
      }
    );
  });

  it("throws NotFoundException when ticket does not exist", async () => {
    const mockPrisma = {
      $transaction: async (cb: any) => {
        return cb({
          ticket: {
            findUnique: async () => null,
          },
        });
      },
    };

    const metricsService = new MetricsService();
    const service = new TicketsService(mockPrisma as any, metricsService);

    await assert.rejects(
      async () => service.verifyTicket("TKT-NONEXISTENT"),
      (err: any) => {
        assert.ok(err instanceof NotFoundException);
        return true;
      }
    );
  });

  it("rejects empty or whitespace ticketNumber with BadRequestException", async () => {
    const mockPrisma = {} as any;
    const metricsService = new MetricsService();
    const service = new TicketsService(mockPrisma, metricsService);

    await assert.rejects(
      async () => service.verifyTicket("   "),
      (err: any) => {
        assert.ok(err instanceof BadRequestException);
        assert.ok(err.message.includes("ticketNumber is required"));
        return true;
      }
    );
  });
});
