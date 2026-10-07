import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StructuredLoggerService } from "./structured-logger.service";

describe("StructuredLoggerService - Section 153 Invariant Tests", () => {
  const logger = new StructuredLoggerService();

  it("redacts sensitive fields regardless of casing", () => {
    const input = {
      user: "test-user",
      password: "SuperSecretPassword123!",
      TOKEN: "raw-auth-token",
      jwt: "some-jwt-value",
      cardNumber: "4111222233334444",
      cvv: "123",
      stripeSecret: "sk_test_123456789",
    };

    const sanitized = logger.sanitize(input);

    assert.strictEqual(sanitized.user, "test-user");
    assert.strictEqual(sanitized.password, "[REDACTED]");
    assert.strictEqual(sanitized.TOKEN, "[REDACTED]");
    assert.strictEqual(sanitized.jwt, "[REDACTED]");
    assert.strictEqual(sanitized.cardNumber, "[REDACTED]");
    assert.strictEqual(sanitized.cvv, "[REDACTED]");
    assert.strictEqual(sanitized.stripeSecret, "[REDACTED]");
  });

  it("masks Bearer tokens and raw JWT strings in non-sensitive keys", () => {
    const fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w";
    const input = {
      headerVal: "Bearer my-secret-auth-bearer-token",
      payloadValue: fakeJwt,
      normalString: "Hello world!",
    };

    const sanitized = logger.sanitize(input);

    assert.strictEqual(sanitized.headerVal, "[REDACTED_TOKEN]");
    assert.strictEqual(sanitized.payloadValue, "[REDACTED_TOKEN]");
    assert.strictEqual(sanitized.normalString, "Hello world!");
  });

  it("recursively sanitizes nested objects and arrays", () => {
    const input = {
      orderId: "ord-1",
      customer: {
        name: "Alice",
        secret: "confidential-secret",
      },
      items: [
        { name: "Ticket 1", price: 100 },
        { name: "Ticket 2", password: "item-password" },
      ],
    };

    const sanitized = logger.sanitize(input);

    assert.strictEqual(sanitized.orderId, "ord-1");
    assert.strictEqual(sanitized.customer.name, "Alice");
    assert.strictEqual(sanitized.customer.secret, "[REDACTED]");
    assert.strictEqual(sanitized.items[0].name, "Ticket 1");
    assert.strictEqual(sanitized.items[1].password, "[REDACTED]");
  });

  it("safely terminates at recursion depth greater than 6", () => {
    let deep: any = { value: "deepest" };
    for (let i = 0; i < 10; i++) {
      deep = { next: deep };
    }

    const sanitized = logger.sanitize(deep);
    assert.ok(JSON.stringify(sanitized).includes("[Truncated: Max Depth]"));
  });

  it("preserves null, undefined, booleans, and numbers untouched", () => {
    assert.strictEqual(logger.sanitize(null), null);
    assert.strictEqual(logger.sanitize(undefined), undefined);
    assert.strictEqual(logger.sanitize(42), 42);
    assert.strictEqual(logger.sanitize(true), true);
  });
});
