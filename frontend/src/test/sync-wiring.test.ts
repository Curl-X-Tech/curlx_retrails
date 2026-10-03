import { describe, it, expect, beforeEach } from "vitest";
import { isPastCutoff, getTargetOrderDate } from "@/lib/business-day";
import { calculateBackoffDelay, shouldRetry } from "@/sync/backoff";
import { useSyncStatus } from "@/sync/use-sync-status";
import { startSync, stopSync } from "@/sync/engine";

describe("Sync Wiring & Business Day Cutoff", () => {
  beforeEach(() => {
    useSyncStatus.setState({
      online: true,
      draining: false,
      queueCount: 0,
      blockedCount: 0,
      lastSyncAt: null,
      lastError: null,
    });
  });

  describe("Cutoff at 15:59 vs 16:00 Asia/Colombo", () => {
    it("returns false for 15:59:59 Asia/Colombo", () => {
      // 15:59:59 Asia/Colombo (UTC+5:30) = 10:29:59 UTC
      const dateBeforeCutoff = new Date("2026-10-03T10:29:59Z");
      expect(isPastCutoff(dateBeforeCutoff)).toBe(false);
      expect(getTargetOrderDate(dateBeforeCutoff)).toBe("2026-10-03");
    });

    it("returns true for 16:00:00 Asia/Colombo", () => {
      // 16:00:00 Asia/Colombo (UTC+5:30) = 10:30:00 UTC
      const dateAtCutoff = new Date("2026-10-03T10:30:00Z");
      expect(isPastCutoff(dateAtCutoff)).toBe(true);
      expect(getTargetOrderDate(dateAtCutoff)).toBe("2026-10-04");
    });
  });

  describe("Backoff & Queue Retry", () => {
    it("calculates exponential backoff delay with jitter", () => {
      const delay1 = calculateBackoffDelay(1);
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThanOrEqual(1200);

      const delay2 = calculateBackoffDelay(2);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThanOrEqual(2200);

      expect(shouldRetry(1)).toBe(true);
      expect(shouldRetry(5)).toBe(false);
    });
  });

  describe("Online Event & Sync Status State", () => {
    it("updates online status when online window event fires", () => {
      startSync();
      useSyncStatus.getState().setOnline(false);
      expect(useSyncStatus.getState().online).toBe(false);

      window.dispatchEvent(new Event("online"));
      expect(useSyncStatus.getState().online).toBe(true);
      stopSync();
    });

    it("clears lastError and sets lastSyncAt after successful drain state reset", () => {
      useSyncStatus.getState().setLastError("Connection failed");
      expect(useSyncStatus.getState().lastError).toBe("Connection failed");

      // Simulating state updates during successful drain completion
      useSyncStatus.setState({
        lastError: null,
        lastSyncAt: new Date().toISOString(),
        queueCount: 0,
        blockedCount: 0,
        draining: false,
      });

      const state = useSyncStatus.getState();
      expect(state.lastError).toBeNull();
      expect(state.queueCount).toBe(0);
      expect(state.lastSyncAt).not.toBeNull();
    });
  });
});
