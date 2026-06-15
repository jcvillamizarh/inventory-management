import { db } from '../../../lib/db/index.js';
import { inventoryEntries, dailyClosures } from './inventory.schema.js';
import { providers, products, stockMovements } from '../../../lib/db/schema.js';
import { eq, and, gte, gt, lt, sum, sql } from 'drizzle-orm';
import type { IInventoryRepository, InventoryEntry, DailyClosure } from '../inventory.repository.js';

export class DrizzleInventoryRepository implements IInventoryRepository {
  async saveEntry(entry: Omit<InventoryEntry, 'id' | 'createdAt'>): Promise<InventoryEntry> {
    const result = await db
      .insert(inventoryEntries)
      .values({
        providerId: entry.providerId,
        productId: entry.productId,
        userId: entry.userId,
        entryDate: entry.entryDate.toISOString().split('T')[0],
        expirationDate: entry.expirationDate ? entry.expirationDate.toISOString().split('T')[0] : null,
        batchNumber: entry.batchNumber,
        quantityUnits: entry.quantityUnits.toString(),
      })
      .returning();

    const savedEntry = result[0];

    // Create stock movement for this entry
    await db.insert(stockMovements).values({
      productId: savedEntry.productId,
      userId: savedEntry.userId,
      movementType: 'ENTRY',
      quantity: savedEntry.quantityUnits,
      referenceId: savedEntry.id,
      referenceType: 'ENTRY',
      notes: `Entry: ${savedEntry.batchNumber || 'N/A'}`,
    });

    return {
      id: savedEntry.id,
      providerId: savedEntry.providerId,
      productId: savedEntry.productId,
      userId: savedEntry.userId,
      entryDate: new Date(savedEntry.entryDate),
      expirationDate: savedEntry.expirationDate ? new Date(savedEntry.expirationDate) : null,
      batchNumber: savedEntry.batchNumber,
      quantityUnits: parseFloat(savedEntry.quantityUnits),
      createdAt: savedEntry.createdAt,
    };
  }

  async getInitialStock(productId: number, date: Date): Promise<number> {
    // Get the most recent closure before the current date
    const dateStr = date.toISOString().split('T')[0];
    const result = await db
      .select({ physicalStock: dailyClosures.physicalStock })
      .from(dailyClosures)
      .where(and(
        eq(dailyClosures.productId, productId),
        lt(dailyClosures.closureDate, dateStr)
      ))
      .orderBy(dailyClosures.closureDate)
      .limit(1);

    if (result.length === 0) {
      return 0; // No previous closure, initial stock is 0
    }

    return parseFloat(result[0].physicalStock);
  }

  async getTotalEntriesForDay(productId: number, date: Date): Promise<number> {
    const dateStr = date.toISOString().split('T')[0];
    const result = await db
      .select({ total: sum(inventoryEntries.quantityUnits) })
      .from(inventoryEntries)
      .where(and(
        eq(inventoryEntries.productId, productId),
        eq(inventoryEntries.entryDate, dateStr)
      ));

    if (result.length === 0 || result[0].total === null) {
      return 0;
    }

    return parseFloat(result[0].total);
  }

  async saveClosure(closure: Omit<DailyClosure, 'id'>): Promise<DailyClosure> {
    const result = await db
      .insert(dailyClosures)
      .values({
        productId: closure.productId,
        userId: closure.userId,
        closureDate: closure.closureDate.toISOString().split('T')[0],
        closureTimestamp: new Date(),
        initialStock: closure.initialStock.toString(),
        totalEntries: closure.totalEntries.toString(),
        physicalStock: closure.physicalStock.toString(),
        calculatedConsumption: closure.calculatedConsumption.toString(),
        notes: closure.notes,
      })
      .returning();

    const savedClosure = result[0];

    // Create stock movement for the adjustment (consumption)
    // The adjustment is the difference between the theoretical stock and physical stock
    const adjustment = parseFloat(savedClosure.physicalStock) - (parseFloat(savedClosure.initialStock) + parseFloat(savedClosure.totalEntries));
    if (adjustment !== 0) {
      await db.insert(stockMovements).values({
        productId: savedClosure.productId,
        userId: savedClosure.userId,
        movementType: 'CLOSURE_ADJUSTMENT',
        quantity: adjustment.toString(),
        referenceId: savedClosure.id,
        referenceType: 'CLOSURE',
        notes: `Closure adjustment: theoretical ${parseFloat(savedClosure.initialStock) + parseFloat(savedClosure.totalEntries)} -> physical ${savedClosure.physicalStock}`,
      });
    }

    return {
      id: savedClosure.id,
      productId: savedClosure.productId,
      userId: savedClosure.userId,
      closureDate: new Date(savedClosure.closureDate),
      initialStock: parseFloat(savedClosure.initialStock),
      totalEntries: parseFloat(savedClosure.totalEntries),
      physicalStock: parseFloat(savedClosure.physicalStock),
      calculatedConsumption: parseFloat(savedClosure.calculatedConsumption),
    };
  }

