import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  nitCedula: varchar('nit_cedula', { length: 20 }),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: varchar('address', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
