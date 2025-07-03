import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Creating users table...');

  try {
    await db.schema
      .createTable('users')
      .addColumn('id', 'serial', col => col.primaryKey())
      .addColumn('email', 'text', col => col.notNull().unique())
      .addColumn('password_hash', 'text', col => col.notNull())
      .addColumn('role_id', 'integer', col =>
        col.notNull().references('roles.id')
      )
      .addForeignKeyConstraint(
        'fk_user_role',
        ['role_id'],
        'roles',
        ['id'],
        fk => fk.onDelete('set null')
      )
      .addColumn('school_id', 'integer', col => col.references('schools.id'))
      .addForeignKeyConstraint(
        'fk_user_school',
        ['school_id'],
        'schools',
        ['id'],
        fk => fk.onDelete('set null')
      )
      .addColumn('created_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('updated_at', 'timestamp', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .execute();

    // Create index for role_id
    await db.schema
      .createIndex('users_role_id_idx')
      .on('users')
      .column('role_id')
      .execute();

    // Create index for school_id
    await db.schema
      .createIndex('users_school_id_idx')
      .on('users')
      .column('school_id')
      .execute();

    console.log('✅ Users table and indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Dropping users table...');

  try {
    // Drop the table
    await db.schema.dropTable('users').execute();

    console.log('✅ Users table dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping users table:', error);
    throw error;
  }
}
