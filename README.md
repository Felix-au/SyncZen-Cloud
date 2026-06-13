# SyncStay Web

Modern hotel check-in management system — the web counterpart to the SyncState Android app.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth v5 — JWT strategy, Credentials provider |
| Database | MongoDB via Mongoose |
| File Storage | Google Drive (Service Account) |
| Styling | Vanilla CSS — glassmorphic dark/light theme |
| Tests | Jest + ts-jest |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in MONGODB_URI, NEXTAUTH_SECRET, GOOGLE_SA_KEY

# 3. Seed the super-admin account
curl -X POST http://localhost:3000/api/seed

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Roles

| Role | Can Do |
|---|---|
| `super_admin` | View all hotels and platform stats |
| `hotel_owner` | Everything — manage hotel, rooms, employees, bookings |
| `manager` | Manage rooms, employees (staff level), perform check-ins |
| `staff` | Perform check-ins and view bookings |

## Workflow

1. **Register** at `/register` — creates a `staff` account with no hotel
2. **Create hotel** at `/settings` → promoted to `hotel_owner`, receive invite key
3. **Share invite key** — employees register then enter key at `/join`
4. **Add rooms** at `/rooms`
5. **Check in guests** at `/checkin` — 4-step wizard (room → guests → ID → confirm)
6. **Manage bookings** at `/bookings` — list, view detail, check out

## Google Drive Setup

1. Create a GCP project and enable the Drive API
2. Create a Service Account, download the JSON key
3. Paste the JSON content as a single-line value in `GOOGLE_SA_KEY`
4. The service account needs no extra Drive permissions — it uploads to its own Drive space
5. Uploaded files are made `anyoneWithLink` readable (public CDN)

## Scripts

```bash
npm run dev      # Dev server (http://localhost:3000)
npm run build    # Production build
npm test         # Run Jest unit tests
npm run lint     # ESLint check
```

## Project Structure

```
├── app/
│   ├── (hotel)/          # Hotel app route group (Sidebar layout)
│   │   ├── dashboard/
│   │   ├── rooms/
│   │   ├── checkin/
│   │   ├── bookings/[id]/
│   │   ├── employees/
│   │   └── settings/
│   ├── super/            # Super-admin pages
│   ├── api/              # REST API routes
│   ├── login/
│   ├── register/
│   └── join/
├── components/           # Shared UI components
├── lib/
│   ├── models/           # Mongoose schemas
│   ├── auth.ts           # NextAuth (Node.js)
│   ├── auth-edge.ts      # NextAuth JWT-only (Edge/middleware)
│   ├── drive.ts          # Google Drive upload client
│   ├── mongodb.ts        # Connection singleton
│   └── roles.ts          # RBAC permission helpers
├── __tests__/            # Jest unit tests
└── middleware.ts         # Route protection (Edge Runtime)
```
