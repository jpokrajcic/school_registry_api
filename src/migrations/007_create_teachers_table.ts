import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Creating teachers table...');

  try {
    await db.schema
      .createTable('teachers')
      .addColumn('id', 'serial', col => col.primaryKey())
      .addColumn('first_name', 'varchar(100)', col => col.notNull())
      .addColumn('middle_name', 'varchar(100)', col =>
        col.notNull().defaultTo('')
      )
      .addColumn('last_name', 'varchar(100)', col => col.notNull())
      .addColumn('post_code', 'varchar(20)', col => col.notNull())
      .addColumn('address', 'varchar(255)', col => col.notNull())
      .addColumn('email', 'varchar(255)', col => col.notNull().unique())
      .addColumn('phone', 'varchar(20)', col => col)
      .addColumn('mobile', 'varchar(20)', col => col)
      .addColumn('gender', 'varchar(10)', col =>
        col.check(sql`gender IN ('male', 'female')`)
      )
      .addColumn('date_of_birth', 'date', col => col)
      .addColumn('created_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('updated_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .execute();

    // Create indexes for better query performance
    await db.schema
      .createIndex('idx_teachers_email')
      .on('teachers')
      .column('email')
      .execute();

    await db.schema
      .createIndex('idx_teachers_last_name')
      .on('teachers')
      .column('last_name')
      .execute();

    await db.schema
      .createIndex('idx_teachers_full_name')
      .on('teachers')
      .columns(['last_name', 'first_name'])
      .execute();

    // Add constraint to ensure at least one contact method
    await db.schema
      .alterTable('teachers')
      .addCheckConstraint(
        'chk_teachers_contact_required',
        sql`phone IS NOT NULL OR mobile IS NOT NULL`
      )
      .execute();

    console.log('✅ Teachers table created successfully');
  } catch (error) {
    console.error('❌ Error creating teachers table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Dropping teachers table...');

  try {
    await db.schema.dropTable('teachers').ifExists().execute();
    console.log('✅ Teachers table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping teachers table:', error);
    throw error;
  }
}
