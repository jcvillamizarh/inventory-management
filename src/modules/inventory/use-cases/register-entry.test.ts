import { describe, it, expect } from 'vitest';
import { RegisterMorningEntryUseCase } from './register-entry.js';
import type { IInventoryRepository, InventoryEntry, DailyClosure } from '../inventory.repository.js';

class MockInventoryRepository implements IInventoryRepository {
  private entries: InventoryEntry[] = [];

  async saveEntry(entry: Omit<InventoryEntry, 'id' | 'createdAt'>): Promise<InventoryEntry> {
    const newEntry: InventoryEntry = {
      id: this.entries.length + 1,
      createdAt: new Date(),
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

  async saveClosure(closure: Omit<DailyClosure, 'id'>): Promise<DailyClosure> {
    return {} as any;
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

describe('RegisterMorningEntryUseCase', () => {
  it('should successfully register entry with valid data', async () => {
    const mockRepo = new MockInventoryRepository();
    const useCase = new RegisterMorningEntryUseCase(mockRepo);

    const entryDate = new Date('2024-01-15');
    const expirationDate = new Date('2024-02-15');

    const result = await useCase.execute({
      providerId: 1,
      productId: 1,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      entryDate,
      expirationDate,
      batchNumber: 'L1234',
      quantityUnits: 50,
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        id: expect.any(Number),
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate: entryDate,
        expirationDate: expirationDate,
        batchNumber: 'L1234',
        quantityUnits: 50,
      },
    });
  });

  it('should fail with 400 for invalid input (negative quantity_units)', async () => {
    const mockRepo = new MockInventoryRepository();
    const useCase = new RegisterMorningEntryUseCase(mockRepo);

    const entryDate = new Date('2024-01-15');
    const expirationDate = new Date('2024-02-15');

    await expect(
      useCase.execute({
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate,
        expirationDate,
        batchNumber: 'L1234',
        quantityUnits: -50,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should fail with 400 for invalid input (zero quantity_units)', async () => {
    const mockRepo = new MockInventoryRepository();
    const useCase = new RegisterMorningEntryUseCase(mockRepo);

    const entryDate = new Date('2024-01-15');
    const expirationDate = new Date('2024-02-15');

    await expect(
      useCase.execute({
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate,
        expirationDate,
        batchNumber: 'L1234',
        quantityUnits: 0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should fail with 400 when expiration_date is before entry_date', async () => {
    const mockRepo = new MockInventoryRepository();
    const useCase = new RegisterMorningEntryUseCase(mockRepo);

    const entryDate = new Date('2024-02-15');
    const expirationDate = new Date('2024-01-15'); // Before entry date

    await expect(
      useCase.execute({
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate,
        expirationDate,
        batchNumber: 'L1234',
        quantityUnits: 50,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should successfully register entry with optional expiration_date and batch_number', async () => {
    const mockRepo = new MockInventoryRepository();
    const useCase = new RegisterMorningEntryUseCase(mockRepo);

    const entryDate = new Date('2024-01-15');

    const result = await useCase.execute({
      providerId: 1,
      productId: 1,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      entryDate,
      expirationDate: null,
      batchNumber: null,
      quantityUnits: 50,
    });

    expect(result).toMatchObject({
      statusCode: 201,
      data: {
        id: expect.any(Number),
        providerId: 1,
        productId: 1,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        entryDate: entryDate,
        expirationDate: null,
        batchNumber: null,
        quantityUnits: 50,
      },
    });
  });
});
