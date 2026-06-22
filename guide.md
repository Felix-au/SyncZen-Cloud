# SyncZen Cloud — Quick Run Guide

SyncZen Cloud is a Next.js 15 App Router web application for hotel guest check-in, room status tracking, and booking history logging. This guide shows you how to run and use the project on your machine.

> [!IMPORTANT]
> **Cloud-based Media Storage:** This application has been fully migrated to use **Cloudinary** for guest photos and group ID proofs. It no longer relies on Google Drive service accounts, meaning you only need a free Cloudinary account and a MongoDB database to run SyncZen Cloud fully.

---

## Table of Contents

- [How to Run](#how-to-run)
  - [Prerequisites](#prerequisites)
  - [Install and Run](#install-and-run)
- [Pre-Seeding the Super Admin](#pre-seeding-the-super-admin)
- [Cloudinary Setup](#cloudinary-setup)
- [Usage Basics](#usage-basics)
  - [Check-In Wizard Flow](#check-in-wizard-flow)
  - [Checking Out Bookings](#checking-out-bookings)
- [Directory Index Checklist](#directory-index-checklist)

---

## How to Run

### Prerequisites
* Windows 10/11 or macOS/Linux.
* Node.js v18.0 or higher installed.
* A running MongoDB instance (either local or a MongoDB Atlas URI).
* A free Cloudinary account.

### Install and Run

```bash
# 1. Install project dependencies
npm install

# 2. Duplicate environment template
cp .env.example .env.local
```

Next, open `.env.local` in your editor and fill out the values:
```env
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_SECRET=generate-a-32-char-random-string
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Seeding values for the first user
SUPER_ADMIN_EMAIL=admin@syncstay.com
SUPER_ADMIN_PASSWORD=change-me-immediately

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Then compile and run:
```bash
# 3. Compile next dev bundle and start server
npm run dev
```

---

## Pre-Seeding the Super Admin

Once the development server is running on `http://localhost:3000`, you must bootstrap the first system administrator account using the values configured under `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.

Run this `curl` command in your terminal:
```bash
curl -X POST http://localhost:3000/api/seed
```

This endpoint is idempotent and will return `200 OK` (skipping creation) if a user with that email already exists. Once bootstrapped, go to `http://localhost:3000/login` to log in as the Super Admin.

---

## Cloudinary Setup

To configure Cloudinary for photo uploads:
1. Log in to your Cloudinary console.
2. Retrieve your **Cloud Name**, **API Key**, and **API Secret** from the dashboard.
3. Paste these values into `.env.local`.
4. Uploaded guest photos are placed under `synczen/[hotelId]/checkin/` folders automatically.

---

## Usage Basics

### Check-In Wizard Flow

1. Go to the sidebar navigation and click **Check-In** (`/checkin`).
2. **Step 1 (Guest Details):** Enter the primary guest name, phone, age, sex, and select a check-out date. The number of stay nights is calculated automatically.
   * *Desktop enhancement:* Clicking or focusing on the date field brings up the calendar picker automatically on desktop browsers.
   * *Avatars:* Click the guest circle to crop and scale their photo in-browser.
   * *Breakdown constraint:* Ensure the sum of Male, Female, and Child guest fields matches the "Total Guests" field.
3. **Step 2 (ID Proof):** Upload front/back images of the group's ID proof (Aadhaar, Passport, etc.) and enter the document number.
4. **Step 3 (Select Room):** Select one or more available rooms. Adjust the nightly charge (default uses the room base price) and specify the payment mode (Cash or Online).
5. **Step 4 (Confirm):** Review all data and click **Complete Check-In**. Rooms will be set to `occupied`.

### Checking Out Bookings

1. Go to **Bookings** (`/bookings`).
2. Click any active booking row (status: `checked_in`) to open the Booking Details.
3. Click **Check Out Now** in the top right.
4. If checking out on a date different from the scheduled check-out date, a modal warns you to update the stay record.
5. In the checkout modal, enter the **Service Personnel Name** and choose:
   * **Check Out & Service:** The room is immediately cleaned and set back to `available`.
   * **Check Out Only:** The room is set to `maintenance` (requiring deep cleaning or repairs).

---

## Directory Index Checklist

| File / Folder | Role in Project |
|---|---|
| [`app/globals.css`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/app/globals.css) | Core style library; holds CSS variables, animations, and typography tokens. |
| [`app/layout.tsx`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/app/layout.tsx) | Root application layout; defines fonts and context wrappers. |
| [`middleware.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/middleware.ts) | Edge-compatible NextAuth middleware protecting all system routes. |
| [`lib/auth.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/lib/auth.ts) | Node-compatible NextAuth configurations, credentials handler, and DB queries. |
| [`lib/cloudinary.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/lib/cloudinary.ts) | Client for uploading files to the Cloudinary CDN. |
| [`lib/mongodb.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/lib/mongodb.ts) | Connection singleton caching the Mongoose connection pool. |
| [`lib/roles.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/lib/roles.ts) | Centralized role weight configuration helper. |
| [`lib/models/Booking.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/lib/models/Booking.ts) | Mongoose schema describing a stay record and nested guest documents. |
| [`app/(hotel)/checkin/page.tsx`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/app/(hotel)/checkin/page.tsx) | 4-step wizard UI page. |
| [`app/(hotel)/bookings/[id]/page.tsx`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/app/(hotel)/bookings/[id]/page.tsx) | Booking details UI page; handles inline edits and PDF downloads. |
| [`app/api/upload/route.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/app/api/upload/route.ts) | API route translating client base64 DataURIs into Cloudinary assets. |
| [`app/api/seed/route.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/app/api/seed/route.ts) | Bootstrapping script for creating the Super Admin user. |
| [`__tests__/roles.test.ts`](file:///c:/Users/Felix/Desktop/Hotel%20Sync%20Cloud/__tests__/roles.test.ts) | Jest tests verifying user permissions. |
