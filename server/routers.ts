import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import {
  previewBroadcastRecipients,
  updateBroadcastDraft,
  deleteBroadcast,
  endBroadcastBanner,
  getBroadcastReadStats,
  getActiveSiteBanner,
  getUnreadNotificationCount,
  getPendingPopup,
  markNotificationRead,
  deleteUserNotification,
  clearUserNotifications,
  getTrailById,
  getTrailRecordingById,
  updateUserProfile,
  getUserActivityStats,
  getChallengesWithProgress,
  claimChallenge,
  toggleFollow,
  getFollowingIds,
  sendBroadcast,
  getUserNotifications,
  markNotificationsRead,
  getMissionControlOverview,
  getLoyaltyLeaderboard,
  getCommunityStats,
  getAllTrips,
  getAllTripsAdmin,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  toggleTripStatus,
  getBookedSeatsForTrip,
  createBooking,
  getUserBookings,
  createTripReview,
  cancelBooking,
  getAllBookingsAdmin,
  getBookingsForTrip,
  adminCancelBooking,
  adminUpdateBookingStatus,
  getAdminStats,
  getRevenueByTrip,
  getRecentBookings,
  getAllPosts,
  createPost,
  deletePost,
  toggleLike,
  getUserLikedPosts,
  getPostComments,
  createComment,
  deleteComment,
  getOrCreateLoyalty,
  addLoyaltyPoints,
  requestNfcCard,
  getAllLoyaltyProfiles,
  approveNfcCard,
  adminAdjustPoints,
  getAllUsers,
  updateUserRole,
  getPendingPosts,
  approvePost,
  rejectPost,
  getTrailCatalog,
  getAllTrailCatalogAdmin,
  createTrailCatalog,
  updateTrailCatalog,
  deleteTrailCatalog,
  getUserTrailRecordings,
  createTrailRecording,
  getAllTrailRecordingsAdmin,
  getTrailSubscription,
  getAllTrailSubscriptionsAdmin,
  upsertTrailSubscription,
  getChallenges,
  getAllChallengesAdmin,
  createChallenge,
  getRewards,
  getAllRewardsAdmin,
  createReward,
  redeemReward,
  getBroadcasts,
  createBroadcast,
  getActiveHomeBanners,
  getAllHomeBannersAdmin,
  createHomeBanner,
  updateHomeBanner,
  activateHomeBanner,
  getGearChecklists,
  createGearChecklist,
  updateGearChecklist,
  getAdminManifest,
  setBookingCheckedIn,
} from "./db";

/* Admin guard middleware */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

/* ============================================================
 * WhatsApp notification helper
 * Sends booking confirmation to the admin WhatsApp number
 * ============================================================ */
async function sendWhatsAppNotification(message: string): Promise<void> {
  const ADMIN_PHONE = "96176828401"; // +961 76 828 401
  const encodedMessage = encodeURIComponent(message);
  // Log the WhatsApp message for the server (in production this would call WhatsApp Business API)
  console.log(`[WhatsApp] Sending to ${ADMIN_PHONE}: ${message}`);
  // Store the notification URL for the booking confirmation response
  return Promise.resolve();
}

/* ============================================================
 * Custom notification composer validation
 * ============================================================ */
const BROADCAST_AUDIENCES = ["all", "booked", "members", "admins", "trip", "user"] as const;
const NOTIFICATION_TYPES = ["announcement", "trip", "offer", "reminder", "alert", "booking", "community", "reward"] as const;

const broadcastTargetSchema = z.object({
  audience: z.enum(BROADCAST_AUDIENCES),
  targetTripId: z.number().int().optional().nullable(),
  targetUserId: z.number().int().optional().nullable(),
});

