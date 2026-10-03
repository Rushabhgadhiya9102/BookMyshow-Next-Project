# BookMyShow Production-Grade System Design

> **Project:** Production-grade movie ticket booking platform\
> **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS\
> **Backend:** NestJS, Node.js 24 LTS, TypeScript\
> **Database:** PostgreSQL\
> **Cache / Coordination:** Redis\
> **Queue:** BullMQ\
> **Payments:** Stripe\
> **Storage:** S3 or Cloudinary\
> **ORM:** Prisma\
> **Realtime:** WebSocket / Socket.IO\
> **Deployment:** Docker + GitHub Actions
>
> This document is the authoritative architecture blueprint for
> redesigning the current BookMyShow-style practice application into a
> production-oriented, highly concurrent movie ticket booking platform.

------------------------------------------------------------------------

# 1. Product Vision

The application should provide the complete movie-ticket lifecycle:

``` text
Discover Movie
      ↓
Select City
      ↓
Select Theater
      ↓
Select Date
      ↓
Select Showtime
      ↓
Select Seats
      ↓
Temporarily Hold Seats
      ↓
Checkout
      ↓
Stripe Payment
      ↓
Webhook Confirmation
      ↓
Generate Ticket
      ↓
QR Code / Booking History
```

The platform is not simply a CRUD movie application.

The core engineering challenge is:

> **Safely selling a finite seat inventory to many concurrent users
> while keeping payment, booking, and ticket state consistent.**

The architecture must therefore prioritize:

-   Correct seat ownership
-   Atomic state transitions
-   Idempotency
-   Transactional consistency
-   Secure payment handling
-   Strong authorization
-   Horizontal scalability
-   Fault recovery
-   Observability
-   Good real-world user experience

------------------------------------------------------------------------

# 2. Architectural Principles

The system should follow these principles.

## 2.1 PostgreSQL is the source of truth

PostgreSQL owns authoritative state for:

``` text
Users
Movies
Theaters
Screens
Seats
Shows
ShowSeats
Bookings
BookingSeats
Payments
Tickets
Refunds
AuditLogs
```

Redis may accelerate operations, but Redis must not become the permanent
source of truth for booking ownership.

------------------------------------------------------------------------

## 2.2 Stripe is the source of truth for payment events

The browser redirect is not proof of payment.

The authoritative payment confirmation flow is:

``` text
Stripe
   ↓
Signed Webhook
   ↓
NestJS
   ↓
Database Transaction
   ↓
Booking Confirmed
```

------------------------------------------------------------------------

## 2.3 The client never determines money

The client may send:

``` text
showId
seatIds
couponCode
```

The client must never be trusted for:

``` text
ticketPrice
tax
fee
discountAmount
totalAmount
paymentStatus
bookingStatus
```

The server calculates those values.

------------------------------------------------------------------------

## 2.4 Seat availability is authoritative on the server

The frontend may display:

``` text
AVAILABLE
HELD
BOOKED
```

but the frontend state is never authoritative.

Every booking operation validates the current database state.

------------------------------------------------------------------------

## 2.5 Idempotency is mandatory

Requests can be retried.

Webhooks can be delivered more than once.

Workers can restart.

Users can double-click.

The system must safely handle repeated commands.

------------------------------------------------------------------------

## 2.6 Start as a modular monolith

Do not begin with dozens of microservices.

Use:

``` text
One NestJS application
        ↓
Well-isolated domain modules
```

The architecture should allow later extraction of services without
forcing premature distributed-system complexity.

------------------------------------------------------------------------

# 3. Recommended Technology Stack

  Layer                      Technology
  -------------------------- ---------------------------
  Frontend                   Next.js 16
  UI                         Tailwind CSS
  Language                   TypeScript
  Backend Framework          NestJS
  Runtime                    Node.js 24 LTS
  Database                   PostgreSQL
  ORM                        Prisma
  Cache                      Redis
  Distributed Coordination   Redis
  Job Queue                  BullMQ
  Payment                    Stripe
  Media                      S3 / Cloudinary
  Realtime                   Socket.IO
  Validation                 Zod / NestJS validation
  Authentication             JWT + Refresh Tokens
  Password Hashing           Argon2id
  Testing                    Vitest / Jest + Supertest
  E2E                        Playwright
  API Docs                   OpenAPI / Swagger
  Logging                    Pino
  Error Tracking             Sentry
  Tracing                    OpenTelemetry
  Containerization           Docker
  CI/CD                      GitHub Actions

------------------------------------------------------------------------

# 4. High-Level Architecture

``` text
                         ┌─────────────────────┐
                         │      Cloudflare     │
                         │     CDN / WAF / DNS │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Next.js 16     │
                         │  React + Tailwind   │
                         └──────────┬──────────┘
                                    │
                              HTTPS / REST
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Load Balancer  │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  ▼                 ▼                 ▼
             ┌─────────┐      ┌─────────┐      ┌─────────┐
             │ API #1  │      │ API #2  │      │ API #3  │
             │ NestJS  │      │ NestJS  │      │ NestJS  │
             └────┬────┘      └────┬────┘      └────┬────┘
                  └─────────────────┼─────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
       ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
       │ PostgreSQL   │      │    Redis     │      │   Stripe     │
       │ Source Truth │      │ Cache/Locks  │      │   Payments   │
       └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
              │                     │                     │
              │                     ▼                     │
              │              ┌──────────────┐             │
              │              │    BullMQ    │             │
              │              │    Queues    │             │
              │              └──────┬───────┘             │
              │                     │                     │
              │          ┌──────────┼──────────┐          │
              │          ▼          ▼          ▼          │
              │       Expiry      Email      Ticket       │
              │       Worker      Worker     Worker       │
              │                                              
              └─────────────────────┬─────────────────────┘
                                    │
                                    ▼
                              Booking Domain
```

------------------------------------------------------------------------

# 5. Domain Architecture

The platform should be divided into these bounded modules:

``` text
Auth
Users
Movies
Genres
Languages
Theaters
Screens
Seats
Shows
Show Pricing
Seat Inventory
Bookings
Payments
Tickets
Refunds
Reviews
Notifications
Uploads
Search
Admin
Analytics
Audit
```

The most critical relationship is:

``` text
Movie
  │
  └── Show
        │
        └── Screen
              │
              └── Theater

Show
  │
  └── ShowSeat
          │
          └── BookingSeat
                  │
                  └── Booking
                        │
                        ├── Payment
                        └── Ticket
```

------------------------------------------------------------------------

# 6. User Types

## Normal User

Can:

-   Browse movies
-   Search movies
-   Select city
-   Browse theaters
-   View showtimes
-   Select seats
-   Create bookings
-   Pay
-   View tickets
-   Cancel eligible bookings
-   Request refunds where supported
-   Review movies
-   Manage profile
-   View booking history

## Theater Admin

Can manage assigned:

-   Theater
-   Screens
-   Seat layouts
-   Shows
-   Pricing
-   Theater-specific reports

## Content Manager

Can manage:

-   Movies
-   Posters
-   Trailers
-   Cast
-   Genres
-   Languages
-   Certifications

## Finance/Admin

Can access:

-   Payments
-   Refunds
-   Revenue
-   Settlement reports
-   Financial audit logs

## Super Admin

Can manage:

-   Users
-   Roles
-   Theaters
-   Movies
-   Shows
-   Bookings
-   Payments
-   Refunds
-   Platform settings
-   Audit logs

------------------------------------------------------------------------

# 7. Authentication

Authentication should support:

``` text
Email + Password
Google OAuth
Email Verification
Password Reset
Refresh Token
Logout
Logout All Devices
Session Management
```

Future:

``` text
Passkeys
2FA
Apple OAuth
```

------------------------------------------------------------------------

# 8. Authentication Security

Passwords must never be stored directly.

Use:

``` text
Argon2id
```

User records should contain:

``` text
passwordHash
```

and never:

``` text
password
```

in API responses.

JWT access tokens should be short-lived.

Refresh tokens should be:

``` text
HttpOnly
Secure in production
SameSite=Lax
Path=/
```

Do not store primary authentication tokens in localStorage.

------------------------------------------------------------------------

# 9. User Profile

Example:

``` text
/account
```

Profile:

``` text
Name
Email
Phone
Avatar
Preferred City
Preferred Language
```

Account pages:

``` text
/account
/account/profile
/account/bookings
/account/favorites
/account/settings
/account/security
```

------------------------------------------------------------------------

# 10. City and Location Model

Movie discovery is location-sensitive.

A user should be able to select:

``` text
Ahmedabad
Mumbai
Delhi
Bengaluru
Pune
Surat
```

Location should influence:

``` text
Movies
Theaters
Showtimes
Availability
Pricing
```

Recommended URL strategy:

``` text
/movies?city=ahmedabad
```

The selected city can also be persisted in a secure/preference cookie.

Do not store precise location unless the feature requires it.

------------------------------------------------------------------------

# 11. Movie Domain

Movie fields:

``` text
id
title
slug
description
durationMinutes
releaseDate
language
certification
status
posterUrl
backdropUrl
trailerUrl
rating
createdAt
updatedAt
```

Related:

``` text
MovieGenre
MovieLanguage
MovieCast
MovieCrew
MovieReview
```

------------------------------------------------------------------------

# 12. Movie Status

Possible states:

``` text
DRAFT
UPCOMING
NOW_SHOWING
ENDED
ARCHIVED
```

------------------------------------------------------------------------

