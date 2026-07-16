# Deploy de Cookio

Cookio usa un solo **stack de Docker Compose** con todos los servicios en uno.

## Arquitectura de deploy

```
┌─────────────────────────────────────────────────────────┐
│                    Servidor (VPS)                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  cookio-postgres  ───── red cookio (bridge)       │   │
│  │  cookio-redis                                     │   │
│  │  cookio-rustfs    (S3 storage)                    │   │
│  │  cookio-backend   (FastAPI :8000)                 │   │
│  │  cookio-n8n       (n8n :5678)                     │   │
│  │  cookio-frontend  (Next.js :3000)                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Todo se comunica internamente por la red Docker cookio │
└─────────────────────────────────────────────────────────┘
```

## Paso 1: Preparar el servidor

```bash
# Docker + Docker Compose
# Minimun: 2 vCPU, 4 GB RAM, 30 GB disco

git clone https://github.com/TU_USUARIO/cookio.git
cd cookio
```

## Paso 2: Configurar el .env

```bash
cp .env.example .env
nano .env
```

Edita todas las variables necesarias: contraseñas de DB, API keys de IA, credenciales de Meta, URL publica del backend, etc.

## Paso 3: Configurar dominios (o puertos directos)

### Opcion A: Con dominio y HTTPS (recomendado)

Necesitas hasta 3 subdominios:

| Servicio | Subdominio | Puerto interno |
|----------|-----------|----------------|
| Frontend (Next.js) | `app.tudominio.com` | 3000 |
| Backend (FastAPI) | `api.tudominio.com` | 8000 |
| n8n | `n8n.tudominio.com` | 5678 |

Usa Nginx, Traefik o Dokploy como proxy inverso con TLS.

### Opcion B: Sin dominio (solo IP + puertos)

Abre los puertos en el firewall:

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 5678/tcp
```

## Paso 4: Deployar

```bash
docker compose up -d
```

Verifica que todo este corriendo:

```bash
docker compose ps
docker compose logs -f
```

Prueba los endpoints:

```bash
curl http://localhost:8000/health
curl http://localhost:3000
curl http://localhost:5678
```

## Paso 5: Configurar n8n

1. Abre `https://n8n.TUDOMINIO.com` (o `http://<IP>:5678`).
2. Crea tu cuenta la primera vez.
3. Importa los workflows desde `n8n/workflows/`.
4. Configura las credenciales de IA, Meta, etc.

## Paso 6: Configurar Meta OAuth Callback

1. Ve a [Meta for Developers](https://developers.facebook.com/) > tu App.
2. En **Products > Facebook Login > Settings** agrega la URI de redireccion:
   ```
   https://api.TUDOMINIO.com/api/social/meta/callback
   ```
3. Asegurate de que `META_REDIRECT_URI` en `.env` coincida exactamente.

## Comandos utiles

```bash
# Logs de todos los servicios
docker compose logs -f

# Logs de un servicio especifico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f n8n

# Reiniciar un servicio
docker compose restart backend

# Reiniciar todo
docker compose down && docker compose up -d

# Backup manual de la DB
docker exec cookio-postgres pg_dump -U cookio cookio > backup.sql

# Restaurar backup
docker exec -i cookio-postgres psql -U cookio cookio < backup.sql
```

## Persistencia de datos

Los volumenes con datos criticos:

- `pgdata` — base de datos PostgreSQL
- `redisdata` — cache Redis
- `rustfs_data` — archivos subidos (imagenes generadas)
- `n8n_data` — credenciales y config de n8n
- `uploads` — uploads del backend

## Seguridad

- Cambia `POSTGRES_PASSWORD` en `.env`.
- Usa HTTPS siempre en produccion.
- No expongas el puerto de Redis (6379) externamente.
- Usa un firewall restrictivo (solo 80/443 + los puertos que necesites).
