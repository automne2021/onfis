# Frontend Layer

This directory contains all frontend applications for the ONFIS platform.

## Applications

### Main Webapp (`main-webapp/`)
The primary React application for authenticated users.

**Technology Stack**:
- React 19 + TypeScript
- Vite
- TailwindCSS + Material-UI
- React Router
- Axios

**Port**: 3000

**Development**:
```bash
cd main-webapp
npm install
npm run dev
```

**Features**:
- User authentication
- Project management
- Position management
- Chat functionality
- Admin panel

### Landing Page (`landing-page/`)
Public-facing website for marketing and information.

**Technology Stack**:
- React 19 + TypeScript
- Vite

**Port**: 3001

**Development**:
```bash
cd landing-page
npm install
npm run dev
```

**Purpose**:
- Company information
- Feature showcase
- Pricing information
- Call-to-action to main app

## Development Workflow

1. **Start both apps**:
   ```bash
   # Terminal 1
   cd main-webapp && npm run dev
   
   # Terminal 2
   cd landing-page && npm run dev
   ```

2. **Access applications**:
   - Landing Page: http://localhost:3001
   - Main Webapp: http://localhost:3000

3. **Building for production**:
   ```bash
   # In each app directory
   npm run build
   ```

## Routing (via Nginx in production)

- `/` → Landing Page
- `/app` → Main Webapp
- `/api` → Backend API Gateway

## Shared Dependencies

Both applications use React 19. Keep dependencies aligned when possible.

## Environment Variables

Create `.env.local` in each app with:
```env
VITE_API_URL=http://localhost:8080/api
```
