# Boardify — Auth + Database Plan

## Stack
- **Auth**: Auth.js v5 (next-auth) with Google OAuth provider
- **Database**: Supabase Postgres
- **ORM**: Prisma (connected to Supabase's Postgres)

---

## Phase 1: Supabase + Prisma setup

### 1.1 Create Supabase project (manual)
- Go to https://supabase.com/dashboard → New project
- Copy the **database connection string** (Settings → Database → Connection string → URI)
- Copy `DIRECT_URL` (for migrations) and `DATABASE_URL` (pooled, for runtime)

### 1.2 Install dependencies
```
pnpm add prisma @prisma/client -D prisma
```

### 1.3 Initialize Prisma
- `npx prisma init` → creates `prisma/schema.prisma` + `.env`
- Configure the schema with the Supabase connection strings

### 1.4 Define database schema (`prisma/schema.prisma`)
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // pooled (Supavisor)
  directUrl = env("DIRECT_URL")         // direct (for migrations)
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String     @id @default(cuid())
  name          String?
  email         String     @unique
  emailVerified DateTime?
  image         String?
  username      String?    @unique
  accounts      Account[]
  sessions      Session[]
  favorites     Favorite[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Account {
  // Auth.js required fields for OAuth
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Game {
  id          String     @id @default(cuid())
  title       String
  playerCount String
  playtime    String
  image       String?
  favorites   Favorite[]
  createdAt   DateTime   @default(now())
}

model Favorite {
  id     String @id @default(cuid())
  userId String
  gameId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  game   Game   @relation(fields: [gameId], references: [id], onDelete: Cascade)
  @@unique([userId, gameId])
}
```

### 1.5 Run migration
```
npx prisma migrate dev --name init
```

### 1.6 Create Prisma client singleton
- `src/lib/prisma.ts` — single PrismaClient instance for dev/prod

### 1.7 Seed script (optional)
- `prisma/seed.ts` — insert the 12 mock games into the DB

---

## Phase 2: Auth.js (NextAuth v5) setup

### 2.1 Install dependencies
```
pnpm add next-auth@beta @auth/prisma-adapter
```

### 2.2 Create auth config
- `src/lib/auth.ts` — Auth.js config with:
  - PrismaAdapter
  - Google provider
  - Session strategy: "database" (default with adapter)
  - Callbacks to expose `user.id` and `user.username` in the session

### 2.3 Create API route
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js catch-all handler

### 2.4 Create middleware
- `src/middleware.ts` — protect routes that need auth (for now, minimal — just ensure session is refreshed)

### 2.5 Environment variables needed (`.env`)
```
DATABASE_URL="postgresql://...@...supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@...supabase.co:5432/postgres"
AUTH_SECRET="<generated>"
AUTH_GOOGLE_ID="<from Google Cloud Console>"
AUTH_GOOGLE_SECRET="<from Google Cloud Console>"
```

---

## Phase 3: Wire auth into the UI

### 3.1 Session provider
- Wrap `layout.tsx` children with `<SessionProvider>`

### 3.2 Update Navbar
- Show "Sign in" → calls `signIn("google")`
- When authenticated: show user avatar + dropdown (Sign out, My profile)

### 3.3 Update Landing page
- "Sign in with Google" button → calls `signIn("google")`

### 3.4 Update Profile page (`/u/[username]`)
- Fetch user from DB by username (Prisma query)
- Compare session user vs. profile user → `isOwner = true/false`
- Fetch favorite games from DB instead of mock data

### 3.5 Update Games page
- Fetch games from DB instead of mock data
- "Add to favorites" button → server action that creates a Favorite record (only if authenticated)

---

## Files to create/modify

### New files
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Seed games into DB |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/auth.ts` | Auth.js configuration |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth API route |
| `src/middleware.ts` | Auth middleware |
| `.env` | Environment variables (not committed) |

### Modified files
| File | Changes |
|------|---------|
| `package.json` | New dependencies + prisma seed script |
| `src/app/layout.tsx` | Add SessionProvider wrapper |
| `src/components/layout/navbar.tsx` | Auth-aware sign in/avatar |
| `src/app/page.tsx` | Wire "Sign in with Google" button |
| `src/app/games/page.tsx` | Fetch games from DB, auth-aware favorites |
| `src/app/u/[username]/page.tsx` | Fetch from DB, real isOwner logic |
| `src/lib/mock-data.ts` | Can be removed once DB is seeded |

---

## Order of execution
1. User creates Supabase project + Google OAuth credentials
2. Install deps (prisma, next-auth, @auth/prisma-adapter)
3. Set up Prisma schema + migrate + seed
4. Set up Auth.js config + API route
5. Wire auth into UI (navbar, landing, profile, games)
6. Test full flow: sign in → browse → favorite → profile
7. Lint + build + commit + push
