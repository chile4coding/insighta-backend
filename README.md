# Username Availability Check — Flow 1 Implementation

## Overview

This document describes the implementation of **Flow 1** from `DESIGN.txt`: the username availability check endpoint (`POST /username/check`). This flow allows unauthenticated users (RFC implementation) to reserve a username before completing a profile publish.

---

## Endpoint

**POST** `/username/check`

Accepts a JSON body with a `username` field and returns the availability status with a reservation token.

### Request

```json
{
  "username": "johndoe"
}
```

### Success Response (200)

```json
{
  "status": "success",
  "available": true,
  "expiresIn": 600,
  "reservationId": "res_1700000000000_abc123def"
}
```

### Error Responses

- **400 Bad Request** — validation failure
  ```json
  { "status": "error", "message": "Username must be between 3 and 30 characters" }
  ```
- **409 Conflict** — username taken/reserved
  ```json
  {
    "status": "error",
    "message": "Username is unavailable",
    "code": "USERNAME_TAKEN"
  }
  ```
  or
  ```json
  {
    "status": "error",
    "message": "Username was just reserved by another user",
    "code": "CONCURRENT_RESERVATION"
  }
  ```
- **500 Internal Server Error** — unexpected failure

---

## Flow Steps

### Step 1 — Validation (Synchronous)

Before any I/O, the request body is validated against business rules:

| Rule | Description |
|------|-------------|
| Length | 3 to 30 characters |
| Characters | Alphanumeric and hyphens (`a-z`, `-`) only |
| Hyphens | Cannot be leading or trailing |
| Reserved words | `api`, `admin`, `search`, `login`, `signup`, `help`, `about` (case-insensitive) |

**Failure:** `400 Bad Request`

### Step 2 — Redis Cache-First Lookup

```ts
GET username:reserve:{username}
```

- **Hit (key exists):** The name is reserved or already taken → return `409` immediately. No database call is made.
- **Miss (key not found):** Proceed to PostgreSQL.

Redis provides sub-millisecond access and acts as a fast guard against concurrent checks.

### Step 3 — PostgreSQL Lookup (Source of Truth)

```sql
SELECT id FROM users WHERE username = $1
```

- **Row found:** Username is permanently taken → return `409`.
- **No row:** Name is genuinely free → proceed to reserve.

### Step 4 — Atomic Redis Reservation

```ts
SET username:reserve:{username} {reservationId} EX 600 NX
```

- `EX 600` — 10-minute TTL; abandoned reservations self-expire.
- `NX` — only writes if the key does **not** already exist (first writer wins).
- `SET` returns `OK` (NX=1) → this request holds the reservation → return `200`.
- `SET` returns `nil` (NX=0) → a concurrent request won the race → return `409`.

The `NX` flag solves the race where two requests both miss Redis, both query PostgreSQL, and both see the name as free — all within milliseconds.

### Step 5 — Response

Returns `200 OK` with `available: true`, `expiresIn`, and the `reservationId` to be used later in Flow 2 (`POST /username/publish`).

---

## Data Model Changes

### Prisma Schema

The `User` model `username` field is marked `@unique` to enforce database-level uniqueness:

```prisma
model User {
  id       String @id @default(uuid(7))
  username String @unique @db.VarChar(255)
  email    String @db.VarChar(255)
  // ...
}
```

This is the final line of defence — even if Redis and application checks fail, the UNIQUE constraint prevents duplicates.

---

## Seeding — Username Generation per Profile

The seed script (`src/seed.ts`) has been updated to generate a unique username for **every** profile in `seed_profiles.json`, rather than assigning all profiles to the admin user.

### `generateUniqueUsername()` function

1. **Slugify** the profile name: lowercase, trim, replace non-alphanumeric characters with hyphens.
2. **Strip** leading/trailing hyphens.
3. **Pad** very short names (<3 chars) with a `user-` prefix.
4. **Truncate** to 25 characters (leaving 5 for potential numeric suffix).
5. **Ensure uniqueness** by checking against already-used usernames; append `-1`, `-2`, ... as needed.
6. **Enforce rules** (length, character set, hyphen placement) in the loop.

Example:

| Profile Name | Generated Username |
|--------------|-------------------|
| `Awino Hassan` | `awino-hassan` |
| `John Adams` | `john-adams` |
| `Nabil Saidi` (collision) → `nabil-saidi-1` |

### Email assignment

Each seeded user receives an email of the form: `{username}@example.com`.

### GitHub ID for seeds

Seeded users use a deterministic `githubId = "seed-{username}"` since `githubId` is required.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection string (e.g., `redis://localhost:6379`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: `4888`) |

---

## Dependencies

- `ioredis` — Redis client
- `@prisma/client` — PostgreSQL ORM
- `express` — HTTP server
- TypeScript

---

## Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create a `.env` file (see `.env.example`) with `REDIS_URL` and `DATABASE_URL`.

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Apply migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Run the seed:**
   ```bash
   npm run seed
   ```

6. **Start the server:**
   ```bash
   npm run dev
   ```

7. **Test Flow 1:**
   ```bash
   curl -X POST http://localhost:4888/username/check \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser"}'
   ```

---

## File Reference

| File | Purpose |
|------|---------|
| `src/routes/username.ts` | Flow 1 controller (`checkUsername`) |
| `src/app.ts` | Express app — mounts `POST /username/check` |
| `src/utils/cache.ts` | Redis client singleton |
| `src/seed.ts` | Updated to generate usernames for profiles |
| `src/seed_profiles.json` | Profile data (no usernames — derived) |
| `prisma/schema.prisma` | `User.username` marked `@unique` |
# profile
