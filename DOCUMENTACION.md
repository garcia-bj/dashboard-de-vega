# Cookio — Documentación Completa

## ¿Qué es Cookio?

Cookio es una plataforma de **generación de imágenes con inteligencia artificial y auto-publicación** para redes sociales de Meta (Facebook, Instagram, Stories). Los usuarios crean publicaciones con prompts de texto, la app genera imágenes mediante modelos de IA (Gemini, DALL·E 3, Flux) a través de workflows en n8n, y publica automáticamente el contenido en las redes sociales conectadas.

---

## Arquitectura General

```
┌───────────────────────────────────────────────────────────┐
│                     DOCKER COMPOSE                         │
│                                                           │
│  ┌───────────┐   ┌───────────┐   ┌──────────┐            │
│  │ Frontend  │──▶│  Backend  │──▶│   n8n    │            │
│  │ Next.js   │   │  FastAPI  │   │Workflows │            │
│  │ :3000     │   │  :8000    │   │ :5678    │            │
│  └───────────┘   └─────┬─────┘   └────┬─────┘            │
│                        │              │                   │
│       ┌────────────────┼──────────────┼───────────┐      │
│       ▼                ▼              ▼           ▼      │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐ ┌─────────┐  │
│  │Postgres │   │  RustFS  │   │ APIs IA  │ │Meta API │  │
│  │ :5432   │   │S3 :9000  │   │Gemini/   │ │Graph v19│  │
│  └─────────┘   └──────────┘   │OpenAI/   │ └─────────┘  │
│                               │OpenRouter│               │
│  ┌─────────┐                  └──────────┘               │
│  │ Redis   │                                             │
│  │ :6379   │                                             │
│  └─────────┘                                             │
└───────────────────────────────────────────────────────────┘
```

### Servicios Docker (6 contenedores)

| Servicio | Puerto | Propósito |
|----------|--------|-----------|
| **Frontend** (Next.js) | `3000` | Interfaz web de usuario |
| **Backend** (FastAPI) | `8000` | API REST + documentación Swagger en `/docs` |
| **n8n** | `5678` | Automatización de workflows (generación IA + cron) |
| **PostgreSQL 16** | `5432` | Base de datos principal |
| **Redis 7** | `6379` | Caché / message broker |
| **RustFS** | `9000` (S3), `9001` (consola) | Almacenamiento de objetos compatible con S3 |

---

## Flujo de Trabajo Principal

1. **Creación**: El usuario crea una publicación con título, prompt y fecha programada
2. **Generación**: La app envía el prompt al webhook de n8n, que llama a la API de IA (Gemini / DALL·E 3 / Flux)
3. **Almacenamiento**: La imagen generada se guarda en almacenamiento local o S3 (RustFS)
4. **Publicación**: El backend publica la imagen en Facebook Feed, Instagram Feed o Instagram Stories usando la Graph API de Meta

---

## Ciclo de Vida de una Publicación

Los estados por los que pasa una publicación:

```
DRAFT → PENDING → GENERATING → GENERATED → SCHEDULED → PUBLISHING → PUBLISHED
  │        │          │            │            │            │           │
  └────────┴──────────┴────────────┴────────────┴────────────┴──► FAILED
```

| Estado | Significado |
|--------|-------------|
| `DRAFT` | Publicación creada, aún no se ha enviado a generar |
| `PENDING` | En cola para generación de imagen |
| `GENERATING` | n8n está procesando la generación de la imagen |
| `GENERATED` | Imagen generada y almacenada, lista para programar |
| `SCHEDULED` | Programada para publicación futura |
| `PUBLISHING` | Publicando en redes sociales en este momento |
| `PUBLISHED` | Publicada exitosamente en al menos una red social |
| `FAILED` | Error durante la generación o publicación |

---

## Modelos de Datos

### Tablas principales

**`users`** — Usuarios del sistema
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | Clave primaria |
| `email` | String | Único, indexado |
| `hashed_password` | String | Hash bcrypt |
| `full_name` | String | Opcional |
| `role` | Enum | `ADMIN` o `USER` |
| `is_active` | Boolean | Por defecto `true` |
| `meta_data` | JSONB | Configuración: logo (base64), API keys de IA, imagen de referencia |