# 13. Theater Domain

Theater:

``` text
id
name
slug
cityId
address
latitude
longitude
description
amenities
status
createdAt
updatedAt
```

Amenities may include:

``` text
IMAX
Dolby Atmos
Recliner
Parking
Food Court
Wheelchair Access
3D
4DX
```

------------------------------------------------------------------------

# 14. Screen / Auditorium

A theater contains multiple screens.

``` text
Theater
 ├── Screen 1
 ├── Screen 2
 ├── Screen 3
 └── IMAX
```

Screen:

``` text
id
theaterId
name
screenType
totalSeats
status
```

Screen types:

``` text
STANDARD
IMAX
4DX
DOLBY
PREMIUM
```

------------------------------------------------------------------------

# 15. Physical Seat Model

A physical seat belongs to a screen.

``` text
Seat
 ├── id
 ├── screenId
 ├── rowLabel
 ├── seatNumber
 ├── seatType
 ├── tier
 ├── xPosition
 ├── yPosition
 └── status
```

Seat types:

``` text
REGULAR
PREMIUM
RECLINER
WHEELCHAIR
COUPLE
```

Important:

> A physical seat is not globally booked.

Its availability belongs to a specific show.

------------------------------------------------------------------------

# 16. Show / Showtime

Show:

``` text
id
movieId
screenId
startTime
endTime
status
createdAt
updatedAt
```

The theater is derived through:

``` text
Show
 → Screen
 → Theater
```

Do not duplicate `theaterId` in the Show table unless there is a
documented denormalization requirement.

------------------------------------------------------------------------

# 17. Show Pricing

Pricing should be server-controlled.

Example:

``` text
Silver      ₹220
Gold        ₹320
Platinum    ₹450
Recliner    ₹550
```

Model:

``` text
ShowPrice
 ├── showId
 ├── tier
 ├── price
 ├── currency
 └── createdAt
```

------------------------------------------------------------------------

# 18. ShowSeat Inventory

This is the critical booking inventory.

``` text
ShowSeat
 ├── id
 ├── showId
 ├── seatId
 ├── status
 ├── holdToken
 ├── heldBy
 ├── heldUntil
 ├── bookedAt
 ├── createdAt
 └── updatedAt
```

Status:

``` text
AVAILABLE
HELD
BOOKED
BLOCKED
```

Database constraint:

``` text
UNIQUE(showId, seatId)
```

This prevents duplicate inventory rows.

------------------------------------------------------------------------

# 19. Why ShowSeat Exists

A physical seat can be:

``` text
Show A → BOOKED
Show B → AVAILABLE
Show C → HELD
```

Therefore:

``` text
Seat
```

represents the physical seat.

``` text
ShowSeat
```

represents that seat's inventory state for one specific show.

------------------------------------------------------------------------

# 20. Booking Model

Booking:

``` text
id
bookingNumber
userId
showId
status
subtotal
discountAmount
convenienceFee
taxAmount
totalAmount
currency
expiresAt
idempotencyKey
createdAt
updatedAt
```

Booking status:

``` text
PENDING
CONFIRMED
PAYMENT_FAILED
EXPIRED
CANCELLED
REFUND_PENDING
REFUNDED
```

------------------------------------------------------------------------

# 21. BookingSeat

Do not store only a comma-separated seat list.

Use a relation:

``` text
Booking
   ↓
BookingSeat
   ↓
ShowSeat
   ↓
Seat
```

BookingSeat:

``` text
bookingId
showSeatId
seatPrice
```

The price is captured at booking time so historical booking totals
remain correct even if future pricing changes.

------------------------------------------------------------------------

# 22. Payment Model

Payment:

``` text
id
bookingId
provider
providerPaymentId
stripeSessionId
amount
currency
status
failureReason
paidAt
createdAt
updatedAt
```

Payment statuses:

``` text
PENDING
PROCESSING
SUCCEEDED
FAILED
CANCELLED
REFUNDED
PARTIALLY_REFUNDED
```

------------------------------------------------------------------------

# 23. Ticket Model

Ticket:

``` text
id
bookingId
ticketNumber
qrCodePayload
issuedAt
status
```

Ticket statuses:

``` text
ACTIVE
USED
CANCELLED
```

A ticket should never be generated merely because a browser URL
contains:

``` text
?payment=success
```

Ticket generation happens after verified payment confirmation.

------------------------------------------------------------------------

# 24. Refund Model

Refund:

``` text
id
paymentId
bookingId
providerRefundId
amount
currency
status
reason
createdAt
completedAt
```

Refund status:

``` text
PENDING
PROCESSING
SUCCEEDED
FAILED
```

------------------------------------------------------------------------

# 25. Database Relationships

``` text
User
 └──< Booking

Movie
 └──< Show

Theater
 └──< Screen

Screen
 ├──< Seat
 └──< Show

Show
 ├──< ShowSeat
 ├──< ShowPrice
 └──< Booking

Seat
 └──< ShowSeat

Booking
 ├──< BookingSeat
 ├── Payment
 └── Ticket
```

------------------------------------------------------------------------

# 26. Core Database Constraints

Mandatory constraints include:

``` text
Movie.slug UNIQUE

User.email UNIQUE

Theater.slug UNIQUE

ShowSeat(showId, seatId) UNIQUE

Booking.bookingNumber UNIQUE

Payment.providerPaymentId UNIQUE

StripeEvent.eventId UNIQUE

Ticket.ticketNumber UNIQUE
```

Never rely exclusively on application code for uniqueness.

------------------------------------------------------------------------

# 27. Database Index Strategy

Important indexes:

``` text
users(email)

movies(slug)
movies(status, releaseDate)

theaters(cityId)

screens(theaterId)

seats(screenId)

shows(movieId, startTime)
shows(screenId, startTime)

show_seats(showId, status)
show_seats(showId, seatId)

bookings(userId, createdAt)
bookings(showId, status)
bookings(expiresAt)

payments(bookingId)
payments(providerPaymentId)

tickets(bookingId)

stripe_events(eventId)
```

Indexes should be validated against actual query plans.

------------------------------------------------------------------------

# 28. Seat Reservation Problem

The hardest problem is:

``` text
100 users
     ↓
same show
     ↓
same seat
```

Example:

``` text
User A → A1
User B → A1
User C → A1
```

Only one request can acquire the seat.

------------------------------------------------------------------------

# 29. Seat Hold Architecture

Recommended architecture:

``` text
Client
  ↓
POST /bookings/holds
  ↓
NestJS
  ↓
Redis coordination
  ↓
PostgreSQL transaction
  ↓
ShowSeat = HELD
  ↓
Booking = PENDING
```

Hold duration:

``` text
10 minutes
```

The exact duration should be configurable.

------------------------------------------------------------------------

# 30. Redis Seat Lock

Use a key such as:

``` text
seat-lock:{showId}:{seatId}
```

Example:

``` text
seat-lock:show_123:seat_A1
```

Set with an expiration.

Redis is used to reduce contention and coordinate concurrent requests.

It is not the authoritative ownership record.

------------------------------------------------------------------------

# 31. Database Seat Lock

Inside a transaction:

``` sql
SELECT *
FROM show_seats
WHERE show_id = $1
  AND seat_id = ANY($2)
  AND status = 'AVAILABLE'
FOR UPDATE;
```

Then verify:

``` text
returnedSeats === requestedSeats
```

If not:

``` text
ROLLBACK
```

and return a seat-unavailable error.

------------------------------------------------------------------------

# 32. Atomic Hold Flow

``` text
1. Authenticate user

2. Validate show

3. Validate requested seat IDs

4. Acquire Redis coordination locks

5. Begin database transaction

6. Lock ShowSeat rows

7. Verify all seats are AVAILABLE

8. Calculate server-side price

9. Create PENDING booking

10. Create BookingSeat records

11. Update ShowSeat → HELD

12. Set heldBy / heldUntil

13. Commit transaction

14. Schedule expiration job

15. Release Redis locks

16. Return bookingId + expiresAt
```

------------------------------------------------------------------------

# 33. Partial Seat Acquisition

Never allow:

``` text
A1 → HELD
A2 → HELD
A3 → FAILED
```

for a single booking request.

The request must be atomic.

Either:

``` text
A1 + A2 + A3 → HELD
```

or:

``` text
none → HELD
```

------------------------------------------------------------------------

# 34. Booking Expiration

When:

``` text
heldUntil < currentTime
```

the booking becomes:

``` text
EXPIRED
```

and seats return to:

``` text
AVAILABLE
```

Use BullMQ delayed jobs.

``` text
Create Hold
    ↓
Queue expiration job
    ↓
10 minutes
    ↓
Worker
    ↓
Check booking status
    ↓
If PENDING:
    transaction
       ↓
    release seats
       ↓
    EXPIRED
```

------------------------------------------------------------------------

# 35. Safe Expiration

The expiration worker must verify ownership.

Example:

``` text
bookingId = B123
seat A1 heldBy = B123
```

Only then can it release A1.

This prevents an old expiration job from releasing a newer hold.

------------------------------------------------------------------------

# 36. Payment Architecture

Correct flow:

``` text
User
 ↓
Select Seats
 ↓
POST /bookings/holds
 ↓
Booking PENDING
 ↓
Seats HELD
 ↓
POST /payments/checkout
 ↓
Server calculates total
 ↓
Stripe Checkout Session
 ↓
User pays
 ↓
Stripe Webhook
 ↓
Verify Signature
 ↓
Idempotency Check
 ↓
DB Transaction
 ↓
Payment SUCCEEDED
Booking CONFIRMED
Seats BOOKED
Ticket CREATED
```

