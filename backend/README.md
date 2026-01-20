# Backend Layer

Spring Boot microservices architecture for ONFIS platform.

## Architecture

```
API Gateway (8080) → Microservices (8081-8086) → PostgreSQL (5432)
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| **api-gateway** | 8080 | Spring Cloud Gateway for routing |
| **user-service** | 8081 | User management & authentication |
| **project-service** | 8082 | Project CRUD operations |
| **position-service** | 8083 | Position/job management |
| **admin-service** | 8084 | Administrative operations |
| **chat-service** | 8085 | Real-time messaging |
| **announcement-service** | 8086 | Announcement management |

## Shared Library

Common components used across all services:
- **DTOs**: `BaseEntity`, `AuditEntity` with multi-tenancy support
- **Security**: `JwtUtil`, `TenantContext`
- **Exceptions**: `ErrorResponse`

## Quick Start

### Build All Services
```bash
cd backend
mvn clean install
```

### Run Individual Service
```bash
cd services/user-service
mvn spring-boot:run
```

### Run All Services
Use Docker Compose from the root directory.

## Multi-Tenancy

All services support header-based multi-tenancy via `X-Company-ID` header:
```bash
curl -H "X-Company-ID: company-123" http://localhost:8080/api/users/health
```

## Database

Shared PostgreSQL instance with schema-based isolation planned for future implementation.

## Health Checks

Each service exposes a health endpoint:
- `/users/health` (8081)
- `/projects/health` (8082)
- `/positions/health` (8083)
- `/admin/health` (8084)
- `/chat/health` (8085)
- `/announcements/health` (8086)

## Development Tips

1. **IDE Setup**: Import as Maven project
2. **Hot Reload**: Use Spring Boot DevTools
3. **Database**: Ensure PostgreSQL is running
4. **Ports**: Make sure ports 8080-8086 are available
