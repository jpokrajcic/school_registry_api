import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('roles')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(50)', col => col.notNull().unique())
    .addColumn('description', 'varchar(255)', col => col.defaultTo('').notNull())
    .addColumn('created_at', 'timestamp', col =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamp', col =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  // Optional: create index on name for faster search
  await db.schema
    .createIndex('roles_name_idx')
    .on('roles')
    .column('name')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('roles').execute();
}