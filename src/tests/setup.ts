import { beforeAll, afterAll } from 'vitest';
import { db } from '../config/database';
import dotenv from 'dotenv';
import path from 'path';

beforeAll(async () => {
  // Load test environment variables
  const envPath = path.resolve(process.cwd(), '.env.test');
  dotenv.config({ path: envPath });

  process.env['NODE_ENV'] = 'test';

  console.log('🧪 Test Database:', process.env['DB_NAME'] || 'default');

  try {
    // Verify we can connect and basic tables exist
    await Promise.all([
      db.selectFrom('regions').select('id').limit(1).execute(),
      db.selectFrom('roles').select('id').limit(1).execute(),
    ]).catch(() => {
      throw new Error('Required tables do not exist. Run migrations first.');
    });

    console.log('✅ Test database ready');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    console.log('\n💡 To fix this:');
    console.log('1. Create test database: createdb school_management_test');
    console.log('2. Run migrations: npm run migrate:test');
    console.log('3. Ensure .env.test exists with correct database config\n');
    throw error;
  }
});

afterAll(async () => {
  // Safety cleanup - remove test data patterns
  const cleanupQueries = [
    db.deleteFrom('users').where('email', 'like', '%@test.%'),
    db.deleteFrom('users').where('email', 'like', 'test%'),
    db.deleteFrom('schools').where('name', 'like', 'Test %'),
    db.deleteFrom('regions').where('name', 'like', 'Test %'),
    db.deleteFrom('roles').where('name', 'like', 'Test %'),
  ];

  await Promise.allSettled(cleanupQueries.map(query => query.execute()));
  await db.destroy();
});
