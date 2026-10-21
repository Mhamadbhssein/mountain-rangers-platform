import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const context = {
  user: null,
  req: { protocol: "https", headers: {} },
  res: { clearCookie: () => undefined },
} as any;

describe("Base44 parity modules", () => {
  it("exposes trail explorer and Mission Control routers", () => {
    const caller = appRouter.createCaller(context);
    expect(caller.trailExplorer).toBeDefined();
    expect(caller.admin).toBeDefined();
  });

  it("requires authentication before saving trail recordings", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.trailExplorer.record({
      title: "Cedars loop",
      distanceKm: 7,
      elevationM: 400,
      durationMinutes: 120,
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication before subscribing to Trails Premium", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.trailExplorer.subscribe({ plan: "monthly" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks regular members from importing trails", async () => {
    const memberCaller = appRouter.createCaller({
      ...context,
      user: { id: 9, openId: "member", email: "m@example.com", name: "Member", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    });
    await expect(memberCaller.admin.importTrails({
      trails: [{ title: "Qadisha", location: "North", difficulty: "Hard", distanceKm: 10, elevationM: 700, duration: "4 hours" }],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks regular members from viewing trail subscriptions and the manifest", async () => {
    const memberCaller = appRouter.createCaller({
      ...context,
      user: { id: 9, openId: "member", email: "m@example.com", name: "Member", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    });
    await expect(memberCaller.admin.trailSubscriptions()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(memberCaller.admin.manifest()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an empty trail import even for admins", async () => {
    const adminCaller = appRouter.createCaller({
      ...context,
      user: { id: 1, openId: "admin", email: "a@example.com", name: "Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    });
    await expect(adminCaller.admin.importTrails({ trails: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
