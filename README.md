# ClientPM

Full-stack client project management app — Next.js 14, Neon Postgres, Drizzle ORM, Tailwind CSS.

## Features
- **Dashboard** — task status cards, payment totals, overdue alerts
- **Clients** — add / edit / delete with contact details; auto slug generation
- **Tasks** — full CRUD per client; filter by status, payment, client; payment tracking
- **Calendar** — day / week / month views; link events to clients & tasks; client filter
- **Share Link** — `/share/[slug]` public page: client filters tasks by date range + status, sees invoice-style payment summary

## Setup

### 1. Install
```bash
npm install
```

### 2. Configure env
```bash
cp .env.local.example .env.local
# paste your Neon DATABASE_URL
```
Get it from [console.neon.tech](https://console.neon.tech) → your project → Connection Details (pooled string).

### 3. Push schema to DB
```bash
npm run db:push
```

### 4. Run locally
```bash
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel
1. Push repo to GitHub
2. Import in vercel.com
3. Add env var: `DATABASE_URL` = your Neon connection string
4. Deploy — done

## Share Link
Every client gets a public URL:
```
https://yourapp.vercel.app/share/[client-slug]
```
The client can filter by date range + task status and sees totals for paid / partial / unpaid.

## Scripts
```bash
npm run dev           # local dev
npm run build         # production build
npm run db:push       # push schema directly to Neon (fastest)
npm run db:generate   # generate migration SQL files
npm run db:migrate    # run migration files
npm run db:studio     # Drizzle Studio DB GUI
```
