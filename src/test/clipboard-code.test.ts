import { describe, expect, it } from "vitest";
import { clipboardConferenceCode } from "@/lib/clipboard-code";

describe("conference clipboard code", () => {
  it("accepts exactly 32 alphanumeric characters, preserving case", () => {
    const code = "Ab12".repeat(8);
    expect(clipboardConferenceCode(`\n ${code} \n`)).toBe(code);
  });
  it("rejects shorter, longer, punctuated and unrelated clipboard contents", () => {
    for (const text of ["A".repeat(31), "A".repeat(33), "A".repeat(31) + "-", "Código: " + "A".repeat(32), ""]) {
      expect(clipboardConferenceCode(text)).toBeNull();
    }
  });
});