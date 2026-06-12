# Deploy de De Vega con Dokploy

De Vega se divide en **3 stacks de Docker Compose** independientes, cada uno con su propio `.env`.
Puedes deployar los 3 en un mismo servidor, o distribuirlos en servidores distintos.

## Arquitectura de deploy

### Todo en un servidor

```
┌─────────────────────────────────────────────────────────┐
│                    Servidor (VPS)                        │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │  Compose 1: INFRA   │  │ Compose 2: BACKEND   │       │
│  │                     │  │                     │       │
│  │  postgres:5432      │  │  backend:8000       │       │
│  │  redis:6379         │  │  n8n:5678           │       │
│  └─────────┬───────────┘  └─────────┬───────────┘       │
│            │                        │                    │
│            └──── red devega ────────┘                    │
│                        │                                 │
│  ┌─────────────────────┐                                 │
│  │ Compose 3: FRONTEND │                                 │
│  │                     │                                 │
│  │  frontend:3000      │                                 │
│  └─────────┬───────────┘                                 │
│            │                                             │
│            └──── red devega ──────────────────────────── │
└─────────────────────────────────────────────────────────┘
```

### Distribuido en 2 o 3 servidores

```
 Servidor A                    Servidor B                    Servidor C
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ Compose 1: INFRA│           │Compose 2: BACKEND│           │Compose 3: FRONTEND
│                 │           │                 │           │                 │
│ postgres:5432   │◄─────────│ backend:8000    │           │ frontend:3000   │
│ redis:6379      │  TCP/IP  │ n8n:5678        │◄─────────│                 │
│                 │           │                 │  HTTP    │                 │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

## Paso 1: Preparar el servidor (en cada VPS que uses)

```bash
# Docker + Dokploy (instalado via script de Dokploy)
# Minimum: 2 vCPU, 4 GB RAM, 30 GB disco

# Clona el repo en cada servidor donde vayas a deployar
git clone https://github.com/TU_USUARIO/de-vega.git
cd de-vega
```

---

## Paso 2: Configurar los .env por stack

Cada stack tiene su propio archivo de entorno. Edita según donde deployes cada uno:

### Stack 1 — Infraestructura (`.env.infra`)

```bash
cp .env.infra .env.infra    # no necesita copia, editalo directo
nano .env.infra
```

| Variable | Descripcion |
|----------|-------------|
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Contrasena segura para PostgreSQL |
| `POSTGRES_DB` | Nombre de la BD principal |
| `POSTGRES_N8N_DB` | Nombre de la BD para n8n |

### Stack 2 — Backend (`.env.backend`)

```bash
nano .env.backend
```

| Variable | Descripcion |
|----------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://USER:PASS@HOST:5432/de_vega`. Si el backend esta en otro servidor, cambia `postgres` por la IP del servidor de infra. |
| `POSTGRES_USER` | Mismo valor que en `.env.infra` |
| `POSTGRES_PASSWORD` | Mismo valor que en `.env.infra` |
| `POSTGRES_N8N_DB` | Mismo valor que en `.env.infra` |
| `REDIS_URL` | `redis://HOST:6379/0`. Cambia `redis` por la IP del servidor de infra si es remoto. |
| `SECRET_KEY` | Genera con `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Tu API key de Google Gemini |
| `OPENAI_API_KEY` | Tu API key de OpenAI (opcional) |
| `OPENROUTER_API_KEY` | Tu API key de OpenRouter (opcional) |
| `META_APP_ID` | App ID de Meta for Developers |
| `META_APP_SECRET` | App Secret de Meta |
| `META_REDIRECT_URI` | `https://api.TUDOMINIO.com/api/social/meta/callback` |
| `CORS_ORIGINS` | Origen(es) del frontend separados por coma |
| `N8N_EDITOR_BASE_URL` | URL publica de n8n (ej: `https://n8n.TUDOMINIO.com`) |
| `N8N_WEBHOOK_URL_PUBLIC` | Igual que arriba, la usa n8n para webhooks |

### Stack 3 — Frontend (`.env.frontend`)

```bash
nano .env.frontend
```

| Variable | Descripcion |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL publica del backend: `https://api.TUDOMINIO.com` o `http://IP:8000` |

---

## Paso 3: Configurar dominios (o puertos directos)

### Opcion A: Con dominio y HTTPS (recomendado)

Necesitas hasta 3 subdominios:

| Servicio | Subdominio | Puerto interno |
|----------|-----------|----------------|
| Frontend (Next.js) | `app.tudominio.com` | 3000 |
| Backend (FastAPI) | `api.tudominio.com` | 8000 |
| n8n | `n8n.tudominio.com` | 5678 |

En Dokploy, al crear cada aplicacion, activa la opcion de **Dominio** y configura el subdominio. Dokploy genera automaticamente TLS con Traefik + Let's Encrypt.

### Opcion B: Sin dominio (solo IP + puertos)

Los servicios quedan expuestos en:
- Frontend: `http://<IP_DEL_SERVIDOR>:3000`
- Backend API: `http://<IP_DEL_SERVIDOR>:8000`
- n8n: `http://<IP_DEL_SERVIDOR>:5678`

