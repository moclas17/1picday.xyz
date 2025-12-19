# 1picday PoC

A "1 picture a day" private journal app.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Auth**: Supabase Auth (Magic Link)
- **Database**: Supabase Postgres
- **Storage**: Amazon S3 (Private Objects)
- **Payments**: Stripe

## Setup

1. **Environment Variables**
   Copy `env.example` to `.env.local` and fill in the values:
   ```bash
   cp env.example .env.local
   ```

2. **Supabase Setup**
   - Create a new project.
   - Run the SQL in `supabase/schema.sql` in the SQL Editor.
   - Enable Auth -> Email -> Magic Link.
   - Set Site URL and Redirect URLs to `http://localhost:3000` (and `/auth/confirm`).

3. **S3 Setup**
   - Create a private S3 bucket.
   - Configure CORS to allow `POST` and `PUT` from `http://localhost:3000`.
   - Create an IAM User with `PutObject` and `GetObject` permissions for the bucket.

4. **Stripe Setup**
   - Create a Product and a Price (Recurring).
   - Set `STRIPE_PRICE_ID_PRO` in `.env.local`.
   - Setup Webhook to point to `/api/stripe/webhook` (use Stripe CLI for local dev).

5. **Run Locally**
   ```bash
   npm install
   npm run dev
   ```

## Features
- **Auth**: Magic Link Login.
- **Upload**: One photo per day limit.
- **Free Tier**: First 7 photos free. Upgrade required for 8th.
- **Timeline**: View your daily photos.
- **Recap**: View last 7 days.
- **Dark Mode**: Toggle via header.