**`social_accounts`** — Cuentas de redes sociales conectadas
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | Clave primaria |
| `user_id` | UUID | FK a `users` |
| `provider` | Enum | `FACEBOOK` o `INSTAGRAM` |
| `page_id` | String | ID de la página de Facebook |
| `page_name` | String | Nombre de la página |
| `access_token` | Text | Token de acceso de Meta |
| `instagram_business_id` | String | ID de cuenta de negocio de Instagram (opcional) |
| `is_active` | Boolean | Soft-delete para desconexión |

**`publications`** — Publicaciones de contenido
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | Clave primaria |
| `user_id` | UUID | FK a `users` |
| `title` | String | Título de la publicación |
| `prompt` | Text | Prompt para la IA |
| `caption` | Text | Texto opcional para redes sociales |
| `ai_model` | Enum | `GEMINI`, `OPENAI_DALLE`, `OPENROUTER_FLUX`, `OPENROUTER_SD` |
| `image_url` | Text | URL de la imagen generada |
| `status` | Enum | Estado del ciclo de vida |
| `targets` | JSONB | Array de destinos: `["FACEBOOK_FEED", "INSTAGRAM_FEED", "INSTAGRAM_STORY"]` |
| `scheduled_at` | DateTime | Fecha programada de publicación |

**`generation_logs`** — Registro de generaciones de imagen
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | Clave primaria |
| `publication_id` | UUID | FK a `publications` |
| `ai_model` | Enum | Modelo usado |
| `prompt` | Text | Prompt enviado |
| `image_url` | Text | URL resultante |
| `duration_ms` | Integer | Duración de la generación |
| `cost_usd` | Float | Costo estimado en USD |
| `error_message` | Text | Mensaje de error si falló |

**`publish_logs`** — Registro de publicaciones en redes
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | Clave primaria |
| `publication_id` | UUID | FK a `publications` |
| `social_account_id` | UUID | FK a `social_accounts` |
| `target` | Enum | Destino: `FACEBOOK_FEED`, `INSTAGRAM_FEED`, `INSTAGRAM_STORY` |
| `success` | Boolean | Si se publicó exitosamente |
| `meta_post_id` | String | ID del post en Meta |
| `meta_permalink` | Text | Enlace permanente al post |
| `error_message` | Text | Mensaje de error si falló |

---

## API Backend — Todas las Rutas

> **Nota**: Rutas que requieren autenticación JWT están marcadas con :lock:. El token se envía como header `Authorization: Bearer <token>`.

### Autenticación (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | No | Iniciar sesión con email/contraseña. Retorna `{ access_token, user }` |
| `GET` | `/api/auth/me` | :lock: | Obtener datos del usuario autenticado |

**Ejemplo login:**
```json
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded
Body: username=admin@email.com&password=secret

Response:
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin@email.com",
    "full_name": "Admin",
    "role": "ADMIN",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00"
  }
}
```

---

### Publicaciones (`/api/publications`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/publications/` | :lock: | Listar publicaciones del usuario. Filtro opcional: `?status=GENERATED` |
| `POST` | `/api/publications/` | :lock: | Crear nueva publicación (estado inicial: `DRAFT`) |
| `GET` | `/api/publications/{id}` | :lock: | Obtener publicación con logs de generación y publicación |
| `PATCH` | `/api/publications/{id}` | :lock: | Actualizar campos de una publicación (parcial) |
| `DELETE` | `/api/publications/{id}` | :lock: | Eliminar publicación |
| `POST` | `/api/publications/{id}/image-ready` | No | **Callback de n8n**: actualiza la URL de la imagen y el estado |
| `POST` | `/api/publications/generate` | :lock: | Dispara generación de imagen vía n8n (retorna `202 Accepted`) |

**Ejemplo crear publicación:**
```json
POST /api/publications/
{
  "title": "Promo Verano 2025",
  "prompt": "Beach sunset with a cocktail, professional photography, vibrant colors",
  "caption": "¡Disfruta el verano con nosotros! #Verano2025",
  "ai_model": "GEMINI",
  "targets": ["FACEBOOK_FEED", "INSTAGRAM_FEED"],
  "scheduled_at": "2025-06-20T10:00:00"
}
```

---

