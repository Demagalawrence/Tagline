# Tagline (ConnectQR)

Scan, share, and connect instantly. ConnectQR is an Expo (React Native) mobile app with a NestJS backend that turns your business card into a QR code — WhatsApp, public profile, or fully offline peer-to-peer payloads.

## Stack

- **App** — Expo SDK 57, React Native 0.86, expo-router, Zustand, React Query, zod
- **API** — NestJS 11, TypeORM, PostgreSQL, JWT auth, Swagger docs at `/docs`

## Project layout

```
app/            Expo Router screens (tabs, auth, onboarding, settings)
components/     Reusable UI components
features/       Camera, QR, contacts, WhatsApp, calls
services/       API client layer
store/          Zustand stores (auth, profile, theme, scan history…)
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
| POST   | `/api/auth/register`  | Create an account                |
| POST   | `/api/auth/login`     | Sign in, returns a JWT           |
| POST   | `/api/auth/forgot-password` | Request a password reset   |
| GET    | `/api/auth/me`        | Current user profile             |
| GET    | `/api/profile`        | Get profile                      |
| PATCH  | `/api/profile`        | Update profile                   |
| GET    | `/api/profile/privacy` | Get privacy settings            |
| PATCH  | `/api/profile/privacy` | Update privacy settings         |
| POST   | `/api/qr/generate`    | Generate a QR payload            |
| POST   | `/api/qr/parse`       | Parse a scanned QR payload       |
| GET    | `/api/connections`    | List saved connections           |
| POST   | `/api/connections`    | Save a scanned contact           |
| DELETE | `/api/connections/:id` | Delete a connection             |
| POST   | `/api/offline/start`  | Start an offline sharing session |
| GET    | `/api/offline/session` | Get the active session          |
| DELETE | `/api/offline/stop`   | Stop the active session          |

Interactive docs are served at `/docs`.

## Configuration

Backend env vars live in `backend/.env` (see `backend/.env.example`):

| Variable       | Default | Purpose                          |
| -------------- | ------- | -------------------------------- |
| `PORT`         | `3000`  | API port                         |
| `JWT_SECRET`   | dev     | Token signing secret — change it |
| `JWT_EXPIRES_IN` | `7d`  | Token lifetime                   |
| `DATABASE_URL` | —       | Postgres connection string       |
| `DB_SYNCHRONIZE` | `true` | Auto-create tables (dev only) |

> **Security:** set `JWT_SECRET` to a strong random value and `DB_SYNCHRONIZE=false` in production. Switch to explicit TypeORM migrations before shipping.

## Tests

```bash
cd backend
npm test            # unit tests
npm run test:cov    # coverage
npm run typecheck
```

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`: backend typecheck, build, and unit tests, plus an Expo typecheck.

## Building for stores

```bash
npm run typecheck
npx eas build --profile production --platform android   # or ios
```