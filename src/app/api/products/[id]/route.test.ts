import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the DrizzleProductRepository
class MockDrizzleProductRepository {
  private products: any[] = [
    {
      id: 1,
      name: 'Harina de Trigo',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 10.5,
      presentationQuantity: 2.0,
    },
  ];

  async findById(id: number) {
    return this.products.find(p => p.id === id) || null;
  }

  async findByName(name: string) {
    return this.products.find(p => p.name === name) || null;
  }

  async update(id: number, product: any) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    this.products[index] = { ...this.products[index], ...product };
    return this.products[index];
  }

  clear() {
    this.products = [
      {
        id: 1,
        name: 'Harina de Trigo',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10.5,
        presentationQuantity: 2.0,
      },
    ];
  }
}

const mockRepo = new MockDrizzleProductRepository();

// Mock the repository import
vi.mock('../../../../modules/products/infrastructure/products.drizzle.js', () => ({
  DrizzleProductRepository: class {
    constructor() {
      return mockRepo;
    }
  },
}));

// Import after mock
import { PUT } from './route.js';

describe('PUT /api/products/[id]', () => {
  beforeEach(() => {
    mockRepo.clear();
  });

  it('should return 200 and updated product', async () => {
    const request = new Request('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        name: 'Harina de Trigo Actualizada',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 15.0,
        presentationQuantity: 3.0,
      }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      id: 1,
      name: 'Harina de Trigo Actualizada',
      category: 'MATERIA_PRIMA',
      type: 'SECO_NO_PERECEDERO',
      unitBase: 'KILOGRAMOS',
      stockMinimo: 15.0,
      presentationQuantity: 3.0,
    });
  });

  it('should return 404 when product does not exist', async () => {
    const request = new Request('http://localhost/api/products/999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 999,
        name: 'Product Name',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10.5,
        presentationQuantity: 2.0,
      }),
    });

    const response = await PUT(request, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toMatchObject({
      error: 'Product not found',
    });
  });

  it('should return 400 when input data is invalid', async () => {
    const request = new Request('http://localhost/api/products/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        name: '',
        category: 'MATERIA_PRIMA',
        type: 'SECO_NO_PERECEDERO',
        unitBase: 'KILOGRAMOS',
        stockMinimo: 10.5,
        presentationQuantity: 2.0,
      }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Invalid input data',
    });
  });
});
