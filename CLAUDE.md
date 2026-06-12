# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

De Vega is an AI image generation and auto-publishing platform for Meta (Facebook, Instagram, Stories). Users create publications with prompts, trigger AI image generation via n8n webhooks, and publish to Meta social networks.

## Development Commands

### Full stack (recommended)

```bash
# Copy and configure environment files first
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Start all services
docker compose up -d
```

Services: Frontend `localhost:3000`, Backend API `localhost:8000/docs`, n8n `localhost:5678`.

### Backend (FastAPI)

```bash
cd backend

# Create venv and install deps
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Run dev server
uvicorn app.main:app --reload --port 8000

# Database migrations (Alembic)
alembic upgrade head             # apply migrations
alembic revision --autogenerate -m "description"  # create new migration
alembic downgrade -1             # roll back one step
```

### Frontend (Next.js)

```bash
cd frontend

pnpm install
pnpm dev        # dev server on port 3000
pnpm build
pnpm lint
```

## Architecture

### Backend (`backend/app/`)

```
config.py          — Settings via pydantic-settings, reads from .env
dependencies.py    — JWT auth helpers, get_current_user FastAPI dependency
main.py            — FastAPI app, CORS, router registration, lifespan (init_db)
db/database.py     — Async SQLAlchemy engine, Base, get_db session dependency
models/user.py     — All SQLAlchemy ORM models + Python enums
models/schemas.py  — Pydantic request/response schemas
routers/           — auth, publications, social, media, settings, publish
services/
  ai_services.py   — GeminiService, OpenAIService, OpenRouterService (async httpx)
  meta_service.py  — Meta Graph API calls for Facebook/Instagram publishing
  n8n_service.py   — Webhook triggers to n8n workflows
utils/storage.py   — StorageBackend ABC, LocalStorage and S3Storage implementations
```

**Data models**: `User` → `Publication` (one-to-many). Each `Publication` has `GenerationLog[]` and `PublishLog[]`. `SocialAccount` links a user to a Facebook page or Instagram business account.

**Publication lifecycle**: `DRAFT` → `PENDING` → `GENERATING` → `GENERATED` → `SCHEDULED` → `PUBLISHING` → `PUBLISHED` (or `FAILED`).

**Image generation flow**: `/api/publish/generate` proxies to the n8n webhook at `https://asc-n8n.autosalescloser.com/webhook/img_asd`, which calls the AI service and returns `image_url`. The result is saved to `Publication.image_url`.

**Publishing flow**: `/api/publish/publication/{id}` reads the publication's `targets` (stored as JSON array of `PublishTarget` enum values), matches each to an active `SocialAccount`, and calls `MetaService` directly.

**Storage**: `get_storage()` returns `LocalStorage` (default, serves via `/media/`) or `S3Storage` (RustFS / AWS S3 / cualquier S3-compatible) basado en `STORAGE_BACKEND`. La clave es la separación entre `STORAGE_S3_ENDPOINT` (URL interna Docker, ej. `http://rustfs:9000`) y `STORAGE_S3_PUBLIC_URL` (URL que el browser usa para cargar imágenes directamente, ej. `http://localhost:9000`). Con S3, `/media/{path}` hace un 302 redirect a la URL pública del objeto.

**Auth**: JWT tokens (HS256), 7-day expiry, issued on login, validated via `get_current_user` dependency in every protected router. Passwords hashed with bcrypt.

### Frontend (`frontend/src/`)

```
app/layout.tsx          — Root layout with AuthGuard
app/(app)/layout.tsx    — App shell: collapsible sidebar (desktop) + Sheet drawer (mobile), topbar
app/(app)/generate/     — Image generation page (calls n8n webhook directly)
app/(app)/schedule/     — Publication scheduling
app/(app)/dashboard/    — Publications overview
app/(app)/media/        — Image gallery
app/(app)/settings/     — User settings (logo/reference image upload)
app/login/              — Auth page
components/AuthGuard.tsx — Redirects unauthenticated users to /login
components/ui/          — shadcn/ui components (Button, Input, Badge, Switch, Select, Sheet, etc.)
lib/api.ts              — All backend API calls (api.auth, api.publications, api.social, api.settings, api.publish)
store/auth.ts           — Zustand auth store (token persisted to localStorage)
store/settings.ts       — Zustand settings store (logo, reference image)
```

**Routing**: Next.js App Router. The `(app)` route group wraps all authenticated pages with the sidebar layout. Auth check happens in both `AuthGuard` (root layout) and the app layout's `useEffect`.

**API client**: `frontend/src/lib/api.ts` exports a single `api` object. All requests go to `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Bearer token from `useAuthStore` is passed explicitly to each call.

**Styling**: Tailwind CSS with custom CSS variables for sidebar theming. `cn()` utility from `lib/utils.ts` combines `clsx` + `tailwind-merge`. Framer Motion for sidebar animations. Sonner for toast notifications.

## Key Configuration

### Backend `.env` required fields

- `SECRET_KEY` — JWT signing key (generate a 64-char random string)
- `DATABASE_URL` — PostgreSQL async URL: `postgresql+asyncpg://user:pass@host:5432/dbname`
- `N8N_WEBHOOK_URL` — Base URL of the n8n instance
- AI keys: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`
- Meta: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`

### Frontend `.env.local`

- `NEXT_PUBLIC_API_URL` — Backend URL (e.g., `http://localhost:8000`)

## n8n Workflows

Three workflows in `n8n/workflows/`:
1. **01_ai_image_generation** — Webhook → FastAPI → AI model → stores image
2. **02_auto_publish_meta** — Webhook → publishes to Facebook/Instagram/Stories
3. **03_daily_scheduler** — Cron every 15 min → checks upcoming publications, generates images, auto-publishes

The generate page (`/generate`) calls the n8n webhook directly (hardcoded URL in `publish.py:18` and `generate/page.tsx:26`), bypassing the settings-based `N8N_WEBHOOK_URL` config. This is intentional for the production workflow.
