import { db } from '../src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function dropUniqueConstraint() {
  try {
    // First, check if the constraint exists
    const result = await db.execute(sql`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'daily_closures'::regclass 
      AND contype = 'u'
    `);
    
    console.log('Existing constraints:', result);
    
    // Drop the constraint
    await db.execute(sql`ALTER TABLE "daily_closures" DROP CONSTRAINT IF EXISTS "daily_closures_product_id_closure_date_key"`);
    console.log('✓ UNIQUE constraint dropped successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error dropping constraint:', error);
    process.exit(1);
  }
}

dropUniqueConstraint();
