# ONFIS - SME SRP System

A Service-Based Architecture Monorepo for SME Service Request Platform with multi-tenancy support.

## Architecture Overview

This monorepo contains:
- **Frontend Layer**: Main web application + Public landing page
- **Backend Layer**: API Gateway + Microservices + Shared libraries
- **Infrastructure**: Nginx reverse proxy + Docker orchestration

```
onfis/
├── frontend/              # Frontend applications
│   ├── main-webapp/       # Main React app (Port 3000)
│   └── landing-page/      # Public landing page (Port 3001)
├── backend/               # Backend services
│   ├── api-gateway/       # Spring Cloud Gateway (Port 8080)
│   ├── shared-library/    # Common DTOs, Utils, Security
│   └── services/          # Microservices (Ports 8081-8086)
│       ├── user-service/
│       ├── project-service/
│       ├── position-service/
│       ├── admin-service/
│       ├── chat-service/
│       └── announcement-service/
├── infrastructure/        # Infrastructure configuration
│   └── nginx/            # Nginx reverse proxy
├── docker-compose.yml    # Service orchestration
└── README.md
```

---

## Frontend Folder Structure

### `frontend/main-webapp/` - Main Web Application (Port 3000)

The primary React application for authenticated users and internal operations.

#### Directory Structure:
```
main-webapp/
├── src/
│   ├── features/          # Feature-based modules
│   │   ├── admin/         # Admin dashboard and management
│   │   ├── announcements/ # Announcements display
│   │   ├── auth/          # Authentication (Login/Register)
│   │   ├── chat/          # Real-time chat functionality
│   │   ├── landing/       # Internal landing pages
│   │   ├── responsibilities/ # Responsibility management
│   │   └── tasks/         # Task management
│   ├── components/        # Reusable UI components
│   ├── layouts/           # Page layout templates
│   ├── routes/            # React Router configuration
│   ├── services/          # API client services
│   ├── store/             # State management
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── config/            # App configuration
│   ├── assets/            # Images, fonts, static files
│   ├── App.tsx            # Main App component
│   └── main.tsx           # Application entry point
├── public/                # Static public assets
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite bundler configuration
├── tailwind.config.js     # TailwindCSS configuration
└── tsconfig.json          # TypeScript configuration
```

#### Development:
```bash
cd frontend/main-webapp
npm install
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run lint     # Run ESLint
```

---

### `frontend/landing-page/` - Public Landing Page (Port 3001)

The public-facing marketing website for prospective users.

#### Directory Structure:
```
landing-page/
├── src/
│   ├── assets/           # Images, logos, static files
│   ├── App.tsx           # Main landing page component
│   ├── App.css           # Component styles
│   ├── index.css         # Global styles
│   └── main.tsx          # Application entry point
├── public/               # Static public assets
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

#### Development:
```bash
cd frontend/landing-page
npm install
npm run dev      # Start dev server on port 3001
npm run build    # Production build
```

---

## Backend Folder Structure

### `backend/` - Java Spring Boot Microservices

Multi-module Maven project containing all backend services.

#### Top-Level Structure:
```
backend/
├── pom.xml                # Parent POM (dependency management)
├── api-gateway/           # API Gateway service
├── shared-library/        # Shared code library
└── services/              # Microservices directory
    ├── user-service/
    ├── project-service/
    ├── position-service/
    ├── admin-service/
    ├── chat-service/
    └── announcement-service/
```

---

### `backend/shared-library/` - Shared Library Module

Common code shared across all microservices.

#### Structure:
```
shared-library/
└── src/main/java/com/onfis/shared/
    ├── dto/              # Data Transfer Objects
    │   └── ...           # Common request/response DTOs
    ├── security/         # Security utilities
    │   ├── JwtUtil.java  # JWT token handling
    │   └── ...           # Auth filters, configs
    └── exception/        # Custom exceptions
        └── ...           # Global exception handlers
