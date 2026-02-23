import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
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
   * Trips
   * ============================================================ */
  trips: router({
    list: publicProcedure.query(async () => {
      const allTrips = await getAllTrips();
      // For each trip, get booked seats count
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
   * Bookings
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
        // Check seat availability
        const bookedSeats = await getBookedSeatsForTrip(input.tripId);
        const conflict = input.seats.some((s) => bookedSeats.includes(s));
        if (conflict) {
          throw new Error("Some selected seats are already booked. Please choose different seats.");
        }

        const result = await createBooking({
          userId: ctx.user.id,
          tripId: input.tripId,
          passengers: input.passengers,
          seats: input.seats,
          totalPrice: input.totalPrice,
          paymentMethod: input.paymentMethod,
        });

        // Award loyalty points
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
   * Community
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
   * Loyalty
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
});

export type AppRouter = typeof appRouter;