------------------------------------------------------------------------

# 37. Stripe Price Security

The client sends:

``` json
{
  "showId": "show_123",
  "seatIds": ["A1", "A2"]
}
```

The client does not send:

``` json
{
  "amount": 100
}
```

Server calculates:

``` text
Seat prices
+ convenience fee
+ taxes
- valid discount
= final amount
```

------------------------------------------------------------------------

# 38. Stripe Metadata

Stripe Checkout metadata should contain:

``` text
bookingId
userId
environment
```

Example:

``` text
metadata:
  bookingId = "booking_123"
```

Do not put sensitive personal information into Stripe metadata
unnecessarily.

------------------------------------------------------------------------

# 39. Stripe Webhook

Endpoint:

``` text
POST /api/v1/payments/webhooks/stripe
```

The handler must:

``` text
1. Read raw request body

2. Verify Stripe signature

3. Parse event

4. Check event ID idempotency

5. Identify booking

6. Start database transaction

7. Confirm payment

8. Confirm booking

9. Mark seats BOOKED

10. Generate ticket

11. Record event

12. Commit

13. Return 2xx
```

------------------------------------------------------------------------

# 40. Stripe Event Idempotency

Create:

``` text
StripeEvent
 ├── eventId UNIQUE
 ├── eventType
 ├── processedAt
 └── payloadHash
```

If:

``` text
evt_123
```

arrives twice:

``` text
First → process
Second → detect existing event → safely acknowledge
```

------------------------------------------------------------------------

# 41. Payment Timeout

If the user never pays:

``` text
Booking → EXPIRED
ShowSeats → AVAILABLE
```

If payment succeeds near expiration, the payment-confirmation
transaction must determine the final valid state using explicit business
rules.

Do not blindly let:

``` text
expiration worker
```

and:

``` text
Stripe webhook
```

mutate the same booking without transactional checks.

------------------------------------------------------------------------

# 42. Payment State Machine

Recommended:

``` text
PENDING
   │
   ├── Stripe success ──→ SUCCEEDED
   │
   ├── Stripe failure ──→ FAILED
   │
   └── timeout ─────────→ EXPIRED
```

Booking:

``` text
PENDING
   │
   ├── payment success ──→ CONFIRMED
   ├── payment failure ──→ PAYMENT_FAILED
   ├── timeout ──────────→ EXPIRED
   └── cancellation ─────→ CANCELLED
```

------------------------------------------------------------------------

# 43. Ticket Generation

After confirmed payment:

``` text
BookingConfirmed
       ↓
Ticket Worker
       ↓
Generate ticket number
       ↓
Generate signed QR payload
       ↓
Store ticket
       ↓
Send confirmation notification
```

The QR payload should contain a non-sensitive ticket reference, not raw
personal information.

------------------------------------------------------------------------

# 44. QR Verification

At theater entrance:

``` text
Scanner
   ↓
Ticket Verification API
   ↓
Find Ticket
   ↓
Check:
  ticket exists
  status ACTIVE
  show valid
  time valid
   ↓
Mark ticket USED
```

Ticket usage must be atomic so the same ticket cannot be scanned
successfully twice.

------------------------------------------------------------------------

# 45. Frontend User Journey

The primary user experience should be:

``` text
Home
 ↓
Choose City
 ↓
Movies
 ↓
Movie Details
 ↓
Choose Date
 ↓
Choose Theater
 ↓
Choose Showtime
 ↓
Seat Map
 ↓
Seat Hold
 ↓
Checkout
 ↓
Stripe
 ↓
Booking Status
 ↓
Ticket
```

------------------------------------------------------------------------

# 46. Public Routes

Recommended URLs:

``` text
/
```

Home.

``` text
/movies
```

Movie discovery.

``` text
/movies/[movieSlug]
```

Movie details.

``` text
/movies/[movieSlug]/shows
```

Showtime selection.

``` text
/theaters
```

Theater discovery.

``` text
/theaters/[theaterSlug]
```

Theater details.

``` text
/search
```

Search.

------------------------------------------------------------------------

# 47. Booking Routes

``` text
/shows/[showId]/seats
```

Seat selection.

``` text
/checkout/[bookingId]
```

Checkout.

``` text
/bookings/[bookingId]
```

Booking status/details.

``` text
/tickets/[ticketId]
```

Ticket.

------------------------------------------------------------------------

# 48. Authentication Routes

``` text
/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password
/auth/verify-email
```

------------------------------------------------------------------------

# 49. Account Routes

``` text
/account
/account/profile
/account/bookings
/account/favorites
/account/settings
/account/security
```

------------------------------------------------------------------------

# 50. Admin Routes

``` text
/admin
/admin/movies
/admin/movies/new
/admin/movies/[movieId]/edit

/admin/theaters
/admin/theaters/new
/admin/theaters/[theaterId]/edit

/admin/screens
/admin/screens/[screenId]/layout

/admin/shows
/admin/shows/new
/admin/shows/[showId]/edit

/admin/bookings
/admin/payments
/admin/refunds
/admin/tickets
/admin/users
/admin/reports
/admin/audit-logs
/admin/settings
```

------------------------------------------------------------------------

# 51. Recommended Next.js Route Tree

``` text
app/
├── (public)/
│   ├── page.tsx
│   ├── movies/
│   │   ├── page.tsx
│   │   └── [movieSlug]/
│   │       ├── page.tsx
│   │       └── shows/
│   │           └── page.tsx
│   ├── theaters/
│   │   ├── page.tsx
│   │   └── [theaterSlug]/
│   │       └── page.tsx
│   └── search/
│       └── page.tsx
│
├── (booking)/
│   ├── shows/
│   │   └── [showId]/
│   │       └── seats/
│   │           └── page.tsx
│   ├── checkout/
│   │   └── [bookingId]/
│   │       └── page.tsx
│   └── bookings/
│       └── [bookingId]/
│           └── page.tsx
│
├── (account)/
│   └── account/
│       ├── page.tsx
│       ├── bookings/
│       ├── favorites/
│       ├── profile/
│       ├── settings/
│       └── security/
│
├── tickets/
│   └── [ticketId]/
│       └── page.tsx
│
├── auth/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
│
└── admin/
    ├── page.tsx
    ├── movies/
    ├── theaters/
    ├── screens/
    ├── shows/
    ├── bookings/
    ├── payments/
    ├── refunds/
    ├── tickets/
    ├── users/
    ├── reports/
    └── settings/
```

------------------------------------------------------------------------

# 52. Movie Details UX

The movie page should include:

``` text
Poster
Title
Rating
Certification
Duration
Genres
Languages
Release date
Synopsis
Cast
Crew
Trailer
Reviews
Related movies
Available cities
Available showtimes
```

Primary CTA:

``` text
Book Tickets
```

------------------------------------------------------------------------

# 53. Showtime UX

The user should see:

``` text
Avatar

Ahmedabad

Today | Tomorrow | Sat 10 | Sun 11

PVR IMAX
IMAX

10:30 AM
2:00 PM
6:30 PM
9:45 PM

INOX
Screen 2

11:15 AM
3:30 PM
8:00 PM
```

Filters:

``` text
Date
Language
Format
Price
Theater
Amenities
```

------------------------------------------------------------------------

# 54. Seat Map UX

Seat page should contain:

``` text
Movie
Theater
Screen
Date
Time

SCREEN

Seat Map

Available
Selected
Held
Booked

Silver
Gold
Platinum

Selected Seats

Subtotal
Fees
Taxes
Total

Continue
```

The seat map must be responsive.

------------------------------------------------------------------------

# 55. Seat Countdown UX

After successful hold:

``` text
Seats reserved for:

09:42
```

The timer is informational.

The backend remains authoritative using:

``` text
heldUntil
```

------------------------------------------------------------------------

# 56. Checkout UX

Display:

``` text
Movie
Theater
Screen
Date
Time
Seats

Ticket subtotal
Convenience fee
Taxes
Discount
Total
```

Then:

``` text
Pay ₹XXX
```

Never allow the client to alter the calculated amount.

------------------------------------------------------------------------

# 57. Payment Processing UX

After Stripe redirect:

``` text
Payment processing...

Please wait while we confirm your booking.
```

Then:

``` text
CONFIRMED
```

or:

``` text
PAYMENT FAILED
```

The page should query:

``` text
GET /api/v1/bookings/:bookingId
```

until the state is known.

------------------------------------------------------------------------

# 58. Ticket UX

Ticket page:

``` text
Movie
Theater
Screen
Date
Time
Seats

Booking ID

QR CODE

Download Ticket
Add to Calendar
Share
```

------------------------------------------------------------------------

# 59. Booking History

``` text
/account/bookings
```

Tabs:

``` text
Upcoming
Completed
Cancelled
```

Each booking:

``` text
Movie
Poster
Theater
Date
Time
Seats
Amount
Status
View Ticket
```

------------------------------------------------------------------------

# 60. Admin Dashboard

Dashboard should show server-side aggregated metrics:

``` text
Today's Revenue
Today's Bookings
Tickets Sold
Occupancy
Active Shows
Failed Payments
Refunds
Registered Users
```

Do not load thousands of bookings into the browser and then use:

``` text
filter()
reduce()
```

for analytics.