```

#### Purpose:
- **DTOs**: Shared request/response models for inter-service communication
- **Security**: JWT authentication, token validation, security filters
- **Exception Handling**: Centralized error handling and custom exceptions
- **Utilities**: Common helper functions and constants

---

### `backend/api-gateway/` - API Gateway (Port 8080)

Spring Cloud Gateway for routing and load balancing.

#### Responsibilities:
- Route requests to appropriate microservices
- JWT authentication and authorization
- Request/response logging
- CORS configuration
- Multi-tenancy header extraction (`X-Company-ID`)

#### Routing:
```
/api/users/**         → User Service (8081)
/api/projects/**      → Project Service (8082)
/api/positions/**     → Position Service (8083)
/api/admin/**         → Admin Service (8084)
/api/chat/**          → Chat Service (8085)
/api/announcements/** → Announcement Service (8086)
```

---

### `backend/services/` - Microservices (Ports 8081-8086)

Domain-driven microservices following a consistent structure.

#### Standard Service Structure:
```
<service-name>/
├── src/
│   └── main/
│       ├── java/com/onfis/<service>/
│       │   ├── controller/     # REST API endpoints
│       │   ├── service/        # Business logic
│       │   ├── repository/     # Database access layer
│       │   ├── entity/         # JPA entities
│       │   ├── dto/            # Service-specific DTOs
│       │   ├── config/         # Service configurations
│       │   └── Application.java # Spring Boot entry point
│       └── resources/
│           ├── application.yml # Service configuration
│           └── application-*.yml # Environment-specific configs
├── pom.xml                     # Service dependencies
└── Dockerfile                  # Container configuration
```

#### Individual Microservices:

**1. User Service (Port 8081)**
- User registration and authentication
- Profile management
- Role and permission management
- Multi-tenant user isolation

**2. Project Service (Port 8082)**
- Project creation and management
- Project lifecycle tracking
- Project team assignments
- Project-specific workflows

**3. Position Service (Port 8083)**
- Position/role definitions
- Position assignments
- Skill requirements
- Position hierarchies

**4. Admin Service (Port 8084)**
- System administration
- Tenant management
- Configuration management
- System monitoring and reports

**5. Chat Service (Port 8085)**
- Real-time messaging
- Chat room management
- Message history
- WebSocket support

**6. Announcement Service (Port 8086)**
- System-wide announcements
- Notification delivery
- Announcement scheduling
- Read/unread tracking

---

### Backend Tech Stack:
- **Language**: Java 17
- **Framework**: Spring Boot 3.2.5
- **API Gateway**: Spring Cloud Gateway
- **Database**: PostgreSQL (Supabase)
- **ORM**: Spring Data JPA + Hibernate
- **Authentication**: JWT (io.jsonwebtoken 0.12.3)
- **Build Tool**: Maven 3.8+
- **Utilities**: Lombok (reduces boilerplate)

#### Shared Dependencies (Parent POM):
- Spring Boot Starter Web
- Spring Boot Starter Data JPA
- Spring Cloud Dependencies
- PostgreSQL Driver
- JWT Libraries
- Lombok

---

### Backend Development:

#### Build All Services:
```bash
cd backend
mvn clean install
```

#### Run Individual Service:
```bash
cd backend/services/user-service
mvn spring-boot:run
```

#### Run All Services (Docker):
```bash
docker-compose up -d
```

#### Database Configuration:
Each service connects to PostgreSQL using multi-tenant schema isolation configured in `application.yml`.

---

## Multi-Tenancy

All backend services support header-based multi-tenancy:
- **Header**: `X-Company-ID`
- **Purpose**: Isolate data by tenant/company
- **Implementation**: Shared library provides tenant context extraction

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Java 17+
- Maven 3.8+
- Docker & Docker Compose

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd onfis
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose** (Recommended)
   ```bash
   docker-compose up -d
   ```

4. **Or run services individually**:

   **Frontend - Main Webapp**
   ```bash
   cd frontend/main-webapp
   npm install
   npm run dev
   # Access at http://localhost:3000
   ```

   **Frontend - Landing Page**
   ```bash
   cd frontend/landing-page
   npm install
   npm run dev
   # Access at http://localhost:3001
   ```

   **Backend - All Services**
   ```bash
   cd backend
   mvn clean install
   # Run each service individually or via IDE
   ```

## 🌐 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 80 | Reverse proxy |
| Main Webapp | 3000 | React application |
| Landing Page | 3001 | Public website |
| API Gateway | 8080 | Spring Cloud Gateway |
| User Service | 8081 | User management |
| Project Service | 8082 | Project operations |
| Position Service | 8083 | Position management |
| Admin Service | 8084 | Admin operations |
| Chat Service | 8085 | Real-time chat |
| Announcement Service | 8086 | Announcements |
| PostgreSQL | 5432 | Database |

## Routing (via Nginx)

- `/` → Landing Page (3001)
- `/app` → Main Webapp (3000)
- `/api` → API Gateway (8080)

## Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [Infrastructure Documentation](./infrastructure/README.md)

## Tech Stack

**Frontend**:
- React 19 + TypeScript
- Vite
- TailwindCSS + Material-UI
- React Router
- Axios

**Backend**:
- Java 17
- Spring Boot 3.2.x
- Spring Cloud Gateway
- PostgreSQL
- JWT Authentication

**Infrastructure**:
- Docker & Docker Compose
- Nginx
- Supabase PostgreSQL

## Development Workflow

1. Create feature branch from `main`
2. Make changes in appropriate layer (frontend/backend)
3. Test locally using Docker Compose
4. Submit pull request
5. Deploy after review

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```
