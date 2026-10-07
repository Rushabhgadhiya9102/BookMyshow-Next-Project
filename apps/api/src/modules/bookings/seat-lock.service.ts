import { Injectable, Logger } from "@nestjs/common";

interface LockEntry {
  acquiredAt: number;
  expiresAt: number;
}

@Injectable()
export class SeatLockService {
  private readonly logger = new Logger(SeatLockService.name);
  private readonly memoryLocks = new Map<string, LockEntry>();

  /**
   * Generates standard coordination lock key according to Section 30:
   * seat-lock:{showId}:{seatId}
   */
  private getLockKey(showId: string, seatId: string): string {
    return `seat-lock:${showId}:${seatId}`;
  }

  /**
   * Atomically acquires coordination locks for all requested seats.
   * Conforms to Section 33 (Partial Seat Acquisition Prevention):
   * Either ALL seats in the batch are locked, or NONE are locked.
   */
  async acquireLocks(
    showId: string,
    seatIds: string[],
    ttlSeconds = 30
  ): Promise<boolean> {
    const now = Date.now();
    const ttlMs = ttlSeconds * 1000;
    const acquiredKeys: string[] = [];

    // Purge expired locks first
    for (const [key, entry] of this.memoryLocks.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryLocks.delete(key);
      }
    }

    // Try to acquire each seat lock
    for (const seatId of seatIds) {
      const lockKey = this.getLockKey(showId, seatId);
      const existing = this.memoryLocks.get(lockKey);

      if (existing && existing.expiresAt > now) {
        // Contention detected! Release everything already acquired in this batch (Section 33)
        this.logger.warn(
          `Lock contention on seat ${seatId} for show ${showId}. Releasing batch.`
        );
        for (const acquired of acquiredKeys) {
          this.memoryLocks.delete(acquired);
        }
        return false;
      }

      this.memoryLocks.set(lockKey, {
        acquiredAt: now,
        expiresAt: now + ttlMs,
      });
      acquiredKeys.push(lockKey);
    }

    return true;
  }

  /**
   * Releases coordination locks for all requested seats.
   */
  async releaseLocks(showId: string, seatIds: string[]): Promise<void> {
    for (const seatId of seatIds) {
      const lockKey = this.getLockKey(showId, seatId);
      this.memoryLocks.delete(lockKey);
    }
  }

  /**
   * Executes an operation with guaranteed lock release.
   */
  async withLocks<T>(
    showId: string,
    seatIds: string[],
    ttlSeconds: number,
    operation: () => Promise<T>
  ): Promise<T> {
    const acquired = await this.acquireLocks(showId, seatIds, ttlSeconds);
    if (!acquired) {
      throw new Error("COULD_NOT_ACQUIRE_LOCK");
    }

    try {
      return await operation();
    } finally {
      await this.releaseLocks(showId, seatIds);
    }
  }
}
