import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createBroadcast: vi.fn(async () => 42),
    sendBroadcast: vi.fn(async () => ({ recipients: 7 })),
    previewBroadcastRecipients: vi.fn(async () => 7),
    getUnreadNotificationCount: vi.fn(async () => 3),
    getUserNotifications: vi.fn(async () => []),
    markNotificationRead: vi.fn(async () => undefined),
    getActiveSiteBanner: vi.fn(async () => null),
  };
});

import { appRouter } from "./routers";
import * as db from "./db";

const base = { req: { protocol: "https", headers: {} }, res: { clearCookie: () => undefined } } as any;
const user = (role: "user" | "admin", id = role === "admin" ? 1 : 9) => ({
  id,
  openId: role,
  email: `${role}@example.com`,
  name: role === "admin" ? "Admin" : "Member",
  loginMethod: "manus",
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

const guest = appRouter.createCaller({ ...base, user: null });
const member = appRouter.createCaller({ ...base, user: user("user") });
const admin = appRouter.createCaller({ ...base, user: user("admin") });

const valid = { title: "Qadisha hike Saturday", message: "Seats are open, book now.", audience: "all" as const };

describe("custom notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires sign-in for the member inbox", async () => {
    await expect(guest.notifications.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(guest.notifications.unreadCount()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("lets anyone read the public site banner", async () => {
    await expect(guest.notifications.siteBanner()).resolves.toBeNull();
  });

  it("returns the unread count for the signed-in member only", async () => {
    await expect(member.notifications.unreadCount()).resolves.toBe(3);
    expect(db.getUnreadNotificationCount).toHaveBeenCalledWith(9);
  });

  it("scopes mark-as-read to the signed-in member", async () => {
    await member.notifications.markRead({ id: 5 });
    expect(db.markNotificationRead).toHaveBeenCalledWith(9, 5);
  });

  it("blocks regular members from creating or sending notifications", async () => {
    await expect(member.admin.createBroadcast(valid)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(member.admin.sendBroadcast({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(member.admin.previewRecipients({ audience: "all" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("saves a draft without sending it", async () => {
    const result = await admin.admin.createBroadcast(valid);
    expect(result).toEqual({ id: 42, sent: false, recipients: 0 });
    expect(db.sendBroadcast).not.toHaveBeenCalled();
  });

  it("creates and sends immediately with the chosen options", async () => {
    const result = await admin.admin.createBroadcast({ ...valid, type: "offer", link: "/trails", showPopup: true, showBanner: true, bannerDays: 3, sendNow: true });
    expect(result).toEqual({ id: 42, sent: true, recipients: 7 });
    const row = vi.mocked(db.createBroadcast).mock.calls[0][0];
    expect(row).toMatchObject({ type: "offer", link: "/trails", showPopup: true, showBanner: true, status: "draft" });
    expect(row.bannerExpiresAt).toBeInstanceOf(Date);
    expect(db.sendBroadcast).toHaveBeenCalledWith(42);
  });

  it("requires a trip or member when targeting one", async () => {
    await expect(admin.admin.createBroadcast({ ...valid, audience: "trip" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(admin.admin.createBroadcast({ ...valid, audience: "user" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("only allows the website banner when sending to everyone", async () => {
    await expect(admin.admin.createBroadcast({ ...valid, audience: "booked", showBanner: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects unsafe links and empty messages", async () => {
    await expect(admin.admin.createBroadcast({ ...valid, link: "javascript:alert(1)" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(admin.admin.createBroadcast({ ...valid, link: "http://example.com" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(admin.admin.createBroadcast({ ...valid, message: "   " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("accepts https links", async () => {
    await expect(admin.admin.createBroadcast({ ...valid, link: "https://wa.me/96176828401" })).resolves.toMatchObject({ id: 42 });
  });
});
