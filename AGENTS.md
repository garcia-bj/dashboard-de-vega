# AGENTS.md

## Quick start (Docker)

```bash
cp .env.example .env
# Edita .env con tus API keys y contraseñas
docker compose up -d
```

Frontend `localhost:3000`, backend `localhost:8000/docs`, n8n `localhost:5678`.

## Dev without Docker

```bash
# Backend
cd backend && python -m venv .venv
.venv\Scripts\activate              # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && pnpm install && pnpm dev
```

For local dev set `STORAGE_BACKEND=local` in `backend/.env`. Docker overrides this to `s3` via `docker-compose.yml`.

## Key commands

| Task | Command (run from backend/) |
|------|--------|
| Apply migrations | `alembic upgrade head` |
| New migration | `alembic revision --autogenerate -m "desc"` |
| Rollback | `alembic downgrade -1` |

| Task | Command (run from frontend/) |
|------|--------|
| Lint | `pnpm lint` (= `next lint`, no ESLint config file exists) |
| Build | `pnpm build` |

**There are no tests in this repo.** `pytest`, `npm test`, and similar won't work.

**There is no Python linting or formatting configured** — no flake8, ruff, black, or pyproject.toml. Dependencies are in `requirements.txt` only.

## Architecture notes

### Backend

- **All SQLAlchemy models + Python enums** live in a single file: `backend/app/models/user.py`. Pydantic schemas are in `backend/app/models/schemas.py`.
- **Database PKs are `uuid.UUID`** with PostgreSQL `UUID(as_uuid=True)` dialect.
- **Admin auto-seed**: On startup `_seed_admin()` in `main.py` creates/updates an admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars. If no users exist, one is created. If a user exists with a different email, it updates to match the env var.
- **Migration startup**: `start.sh` (Docker entrypoint) detects if DB tables exist without `alembic_version` (created by `create_all()`) and stamps revision `001`, then runs `alembic upgrade head`. If adding a new migration, just create the revision file — the Docker startup handles everything.
- **Webhook URL precedence**: `N8N_IMG_GENERATION_URL` takes priority. Fallback is `N8N_WEBHOOK_URL + N8N_IMAGE_GEN_WEBHOOK`. The `_n8n_img_url()` helper in `publish.py:52` handles this.
- **Storage dual URL for S3**: `STORAGE_S3_ENDPOINT` is the internal/Docker URL the backend writes to. `STORAGE_S3_PUBLIC_URL` is the browser-facing URL used for `/media/{path}` redirects and returned to clients. With `STORAGE_BACKEND=local`, images are served directly via FastAPI static files.
- **`APP_PUBLIC_URL`** is critical for Meta publishing — Meta's servers download images from this URL. If not set, `POST /api/publish/publication/{id}` returns HTTP 400 with a message telling you to configure it.

### Frontend

- **Package manager is pnpm** (enforced in `package.json` `packageManager` field). Do not use npm or yarn.
- **Auth**: Token lives in Zustand store + `localStorage`. `AuthGuard.tsx` checks `localStorage` directly on each route change. The `(app)/layout.tsx` also has its own `useEffect` auth check that redirects to `/login`.
- **API client**: `frontend/src/lib/api.ts` exports a single `api` object with namespaced methods (`api.auth.login(...)`, `api.publications.list(...)`, etc.). Bearer token from `useAuthStore` is passed explicitly as a parameter to every call.
- **Styling**: Tailwind CSS with shadcn/ui patterns. `cn()` from `lib/utils.ts` combines `clsx` + `tailwind-merge`. Dark mode via `class` strategy on `<html>`. CSS variables for sidebar theming. Framer Motion for animations. Sonner for toasts.

### n8n workflows

Three workflow JSON files in `n8n/workflows/`:
1. `01_ai_image_generation.json` — receives webhook, calls AI model, returns image
2. `02_auto_publish_meta.json` — receives webhook, publishes to Meta
3. `03_daily_scheduler.json` — cron every 15 min, triggers generation + publishing

These are imported manually into n8n at `localhost:5678`. They are **not** auto-loaded.

## Git

- `.env*` files are gitignored except `.env.example` variants, `.env.prod`.
- `opencode.json` is gitignored (it contains API keys).
- `docker-compose.override.yml` is gitignored.
