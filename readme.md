# School Registry Backend

A comprehensive Node.js backend API for managing educational institutions, built with Express.js, TypeScript, PostgreSQL, and Redis.

## 🚀 Features

- **User Management**: Authentication and authorization with JWT
- **School Management**: CRUD operations for schools with regional organization
- **Role-Based Access Control**: Different user roles (Ministry Admin, Regional Admin, School Admin, Teacher)
- **Regional Organization**: Hierarchical management of regions and cities
- **Secure Authentication**: JWT with refresh tokens and CSRF protection
- **Input Validation**: Comprehensive request validation with Zod
- **Database Migrations**: Version-controlled database schema management
- **Comprehensive Testing**: Unit and integration tests with Vitest
- **Security**: Rate limiting, CORS, helmet security headers
- **Caching**: Redis integration for session management

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Query Builder**: Kysely
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Testing**: Vitest
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Winston, Morgan

## 📋 Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (v13+)
- Redis (v6+)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd school_registry_backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   cp .env.example .env.development
   cp .env.example .env.production
   cp .env.example .env.test
   ```

4. **Configure your environment files**

   ```bash
   # .env.development
   DATABASE_URL="postgresql://username:password@localhost:5432/school_management"
   DB_HOST=localhost
   DB_USER=your_username
   DB_PORT=5432
   DB_NAME=school_management
   DB_PASS=your_password

   # Server
   PORT=3000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_REFRESH_SECRET=your_refresh_secret_key_here
   CSRF_SECRET=your_csrf_secret_key_here
   JWT_EXPIRES_IN=900
   JWT_REFRESH_EXPIRES_IN=604800
   REFRESH_TOKEN_REDIS_TTL=604800
   CSRF_TOKEN_TTL=86400

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password

   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

5. **Set up databases**

   ```bash
   # Create development database
   createdb school_management

   # Create test database
   createdb school_management_test
   ```

6. **Run migrations**
   ```bash
   npm run migrate
   ```

## 🚀 Getting Started

1. **Start development server**

   ```bash
   npm run dev
   ```

2. **Run tests**

   ```bash
   npm test
   ```

3. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register - Register a new user
POST /api/auth/login    - Login user
POST /api/auth/logout   - Logout user
POST /api/auth/refresh  - Refresh access token
```

### Region Endpoints

```
GET    /api/regions     - Get all regions (with pagination & filtering)
POST   /api/regions     - Create a new region
GET    /api/regions/:id - Get region by ID
PUT    /api/regions/:id - Update region
DELETE /api/regions/:id - Delete region
```

### Role Endpoints

```
GET    /api/roles     - Get all roles (with pagination & filtering)
POST   /api/roles     - Create a new role
GET    /api/roles/:id - Get role by ID
PUT    /api/roles/:id - Update role
DELETE /api/roles/:id - Delete role
```

### School Endpoints

```
GET    /api/schools     - Get all schools (with pagination & filtering)
POST   /api/schools     - Create a new school
GET    /api/schools/:id - Get school by ID
PUT    /api/schools/:id - Update school
DELETE /api/schools/:id - Delete school
```

### User Endpoints

```
GET    /api/users     - Get all users (with pagination & filtering)
POST   /api/users     - Create a new user
GET    /api/users/:id - Get user by ID
PUT    /api/users/:id - Update user
DELETE /api/users/:id - Delete user
```

## 🗃 Database Schema

### Regions

- `id` (Primary Key)
- `name` (Unique)
- `isCity` (Boolean)
- `createdAt`, `updatedAt`

### Roles

- `id` (Primary Key)
- `name` (Unique)
- `description`
- `createdAt`, `updatedAt`

### Schools

- `id` (Primary Key)
- `name` (Unique)
- `address`
- `regionId` (Foreign Key → regions.id)
- `email`
- `phone`
- `ownershipType` (public/private)
- `createdAt`, `updatedAt`

### Users

- `id` (Primary Key)
- `email` (Unique)
- `passwordHash`
- `roleId` (Foreign Key → roles.id)
- `schoolId` (Foreign Key → schools.id, nullable)
- `createdAt`, `updatedAt`

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:services
npm run test:region
npm run test:role
npm run test:school
npm run test:user

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Test Structure

```
src/tests/
├── setup.ts                    # Test environment setup
├── helpers/
│   ├── seedData.ts             # Test data creation helpers
│   ├── scenarioSeeds.ts        # Specific test scenarios
│   └── dbHealthCheck.ts        # Database health verification
└── services/
    ├── regionService.test.ts   # Region service tests
    ├── roleService.test.ts     # Role service tests
    ├── schoolService.test.ts   # School service tests
    └── userService.test.ts     # User service tests
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CSRF Protection**: Cross-site request forgery protection
- **Rate Limiting**: API endpoint protection against abuse
- **CORS Configuration**: Cross-origin resource sharing controls
- **Helmet Security**: HTTP security headers
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: bcrypt for secure password storage

