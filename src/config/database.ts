import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { type Database } from '../types/database';

// This file sets up the database connection using Kysely and PostgreSQL.
// It exports a `db` instance that can be used throughout the application to interact with the database.
// Ensure that the DB environment variables are set in your environment.
// This URL should point to your PostgreSQL database.
// The `Database` type is imported from the types directory, which defines the structure of your database tables.
// The `Kysely` instance is configured with a PostgreSQL dialect using a connection pool (uses the "pg" driver library under the hood)
// This allows for efficient database operations and connection management.

const dialect = new PostgresDialect({
  pool: new Pool({
    host: 'localhost',
    user: 'azgaz',
    port: 5432,
    database: 'school_management',
    password: 'azgaz123',
  }),
  // pool: new Pool({
  //   connectionString: process.env.DATABASE_URL,
  // }),
});

export const db = new Kysely<Database>({
  dialect,
});
