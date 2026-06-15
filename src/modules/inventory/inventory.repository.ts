export interface InventoryEntry {
  id: number;
  providerId: number;
  productId: number;
  userId: string;
  entryDate: Date;
  expirationDate: Date | null;
  batchNumber: string | null;
  quantityUnits: number;
  createdAt: Date;
}

export interface DailyClosure {
  id: number;
  productId: number;
  userId: string;
  closureDate: Date;
  initialStock: number;
  totalEntries: number;
  physicalStock: number;
  calculatedConsumption: number;
  notes?: string;
}

export interface IInventoryRepository {
  saveEntry(entry: Omit<InventoryEntry, 'id' | 'createdAt'>): Promise<InventoryEntry>;
  getInitialStock(productId: number, date: Date): Promise<number>;
  getTotalEntriesForDay(productId: number, date: Date): Promise<number>;
  saveClosure(closure: Omit<DailyClosure, 'id'>): Promise<DailyClosure>;
  hasExistingClosure(productId: number, date: Date): Promise<boolean>;
  getLatestPhysicalStock(productId: number): Promise<number>;
  getLatestPhysicalStockForAllProducts(): Promise<Map<number, number>>;
  providerExists(providerId: number): Promise<boolean>;
  productExists(productId: number): Promise<boolean>;
}