## 📁 Project Structure

```
src/
├── config/
│   ├── database.ts          # Database configuration
│   ├── securityConfig.ts    # Security middleware setup
│   ├── loggingConfig.ts     # Logging configuration
│   └── parsingConfig.ts     # Body parsing configuration
├── controllers/             # Request handlers
├── services/               # Business logic layer
├── routes/                 # API route definitions
├── schemas/                # Zod validation schemas
├── middleware/             # Custom middleware
├── types/                  # TypeScript type definitions
├── migrations/             # Database migrations
├── redis/                  # Redis client configuration
├── tests/                  # Test files
└── index.ts               # Application entry point
```

## 🔄 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run migrate      # Run database migrations
npm run migrate:down # Rollback last migration
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🌍 Environment Configuration

The application supports multiple environments:

- **Development**: `.env.development`
- **Production**: `.env.production`
- **Test**: `.env.test`

Environment is determined by `NODE_ENV` variable.

## 🚝 Railway Deployment

Deployment requirements:

1. Create project on Railway
2. In created project there should be three services: API service, PostgreSQL service and Redis service
3. Configure environment variables

Connecting to deployed API service on Railway:

1. Install Railway CLI with 'npm install -g @railway/cli'
2. Log in to Railway through CLI with 'railway login' (this will temporarily open browser for Railway login)
3. Select workspace, project, environment and API service with 'railway link'

Running migration scripts:

1. In terminal position to local project folder containing package.json (make sure Railway CLI is installed)
2. Select Postgres service in Railway project containing API service, Postgres service and Redis service
3. From Variables get DATABASE_PUBLIC_URL value
4. Run DATABASE_URL="DATABASE_PUBLIC_URL" npm run db:migrate
5. This approach enables running migrations remotely without need to redeploy (except in case we want to remove last migration instead of running new migrations)

Important general details:

1. Railway handles secure HTTPS connection on its own, we don't need to manualy create certificates
2. 'tsc-alias' package is important for adding .js extension to imported modules throughout the code after TS compilation is over
3. In general Railway will not consume .env files, we should add all important environment variables to API service in our Railway project
4. When using ioredis package for Redis use Railway Redis service REDIS_URL environment variable with additional config argument for creating Redis instance in our code (read this: https://docs.railway.com/reference/errors/enotfound-redis-railway-internal)

## 🐳 Docker Support

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Use meaningful commit messages
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🚨 Error Handling

The application includes comprehensive error handling:

- **Validation Errors**: Zod schema validation with detailed messages
- **Database Errors**: Graceful handling of database operations
- **Authentication Errors**: JWT and authorization error handling
- **Rate Limiting**: Proper responses for rate-limited requests

## 📊 Monitoring & Logging

- **Winston**: Structured logging with different log levels
- **Morgan**: HTTP request logging
- **Error Tracking**: Comprehensive error logging and stack traces

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**

   ```bash
   # Check PostgreSQL is running
   brew services list | grep postgres

   # Check database exists
   psql -l | grep school_management
   ```

2. **Redis Connection Issues**

   ```bash
   # Check Redis is running
   redis-cli ping
   ```

3. **Migration Issues**

   ```bash
   # Reset database and re-run migrations
   npm run migrate:reset
   npm run migrate
   ```

4. **Test Database Issues**

   ```bash
   # Clean up test data
   npm run test:cleanup

   # Check database health
   npm run test:db-check
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Developer**: [Josip Pokrajcic]
- **Database Design**: [Josip Pokrajcic]
- **Testing**: [Josip Pokrajcic]

## 🆕 Changelog

### Version 1.0.0

- Initial release
- Core CRUD operations for all entities
- JWT authentication system
- Comprehensive test suite
- Database migrations
- Security middleware

## 🔮 Future Enhancements

- [ ] Student management system
- [ ] Grade/Class management
- [ ] Attendance tracking
- [ ] Report generation
- [ ] Email notifications
- [ ] File upload/management
- [ ] Advanced analytics
- [ ] Mobile API optimization
- [ ] GraphQL support
- [ ] Microservices architecture
