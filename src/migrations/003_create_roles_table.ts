import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Creating roles table...');

  try {
    await db.schema
      .createTable('roles')
      .addColumn('id', 'serial', col => col.primaryKey())
      .addColumn('name', 'varchar(50)', col => col.notNull().unique())
      .addColumn('description', 'varchar(255)', col =>
        col.defaultTo('').notNull()
      )
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

    console.log('✅ Roles table and indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating roles table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Dropping roles table...');

  try {
    // Drop the table
    await db.schema.dropTable('roles').execute();

    console.log('✅ Roles table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping roles table:', error);
    throw error;
  }
}
