import { describe, it, expect } from 'vitest';
import { StockAlertsUseCase } from './stock-alerts.js';
import type { IReportsRepository, StockAlert } from '../reports.repository.js';

class MockReportsRepository implements IReportsRepository {
  private products: any[] = [];

  async getProductsBelowMinThreshold(): Promise<StockAlert[]> {
    return this.products.filter(
      (p) => p.type === 'SECO_NO_PERECEDERO' && p.currentStock <= p.stockMinimo
    );
  }

  async getFinancialReport(startDate: Date, endDate: Date): Promise<any[]> {
    return [];
  }

  setProducts(products: any[]) {
    this.products = products;
  }

  clear() {
    this.products = [];
  }
}

describe('StockAlertsUseCase', () => {
  it('should return only SECO_NO_PERECEDERO products below threshold', async () => {
    const mockRepo = new MockReportsRepository();
    mockRepo.setProducts([
      {
        productId: 1,
        productName: 'Harina de Trigo',
        type: 'SECO_NO_PERECEDERO',
        currentStock: 3,
        stockMinimo: 5,
        category: 'MATERIA_PRIMA',
        unitBase: 'KILOGRAMOS',
      },
      {
        productId: 2,
        productName: 'Carne de Res',
        type: 'PERECEDERO',
        currentStock: 2,
        stockMinimo: 5,
        category: 'MATERIA_PRIMA',
        unitBase: 'KILOGRAMOS',
      },
      {
        productId: 3,
        productName: 'Azúcar',
        type: 'SECO_NO_PERECEDERO',
        currentStock: 10,
        stockMinimo: 5,
        category: 'MATERIA_PRIMA',
        unitBase: 'KILOGRAMOS',
      },
    ]);

    const useCase = new StockAlertsUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result).toMatchObject({
      statusCode: 200,
      data: [
        {
          productId: 1,
          productName: 'Harina de Trigo',
          currentStock: 3,
          stockMinimo: 5,
        },
      ],
    });

    // Verify perishable product is NOT included
    expect(result.data).not.toContainEqual(
      expect.objectContaining({
        productName: 'Carne de Res',
      })
    );

    // Verify product above threshold is NOT included
    expect(result.data).not.toContainEqual(
      expect.objectContaining({
        productName: 'Azúcar',
      })
    );
  });

  it('should return empty array when no products are below threshold', async () => {
    const mockRepo = new MockReportsRepository();
    mockRepo.setProducts([
      {
        productId: 1,
        productName: 'Harina de Trigo',
        type: 'SECO_NO_PERECEDERO',
        currentStock: 10,
        stockMinimo: 5,
        category: 'MATERIA_PRIMA',
        unitBase: 'KILOGRAMOS',
      },
    ]);

    const useCase = new StockAlertsUseCase(mockRepo);
    const result = await useCase.execute();

    expect(result).toMatchObject({
      statusCode: 200,
      data: [],
    });
  });
});
