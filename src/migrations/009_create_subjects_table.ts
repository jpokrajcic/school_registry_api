import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Creating subjects table...');

  try {
    await db.schema
      .createTable('subjects')
      .addColumn('id', 'serial', col => col.primaryKey())
      .addColumn('name', 'varchar(100)', col => col.notNull())
      .addColumn('code', 'varchar(20)', col => col.notNull().unique())
      .addColumn('description', 'varchar(500)', col =>
        col.defaultTo('').notNull()
      )
      .addColumn('created_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('updated_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .execute();

    console.log('✅ Subjects table created successfully');
  } catch (error) {
    console.error('❌ Error creating subjects table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Dropping subjects table...');

  try {
    // Drop the table
    await db.schema.dropTable('subjects').execute();

    console.log('✅ Subjects table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping subjects table:', error);
    throw error;
  }
}
