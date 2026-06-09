import { describe, it, expect } from 'vitest';
import { FinancialReportUseCase } from './financial-report.js';
import type { IReportsRepository, FinancialReportEntry } from '../reports.repository.js';

class MockReportsRepository implements IReportsRepository {
  private entries: FinancialReportEntry[] = [];

  async getProductsBelowMinThreshold(): Promise<any[]> {
    return [];
  }

  async getFinancialReport(startDate: Date, endDate: Date): Promise<FinancialReportEntry[]> {
    return this.entries.filter(
      (e) => e.entryDate >= startDate && e.entryDate <= endDate
    );
  }

  setEntries(entries: FinancialReportEntry[]) {
    this.entries = entries;
  }

  clear() {
    this.entries = [];
  }
}

describe('FinancialReportUseCase', () => {
  it('should return financial report filtered by date range', async () => {
    const mockRepo = new MockReportsRepository();
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    mockRepo.setEntries([
      {
        productId: 1,
        productName: 'Harina de Trigo',
        providerId: 1,
        providerName: 'Distribuidora El Triunfo',
        totalQuantity: 100,
        totalCost: 50000,
        entryDate: new Date('2026-01-15'),
      },
      {
        productId: 2,
        productName: 'Carne de Res',
        providerId: 2,
        providerName: 'Carnes Frescas',
        totalQuantity: 50,
        totalCost: 75000,
        entryDate: new Date('2026-02-15'),
      },
      {
        productId: 3,
        productName: 'Azúcar',
        providerId: 1,
        providerName: 'Distribuidora El Triunfo',
        totalQuantity: 200,
        totalCost: 30000,
        entryDate: new Date('2026-01-20'),
      },
    ]);

    const useCase = new FinancialReportUseCase(mockRepo);
    const result = await useCase.execute(startDate, endDate);

    expect(result).toMatchObject({
      statusCode: 200,
      data: [
        {
          productId: 1,
          productName: 'Harina de Trigo',
          totalQuantity: 100,
          totalCost: 50000,
        },
        {
          productId: 3,
          productName: 'Azúcar',
          totalQuantity: 200,
          totalCost: 30000,
        },
      ],
    });

    // Verify entry outside date range is NOT included
    expect(result.data).not.toContainEqual(
      expect.objectContaining({
        productName: 'Carne de Res',
      })
    );
  });

  it('should return empty array when no entries in date range', async () => {
    const mockRepo = new MockReportsRepository();
    const startDate = new Date('2026-03-01');
    const endDate = new Date('2026-03-31');

    mockRepo.setEntries([
      {
        productId: 1,
        productName: 'Harina de Trigo',
        providerId: 1,
        providerName: 'Distribuidora El Triunfo',
        totalQuantity: 100,
        totalCost: 50000,
        entryDate: new Date('2026-01-15'),
      },
    ]);

    const useCase = new FinancialReportUseCase(mockRepo);
    const result = await useCase.execute(startDate, endDate);

    expect(result).toMatchObject({
      statusCode: 200,
      data: [],
    });
  });
});
