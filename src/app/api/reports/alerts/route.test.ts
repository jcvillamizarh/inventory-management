import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the DrizzleReportsRepository
class MockDrizzleReportsRepository {
  private alerts: any[] = [];

  async getProductsBelowMinThreshold(): Promise<any[]> {
    return this.alerts;
  }

  async getFinancialReport(startDate: Date, endDate: Date): Promise<any[]> {
    return [];
  }

  setAlerts(alerts: any[]) {
    this.alerts = alerts;
  }

  clear() {
    this.alerts = [];
  }
}

const mockRepo = new MockDrizzleReportsRepository();

// Mock the repository import
vi.mock('../../../../modules/reports/infrastructure/reports.drizzle.js', () => ({
  DrizzleReportsRepository: class {
    constructor() {
      return mockRepo;
    }
  },
}));

// Import after mock
import { GET } from './route.js';

describe('GET /api/reports/alerts', () => {
  beforeEach(() => {
    mockRepo.clear();
  });

  it('should return 200 and stock alerts', async () => {
    mockRepo.setAlerts([
      {
        productId: 1,
        productName: 'Harina de Trigo',
        currentStock: 3,
        stockMinimo: 5,
        category: 'MATERIA_PRIMA',
        unitBase: 'KILOGRAMOS',
      },
    ]);

    const request = new Request('http://localhost/api/reports/alerts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject([
      {
        productId: 1,
        productName: 'Harina de Trigo',
        currentStock: 3,
        stockMinimo: 5,
      },
    ]);
  });

  it('should return 200 and empty array when no alerts', async () => {
    mockRepo.setAlerts([]);

    const request = new Request('http://localhost/api/reports/alerts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });
});