Use PostgreSQL aggregation.

------------------------------------------------------------------------

# 61. Analytics Queries

Use:

``` text
WHERE
GROUP BY
COUNT
SUM
AVG
DATE_TRUNC
FILTER
```

and where useful:

``` text
CTE
WINDOW FUNCTIONS
```

Example conceptual query:

``` sql
SELECT
    DATE_TRUNC('day', created_at) AS day,
    COUNT(*) AS bookings,
    SUM(total_amount) AS revenue
FROM bookings
WHERE created_at >= $1
GROUP BY day
ORDER BY day;
```

------------------------------------------------------------------------

# 62. API Architecture

Base path:

``` text
/api/v1
```

Authentication:

``` text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

Movies:

``` text
GET /movies
GET /movies/:movieId
GET /movies/:movieId/shows
```

Theaters:

``` text
GET /theaters
GET /theaters/:theaterId
GET /theaters/:theaterId/shows
```

Shows:

``` text
GET /shows/:showId
GET /shows/:showId/seats
```

Bookings:

``` text
GET  /bookings
POST /bookings/holds
GET  /bookings/:bookingId
POST /bookings/:bookingId/checkout
POST /bookings/:bookingId/cancel
```

Payments:

``` text
POST /payments/checkout
GET  /payments/:paymentId
POST /payments/webhooks/stripe
```

Tickets:

``` text
GET /tickets/:ticketId
POST /tickets/:ticketId/validate
```

------------------------------------------------------------------------

# 63. Pagination

Never return unbounded collections.

Use cursor pagination:

``` text
GET /movies?cursor=abc&limit=20
```

Response:

``` json
{
  "data": [],
  "nextCursor": "xyz",
  "hasMore": true
}
```

Use offset pagination only where the dataset and use case justify it,
such as some admin tables.

------------------------------------------------------------------------

# 64. API Response Format

Use consistent responses.

Success:

``` json
{
  "data": {},
  "meta": {}
}
```

Error:

``` json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "One or more selected seats are no longer available.",
    "requestId": "req_123"
  }
}
```

Do not expose stack traces to clients.

------------------------------------------------------------------------

# 65. HTTP Error Strategy

Use appropriate status codes:

``` text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

Seat conflicts should generally use:

``` text
409 Conflict
```

rather than a generic 500.

------------------------------------------------------------------------

# 66. Backend Folder Architecture

``` text
apps/
└── api/
    └── src/
        ├── main.ts
        ├── app.module.ts
        │
        ├── config/
        │
        ├── common/
        │   ├── decorators/
        │   ├── guards/
        │   ├── interceptors/
        │   ├── filters/
        │   ├── pipes/
        │   └── errors/
        │
        ├── modules/
        │   ├── auth/
        │   ├── users/
        │   ├── movies/
        │   ├── theaters/
        │   ├── screens/
        │   ├── seats/
        │   ├── shows/
        │   ├── bookings/
        │   ├── payments/
        │   ├── tickets/
        │   ├── refunds/
        │   ├── notifications/
        │   ├── uploads/
        │   └── admin/
        │
        ├── infrastructure/
        │   ├── database/
        │   ├── redis/
        │   ├── stripe/
        │   ├── storage/
        │   └── queue/
        │
        └── health/
```

------------------------------------------------------------------------

# 67. Module Internal Architecture

Example:

``` text
bookings/
├── booking.module.ts
├── booking.controller.ts
├── booking.service.ts
├── booking.repository.ts
├── booking.policy.ts
├── dto/
│   ├── create-hold.dto.ts
│   ├── checkout.dto.ts
│   └── cancel-booking.dto.ts
├── domain/
│   ├── booking-status.ts
│   └── booking-errors.ts
└── tests/
```

Routes should orchestrate.

Services should contain business rules.

Repositories should contain persistence operations.

------------------------------------------------------------------------

# 68. Layer Responsibilities

``` text
Controller
    ↓
HTTP concerns

Service
    ↓
Business rules

Repository
    ↓
Persistence

Infrastructure
    ↓
External systems
```

Do not put:

``` text
Stripe logic
SQL
Redis logic
pricing calculations
```

directly into controllers.

------------------------------------------------------------------------

# 69. Validation

Every request must be validated server-side.

Validate:

``` text
UUIDs
Enums
Strings
Numbers
Dates
Arrays
Seat IDs
Coupon codes
Pagination
```

Never trust:

``` text
req.body
req.query
req.params
headers
cookies
```

------------------------------------------------------------------------

# 70. Mass Assignment Protection

Never do:

``` ts
createUser(req.body)
```

because the user could submit:

``` json
{
  "email": "...",
  "password": "...",
  "role": "SUPER_ADMIN"
}
```

Instead explicitly map allowed fields:

``` text
email
password
name
```

Role must come from server-controlled logic.

------------------------------------------------------------------------

# 71. Authorization

Use:

``` text
Authentication
      ↓
Role
      ↓
Permission
      ↓
Resource Ownership
```

Example:

``` text
ADMIN
    → edit any movie

THEATER_ADMIN
    → edit assigned theater

USER
    → edit own profile
```

Never assume authentication implies authorization.

------------------------------------------------------------------------

# 72. Next.js Proxy

Next.js 16 uses:

``` text
src/proxy.ts
```

for request-level proxy behavior.

Use it for:

``` text
Authentication presence
Redirects
Basic route protection
Request-level checks
```

Do not use it as the only authorization layer.

The backend must independently enforce authorization.

------------------------------------------------------------------------

# 73. Security Architecture

Minimum:

``` text
HTTPS
Secure cookies
HttpOnly cookies
SameSite policy
Password hashing
JWT signature validation
RBAC
Input validation
Rate limiting
CORS
CSRF strategy
CSP
XSS protection
SQL injection protection
Upload validation
Audit logging
Secrets management
```

------------------------------------------------------------------------

# 74. JWT Verification

Never decode a JWT using:

``` text
Buffer.from(payload)
```

and treat the contents as trusted.

JWTs must have their signatures cryptographically verified.

Use a library such as:

``` text
jose
```

where appropriate.

------------------------------------------------------------------------

# 75. Cookie Configuration

Production authentication cookies should use:

``` text
httpOnly: true
secure: true
sameSite: lax
path: /
```

`secure` can be conditional for local development.

Never expose authentication secrets to client-side JavaScript
unnecessarily.

------------------------------------------------------------------------

# 76. CORS

Production CORS should allow only known origins.

Example concept:

``` text
https://www.example.com
https://admin.example.com
```

Do not use:

``` text
Access-Control-Allow-Origin: *
```

for authenticated private APIs.

------------------------------------------------------------------------

# 77. Upload Security

For movie posters and admin media:

``` text
Maximum size
MIME validation
Extension validation
Image decoding validation
Random filenames
Storage outside API server
```

Allowed examples:

``` text
image/jpeg
image/png
image/webp
```

Uploads should be protected by authorization.

------------------------------------------------------------------------

# 78. Rate Limiting

Different endpoints need different limits.

Example starting points:

``` text
Login            strict
Register         strict
Password reset   very strict
Search           moderate
Movie listing    high
Seat hold        strict
Checkout         strict
Admin APIs       moderate
```

Values should be tuned using real traffic and abuse data.

------------------------------------------------------------------------

# 79. Idempotency API

Important mutating endpoints should accept:

``` http
Idempotency-Key: <uuid>
```

especially:

``` text
POST /bookings/holds
POST /payments/checkout
POST /bookings/:id/cancel
```

Store:

``` text
key
userId
endpoint
requestHash
response
status
expiresAt
```

------------------------------------------------------------------------

# 80. Caching Strategy

Redis can cache:

``` text
Popular movies
Movie details
Theater metadata
City lists
Genres
Static configuration
```

Do not treat cached seat availability as authoritative.

Seat ownership comes from transactional state.

------------------------------------------------------------------------

# 81. Cache Invalidation

For mutable data:

``` text
Update movie
    ↓
DB commit
    ↓
Invalidate cache
```

Avoid manually maintaining multiple competing sources of truth.

------------------------------------------------------------------------

# 82. Realtime Seat Updates

Use Socket.IO for UI synchronization.

Example:

``` text
User A holds A1
        ↓
Booking Service
        ↓
Event
        ↓
Socket.IO
        ↓
Users viewing same show
        ↓
A1 becomes unavailable
```

WebSocket state is informational.

The booking API remains authoritative.

------------------------------------------------------------------------

# 83. Socket Rooms

Use:

``` text
show:{showId}
```

Users viewing:

``` text
/show/123/seats
```

join:

``` text
show:123
```

Events:

``` text
SEAT_HELD
SEAT_RELEASED
SEAT_BOOKED
SHOW_UPDATED
```

------------------------------------------------------------------------

# 84. Event-Driven Components

Useful domain events:

``` text
USER_CREATED
MOVIE_CREATED
SHOW_CREATED
SEAT_HELD
SEAT_RELEASED
BOOKING_CREATED
BOOKING_EXPIRED
PAYMENT_CREATED
PAYMENT_SUCCEEDED
PAYMENT_FAILED
BOOKING_CONFIRMED
TICKET_CREATED
TICKET_USED
BOOKING_CANCELLED
REFUND_CREATED
REFUND_COMPLETED
```

------------------------------------------------------------------------

# 85. Background Workers

Workers should handle:

``` text
Booking expiration
Email delivery
Ticket generation
QR generation
Notifications
Refund processing
Analytics aggregation
Search indexing
Image processing
Cleanup jobs
```

