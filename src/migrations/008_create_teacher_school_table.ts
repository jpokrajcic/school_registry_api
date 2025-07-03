import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Creating teacher_schools junction table...');

  try {
    await db.schema
      .createTable('teacher_schools')
      .addColumn('id', 'serial', col => col.primaryKey())
      .addColumn('teacher_id', 'integer', col =>
        col.references('teachers.id').onDelete('cascade').notNull()
      )
      .addColumn('school_id', 'integer', col =>
        col.references('schools.id').onDelete('cascade').notNull()
      )
      .addColumn('employment_type', 'varchar(50)', col =>
        col
          .check(sql`employment_type IN ('full-time', 'part-time', 'contract')`)
          .notNull()
      )
      .addColumn('start_date', 'date', col => col.notNull())
      .addColumn('end_date', 'date', col => col)
      .addColumn('is_active', 'boolean', col => col.defaultTo(true).notNull())
      .addColumn('created_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('updated_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .execute();

    // Create indexes for better query performance
    await db.schema
      .createIndex('idx_teacher_schools_teacher_id')
      .on('teacher_schools')
      .column('teacher_id')
      .execute();

    await db.schema
      .createIndex('idx_teacher_schools_school_id')
      .on('teacher_schools')
      .column('school_id')
      .execute();

    // Add constraint to prevent duplicate teacher-school combinations
    await db.schema
      .alterTable('teacher_schools')
      .addUniqueConstraint('uk_teacher_school_active', [
        'teacher_id',
        'school_id',
      ])
      .execute();

    // Add constraint to ensure end_date is after start_date
    await db.schema
      .alterTable('teacher_schools')
      .addCheckConstraint(
        'chk_teacher_schools_date_order',
        sql`end_date IS NULL OR end_date >= start_date`
      )
      .execute();

    // Add constraint to ensure inactive records have end_date
    await db.schema
      .alterTable('teacher_schools')
      .addCheckConstraint(
        'chk_teacher_schools_inactive_end_date',
        sql`(is_active = true AND end_date IS NULL) OR (is_active = false AND end_date IS NOT NULL)`
      )
      .execute();

    console.log('✅ Teacher schools junction table created successfully');
  } catch (error) {
    console.error('❌ Error creating teacher schools table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Dropping teacher_schools table...');

  try {
    await db.schema.dropTable('teacher_schools').ifExists().execute();
    console.log('✅ Teacher schools table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping teacher schools table:', error);
    throw error;
  }
}
