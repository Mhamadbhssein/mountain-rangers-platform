import { eq, desc, and, sql, asc, count, sum, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  trips,
  bookings,
  communityPosts,
  postLikes,
  postComments,
  loyalty,
  tripReviews,
  trailCatalog,
  trailRecordings,
  trailSubscriptions,
  challenges,
  rewards,
  userRewards,
  broadcasts,
  homeBanners,
  gearChecklists,
  userChallenges,
  userFollows,
  notifications,
  type InsertTrip,
  type InsertBooking,
  type InsertCommunityPost,
  type InsertPostComment,
  type InsertTrailCatalog,
  type InsertTrailRecording,
  type InsertChallenge,
  type InsertReward,
  type InsertBroadcast,
  type Broadcast,
  type InsertHomeBanner,
  type InsertGearChecklist,
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
  phone?: string;
  hikingSticks?: number;
  passengerDetails?: { name: string; phone: string }[];
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
    phone: data.phone ?? null,
    hikingSticks: data.hikingSticks ?? 0,
    passengerDetails: data.passengerDetails ?? null,
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
    .select({ booking: bookings, trip: trips, review: tripReviews })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .leftJoin(tripReviews, eq(bookings.id, tripReviews.bookingId))
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
  await notifyBookingStatus(bookingId, "cancelled");
}

export async function adminUpdateBookingStatus(
  bookingId: number,
  status: "confirmed" | "pending" | "completed" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If completing a booking, award loyalty points to the booking owner
  if (status === "completed") {
    const booking = await db
      .select({ userId: bookings.userId, currentStatus: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking.length > 0 && booking[0].currentStatus !== "completed") {
      const userId = booking[0].userId;
      try {
        await getOrCreateLoyalty(userId);
        await addLoyaltyPoints(userId, 100);
      } catch (e) {
        console.warn("[Loyalty] Failed to award points on completion:", e);
      }
    }
  }

  await db.update(bookings).set({ status }).where(eq(bookings.id, bookingId));
  await notifyBookingStatus(bookingId, status);
}

/** Sends the booking owner an automatic notification when an admin changes the status. */
export async function notifyBookingStatus(bookingId: number, status: "confirmed" | "pending" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) return;
  const rows = await db
    .select({ userId: bookings.userId, referenceCode: bookings.referenceCode, tripTitle: trips.title })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const row = rows[0];
  if (!row) return;
  const messages = {
    confirmed: { title: "Booking confirmed", message: `Your booking ${row.referenceCode} for ${row.tripTitle} is confirmed. Please arrive 30 minutes early.` },
    pending: { title: "Booking pending", message: `Your booking ${row.referenceCode} for ${row.tripTitle} is pending confirmation.` },
    completed: { title: "Trip completed", message: `Thanks for hiking ${row.tripTitle} with us. 100 loyalty points were added, and you can now write a review.` },
    cancelled: { title: "Booking cancelled", message: `Your booking ${row.referenceCode} for ${row.tripTitle} was cancelled. Contact us on WhatsApp for help.` },
  } as const;
  await createUserNotification({ userId: row.userId, type: "booking", ...messages[status], link: "/bookings" });
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
    .where(eq(communityPosts.status, "approved"))
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

export async function createTripReview(data: {
  bookingId: number;
  userId: number;
  tripId: number;
  tripTitle: string;
  rating: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const postId = await createPost({
    userId: data.userId,
    tripTitle: data.tripTitle,
    content: data.content,
  });

  const result = await db.insert(tripReviews).values({
    bookingId: data.bookingId,
    userId: data.userId,
    tripId: data.tripId,
    rating: data.rating,
    content: data.content,
    postId,
  });

  return { id: result[0].insertId, postId };
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

export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      comment: postComments,
      author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
    })
    .from(postComments)
    .innerJoin(users, eq(postComments.userId, users.id))
    .where(eq(postComments.postId, postId))
    .orderBy(desc(postComments.createdAt));
  return result;
}