Keep slow operations out of synchronous HTTP requests where possible.

------------------------------------------------------------------------

# 86. Notification System

Notification channels:

``` text
In-app
Email
Push
```

Events:

``` text
BOOKING_CONFIRMED
PAYMENT_FAILED
BOOKING_EXPIRED
TICKET_ISSUED
REFUND_COMPLETED
SHOW_CANCELLED
```

Notification preferences:

``` text
Email
Push
Marketing
Transactional
```

Transactional booking notifications should be handled separately from
marketing preferences.

------------------------------------------------------------------------

# 87. Email System

Emails:

``` text
Welcome
Verify email
Password reset
Booking confirmation
Ticket
Payment failure
Booking expiration
Cancellation
Refund
Show cancellation
```

Use an email provider rather than sending directly from the API server.

------------------------------------------------------------------------

# 88. Search

MVP:

``` text
PostgreSQL Full Text Search
```

Search:

``` text
Movies
Theaters
Cities
Genres
Languages
```

At scale:

``` text
PostgreSQL
   ↓
Domain Event
   ↓
Queue
   ↓
OpenSearch
```

Do not introduce OpenSearch before it solves a real requirement.

------------------------------------------------------------------------

# 89. Movie Discovery

Filters:

``` text
City
Language
Genre
Format
Certification
Rating
Date
Theater
Price
```

Sorting:

``` text
Popularity
Release date
Rating
Title
```

------------------------------------------------------------------------

# 90. Reviews

Users can review movies after a verified eligible booking.

Review:

``` text
id
userId
movieId
bookingId
rating
title
body
status
createdAt
updatedAt
```

Enforce a business rule such as:

``` text
Only users with a completed booking for the movie may submit a verified review.
```

Prevent duplicate reviews according to the chosen product rule.

------------------------------------------------------------------------

# 91. Theater Cancellation / Show Changes

If a show is cancelled:

``` text
Show
 ↓
CANCELLED
 ↓
Affected bookings identified
 ↓
Payments/refunds processed
 ↓
Users notified
```

Do not delete historical bookings.

Use status transitions.

------------------------------------------------------------------------

# 92. Historical Data

Never delete financial records merely because a booking is cancelled.

Preserve:

``` text
Booking
Payment
Refund
Ticket
Audit
```

with appropriate status changes.

This is important for reconciliation and support.

------------------------------------------------------------------------

# 93. Audit Logging

Audit:

``` text
Admin login
Role changes
Movie changes
Show creation
Show cancellation
Price changes
Booking cancellation
Refunds
User suspension
Ticket validation
```

Audit record:

``` text
actorId
action
resourceType
resourceId
metadata
ip
userAgent
createdAt
```

Avoid logging secrets or payment credentials.

------------------------------------------------------------------------

# 94. Observability

You need:

``` text
Logs
Metrics
Traces
Error tracking
Alerts
```

Monitor:

``` text
API latency
HTTP error rate
DB latency
Redis latency
Queue depth
Worker failures
Payment failures
Seat-hold conflicts
Booking conversion
Webhook failures
CPU
Memory
Storage
```

------------------------------------------------------------------------

# 95. Correlation IDs

Every request should have:

``` text
requestId
```

Propagate it through:

``` text
Next.js
 ↓
NestJS
 ↓
Service
 ↓
Queue
 ↓
Worker
```

This makes production debugging significantly easier.

------------------------------------------------------------------------

# 96. Health Checks

Expose:

``` text
GET /health
GET /health/live
GET /health/ready
```

Readiness should check required dependencies.

Example:

``` text
PostgreSQL
Redis
```

Do not make third-party payment provider availability a reason for the
entire API to fail readiness unless the service genuinely cannot operate
without it.

------------------------------------------------------------------------

# 97. Graceful Shutdown

NestJS must gracefully handle:

``` text
SIGTERM
SIGINT
```

Shutdown flow:

``` text
Stop accepting new work
        ↓
Finish active requests
        ↓
Stop workers
        ↓
Close Redis
        ↓
Close DB
        ↓
Exit
```

------------------------------------------------------------------------

# 98. Horizontal Scaling

API servers must be stateless.

Do not store critical session state in:

``` text
process memory
```

Use:

``` text
PostgreSQL
Redis
```

for shared state.

Then:

``` text
API #1
API #2
API #3
```

can safely serve the same user.

------------------------------------------------------------------------

# 99. Queue Scaling

Workers can scale independently.

``` text
API
 ↓
Redis/BullMQ
 ↓
Worker 1
Worker 2
Worker 3
```

If ticket generation grows:

``` text
ticket workers ↑
```

without scaling the entire API.

------------------------------------------------------------------------

# 100. PostgreSQL Scaling

Start with:

``` text
Primary PostgreSQL
```

Later:

``` text
Primary
 ├── Read Replica 1
 └── Read Replica 2
```

Do not send booking writes to read replicas.

Critical booking operations always use the primary.

------------------------------------------------------------------------

# 101. Database Transactions

Use transactions for:

``` text
Seat hold
Booking creation
Payment confirmation
Seat booking
Ticket creation
Cancellation
Refund state changes
```

A transaction should be short.

Never hold a database transaction open while waiting for:

``` text
Stripe
Email provider
External HTTP request
User interaction
```

------------------------------------------------------------------------

# 102. Transaction Boundaries

Correct:

``` text
BEGIN
  lock seats
  create booking
  update seats
COMMIT
```

Incorrect:

``` text
BEGIN
  lock seats
  call Stripe
  wait
  wait
  wait
  COMMIT
```

------------------------------------------------------------------------

# 103. Failure Scenarios

The system must explicitly handle:

``` text
User double-clicks Pay
Stripe webhook retries
Browser closes after payment
API crashes during booking
Redis restarts
Worker crashes
Database connection drops
Payment succeeds but redirect fails
Payment fails after temporary hold
Booking expires while payment is processing
Two users select the same seat
```

------------------------------------------------------------------------

# 104. Failure: Browser Closes After Payment

Correct behavior:

``` text
Stripe payment succeeds
        ↓
Webhook arrives
        ↓
Booking confirmed
        ↓
Ticket generated
```

The browser does not matter.

User can later open:

``` text
/account/bookings
```

and see the ticket.

------------------------------------------------------------------------

# 105. Failure: Webhook Delayed

The booking may temporarily display:

``` text
PAYMENT_PROCESSING
```

The frontend should not invent success.

When webhook arrives:

``` text
CONFIRMED
```

------------------------------------------------------------------------

# 106. Failure: API Crashes During Hold

Because the hold is transactional:

``` text
Either:
booking + seats committed

or:
nothing committed
```

The system should not leave partial booking state.

Redis locks should expire automatically.

------------------------------------------------------------------------

# 107. Failure: Worker Crashes

BullMQ should retry jobs with controlled backoff.

Example:

``` text
Attempt 1
   ↓
failure
   ↓
backoff
   ↓
Attempt 2
   ↓
failure
   ↓
Attempt 3
```

Jobs must themselves be idempotent.

------------------------------------------------------------------------

# 108. Testing Strategy

Testing is a first-class part of this project.

## Unit Tests

Test:

``` text
Pricing
Booking state machine
Seat validation
Permissions
Refund rules
```

## Integration Tests

Test:

``` text
PostgreSQL
Redis
Stripe webhook logic
Repositories
Transactions
```

## E2E Tests

Test:

``` text
Login
Movie discovery
Show selection
Seat selection
Checkout
Booking confirmation
Ticket
Cancellation
```

------------------------------------------------------------------------

# 109. Concurrency Testing

This project must include explicit concurrency tests.

Test:

``` text
100 concurrent users → A1
```

Expected:

``` text
Exactly one successful hold
Remaining requests → 409
```

Also test:

``` text
A1 + A2
A2 + A3
A1 + A3
```

simultaneously.

------------------------------------------------------------------------

# 110. Payment Concurrency Tests

Test:

``` text
same Stripe webhook × 10
```

Expected:

``` text
one payment state transition
one ticket
one booking confirmation
```

No duplicate ticket.

------------------------------------------------------------------------

# 111. Expiration Race Tests

Test:

``` text
Payment webhook
       +
Expiration worker
```

at approximately the same time.

Expected:

``` text
valid transactional state
```

rather than:

``` text
CONFIRMED + AVAILABLE
```

or:

``` text
EXPIRED + BOOKED
```

------------------------------------------------------------------------

# 112. Security Tests

Test:

``` text
Mass assignment
Broken authorization
JWT tampering
Expired tokens
Invalid refresh tokens
SQL injection
XSS payloads
Rate limits
Unauthorized uploads
Path traversal
Invalid MIME types
Webhook signature tampering
```

------------------------------------------------------------------------

# 113. Frontend State Management

Prefer:

``` text
Server Components
+
TanStack Query where client fetching is needed
+
local feature state
```

Use Redux only where genuinely useful.

Do not put the entire server cache into Redux.

------------------------------------------------------------------------

# 114. Seat Page State

Seat UI can maintain:

``` text
selectedSeatIds
showId
bookingId
expiresAt
```

The actual availability comes from the server.

When hold succeeds:

``` text
bookingId
expiresAt
pricing
```

becomes the checkout state.

------------------------------------------------------------------------

# 115. Optimistic UI Rules

Do not optimistically assume:

``` text
seat = successfully held
```

A click can be optimistic visually, but the application must wait for:

