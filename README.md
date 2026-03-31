# Hammers RUFC Equipment Manager

A mobile-first equipment inventory tracking system built for Hammers Rugby Union Football Club (Fort Collins, CO). Coaches and equipment managers use it to track gear across the club — checking items in and out, transferring equipment between coaches, grouping items into seasonal packages, and monitoring condition over time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| UI | React 19, [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui v4](https://ui.shadcn.com) (Base UI primitives) |
| Icons | [Lucide React](https://lucide.dev) |
| Backend | [Supabase](https://supabase.com) (PostgreSQL, Auth, Row Level Security) |
| Auth | Google OAuth (restricted to `@hammersrugby.com` domain) |
| Hosting | [Vercel](https://vercel.com) |
| QR Codes | [qrcode](https://www.npmjs.com/package/qrcode) |

## Architecture

```
src/
├── actions/          # Server Actions ('use server') for mutations
│   ├── auth.ts       # Sign in / sign out
│   ├── items.ts      # Create, update, retire equipment items
│   ├── loans.ts      # Check out / check in workflows
│   ├── packages.ts   # Package CRUD, bulk checkout
│   ├── transfers.ts  # Coach-to-coach transfer workflow
│   └── admin.ts      # User role management
├── app/
│   ├── (app)/        # Authenticated app routes (layout w/ sidebar + nav)
│   │   ├── admin/    # Admin pages (items, categories, locations, packages, reports)
│   │   ├── checkout/ # Check out equipment
│   │   ├── checkin/  # Check in equipment
│   │   ├── inventory/# Item list + detail pages
│   │   ├── transfers/# Transfer list + new transfer form
│   │   └── profile/  # User profile + current loans
│   ├── auth/         # OAuth callback handler
│   └── login/        # Login page
├── components/
│   ├── admin/        # Admin-specific components (item form, category manager)
│   ├── inventory/    # Status badges, condition logging, QR labels
│   ├── layout/       # Desktop sidebar, mobile nav, user menu
│   ├── packages/     # Package detail components
│   ├── transfers/    # Transfer actions, new transfer form
│   └── ui/           # shadcn/ui primitives
├── lib/
│   ├── supabase/     # Supabase client (server.ts) + hand-written DB types
│   ├── queries/      # Reusable read queries (items, etc.)
│   └── utils.ts      # Tailwind class merging utility
└── proxy.ts          # Next.js 16 proxy (auth session refresh, route protection)
```

### Key Patterns

- **Server Actions** handle all mutations. Forms submit directly to async functions marked with `'use server'`.
- **Row Level Security (RLS)** is enforced at the database level on every table. The Supabase client uses the user's auth token, so queries are scoped automatically.
- **Roles** — `admin`, `equipment_manager`, and `coach`. Admins and equipment managers can check items in/out and manage inventory. Coaches can view inventory, receive equipment, and transfer items between each other.
- **Transfers** use an acknowledgement workflow: the sender initiates, and the receiver must accept or decline. Acceptance is handled atomically via a Postgres `security definer` function.
- **Custom fields** are stored as JSONB — categories define field schemas (`custom_fields`), and items store values (`custom_attributes`).
- **Packages** group items for seasonal bulk checkout (e.g., "U10s Kit"). Individual loans are created per item so partial returns work with the existing check-in flow.

### Database Migrations

Migrations live in `supabase/migrations/` and are numbered sequentially:

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Profiles, categories, locations, items, loans, condition logs, RLS policies |
| `002_packages.sql` | Equipment packages and package items |
| `003_custom_fields.sql` | JSONB custom fields on categories and items |
| `004_transfers.sql` | Coach-to-coach transfer table, RLS, and `complete_transfer()` RPC |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Supabase](https://supabase.com) project
- A Google OAuth app configured in Supabase Auth (restrict to your domain if needed)

### 1. Clone and install

```bash
git clone https://github.com/hammers-eng/hammers-inventory-manager.git
cd hammers-inventory-manager
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project dashboard under **Settings > API**.

### 3. Run database migrations

Open the [Supabase SQL Editor](https://supabase.com/dashboard) for your project and run each migration file in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_packages.sql`
3. `supabase/migrations/003_custom_fields.sql`
4. `supabase/migrations/004_transfers.sql`

### 4. Configure authentication

In your Supabase dashboard:

1. Go to **Authentication > Providers > Google** and enable it with your OAuth credentials.
2. Go to **Authentication > URL Configuration** and add `http://localhost:3000/auth/callback` to the redirect URLs.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The app is deployed on [Vercel](https://vercel.com) and auto-deploys on every push to `main`.

### Setup

1. Import the GitHub repo into Vercel.
2. Add the same environment variables from `.env.local` to your Vercel project settings (**Settings > Environment Variables**).
3. In your Supabase dashboard, add your Vercel production URL to **Authentication > URL Configuration > Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```
4. Push to `main` — Vercel handles the rest.

### Manual deploys

```bash
npm run build   # Verify the build passes locally
git push        # Triggers auto-deploy on Vercel
```
