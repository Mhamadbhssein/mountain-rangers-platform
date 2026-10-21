import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
  float,
} from "drizzle-orm/mysql-core";

/* ============================================================
 * Users — Core auth table (extended with profile fields)
 * ============================================================ */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  phone: varchar("phone", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ============================================================
 * Trips — Hiking trip listings
 * ============================================================ */
export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  time: varchar("time", { length: 32 }).notNull(),
  duration: varchar("duration", { length: 64 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["Easy", "Moderate", "Hard", "Expert"])
    .default("Moderate")
    .notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  imageUrl: text("imageUrl"),
  additionalImages: json("additionalImages").$type<string[]>(),
  description: text("description"),
  highlights: json("highlights").$type<string[]>(),
  included: json("included").$type<string[]>(),
  meetingPoint: varchar("meetingPoint", { length: 255 }),
  meetingPointLat: float("meetingPointLat"),
  meetingPointLng: float("meetingPointLng"),
  totalSeats: int("totalSeats").default(27).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: int("reviewCount").default(0),
  elevation: varchar("elevation", { length: 32 }),
  distance: varchar("distance", { length: 32 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

/* ============================================================
 * Bookings — Reservation records
 * ============================================================ */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tripId: int("tripId").notNull(),
  passengers: int("passengers").default(1).notNull(),
  seats: json("seats").$type<number[]>().notNull(),
  status: mysqlEnum("status", ["confirmed", "pending", "completed", "cancelled"])
    .default("confirmed")
    .notNull(),
  referenceCode: varchar("referenceCode", { length: 16 }).notNull().unique(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }).default("Cash on Bus"),
  phone: varchar("phone", { length: 32 }),
  hikingSticks: int("hikingSticks").default(0).notNull(),
  passengerDetails: json("passengerDetails").$type<{ name: string; phone: string }[]>(),
  checkedIn: boolean("checkedIn").default(false).notNull(),
  bookedAt: timestamp("bookedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/* ============================================================
 * Community Posts — User-generated content
 * ============================================================ */
export const communityPosts = mysqlTable("community_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tripTitle: varchar("tripTitle", { length: 255 }),
  content: text("content").notNull(),
  images: json("images").$type<string[]>(),
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

/* ============================================================
 * Trip Reviews — One review per completed booking
 * ============================================================ */
export const tripReviews = mysqlTable("trip_reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  userId: int("userId").notNull(),
  tripId: int("tripId").notNull(),
  rating: int("rating").notNull(),
  content: text("content").notNull(),
  postId: int("postId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TripReview = typeof tripReviews.$inferSelect;
export type InsertTripReview = typeof tripReviews.$inferInsert;

/* ============================================================
 * Post Likes — Track who liked what
 * ============================================================ */
export const postLikes = mysqlTable("post_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostLike = typeof postLikes.$inferSelect;

/* ============================================================
 * Loyalty — Points and level tracking per user
 * ============================================================ */
export const loyalty = mysqlTable("loyalty", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  points: int("points").default(0).notNull(),
  level: mysqlEnum("level", ["Explorer", "Trail Blazer", "Summit Seeker", "Mountain Legend"])
    .default("Explorer")
    .notNull(),
  tripsCompleted: int("tripsCompleted").default(0).notNull(),
  badges: json("badges").$type<{ name: string; icon: string; earned: boolean }[]>(),
  nfcCardRequested: boolean("nfcCardRequested").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Loyalty = typeof loyalty.$inferSelect;
export type InsertLoyalty = typeof loyalty.$inferInsert;

/* ============================================================
 * Post Comments — Comments on community posts
 * ============================================================ */
export const postComments = mysqlTable("post_comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;

/* ============================================================
 * Trail Explorer — catalog and user-recorded routes
 * ============================================================ */
export const trailCatalog = mysqlTable("trail_catalog", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["Easy", "Moderate", "Hard", "Expert"]).default("Moderate").notNull(),
  distanceKm: decimal("distanceKm", { precision: 6, scale: 2 }).notNull(),
  elevationM: int("elevationM").default(0).notNull(),
  duration: varchar("duration", { length: 64 }).notNull(),
  imageUrl: text("imageUrl"),
  description: text("description"),
  tags: json("tags").$type<string[]>(),
  isPremium: boolean("isPremium").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrailCatalog = typeof trailCatalog.$inferSelect;
export type InsertTrailCatalog = typeof trailCatalog.$inferInsert;

export const trailRecordings = mysqlTable("trail_recordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trailId: int("trailId"),
  title: varchar("title", { length: 255 }).notNull(),
  distanceKm: decimal("distanceKm", { precision: 6, scale: 2 }).notNull(),
  elevationM: int("elevationM").default(0).notNull(),
  durationMinutes: int("durationMinutes").default(0).notNull(),
  routeData: json("routeData").$type<{ lat: number; lng: number }[]>(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrailRecording = typeof trailRecordings.$inferSelect;
export type InsertTrailRecording = typeof trailRecordings.$inferInsert;

export const trailSubscriptions = mysqlTable("trail_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  plan: mysqlEnum("plan", ["monthly", "annual"]).default("monthly").notNull(),
  status: mysqlEnum("status", ["active", "paused", "cancelled"]).default("active").notNull(),
  renewalDate: timestamp("renewalDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrailSubscription = typeof trailSubscriptions.$inferSelect;
export type InsertTrailSubscription = typeof trailSubscriptions.$inferInsert;

/* ============================================================
 * Admin Mission Control content
 * ============================================================ */
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  target: int("target").default(1).notNull(),
  rewardPoints: int("rewardPoints").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  pointsCost: int("pointsCost").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

export const userRewards = mysqlTable("user_rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rewardId: int("rewardId").notNull(),
  redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
});

export type UserReward = typeof userRewards.$inferSelect;

export const broadcasts = mysqlTable("broadcasts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  audience: mysqlEnum("audience", ["all", "booked", "members", "admins"]).default("all").notNull(),
  status: mysqlEnum("status", ["draft", "sent"]).default("draft").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = typeof broadcasts.$inferInsert;

export const homeBanners = mysqlTable("home_banners", {
  id: int("id").autoincrement().primaryKey(),
  eyebrow: varchar("eyebrow", { length: 128 }),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("imageUrl"),
  ctaLabel: varchar("ctaLabel", { length: 128 }),
  ctaPath: varchar("ctaPath", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HomeBanner = typeof homeBanners.$inferSelect;
export type InsertHomeBanner = typeof homeBanners.$inferInsert;

export const gearChecklists = mysqlTable("gear_checklists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  items: json("items").$type<{ label: string; checked: boolean }[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GearChecklist = typeof gearChecklists.$inferSelect;
export type InsertGearChecklist = typeof gearChecklists.$inferInsert;
