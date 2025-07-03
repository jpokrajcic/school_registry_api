import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Creating regions table...');

  try {
    await db.schema
      .createTable('regions')
      .addColumn('id', 'serial', col => col.primaryKey())
      .addColumn('name', 'varchar(255)', col => col.notNull())
      .addColumn('is_city', 'boolean', col => col.notNull().defaultTo(false))
      .addColumn('created_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('updated_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .execute();

    // Create indexes
    await db.schema
      .createIndex('regions_is_city_idx')
      .on('regions')
      .column('is_city')
      .execute();

    await db.schema
      .createIndex('regions_created_at_idx')
      .on('regions')
      .column('created_at')
      .execute();

    console.log('✅ Regions table and indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating regions table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Dropping regions table...');

  try {
    // Drop the table
    await db.schema.dropTable('regions').execute();

    console.log('✅ Regions table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping regions table:', error);
    throw error;
  }
}
