import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../db';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  try {
    console.log('🔄 Running migrations...');
    
    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    
    await migrate(db, { migrationsFolder: './drizzle' });
    
    await migrationClient.end();
    
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
