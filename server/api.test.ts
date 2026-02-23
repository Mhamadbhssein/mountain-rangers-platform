import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Unit tests for Mountain Rangers tRPC API.
 * We mock the db module to avoid real database calls.
 */

// Mock db module
vi.mock("./db", () => ({
  getAllTrips: vi.fn(),
  getTripById: vi.fn(),
  getBookedSeatsForTrip: vi.fn(),
  createBooking: vi.fn(),
  getUserBookings: vi.fn(),
  cancelBooking: vi.fn(),
  getAllPosts: vi.fn(),
  createPost: vi.fn(),
  toggleLike: vi.fn(),
  getUserLikedPosts: vi.fn(),
  getOrCreateLoyalty: vi.fn(),
  addLoyaltyPoints: vi.fn(),
  requestNfcCard: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import {
  getAllTrips,
  getTripById,
  getBookedSeatsForTrip,
  createBooking,
  getUserBookings,
  cancelBooking,
  getAllPosts,
  createPost,
  toggleLike,
  getUserLikedPosts,
  getOrCreateLoyalty,
  addLoyaltyPoints,
  requestNfcCard,
} from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* ============================================================
 * Trips
 * ============================================================ */
describe("trips.list", () => {
  it("returns all trips with availability info", async () => {
    const mockTrips = [
      { id: 1, title: "Qadisha Valley", totalSeats: 24, date: new Date() },
      { id: 2, title: "Baatara Gorge", totalSeats: 24, date: new Date() },
    ];
    vi.mocked(getAllTrips).mockResolvedValue(mockTrips as any);
    vi.mocked(getBookedSeatsForTrip).mockResolvedValueOnce([1, 2, 3]).mockResolvedValueOnce([5, 6]);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.trips.list();

    expect(result).toHaveLength(2);
    expect(result[0].bookedSeatsCount).toBe(3);
    expect(result[0].availableSeats).toBe(21);
    expect(result[1].bookedSeatsCount).toBe(2);
    expect(result[1].availableSeats).toBe(22);
  });

  it("returns empty array when no trips exist", async () => {
    vi.mocked(getAllTrips).mockResolvedValue([]);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.trips.list();

    expect(result).toEqual([]);
  });
});

describe("trips.getById", () => {
  it("returns trip with booked seats", async () => {
    const mockTrip = { id: 1, title: "Qadisha Valley", totalSeats: 24 };
    vi.mocked(getTripById).mockResolvedValue(mockTrip as any);
    vi.mocked(getBookedSeatsForTrip).mockResolvedValue([1, 2, 5, 6]);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.trips.getById({ id: 1 });

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Qadisha Valley");
    expect(result!.bookedSeats).toEqual([1, 2, 5, 6]);
    expect(result!.availableSeats).toBe(20);
  });

  it("returns null for non-existent trip", async () => {
    vi.mocked(getTripById).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.trips.getById({ id: 999 });

    expect(result).toBeNull();
  });
});

describe("trips.getBookedSeats", () => {
  it("returns booked seat numbers for a trip", async () => {
    vi.mocked(getBookedSeatsForTrip).mockResolvedValue([1, 3, 5, 7]);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.trips.getBookedSeats({ tripId: 1 });

    expect(result).toEqual([1, 3, 5, 7]);
  });
});

/* ============================================================
 * Bookings
 * ============================================================ */
describe("bookings.create", () => {
  it("creates a booking when seats are available", async () => {
    vi.mocked(getBookedSeatsForTrip).mockResolvedValue([1, 2, 3]);
    vi.mocked(createBooking).mockResolvedValue({ id: 10, referenceCode: "MR-ABC12345" });
    vi.mocked(getOrCreateLoyalty).mockResolvedValue({} as any);
    vi.mocked(addLoyaltyPoints).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.bookings.create({
      tripId: 1,
      passengers: 2,
      seats: [5, 6],
      totalPrice: 90,
      paymentMethod: "Cash on Bus",
    });

    expect(result.referenceCode).toBe("MR-ABC12345");
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        tripId: 1,
        passengers: 2,
        seats: [5, 6],
        totalPrice: 90,
      })
    );
  });

  it("throws error when seats are already booked", async () => {
    vi.mocked(getBookedSeatsForTrip).mockResolvedValue([1, 2, 5]);

    const caller = appRouter.createCaller(createAuthContext());

    await expect(
      caller.bookings.create({
        tripId: 1,
        passengers: 2,
        seats: [5, 6],
        totalPrice: 90,
      })
    ).rejects.toThrow("Some selected seats are already booked");
  });
});

