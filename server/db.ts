import { eq, desc, and, sql, asc, count, sum, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  trips,
  bookings,
  communityPosts,
  postLikes,
  loyalty,
  type InsertTrip,
  type InsertBooking,
  type InsertCommunityPost,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/* ============================================================
 * User helpers
 * ============================================================ */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/* ============================================================
 * Trip helpers
 * ============================================================ */
export async function getAllTrips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.isActive, true)).orderBy(trips.date);
}

export async function getAllTripsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).orderBy(asc(trips.date));
}

export async function getTripById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTrip(trip: InsertTrip) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trips).values(trip);
  return result[0].insertId;
}

export async function updateTrip(id: number, data: Partial<InsertTrip>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trips).set(data).where(eq(trips.id, id));
}

export async function deleteTrip(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete by deactivating
  await db.update(trips).set({ isActive: false }).where(eq(trips.id, id));
}

export async function toggleTripStatus(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trips).set({ isActive }).where(eq(trips.id, id));
}

export async function getBookedSeatsForTrip(tripId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ seats: bookings.seats })
    .from(bookings)
    .where(and(eq(bookings.tripId, tripId), sql`${bookings.status} IN ('confirmed', 'pending')`));
  const allSeats: number[] = [];
  for (const row of result) {
    if (Array.isArray(row.seats)) allSeats.push(...row.seats);
  }
  return allSeats;
}

/* ============================================================
 * Booking helpers
 * ============================================================ */
export async function createBooking(data: {
  userId: number;
  tripId: number;
  passengers: number;
  seats: number[];
  totalPrice: number;
  paymentMethod?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const referenceCode = `MR-${nanoid(8).toUpperCase()}`;

  const values: InsertBooking = {
    userId: data.userId,
    tripId: data.tripId,
    passengers: data.passengers,
    seats: data.seats,
    totalPrice: String(data.totalPrice),
    paymentMethod: data.paymentMethod ?? "Cash on Bus",
    referenceCode,
    status: "confirmed",
  };

  const result = await db.insert(bookings).values(values);
  return { id: result[0].insertId, referenceCode };
}

export async function getUserBookings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ booking: bookings, trip: trips })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.bookedAt));
  return result;
}

export async function cancelBooking(bookingId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)));
}

/* Admin booking helpers */
export async function getAllBookingsAdmin() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      booking: bookings,
      trip: trips,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
    })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .orderBy(desc(bookings.bookedAt));
  return result;
}

export async function getBookingsForTrip(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      booking: bookings,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.tripId, tripId))
    .orderBy(asc(bookings.bookedAt));
  return result;
}

export async function adminCancelBooking(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, bookingId));
}

export async function adminUpdateBookingStatus(
  bookingId: number,
  status: "confirmed" | "pending" | "completed" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ status }).where(eq(bookings.id, bookingId));
}

/* ============================================================
 * Analytics helpers
 * ============================================================ */
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalBookings: 0, totalRevenue: 0, activeTrips: 0, totalUsers: 0, confirmedBookings: 0 };

  const [bookingStats] = await db
    .select({
      totalBookings: count(bookings.id),
      confirmedBookings: sql<number>`SUM(CASE WHEN ${bookings.status} IN ('confirmed','completed') THEN 1 ELSE 0 END)`,
      totalRevenue: sql<string>`SUM(CASE WHEN ${bookings.status} IN ('confirmed','completed') THEN ${bookings.totalPrice} ELSE 0 END)`,
    })
    .from(bookings);

  const [tripStats] = await db
    .select({ activeTrips: count(trips.id) })
    .from(trips)
    .where(eq(trips.isActive, true));

  const [userStats] = await db.select({ totalUsers: count(users.id) }).from(users);

  return {
    totalBookings: Number(bookingStats?.totalBookings ?? 0),
    confirmedBookings: Number(bookingStats?.confirmedBookings ?? 0),
    totalRevenue: parseFloat(String(bookingStats?.totalRevenue ?? "0")),
    activeTrips: Number(tripStats?.activeTrips ?? 0),
    totalUsers: Number(userStats?.totalUsers ?? 0),
  };
}

export async function getRevenueByTrip() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      tripId: trips.id,
      tripTitle: trips.title,
      bookingCount: count(bookings.id),
      revenue: sql<string>`SUM(CASE WHEN ${bookings.status} IN ('confirmed','completed') THEN ${bookings.totalPrice} ELSE 0 END)`,
      confirmedCount: sql<number>`SUM(CASE WHEN ${bookings.status} IN ('confirmed','completed') THEN 1 ELSE 0 END)`,
    })
    .from(trips)
    .leftJoin(bookings, eq(trips.id, bookings.tripId))
    .groupBy(trips.id, trips.title)
    .orderBy(desc(trips.date));
  return result.map((r) => ({
    ...r,
    revenue: parseFloat(String(r.revenue ?? "0")),
    bookingCount: Number(r.bookingCount),
    confirmedCount: Number(r.confirmedCount),
  }));
}

