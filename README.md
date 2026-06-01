# De Vega

Generador de imágenes con IA y auto-publicación en Meta (Facebook, Instagram, Stories).

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Python 3.12 + FastAPI |
| Orquestador | n8n (workflows) |
| DB | PostgreSQL 16 |
| Cache | Redis 7 |

## Modelos IA soportados

- **Gemini** (Imagen 3) — Google
- **OpenAI** (DALL·E 3)
- **OpenRouter** (Flux, Stable Diffusion)

## Redes soportadas

- Facebook Feed
- Instagram Feed
- Instagram Stories

## Arranque rápido

```bash
cp .env.example .env
# Edita .env con tus API keys

docker compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- n8n: http://localhost:5678

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login (JWT) |
| GET | `/api/auth/me` | Perfil del usuario autenticado |
| GET | `/api/publications/` | Listar publicaciones |
| POST | `/api/publications/` | Crear publicación |
| PATCH | `/api/publications/{id}` | Actualizar publicación |
| DELETE | `/api/publications/{id}` | Eliminar publicación |
| POST | `/api/publications/generate` | Disparar generación de imagen |
| GET | `/api/social/accounts` | Cuentas Meta vinculadas |
| POST | `/api/social/accounts` | Vincular cuenta Meta |
| GET | `/api/social/meta/callback` | OAuth callback Meta |

## Workflows n8n

1. **01_ai_image_generation** — Recibe webhook, llama a FastAPI para generar imagen con el modelo IA seleccionado
2. **02_auto_publish_meta** — Recibe webhook, publica en Facebook/Instagram/Stories vía Meta Graph API
3. **03_daily_scheduler** — Cron cada 15 min: revisa publicaciones por vencer, genera imagen si falta, publica automáticamente

## Cambiar a almacenamiento S3

```env
STORAGE_BACKEND=s3
STORAGE_S3_BUCKET=de-vega-media
STORAGE_S3_ENDPOINT=https://s3.amazonaws.com
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ACCESS_KEY=TU_ACCESS_KEY
STORAGE_S3_SECRET_KEY=TU_SECRET_KEY
```

La capa de almacenamiento abstrae `LocalStorage` y `S3Storage` con la misma interfaz, por lo que el cambio es solo configurar el `.env`.