export async function createComment(data: {
  userId: number;
  postId: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values: InsertPostComment = {
    userId: data.userId,
    postId: data.postId,
    content: data.content,
  };
  const result = await db.insert(postComments).values(values);
  await db
    .update(communityPosts)
    .set({ commentsCount: sql`${communityPosts.commentsCount} + 1` })
    .where(eq(communityPosts.id, data.postId));
  return result[0].insertId;
}

export async function deleteComment(commentId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postComments).where(eq(postComments.id, commentId));
  await db
    .update(communityPosts)
    .set({ commentsCount: sql`${communityPosts.commentsCount} - 1` })
    .where(eq(communityPosts.id, postId));
}

export async function getPendingPosts() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      post: communityPosts,
      author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .where(eq(communityPosts.status, "pending"))
    .orderBy(desc(communityPosts.createdAt));
  return result;
}

export async function approvePost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(communityPosts)
    .set({ status: "approved" })
    .where(eq(communityPosts.id, postId));
  const rows = await db.select({ userId: communityPosts.userId }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (rows[0]) {
    await createUserNotification({ userId: rows[0].userId, type: "community", title: "Your post is live", message: "Your community post was approved and is now visible in the feed.", link: "/community" });
  }
}

export async function rejectPost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(communityPosts)
    .set({ status: "rejected" })
    .where(eq(communityPosts.id, postId));
  const rows = await db.select({ userId: communityPosts.userId }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (rows[0]) {
    await createUserNotification({ userId: rows[0].userId, type: "community", title: "Post not approved", message: "Your community post was not approved. Contact us on WhatsApp if you have questions.", link: "/community" });
  }
}

/* ============================================================
 * Trail Explorer and Mission Control helpers
 * ============================================================ */
export async function getTrailCatalog() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trailCatalog).where(eq(trailCatalog.isActive, true)).orderBy(desc(trailCatalog.createdAt));
}

export async function getAllTrailCatalogAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trailCatalog).orderBy(desc(trailCatalog.createdAt));
}

export async function createTrailCatalog(data: InsertTrailCatalog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trailCatalog).values(data);
  return result[0].insertId;
}

export async function updateTrailCatalog(id: number, data: Partial<InsertTrailCatalog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trailCatalog).set(data).where(eq(trailCatalog.id, id));
}

export async function deleteTrailCatalog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trailCatalog).set({ isActive: false }).where(eq(trailCatalog.id, id));
}

export async function getUserTrailRecordings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ recording: trailRecordings, trail: trailCatalog })
    .from(trailRecordings)
    .leftJoin(trailCatalog, eq(trailRecordings.trailId, trailCatalog.id))
    .where(eq(trailRecordings.userId, userId))
    .orderBy(desc(trailRecordings.createdAt));
}

export async function createTrailRecording(data: InsertTrailRecording) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trailRecordings).values(data);
  return result[0].insertId;
}

export async function getAllTrailRecordingsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ recording: trailRecordings, user: { id: users.id, name: users.name }, trail: trailCatalog })
    .from(trailRecordings)
    .innerJoin(users, eq(trailRecordings.userId, users.id))
    .leftJoin(trailCatalog, eq(trailRecordings.trailId, trailCatalog.id))
    .orderBy(desc(trailRecordings.createdAt));
}

export async function getTrailSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(trailSubscriptions).where(eq(trailSubscriptions.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertTrailSubscription(userId: number, plan: "monthly" | "annual") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getTrailSubscription(userId);
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + (plan === "annual" ? 12 : 1));
  if (existing) {
    await db.update(trailSubscriptions).set({ plan, status: "active", renewalDate }).where(eq(trailSubscriptions.userId, userId));
    return { ...existing, plan, status: "active" as const, renewalDate };
  }
  const result = await db.insert(trailSubscriptions).values({ userId, plan, status: "active", renewalDate });
  return { id: result[0].insertId, userId, plan, status: "active" as const, renewalDate };
}

export async function getAllTrailSubscriptionsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ subscription: trailSubscriptions, user: { id: users.id, name: users.name, email: users.email } })
    .from(trailSubscriptions)
    .innerJoin(users, eq(trailSubscriptions.userId, users.id))
    .orderBy(desc(trailSubscriptions.createdAt));
}

export async function getChallenges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challenges).where(eq(challenges.isActive, true)).orderBy(desc(challenges.createdAt));
}

export async function getAllChallengesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challenges).orderBy(desc(challenges.createdAt));
}

export async function createChallenge(data: InsertChallenge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(challenges).values(data);
  return result[0].insertId;
}

export async function getRewards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewards).where(eq(rewards.isActive, true)).orderBy(asc(rewards.pointsCost));
}

export async function getAllRewardsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewards).orderBy(asc(rewards.pointsCost));
}

export async function createReward(data: InsertReward) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rewards).values(data);
  return result[0].insertId;
}

export async function redeemReward(userId: number, rewardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rewardRows = await db.select().from(rewards).where(eq(rewards.id, rewardId)).limit(1);
  if (!rewardRows[0]) throw new Error("Reward not found");
  const loyaltyRows = await db.select().from(loyalty).where(eq(loyalty.userId, userId)).limit(1);
  if (!loyaltyRows[0] || loyaltyRows[0].points < rewardRows[0].pointsCost) throw new Error("Not enough loyalty points");
  await db.update(loyalty).set({ points: sql`${loyalty.points} - ${rewardRows[0].pointsCost}` }).where(eq(loyalty.userId, userId));
  const result = await db.insert(userRewards).values({ userId, rewardId });
  await createUserNotification({ userId, type: "reward", title: "Reward redeemed", message: `You redeemed "${rewardRows[0].title}" for ${rewardRows[0].pointsCost} points. Show this at your next trip or contact us on WhatsApp.`, link: "/loyalty" });
  return result[0].insertId;
}

export async function getBroadcasts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt));
}

export async function createBroadcast(data: InsertBroadcast) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(broadcasts).values(data);
  return result[0].insertId;
}

export async function getActiveHomeBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(homeBanners).where(eq(homeBanners.isActive, true)).orderBy(asc(homeBanners.sortOrder));
}

export async function getAllHomeBannersAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(homeBanners).orderBy(asc(homeBanners.sortOrder));
}

export async function createHomeBanner(data: InsertHomeBanner) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(homeBanners).values(data);
  return result[0].insertId;
}

export async function getGearChecklists(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gearChecklists).where(eq(gearChecklists.userId, userId)).orderBy(desc(gearChecklists.updatedAt));
}

export async function createGearChecklist(data: InsertGearChecklist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gearChecklists).values(data);
  return result[0].insertId;
}

export async function updateGearChecklist(id: number, userId: number, items: { label: string; checked: boolean }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gearChecklists).set({ items }).where(and(eq(gearChecklists.id, id), eq(gearChecklists.userId, userId)));
}

export async function getAdminManifest() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ booking: bookings, trip: trips, user: { id: users.id, name: users.name, phone: users.phone } })
    .from(bookings)
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(ne(bookings.status, "cancelled"))
    .orderBy(asc(trips.date), asc(bookings.bookedAt));
}

export async function setBookingCheckedIn(bookingId: number, checkedIn: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ checkedIn }).where(eq(bookings.id, bookingId));
}

/* ============================================================
 * Round 20 — Base44 detail parity helpers
 * ============================================================ */