/** Internal paths ("/trails") or full https links only. */
const notificationLinkSchema = z
  .string()
  .trim()
  .max(512)
  .refine((value) => value === "" || value.startsWith("/") || /^https:\/\//i.test(value), "Link must start with / or https://")
  .optional();

const broadcastInputSchema = broadcastTargetSchema.extend({
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(1000),
  type: z.enum(NOTIFICATION_TYPES).default("announcement"),
  link: notificationLinkSchema,
  showPopup: z.boolean().default(false),
  showBanner: z.boolean().default(false),
  bannerDays: z.number().int().min(1).max(60).optional(),
  sendNow: z.boolean().default(false),
});

type BroadcastInput = z.infer<typeof broadcastInputSchema>;

function assertBroadcastTarget(input: z.infer<typeof broadcastTargetSchema> & { showBanner?: boolean }) {
  if (input.audience === "trip" && !input.targetTripId) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a trip for this notification" });
  if (input.audience === "user" && !input.targetUserId) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a member for this notification" });
  if (input.showBanner && input.audience !== "all") throw new TRPCError({ code: "BAD_REQUEST", message: "The site banner is only available when sending to everyone" });
}

function toBroadcastRow(input: BroadcastInput) {
  return {
    title: input.title,
    message: input.message,
    type: input.type,
    link: input.link ? input.link : null,
    audience: input.audience,
    targetTripId: input.audience === "trip" ? input.targetTripId ?? null : null,
    targetUserId: input.audience === "user" ? input.targetUserId ?? null : null,
    showPopup: input.showPopup,
    showBanner: input.showBanner,
    bannerExpiresAt: input.showBanner && input.bannerDays ? new Date(Date.now() + input.bannerDays * 24 * 60 * 60 * 1000) : null,
    status: "draft" as const,
  };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  /* ============================================================
   * Trips (public)
   * ============================================================ */
  trips: router({
    list: publicProcedure.query(async () => {
      const allTrips = await getAllTrips();
      const tripsWithAvailability = await Promise.all(
        allTrips.map(async (trip) => {
          const bookedSeats = await getBookedSeatsForTrip(trip.id);
          return {
            ...trip,
            bookedSeatsCount: bookedSeats.length,
            availableSeats: trip.totalSeats - bookedSeats.length,
          };
        })
      );
      return tripsWithAvailability;
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const trip = await getTripById(input.id);
        if (!trip) return null;
        const bookedSeats = await getBookedSeatsForTrip(trip.id);
        return {
          ...trip,
          bookedSeats,
          availableSeats: trip.totalSeats - bookedSeats.length,
        };
      }),

    getBookedSeats: publicProcedure
      .input(z.object({ tripId: z.number() }))
      .query(async ({ input }) => {
        return getBookedSeatsForTrip(input.tripId);
      }),
  }),

  /* ============================================================
   * Trails, challenges, rewards, and home content
   * ============================================================ */
  trailExplorer: router({
    catalog: publicProcedure.query(() => getTrailCatalog()),
    trail: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const trail = await getTrailById(input.id);
        if (!trail || !trail.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "Trail not found" });
        return trail;
      }),
    recording: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const row = await getTrailRecordingById(input.id);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Recording not found" });
        if (row.recording.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return row;
      }),
    trailGuide: publicProcedure
      .input(z.object({ trailId: z.number().int(), question: z.string().min(1).max(500) }))
      .mutation(async ({ input }) => {
        const trail = await getTrailById(input.trailId);
        if (!trail) throw new TRPCError({ code: "NOT_FOUND", message: "Trail not found" });
        const facts = [
          `Trail: ${trail.title}`,
          `Location: ${trail.location}, Lebanon`,
          `Difficulty: ${trail.difficulty}`,
          `Distance: ${trail.distanceKm} km`,
          `Elevation gain: ${trail.elevationM} m`,
          trail.maxElevationM ? `Max elevation: ${trail.maxElevationM} m` : null,
          `Estimated duration: ${trail.duration}`,
          `Route type: ${trail.routeType}`,
          trail.bestSeason ? `Best season: ${trail.bestSeason}` : null,
          trail.description ? `Description: ${trail.description}` : null,
          trail.tags?.length ? `Tags: ${trail.tags.join(", ")}` : null,
        ].filter(Boolean).join("\n");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are the Mountain Rangers trail guide for hiking in Lebanon. Answer briefly and practically (under 150 words) using the trail facts given. Cover safety, gear, water, timing and weather when relevant. If something is not in the facts, say so plainly instead of inventing details. Advise contacting Mountain Rangers on WhatsApp +961 76 828 401 for live conditions." },
            { role: "user", content: `${facts}\n\nQuestion: ${input.question}` },
          ],
        });
        const content = response.choices?.[0]?.message?.content;
        const answer = typeof content === "string" ? content : Array.isArray(content) ? content.map((part: any) => part.text ?? "").join("") : "";
        return { answer: answer || "The trail guide is unavailable right now. Please try again shortly." };
      }),
    recordings: protectedProcedure.query(({ ctx }) => getUserTrailRecordings(ctx.user.id)),
    record: protectedProcedure
      .input(z.object({
        trailId: z.number().optional(),
        title: z.string().min(1),
        distanceKm: z.number().min(0),
        elevationM: z.number().min(0).default(0),
        durationMinutes: z.number().min(0).default(0),
        routeData: z.array(z.object({ lat: z.number(), lng: z.number(), ele: z.number().optional() })).max(20000).optional(),
        startedAt: z.date().optional(),
        endedAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => ({
        id: await createTrailRecording({ ...input, userId: ctx.user.id, distanceKm: String(input.distanceKm), routeData: input.routeData ?? null }),
      })),
    subscription: protectedProcedure.query(({ ctx }) => getTrailSubscription(ctx.user.id)),
    subscribe: protectedProcedure
      .input(z.object({ plan: z.enum(["monthly", "annual"]) }))
      .mutation(({ ctx, input }) => upsertTrailSubscription(ctx.user.id, input.plan)),
    challenges: publicProcedure.query(() => getChallenges()),
    myChallenges: protectedProcedure.query(({ ctx }) => getChallengesWithProgress(ctx.user.id)),
    claimChallenge: protectedProcedure
      .input(z.object({ challengeId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await claimChallenge(ctx.user.id, input.challengeId);
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to claim challenge" });
        }
      }),
    rewards: publicProcedure.query(() => getRewards()),
    redeemReward: protectedProcedure
      .input(z.object({ rewardId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return { id: await redeemReward(ctx.user.id, input.rewardId) };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to redeem reward" });
        }
      }),
    homeBanners: publicProcedure.query(() => getActiveHomeBanners()),
    checklists: protectedProcedure.query(({ ctx }) => getGearChecklists(ctx.user.id)),
    createChecklist: protectedProcedure
      .input(z.object({ title: z.string().min(1), items: z.array(z.object({ label: z.string().min(1), checked: z.boolean() })) }))
      .mutation(async ({ ctx, input }) => ({ id: await createGearChecklist({ ...input, userId: ctx.user.id }) })),
    updateChecklist: protectedProcedure
      .input(z.object({ id: z.number(), items: z.array(z.object({ label: z.string().min(1), checked: z.boolean() })) }))
      .mutation(async ({ ctx, input }) => {
        await updateGearChecklist(input.id, ctx.user.id, input.items);
        return { success: true };
      }),
  }),

  /* ============================================================
   * Profile, social graph, and notifications
   * ============================================================ */
  profile: router({
    stats: protectedProcedure.query(({ ctx }) => getUserActivityStats(ctx.user.id)),
    update: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(120),
        phone: z.string().trim().max(32).optional(),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, {
          name: input.name,
          phone: input.phone ? input.phone : null,
          dateOfBirth: input.dateOfBirth ? input.dateOfBirth : null,
        });
        return { success: true };
      }),
    following: protectedProcedure.query(({ ctx }) => getFollowingIds(ctx.user.id)),
    toggleFollow: protectedProcedure
      .input(z.object({ userId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot follow yourself" });
        return { following: await toggleFollow(ctx.user.id, input.userId) };
      }),
    notifications: protectedProcedure.query(({ ctx }) => getUserNotifications(ctx.user.id)),
    markNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markNotificationsRead(ctx.user.id);
      return { success: true };
    }),
    leaderboard: publicProcedure.query(() => getLoyaltyLeaderboard(10)),
  }),

  /* ============================================================
   * Custom notifications (member side)
   * ============================================================ */
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => getUserNotifications(ctx.user.id)),
    unreadCount: protectedProcedure.query(({ ctx }) => getUnreadNotificationCount(ctx.user.id)),
    popup: protectedProcedure.query(({ ctx }) => getPendingPopup(ctx.user.id)),
    siteBanner: publicProcedure.query(() => getActiveSiteBanner()),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(ctx.user.id, input.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markNotificationsRead(ctx.user.id);
      return { success: true };
    }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await deleteUserNotification(ctx.user.id, input.id);
        return { success: true };
      }),
    clearAll: protectedProcedure.mutation(async ({ ctx }) => {
      await clearUserNotifications(ctx.user.id);
      return { success: true };
    }),
  }),

  /* ============================================================
   * Bookings (user)
   * ============================================================ */
  bookings: router({
    create: protectedProcedure
      .input(
        z.object({
          tripId: z.number(),
          passengers: z.number().min(1).max(10),
          seats: z.array(z.number()).min(1),
          totalPrice: z.number(),
          paymentMethod: z.string().optional(),
          phone: z.string().min(7, "Please enter a valid phone number"),
          hikingSticks: z.number().min(0).max(10).default(0),
          passengerDetails: z
            .array(z.object({ name: z.string().min(1), phone: z.string().min(7) }))
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check for seat conflicts
        const bookedSeats = await getBookedSeatsForTrip(input.tripId);
        const conflict = input.seats.some((s) => bookedSeats.includes(s));
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Some selected seats are already booked. Please choose different seats.",
          });
        }

        const result = await createBooking({
          userId: ctx.user.id,
          tripId: input.tripId,
          passengers: input.passengers,
          seats: input.seats,
          totalPrice: input.totalPrice,
          paymentMethod: input.paymentMethod,
          phone: input.phone,
          hikingSticks: input.hikingSticks,
          passengerDetails: input.passengerDetails,
        });

        // Loyalty points are awarded when the trip is marked as completed (not on booking)

        // Send WhatsApp notification to admin
        try {
          const trip = await getTripById(input.tripId);
          const tripDate = trip?.date
            ? new Date(trip.date).toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "N/A";
          const hikingSticksLine =
            input.hikingSticks > 0
              ? `\n🥾 Hiking Sticks: ${input.hikingSticks} (+$${input.hikingSticks})`
              : "";
          const passengerList =
            input.passengerDetails && input.passengerDetails.length > 0
              ? `\n👥 *Passengers:*\n` +
                input.passengerDetails
                  .map((p, i) => `  ${i + 1}. ${p.name} — ${p.phone}`)
                  .join("\n")
              : `\n👥 *Passengers:* ${input.passengers}`;

          const whatsappMessage =
            `🏔️ *New Booking Confirmed!*\n\n` +
            `📋 *Reference:* ${result.referenceCode}\n` +
            `👤 *Lead:* ${ctx.user.name ?? "Guest"}\n` +
            `📞 *Phone:* ${input.phone}\n` +
            `🗺️ *Trip:* ${trip?.title ?? "Unknown"}\n` +
            `📅 *Date:* ${tripDate}\n` +
            `🕐 *Time:* ${trip?.time ?? "N/A"}` +
            passengerList +
            `\n💺 *Seats:* ${input.seats.join(", ")}` +
            hikingSticksLine +
            `\n💰 *Total:* $${Number(input.totalPrice).toFixed(2)}\n` +
            `💳 *Payment:* ${input.paymentMethod ?? "Cash on Bus"}\n` +
            `📍 *Meeting Point:* ${trip?.meetingPoint ?? "TBA"}`;

          await sendWhatsAppNotification(whatsappMessage);

          // Build WhatsApp deep link for admin to open
          const waLink = `https://wa.me/96176828401?text=${encodeURIComponent(whatsappMessage)}`;
          return { ...result, whatsappLink: waLink };
        } catch (e) {
          console.warn("Failed to send WhatsApp notification:", e);
        }

        return result;
      }),

    myBookings: protectedProcedure.query(async ({ ctx }) => {
      return getUserBookings(ctx.user.id);
    }),

    cancel: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await cancelBooking(input.bookingId, ctx.user.id);
        return { success: true };
      }),

    submitReview: protectedProcedure
      .input(
        z.object({
          bookingId: z.number(),
          rating: z.number().int().min(1).max(5),
          content: z.string().trim().min(10, "Please share at least a short trip story."),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userBookings = await getUserBookings(ctx.user.id);
        const row = userBookings.find((item) => item.booking.id === input.bookingId);

        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
        }
        if (row.booking.status !== "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Reviews are available after a trip is completed." });
        }
        if (row.review) {
          throw new TRPCError({ code: "CONFLICT", message: "You already reviewed this trip." });
        }

        return createTripReview({
          bookingId: input.bookingId,
          userId: ctx.user.id,
          tripId: row.trip.id,
          tripTitle: row.trip.title,
          rating: input.rating,
          content: input.content,
        });
      }),
  }),

  /* ============================================================
   * Community (public read, protected write)
   * ============================================================ */
  community: router({
    posts: publicProcedure.query(async ({ ctx }) => {
      const posts = await getAllPosts();
      const likedPostIds = ctx.user ? await getUserLikedPosts(ctx.user.id) : [];
      return posts.map((p) => ({
        ...p.post,
        author: p.author,
        isLiked: likedPostIds.includes(p.post.id),
      }));
    }),
    stats: publicProcedure.query(() => getCommunityStats()),

    createPost: protectedProcedure
      .input(
        z.object({
          content: z.string().trim().min(1).max(5000),
          tripTitle: z.string().max(255).optional(),
          images: z.array(z.string().max(14_000_000)).max(10).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const imageUrls: string[] = [];
        if (input.images && input.images.length > 0) {
          for (let i = 0; i < input.images.length; i++) {
            const base64 = input.images[i];
            const mime = /^data:(image\/(?:jpeg|png|webp|gif|heic|heif));base64,/.exec(base64)?.[1] ?? "image/jpeg";
            const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
            if (buffer.length > 10 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Each photo must be under 10 MB" });
            const ext = mime.split("/")[1].replace("jpeg", "jpg");
            const key = `posts/${ctx.user.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { url } = await storagePut(key, buffer, mime);
            imageUrls.push(url);
          }
        }
        
        const postId = await createPost({
          userId: ctx.user.id,
          content: input.content,
          tripTitle: input.tripTitle,
          images: imageUrls,
        });
        return { id: postId };
      }),

    toggleLike: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await toggleLike(ctx.user.id, input.postId);
        return { liked };
      }),

    getComments: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return getPostComments(input.postId);
      }),

    addComment: protectedProcedure
      .input(z.object({ postId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await createComment({
          userId: ctx.user.id,
          postId: input.postId,
          content: input.content,
        });
        return { id: commentId };
      }),

    deleteComment: protectedProcedure
      .input(z.object({ commentId: z.number(), postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteComment(input.commentId, input.postId);
        return { success: true };
      }),

    pendingPosts: adminProcedure.query(async () => {
      return getPendingPosts();
    }),

    approvePost: adminProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        await approvePost(input.postId);
        return { success: true };
      }),

    rejectPost: adminProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        await rejectPost(input.postId);
        return { success: true };
      })
  }),

  /* ============================================================
   * Loyalty (protected)
   * ============================================================ */
  loyalty: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getOrCreateLoyalty(ctx.user.id);
    }),

    requestNfcCard: protectedProcedure.mutation(async ({ ctx }) => {
      await requestNfcCard(ctx.user.id);
      return { success: true };
    }),
  }),

  /* ============================================================
   * File Upload (admin)
   * ============================================================ */
  upload: router({
    bannerImage: adminProcedure
      .input(z.object({ filename: z.string(), contentType: z.string().regex(/^image\/(jpeg|png|webp|avif|gif)$/), base64Data: z.string().max(14_000_000) }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64Data, "base64");
        const ext = input.filename.split(".").pop() ?? "jpg";
        const key = `home-banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),
    tripImage: adminProcedure
      .input(
        z.object({
          filename: z.string(),
          contentType: z.string(),
          base64Data: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64Data, "base64");
        const ext = input.filename.split(".").pop() ?? "jpg";
        const key = `trips/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),
  }),

  /* ============================================================
   * Admin — Full control panel
   * ============================================================ */
  admin: router({
    /* ---- Overview Stats ---- */
    stats: adminProcedure.query(async () => {
      return getAdminStats();
    }),

    revenueByTrip: adminProcedure.query(async () => {
      return getRevenueByTrip();
    }),

    recentBookings: adminProcedure.query(async () => {
      return getRecentBookings(10);
    }),

    /* ---- Trip Management ---- */
    allTrips: adminProcedure.query(async () => {
      const allTrips = await getAllTripsAdmin();
      const tripsWithStats = await Promise.all(
        allTrips.map(async (trip) => {
          const bookedSeats = await getBookedSeatsForTrip(trip.id);
          return {
            ...trip,
            bookedSeatsCount: bookedSeats.length,
            availableSeats: trip.totalSeats - bookedSeats.length,
            fillRate: Math.round((bookedSeats.length / trip.totalSeats) * 100),
          };
        })
      );
      return tripsWithStats;
    }),

    createTrip: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          location: z.string().min(1),
          date: z.string(),
          time: z.string(),
          duration: z.string(),
          difficulty: z.enum(["Easy", "Moderate", "Hard", "Expert"]),
          price: z.number().positive(),
          currency: z.string().default("USD"),
          imageUrl: z.string().optional(),
          additionalImages: z.array(z.string()).optional(),
          description: z.string().optional(),
          highlights: z.array(z.string()).optional(),
          included: z.array(z.string()).optional(),
          meetingPoint: z.string().optional(),
          meetingPointLat: z.number().optional(),
          meetingPointLng: z.number().optional(),
          totalSeats: z.number().default(27),
          elevation: z.string().optional(),
          distance: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createTrip({
          ...input,
          date: new Date(input.date),
          price: String(input.price),
          isActive: true,
        });
        return { id };
      }),

    updateTrip: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          location: z.string().optional(),
          date: z.string().optional(),
          time: z.string().optional(),
          duration: z.string().optional(),
          difficulty: z.enum(["Easy", "Moderate", "Hard", "Expert"]).optional(),
          price: z.number().positive().optional(),
          currency: z.string().optional(),
          imageUrl: z.string().optional(),
          additionalImages: z.array(z.string()).optional(),
          description: z.string().optional(),
          highlights: z.array(z.string()).optional(),
          included: z.array(z.string()).optional(),
          meetingPoint: z.string().optional(),
          meetingPointLat: z.number().optional(),
          meetingPointLng: z.number().optional(),
          totalSeats: z.number().optional(),
          elevation: z.string().optional(),
          distance: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, price, date, ...rest } = input;
        const updateData: Record<string, unknown> = { ...rest };
        if (price !== undefined) updateData.price = String(price);
        if (date !== undefined) updateData.date = new Date(date);
        await updateTrip(id, updateData as Parameters<typeof updateTrip>[1]);
        return { success: true };
      }),

    deleteTrip: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTrip(input.id);
        return { success: true };
      }),

    toggleTripStatus: adminProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await toggleTripStatus(input.id, input.isActive);
        return { success: true };
      }),

    /* ---- Booking Management ---- */
    allBookings: adminProcedure.query(async () => {
      return getAllBookingsAdmin();
    }),

    bookingsForTrip: adminProcedure
      .input(z.object({ tripId: z.number() }))
      .query(async ({ input }) => {
        const bookingsList = await getBookingsForTrip(input.tripId);
        const bookedSeats = await getBookedSeatsForTrip(input.tripId);
        return { bookings: bookingsList, bookedSeats };
      }),

    cancelBooking: adminProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input }) => {
        await adminCancelBooking(input.bookingId);
        return { success: true };
      }),

    updateBookingStatus: adminProcedure
      .input(
        z.object({
          bookingId: z.number(),
          status: z.enum(["confirmed", "pending", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await adminUpdateBookingStatus(input.bookingId, input.status);
        return { success: true };
      }),

    /* ---- User Management ---- */
    allUsers: adminProcedure.query(async () => {
      return getAllUsers();
    }),

    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    /* ---- Loyalty Management ---- */
    allLoyalty: adminProcedure.query(async () => {
      return getAllLoyaltyProfiles();
    }),

    approveNfcCard: adminProcedure
      .input(z.object({ loyaltyId: z.number() }))
      .mutation(async ({ input }) => {
        await approveNfcCard(input.loyaltyId);
        return { success: true };
      }),

    adjustPoints: adminProcedure
      .input(z.object({ userId: z.number(), points: z.number() }))
      .mutation(async ({ input }) => {
        await adminAdjustPoints(input.userId, input.points);
        return { success: true };
      }),

    /* ---- Community Moderation ---- */
    allPosts: adminProcedure.query(async () => {
      return getAllPosts();
    }),

    deletePost: adminProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        await deletePost(input.postId);
        return { success: true };
      }),

    /* ---- Mission Control ---- */
    manifest: adminProcedure.query(() => getAdminManifest()),
    missionOverview: adminProcedure.query(() => getMissionControlOverview()),

    checkInBooking: adminProcedure
      .input(z.object({ bookingId: z.number(), checkedIn: z.boolean() }))
      .mutation(async ({ input }) => {
        await setBookingCheckedIn(input.bookingId, input.checkedIn);
        return { success: true };
      }),

    trailCatalog: adminProcedure.query(() => getAllTrailCatalogAdmin()),
    createTrail: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        location: z.string().min(1),
        difficulty: z.enum(["Easy", "Moderate", "Hard", "Expert"]),
        distanceKm: z.number().min(0),
        elevationM: z.number().min(0).default(0),
        duration: z.string().min(1),
        maxElevationM: z.number().int().min(0).optional(),
        routeType: z.enum(["Loop", "Out & Back", "Point to Point"]).default("Loop"),
        bestSeason: z.string().max(128).optional(),
        routeData: z.array(z.object({ lat: z.number(), lng: z.number(), ele: z.number().optional() })).max(20000).optional(),
        imageUrl: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
        isPremium: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => ({
        id: await createTrailCatalog({
          ...input,
          distanceKm: String(input.distanceKm),
          maxElevationM: input.maxElevationM ?? null,
          bestSeason: input.bestSeason || null,
          routeData: input.routeData ?? null,
          imageUrl: input.imageUrl || null,
          description: input.description || null,
        }),
      })),
    updateTrail: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        isPremium: z.boolean().optional(),
        title: z.string().min(1).optional(),
        location: z.string().min(1).optional(),
        difficulty: z.enum(["Easy", "Moderate", "Hard", "Expert"]).optional(),
        distanceKm: z.number().min(0).optional(),
        elevationM: z.number().int().min(0).optional(),
        maxElevationM: z.number().int().min(0).nullable().optional(),
        duration: z.string().min(1).optional(),
        routeType: z.enum(["Loop", "Out & Back", "Point to Point"]).optional(),
        bestSeason: z.string().max(128).nullable().optional(),
        description: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        tags: z.array(z.string()).optional(),
        routeData: z.array(z.object({ lat: z.number(), lng: z.number(), ele: z.number().optional() })).max(20000).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, distanceKm, ...rest } = input;
        await updateTrailCatalog(id, { ...rest, ...(distanceKm !== undefined ? { distanceKm: String(distanceKm) } : {}) });
        return { success: true };
      }),
    deleteTrail: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTrailCatalog(input.id);
        return { success: true };
      }),

    allRecordings: adminProcedure.query(() => getAllTrailRecordingsAdmin()),
    trailSubscriptions: adminProcedure.query(() => getAllTrailSubscriptionsAdmin()),
    importTrails: adminProcedure
      .input(z.object({ trails: z.array(z.object({
        title: z.string().min(1),
        location: z.string().min(1),
        difficulty: z.enum(["Easy", "Moderate", "Hard", "Expert"]),
        distanceKm: z.number().min(0),
        elevationM: z.number().min(0).default(0),
        duration: z.string().min(1),
      })).min(1).max(200) }))
      .mutation(async ({ input }) => {
        for (const trail of input.trails) {
          await createTrailCatalog({ ...trail, distanceKm: String(trail.distanceKm), tags: [], isPremium: false, isActive: true, imageUrl: null, description: null });
        }
        return { imported: input.trails.length };
      }),
    broadcasts: adminProcedure.query(async () => {
      const [rows, stats] = await Promise.all([getBroadcasts(), getBroadcastReadStats()]);
      return rows.map((row) => {
        const s = stats.find((x) => x.broadcastId === row.id);
        return { ...row, delivered: s?.delivered ?? 0, readCount: s?.read ?? 0 };
      });
    }),
    previewRecipients: adminProcedure
      .input(broadcastTargetSchema)
      .query(({ input }) => previewBroadcastRecipients({ audience: input.audience, targetTripId: input.targetTripId ?? null, targetUserId: input.targetUserId ?? null })),
    createBroadcast: adminProcedure
      .input(broadcastInputSchema)
      .mutation(async ({ input }) => {
        assertBroadcastTarget(input);
        const id = await createBroadcast(toBroadcastRow(input));
        if (input.sendNow) {
          const result = await sendBroadcast(id);
          return { id, sent: true, recipients: result.recipients };
        }
        return { id, sent: false, recipients: 0 };
      }),
    updateBroadcast: adminProcedure
      .input(broadcastInputSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        assertBroadcastTarget(input);
        try {
          await updateBroadcastDraft(input.id, toBroadcastRow(input));
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to update notification" });
        }
        return { success: true };
      }),
    deleteBroadcast: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteBroadcast(input.id);
        return { success: true };
      }),
    endBroadcastBanner: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await endBroadcastBanner(input.id);
        return { success: true };
      }),
    sendBroadcast: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        try {
          return await sendBroadcast(input.id);
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to send broadcast" });
        }
      }),
    challenges: adminProcedure.query(() => getAllChallengesAdmin()),
    createChallenge: adminProcedure
      .input(z.object({ title: z.string().min(1), description: z.string().min(1), metric: z.enum(["trips", "distanceKm", "elevationM", "recordings"]).default("trips"), target: z.number().int().min(1), rewardPoints: z.number().int().min(0) }))
      .mutation(async ({ input }) => ({ id: await createChallenge({ ...input, isActive: true }) })),
    rewards: adminProcedure.query(() => getAllRewardsAdmin()),
    createReward: adminProcedure
      .input(z.object({ title: z.string().min(1), description: z.string().min(1), pointsCost: z.number().int().min(0) }))
      .mutation(async ({ input }) => ({ id: await createReward({ ...input, isActive: true }) })),
    homeBanners: adminProcedure.query(() => getAllHomeBannersAdmin()),
    createHomeBanner: adminProcedure
      .input(z.object({ eyebrow: z.string().optional(), title: z.string().min(1), subtitle: z.string().optional(), imageUrl: z.string().optional(), ctaLabel: z.string().optional(), ctaPath: z.string().optional(), sortOrder: z.number().int().default(0) }))
      .mutation(async ({ input }) => { const id = await createHomeBanner({ ...input, eyebrow: input.eyebrow ?? null, subtitle: input.subtitle ?? null, imageUrl: input.imageUrl ?? null, ctaLabel: input.ctaLabel ?? null, ctaPath: input.ctaPath ?? null, isActive: true }); await activateHomeBanner(Number(id)); return { id }; }),
    updateHomeBanner: adminProcedure
      .input(z.object({ id: z.number().int(), eyebrow: z.string().optional(), title: z.string().min(1), subtitle: z.string().optional(), imageUrl: z.string().optional(), ctaLabel: z.string().optional(), ctaPath: z.string().optional(), sortOrder: z.number().int().optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ input }) => { const { id, ...data } = input; await updateHomeBanner(id, { ...data, eyebrow: data.eyebrow ?? null, subtitle: data.subtitle ?? null, imageUrl: data.imageUrl ?? null, ctaLabel: data.ctaLabel ?? null, ctaPath: data.ctaPath ?? null }); return { success: true }; }),
    activateHomeBanner: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => { await activateHomeBanner(input.id); return { success: true }; }),
  }),
});

export type AppRouter = typeof appRouter;
