# Banduka POS Backend

Production-ready backend for Banduka POS with KRA eTIMS integration.

## Features

- ✅ Multi-tenant SaaS architecture
- ✅ KRA eTIMS integration with bulletproof submission tracking
- ✅ Offline-first operation with conflict-free synchronization
- ✅ Double-entry accounting system
- ✅ Real-time inventory management
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive audit trails
- ✅ RESTful API with Swagger documentation
- ✅ PostgreSQL with TimescaleDB for time-series data
- ✅ Redis for caching and job queues

## Tech Stack

- **Framework**: NestJS 10.x with TypeScript 5.x
- **Database**: PostgreSQL 16.x + TimescaleDB
- **Cache/Queue**: Redis 7.x
- **ORM**: Prisma
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Prerequisites

- Node.js 20.x LTS
- PostgreSQL 16.x (or use Docker)
- Redis 7.x (or use Docker)
- npm or yarn

## Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Start Database Services (Docker)

```bash
docker-compose up -d
```

This will start:
- PostgreSQL with TimescaleDB on port 5432
- Redis on port 6379
- Redis Commander (GUI) on port 8081

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data (optional)
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at:
- API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api/docs

## Project Structure

```
backend/
├── src/
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── products/     # Product catalog
│   │   ├── sales/        # Sales transactions
│   │   ├── etims/        # eTIMS integration
│   │   └── ...
│   ├── common/           # Shared utilities
│   │   ├── filters/      # Exception filters
│   │   ├── interceptors/ # Request/response interceptors
│   │   ├── guards/       # Auth guards
│   │   └── decorators/   # Custom decorators
│   ├── config/           # Configuration
│   ├── database/         # Database setup
│   └── main.ts           # Application entry
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── test/                 # Tests
└── docker/               # Docker configs
```

## Available Scripts

```bash
# Development
npm run start:dev         # Start with hot reload
npm run start:debug       # Start with debugger

# Build
npm run build            # Build for production
npm run start:prod       # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run prisma:seed      # Seed database

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage
npm run test:e2e         # Run e2e tests

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:3000/api/docs

## Database Management

### Access PostgreSQL

```bash
# Via Docker
docker exec -it banduka-postgres psql -U postgres -d banduka_pos

# Via Prisma Studio (GUI)
npm run prisma:studio
```

### Access Redis

```bash
# Via Docker CLI
docker exec -it banduka-redis redis-cli

# Via Redis Commander (GUI)
# Open http://localhost:8081
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `ETIMS_API_URL`: KRA eTIMS API endpoint
- `REDIS_HOST`: Redis server host

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Docker Deployment

```bash
# Build image
docker build -t banduka-backend .

# Run container
docker run -p 3000:3000 --env-file .env banduka-backend
```

## Monitoring

- Health check: `GET /api/health`
- Version: `GET /api/version`
- Metrics: `GET /api/metrics` (if enabled)

## Security

- JWT authentication with refresh tokens
- Rate limiting (100 requests/minute)
- CORS enabled for frontend
- Helmet for security headers
- Input validation with class-validator
- SQL injection protection via Prisma

## Support

For issues and questions:
- Email: dev@banduka.co.ke
- Documentation: https://docs.banduka.co.ke

## License

Proprietary - All rights reserved
