import { promises as fs } from 'fs';
import path from 'path';
import { db } from '../config/database';
import { Kysely, sql } from 'kysely';
import { getSrcDirname } from '../utils/path';

interface Migration {
  name: string;
  up: (db: Kysely<any>) => Promise<void>;
  down: (db: Kysely<any>) => Promise<void>;
}

const migrationsDir = path.join(getSrcDirname(), 'migrations');

async function createMigrationsTable(): Promise<void> {
  await db.schema
    .createTable('migrations')
    .ifNotExists()
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(255)', col => col.notNull().unique())
    .addColumn('executed_at', 'timestamp', col =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await db.selectFrom('migrations').select('name').execute();

  return result.map(row => row.name);
}

async function runNewMigrations(): Promise<void> {
  try {
    await createMigrationsTable();

    // const migrationsDir = __dirname;
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.ts') && file !== 'migrate.ts')
      .sort();

    const executedMigrations = await getExecutedMigrations();

    for (const file of migrationFiles) {
      const migrationName = file.replace('.ts', '');

      if (executedMigrations.includes(migrationName)) {
        console.log(`Skipping ${migrationName} (already executed)`);
        continue;
      }

      console.log(`Running migration: ${migrationName}`);

      const migrationPath = path.join(migrationsDir, file);
      const migration: Migration = await import(migrationPath);

      await migration.up(db);

      await db
        .insertInto('migrations')
        .values({ name: migrationName })
        .execute();

      console.log(`Completed migration: ${migrationName}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

async function revertLastMigration(): Promise<void> {
  try {
    const executedMigrations = await getExecutedMigrations();
    if (executedMigrations.length === 0) {
      console.log('No migrations to revert.');
      return;
    }

    const lastMigrationName = executedMigrations[executedMigrations.length - 1];
    if (!lastMigrationName) {
      console.log('No valid migration name found to revert.');
      return;
    }
    const migrationPath = path.join(migrationsDir, `${lastMigrationName}.ts`);
    const migration: Migration = await import(migrationPath);

    console.log(`Reverting migration: ${lastMigrationName}`);
    await migration.down(db);

    await db
      .deleteFrom('migrations')
      .where('name', '=', lastMigrationName)
      .execute();

    console.log(`Reverted migration: ${lastMigrationName}`);
  } catch (error) {
    console.error('Revert failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runNewMigrations();
