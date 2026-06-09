import { db } from '../../../lib/db/index.js';
import { inventoryEntries, dailyClosures } from './inventory.schema.js';
import { providers, products } from '../../../lib/db/schema.js';
import { eq, and, gte, gt, lt, sum } from 'drizzle-orm';
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
        expirationDate: entry.expirationDate.toISOString().split('T')[0],
        batchNumber: entry.batchNumber,
        quantityUnits: entry.quantityUnits.toString(),
      })
      .returning();

    const savedEntry = result[0];
    return {
      id: savedEntry.id,
      providerId: savedEntry.providerId,
      productId: savedEntry.productId,
      userId: savedEntry.userId,
      entryDate: new Date(savedEntry.entryDate),
      expirationDate: new Date(savedEntry.expirationDate),
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
        initialStock: closure.initialStock.toString(),
        totalEntries: closure.totalEntries.toString(),
        physicalStock: closure.physicalStock.toString(),
        calculatedConsumption: closure.calculatedConsumption.toString(),
      })
      .returning();

    const savedClosure = result[0];
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
    const today = new Date().toISOString().split('T')[0];

    // Check if there's a closure for today
    const todayClosureResult = await db
      .select({ physicalStock: dailyClosures.physicalStock })
      .from(dailyClosures)
      .where(and(
        eq(dailyClosures.productId, productId),
        eq(dailyClosures.closureDate, today)
      ))
      .limit(1);

    if (todayClosureResult.length > 0) {
      // Return the physical stock from today's closure
      return parseFloat(todayClosureResult[0].physicalStock);
    }

    // If no closure today, get the latest closure and add entries since then
    const closureResult = await db
      .select({ physicalStock: dailyClosures.physicalStock, closureDate: dailyClosures.closureDate })
      .from(dailyClosures)
      .where(eq(dailyClosures.productId, productId))
      .orderBy(dailyClosures.closureDate)
      .limit(1);

    let baseStock = 0;
    let lastClosureDate = null;

    if (closureResult.length > 0) {
      baseStock = parseFloat(closureResult[0].physicalStock);
      lastClosureDate = closureResult[0].closureDate;
    }

    // Sum all inventory entries since the last closure (or all if no closure)
    const entriesResult = await db
      .select({ total: sum(inventoryEntries.quantityUnits) })
      .from(inventoryEntries)
      .where(
        lastClosureDate
          ? and(
              eq(inventoryEntries.productId, productId),
              gt(inventoryEntries.entryDate, lastClosureDate)
            )
          : eq(inventoryEntries.productId, productId)
      );

    const entriesTotal = entriesResult.length > 0 && entriesResult[0].total !== null
      ? parseFloat(entriesResult[0].total)
      : 0;

    return baseStock + entriesTotal;
  }

  async getLatestPhysicalStockForAllProducts(): Promise<Map<number, number>> {
    const today = new Date().toISOString().split('T')[0];
    const stockMap = new Map<number, number>();

    // Get all closures for today
    const todayClosures = await db
      .select({
        productId: dailyClosures.productId,
        physicalStock: dailyClosures.physicalStock,
      })
      .from(dailyClosures)
      .where(eq(dailyClosures.closureDate, today));

    // Map today's closures
    for (const closure of todayClosures) {
      stockMap.set(closure.productId, parseFloat(closure.physicalStock));
    }

    // Get all other closures (not today)
    const otherClosures = await db
      .select({
        productId: dailyClosures.productId,
        physicalStock: dailyClosures.physicalStock,
        closureDate: dailyClosures.closureDate,
      })
      .from(dailyClosures)
      .where(lt(dailyClosures.closureDate, today))
      .orderBy(dailyClosures.closureDate);

    // Get the latest closure for each product (not today)
    const latestClosures = new Map<number, { stock: number; date: string }>();
    for (const closure of otherClosures) {
      if (!latestClosures.has(closure.productId)) {
        latestClosures.set(closure.productId, {
          stock: parseFloat(closure.physicalStock),
          date: closure.closureDate,
        });
      }
    }

    // Get all inventory entries
    const allEntries = await db
      .select({
        productId: inventoryEntries.productId,
        quantityUnits: inventoryEntries.quantityUnits,
        entryDate: inventoryEntries.entryDate,
      })
      .from(inventoryEntries);

    // Calculate stock for products without today's closure
    for (const [productId, closure] of latestClosures) {
      if (!stockMap.has(productId)) {
        // Sum entries since the last closure
        const entriesSinceClosure = allEntries
          .filter(e => e.productId === productId && e.entryDate > closure.date)
          .reduce((sum, e) => sum + parseFloat(e.quantityUnits), 0);
        
        stockMap.set(productId, closure.stock + entriesSinceClosure);
      }
    }

    // For products with no closures at all, sum all entries
    const productIdsWithClosures = new Set([...stockMap.keys()]);
    const allProductIds = new Set(allEntries.map(e => e.productId));
    
    for (const productId of allProductIds) {
      if (!productIdsWithClosures.has(productId)) {
        const totalEntries = allEntries
          .filter(e => e.productId === productId)
          .reduce((sum, e) => sum + parseFloat(e.quantityUnits), 0);
        stockMap.set(productId, totalEntries);
      }
    }

    return stockMap;
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
