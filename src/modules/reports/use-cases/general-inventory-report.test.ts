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
      productId: 1,
      physicalStock: 2.0,
      closureDate: new Date('2024-01-01'),
    },
    {
      productId: 2,
      physicalStock: 50.0,
      closureDate: new Date('2024-01-01'),
    },
  ];

  private entries: any[] = [
    {
      productId: 1,
      quantityUnits: 0,
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
    expect(lemonProduct.stockUnidades).toBe(2.0);
    expect(lemonProduct.cantidadMedida).toBe(2.0);
    expect(lemonProduct.totalNetoMedida).toBe(4.0); // 2 units * 2 liters = 4 liters
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

  it('should return 0 stock if no closure exists for product', async () => {
    // Override mock to return no closure for product 2
    mockInventoryRepo.getLatestPhysicalStock = async () => 0;

    const result = await useCase.execute();

    const flourProduct = result.find((p: any) => p.name === 'Harina de Trigo');
    expect(flourProduct.stockUnidades).toBe(0);
    expect(flourProduct.totalNetoMedida).toBe(0);
  });

  it('should include inventory entries after last closure in stock calculation', async () => {
    // Create a fresh mock with entries after closure date
    const freshMockRepo = new MockInventoryRepository();
    freshMockRepo['entries'] = [
      {
        productId: 1,
        quantityUnits: 3.0,
        entryDate: new Date('2024-01-02'),
      },
      {
        productId: 2,
        quantityUnits: 0,
        entryDate: new Date('2024-01-01'),
      },
    ];

    const freshUseCase = new GeneralInventoryReportUseCase(mockProductRepo, freshMockRepo);
    const result = await freshUseCase.execute();

    const lemonProduct = result.find((p: any) => p.name === 'Zumo de limón');
    expect(lemonProduct.stockUnidades).toBe(5.0); // 2.0 from closure + 3.0 from new entry
    expect(lemonProduct.totalNetoMedida).toBe(10.0); // 5.0 * 2.0
  });

  it('should return physical stock from today closure if exists', async () => {
    // Create a fresh mock with a closure for today
    const today = new Date().toISOString().split('T')[0];
    const freshMockRepo = new MockInventoryRepository();
    freshMockRepo['closures'] = [
      {
        productId: 1,
        physicalStock: 50.0,
        closureDate: new Date(today),
      },
      {
        productId: 2,
        physicalStock: 50.0,
        closureDate: new Date('2024-01-01'),
      },
    ];

    const freshUseCase = new GeneralInventoryReportUseCase(mockProductRepo, freshMockRepo);
    const result = await freshUseCase.execute();

    const lemonProduct = result.find((p: any) => p.name === 'Zumo de limón');
    expect(lemonProduct.stockUnidades).toBe(50.0); // Should return today's closure stock, not sum with entries
    expect(lemonProduct.totalNetoMedida).toBe(100.0); // 50.0 * 2.0
  });
});