``` text
POST /bookings/holds
```

before treating the hold as authoritative.

------------------------------------------------------------------------

# 116. SEO

Public pages should support:

``` text
SSR
Metadata
OpenGraph
Canonical URLs
Sitemap
robots.txt
Structured data
```

Important public pages:

``` text
Movies
Movie details
Theaters
Theater details
Cities
```

Authenticated booking pages do not need to be SEO-oriented.

------------------------------------------------------------------------

# 117. URL Design

Prefer:

``` text
/movies/avatar-fire-and-ash
/theaters/pvr-ahmedabad
/movies/avatar-fire-and-ash/shows
/shows/show_123/seats
/checkout/booking_123
/tickets/ticket_123
```

Avoid exposing internal implementation details such as:

``` text
/client/movies/[id]
```

in public URLs.

------------------------------------------------------------------------

# 118. Accessibility

Seat maps must support:

``` text
Keyboard navigation
Focus indicators
ARIA labels
Screen reader announcements
Color + icon state indicators
```

Do not represent seat availability only through color.

Use:

``` text
Available
Selected
Held
Booked
```

with accessible labels.

------------------------------------------------------------------------

# 119. Responsive Design

Support:

``` text
Mobile
Tablet
Desktop
```

Seat selection especially requires careful responsive design.

Mobile:

``` text
sticky booking summary
horizontal seat map navigation
large touch targets
```

Desktop:

``` text
centered seat map
persistent booking summary
```

------------------------------------------------------------------------

# 120. Admin Show Creation Flow

Admin:

``` text
Select Movie
      ↓
Select Theater
      ↓
Select Screen
      ↓
Select Date
      ↓
Start Time
      ↓
End Time
      ↓
Pricing
      ↓
Review
      ↓
Create Show
```

Server validates:

``` text
Screen belongs to theater
No overlapping show
Movie available
Valid time range
Pricing valid
```

------------------------------------------------------------------------

# 121. Prevent Screen Schedule Conflicts

A screen cannot have:

``` text
Show A: 18:00 → 21:00
Show B: 20:00 → 23:00
```

unless your product explicitly allows overlap.

Validate overlapping intervals before creating a show.

Prefer a database-supported strategy where practical so concurrent admin
requests cannot create conflicting schedules.

------------------------------------------------------------------------

# 122. Show Generation

Creating a show should generate its inventory:

``` text
Show created
    ↓
Read Screen seats
    ↓
Create ShowSeat rows
    ↓
Apply tier/pricing mapping
```

This can be transactional for normal screen sizes.

For large layouts, it may be performed as a controlled job while
ensuring the show cannot be sold before inventory is ready.

------------------------------------------------------------------------

# 123. Pricing Engine

Create a dedicated pricing service.

``` text
PricingService
```

Responsibilities:

``` text
Seat tier price
Convenience fee
Tax
Coupon
Promotion
Final total
```

Example:

``` text
Subtotal
   ↓
Discount
   ↓
Taxable amount
   ↓
Tax
   ↓
Convenience fee
   ↓
Total
```

All money calculations must avoid floating-point errors.

Use integer minor units where appropriate:

``` text
₹250 = 25000 paise
```

------------------------------------------------------------------------

# 124. Coupon System

Future module:

``` text
Coupon
Promotion
Eligibility
Usage
```

Coupon rules:

``` text
Minimum booking amount
Valid movie
Valid theater
Valid city
Valid date
Maximum discount
Per-user usage
Global usage
```

Coupon validation must happen server-side.

------------------------------------------------------------------------

# 125. Booking Cancellation

Cancellation should be policy-driven.

Example:

``` text
Show starts > 24h
    → eligible

Show starts < 2h
    → restricted

Show already started
    → not eligible
```

Do not hardcode cancellation logic into controllers.

Use:

``` text
CancellationPolicyService
```

------------------------------------------------------------------------

# 126. Refund Flow

``` text
User requests cancellation
        ↓
Validate policy
        ↓
Create refund record
        ↓
Stripe refund
        ↓
Webhook/status update
        ↓
Refund completed
        ↓
Booking updated
```

Do not mark a refund as completed merely because a refund request was
submitted.

------------------------------------------------------------------------

# 127. Notifications

Booking confirmation should trigger:

``` text
BookingConfirmed
       ↓
Queue
 ├── Email
 ├── Push
 └── In-app notification
```

The booking API should not wait for email delivery.

------------------------------------------------------------------------

# 128. Event Bus Evolution

Initially:

``` text
NestJS EventEmitter
+
BullMQ
```

Later, if scale requires:

``` text
Kafka
```

can be introduced.

Do not introduce Kafka merely because it is a common production
technology.

Use it when:

``` text
event volume
multiple independent consumers
durability requirements
replay
cross-service architecture
```

justify it.

------------------------------------------------------------------------

# 129. Infrastructure

Development:

``` text
Docker Compose
 ├── PostgreSQL
 ├── Redis
 └── API
```

Production:

``` text
Managed PostgreSQL
Managed Redis
Containerized NestJS
Containerized workers
Next.js deployment
Object storage
CDN
Stripe
```

------------------------------------------------------------------------

# 130. Environment Variables

Never hardcode:

``` text
localhost
Stripe keys
JWT secrets
Database credentials
Redis credentials
Storage credentials
```

Use:

``` text
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_API_URL
STORAGE_BUCKET
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
```

Provide:

``` text
.env.example
```

without real secrets.

------------------------------------------------------------------------

# 131. Environment Separation

Use:

``` text
development
test
staging
production
```

Never use production Stripe credentials locally.

Use Stripe test mode for development.

------------------------------------------------------------------------

# 132. CI/CD

Pipeline:

``` text
Pull Request
    ↓
Install
    ↓
Lint
    ↓
Typecheck
    ↓
Unit Tests
    ↓
Integration Tests
    ↓
Build
    ↓
Security Checks
    ↓
Deploy Staging
    ↓
Smoke Tests
    ↓
Production
```

------------------------------------------------------------------------

# 133. Git Workflow

Recommended:

``` text
main
develop
feature/*
fix/*
chore/*
```

Require:

``` text
Pull Request
CI
Review
```

before merging production changes.

------------------------------------------------------------------------

# 134. Docker Architecture

API image:

``` text
Node.js
  ↓
pnpm install
  ↓
build
  ↓
production dependencies
```

Worker image can reuse the same application image with a different
command.

Frontend can use a separate optimized Next.js image or the hosting
platform's native build system.

------------------------------------------------------------------------

# 135. Secrets Management

Production secrets should live in:

``` text
Cloud secret manager
```

rather than:

``` text
.env committed to Git
```

Never commit:

``` text
.env
Stripe secret
JWT secret
Database password
Cloud credentials
```

------------------------------------------------------------------------

# 136. Data Backup

PostgreSQL:

``` text
Automated backups
Point-in-time recovery
Retention policy
Restore testing
```

Backups are only useful if restore procedures are tested.

------------------------------------------------------------------------

# 137. Disaster Recovery

Define:

``` text
RPO
RTO
```

Example target:

``` text
RPO: minutes
RTO: under an hour
```

Actual targets should be chosen according to business requirements.

------------------------------------------------------------------------

# 138. Financial Reconciliation

A production ticketing system needs reconciliation.

Compare:

``` text
Internal Payments
        vs
Stripe Payments
```

Regularly detect:

``` text
Payment in Stripe but missing internally
Payment internally marked successful but provider mismatch
Refund mismatch
Duplicate event
```

Create reconciliation jobs.

------------------------------------------------------------------------

# 139. Support/Admin Tools

Support staff should be able to search by:

``` text
Booking number
Email
Payment ID
Ticket number
Transaction ID
```

Actions should be permission-controlled and audited.

------------------------------------------------------------------------

# 140. Admin Analytics

Metrics:

``` text
Gross revenue
Net revenue
Bookings
Tickets sold
Occupancy
Average order value
Cancellation rate
Refund amount
Payment failure rate
Seat hold conflict rate
Conversion rate
```

Use database aggregation or an analytics system rather than downloading
raw tables to the browser.

------------------------------------------------------------------------

# 141. Production SLOs

Define service objectives such as:

``` text
API availability
p95 latency
p99 latency
Webhook processing latency
Booking confirmation latency
Queue failure rate
```

Example targets should be established after observing real workloads
rather than blindly copied.

------------------------------------------------------------------------

# 142. Critical Invariants

These rules must always remain true.

## Invariant 1

``` text
One ShowSeat cannot belong to two active bookings.
```

## Invariant 2

``` text
A confirmed booking must have successful payment according to the payment state model.
```

## Invariant 3

``` text
A ticket cannot be generated twice for the same booking.
```

## Invariant 4

``` text
A ticket cannot be successfully consumed twice.
```

## Invariant 5

``` text
The client cannot determine the final payable amount.
```

## Invariant 6

``` text
A booking expiration job cannot release seats owned by another booking.
```

## Invariant 7

``` text
Stripe webhook retries cannot duplicate financial effects.
```

------------------------------------------------------------------------

# 143. Core State Machines

## ShowSeat

``` text
AVAILABLE
    │
    ▼
HELD
    │
    ├── payment success → BOOKED
    │
    ├── timeout → AVAILABLE
    │
    └── cancellation → AVAILABLE
```

## Booking

``` text
PENDING
   │
   ├── payment success → CONFIRMED
   ├── payment failure → PAYMENT_FAILED
   ├── timeout → EXPIRED
   └── cancellation → CANCELLED
```