### Redes Sociales (`/api/social`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/social/accounts` | :lock: | Listar cuentas sociales conectadas del usuario |
| `POST` | `/api/social/accounts` | :lock: | Conectar una cuenta de Facebook/Instagram |
| `DELETE` | `/api/social/accounts/{id}` | :lock: | Desconectar cuenta (soft-delete: `is_active=false`) |
| `GET` | `/api/social/meta/callback` | No | Callback OAuth de Meta — intercambia código por token |
| `GET` | `/api/social/meta/pages` | :lock: | Obtener páginas del usuario con cuentas de Instagram vinculadas |

---

### Publicación en Redes (`/api/publish`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/publish/generate` | :lock: | **Proxy directo a n8n**: envía prompt + modelo + logo + referencia al webhook de n8n |
| `POST` | `/api/publish/publication/{id}` | :lock: | **Publicar en redes**: lee los `targets` de la publicación, empareja con `SocialAccount` activas y publica vía Graph API de Meta |

---

### Configuración (`/api/settings`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/settings/` | :lock: | Obtener configuración del usuario (perfil, logo, API keys) |
| `PUT` | `/api/settings/` | :lock: | Actualizar configuración (nombre, logo base64, imagen referencia, API keys) |
| `POST` | `/api/settings/upload-logo` | :lock: | Subir logo (máx 5MB). Convierte a base64 y guarda en `meta_data.logo` |
| `POST` | `/api/settings/upload-reference` | :lock: | Subir imagen de referencia (máx 5MB). Guarda en `meta_data.reference_image` |

---

### Archivos Media (`/media`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/media/{file_path}` | No | Servir archivos media. Con S3 hace redirect 302 a la URL pública; con almacenamiento local sirve el archivo directamente |

---

### Health Check

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check: `{"status":"ok", "app":"Cookio"}` |

---

## Rutas del Frontend (Next.js App Router)

> :lock: = Requiere autenticación (redirige a `/login` si no hay token)

| Ruta | Página | Auth | Descripción |
|------|--------|------|-------------|
| `/` | `src/app/page.tsx` | No | Redirige a `/login` |
| `/login` | `src/app/login/page.tsx` | No | Página de inicio de sesión con formulario email/contraseña |
| `/dashboard` | `src/app/(app)/dashboard/` | :lock: | Panel principal: tarjetas de métricas, próximas publicaciones, cuentas conectadas |
| `/generate` | `src/app/(app)/generate/` | :lock: | Generación de imágenes IA: selector de modelo, prompt, tamaño, estilos, preview |
| `/schedule` | `src/app/(app)/schedule/` | :lock: | Programación de contenido: galería, planificador semanal, historial |
| `/media` | `src/app/(app)/media/` | :lock: | Galería de imágenes: vista lista/cuadrícula, filtros, paginación, eliminación |
| `/settings` | `src/app/(app)/settings/` | :lock: | Configuración: perfil, logo, imagen referencia, API keys IA, cuentas sociales |

---

## Layouts de la Aplicación

### Root Layout (`src/app/layout.tsx`)
- Shell HTML base, metadatos SEO, favicon
- Aplica tema CSS global
- Renderiza los hijos de cualquier ruta

### App Layout (`src/app/(app)/layout.tsx`) — Autenticado
Componentes del shell cuando el usuario está autenticado:

- **Sidebar escritorio** (256px, colapsable a 64px con `Ctrl+B` o botón)
  - Logo de la app
  - Navegación: Dashboard, Generar, Programar, Galería, Configuración
  - Menú de usuario: Perfil, Soporte, Cerrar sesión
- **Sidebar móvil** (drawer tipo Sheet)
- **Topbar**: título de la página actual, búsqueda (placeholder), campana de notificaciones
- **Área de contenido principal**
- **Toast notifications** (Sonner)

---

## Servicios del Backend

### `ai_services.py` — Generación de Imágenes IA

Servicios que llaman directamente a las APIs de los modelos de IA (usados por los workflows de n8n):

| Servicio | API | Modelo |
|----------|-----|--------|
| `GeminiService` | Google Generative Language API | Imagen 3.0 |
| `OpenAIService` | OpenAI Images API | DALL·E 3 |
| `OpenRouterService` | OpenRouter API | Flux 1.1 Pro / Stable Diffusion XL |

Cada servicio recibe un prompt, llama a la API de IA, descarga los bytes de la imagen, la sube al almacenamiento configurado y retorna `{ image_url, duration_ms, cost_usd }`.

### `meta_service.py` — Integración con Meta Graph API v19.0

Métodos para interactuar con Facebook e Instagram:

| Método | Propósito |
|--------|-----------|
| `exchange_token()` | Intercambia token de corta duración por token de larga duración |
| `get_pages()` | Lista las páginas de Facebook del usuario |
| `get_instagram_accounts()` | Obtiene la cuenta de Instagram Business vinculada a una página |
| `publish_to_feed()` | Publica una imagen en el feed de Facebook (`POST /{page_id}/photos`) |
| `publish_to_instagram()` | Publica en Instagram Feed (2 pasos: crear contenedor → publicar) |
| `publish_to_story()` | Publica en Instagram Stories (2 pasos: crear contenedor STORIES → publicar) |

### `n8n_service.py` — Webhooks a n8n

| Función | Webhook | Propósito |
|---------|---------|-----------|
| `trigger_image_generation_workflow()` | `/webhook/image-generation` | Dispara el workflow de generación de imagen en n8n |
| `trigger_auto_publish_workflow()` | `/webhook/auto-publish` | Dispara el workflow de auto-publicación en n8n |

### `storage.py` — Almacenamiento de Archivos

Abstracción de almacenamiento con dos backends:

| Backend | Configuración | Comportamiento |
|---------|--------------|----------------|
| `LocalStorage` | `STORAGE_BACKEND=local` | Guarda archivos en `./uploads/`. Sirve vía `/media/{path}` |
| `S3Storage` | `STORAGE_BACKEND=s3` | Guarda en S3-compatible (RustFS/AWS). `/media/{path}` hace redirect 302 a la URL pública |

---

## Workflows de n8n

Tres workflows en `n8n/workflows/`:

| Workflow | Tipo | Propósito |
|----------|------|-----------|
| `01_ai_image_generation.json` | Webhook | Recibe prompt/modelo → llama a API de IA → guarda imagen → callback a `/api/publications/{id}/image-ready` |
| `02_auto_publish_meta.json` | Webhook | Recibe `publication_id` → publica en plataformas Meta configuradas |
| `03_daily_scheduler.json` | Cron (cada 15 min) | Busca publicaciones próximas → dispara generación → auto-publica |

---

## Flujo de Autenticación

```
1. POST /api/auth/login (email + password)
2. Backend valida credenciales con bcrypt
3. Genera JWT (HS256, 7 días de expiración)
4. Frontend guarda token en localStorage + Zustand store
5. Cada petición autenticada envía: Authorization: Bearer <token>
6. El middleware get_current_user decodifica el JWT y busca al usuario en BD
7. Al cerrar sesión: se borra token de localStorage y se redirige a /login
```

---

## Variables de Entorno Principales

### Backend (`.env`)

| Variable | Obligatorio | Descripción |
|----------|:-----------:|-------------|
| `SECRET_KEY` | Sí | Clave de firma JWT (generar 64 caracteres aleatorios) |
| `DATABASE_URL` | Sí | URL async de PostgreSQL: `postgresql+asyncpg://user:pass@host:5432/dbname` |
| `N8N_WEBHOOK_URL` | Sí | URL base de n8n |
| `GEMINI_API_KEY` | No | API key de Google Gemini |
| `OPENAI_API_KEY` | No | API key de OpenAI |
| `OPENROUTER_API_KEY` | No | API key de OpenRouter |
| `META_APP_ID` | No | ID de la app de Facebook |
| `META_APP_SECRET` | No | Secreto de la app de Facebook |
| `STORAGE_BACKEND` | No | `local` (defecto) o `s3` |
| `ADMIN_EMAIL` | No | Email del admin auto-creado al iniciar |
| `ADMIN_PASSWORD` | No | Contraseña del admin auto-creado al iniciar |

### Frontend (`.env.local`)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend (defecto: `http://localhost:8000`) |

---

## Comandos de Desarrollo

```bash
# Iniciar todos los servicios con Docker
docker compose up -d

# Solo backend (desarrollo local)
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Base de datos
alembic upgrade head             # aplicar migraciones
alembic revision --autogenerate -m "descripcion"
alembic downgrade -1             # deshacer última migración

# Solo frontend (desarrollo local)
cd frontend
pnpm install
pnpm dev                         # servidor en localhost:3000
pnpm build                       # build de producción
```

---

## URLs de Acceso en Desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:8000` |
| Swagger Docs | `http://localhost:8000/docs` |
| n8n | `http://localhost:5678` |
| RustFS Console | `http://localhost:9001` |