export async function getRecentBookings(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      booking: bookings,
      trip: { id: trips.id, title: trips.title },
      user: { id: users.id, name: users.name },
    })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .orderBy(desc(bookings.bookedAt))
    .limit(limit);
  return result;
}

/* ============================================================
 * Community helpers
 * ============================================================ */
export async function getAllPosts() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      post: communityPosts,
      author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .orderBy(desc(communityPosts.createdAt));
  return result;
}

export async function createPost(data: {
  userId: number;
  tripTitle?: string;
  content: string;
  images?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values: InsertCommunityPost = {
    userId: data.userId,
    tripTitle: data.tripTitle ?? null,
    content: data.content,
    images: data.images ?? [],
  };
  const result = await db.insert(communityPosts).values(values);
  return result[0].insertId;
}

export async function deletePost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete likes first
  await db.delete(postLikes).where(eq(postLikes.postId, postId));
  await db.delete(communityPosts).where(eq(communityPosts.id, postId));
}

export async function toggleLike(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
    await db
      .update(communityPosts)
      .set({ likesCount: sql`${communityPosts.likesCount} - 1` })
      .where(eq(communityPosts.id, postId));
    return false;
  } else {
    await db.insert(postLikes).values({ userId, postId });
    await db
      .update(communityPosts)
      .set({ likesCount: sql`${communityPosts.likesCount} + 1` })
      .where(eq(communityPosts.id, postId));
    return true;
  }
}

export async function getUserLikedPosts(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(eq(postLikes.userId, userId));
  return result.map((r) => r.postId);
}

/* ============================================================
 * User management helpers (admin)
 * ============================================================ */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  // Enrich with booking count and loyalty points
  const enriched = await Promise.all(
    allUsers.map(async (user) => {
      const userBookings = await db!
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.userId, user.id));
      const loyaltyRow = await db!
        .select({ points: loyalty.points })
        .from(loyalty)
        .where(eq(loyalty.userId, user.id))
        .limit(1);
      return {
        ...user,
        bookingCount: userBookings.length,
        loyaltyPoints: loyaltyRow[0]?.points ?? 0,
      };
    })
  );
  return enriched;
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

/* ============================================================
 * Loyalty helpers
 * ============================================================ */
export async function getOrCreateLoyalty(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(loyalty).where(eq(loyalty.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];

  const defaultBadges = [
    { name: "First Summit", icon: "mountain", earned: false },
    { name: "Early Bird", icon: "sunrise", earned: false },
    { name: "Social Hiker", icon: "users", earned: false },
    { name: "5 Trips Club", icon: "award", earned: false },
    { name: "10 Trips Legend", icon: "trophy", earned: false },
    { name: "Cedar Guardian", icon: "tree-pine", earned: false },
    { name: "All Regions", icon: "map", earned: false },
    { name: "Mountain Legend", icon: "crown", earned: false },
  ];

  await db.insert(loyalty).values({
    userId,
    points: 0,
    level: "Explorer",
    tripsCompleted: 0,
    badges: defaultBadges,
    nfcCardRequested: false,
  });

  const result = await db.select().from(loyalty).where(eq(loyalty.userId, userId)).limit(1);
  return result[0];
}

export async function addLoyaltyPoints(userId: number, points: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(loyalty)
    .set({
      points: sql`${loyalty.points} + ${points}`,
      tripsCompleted: sql`${loyalty.tripsCompleted} + 1`,
    })
    .where(eq(loyalty.userId, userId));

  const updated = await db.select().from(loyalty).where(eq(loyalty.userId, userId)).limit(1);
  if (updated.length > 0) {
    const totalPoints = updated[0].points;
    let newLevel: "Explorer" | "Trail Blazer" | "Summit Seeker" | "Mountain Legend" = "Explorer";
    if (totalPoints >= 10000) newLevel = "Mountain Legend";
    else if (totalPoints >= 5000) newLevel = "Summit Seeker";
    else if (totalPoints >= 1000) newLevel = "Trail Blazer";

    if (newLevel !== updated[0].level) {
      await db.update(loyalty).set({ level: newLevel }).where(eq(loyalty.userId, userId));
    }
  }
}

export async function requestNfcCard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(loyalty).set({ nfcCardRequested: true }).where(eq(loyalty.userId, userId));
}

export async function getAllLoyaltyProfiles() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      loyalty: loyalty,
      user: { id: users.id, name: users.name, email: users.email },
    })
    .from(loyalty)
    .innerJoin(users, eq(loyalty.userId, users.id))
    .orderBy(desc(loyalty.points));
  return result;
}

export async function approveNfcCard(loyaltyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Mark as processed (reset request flag - card has been issued)
  await db.update(loyalty).set({ nfcCardRequested: false }).where(eq(loyalty.id, loyaltyId));
}

export async function adminAdjustPoints(userId: number, points: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(loyalty)
    .set({ points: sql`${loyalty.points} + ${points}` })
    .where(eq(loyalty.userId, userId));
}
