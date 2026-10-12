# Tagline 

Scan, share, and connect instantly. ConnectQR is an Expo (React Native) mobile app with a NestJS backend that turns your business card into a QR code — WhatsApp, public profile, or fully offline peer-to-peer payloads.

## Stack

- **App** — Expo SDK 57, React Native 0.86, expo-router, Zustand, React Query, zod
- **API** — NestJS 11, TypeORM, PostgreSQL, JWT auth, Swagger docs at `/docs`

## How it works

**Accounts & email verification** — Registering creates an unverified account. A confirmation link is emailed that is valid for 24 hours and single-use; opening it (`GET /api/auth/verify-email`) marks the address verified and the app lands on the "email verified" screen. The link is consumed server-side, so it cannot be reused or replayed. Before SMTP is configured the backend falls back to a console mail log and returns dev tokens/codes in API responses so every flow is testable locally.

**Sign-in & sessions** — Sign in with password, a magic link, or a 6-digit code. Every successful sign-in issues a JWT whose `jti` claim is the id of a session row (device label, agent, IP, created/last-used/expiry). Guards reject revoked or expired sessions immediately, so signing out or tapping "revoke" on the Security screen kills a token before its 7-day expiry. The screen also offers "sign out other devices", and a nightly cron purges expired/revoked session rows.

**Passwordless sign-in** — "Email me a sign-in link" sends a single-use link plus a 6-digit fallback code, both valid for 10 minutes and stored as a single challenge: whichever you use first succeeds and invalidates the other half (no replay). The endpoint returns an identical response for known and unknown addresses, so it cannot be used to discover registered emails.

**QR codes & analytics** — `POST /api/qr/parse` (JWT-guarded) understands WhatsApp `wa.me` links, vCard/profile payloads, `connectqr://` profile links, and offline P2P codes (signed v2, legacy v1), each with a trust rating. Parsing also counts the scan against the *scanner* account (`scansPerformed`, for every format), while a profile's `scanCount` reflects "people scanned your card". The Activity screen shows four numbers: codes you scanned, people who scanned your card, connections saved, and the last scan of your card.

**Connections & tags** — Saved contacts can be tagged. Tags are trimmed, deduped case-insensitively, and capped at 12 server-side no matter what the client sends; the tag summary endpoint drives the filter row.

## Project layout

```
app/            Expo Router screens (tabs, auth, onboarding, settings)
components/     Reusable UI components
features/       Camera, QR, contacts, WhatsApp, calls
services/       API client layer
store/          Zustand stores (auth, profile, theme, scan history…)
utils/          Pure helpers (format, validation, phone, offline payload codec)
backend/        NestJS API (auth, profile, QR, connections, offline)
```

## Requirements

- Node.js 20+
- PostgreSQL 16 (or Docker)
- Expo Go or an Android/iOS emulator for the mobile app

## Quick start (docker-compose)

Starts Postgres + API + Expo web in one go:

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- App (web): http://localhost:8081

Move the Expo app to a device for QR camera features:

```bash
docker compose up -d db backend
npm install
npm start
```

## Run locally (without Docker)

```bash
# 1. Database
docker run -d --name connectqr-db -e POSTGRES_PASSWORD=connectqr -e POSTGRES_USER=connectqr -e POSTGRES_DB=connectqr -p 5432:5432 postgres:16-alpine

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run start:dev

# 3. App
npm install
npm start
```

## Backend API

Authenticated endpoints expect `Authorization: Bearer <token>`.

