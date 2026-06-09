import { db } from '../../../lib/db/index.js';
import { products, inventoryEntries, providers, dailyClosures } from '../../../lib/db/schema.js';
import { eq, and, gte, lte, desc, lt } from 'drizzle-orm';
import type { IReportsRepository, StockAlert, FinancialReportEntry } from '../reports.repository.js';
import type { IInventoryRepository } from '../../inventory/inventory.repository.js';

export class DrizzleReportsRepository implements IReportsRepository {
  async getProductsBelowMinThreshold(inventoryRepository: IInventoryRepository): Promise<StockAlert[]> {
    // Get all products with their stock_minimo
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        type: products.type,
        stockMinimo: products.stockMinimo,
        category: products.category,
        unitBase: products.unitBase,
      })
      .from(products);

    // Get all stocks in a single batch call
    const stockMap = await inventoryRepository.getLatestPhysicalStockForAllProducts();

    // Filter for SECO_NO_PERECEDERO products below threshold
    const alerts: StockAlert[] = [];
    for (const product of allProducts) {
      if (product.type !== 'SECO_NO_PERECEDERO') {
        continue; // Skip perishable products
      }

      // Use the pre-calculated stock map
      const currentStock = stockMap.get(product.id) || 0;
      const stockMinimo = product.stockMinimo ? parseFloat(product.stockMinimo) : 0;

      if (currentStock <= stockMinimo) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock,
          stockMinimo,
          category: product.category,
          unitBase: product.unitBase,
        });
      }
    }

    return alerts;
  }
}
