import { describe, it, expect } from "vitest";
import { orgStatus, timeAgo } from "./util";

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

describe("orgStatus", () => {
  it("suspended wins over activity", () => {
    expect(orgStatus({ suspended_at: hoursAgo(1), last_event_at: hoursAgo(1) })).toBe("suspended");
  });
  it("no events", () => {
    expect(orgStatus({ suspended_at: null, last_event_at: null })).toBe("no-events");
  });
  it("active within 24h, quiet within 7d, stale after", () => {
    expect(orgStatus({ last_event_at: hoursAgo(2) })).toBe("active");
    expect(orgStatus({ last_event_at: hoursAgo(48) })).toBe("quiet");
    expect(orgStatus({ last_event_at: hoursAgo(24 * 10) })).toBe("stale");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-12T12:00:00Z").getTime();
  it("handles empty and units", () => {
    expect(timeAgo(null, now)).toBe("never");
    expect(timeAgo("2026-10-12T11:59:45Z", now)).toBe("just now");
    expect(timeAgo("2026-10-12T11:30:00Z", now)).toBe("30m ago");
    expect(timeAgo("2026-10-12T09:00:00Z", now)).toBe("3h ago");
    expect(timeAgo("2026-10-10T12:00:00Z", now)).toBe("2d ago");
  });
});