| Method | Path                  | Description                      |
| ------ | --------------------- | -------------------------------- |
| POST   | `/api/auth/register`  | Create an account (unverified)   |
| POST   | `/api/auth/login`     | Sign in with password, returns a JWT |
| POST   | `/api/auth/verify-email` | Confirm an address with a verification token |
| GET    | `/api/auth/verify-email` | Email-link entry point, redirects into the app |
| POST   | `/api/auth/resend-verification` | Resend the confirmation email |
| POST   | `/api/auth/forgot-password` | Request a password reset |
| GET/POST | `/api/auth/reset-password` | Reset entry point + set a new password |
| POST   | `/api/auth/magic-link` | Email a single-use sign-in link + 6-digit code |
| GET    | `/api/auth/magic-link` | Email-link entry point, redirects into the app |
| POST   | `/api/auth/magic-link/verify` | Exchange a link token for a session |
| POST   | `/api/auth/code/verify` | Exchange the 6-digit code for a session |
| POST   | `/api/auth/refresh`   | Exchange a valid token for a fresh one |
| GET    | `/api/auth/sessions`  | List the signed-in devices |
| DELETE | `/api/auth/sessions/:id` | Revoke one device session |
| POST   | `/api/auth/sessions/revoke-others` | Sign out every device but this one |
| POST   | `/api/auth/logout`    | End the current session |
| GET    | `/api/auth/me`        | Current user profile             |
| GET    | `/api/profile`        | Get profile                      |
| PATCH  | `/api/profile`        | Update profile                   |
| GET    | `/api/profile/privacy` | Get privacy settings            |
| PATCH  | `/api/profile/privacy` | Update privacy settings         |
| POST   | `/api/qr/generate`    | Generate a QR payload            |
| POST   | `/api/qr/parse`       | Parse a scanned QR payload (records analytics) |
| GET    | `/api/connections`    | List saved connections           |
| POST   | `/api/connections`    | Save a scanned contact           |
| DELETE | `/api/connections/:id` | Delete a connection             |
| PATCH  | `/api/connections/:id/tags` | Replace a connection's tags |
| GET    | `/api/connections/tags` | List tags in use, with counts  |
| POST   | `/api/offline/start`  | Start an offline sharing session |
| GET    | `/api/offline/session` | Get the active session          |
| DELETE | `/api/offline/stop`   | Stop the active session          |
| GET    | `/api/connections/activity` | Recent connections + account stats |

Interactive docs are served at `/docs`.

## Configuration

Backend env vars live in `backend/.env` (see `backend/.env.example`):

| Variable       | Default | Purpose                          |
| -------------- | ------- | -------------------------------- |
| `PORT`         | `3000`  | API port                         |
| `JWT_SECRET`   | dev     | Token signing secret — change it |
| `JWT_EXPIRES_IN` | `7d`  | Token lifetime                   |
| `DATABASE_URL` | —       | Postgres connection string       |
| `DB_SYNCHRONIZE` | `true` | Auto-create tables (dev only)   |
| `DB_RUN_MIGRATIONS` | `false` | Apply `backend/src/migrations` at boot |

The app reads its API base from `EXPO_PUBLIC_API_URL` (default `http://localhost:3000`). Copy `.env.example` to `.env` to override it. Logins are stored as JWTs in SecureStore, so the app boots straight into authenticated state when a valid token exists.

> **Security:** set `JWT_SECRET` to a strong random value. In production set `DB_SYNCHRONIZE=false` and `DB_RUN_MIGRATIONS=true` so schema changes are applied through reviewed migrations.

## Database migrations

Schema changes go through TypeORM migrations (see `backend/src/migrations`):

```bash
cd backend
npm run migration:generate -- src/migrations/InitialSchema   # create a migration from entity diff
npm run migration:run                                        # apply pending migrations
npm run migration:show                                       # list applied/pending
npm run migration:revert                                     # undo the last migration
```

Alternatively set `DB_RUN_MIGRATIONS=true` (with `DB_SYNCHRONIZE=false`) to apply migrations automatically when the API boots.

## Tests, lint, and formatting

```bash
# App (root)
npm test            # Jest (jest-expo) unit tests
npm run lint        # ESLint (eslint-config-expo + Prettier)
npm run format      # Prettier write (format:check to verify)
npm run typecheck

# Backend
cd backend
npm test            # Jest unit tests
npm run test:cov    # coverage
npm run lint
npm run typecheck
```

> Installs use `legacy-peer-deps` (see `.npmrc`) because Expo/RN peer ranges conflict under strict resolution.

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`: for both the backend and the app it runs typecheck, lint, and unit tests, and additionally builds the backend.

## Building for stores

```bash
npm run lint
npm test
npm run typecheck
npx eas build --profile production --platform android   # or ios
```
