import { pgTable, bigserial, integer, uuid, numeric, date, timestamp, unique, varchar } from 'drizzle-orm/pg-core';
import { providers } from '../../../lib/db/schema.js';
import { products } from '../../../lib/db/schema.js';
import { users } from '../../../lib/db/schema.js';

export const inventoryEntries = pgTable('inventory_entries', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  providerId: integer('provider_id').notNull().references(() => providers.id),
  productId: integer('product_id').notNull().references(() => products.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  entryDate: date('entry_date').defaultNow().notNull(),
  expirationDate: date('expiration_date').notNull(),
  batchNumber: varchar('batch_number', { length: 50 }).notNull(),
  quantityUnits: numeric('quantity_units', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dailyClosures = pgTable('daily_closures', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  closureDate: date('closure_date').defaultNow().notNull(),
  initialStock: numeric('initial_stock', { precision: 10, scale: 2 }).notNull(),
  totalEntries: numeric('total_entries', { precision: 10, scale: 2 }).default('0.00').notNull(),
  physicalStock: numeric('physical_stock', { precision: 10, scale: 2 }).notNull(),
  calculatedConsumption: numeric('calculated_consumption', { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  uniqueProductDate: unique('unique_product_date').on(table.productId, table.closureDate),
}));