export async function getTrailById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(trailCatalog).where(eq(trailCatalog.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getTrailRecordingById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ recording: trailRecordings, trail: trailCatalog, user: { id: users.id, name: users.name } })
    .from(trailRecordings)
    .innerJoin(users, eq(trailRecordings.userId, users.id))
    .leftJoin(trailCatalog, eq(trailRecordings.trailId, trailCatalog.id))
    .where(eq(trailRecordings.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateUserProfile(userId: number, data: { name?: string; phone?: string | null; dateOfBirth?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

/** Aggregated activity used by Profile "Your Stats" and challenge progress. */
export async function getUserActivityStats(userId: number) {
  const db = await getDb();
  const empty = { tripsBooked: 0, tripsCompleted: 0, distanceKm: 0, elevationM: 0, trailMinutes: 0, recordings: 0, posts: 0, likesReceived: 0, followers: 0, following: 0, points: 0 };
  if (!db) return empty;
  const [bookingRow] = await db
    .select({
      tripsBooked: sql<number>`SUM(CASE WHEN ${bookings.status} <> 'cancelled' THEN 1 ELSE 0 END)`,
      tripsCompleted: sql<number>`SUM(CASE WHEN ${bookings.status} = 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(bookings)
    .where(eq(bookings.userId, userId));
  const [recordingRow] = await db
    .select({
      recordings: count(trailRecordings.id),
      distanceKm: sql<string>`COALESCE(SUM(${trailRecordings.distanceKm}), 0)`,
      elevationM: sql<number>`COALESCE(SUM(${trailRecordings.elevationM}), 0)`,
      trailMinutes: sql<number>`COALESCE(SUM(${trailRecordings.durationMinutes}), 0)`,
    })
    .from(trailRecordings)
    .where(eq(trailRecordings.userId, userId));
  const [postRow] = await db
    .select({ posts: count(communityPosts.id), likesReceived: sql<number>`COALESCE(SUM(${communityPosts.likesCount}), 0)` })
    .from(communityPosts)
    .where(and(eq(communityPosts.userId, userId), eq(communityPosts.status, "approved")));
  const [followerRow] = await db.select({ n: count(userFollows.id) }).from(userFollows).where(eq(userFollows.followingId, userId));
  const [followingRow] = await db.select({ n: count(userFollows.id) }).from(userFollows).where(eq(userFollows.followerId, userId));
  const loyaltyRow = await db.select({ points: loyalty.points }).from(loyalty).where(eq(loyalty.userId, userId)).limit(1);
  return {
    tripsBooked: Number(bookingRow?.tripsBooked ?? 0),
    tripsCompleted: Number(bookingRow?.tripsCompleted ?? 0),
    distanceKm: Math.round(parseFloat(String(recordingRow?.distanceKm ?? "0")) * 10) / 10,
    elevationM: Number(recordingRow?.elevationM ?? 0),
    trailMinutes: Number(recordingRow?.trailMinutes ?? 0),
    recordings: Number(recordingRow?.recordings ?? 0),
    posts: Number(postRow?.posts ?? 0),
    likesReceived: Number(postRow?.likesReceived ?? 0),
    followers: Number(followerRow?.n ?? 0),
    following: Number(followingRow?.n ?? 0),
    points: loyaltyRow[0]?.points ?? 0,
  };
}

export function challengeProgressValue(
  metric: "trips" | "distanceKm" | "elevationM" | "recordings",
  stats: { tripsCompleted: number; distanceKm: number; elevationM: number; recordings: number },
) {
  if (metric === "trips") return stats.tripsCompleted;
  if (metric === "distanceKm") return stats.distanceKm;
  if (metric === "elevationM") return stats.elevationM;
  return stats.recordings;
}

export async function getChallengesWithProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const [list, stats, claims] = await Promise.all([
    getChallenges(),
    getUserActivityStats(userId),
    db.select().from(userChallenges).where(eq(userChallenges.userId, userId)),
  ]);
  const claimed = new Set(claims.map((c) => c.challengeId));
  return list.map((challenge) => {
    const progress = challengeProgressValue(challenge.metric, stats);
    return {
      ...challenge,
      progress: Math.min(progress, challenge.target),
      completed: progress >= challenge.target,
      claimed: claimed.has(challenge.id),
    };
  });
}

export async function claimChallenge(userId: number, challengeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  const challenge = rows[0];
  if (!challenge || !challenge.isActive) throw new Error("Challenge not found");
  const existing = await db.select().from(userChallenges)
    .where(and(eq(userChallenges.userId, userId), eq(userChallenges.challengeId, challengeId))).limit(1);
  if (existing.length > 0) throw new Error("Challenge already claimed");
  const stats = await getUserActivityStats(userId);
  if (challengeProgressValue(challenge.metric, stats) < challenge.target) throw new Error("Challenge not completed yet");
  await getOrCreateLoyalty(userId);
  await db.update(loyalty).set({ points: sql`${loyalty.points} + ${challenge.rewardPoints}` }).where(eq(loyalty.userId, userId));
  await db.insert(userChallenges).values({ userId, challengeId });
  await createUserNotification({ userId, type: "reward", title: "Challenge completed", message: `You completed "${challenge.title}" and earned ${challenge.rewardPoints} loyalty points.`, link: "/loyalty" });
  return { pointsAwarded: challenge.rewardPoints };
}

export async function toggleFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (followerId === followingId) throw new Error("You cannot follow yourself");
  const existing = await db.select().from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId))).limit(1);
  if (existing.length > 0) {
    await db.delete(userFollows).where(eq(userFollows.id, existing[0].id));
    return false;
  }
  await db.insert(userFollows).values({ followerId, followingId });
  return true;
}

export async function getFollowingIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: userFollows.followingId }).from(userFollows).where(eq(userFollows.followerId, userId));
  return rows.map((r) => r.id);
}

/* ============================================================
 * Custom notifications
 * ============================================================ */
export const NOTIFICATION_TYPES = ["announcement", "trip", "offer", "reminder", "alert", "booking", "community", "reward"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Resolves the user ids a broadcast should be delivered to. */
export async function resolveBroadcastRecipients(broadcast: Pick<Broadcast, "audience" | "targetTripId" | "targetUserId">) {
  const db = await getDb();
  if (!db) return [] as number[];
  let rows: { id: number }[] = [];
  switch (broadcast.audience) {
    case "admins":
      rows = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
      break;
    case "booked":
      rows = await db.selectDistinct({ id: bookings.userId }).from(bookings).where(ne(bookings.status, "cancelled"));
      break;
    case "members":
      rows = await db.select({ id: trailSubscriptions.userId }).from(trailSubscriptions).where(eq(trailSubscriptions.status, "active"));
      break;
    case "trip":
      if (!broadcast.targetTripId) return [];
      rows = await db.selectDistinct({ id: bookings.userId }).from(bookings)
        .where(and(eq(bookings.tripId, broadcast.targetTripId), ne(bookings.status, "cancelled")));
      break;
    case "user":
      if (!broadcast.targetUserId) return [];
      rows = await db.select({ id: users.id }).from(users).where(eq(users.id, broadcast.targetUserId));
      break;
    default:
      rows = await db.select({ id: users.id }).from(users);
  }
  return Array.from(new Set(rows.map((r) => r.id)));
}

export async function previewBroadcastRecipients(input: Pick<Broadcast, "audience" | "targetTripId" | "targetUserId">) {
  return (await resolveBroadcastRecipients(input)).length;
}

/** Delivers a draft broadcast as in-app notifications to its audience. */
export async function sendBroadcast(broadcastId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(broadcasts).where(eq(broadcasts.id, broadcastId)).limit(1);
  const broadcast = rows[0];
  if (!broadcast) throw new Error("Notification not found");
  if (broadcast.status === "sent") throw new Error("Notification already sent");
  const recipients = await resolveBroadcastRecipients(broadcast);
  for (let i = 0; i < recipients.length; i += 500) {
    await db.insert(notifications).values(recipients.slice(i, i + 500).map((userId) => ({
      userId,
      broadcastId,
      type: broadcast.type,
      title: broadcast.title,
      message: broadcast.message,
      link: broadcast.link,
      showPopup: broadcast.showPopup,
    })));
  }
  await db.update(broadcasts).set({ status: "sent", sentAt: new Date(), recipientCount: recipients.length }).where(eq(broadcasts.id, broadcastId));
  return { recipients: recipients.length };
}

export async function updateBroadcastDraft(id: number, data: Partial<InsertBroadcast>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select({ status: broadcasts.status }).from(broadcasts).where(eq(broadcasts.id, id)).limit(1);
  if (!rows[0]) throw new Error("Notification not found");
  if (rows[0].status === "sent") throw new Error("Sent notifications cannot be edited");
  await db.update(broadcasts).set(data).where(eq(broadcasts.id, id));
}

export async function deleteBroadcast(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notifications).where(eq(notifications.broadcastId, id));
  await db.delete(broadcasts).where(eq(broadcasts.id, id));
}

/** Ends the site-wide banner for a sent broadcast. */
export async function endBroadcastBanner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(broadcasts).set({ showBanner: false }).where(eq(broadcasts.id, id));
}

/** Read statistics for each sent broadcast. */
export async function getBroadcastReadStats() {
  const db = await getDb();
  if (!db) return [] as { broadcastId: number; delivered: number; read: number }[];
  const rows = await db
    .select({
      broadcastId: notifications.broadcastId,
      delivered: count(notifications.id),
      read: sql<number>`SUM(CASE WHEN ${notifications.isRead} = true THEN 1 ELSE 0 END)`,
    })
    .from(notifications)
    .where(sql`${notifications.broadcastId} IS NOT NULL`)
    .groupBy(notifications.broadcastId);
  return rows.map((r) => ({ broadcastId: Number(r.broadcastId), delivered: Number(r.delivered), read: Number(r.read ?? 0) }));
}

/** Active site banner: latest sent broadcast with a banner that has not expired. Audience "all" only, so it is safe to show publicly. */
export async function getActiveSiteBanner() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ id: broadcasts.id, title: broadcasts.title, message: broadcasts.message, type: broadcasts.type, link: broadcasts.link, sentAt: broadcasts.sentAt })
    .from(broadcasts)
    .where(and(
      eq(broadcasts.status, "sent"),
      eq(broadcasts.showBanner, true),
      eq(broadcasts.audience, "all"),
      sql`(${broadcasts.bannerExpiresAt} IS NULL OR ${broadcasts.bannerExpiresAt} > NOW())`,
    ))
    .orderBy(desc(broadcasts.sentAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Creates a single automatic notification for one member (booking updates, post moderation, rewards). */
export async function createUserNotification(data: { userId: number; type: NotificationType; title: string; message: string; link?: string | null; showPopup?: boolean }) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(notifications).values({ ...data, link: data.link ?? null, showPopup: data.showPopup ?? false });
  } catch (error) {
    console.warn("[Notifications] Failed to create notification:", error);
  }
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ n: count(notifications.id) }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(row?.n ?? 0);
}

/** Latest unread pop-up notification for the member, if any. */
export async function getPendingPopup(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false), eq(notifications.showPopup, true)))
    .orderBy(desc(notifications.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function markNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function markNotificationRead(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function deleteUserNotification(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function clearUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notifications).where(eq(notifications.userId, userId));
}

/** Extra Mission Control overview data: status breakdown, MRR, 6-month revenue, upcoming trips. */
export async function getMissionControlOverview() {
  const db = await getDb();
  const empty = { statusCounts: { pending: 0, confirmed: 0, checkedIn: 0, cancelled: 0, completed: 0 }, trailSubsMrr: 0, revenueByMonth: [] as { month: string; revenue: number }[], upcomingTrips: [] as any[] };
  if (!db) return empty;
  const [statusRow] = await db
    .select({
      pending: sql<number>`SUM(CASE WHEN ${bookings.status} = 'pending' THEN 1 ELSE 0 END)`,
      confirmed: sql<number>`SUM(CASE WHEN ${bookings.status} = 'confirmed' AND ${bookings.checkedIn} = false THEN 1 ELSE 0 END)`,
      checkedIn: sql<number>`SUM(CASE WHEN ${bookings.checkedIn} = true AND ${bookings.status} <> 'cancelled' THEN 1 ELSE 0 END)`,
      cancelled: sql<number>`SUM(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 ELSE 0 END)`,
      completed: sql<number>`SUM(CASE WHEN ${bookings.status} = 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(bookings);
  const subs = await db.select({ plan: trailSubscriptions.plan }).from(trailSubscriptions).where(eq(trailSubscriptions.status, "active"));
  const trailSubsMrr = subs.reduce((total, s) => total + (s.plan === "annual" ? 40 / 12 : 4), 0);
  const since = new Date();
  since.setMonth(since.getMonth() - 5, 1);
  since.setHours(0, 0, 0, 0);
  const revenueRows = await db
    .select({ bookedAt: bookings.bookedAt, totalPrice: bookings.totalPrice, status: bookings.status })
    .from(bookings)
    .where(sql`${bookings.bookedAt} >= ${since}`);
  const months: { key: string; month: string; revenue: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), revenue: 0 });
  }
  for (const row of revenueRows) {
    if (row.status !== "confirmed" && row.status !== "completed") continue;
    const d = new Date(row.bookedAt);
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.revenue += parseFloat(String(row.totalPrice ?? "0"));
  }
  const upcomingTrips = await db
    .select({ id: trips.id, title: trips.title, date: trips.date, time: trips.time, totalSeats: trips.totalSeats })
    .from(trips)
    .where(and(eq(trips.isActive, true), sql`${trips.date} >= NOW()`))
    .orderBy(asc(trips.date))
    .limit(5);
  return {
    statusCounts: {
      pending: Number(statusRow?.pending ?? 0),
      confirmed: Number(statusRow?.confirmed ?? 0),
      checkedIn: Number(statusRow?.checkedIn ?? 0),
      cancelled: Number(statusRow?.cancelled ?? 0),
      completed: Number(statusRow?.completed ?? 0),
    },
    trailSubsMrr: Math.round(trailSubsMrr * 100) / 100,
    revenueByMonth: months.map(({ month, revenue }) => ({ month, revenue: Math.round(revenue * 100) / 100 })),
    upcomingTrips,
  };
}

export async function setTrailActive(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trailCatalog).set({ isActive }).where(eq(trailCatalog.id, id));
}

export async function getLoyaltyLeaderboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ userId: users.id, name: users.name, avatarUrl: users.avatarUrl, points: loyalty.points, level: loyalty.level, tripsCompleted: loyalty.tripsCompleted })
    .from(loyalty)
    .innerJoin(users, eq(loyalty.userId, users.id))
    .orderBy(desc(loyalty.points))
    .limit(limit);
}

export async function getCommunityStats() {
  const db = await getDb();
  if (!db) return { members: 0, posts: 0, avgRating: null as number | null };
  const [memberRow] = await db.select({ n: count(users.id) }).from(users);
  const [postRow] = await db.select({ n: count(communityPosts.id) }).from(communityPosts).where(eq(communityPosts.status, "approved"));
  const [ratingRow] = await db.select({ avg: sql<string | null>`AVG(${tripReviews.rating})` }).from(tripReviews);
  const avg = ratingRow?.avg != null ? Math.round(parseFloat(String(ratingRow.avg)) * 10) / 10 : null;
  return { members: Number(memberRow?.n ?? 0), posts: Number(postRow?.n ?? 0), avgRating: avg };
}