## Ticket

``` text
ACTIVE
  │
  ├── scanned → USED
  │
  └── cancellation/refund → CANCELLED
```

------------------------------------------------------------------------

# 144. API Security Flow

``` text
Request
  ↓
Cloudflare/WAF
  ↓
Rate Limit
  ↓
NestJS
  ↓
Authentication
  ↓
Validation
  ↓
Authorization
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
PostgreSQL
```

------------------------------------------------------------------------

# 145. Booking Security Flow

``` text
Authenticated User
       ↓
Validate Show
       ↓
Validate Seat Ownership
       ↓
Validate Availability
       ↓
Acquire Coordination Lock
       ↓
DB Transaction
       ↓
Create Hold
       ↓
Return Booking
```

------------------------------------------------------------------------

# 146. Payment Security Flow

``` text
Client
  ↓
Booking ID
  ↓
Backend retrieves authoritative amount
  ↓
Stripe Checkout
  ↓
Stripe
  ↓
Signed Webhook
  ↓
Signature verification
  ↓
Idempotency
  ↓
DB Transaction
  ↓
Confirmed Booking
```

------------------------------------------------------------------------

# 147. Recommended Repository Structure

If using a monorepo:

``` text
apps/
├── web/
└── api/

packages/
├── database/
├── shared-types/
├── validation/
├── ui/
├── config/
└── eslint-config/
```

Example:

``` text
packages/database
```

contains Prisma schema and generated client.

``` text
packages/shared-types
```

contains safe shared contracts that do not couple frontend to backend
internals.

------------------------------------------------------------------------

# 148. Do Not Share Server Internals

Avoid sharing:

``` text
Prisma models
Database entities
Internal service classes
```

directly with Next.js.

Share:

``` text
API contracts
DTO-derived schemas
Enums
Safe response types
```

where appropriate.

------------------------------------------------------------------------

# 149. Frontend Feature Structure

``` text
src/
├── app/
├── features/
│   ├── auth/
│   ├── movies/
│   ├── theaters/
│   ├── shows/
│   ├── seats/
│   ├── bookings/
│   ├── payments/
│   └── tickets/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── query/
│   └── utils/
│
├── hooks/
└── types/
```

------------------------------------------------------------------------

# 150. Seat Component Architecture

``` text
SeatMap
 ├── Screen
 ├── SeatLegend
 ├── SeatRow
 │    ├── Seat
 │    ├── Seat
 │    └── Seat
 └── BookingSummary
```

Seat component receives server-derived state.

Example:

``` text
AVAILABLE
SELECTED
HELD
BOOKED
BLOCKED
```

------------------------------------------------------------------------

# 151. Frontend Data Fetching

Use:

``` text
Server Components
```

for SEO-friendly public data.

Use:

``` text
TanStack Query
```

for interactive client-side server state such as:

``` text
Seat availability
Booking status
Admin tables
Live updates
```

Use local state for:

``` text
Modal
Dropdown
UI selection
```

------------------------------------------------------------------------

# 152. Avoid Global Singleton State

Do not create one mutable Redux store shared across requests on the
server.

Prefer:

``` text
request-scoped store
```

or:

``` text
client-side store
```

for appropriate use cases.

Server state belongs to the server/cache layer.

------------------------------------------------------------------------

# 153. Production Logging

Use structured JSON logs.

Example:

``` json
{
  "level": "info",
  "event": "BOOKING_CONFIRMED",
  "bookingId": "booking_123",
  "userId": "user_456",
  "requestId": "req_789"
}
```

Never log:

``` text
password
JWT
Stripe secret
card number
CVV
refresh token
```

------------------------------------------------------------------------

# 154. Metrics

Track:

``` text
booking.hold.success
booking.hold.conflict
booking.confirmed
booking.expired
payment.success
payment.failed
payment.webhook.retry
ticket.created
ticket.validation.success
ticket.validation.duplicate
```

These metrics directly reveal business and concurrency problems.

------------------------------------------------------------------------

# 155. Alerts

Alert on:

``` text
High payment failure rate
High seat conflict rate
Webhook processing failures
Queue backlog
Database connection exhaustion
Redis failures
API error spikes
High p99 latency
Ticket generation failures
Refund failures
```

------------------------------------------------------------------------

# 156. Performance Strategy

Optimize in this order:

``` text
Correctness
 ↓
Database indexes
 ↓
Query optimization
 ↓
Caching
 ↓
Connection pooling
 ↓
Horizontal scaling
 ↓
Read replicas
 ↓
Search infrastructure
```

Do not start by adding microservices.

------------------------------------------------------------------------

# 157. Connection Pooling

PostgreSQL connections are finite.

Use a properly sized connection pool.

Do not create a new database client per request.

Use one managed Prisma client per application process.

------------------------------------------------------------------------

# 158. Redis Connection Strategy

Reuse Redis connections.

Separate concerns logically:

``` text
Cache
Locks
BullMQ
Rate limiting
```

Use separate Redis databases/instances where operational isolation is
needed.

------------------------------------------------------------------------

# 159. API Versioning

Use:

``` text
/api/v1
```

Future breaking changes can become:

``` text
/api/v2
```

Avoid breaking existing mobile/web clients unexpectedly.

------------------------------------------------------------------------

# 160. Documentation

Generate:

``` text
OpenAPI / Swagger
```

Document:

``` text
Authentication
Endpoints
Request schemas
Response schemas
Errors
Pagination
Idempotency
Webhooks
```

------------------------------------------------------------------------

# 161. Development Phases

## Phase 1 --- Foundation

Build:

``` text
Monorepo
Next.js
NestJS
PostgreSQL
Redis
Docker
Prisma
CI
```

------------------------------------------------------------------------

## Phase 2 --- Authentication

Build:

``` text
Register
Login
Refresh
Logout
Email verification
RBAC
```

------------------------------------------------------------------------

## Phase 3 --- Catalog

Build:

``` text
Movies
Genres
Languages
Theaters
Screens
Seats
```

------------------------------------------------------------------------

## Phase 4 --- Shows

Build:

``` text
Show creation
Show pricing
Schedule validation
ShowSeat generation
```

------------------------------------------------------------------------

## Phase 5 --- Booking Engine

Build:

``` text
Seat map
Redis coordination
PostgreSQL transactions
Seat holds
Expiration
Idempotency
```

------------------------------------------------------------------------

## Phase 6 --- Payments

Build:

``` text
Stripe Checkout
Webhook
Webhook idempotency
Payment state
Booking confirmation
```

------------------------------------------------------------------------

## Phase 7 --- Tickets

Build:

``` text
Ticket generation
QR
Ticket verification
Email
```

------------------------------------------------------------------------

## Phase 8 --- Frontend UX

Build:

``` text
Home
Movies
Movie details
Showtimes
Seat map
Checkout
Booking status
Tickets
Account
```

------------------------------------------------------------------------

## Phase 9 --- Admin

Build:

``` text
Dashboard
Movies
Theaters
Screens
Shows
Bookings
Payments
Refunds
Users
Reports
Audit
```

------------------------------------------------------------------------

## Phase 10 --- Hardening

Build:

``` text
Rate limits
Observability
Concurrency tests
Security tests
Load tests
Failure recovery
Backups
```

------------------------------------------------------------------------

# 162. MVP Scope

The first release should include:

``` text
Authentication
Movies
Cities
Theaters
Screens
Seats
Shows
Seat selection
Seat holds
Bookings
Stripe payments
Webhooks
Tickets
QR
Booking history
Admin movie management
Admin theater management
Admin show management
```

Avoid initially:

``` text
Microservices
Kafka
OpenSearch
ML recommendations
Complex loyalty
Marketplace
Advanced AI
```

------------------------------------------------------------------------

# 163. Production Evolution

Start:

``` text
Next.js
+
NestJS
+
PostgreSQL
+
Redis
+
BullMQ
```

Then evolve:

``` text
                    ┌───────────────┐
                    │   API Layer   │
                    └───────┬───────┘
                            │
               ┌────────────┼────────────┐
               ▼            ▼            ▼
           PostgreSQL      Redis       Queue
               │                         │
               │                         ▼
               │                     Workers
               │
               ▼
          Read Replicas
               │
               ▼
          Search Index
```

Only later extract:

``` text
Payment Service
Notification Service
Search Service
Booking Service
```

if operational requirements justify it.

------------------------------------------------------------------------

# 164. Why Node.js + NestJS

Node.js is suitable for this application because the API workload is
primarily:

``` text
HTTP
Database
Redis
Stripe
Queues
WebSockets
```

NestJS provides:

``` text
Modules
Dependency Injection
Guards
Interceptors
Pipes
Controllers
Testing structure
OpenAPI integration
```

Use Node.js for the API while keeping computationally heavy work in
workers or specialized services.

------------------------------------------------------------------------

# 165. Why PostgreSQL Instead of MongoDB

MongoDB can support this application, but PostgreSQL is the recommended
primary database for this design because the core domain has strong
relational and transactional characteristics:

``` text
Theater → Screen → Seat
Movie → Show
Show → ShowSeat
Booking → BookingSeat
Booking → Payment
Booking → Ticket
```

PostgreSQL also gives you strong constraints and mature transaction
semantics for this type of inventory system.

MongoDB remains a valid alternative if the project's primary learning
objective is MongoDB.

------------------------------------------------------------------------

