import dotenv from 'dotenv';
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { type Database } from '../types/database';
import path from 'path';

// This file sets up the database connection using Kysely and PostgreSQL.
// It exports a `db` instance that can be used throughout the application to interact with the database.
// Ensure that the DB environment variables are set in your environment.
// This URL should point to your PostgreSQL database.
// The `Database` type is imported from the types directory, which defines the structure of your database tables.
// The `Kysely` instance is configured with a PostgreSQL dialect using a connection pool (uses the "pg" driver library under the hood)
// This allows for efficient database operations and connection management.

const envPath =
  process.env['NODE_ENV'] === 'production'
    ? '.env.production'
    : process.env['NODE_ENV'] === 'development'
      ? '.env.development'
      : '.env.test';

dotenv.config({ path: path.resolve(process.cwd(), envPath) });
console.log('📦 Loaded environment variables HOST:', process.env['DB_NAME']);
const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env['DB_HOST'],
    user: process.env['DB_USER'],
    port: process.env['DB_PORT'] ? Number(process.env['DB_PORT']) : undefined,
    database: process.env['DB_NAME'],
    password: process.env['DB_PASS'],
  }),
  // pool: new Pool({
  //   connectionString: process.env.DATABASE_URL,
  // }),
});

export const db = new Kysely<Database>({
  dialect,
  plugins: [new CamelCasePlugin()], // This plugin automatically converts snake_case to camelCase for column names
  // and vice versa when inserting data.
});
