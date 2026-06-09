import { db } from '../src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  try {
    console.log('Applying unit constraint migration...');
    
    // Drop old constraint if exists
    await db.execute(sql`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_unitCheck"`);
    console.log('Old constraint dropped (if existed)');
    
    // Add new constraint with GRAMOS and MILILITROS
    await db.execute(sql`ALTER TABLE "products" ADD CONSTRAINT "products_unitCheck" CHECK ("unit_base" IN ('KILOGRAMOS', 'LITROS', 'UNIDADES', 'GRAMOS', 'MILILITROS'))`);
    console.log('New constraint added successfully');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
