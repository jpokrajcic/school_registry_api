import { db } from '../config/database';

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await db.selectFrom('regions').select('id').limit(1).execute();
    return true;
  } catch (error) {
    return false;
  }
};
