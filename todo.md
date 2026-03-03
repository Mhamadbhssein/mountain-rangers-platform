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
- [ ] Add create post functionality (coming soon)

## Round 16 (Completed)
- [x] Add create post form with image upload and text editor (modal-based)
- [ ] Implement admin moderation tools in admin panel
- [ ] Add trip review system that auto-creates community posts
