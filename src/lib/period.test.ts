import { describe, it, expect } from "vitest";
import { parsePeriod } from "./period.js";

describe("parsePeriod", () => {
  describe("quarter labels", () => {
    it("parses Q1 correctly", () => {
      expect(parsePeriod("Q1-2026")).toEqual({
        label: "Q1-2026",
        start: "2026-01-01",
        end: "2026-03-31",
      });
    });

    it("parses Q2 correctly", () => {
      expect(parsePeriod("Q2-2026")).toEqual({
        label: "Q2-2026",
        start: "2026-04-01",
        end: "2026-06-30",
      });
    });

    it("parses Q3 correctly", () => {
      expect(parsePeriod("Q3-2026")).toEqual({
        label: "Q3-2026",
        start: "2026-07-01",
        end: "2026-09-30",
      });
    });

    it("parses Q4 correctly", () => {
      expect(parsePeriod("Q4-2026")).toEqual({
        label: "Q4-2026",
        start: "2026-10-01",
        end: "2026-12-31",
      });
    });

    it("handles any year — not limited to hardcoded list", () => {
      expect(parsePeriod("Q2-2099")).toEqual({
        label: "Q2-2099",
        start: "2099-04-01",
        end: "2099-06-30",
      });
    });

    it("handles historical years", () => {
      expect(parsePeriod("Q3-2020")).toEqual({
        label: "Q3-2020",
        start: "2020-07-01",
        end: "2020-09-30",
      });
    });
  });

  describe("custom range with --start / --end", () => {
    const START = "2026-01-13";
    const END = "2026-01-24";

    it("returns the given dates for a custom label", () => {
      expect(parsePeriod("sprint-42", { start: START, end: END })).toEqual({
        label: "sprint-42",
        start: START,
        end: END,
      });
    });

    it("accepts any valid ISO date in custom range", () => {
      expect(parsePeriod("onboarding", { start: "2025-11-03", end: "2025-11-28" })).toEqual({
        label: "onboarding",
        start: "2025-11-03",
        end: "2025-11-28",
      });
    });
  });

  describe("error paths", () => {
    it("exits when custom label has no start/end", () => {
      const mockExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
      const mockError = vi.spyOn(console, "error").mockImplementation(() => undefined);

      parsePeriod("unknown-label");

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
      mockError.mockRestore();
    });

    it("exits when --start date is invalid", () => {
      const mockExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
      const mockError = vi.spyOn(console, "error").mockImplementation(() => undefined);

      parsePeriod("sprint-99", { start: "not-a-date", end: "2026-01-24" });

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
      mockError.mockRestore();
    });

    it("exits when --end date is invalid", () => {
      const mockExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
      const mockError = vi.spyOn(console, "error").mockImplementation(() => undefined);

      parsePeriod("sprint-99", { start: "2026-01-13", end: "2026-13-99" });

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
      mockError.mockRestore();
    });
  });
});