# 166. Why Redis

Redis is useful for:

``` text
Seat coordination
Caching
Rate limiting
BullMQ
Short-lived state
Realtime fan-out support
```

But:

> Redis should accelerate the booking system, not replace the
> transactional database.

------------------------------------------------------------------------

# 167. Why BullMQ

BullMQ is appropriate for:

``` text
Booking expiration
Emails
Notifications
Ticket generation
Image processing
Reconciliation
Cleanup
```

It keeps slow operations out of request-response paths.

------------------------------------------------------------------------

# 168. Why Not Microservices Initially

Microservices add:

``` text
Network failures
Distributed tracing
Service discovery
Deployment complexity
Data ownership problems
Event consistency
Operational overhead
```

A modular monolith gives:

``` text
Clear boundaries
One deployment
One transaction boundary
Simple local development
Easy testing
Future extraction path
```

------------------------------------------------------------------------

# 169. Production Booking Sequence

Complete sequence:

``` text
1. User opens movie
2. User selects city
3. User selects theater
4. User selects show
5. Client requests seat map
6. Server returns ShowSeat state
7. User selects seats
8. Client requests hold
9. Redis coordinates
10. PostgreSQL transaction locks seats
11. Booking PENDING created
12. Seats HELD
13. Expiration job scheduled
14. Client opens checkout
15. Server calculates authoritative amount
16. Stripe Checkout created
17. User pays
18. Stripe sends webhook
19. Signature verified
20. Event idempotency checked
21. Transaction begins
22. Payment marked succeeded
23. Booking marked confirmed
24. Seats marked booked
25. Ticket created
26. Transaction commits
27. Notification job queued
28. Client displays confirmed booking
```

------------------------------------------------------------------------

# 170. Production Cancellation Sequence

``` text
User
 ↓
POST /bookings/:id/cancel
 ↓
Authenticate
 ↓
Authorize ownership
 ↓
Validate cancellation policy
 ↓
DB transaction
 ↓
Booking → CANCELLED
 ↓
Seats → AVAILABLE
 ↓
Refund record created
 ↓
Commit
 ↓
Stripe refund request
 ↓
Refund webhook/status
 ↓
Refund → SUCCEEDED
```

Financial operations must be auditable.

------------------------------------------------------------------------

# 171. Production Show Cancellation Sequence

``` text
Admin
 ↓
Cancel Show
 ↓
Authorization
 ↓
Show → CANCELLED
 ↓
Find affected bookings
 ↓
Queue refunds
 ↓
Queue notifications
 ↓
Process refunds
 ↓
Notify users
```

Do not synchronously refund hundreds or thousands of users in the admin
HTTP request.

------------------------------------------------------------------------

# 172. Core Business Rules

The system must enforce:

``` text
A user cannot book an unavailable seat.

A seat hold must have an expiration.

Expired holds cannot be paid successfully without passing the booking state rules.

A confirmed booking must not lose its seats because of a stale expiration job.

A Stripe webhook can be delivered multiple times safely.

A ticket can only be generated once.

A ticket can only be consumed once.

A user cannot modify another user's booking.

An admin cannot access actions outside their permissions.

A client cannot set its own role.

A client cannot set its own payment status.

A client cannot choose its own total amount.
```

------------------------------------------------------------------------

# 173. Recommended Error Codes

``` text
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
AUTH_FORBIDDEN

MOVIE_NOT_FOUND
THEATER_NOT_FOUND
SHOW_NOT_FOUND

SEAT_NOT_FOUND
SEAT_UNAVAILABLE
SEAT_HOLD_EXPIRED
SEAT_ALREADY_HELD

BOOKING_NOT_FOUND
BOOKING_EXPIRED
BOOKING_NOT_CANCELLABLE

PAYMENT_NOT_FOUND
PAYMENT_FAILED
PAYMENT_ALREADY_PROCESSED
PAYMENT_WEBHOOK_INVALID

TICKET_NOT_FOUND
TICKET_ALREADY_USED

RATE_LIMITED
VALIDATION_FAILED
INTERNAL_ERROR
```

------------------------------------------------------------------------

# 174. Architecture Invariants for Agents

Any AI coding agent working on this repository must preserve:

``` text
PostgreSQL is authoritative for booking state.

Redis is not the sole source of seat ownership.

Prices are calculated server-side.

Stripe webhooks are authoritative for payment confirmation.

Webhook handlers are idempotent.

Seat holds are atomic.

Database constraints enforce uniqueness.

Bookings are never confirmed from query parameters.

Tickets are never generated solely by frontend redirects.

Authentication and authorization are enforced server-side.

Admin permissions are never accepted directly from client input.

Financial records are never silently deleted.

Historical bookings remain auditable.
```

------------------------------------------------------------------------

# 175. AI Coding Agent Rules

When modifying the project, an agent must:

1.  Read existing architecture before editing.
2.  Preserve working functionality unless explicitly changing it.
3.  Never weaken security to make a feature easier.
4.  Never use `any` unless explicitly justified.
5.  Avoid `unknown` unless narrowing is immediate and necessary.
6.  Validate external input.
7.  Add tests for concurrency-sensitive behavior.
8.  Add database constraints rather than relying only on application
    checks.
9.  Keep controllers thin.
10. Keep business rules inside services/domain logic.
11. Keep database operations inside repositories/infrastructure.
12. Never hardcode secrets or production URLs.
13. Never trust client-provided prices.
14. Never trust client-provided roles.
15. Never trust payment redirect parameters.
16. Preserve idempotency.
17. Preserve transaction boundaries.
18. Run lint, typecheck, tests, and build after significant changes.
19. Explain architectural changes before applying large refactors.
20. Prefer incremental migration over destructive rewrites.

------------------------------------------------------------------------

# 176. Definition of Production-Ready

The project should not be considered production-ready merely because:

``` text
npm run build
```

passes.

Production readiness requires:

``` text
Correct domain model
+
Secure authentication
+
Authorization
+
Transactional booking
+
Concurrency protection
+
Payment webhook correctness
+
Idempotency
+
Database constraints
+
Expiration handling
+
Error handling
+
Testing
+
Observability
+
Backups
+
Deployment automation
```

------------------------------------------------------------------------

# 177. Final Architecture

``` text
                         BOOKMYSHOW PLATFORM
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
           Discovery           Booking             Admin
              │                   │                   │
              ▼                   ▼                   ▼
          Next.js 16          Next.js 16          Next.js 16
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                                  ▼
                           NestJS API
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
          Catalog             Booking              Payments
             │                    │                    │
             │                    ▼                    ▼
             │              Seat Engine             Stripe
             │                    │                    │
             │             ┌──────┴──────┐             │
             │             ▼             ▼             │
             │          Redis       PostgreSQL ◄────────┘
             │             │             │
             │             ▼             │
             │          BullMQ           │
             │             │             │
             │       ┌─────┼─────┐       │
             │       ▼     ▼     ▼       │
             │    Expiry Email Ticket    │
             │                           │
             └───────────────────────────┘
```

------------------------------------------------------------------------

# 178. Final Technology Decision

## Frontend

``` text
Next.js 16
React 19
TypeScript
Tailwind CSS
TanStack Query where appropriate
```

## Backend

``` text
Node.js 24 LTS
TypeScript
NestJS
```

## Data

``` text
PostgreSQL
Prisma
Redis
BullMQ
```

## Payments

``` text
Stripe
```

## Storage

``` text
S3 / Cloudinary
```

## Realtime

``` text
Socket.IO
```

## Security

``` text
JWT
Refresh Tokens
Argon2id
RBAC
Rate Limiting
Validation
Secure Cookies
Audit Logs
```

## Operations

``` text
Docker
GitHub Actions
OpenTelemetry
Sentry
Structured Logging
```

------------------------------------------------------------------------

# 179. Implementation Priority

Build in this exact order:

``` text
1. Repository cleanup
2. Monorepo / application boundaries
3. PostgreSQL + Prisma
4. Core schema
5. Authentication
6. RBAC
7. Movie catalog
8. Theater + Screen + Seat
9. Show scheduling
10. ShowSeat generation
11. Seat availability API
12. Atomic seat holds
13. Booking state machine
14. Booking expiration
15. Stripe checkout
16. Stripe webhook
17. Payment idempotency
18. Ticket generation
19. QR validation
20. User booking history
21. Frontend seat experience
22. Admin dashboard
23. Notifications
24. Realtime updates
25. Observability
26. Concurrency tests
27. Load tests
28. Security hardening
29. Docker
30. CI/CD
31. Staging
32. Production readiness review
```

------------------------------------------------------------------------

# 180. Final Engineering Goal

The finished application should behave like this under normal traffic:

``` text
User selects seats
        ↓
Seats are atomically held
        ↓
Booking receives an expiration
        ↓
Server calculates exact price
        ↓
Stripe processes payment
        ↓
Webhook confirms payment
        ↓
Booking becomes CONFIRMED
        ↓
Seats become BOOKED
        ↓
Ticket is generated exactly once
        ↓
User receives ticket
```

And under abnormal conditions:

``` text
Double click
Retry
Webhook duplication
API crash
Worker crash
Redis restart
Payment redirect failure
Concurrent seat selection
Expiration/payment race
```

the system must still preserve its core invariants.

> **The objective is not to make the application look like BookMyShow.
> The objective is to build the underlying booking system with the
> consistency, concurrency control, security, and operational
> characteristics expected from a real ticketing platform.**
