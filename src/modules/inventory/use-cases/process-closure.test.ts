import { describe, it, expect } from 'vitest';
import { ProcessDailyClosureUseCase } from './process-closure.js';
import type { IInventoryRepository } from '../inventory.repository.js';

class MockInventoryRepository implements IInventoryRepository {
  private closures: any[] = [];
  private initialStockValue: number = 0;
  private totalEntriesValue: number = 0;
  private hasExistingValue: boolean = false;

  async saveEntry(entry: any): Promise<any> {
    return { id: 1, ...entry };
  }

  async getInitialStock(productId: number, date: Date): Promise<number> {
    return this.initialStockValue;
  }

  async getTotalEntriesForDay(productId: number, date: Date): Promise<number> {
    return this.totalEntriesValue;
  }

  async saveClosure(closure: any): Promise<any> {
    const newClosure = {
      id: this.closures.length + 1,
      ...closure,
    };
    this.closures.push(newClosure);
    return newClosure;
  }

  async hasExistingClosure(productId: number, date: Date): Promise<boolean> {
    return this.hasExistingValue;
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

  setInitialStock(value: number) {
    this.initialStockValue = value;
  }

  setTotalEntries(value: number) {
    this.totalEntriesValue = value;
  }

  setHasExisting(value: boolean) {
    this.hasExistingValue = value;
  }

  clear() {
    this.closures = [];
    this.initialStockValue = 0;
    this.totalEntriesValue = 0;
    this.hasExistingValue = false;
  }
}

describe('ProcessDailyClosureUseCase', () => {
  it('should calculate consumption correctly: (initial_stock + total_entries) - physical_stock', async () => {
    const mockRepo = new MockInventoryRepository();
    mockRepo.setInitialStock(10);
    mockRepo.setTotalEntries(90);
    const useCase = new ProcessDailyClosureUseCase(mockRepo);

    const result = await useCase.execute({
      productId: 1,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      physicalStock: 12,
    });

    expect(result).toMatchObject({
      statusCode: 200,
      data: {
        initialStock: 10,
        totalEntries: 90,
        physicalStock: 12,
        calculatedConsumption: 88.0,
      },
    });
  });

  it('should fail with 422 when physical_stock exceeds available stock (logical inconsistency)', async () => {
    const mockRepo = new MockInventoryRepository();
    mockRepo.setInitialStock(10);
    mockRepo.setTotalEntries(40); // Total available = 50
    const useCase = new ProcessDailyClosureUseCase(mockRepo);

    await expect(
      useCase.execute({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: 60, // More than available (50)
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      message: 'Physical stock cannot exceed available stock',
    });
  });

  it('should fail with 409 when closure already exists for product on current date', async () => {
    const mockRepo = new MockInventoryRepository();
    mockRepo.setInitialStock(10);
    mockRepo.setTotalEntries(90);
    mockRepo.setHasExisting(true);
    const useCase = new ProcessDailyClosureUseCase(mockRepo);

    await expect(
      useCase.execute({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: 12,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Closure already exists for this product on this date',
    });
  });

  it('should fail with 400 for invalid input (negative physical_stock)', async () => {
    const mockRepo = new MockInventoryRepository();
    mockRepo.setInitialStock(10);
    mockRepo.setTotalEntries(90);
    const useCase = new ProcessDailyClosureUseCase(mockRepo);

    await expect(
      useCase.execute({
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        physicalStock: -5,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should handle string input for physicalStock (HTML form sends strings)', async () => {
    const mockRepo = new MockInventoryRepository();
    mockRepo.setInitialStock(10);
    mockRepo.setTotalEntries(90);
    const useCase = new ProcessDailyClosureUseCase(mockRepo);

    const result = await useCase.execute({
      productId: 1,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      physicalStock: '38' as any, // Simulating HTML input sending string
    });

    expect(result).toMatchObject({
      statusCode: 200,
      data: {
        physicalStock: 38,
        calculatedConsumption: 62.0,
      },
    });
  });
});
