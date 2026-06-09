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
      closureDate: new Date(),
    },
    {
      productId: 2,
      physicalStock: 50.0,
      closureDate: new Date(),
    },
  ];

  async getLatestPhysicalStock(productId: number): Promise<number> {
    const closure = this.closures.find(c => c.productId === productId);
    return closure ? parseFloat(closure.physicalStock) : 0;
  }

  async getLatestPhysicalStockForAllProducts(): Promise<Map<number, number>> {
    const stockMap = new Map<number, number>();
    for (const closure of this.closures) {
      stockMap.set(closure.productId, parseFloat(closure.physicalStock));
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
vi.mock('../../../../modules/products/infrastructure/products.drizzle.js', () => ({
  DrizzleProductRepository: class {
    constructor() {
      return mockProductRepo;
    }
  },
}));

vi.mock('../../../../modules/inventory/infrastructure/inventory.drizzle.js', () => ({
  DrizzleInventoryRepository: class {
    constructor() {
      return mockInventoryRepo;
    }
  },
}));

// Import after mock
import { GET } from './route.js';

describe('GET /api/reports/general-inventory', () => {
  it('should return 200 and calculated inventory data', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);

    const lemonProduct = data.find((p: any) => p.name === 'Zumo de limón');
    expect(lemonProduct).toBeDefined();
    expect(lemonProduct.stockUnidades).toBe(2.0);
    expect(lemonProduct.totalNetoMedida).toBe(4.0);
  });

  it('should return products with correct structure', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data[0]).toMatchObject({
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
});
