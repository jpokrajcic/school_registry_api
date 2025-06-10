# Full-Stack Boilerplate

A modern full-stack boilerplate with Node.js, Express, TypeScript, Kysely, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Query builder**: Kysely
- **Code Quality**: ESLint + Prettier
- **Development**: Nodemon

## Features

- ✅ TypeScript configuration with strict mode
- ✅ Express.js server with middleware setup
- ✅ Kysely Typescript query builder with PostgreSQL
- ✅ ESLint + Prettier for code formatting
- ✅ Error handling middleware
- ✅ CORS and security headers (Helmet)
- ✅ HTTP Request logging in console or in file (Morgan)
- ✅ Environment variable management
- ✅ Graceful shutdown handling

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and setup:**
   git clone <your-repo>
   cd fullstack-boilerplate
   npm install

2. **Environment setup:**
   cp .env .env.development
   cp .env .env.production

   # Edit .env with your database credentials

3. **Database setup:**

   # Install postgres

   brew install postgresql

   # Start postgres

   brew services start postgresql

   # Install DBeaver and connect to database

   # Run migrations (for production)

   npm run db:migrate

4. **Start development server:**
   npm run dev

The server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run db:migrate` - Run database migrations

## API Endpoints

### Regions

- `GET /api/regiosn` - Get all regions
- `GET /api/regions/:id` - Get region by ID
- `POST /api/regions` - Create new region
- `PUT /api/regions/:id` - Update region
- `DELETE /api/regions/:id` - Delete region

## Development Tips

1. **Database Changes**: After modifying `schema.prisma`, run `npm run db:generate` to update the Prisma client
2. **Code Quality**: The project is configured with strict TypeScript, ESLint, and Prettier
3. **Error Handling**: All async route handlers are wrapped with `asyncHandler` for automatic error catching
4. **Environment**: Check `.env.example` for required environment variables

## Production Deployment

1. Set environment variables
2. Run `npm run build`
3. Run database migrations: `npm run db:migrate`
4. Start with `npm start`

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Add proper TypeScript types
3. Include error handling
4. Test your changes
