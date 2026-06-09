import type { IInventoryRepository } from '../inventory/inventory.repository.js';

export interface StockAlert {
  productId: number;
  productName: string;
  currentStock: number;
  stockMinimo: number;
  category: string;
  unitBase: string;
}

export interface IReportsRepository {
  getProductsBelowMinThreshold(inventoryRepository: IInventoryRepository): Promise<StockAlert[]>;
}
