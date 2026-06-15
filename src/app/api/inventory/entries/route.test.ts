import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRolePermission } from '../../../../lib/auth/middleware.js';

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock the DrizzleInventoryRepository
class MockDrizzleInventoryRepository {
  private entries: any[] = [];

  async saveEntry(entry: any) {
    const newEntry = {
      id: this.entries.length + 1,
      createdAt: new Date(),
      quantityUnits: typeof entry.quantityUnits === 'string' ? parseFloat(entry.quantityUnits) : entry.quantityUnits,
      ...entry,
    };
    this.entries.push(newEntry);
    return newEntry;
  }

  async getInitialStock(productId: number, date: Date): Promise<number> {
    return 0;
  }

  async getTotalEntriesForDay(productId: number, date: Date): Promise<number> {
    return 0;
  }

  async saveClosure(closure: any): Promise<any> {
    return { id: 1, ...closure };
  }

  async hasExistingClosure(productId: number, date: Date): Promise<boolean> {
    return false;
  }

  async getLatestPhysicalStock(productId: number): Promise<number> {
    return 0;
  }

  async getLatestPhysicalStockForAllProducts(): Promise<Map<number, number>> {
    return new Map();
  }

  async providerExists(providerId: number): Promise<boolean> {
    return true;
  }

  async productExists(productId: number): Promise<boolean> {
    return true;
  }

  clear() {
    this.entries = [];
  }
}

const mockRepo = new MockDrizzleInventoryRepository();

// Mock the repository import
vi.mock('../../../../modules/inventory/infrastructure/inventory.drizzle.js', () => ({
  DrizzleInventoryRepository: class {
    constructor() {
      return mockRepo;
    }
  },
}));

// Import after mock
import { POST } from './route.js';

describe('POST /api/inventory/entries', () => {
  beforeEach(() => {
    mockRepo.clear();
  });

  it('should return 201 and register entry with new fields', async () => {
    const request = new Request('http://localhost/api/inventory/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate: '2024-01-15',
        expirationDate: '2024-02-15',
        batchNumber: 'L1234',
        quantityUnits: 50,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: expect.any(Number),
      providerId: 1,
      productId: 1,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      entryDate: expect.any(String),
      expirationDate: expect.any(String),
      batchNumber: 'L1234',
      quantityUnits: 50,
    });
  });

  it('should return 400 when input data is invalid (negative quantity_units)', async () => {
    const request = new Request('http://localhost/api/inventory/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate: '2024-01-15',
        expirationDate: '2024-02-15',
        batchNumber: 'L1234',
        quantityUnits: -50,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Invalid input data',
    });
  });

  it('should return 400 when input data is invalid (zero quantity_units)', async () => {
    const request = new Request('http://localhost/api/inventory/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate: '2024-01-15',
        expirationDate: '2024-02-15',
        batchNumber: 'L1234',
        quantityUnits: 0,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Invalid input data',
    });
  });

  it('should return 400 when expiration_date is before entry_date', async () => {
    const request = new Request('http://localhost/api/inventory/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate: '2024-02-15',
        expirationDate: '2024-01-15',
        batchNumber: 'L1234',
        quantityUnits: 50,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Invalid input data',
    });
  });

  it('should return 201 and register entry with optional expiration_date and batch_number', async () => {
    const request = new Request('http://localhost/api/inventory/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate: '2024-01-15',
        expirationDate: null,
        batchNumber: null,
        quantityUnits: 50,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: expect.any(Number),
      providerId: 1,
      productId: 1,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      entryDate: expect.any(String),
      expirationDate: null,
      batchNumber: null,
      quantityUnits: 50,
    });
  });
});

describe('Role-based access control', () => {
  it('should allow CONSULTA role to access GET requests', () => {
    const canAccess = checkRolePermission('CONSULTA', 'GET', '/api/inventory/entries');
    expect(canAccess).toBe(true);
  });

  it('should deny CONSULTA role access to POST requests', () => {
    const canAccess = checkRolePermission('CONSULTA', 'POST', '/api/inventory/entries');
    expect(canAccess).toBe(false);
  });

  it('should deny CONSULTA role access to PUT requests', () => {
    const canAccess = checkRolePermission('CONSULTA', 'PUT', '/api/inventory/entries');
    expect(canAccess).toBe(false);
  });

  it('should allow ADMIN role to access POST requests', () => {
    const canAccess = checkRolePermission('ADMIN', 'POST', '/api/inventory/entries');
    expect(canAccess).toBe(true);
  });

  it('should allow OPERADOR role to access POST requests', () => {
    const canAccess = checkRolePermission('OPERADOR', 'POST', '/api/inventory/entries');
    expect(canAccess).toBe(true);
  });
});
