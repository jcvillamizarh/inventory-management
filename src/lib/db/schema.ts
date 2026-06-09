import { pgTable, serial, text, boolean, timestamp, uuid, varchar, numeric, date, integer, bigserial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  nitCedula: varchar('nit_cedula', { length: 20 }),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: varchar('address', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 25 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  unitBase: varchar('unit_base', { length: 20 }).notNull(),
  stockMinimo: numeric('stock_minimo', { precision: 10, scale: 2 }),
  presentationQuantity: numeric('presentation_quantity', { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  categoryCheck: sql`CHECK (${table.category} IN ('MATERIA_PRIMA', 'PRODUCTO_TERMINADO', 'MATERIAL_DE_EMPAQUE', 'PRODUCTOS_L_D'))`,
  typeCheck: sql`CHECK (${table.type} IN ('SECO_NO_PERECEDERO', 'PERECEDERO'))`,
  unitCheck: sql`CHECK (${table.unitBase} IN ('KILOGRAMOS', 'LITROS', 'UNIDADES', 'GRAMOS', 'MILILITROS'))`,
  stockMinimoCheck: sql`CHECK ((type = 'SECO_NO_PERECEDERO' AND stock_minimo IS NOT NULL AND stock_minimo > 0) OR (type = 'PERECEDERO' AND stock_minimo IS NULL))`,
  presentationQuantityCheck: sql`CHECK (presentation_quantity > 0)`,
}));

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
  closureTimestamp: timestamp('closure_timestamp').defaultNow().notNull(),
  initialStock: numeric('initial_stock', { precision: 10, scale: 2 }).notNull(),
  totalEntries: numeric('total_entries', { precision: 10, scale: 2 }).default('0.00').notNull(),
  physicalStock: numeric('physical_stock', { precision: 10, scale: 2 }).notNull(),
  calculatedConsumption: numeric('calculated_consumption', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
});

export const stockMovements = pgTable('stock_movements', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  movementType: varchar('movement_type', { length: 20 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  referenceId: integer('reference_id'),
  referenceType: varchar('reference_type', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  notes: text('notes'),
});