  async hasExistingClosure(productId: number, date: Date): Promise<boolean> {
    const dateStr = date.toISOString().split('T')[0];
    const result = await db
      .select({ id: dailyClosures.id })
      .from(dailyClosures)
      .where(and(
        eq(dailyClosures.productId, productId),
        eq(dailyClosures.closureDate, dateStr)
      ))
      .limit(1);

    return result.length > 0;
  }

  async getLatestPhysicalStock(productId: number): Promise<number> {
    // Get all stock movements for this product ordered chronologically
    const allMovements = await db
      .select({
        quantity: stockMovements.quantity,
      })
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(stockMovements.timestamp);

    // If no movements exist, migrate existing data
    if (allMovements.length === 0) {
      await this.migrateExistingDataToMovements();
      return this.getLatestPhysicalStock(productId);
    }

    // Sum all movements chronologically
    let stock = 0;
    for (const movement of allMovements) {
      stock += parseFloat(movement.quantity);
    }

    return stock;
  }

  async getLatestPhysicalStockForAllProducts(): Promise<Map<number, number>> {
    const stockMap = new Map<number, number>();

    // Get all stock movements ordered chronologically
    const allMovements = await db
      .select({
        productId: stockMovements.productId,
        quantity: stockMovements.quantity,
        timestamp: stockMovements.timestamp,
        movementType: stockMovements.movementType,
      })
      .from(stockMovements)
      .orderBy(stockMovements.timestamp);

    // If no movements exist, migrate existing data
    if (allMovements.length === 0) {
      await this.migrateExistingDataToMovements();
      return this.getLatestPhysicalStockForAllProducts();
    }

    // Sum all movements for each product chronologically
    for (const movement of allMovements) {
      const currentStock = stockMap.get(movement.productId) || 0;
      const quantity = parseFloat(movement.quantity);
      const newStock = currentStock + quantity;
      stockMap.set(movement.productId, newStock);
    }

    return stockMap;
  }

  private async migrateExistingDataToMovements(): Promise<void> {
    // Check if migration already happened by looking for migrated notes
    const existingMigrated = await db
      .select({ id: stockMovements.id })
      .from(stockMovements)
      .where(sql`${stockMovements.notes} LIKE 'Migrated%'`)
      .limit(1);

    if (existingMigrated.length > 0) {
      console.log('[migrateExistingDataToMovements] Migration already completed, skipping');
      return;
    }

    // Get all existing entries
    const allEntries = await db
      .select({
        id: inventoryEntries.id,
        productId: inventoryEntries.productId,
        userId: inventoryEntries.userId,
        quantityUnits: inventoryEntries.quantityUnits,
        batchNumber: inventoryEntries.batchNumber,
        createdAt: inventoryEntries.createdAt,
      })
      .from(inventoryEntries)
      .orderBy(inventoryEntries.createdAt);

    // Create movements for each entry
    for (const entry of allEntries) {
      await db.insert(stockMovements).values({
        productId: entry.productId,
        userId: entry.userId,
        movementType: 'ENTRY',
        quantity: entry.quantityUnits,
        referenceId: entry.id,
        referenceType: 'ENTRY',
        timestamp: entry.createdAt,
        notes: `Migrated entry: ${entry.batchNumber}`,
      });
    }

    // Get all existing closures
    const allClosures = await db
      .select({
        id: dailyClosures.id,
        productId: dailyClosures.productId,
        userId: dailyClosures.userId,
        initialStock: dailyClosures.initialStock,
        totalEntries: dailyClosures.totalEntries,
        physicalStock: dailyClosures.physicalStock,
        closureDate: dailyClosures.closureDate,
      })
      .from(dailyClosures)
      .orderBy(dailyClosures.closureDate);

    // Create movements for each closure adjustment
    for (const closure of allClosures) {
      const theoreticalStock = parseFloat(closure.initialStock) + parseFloat(closure.totalEntries);
      const adjustment = parseFloat(closure.physicalStock) - theoreticalStock;

      if (adjustment !== 0) {
        await db.insert(stockMovements).values({
          productId: closure.productId,
          userId: closure.userId,
          movementType: 'CLOSURE_ADJUSTMENT',
          quantity: adjustment.toString(),
          referenceId: closure.id,
          referenceType: 'CLOSURE',
          timestamp: new Date(closure.closureDate),
          notes: `Migrated closure adjustment: theoretical ${theoreticalStock} -> physical ${closure.physicalStock}`,
        });
      }
    }
  }

  async providerExists(providerId: number): Promise<boolean> {
    const result = await db
      .select({ id: providers.id })
      .from(providers)
      .where(eq(providers.id, providerId))
      .limit(1);

    return result.length > 0;
  }

  async productExists(productId: number): Promise<boolean> {
    const result = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    return result.length > 0;
  }
}
