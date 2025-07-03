import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Creating students table...');

  try {
    await db.schema
      .createTable('students')
      .addColumn('id', 'serial', col => col.primaryKey())
      .addColumn('first_name', 'varchar(100)', col => col.notNull())
      .addColumn('middle_name', 'varchar(100)', col => col.notNull())
      .addColumn('last_name', 'varchar(100)', col => col.notNull())
      .addColumn('region_id', 'integer', col => col.references('regions.id'))
      .addForeignKeyConstraint(
        'fk_student_region',
        ['region_id'],
        'regions',
        ['id'],
        fk => fk.onDelete('set null')
      )
      .addColumn('post_code', 'varchar(20)', col => col.notNull())
      .addColumn('address', 'text', col => col.notNull())
      .addColumn('phone', 'varchar(20)', col => col)
      .addColumn('email', 'varchar(255)', col => col)
      .addColumn('mobile', 'varchar(20)', col => col)
      .addColumn('gender', 'varchar(10)', col =>
        col.check(sql`gender IN ('male', 'female')`).notNull()
      )
      .addColumn('date_of_birth', 'date', col => col)
      .addColumn('student_number', 'varchar(50)', col => col.notNull().unique())
      .addColumn('school_id', 'integer', col => col.references('schools.id'))
      .addForeignKeyConstraint(
        'fk_student_school',
        ['school_id'],
        'schools',
        ['id'],
        fk => fk.onDelete('set null')
      )
      .addColumn('enrollment_date', 'date', col => col)
      .addColumn('active', 'boolean', col => col.defaultTo(true).notNull())
      .addColumn('created_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('updated_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .execute();

    // Create indexes for better query performance
    console.log('Creating indexes for students table...');

    // Index on student_number for fast lookup
    await db.schema
      .createIndex('students_student_number_idx')
      .on('students')
      .column('student_number')
      .execute();

    // Index on school_id for filtering by school
    await db.schema
      .createIndex('students_school_id_idx')
      .on('students')
      .column('school_id')
      .execute();

    // Index on active status for filtering active students
    await db.schema
      .createIndex('students_active_idx')
      .on('students')
      .column('active')
      .execute();

    // Composite index for name searches
    await db.schema
      .createIndex('students_name_idx')
      .on('students')
      .columns(['last_name', 'first_name'])
      .execute();

    // Index on enrollment_date for chronological queries
    await db.schema
      .createIndex('students_enrollment_date_idx')
      .on('students')
      .column('enrollment_date')
      .execute();

    // Index on gender for demographic queries
    await db.schema
      .createIndex('students_gender_idx')
      .on('students')
      .column('gender')
      .execute();

    console.log('✅ Students table and indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating students table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Dropping students table...');

  try {
    // Drop the table
    await db.schema.dropTable('students').execute();

    console.log('✅ Students table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping students table:', error);
    throw error;
  }
}
