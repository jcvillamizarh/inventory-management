import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock the DrizzleInventoryRepository
class MockDrizzleInventoryRepository {
  private currentStockValue: number = 0;
  private hasExistingValue: boolean = false;

  async saveEntry(entry: any): Promise<any> {
    return { id: 1, ...entry };
  }

  async getInitialStock(productId: number, date: Date): Promise<number> {
    return this.currentStockValue;
  }

  async getTotalEntriesForDay(productId: number, date: Date): Promise<number> {
    return 0;
  }

  async saveClosure(closure: any): Promise<any> {
    return { id: 1, ...closure };
  }

  async hasExistingClosure(productId: number, date: Date): Promise<boolean> {
    return this.hasExistingValue;
  }

  async getLatestPhysicalStock(productId: number): Promise<number> {
    return this.currentStockValue;
  }

  async getLatestPhysicalStockForAllProducts(): Promise<Map<number, number>> {
    const map = new Map();
    map.set(1, this.currentStockValue);
    return map;
  }

  async providerExists(providerId: number): Promise<boolean> {
    return true;
  }

  async productExists(productId: number): Promise<boolean> {
    return true;
  }

  setCurrentStock(value: number) {
    this.currentStockValue = value;
  }

  setHasExisting(value: boolean) {
    this.hasExistingValue = value;
  }

  clear() {
    this.currentStockValue = 0;
    this.hasExistingValue = false;
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

describe('POST /api/inventory/closure', () => {
  beforeEach(() => {
    mockRepo.clear();
  });

  it('should return 200 and calculate consumption correctly', async () => {
    mockRepo.setCurrentStock(100); // Current stock = 100

    const request = new Request('http://localhost/api/inventory/closure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: 12,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      initialStock: 100,
      totalEntries: 0,
      physicalStock: 12,
      calculatedConsumption: 88.0,
    });
  });

  it('should return 422 when physical_stock exceeds current stock', async () => {
    mockRepo.setCurrentStock(50); // Current stock = 50

    const request = new Request('http://localhost/api/inventory/closure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: 60, // More than current (50)
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data).toMatchObject({
      error: 'Physical stock cannot exceed available stock',
    });
  });

  it('should return 400 for invalid input', async () => {
    mockRepo.setCurrentStock(10);

    const request = new Request('http://localhost/api/inventory/closure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: -5,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Invalid input data',
    });
  });

  it('should handle string numeric values correctly (string coercion bug)', async () => {
    mockRepo.setCurrentStock(76); // Current stock = 76

    const request = new Request('http://localhost/api/inventory/closure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: '75', // String value, less than current (76)
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      initialStock: 76,
      totalEntries: 0,
      physicalStock: 75,
      calculatedConsumption: 1.0,
    });
  });

  it('should allow multiple closures for the same product on the same day', async () => {
    mockRepo.setCurrentStock(100); // Current stock = 100

    // First closure
    const request1 = new Request('http://localhost/api/inventory/closure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: 75,
      }),
    });

    const response1 = await POST(request1);
    const data1 = await response1.json();

    expect(response1.status).toBe(200);
    expect(data1).toMatchObject({
      initialStock: 100,
      totalEntries: 0,
      physicalStock: 75,
      calculatedConsumption: 25.0,
    });

    // Update mock to reflect new stock after first closure
    mockRepo.setCurrentStock(75);

    // Second closure on the same day - should NOT return 409
    const request2 = new Request('http://localhost/api/inventory/closure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: 74,
      }),
    });

    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(response2.status).toBe(200);
    expect(data2).toMatchObject({
      initialStock: 75,
      totalEntries: 0,
      physicalStock: 74,
      calculatedConsumption: 1.0,
    });
  });
});
