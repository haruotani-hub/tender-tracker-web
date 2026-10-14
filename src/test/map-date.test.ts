import { describe, expect, it } from "vitest";
import { isAllowedMapDate, localToday } from "@/lib/map-date";

const today = new Date(2026, 9, 14, 23, 5);

describe("map date limit", () => {
  it("rejects future dates", () => {
    expect(isAllowedMapDate("2026-10-15", today)).toBe(false);
  });
  it("allows today's date", () => {
    expect(isAllowedMapDate("2026-10-14", today)).toBe(true);
  });
  it("allows earlier dates", () => {
    expect(isAllowedMapDate("2026-10-13", today)).toBe(true);
  });
  it("uses the local calendar day", () => {
    expect(localToday(today)).toBe("2026-10-14");
  });
  it("rejects empty and invalid dates", () => {
    expect(isAllowedMapDate("", today)).toBe(false);
    expect(isAllowedMapDate("2026-02-30", today)).toBe(false);
  });
});