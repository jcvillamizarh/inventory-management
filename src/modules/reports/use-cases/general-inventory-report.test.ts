import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the repositories
class MockProductRepository {
  private products: any[] = [
    {
      id: 1,
      name: 'Zumo de limón',
      category: 'MATERIA_PRIMA',
      type: 'PERECEDERO',
      unitBase: 'LITROS',
      stockMinimo: null,
      presentationQuantity: 2.0,
    },
    {
      id: 2,
      name: 'Harina de Trigo',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10.0,
      presentationQuantity: 1.0,
    },
  ];

  async findAll() {
    return this.products;
  }
}

class MockInventoryRepository {
  private closures: any[] = [
    {
      productId: 2,
      physicalStock: 50.0,
      closureDate: new Date('2024-01-01'),
      initialStock: 0.0,
      totalEntries: 0.0,
      calculatedConsumption: 0.0,
    },
  ];

  private entries: any[] = [
    {
      productId: 1,
      quantityUnits: 2.0,
      entryDate: new Date('2024-01-01'),
    },
    {
      productId: 2,
      quantityUnits: 0,
      entryDate: new Date('2024-01-01'),
    },
  ];

  async getLatestPhysicalStock(productId: number): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    // Check if there's a closure for today
    const todayClosure = this.closures.find(
      c => c.productId === productId && c.closureDate.toISOString().split('T')[0] === today
    );

    if (todayClosure) {
      return parseFloat(todayClosure.physicalStock);
    }

    // If no closure today, get latest closure and add entries since then
    const closure = this.closures.find(c => c.productId === productId);
    const baseStock = closure ? parseFloat(closure.physicalStock) : 0;
    const closureDate = closure ? closure.closureDate : null;

    // Sum entries since closure date
    const entriesTotal = this.entries
      .filter(e => e.productId === productId && (!closureDate || new Date(e.entryDate) >= new Date(closureDate)))
      .reduce((sum, e) => sum + parseFloat(e.quantityUnits), 0);

    return baseStock + entriesTotal;
  }

  async getLatestPhysicalStockForAllProducts(): Promise<Map<number, number>> {
    const stockMap = new Map<number, number>();

    // Simulate stock movements: entries are positive, closure adjustments are negative
    const movements: any[] = [];

    // Add entry movements
    for (const entry of this.entries) {
      movements.push({
        productId: entry.productId,
        quantity: parseFloat(entry.quantityUnits),
        timestamp: entry.entryDate,
        movementType: 'ENTRY',
      });
    }

    // Add closure adjustment movements
    for (const closure of this.closures) {
      const theoreticalStock = parseFloat(closure.initialStock) + parseFloat(closure.totalEntries);
      const adjustment = parseFloat(closure.physicalStock) - theoreticalStock;
      if (adjustment !== 0) {
        movements.push({
          productId: closure.productId,
          quantity: adjustment,
          timestamp: closure.closureDate,
          movementType: 'CLOSURE_ADJUSTMENT',
        });
      }
    }

    // Sort by timestamp
    movements.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Sum movements chronologically
    for (const movement of movements) {
      const currentStock = stockMap.get(movement.productId) || 0;
      const newStock = currentStock + movement.quantity;
      stockMap.set(movement.productId, newStock);
    }

    return stockMap;
  }

  async providerExists(providerId: number): Promise<boolean> {
    return true;
  }

  async productExists(productId: number): Promise<boolean> {
    return true;
  }
}

const mockProductRepo = new MockProductRepository();
const mockInventoryRepo = new MockInventoryRepository();

// Mock the repository imports
vi.mock('../../products/infrastructure/products.drizzle.js', () => ({
  DrizzleProductRepository: class {
    constructor() {
      return mockProductRepo;
    }
  },
}));

vi.mock('../../inventory/infrastructure/inventory.drizzle.js', () => ({
  DrizzleInventoryRepository: class {
    constructor() {
      return mockInventoryRepo;
    }
  },
}));

// Import after mock
import { GeneralInventoryReportUseCase } from './general-inventory-report.js';

describe('GeneralInventoryReportUseCase', () => {
  let useCase: GeneralInventoryReportUseCase;

  beforeEach(() => {
    useCase = new GeneralInventoryReportUseCase(mockProductRepo, mockInventoryRepo);
  });

  it('should calculate total net measure correctly (stock_units * presentation_quantity)', async () => {
    const result = await useCase.execute();

    const lemonProduct = result.find(p => p.name === 'Zumo de limón');
    expect(lemonProduct).toBeDefined();
    // Entry: 2.0, Closure adjustment: (2.0 - (0 + 2.0)) = 0.0, Total: 2.0
    expect(lemonProduct.stockUnidades).toBe(2.0);
    expect(lemonProduct.cantidadMedida).toBe(2.0);
    expect(lemonProduct.totalNetoMedida).toBe(4.0); // 2.0 * 2.0 = 4.0
  });

  it('should return all products with calculated inventory data', async () => {
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      category: expect.any(String),
      type: expect.any(String),
      unidadMedida: expect.any(String),
      cantidadMedida: expect.any(Number),
      stockUnidades: expect.any(Number),
      totalNetoMedida: expect.any(Number),
    });
  });

  it('should return 0 stock if no entries and no closure exist for product', async () => {
    // Create a fresh mock with no entries and no closure for product 2
    const freshMockRepo = new MockInventoryRepository();
    freshMockRepo['entries'] = [
      {
        productId: 1,
        quantityUnits: 5.0,
        entryDate: new Date('2024-01-01'),
      },
    ];
    freshMockRepo['closures'] = [
      {
        productId: 1,
        physicalStock: 2.0,
        closureDate: new Date('2024-01-01'),
      },
    ];

    const freshUseCase = new GeneralInventoryReportUseCase(mockProductRepo, freshMockRepo);
    const result = await freshUseCase.execute();

    const flourProduct = result.find((p: any) => p.name === 'Harina de Trigo');
    expect(flourProduct.stockUnidades).toBe(0);
    expect(flourProduct.totalNetoMedida).toBe(0);
  });

  it('should use closure value plus entries after closure (including same day)', async () => {
    // Create a fresh mock with entries before and after closure
    const freshMockRepo = new MockInventoryRepository();
    freshMockRepo['entries'] = [
      {
        productId: 1,
        quantityUnits: 10.0,
        entryDate: new Date('2024-01-01'), // Before closure
      },
      {
        productId: 1,
        quantityUnits: 10.0,
        entryDate: new Date('2024-01-10'), // Same day as closure
      },
    ];
    freshMockRepo['closures'] = [
      {
        productId: 1,
        physicalStock: 10.0,
        closureDate: new Date('2024-01-10'),
        initialStock: 10.0,
        totalEntries: 0.0,
        calculatedConsumption: 0.0,
      },
    ];

    const freshUseCase = new GeneralInventoryReportUseCase(mockProductRepo, freshMockRepo);
    const result = await freshUseCase.execute();

    const lemonProduct = result.find((p: any) => p.name === 'Zumo de limón');
    // Entry 1: 10.0, Closure adjustment: (10.0 - (10.0 + 0.0)) = 0.0, Entry 2: 10.0
    // Total: 10.0 + 0.0 + 10.0 = 20.0
    expect(lemonProduct.stockUnidades).toBe(20.0);
    expect(lemonProduct.totalNetoMedida).toBe(40.0); // 20.0 * 2.0
  });
});
