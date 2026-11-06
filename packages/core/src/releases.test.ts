import { describe, expect, it } from "vitest";
import { nextVersion, versionMonth } from "./releases";

const nov6 = new Date("2026-11-06T15:00:00Z");

describe("versionMonth", () => {
  it("is the UTC year and zero-padded month", () => {
    expect(versionMonth(nov6)).toBe("2026.11");
    expect(versionMonth(new Date("2027-02-01T00:00:00Z"))).toBe("2027.02");
  });

  it("reads the month in UTC, not local time", () => {
    expect(versionMonth(new Date("2026-11-30T23:30:00Z"))).toBe("2026.11");
    expect(versionMonth(new Date("2026-12-01T00:30:00Z"))).toBe("2026.12");
  });
});

describe("nextVersion", () => {
  it("is the month when nothing was released this month", () => {
    expect(nextVersion([], nov6)).toBe("2026.11");
    expect(nextVersion([{ version: "2026.10" }, { version: "2026.10.2" }], nov6)).toBe("2026.11");
  });

  it("appends .2, then .3, for further releases in the same month", () => {
    expect(nextVersion([{ version: "2026.11" }], nov6)).toBe("2026.11.2");
    expect(nextVersion([{ version: "2026.11" }, { version: "2026.11.2" }], nov6)).toBe("2026.11.3");
  });

  it("does not mistake 2026.1 for a release in 2026.11", () => {
    expect(nextVersion([{ version: "2026.10" }, { version: "2026.1" }], nov6)).toBe("2026.11");
  });

  it("starts over in a new month", () => {
    expect(nextVersion([{ version: "2026.11" }, { version: "2026.11.2" }], new Date("2026-12-03T00:00:00Z"))).toBe("2026.12");
  });
});
