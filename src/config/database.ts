import dotenv from 'dotenv';
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { type Database } from '../types/database';
import path from 'path';
import { getEnvironmentPath } from '../utils/pathUtils';

// This file sets up the database connection using Kysely and PostgreSQL.
// It exports a `db` instance that can be used throughout the application to interact with the database.
// For production: uses DATABASE_URL (required by Railway)
// For development/testing: uses individual DB environment variables for more granular control
// The `Database` type is imported from the types directory, which defines the structure of your database tables.
// The `Kysely` instance is configured with a PostgreSQL dialect using a connection pool (uses the "pg" driver library under the hood)
// This allows for efficient database operations and connection management.

const envPath: string = getEnvironmentPath();
dotenv.config({ path: path.resolve(process.cwd(), envPath) });

// Create different database configurations based on environment
const createDatabaseDialect = (): PostgresDialect => {
  const isProduction = process.env['NODE_ENV'] === 'production';

  if (isProduction) {
    // Production: use DATABASE_URL (required by Railway)
    console.log('🚀 PRODUCTION - Using DATABASE_URL');

    if (!process.env['DATABASE_URL']) {
      throw new Error('DATABASE_URL is required for production environment');
    }

    return new PostgresDialect({
      pool: new Pool({
        connectionString: process.env['DATABASE_URL'],
        ssl: {
          rejectUnauthorized: false, // Required for Railway's public connections
        },
        max: 20, // Maximum number of connections in pool
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
      }),
    });
  } else {
    // Development/Testing: use individual environment variables
    console.log(
      `🔧 ${process.env['NODE_ENV']?.toUpperCase() || 'DEFAULT'} - Using individual DB config`
    );

    // Validate required environment variables for development/testing
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASS'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }

    return new PostgresDialect({
      pool: new Pool({
        host: process.env['DB_HOST'],
        user: process.env['DB_USER'],
        port: process.env['DB_PORT']
          ? Number(process.env['DB_PORT'])
          : undefined,
        database: process.env['DB_NAME'],
        password: process.env['DB_PASS'],
        // Optional: Add development-specific pool settings
        max: 10, // Smaller pool for development
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }),
    });
  }
};

const dialect = createDatabaseDialect();

export const db = new Kysely<Database>({
  dialect,
  plugins: [new CamelCasePlugin()], // This plugin automatically converts snake_case to camelCase for column names
  // and vice versa when inserting data.
});
