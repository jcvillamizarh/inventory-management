import { pgTable, serial, varchar, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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
