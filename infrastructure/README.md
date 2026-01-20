# Infrastructure Layer

Infrastructure configuration for ONFIS platform deployment.

## Components

### Nginx Reverse Proxy

Routes traffic to appropriate services:
- `/` → Landing Page (port 3001)
- `/app` → Main Webapp (port 3000)
- `/api` → API Gateway (port 8080)
- `/ws` → WebSocket support

**Configuration**: `nginx/nginx.conf`

### Docker Compose

Orchestrates all services:
- PostgreSQL database
- 6 Backend microservices
- API Gateway
- Nginx reverse proxy

## Quick Start

### Start All Services
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f [service-name]
```

### Stop All Services
```bash
docker-compose down
```

### Rebuild Services
```bash
docker-compose up -d --build
```

## Service URLs (via Nginx)

- Landing Page: http://localhost/
- Main App: http://localhost/app
- API: http://localhost/api
- Health Checks: http://localhost/api/users/health

## Direct Service Access

All services are also accessible directly:
- PostgreSQL: localhost:5432
- API Gateway: localhost:8080
- User Service: localhost:8081
- Project Service: localhost:8082
- Position Service: localhost:8083
- Admin Service: localhost:8084
- Chat Service: localhost:8085
- Announcement Service: localhost:8086

## Database

**Image**: `supabase/postgres:15.1.0.117`  
**Database**: `onfis_db`  
**User**: `postgres`  
**Password**: `postgres123` (change in production)

## Notes

- Frontend apps should be running on host machine (not containerized in this setup)
- Nginx uses `host.docker.internal` to access host services
- All services share the same `onfis-network` Docker network
