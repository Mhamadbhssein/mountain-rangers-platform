import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/* ============================================================
 * Test helpers
 * ============================================================ */
function makeCtx(role: "admin" | "user" | null): TrpcContext {
  const user =
    role === null
      ? null
      : {
          id: role === "admin" ? 1 : 2,
          openId: role === "admin" ? "admin-open-id" : "user-open-id",
          email: `${role}@example.com`,
          name: role === "admin" ? "Admin User" : "Regular User",
          loginMethod: "manus",
          role: role as "admin" | "user",
          avatarUrl: null,
          phone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

/* ============================================================
 * Auth tests
 * ============================================================ */
describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("user");
  });

  it("returns admin user with correct role", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.auth.me();
    expect(result?.role).toBe("admin");
  });
});

/* ============================================================
 * Admin guard tests
 * ============================================================ */
describe("admin guard", () => {
  it("blocks non-admin users from admin.stats", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.stats()).rejects.toThrow("Admin access required");
  });

  it("blocks unauthenticated users from admin.stats", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("blocks non-admin from allUsers", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.allUsers()).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from allLoyalty", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.allLoyalty()).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from allPosts", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.allPosts()).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from allBookings", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.allBookings()).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from createTrip", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.admin.createTrip({
        title: "Test",
        location: "Test",
        date: new Date(),
        time: "08:00",
        duration: "6h",
        difficulty: "Easy",
        price: "50",
        totalSeats: 24,
      })
    ).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from deleteTrip", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.deleteTrip({ tripId: 1 })).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from updateUserRole", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.admin.updateUserRole({ userId: 2, role: "admin" })
    ).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from adjustPoints", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.admin.adjustPoints({ userId: 2, points: 100 })
    ).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from approveNfcCard", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.admin.approveNfcCard({ loyaltyId: 1 })
    ).rejects.toThrow("Admin access required");
  });

  it("blocks non-admin from deletePost", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.admin.deletePost({ postId: 1 })
    ).rejects.toThrow("Admin access required");
  });
});

/* ============================================================
 * Public trips tests
 * ============================================================ */
describe("trips.list (public)", () => {
  it("is accessible without authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    // Should not throw even without DB (returns empty array)
    const result = await caller.trips.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("is accessible to regular users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.trips.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

/* ============================================================
 * Community tests
 * ============================================================ */
describe("community.posts (public)", () => {
  it("is accessible without authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.community.posts();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("community.createPost (protected)", () => {
  it("blocks unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.community.createPost({ content: "Hello" })
    ).rejects.toThrow();
  });
});

/* ============================================================
 * Bookings tests
 * ============================================================ */
describe("bookings.myBookings (protected)", () => {
  it("blocks unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.bookings.myBookings()).rejects.toThrow();
  });

  it("allows authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.bookings.myBookings();
    expect(Array.isArray(result)).toBe(true);
  });
});

/* ============================================================
 * Loyalty tests
 * ============================================================ */
describe("loyalty.myProfile (protected)", () => {
  it("blocks unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.loyalty.myProfile()).rejects.toThrow();
  });
});
