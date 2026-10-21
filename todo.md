# Project TODO

- [x] Basic homepage / Explore page layout
- [x] Bottom navigation with glass effect
- [x] Trip cards with search and difficulty filter
- [x] Trip detail page with booking CTA
- [x] 3-step booking flow (passengers, seat selection, confirmation)
- [x] My Bookings page with QR tickets
- [x] Community social feed page
- [x] Profile page with stats
- [x] Loyalty card page with badges and NFC request
- [x] Splash screen with branded animation
- [x] 404 Not Found page styled to match theme
- [x] Update logos to transparent background versions (bigger)
- [x] Update fonts to Outfit + Playfair Display
- [x] Upgrade to full-stack with database and user management
- [x] Design database schema for trips, bookings, seats, loyalty, community
- [x] Create seed script to populate initial trip data
- [x] Build backend API routes (tRPC) for all entities
- [x] Connect frontend pages to backend API
- [x] Write vitest tests for backend routes

## Admin Dashboard
- [x] Admin dashboard layout with sidebar navigation
- [x] Overview stats: total bookings, revenue, active trips, user count
- [x] Analytics charts: bookings over time, revenue per trip, seat fill rate
- [x] Trip management: create, edit, delete, toggle active/inactive
- [x] Bookings management: view all, cancel, filter by trip/status
- [x] Seat map view per trip showing booked vs available seats
- [x] User management: list all users, view profiles, adjust roles
- [x] Loyalty card management: view all loyalty profiles, approve NFC requests
- [x] Community moderation: delete posts, manage content
- [x] Admin-only route protection (role=admin check)
- [x] Admin API routes for all entities
- [x] Admin link in Profile page for admin users
- [x] Admin vitest tests (40 total tests passing)

## New Features (Round 3)
- [x] Phone number required field in booking passenger step
- [x] WhatsApp booking confirmation to +961 76 828 401 with full details
- [x] New seat layout: Driver + 2 Guide seats, row of 3 (seats 1-3) + DOOR, then 6 rows of 4 (seats 4-27)
- [x] Hiking stick add-on per passenger (+$1 each)
- [x] Trip image upload (main photo + additional photos) in admin
- [x] Map pin for meeting point in admin trip management
- [x] Display meeting point map on trip detail page

## New Features (Round 4)
- [x] What to Bring checklist section on trip detail page
- [x] Cash Payment Reminder section on trip detail page
- [x] Important Notes section on trip detail page (30 min early, QR code, cancellation, weather)
- [x] Change 15 minutes to 30 minutes early arrival note
- [x] Confirm Reservation via WhatsApp green button on booking confirmation
- [x] My Bookings: expandable booking details view
- [x] My Bookings: cancel booking button (blocked within 24 hours of trip)

## New Features (Round 5)
- [x] Move Cash Payment Reminder from TripDetail to Booking Step 3 (shown only when Cash is selected)
- [x] Add Whish Money step-by-step payment guide in Booking Step 3 (shown only when Whish is selected)
- [x] Whish guide includes Mountain Rangers phone number (+961 76 828 401) with tap-to-copy
- [x] Whish guide instructs user to add name + booking reference in the payment notes

## New Features (Round 6)
- [x] Collect name + phone for each passenger when more than 1 passenger selected in Step 1
- [x] Store passengerDetails in database for each booking
- [x] Award 100 loyalty points when a booking status is marked as completed (not on booking creation)
- [x] Update WhatsApp admin notification to include full passenger list with names and phones

## Round 7
- [x] Auto-populate Passenger 1 with logged-in user's name and phone (read-only)
- [x] Only show empty fields for Passenger 2+ to fill in

## Round 8
- [x] Replace modern editorial fonts with simpler, more traditional fonts (Inter + Georgia)

## Round 9
- [x] Change fonts to bold geometric sans-serif matching Mountain Rangers logo (Poppins)

## Round 10
- [x] Replace old logos with new Mountain Rangers logo (dark and white versions)

## Round 11
- [x] Update logos to latest versions (icon and name logos for both dark and white)
## Round 12
- [x] Add country code selector to phone inputs (Lebanon +961 by default)
- [x] Update Booking Step 1 main phone field with country code selector
- [x] Update Booking Step 1 passenger phone fields with country code selector

## Round 13
- [x] Fix seat layout to match bus design (Driver + 2 guide seats + 27 passenger seats in 4-seat rows)
- [x] Ensure seat selection UI shows correct grid layout with door indicator

## Round 14
- [x] Fix seat 4 not appearing in seat selection layout (changed col array from 1,2,3,4 to 0,1,2,3)

## Round 15
- [x] Implement comments feature on community posts (expandable, add/view comments)
- [x] Implement share feature for posts (native share or clipboard)
- [x] Add create post functionality (coming soon)

## Round 16 (Completed)
- [x] Add create post form with image upload and text editor (modal-based)
- [x] Implement admin moderation tools in admin panel
- [x] Add trip review system that auto-creates community posts

## Round 17
- [x] Add moderation status to posts table (pending/approved/rejected)
- [x] Add backend procedures for approving/rejecting posts
- [x] Create admin moderation page UI (AdminModeration.tsx)
- [x] Update community feed to only show approved posts

## Round 18
- [x] Add share button to create post modal
- [x] Add multi-image gallery picker to create post form
- [x] Add image preview and remove functionality

## Round 19
- [x] Store post images in S3 when posts are created
- [x] Display images in community feed below post content
- [x] Add image carousel for posts with multiple photos (shows image count)

## Round 20 — Base44 detail parity
- [ ] Trail detail page (/trail/:id): hero, difficulty chip, 4 stat cards, loop/season chips, about, GPS route map, elevation profile, tags, AI Trail Guide
- [ ] Richer trail fields in Mission Control (max elevation, route type, best season, description, image, tags, GPX route points)
- [ ] Live GPS trail recording (start/pause/stop, distance, elevation, time) saved with route points
- [ ] Recording detail page with route map and stats
- [ ] Real challenge progress per member (trips, distance, elevation, recordings) with claim-to-earn points
- [ ] Broadcast sending as in-app notifications with bell + unread count
- [ ] Profile parity: social counts, Your Stats, editable Personal Info (name, phone, birth date), Appearance Light/Auto/Dark, links
- [ ] Community parity: Feed / Gallery / Top tabs, All / Trending / Following filters, follow members
- [ ] Schedule parity: All Trips / My Trips / Calendar tabs, trip dots on calendar days, My Bookings stat
- [ ] Mission Control overview: Total Bookings, Trail Subs MRR, booking status breakdown, 6-month revenue chart, upcoming trips
- [ ] Tests, checkpoint

## Round 21 — Custom notifications
- [x] Schema: notification type, link, pop-up, website banner, trip/member targeting, recipient count (migration 0009 applied)
- [x] Admin Notifications page: templates, 8 types, title/message, button link, audience (everyone, booked, trip passengers, one member, premium, admins), live recipient count, preview, send now or save draft
- [x] History with delivered/read stats, edit/send drafts, delete, end banner
- [x] Member bell with unread badge on public pages, Notifications inbox (All/Unread, mark read, delete, clear)
- [x] Pop-up alert on next visit and dismissible site-wide banner
- [x] Automatic notifications for booking status changes and post approval/rejection
- [x] Vitest coverage for permissions, validation, and delivery (61 tests passing)