Abre esos puertos en el firewall:

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 5678/tcp
```

---

## Paso 4: Crear los stacks en Dokploy

### Si deployas todo en un mismo servidor

Crea un solo proyecto en Dokploy (`de-vega`) y dentro crea las 3 aplicaciones en este orden:

#### Stack 1 (deployar primero)

1. **Nueva aplicacion > Compose**
2. Nombre: `devega-infra`
3. Sube `docker-compose.infra.yml`
4. Adjunta el archivo `.env.infra`
5. Deploy.

Espera a que PostgreSQL y Redis esten **Healthy**.

#### Stack 2

1. **Nueva aplicacion > Compose**
2. Nombre: `devega-backend`
3. Sube `docker-compose.backend.yml`
4. Adjunta el archivo `.env.backend`
5. Deploy.

#### Stack 3

1. **Nueva aplicacion > Compose**
2. Nombre: `devega-frontend`
3. Sube `docker-compose.frontend.yml`
4. Adjunta el archivo `.env.frontend`
5. Deploy.

### Si deployas en servidores distintos

Repeti el paso correspondiente en cada VPS. Asegurate de:

- **Servidor A** (infra): solo el Stack 1. Abri el puerto 5432 para que el backend remoto se conecte.
- **Servidor B** (backend + n8n): solo el Stack 2. En `.env.backend`, `DATABASE_URL` y `REDIS_URL` deben apuntar a la IP del Servidor A.
- **Servidor C** (frontend): solo el Stack 3. En `.env.frontend`, `NEXT_PUBLIC_API_URL` apunta a la URL publica del Servidor B.

> Los stacks en servidores distintos no comparten la red Docker `devega`. La comunicacion es via TCP/IP directo.

---

## Paso 5: Verificar el deploy

```bash
# En cada servidor, verifica los contenedores
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Segun el servidor deberias ver:
# Servidor A: devega-postgres (healthy), devega-redis (healthy)
# Servidor B: devega-backend (healthy), devega-n8n
# Servidor C: devega-frontend
```

Prueba los endpoints:

```bash
# Health del backend
curl http://<IP_BACKEND>:8000/health

# n8n
curl http://<IP_BACKEND>:5678

# Frontend
curl http://<IP_FRONTEND>:3000
```

---

## Paso 6: Configurar n8n

1. Abre `https://n8n.TUDOMINIO.com` (o `http://<IP>:5678`).
2. Crea tu cuenta la primera vez.
3. Importa los workflows desde el volumen montado (`/home/node/workflows`):
   - Ve a **Settings > Import** y carga los archivos `.json` de `n8n/workflows/`.
4. Configura las credenciales que usen los workflows (API keys de IA, Meta tokens, etc.).

---

## Paso 7: Configurar Meta OAuth Callback

1. Ve a [Meta for Developers](https://developers.facebook.com/) > tu App.
2. En **Products > Facebook Login > Settings** agrega la URI de redireccion:
   ```
   https://api.TUDOMINIO.com/api/social/meta/callback
   ```
3. Asegurate de que `META_REDIRECT_URI` en `.env.backend` coincida exactamente.

---

## Notas importantes

### Red Docker compartida (solo mismo servidor)
Cuando los 3 stacks corren en el mismo servidor, comparten la red externa `devega`. Los servicios se comunican por hostname de contenedor (`postgres`, `redis`, `backend`, `n8n`). No uses `localhost`.

### Comunicacion entre servidores
Si separas los stacks en distintos VPS, edita los `.env` para que apunten a las IPs reales:
- `.env.backend`: `DATABASE_URL` y `REDIS_URL` con la IP del servidor de infra
- `.env.frontend`: `NEXT_PUBLIC_API_URL` con la URL publica del servidor del backend

Abre solo los puertos necesarios en cada firewall.

### Persistencia de datos
Los volumenes con datos criticos:
- `pgdata` — base de datos PostgreSQL
- `redisdata` — cache Redis
- `uploads` — imagenes generadas
- `n8n_data` — credenciales y config de n8n

Dokploy los gestiona automaticamente. Para backups, usa la integracion de backups de Dokploy.

### Escalado
Si necesitas escalar el backend horizontalmente, usa un proxy inverso con sticky sessions. No escales n8n ni PostgreSQL sin configuracion adicional.

### Actualizacion del frontend
Cada vez que quieras actualizar el frontend, **debes redeployar** porque `NEXT_PUBLIC_API_URL` se hornea en el build de Next.js. Si cambias el dominio del backend, rebuild obligatorio.

### Seguridad
- Cambia `POSTGRES_PASSWORD` en los `.env.infra` y `.env.backend`.
- Usa HTTPS siempre (Dokploy + Traefik lo maneja automaticamente con los dominios).
- No expongas el puerto de Redis (6379) externamente si no usas firewall.

---

## Comandos utiles

```bash
# Logs de un servicio
docker logs -f devega-backend
docker logs -f devega-frontend
docker logs -f devega-n8n

# Reiniciar un stack desde Dokploy: Application > Deploy

# Backup manual de la DB
docker exec devega-postgres pg_dump -U de_vega de_vega > backup.sql
```

---

## Resumen de archivos

| Archivo | Stack | Contenido |
|---------|-------|-----------|
| `.env.infra` | 1 | Credenciales PostgreSQL |
| `.env.backend` | 2 | API keys IA, Meta, CORS, conexion DB/Redis |
| `.env.frontend` | 3 | URL publica del backend |
| `docker-compose.infra.yml` | 1 | PostgreSQL 16 + Redis 7 |
| `docker-compose.backend.yml` | 2 | FastAPI + n8n |
| `docker-compose.frontend.yml` | 3 | Next.js |
| `docker-compose.yml` | — | Stack unificado (desarrollo local) |