describe("bookings.myBookings", () => {
  it("returns user bookings with trip info", async () => {
    const mockBookings = [
      {
        booking: { id: 1, tripId: 1, passengers: 2, status: "confirmed" },
        trip: { id: 1, title: "Qadisha Valley" },
      },
    ];
    vi.mocked(getUserBookings).mockResolvedValue(mockBookings as any);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.bookings.myBookings();

    expect(result).toHaveLength(1);
    expect(getUserBookings).toHaveBeenCalledWith(1);
  });
});

describe("bookings.cancel", () => {
  it("cancels a booking", async () => {
    vi.mocked(cancelBooking).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.bookings.cancel({ bookingId: 1 });

    expect(result).toEqual({ success: true });
    expect(cancelBooking).toHaveBeenCalledWith(1, 1);
  });
});

/* ============================================================
 * Community
 * ============================================================ */
describe("community.posts", () => {
  it("returns posts with like status for authenticated users", async () => {
    const mockPosts = [
      {
        post: { id: 1, content: "Great hike!", likesCount: 5, commentsCount: 2 },
        author: { id: 2, name: "Sarah", avatarUrl: null },
      },
      {
        post: { id: 2, content: "Amazing view!", likesCount: 10, commentsCount: 3 },
        author: { id: 3, name: "Ahmad", avatarUrl: null },
      },
    ];
    vi.mocked(getAllPosts).mockResolvedValue(mockPosts as any);
    vi.mocked(getUserLikedPosts).mockResolvedValue([1]);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.community.posts();

    expect(result).toHaveLength(2);
    expect(result[0].isLiked).toBe(true);
    expect(result[1].isLiked).toBe(false);
  });

  it("returns posts without like status for unauthenticated users", async () => {
    const mockPosts = [
      {
        post: { id: 1, content: "Great hike!", likesCount: 5, commentsCount: 2 },
        author: { id: 2, name: "Sarah", avatarUrl: null },
      },
    ];
    vi.mocked(getAllPosts).mockResolvedValue(mockPosts as any);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.community.posts();

    expect(result).toHaveLength(1);
    expect(result[0].isLiked).toBe(false);
    expect(getUserLikedPosts).not.toHaveBeenCalled();
  });
});

describe("community.toggleLike", () => {
  it("toggles like on a post", async () => {
    vi.mocked(toggleLike).mockResolvedValue(true);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.community.toggleLike({ postId: 1 });

    expect(result).toEqual({ liked: true });
    expect(toggleLike).toHaveBeenCalledWith(1, 1);
  });
});

describe("community.createPost", () => {
  it("creates a community post", async () => {
    vi.mocked(createPost).mockResolvedValue(5);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.community.createPost({
      content: "What a beautiful hike!",
      tripTitle: "Qadisha Valley",
    });

    expect(result).toEqual({ id: 5 });
    expect(createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        content: "What a beautiful hike!",
        tripTitle: "Qadisha Valley",
      })
    );
  });
});

/* ============================================================
 * Loyalty
 * ============================================================ */
describe("loyalty.get", () => {
  it("returns loyalty data for authenticated user", async () => {
    const mockLoyalty = {
      id: 1,
      userId: 1,
      points: 2450,
      level: "Trail Blazer",
      tripsCompleted: 12,
      badges: [{ name: "First Summit", icon: "mountain", earned: true }],
      nfcCardRequested: false,
    };
    vi.mocked(getOrCreateLoyalty).mockResolvedValue(mockLoyalty as any);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.loyalty.get();

    expect(result.points).toBe(2450);
    expect(result.level).toBe("Trail Blazer");
    expect(getOrCreateLoyalty).toHaveBeenCalledWith(1);
  });
});

describe("loyalty.requestNfcCard", () => {
  it("requests an NFC card", async () => {
    vi.mocked(requestNfcCard).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.loyalty.requestNfcCard();

    expect(result).toEqual({ success: true });
    expect(requestNfcCard).toHaveBeenCalledWith(1);
  });
});

/* ============================================================
 * Auth
 * ============================================================ */
describe("auth.me", () => {
  it("returns user for authenticated context", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.me();

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test User");
    expect(result!.email).toBe("test@example.com");
  });

  it("returns null for unauthenticated context", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});
