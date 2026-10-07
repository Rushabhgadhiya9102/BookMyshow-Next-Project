import { Injectable, LoggerService } from "@nestjs/common";

const SENSITIVE_KEYS = new Set([
  "password",
  "confirmpassword",
  "token",
  "jwt",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "secret",
  "stripesecret",
  "stripesecretkey",
  "cardnumber",
  "cvv",
  "pan",
]);

@Injectable()
export class StructuredLoggerService implements LoggerService {
  /**
   * Section 153: Recursively sanitizes payloads to ensure no secrets,
   * passwords, JWTs, or financial account details are written to logs.
   */
  sanitize(value: any, depth = 0): any {
    if (depth > 6) return "[Truncated: Max Depth]";
    if (value === null || value === undefined) return value;

    if (typeof value === "string") {
      // Mask JWT patterns: Bearer xxx or xxx.yyy.zzz
      if (value.startsWith("Bearer ") || (value.split(".").length === 3 && value.length > 30)) {
        return "[REDACTED_TOKEN]";
      }
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item, depth + 1));
    }

    if (typeof value === "object") {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.has(lowerKey)) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = this.sanitize(val, depth + 1);
        }
      }
      return sanitized;
    }

    return value;
  }

  log(message: string, context?: Record<string, any>) {
    this.writeLog("info", message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.writeLog("warn", message, context);
  }

  error(message: string, trace?: string, context?: Record<string, any>) {
    this.writeLog("error", message, { ...context, stack: trace });
  }

  debug?(message: string, context?: Record<string, any>) {
    this.writeLog("debug", message, context);
  }

  private writeLog(level: string, message: string, context?: Record<string, any>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? this.sanitize(context) : {}),
    };
    // Print single-line structured JSON
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }
}
