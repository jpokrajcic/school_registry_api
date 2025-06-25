import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Adding unique constraints to name columns...');

  try {
    // First, remove any duplicate entries before adding the constraint
    // For regions table
    console.log('Removing duplicate regions...');
    await sql`
      DELETE FROM regions r1 
      USING regions r2 
      WHERE r1.id > r2.id 
      AND r1.name = r2.name
    `.execute(db);

    // For schools table
    console.log('Removing duplicate schools...');
    await sql`
      DELETE FROM schools s1 
      USING schools s2 
      WHERE s1.id > s2.id 
      AND s1.name = s2.name
    `.execute(db);

    // Add unique constraint to regions.name
    console.log('Adding unique constraint to regions.name...');
    await db.schema
      .alterTable('regions')
      .addUniqueConstraint('regions_name_unique', ['name'])
      .execute();

    // Add unique constraint to schools.name
    console.log('Adding unique constraint to schools.name...');
    await db.schema
      .alterTable('schools')
      .addUniqueConstraint('schools_name_unique', ['name'])
      .execute();

    console.log('✅ Unique constraints added successfully');
  } catch (error) {
    console.error('❌ Error adding unique constraints:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Removing unique constraints from name columns...');

  try {
    // Remove unique constraint from schools.name
    console.log('Removing unique constraint from schools.name...');
    await db.schema
      .alterTable('schools')
      .dropConstraint('schools_name_unique')
      .execute();

    // Remove unique constraint from regions.name
    console.log('Removing unique constraint from regions.name...');
    await db.schema
      .alterTable('regions')
      .dropConstraint('regions_name_unique')
      .execute();

    console.log('✅ Unique constraints removed successfully');
  } catch (error) {
    console.error('❌ Error removing unique constraints:', error);
    throw error;
  }
}
