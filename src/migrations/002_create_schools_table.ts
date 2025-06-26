import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Creating schools table...');

  try {
    await db.schema
      .createTable('schools')
      .addColumn('id', 'serial', col => col.primaryKey())
      .addColumn('name', 'varchar(100)', col => col.notNull())
      .addColumn('address', 'varchar(200)', col => col.notNull())
      .addColumn('region_id', 'integer', col => col.notNull())
      .addForeignKeyConstraint(
        'fk_school_region',
        ['region_id'],
        'regions',
        ['id'],
        fk => fk.onDelete('set null')
      )
      .addColumn('email', 'varchar(100)', col => col.notNull())
      .addColumn('phone', 'varchar(16)', col => col.notNull())
      .addColumn('ownership_type', 'varchar(16)', col => col.notNull())
      .addColumn('created_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('updated_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .execute();

    // Create index for region_id
    await db.schema
      .createIndex('schools_region_id_idx')
      .on('schools')
      .column('region_id')
      .execute();

    console.log('✅ Schools table and indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating schools table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Dropping schools table...');

  try {
    // Drop indexes first (they will be dropped automatically with the table, but being explicit)
    const indexes = ['schools_region_id_idx'];

    for (const indexName of indexes) {
      try {
        await db.schema.dropIndex(indexName).ifExists().execute();
      } catch (error) {
        console.warn(
          `⚠️  Could not drop index ${indexName}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Drop the table
    await db.schema.dropTable('schools').execute();

    console.log('✅ Schools table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping schools table:', error);
    throw error;
  }
}
