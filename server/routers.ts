import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
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
  getOrCreateLoyalty,
  addLoyaltyPoints,
  requestNfcCard,
  getAllLoyaltyProfiles,
  approveNfcCard,
  adminAdjustPoints,
  getAllUsers,
  updateUserRole,
} from "./db";

/* Admin guard middleware */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

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
        })
      )
      .mutation(async ({ ctx, input }) => {
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
        });

        try {
          await getOrCreateLoyalty(ctx.user.id);
          await addLoyaltyPoints(ctx.user.id, 100);
        } catch (e) {
          console.warn("Failed to award loyalty points:", e);
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

    createPost: protectedProcedure
      .input(
        z.object({
          content: z.string().min(1),
          tripTitle: z.string().optional(),
          images: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const postId = await createPost({
          userId: ctx.user.id,
          content: input.content,
          tripTitle: input.tripTitle,
          images: input.images,
        });
        return { id: postId };
      }),

    toggleLike: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await toggleLike(ctx.user.id, input.postId);
        return { liked };
      }),
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
          description: z.string().optional(),
          highlights: z.array(z.string()).optional(),
          included: z.array(z.string()).optional(),
          meetingPoint: z.string().optional(),
          totalSeats: z.number().default(24),
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
          description: z.string().optional(),
          highlights: z.array(z.string()).optional(),
          included: z.array(z.string()).optional(),
          meetingPoint: z.string().optional(),
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
  }),
});

export type AppRouter = typeof appRouter;
