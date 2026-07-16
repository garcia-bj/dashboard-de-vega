# Cookio

Generador de imagenes con IA y auto-publicacion en Meta (Facebook, Instagram, Stories).

## Stack

| Capa | Tecnologia |
|------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Python 3.12 + FastAPI |
| Orquestador | n8n (workflows) |
| DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Storage | RustFS (S3-compatible) |

## Arranque rapido

```bash
cp .env.example .env
# Edita .env con tus API keys y contraseñas

docker compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- n8n: http://localhost:5678

## Dev sin Docker

```bash
# Backend
cd backend && python -m venv .venv
.venv\Scripts\activate              # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && pnpm install && pnpm dev
```

Para desarrollo local sin Docker, configura `STORAGE_BACKEND=local` en `backend/.env`.

## Endpoints principales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login (JWT) |
| GET | `/api/auth/me` | Perfil del usuario autenticado |
| GET | `/api/publications/` | Listar publicaciones |
| POST | `/api/publications/` | Crear publicacion |
| PATCH | `/api/publications/{id}` | Actualizar publicacion |
| DELETE | `/api/publications/{id}` | Eliminar publicacion |
| POST | `/api/publications/generate` | Disparar generacion de imagen |
| GET | `/api/social/accounts` | Cuentas Meta vinculadas |
| POST | `/api/social/accounts` | Vincular cuenta Meta |
| GET | `/api/social/meta/callback` | OAuth callback Meta |

## Workflows n8n

1. **01_ai_image_generation** — Recibe webhook, llama a FastAPI para generar imagen con el modelo IA seleccionado
2. **02_auto_publish_meta** — Recibe webhook, publica en Facebook/Instagram/Stories via Meta Graph API
3. **03_daily_scheduler** — Cron cada 15 min: revisa publicaciones por vencer, genera imagen si falta, publica automaticamente

## Almacenamiento S3

```env
STORAGE_BACKEND=s3
STORAGE_S3_BUCKET=cookio-media
STORAGE_S3_ENDPOINT=https://s3.amazonaws.com
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ACCESS_KEY=TU_ACCESS_KEY
STORAGE_S3_SECRET_KEY=TU_SECRET_KEY
```

La capa de almacenamiento abstrae `LocalStorage` y `S3Storage` con la misma interfaz.
